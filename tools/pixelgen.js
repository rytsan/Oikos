// tools/pixelgen.js — gerador do sprite pixel da amostra (arquétipo Era 0).
//
// Por que gerador e não desenho à mão: densidade 16-bit é trabalho POR PIXEL —
// gradiente dentro de cada superfície, textura de material, dither nas
// transições, luz do fogo, oclusão no contato. Escrever isso como polígono dá
// desenho chapado; escrever como código dá o sprite denso e, de quebra, as
// mesmas regras servem ao render canvas do jogo (S3).
//
// Saída: substitui o <svg class="px"> de docs/exemplos.html por um SVG de
// grade inteira, um <path> por cor, no estilo dos ICONES do index.html.
//
// Uso: node tools/pixelgen.js

'use strict';
const fs = require('fs');
const path = require('path');

const W = 96, H = 80;                 // grade nativa; exibida a x3
const ALVO = path.join(__dirname, '..', 'docs', 'exemplos.html');

/* ---------------- paleta: rampas ancoradas no index.html do jogo ---------- */

function hex2rgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function rgb2hex(c) {
  return '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
// Interpola as âncoras do jogo até n tons. Não inventa cor: só preenche o
// intervalo entre duas cores que já existem no index.html.
function rampa(ancoras, n) {
  const p = ancoras.map(hex2rgb), out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * (p.length - 1);
    const a = Math.min(p.length - 2, Math.floor(t)), f = t - a;
    out.push(rgb2hex([0, 1, 2].map(k => p[a][k] + (p[a + 1][k] - p[a][k]) * f)));
  }
  return out;
}

const R = {
  terra:  rampa(['#2c2718', '#403a31', '#5a5245', '#6d6152', '#8e855e'], 7),
  madeira:rampa(['#3a2f22', '#574d41', '#6d5638', '#8a6a42', '#b48b58'], 7),
  couro:  rampa(['#3d3325', '#5d4f38', '#7d6a4a', '#a08a62', '#cbbf87'], 7),
  pedra:  rampa(['#4a4741', '#585349', '#6e6960', '#8b857d', '#9c968c'], 6),
  verde:  rampa(['#243f1f', '#355a2b', '#6d7a3a', '#93a352'], 5),
  fogo:   rampa(['#b4553a', '#d2a24c', '#f0cf86'], 4)
};

/* ---------------- buffer e utilidades de grade ---------------------------- */

const buf = new Array(W * H).fill(null);
const por = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? buf[y * W + x] : null;
const põe = (x, y, cor) => { if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = cor; };

// Bayer 4x4: o dither ordenado que faz a transição entre dois tons virar
// gradiente em vez de faixa dura. É a técnica da época, não um efeito.
const BAYER = [
  [0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]
];
const bayer = (x, y) => (BAYER[y & 3][x & 3] + 0.5) / 16;

// Escolhe o tom da rampa a partir de um valor contínuo.
//
// O dither entra SÓ na faixa de transição entre dois tons; no miolo de cada tom
// o campo fica chapado. É essa diferença que separa sombreamento de chuvisco:
// a trama aparece na fronteira, não espalhada pela superfície inteira.
function tom(ramp, v, x, y) {
  const base = Math.floor(v), f = v - base;
  let i = base;
  if (f >= 0.66) i = base + 1;
  else if (f > 0.38) i = base + (bayer(x, y) < (f - 0.38) / 0.28 ? 1 : 0);
  return ramp[Math.max(0, Math.min(ramp.length - 1, i))];
}

// hash determinístico por pixel — textura sem Math.random (regra do projeto)
function h2(x, y, s) {
  let n = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  n = (n ^ (n >> 13)) * 1274126177 | 0;
  return ((n ^ (n >> 16)) >>> 0) / 4294967296;
}

/* ---------------- rasterização de faces ---------------------------------- */

// Varredura por linha de um polígono convexo, chamando sombra(x,y,u,v) onde
// u,v são as coordenadas dentro da face (para textura de material).
function face(pts, uv, sombra) {
  let ymin = Math.min(...pts.map(p => p[1])), ymax = Math.max(...pts.map(p => p[1]));
  for (let y = Math.max(0, ymin); y <= Math.min(H - 1, ymax); y++) {
    let xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      } else if (a[1] === y && b[1] === y) { xs.push(a[0], b[0]); }
    }
    if (!xs.length) continue;
    const x0 = Math.ceil(Math.min(...xs)), x1 = Math.floor(Math.max(...xs));
    for (let x = x0; x <= x1; x++) {
      const [u, v] = uv ? uv(x, y) : [0, 0];
      const c = sombra(x, y, u, v);
      if (c) põe(x, y, c);
    }
  }
}

// Mapa afim inverso para paralelogramo A + u(B-A) + v(D-A)
function uvParalelogramo(A, B, D) {
  const e1 = [B[0] - A[0], B[1] - A[1]], e2 = [D[0] - A[0], D[1] - A[1]];
  const det = e1[0] * e2[1] - e1[1] * e2[0];
  return (x, y) => {
    const px = x - A[0], py = y - A[1];
    return [(px * e2[1] - py * e2[0]) / det, (e1[0] * py - e1[1] * px) / det];
  };
}
function uvTriangulo(A, B, C) {
  const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
  return (x, y) => {
    const a = ((B[1] - C[1]) * (x - C[0]) + (C[0] - B[0]) * (y - C[1])) / d;
    const b = ((C[1] - A[1]) * (x - C[0]) + (A[0] - C[0]) * (y - C[1])) / d;
    return [a, b];
  };
}

/* ---------------- geometria: tudo em coordenada inteira, declive 2:1 ------ */

const CX = 48;
const TILE = { cx: CX, cy: 56, hw: 32, hh: 16 };            // 64x32 — o tile do jogo
// Proporção: parede alta, telhado contido. O telhado antes tomava metade do
// sprite e a silhueta virava losango — cabana é caixa com chapéu, não pastilha.
const BASE = { cx: CX, cy: 52, hw: 20, hh: 10 };            // planta da cabana
const ALT = 22;                                             // altura das paredes
const TOPO = { cx: CX, cy: BASE.cy - ALT, hw: 20, hh: 10 };
const BEIRAL = { cx: CX, cy: 30, hw: 24, hh: 12 };          // beiral: 4 px de aba
const APICE = [CX, 6];                                      // 24 de corrida por 24 de queda = 1:1
const FOGO = [38, 58];                                      // foco da fogueira

const losango = (d) => [[d.cx - d.hw, d.cy], [d.cx, d.cy - d.hh], [d.cx + d.hw, d.cy], [d.cx, d.cy + d.hh]];

/* ---------------- 1. chão: terra com textura e touceiras ----------------- */

face(losango(TILE), null, (x, y) => {
  // Patamares chapados, não rampa contínua: um gradiente liso do centro à
  // borda joga a superfície inteira dentro da faixa de dither e o chão vira
  // chuvisco. Dois degraus com transição estreita é o que a época fazia.
  const r = Math.abs(x - TILE.cx) / TILE.hw + Math.abs(y - TILE.cy) / TILE.hh;
  const d = r > 1.30 ? 1.45 : r > 0.80 ? 0.55 : 0;
  // Grão por BLOCO, nunca por pixel: ruído de frequência 1 px vira sal e
  // pimenta, que o olho lê como chuvisco. Textura 16-bit se agrupa.
  const grão = h2(x >> 1, y >> 1, 3) * 0.30 + h2(x >> 2, y >> 2, 7) * 0.26;
  // mais claro no centro do tile, escurecendo para a borda: volume do terreno
  return tom(R.terra, 2.6 + grão - d * 0.7, x, y);
});
// touceiras de capim: pixels soltos, nunca forma fechada
for (let y = TILE.cy - TILE.hh; y < TILE.cy + TILE.hh; y++) {
  for (let x = TILE.cx - TILE.hw; x < TILE.cx + TILE.hw; x++) {
    if (!por(x, y)) continue;
    const n = h2(x, y, 21);
    if (n > 0.955) { põe(x, y, R.verde[1 + (n > 0.985 ? 1 : 0)]); põe(x, y - 1, R.verde[2]); }
  }
}
// espessura do tile: duas linhas de terra escura na borda inferior
face([[TILE.cx - TILE.hw, TILE.cy], [TILE.cx, TILE.cy + TILE.hh], [TILE.cx, TILE.cy + TILE.hh + 2], [TILE.cx - TILE.hw, TILE.cy + 2]],
  null, (x, y) => tom(R.terra, 1.2 + h2(x, y, 5) * 0.5, x, y));
face([[TILE.cx + TILE.hw, TILE.cy], [TILE.cx, TILE.cy + TILE.hh], [TILE.cx, TILE.cy + TILE.hh + 2], [TILE.cx + TILE.hw, TILE.cy + 2]],
  null, (x, y) => tom(R.terra, 0.5 + h2(x, y, 9) * 0.4, x, y));

/* ---------------- 2. sombra projetada, por dither e com penumbra --------- */

face(losango({ cx: CX + 3, cy: BASE.cy + 1, hw: 26, hh: 13 }), null, (x, y) => {
  const c = por(x, y); if (!c) return null;
  const d = Math.abs(x - CX - 3) / 26 + Math.abs(y - BASE.cy - 1) / 13;
  const força = 2.2 * (1 - d);                       // penumbra: some na borda
  const i = R.terra.indexOf(c);
  if (i < 0) return null;
  return tom(R.terra, i - força, x, y);
});

/* ---------------- 3. paredes de tronco ------------------------------------ */

// Cada fiada é um cilindro: sombra embaixo, corpo, luz em cima. É essa leitura
// por fiada que dá a densidade que o polígono chapado não tem.
function paredeTronco(A, B, base, luzFogo) {
  const D = [A[0], A[1] + ALT];
  const uv = uvParalelogramo(A, B, D);
  face([A, B, [B[0], B[1] + ALT], D], uv, (x, y, u, v) => {
    if (u < -0.01 || u > 1.01 || v < -0.01 || v > 1.01) return null;
    const alturaMundo = v * ALT;
    const fase = (alturaMundo % 4) / 4;              // fiada de 4 px
    let t = base;
    t += fase < 0.22 ? 1.15 : fase > 0.80 ? -1.25 : 0;   // luz no topo, sombra na junta
    t += (h2(x >> 1, y >> 1, 33) - 0.5) * 0.30;           // veio da madeira, por bloco
    t -= Math.max(0, v - 0.72) * 2.4;                     // oclusão junto ao chão
    t -= Math.max(0, 0.18 - u) * 2.0;                     // canto interno mais escuro
    if (luzFogo) {
      const d = Math.hypot(x - FOGO[0], y - FOGO[1]);
      t += Math.max(0, 1 - d / 22) * 2.1;                 // luz quente da fogueira
    }
    return tom(R.madeira, t, x, y);
  });
}
paredeTronco([BASE.cx - BASE.hw, TOPO.cy], [CX, TOPO.cy + BASE.hh], 3.6, true);   // face iluminada
paredeTronco([BASE.cx + BASE.hw, TOPO.cy], [CX, TOPO.cy + BASE.hh], 1.7, false);  // face na sombra

// pontas de tora salientes nas quinas — silhueta irregular, não reta
for (let k = 0; k < 5; k++) {
  const y = TOPO.cy + 3 + k * 4;
  const saliência = 2 + (h2(k, 1, 11) > 0.5 ? 1 : 0);
  for (let i = 0; i < saliência; i++) {
    põe(BASE.cx - BASE.hw - 1 - i, y + Math.floor(i / 2), R.madeira[4]);
    põe(BASE.cx - BASE.hw - 1 - i, y + 1 + Math.floor(i / 2), R.madeira[2]);
    põe(BASE.cx + BASE.hw + 1 + i, y + Math.floor(i / 2), R.madeira[1]);
  }
}

/* ---------------- 4. porta: vão fundo, com batente e brasa lá dentro ----- */

face([[36, 50], [46, 55], [46, 66], [36, 61]], null, (x, y) => {
  const d = Math.hypot(x - FOGO[0], y - FOGO[1]);
  if (d < 7) return tom(R.fogo, 0.4 + Math.max(0, 1 - d / 7) * 2.2, x, y);  // brasa
  return tom(R.madeira, 0.15 + h2(x, y, 44) * 0.3, x, y);                   // escuro do vão
});
for (let i = 0; i <= 10; i++) {                     // batente de tronco em volta
  põe(35, 50 + Math.floor(i / 2) + i % 2, R.madeira[3]);
}

/* ---------------- 5. telhado de couro ------------------------------------- */

// Duas águas em 1:1 (28 px de corrida por 28 de queda). O couro não é liso:
// costura, remendo e barriga entre as estacas.
function agua(borda, base, espelha) {
  const uv = uvTriangulo(APICE, borda, [CX, BEIRAL.cy + BEIRAL.hh]);
  face([APICE, borda, [CX, BEIRAL.cy + BEIRAL.hh]], uv, (x, y, a, b) => {
    if (a < -0.01 || b < -0.01 || a + b > 1.01) return null;
    let t = base;
    const s = espelha ? 1 - a : a;
    t += Math.sin(s * Math.PI * 3.1) * 0.35;          // barriga do couro entre estacas
    t += (h2(x >> 1, y >> 1, 57) - 0.5) * 0.32;       // grão da pele, por bloco
    const costura = (Math.floor(s * 7) !== Math.floor((s - 0.012) * 7));
    if (costura) t -= 1.6;                            // costura, mais escura
    t -= Math.max(0, b - 0.82) * 3.0;                 // sombra sob o beiral
    t += Math.max(0, 0.86 - b) * 0.0;
    if (h2(x >> 2, y >> 2, 71) > 0.93) t -= 1.1;      // remendo
    return tom(R.couro, t, x, y);
  });
}
agua([CX - BEIRAL.hw, BEIRAL.cy], 4.3, false);        // água iluminada
agua([CX + BEIRAL.hw, BEIRAL.cy], 2.2, true);         // água na sombra

// beiral: 2 px de espessura, o corte do couro visto de baixo
for (let i = 0; i <= BEIRAL.hw; i++) {
  const y = BEIRAL.cy + Math.floor(i / 2);
  for (let k = 0; k < 2; k++) {
    põe(CX - BEIRAL.hw + i, y + k, R.couro[k ? 0 : 1]);
    põe(CX + BEIRAL.hw - i, y + k, R.couro[0]);
  }
}
// quina frontal: 1 px de luz define o volume
for (let y = APICE[1]; y <= BEIRAL.cy + BEIRAL.hh; y++) põe(CX, y, R.couro[5]);

// estacas cruzadas no cume, com ponta irregular
for (let i = 0; i < 9; i++) {
  põe(CX - 4 + Math.floor(i / 3), APICE[1] - 2 + i, R.madeira[1]);
  põe(CX + 4 - Math.floor(i / 3), APICE[1] - 2 + i, R.madeira[2]);
}

/* ---------------- 6. anti-serrilhado à mão na silhueta ------------------- */

// Onde a escada de 2:1 vira o degrau, um pixel de tom intermediário suaviza
// sem borrar — é o que o vetor faz com antialias e o pixel art faz à mão.
const copia = buf.slice();
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    if (copia[y * W + x]) continue;
    const viz = [copia[y * W + x - 1], copia[y * W + x + 1], copia[(y - 1) * W + x], copia[(y + 1) * W + x]].filter(Boolean);
    if (viz.length < 3) continue;                     // só em quina côncava
    const alvo = viz[0];
    for (const nome of ['couro', 'madeira', 'terra']) {
      const i = R[nome].indexOf(alvo);
      if (i > 0) { põe(x, y, R[nome][Math.max(0, i - 1)]); break; }
    }
  }
}

/* ---------------- 7. emissão: um <path> por cor, no estilo dos ICONES ---- */

function emitir() {
  const porCor = new Map();
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      const c = buf[y * W + x];
      if (!c) { x++; continue; }
      let n = 1;
      while (x + n < W && buf[y * W + x + n] === c) n++;
      if (!porCor.has(c)) porCor.set(c, []);
      porCor.get(c).push(`M${x} ${y}h${n}v1h-${n}z`);
      x += n;
    }
  }
  const paths = [...porCor.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([c, d]) => `          <path fill="${c}" d="${d.join('')}"/>`);
  return { paths, cores: porCor.size, corridas: [...porCor.values()].reduce((s, v) => s + v.length, 0) };
}

const { paths, cores, corridas } = emitir();

const svg = [
  `        <svg class="px" width="288" height="240" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">`,
  `          <!-- gerado por tools/pixelgen.js — nao editar a mao -->`,
  ...paths,
  `          <!-- chama: 3 quadros desenhados, trocados por steps() -->`,
  `          <g class="px-f1"><path fill="${R.fogo[1]}" d="M37 55h2v3h-2zM36 57h4v2h-4z"/><path fill="${R.fogo[3]}" d="M37 54h1v2h-1z"/></g>`,
  `          <g class="px-f2"><path fill="${R.fogo[1]}" d="M37 54h2v4h-2zM36 57h4v2h-4z"/><path fill="${R.fogo[3]}" d="M38 53h1v2h-1z"/></g>`,
  `          <g class="px-f3"><path fill="${R.fogo[1]}" d="M37 56h2v2h-2zM36 57h4v2h-4z"/><path fill="${R.fogo[3]}" d="M37 55h1v1h-1z"/></g>`,
  `          <!-- fumaca: 4 quadros subindo e afinando -->`,
  `          <g class="px-s1"><path fill="${R.terra[4]}" d="M51 4h3v1h-3z"/></g>`,
  `          <g class="px-s2"><path fill="${R.terra[4]}" d="M51 2h3v1h-3z"/><path fill="${R.terra[5]}" d="M54 1h2v1h-2z"/></g>`,
  `          <g class="px-s3"><path fill="${R.terra[4]}" d="M53 1h3v1h-3z"/><path fill="${R.terra[5]}" d="M56 0h2v1h-2z"/></g>`,
  `          <g class="px-s4"><path fill="${R.terra[5]}" d="M56 0h2v1h-2z"/></g>`,
  `        </svg>`
].join('\n');

/* ---------------- 8. injeção no caderno ---------------------------------- */

const html = fs.readFileSync(ALVO, 'utf8');
const ini = html.indexOf('        <svg class="px"');
if (ini < 0) { console.error('marcador <svg class="px"> nao encontrado'); process.exit(1); }
const fim = html.indexOf('</svg>', ini) + '</svg>'.length;
fs.writeFileSync(ALVO, html.slice(0, ini) + svg + html.slice(fim));

console.log('sprite', W + 'x' + H, '| cores usadas:', cores, '| corridas de pixel:', corridas);
console.log('pixels pintados:', buf.filter(Boolean).length, 'de', W * H);
console.log('injetado em docs/exemplos.html');
