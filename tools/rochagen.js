// tools/rochagen.js — folha de prova de ESCALA e DENSIDADE.
//
// O que as tres referencias (AoE II, SimCity, arte do Mana) tem em comum, e
// que o caderno nao tem:
//   1. nenhuma superficie e preenchimento chapado — tudo tem textura de alta
//      frequencia (pontilhado, estrato, cascalho, tufo);
//   2. silhueta IRREGULAR — poliedro convexo de 3 faces le como gema, nao
//      como rocha;
//   3. hierarquia de tamanho — na AoE o aldeao cabe ~4x na altura da arvore.
//      No caderno, pedregulho e montanha ocupam o mesmo card de 120x110.
//
// Esta folha desenha tudo sobre A MESMA grade de tiles do jogo (64x32), a 1:1,
// com uma regua humana de 0,5 x 1,2 tile. Tamanhos em tile:
//   regua humana 0,5 · pedregulho 0,4 · veio mineral 0,8 · escarpa 3 · pico 5
//
// Uso: node tools/rochagen.js

'use strict';
const fs = require('fs');
const path = require('path');

// Largura para o macico de 5x5 (320 px) caber depois da escarpa, e altura para
// a pegada de 5 tiles, que desce 5*16 = 80 px abaixo da fileira y=205.
const W = 736, H = 300, TW = 64, TH = 32;
const ALVO = path.join(__dirname, '..', 'docs', 'exemplos.html');

/* ---------------- paleta: rampas ancoradas no index.html ------------------ */

const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
function rampa(anc, n) {
  const p = anc.map(hx), o = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * (p.length - 1), a = Math.min(p.length - 2, Math.floor(t)), f = t - a;
    o.push(rgb([0, 1, 2].map(k => p[a][k] + (p[a + 1][k] - p[a][k]) * f)));
  }
  return o;
}
const R = {
  pedra: rampa(['#302e2a', '#4a4741', '#585349', '#6e6960', '#8b857d', '#9c968c', '#b9b3a8'], 9),
  terra: rampa(['#2c2718', '#403a31', '#5a5245', '#6d6152', '#8e855e'], 7),
  verde: rampa(['#1b3016', '#243f1f', '#355a2b', '#6d7a3a', '#93a352'], 6),
  neve:  rampa(['#6e6960', '#9c968c', '#c6c0b2', '#d8d0b4', '#e8e2d4'], 6),
  minerio: rampa(['#5a2a18', '#8a3f22', '#b4553a', '#c87f3a', '#f0cf86'], 6),
  // Pano e pele da regua humana: faixa de valor larga, para a figura saltar
  // do verde medio do campo em vez de se dissolver nele.
  pano: rampa(['#2c2718', '#4a452f', '#8e855e', '#cbbf87', '#e8e2d4'], 6)
};

/* ---------------- grade ---------------------------------------------------- */

const buf = new Array(W * H).fill(null);
const põe = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = c; };
const por = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? buf[y * W + x] : null;

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const bayer = (x, y) => (BAYER[y & 3][x & 3] + 0.5) / 16;

// Dither so na fronteira entre dois tons; miolo chapado.
function tom(r, v, x, y) {
  const b = Math.floor(v), f = v - b;
  let i = b;
  if (f >= 0.66) i = b + 1;
  else if (f > 0.38) i = b + (bayer(x, y) < (f - 0.38) / 0.28 ? 1 : 0);
  return r[Math.max(0, Math.min(r.length - 1, i))];
}
function h2(x, y, s) {
  let n = (x * 374761393 + y * 668265263 + (s | 0) * 2147483647) | 0;
  n = (n ^ (n >> 13)) * 1274126177 | 0;
  return ((n ^ (n >> 16)) >>> 0) / 4294967296;
}
// ruido suave 1D por interpolacao de hash — serve de cumeeira e de estrato
function ruido1(x, esc, s) {
  const p = x / esc, i = Math.floor(p), f = p - i;
  const a = h2(i, s, 1), b = h2(i + 1, s, 1);
  const t = f * f * (3 - 2 * f);
  return a + (b - a) * t;
}

// Preenche poligono por varredura, chamando sombra(x,y)
function poli(pts, sombra) {
  const ys = pts.map(p => p[1]);
  for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(H - 1, Math.ceil(Math.max(...ys))); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) {
        const c = sombra(x, y); if (c) põe(x, y, c);
      }
    }
  }
}

/* ---------------- 1. o chao: a grade de tiles, que e a regua --------------- */

// Origem escolhida para que a FILEIRA i+j=8 caia em y=205 e os centros de tile
// dessa fileira caiam em x = 46 + 64k. Todo objeto e posicionado por (i,j) a
// partir daqui — nenhum recebe coordenada em pixel.
const OX = 46, OY = 77;
const px = (i, j) => OX + (i - j) * (TW / 2);
const py = (i, j) => OY + (i + j) * (TH / 2);

// Faixa larga com recorte pelo canvas, em vez de limites calculados a mao: foi
// um limite chutado (i,j em [-2,12]) que fez o campo parar em x=488 e deixou a
// escarpa e o pico inteiro flutuando no vazio. Varrer de sobra custa nada e
// nao volta a errar quando OX, OY ou a altura mudarem.
for (let i = -25; i <= 25; i++) {
  for (let j = -25; j <= 25; j++) {
    const cx = px(i, j), cy = py(i, j);
    if (cx < -TW || cx > W + TW || cy < -TH || cy > H + TH) continue;
    poli([[cx - TW / 2, cy], [cx, cy - TH / 2], [cx + TW / 2, cy], [cx, cy + TH / 2]], (x, y) => {
      // relva com textura por bloco; tufos escuros esparsos
      // Textura em MANCHA, nao em pixel. Ruido por pixel vira chuvisco e engole
      // o objeto; campo chapado vira 80% de uma cor so. O meio e mancha larga
      // de tom, terra batida e tufo esparso — o que a relva da AoE faz.
      let t = 1.95
        + ruido1(x * 0.6 + y, 46, 3) * 1.15                     // manchas largas
        + ruido1(x + y * 0.7, 13, 7) * 0.45                     // variacao media
        + (h2(x >> 2, y >> 2, 11) - 0.5) * 0.28;                // granulacao por bloco
      if (h2(x >> 1, y >> 1, 17) > 0.955) t += 1.1;             // tufo
      if (ruido1(x * 0.5 + y * 1.3, 31, 21) > 0.80) t -= 0.9;   // terra batida
      return tom(R.verde, t, x, y);
    });
    // aresta do tile: 1 px mais escuro, e o que torna a regua VISIVEL
    for (let k = 0; k <= TW / 2; k++) {
      põe(cx - TW / 2 + k, cy - k / 2, R.verde[1]);
      põe(cx + TW / 2 - k, cy - k / 2, R.verde[1]);
    }
  }
}

/* ---------------- ferramentas de rocha ------------------------------------ */

// Sombra de contato: trama, e a base ENTERRADA — o objeto sai do chao em vez
// de pousar sobre ele.
function contato(cx, cy, rx, ry) {
  poli([[cx - rx, cy], [cx, cy - ry], [cx + rx, cy], [cx, cy + ry]], (x, y) => {
    const c = por(x, y); if (!c) return null;
    const d = Math.abs(x - cx) / rx + Math.abs(y - cy) / ry;
    const i = R.verde.indexOf(c);
    if (i < 0) return null;
    return tom(R.verde, i - 2.1 * (1 - d), x, y);
  });
}

// PEGADA: as tiles que o objeto ocupa, marcadas antes de desenha-lo. E o
// vinculo entre ativo e grade — e o que o S3 precisa saber para desenhar por
// tile no paintOrder. Sem isto o objeto apenas paira sobre o chao.
function pegada(i, j, k) {
  const cx = px(i, j), cy = py(i, j), hw = k * TW / 2, hh = k * TH / 2;
  poli([[cx - hw, cy], [cx, cy - hh], [cx + hw, cy], [cx, cy + hh]], (x, y) => {
    const c = por(x, y); if (!c) return null;
    const idx = R.verde.indexOf(c);
    return idx < 0 ? null : R.verde[Math.min(R.verde.length - 1, idx + 1)];
  });
  for (let t = 0; t <= hw; t++) {          // aresta da pegada, 1 px claro
    const d = t / 2;
    põe(cx - hw + t, cy - d, R.verde[5]); põe(cx + hw - t, cy - d, R.verde[5]);
    põe(cx - hw + t, cy + d, R.verde[5]); põe(cx + hw - t, cy + d, R.verde[5]);
  }
  return [cx, cy];
}

// Silhueta irregular: raio perturbado por hash, com reentrancias. NAO convexo.
function silhueta(cx, cy, rx, ry, semente, n = 13) {
  const p = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const f = 0.62 + 0.55 * h2(k, semente, 2) + 0.18 * h2(k * 3, semente, 5);
    p.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]);
  }
  return p;
}

// Rocha: planos de clivagem por setor angular (facetas irregulares), textura
// por bloco, fratura, liquen no lado iluminado e cascalho no pe.
function rocha(cx, cy, rx, ry, semente, opts = {}) {
  // Base ALTA de proposito: a pedra tem de ficar claramente acima da relva em
  // valor, senao figura e fundo colapsam na mesma faixa de luminancia.
  const base = opts.base || 5.6, liquen = opts.liquen !== false;
  contato(cx + rx * 0.18, cy + ry * 0.62, rx * 1.25, ry * 0.75);
  const pts = silhueta(cx, cy, rx, ry, semente);
  poli(pts, (x, y) => {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    const ang = Math.atan2(dy, dx);
    // setor angular = plano de clivagem; cada plano pega a luz de um jeito
    const setor = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 5);
    const faceta = (h2(setor, semente, 7) - 0.5) * 1.5;
    const luz = -(dx * 0.72 + dy * 0.62);              // luz de cima-esquerda
    let t = base + luz * 1.9 + faceta;
    t += (h2(x >> 1, y >> 1, semente + 31) - 0.5) * 0.85;   // granulacao mineral
    t -= Math.max(0, dy - 0.25) * 1.6;                      // oclusao no pe
    return tom(R.pedra, t, x, y);
  });
  // fraturas: descem do topo seguindo o volume, 1 px, quebradas
  for (let f = 0; f < 3; f++) {
    let x = cx + (h2(f, semente, 13) - 0.5) * rx * 1.1, y = cy - ry * 0.75;
    const vx = (h2(f, semente, 19) - 0.5) * 0.9;
    for (let s = 0; s < ry * 1.7; s++) {
      x += vx * 0.45 + (h2(f * 7 + s, semente, 23) - 0.5) * 0.7;
      y += 1;
      const c = por(x | 0, y | 0);
      if (c && R.pedra.indexOf(c) >= 0) põe(x, y, R.pedra[Math.max(0, R.pedra.indexOf(c) - 2)]);
    }
  }
  // liquen: manchas irregulares, so na parte alta e iluminada
  if (liquen) {
    for (let y = cy - ry; y < cy + ry; y++) {
      for (let x = cx - rx; x < cx + rx; x++) {
        const c = por(x | 0, y | 0); if (!c || R.pedra.indexOf(c) < 0) continue;
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dy > 0.1) continue;
        const m = ruido1(x + y * 1.7, 9, semente + 3);
        if (m > 0.66 && h2(x >> 1, y >> 1, semente + 41) > 0.28) {
          põe(x, y, tom(R.verde, 2.2 + (h2(x, y, 3) - 0.5) * 1.2 - dy * 0.8, x, y));
        }
      }
    }
  }
  // cascalho ao pe: lasca da propria rocha, nao circulo
  for (let k = 0; k < 7; k++) {
    const a = h2(k, semente, 29) * Math.PI * 2;
    const ex = cx + Math.cos(a) * rx * (1.05 + h2(k, semente, 31) * 0.5);
    const ey = cy + ry * 0.75 + Math.sin(a) * ry * 0.3;
    const s = 1 + Math.floor(h2(k, semente, 37) * 2);
    for (let dx = 0; dx <= s; dx++) for (let dy = 0; dy <= Math.max(0, s - 1); dy++) {
      põe(ex + dx, ey + dy, tom(R.pedra, 3.0 + (dy ? -0.9 : 0.6), ex + dx, ey + dy));
    }
  }
}

// Linha de base comum: TODO objeto apoia o pe aqui. Posicao em PIXEL, nao em
// coordenada de tile — foi assim que a regua humana foi parar em x=-33 e a
// base do pico em y=364, fora de um canvas de 360.
// Fileira comum: i+j = 8. Cada objeto declara a tile em que se planta e quantas
// tiles ocupa. Nada mais e escrito em pixel.

/* ---------------- 2. pedregulho — planta em (5,3), pegada 1 tile ---------- */
{
  const [cx, cy] = pegada(5, 3, 1);
  rocha(cx, cy - 8, 15, 10, 101);
}

/* ---------------- 3. rocha com veio mineral — 0,8 tile (51 px) ------------ */
(function veio() {
  const [cx0, cy0] = pegada(6, 2, 1);          // pegada 1 tile
  const cx = cx0, cy = cy0 - 12;
  rocha(cx, cy, 24, 16, 202, { base: 5.2, liquen: false });
  // cristais: cunhas angulares na fenda, cada uma com uma faceta clara
  for (let k = 0; k < 9; k++) {
    const a = -0.9 + h2(k, 202, 3) * 1.8;
    const d = 3 + h2(k, 202, 9) * 11;
    const bx = cx - 3 + Math.cos(a) * d, by = cy + 1 + Math.sin(a) * d * 0.55;
    const L = 3 + Math.floor(h2(k, 202, 11) * 5);
    for (let s = 0; s < L; s++) {
      const w = Math.max(1, Math.round((1 - s / L) * 3));
      for (let q = 0; q < w; q++) {
        põe(bx + s * 0.8, by - s * 0.9 + q, tom(R.minerio, 2.2 + s / L * 1.9 - q * 0.8, bx + s, by + q));
      }
    }
    if (h2(k, 202, 13) > 0.45) põe(bx + L * 0.8, by - L * 0.9, R.minerio[5]);  // brilho especular
  }
})();

/* ---------------- 4. escarpa — 3 tiles ------------------------------------ */
(function escarpa() {
  // pegada 2x2: a largura do bloco E a largura do losango de 2 tiles (128 px)
  const [cxx, cyy] = pegada(8, 0, 2);
  const x0 = cxx - 64, xf = cxx + 64, baseY = cyy;
  contato(x0 + 96, baseY + 4, 104, 26);
  // tres estratos, cada um com topo ONDULADO e altura propria
  // Tons altos: o granito tem de ficar acima do capim em valor, senao a
  // escarpa inteira se dissolve no fundo (media anterior: separacao 0,073).
  const estratos = [[0, 54, 4.6], [14, 40, 5.4], [34, 24, 6.2]];
  for (const [rec, alt, tomBase] of estratos) {
    const a = x0 + rec, b = xf - rec * 1.4;
    for (let x = a; x <= b; x++) {
      const topo = baseY - alt - ruido1(x, 26, rec + 5) * 9 - ruido1(x, 7, rec + 9) * 3;
      for (let y = topo; y <= baseY; y++) {
        const prof = (y - topo) / Math.max(1, baseY - topo);
        let t = tomBase + (1 - prof) * 1.5;
        t += (h2(x >> 1, y >> 1, rec + 71) - 0.5) * 0.8;        // granito granulado
        if (Math.floor(ruido1(x, 13, rec + 3) * 7) % 3 === 0) t -= 0.55;  // fratura vertical
        t -= prof * 0.9;
        põe(x, y, tom(R.pedra, t, x, y));
      }
      // linha de topo: 1 px claro, a aresta que separa o estrato do ceu
      põe(x, baseY - alt - ruido1(x, 26, rec + 5) * 9 - ruido1(x, 7, rec + 9) * 3, R.pedra[7]);
    }
  }
  // talus: cone de cascalho no pe, denso embaixo e ralo em cima
  for (let k = 0; k < 190; k++) {
    const t = h2(k, 303, 3), u = h2(k, 303, 7);
    const x = x0 + 8 + t * 176, y = baseY - u * u * 22 + 2;
    const s = u > 0.6 ? 1 : 2;
    for (let dx = 0; dx < s; dx++) for (let dy = 0; dy < s; dy++) {
      põe(x + dx, y + dy, tom(R.pedra, 2.6 + (dy ? -0.8 : 0.7) + (h2(k, 303, 11) - 0.5), x + dx, y + dy));
    }
  }
})();

/* ---------------- 5. macico nevado — MOSAICO de tiles com cota ------------
   Antes: um perfil 1D preenchido com ruido. Isso e uma silhueta com textura
   POUSADA em cima — chapada, porque nada no sombreamento vinha da forma.
   Agora: campo de altura POR TILE, na mesma malha que o S3 ja usa na D56 — a
   cota de cada CANTO e a media dos 4 tiles que o tocam, entao a superficie
   atravessa a aresta em vez de bater nela e o macico sai facetado e continuo,
   nao em degraus de bolo. O tom de cada face vem da NORMAL real da face
   (produto vetorial em espaco de mundo); a textura so modula o que a forma ja
   decidiu. Mosaical por construcao: some ou tire tiles e a montanha muda.     */
(function macico() {
  // Pegada 5x5: com 3x3 a malha tinha 16 cantos e ~9 com altura — poucas
  // amostras para caber crista e sela, e cada face virava um facetao de tom
  // igual ao vizinho. Macico se monta com mais tiles.
  const I0 = 12, J0 = -4, K = 5;
  pegada(I0, J0, K);

  // Escala vertical do jogo (D55): S = raiz(HW^2 + HH^2) = 35.777 px por
  // unidade de MUNDO. A cota e medida em unidades de mundo, nunca em pixels.
  const SV = Math.sqrt((TW / 2) * (TW / 2) + (TH / 2) * (TH / 2));

  // 1. cota por tile, com um anel de zeros em volta: a saia desce ate o chao e
  //    a silhueta fecha, em vez de terminar numa parede flutuando.
  const N = K + 2, R0 = I0 - Math.floor(K / 2) - 1, C0 = J0 - Math.floor(K / 2) - 1;

  // Cota DIRETA no canto da malha (N+1)x(N+1) — que e o que a malha de cantos
  // da D56 ja e. Antes eu definia a cota por TILE e tirava a media dos quatro
  // vizinhos para achar o canto: num bloco de so 3x3, cada canto do cume entra
  // nessa media com tres vizinhos mais baixos, e a media achata exatamente o
  // pico. Resultado: planalto. Campo de altura se amostra no canto.
  const cot = [];
  for (let a = 0; a <= N; a++) {
    cot[a] = [];
    for (let b = 0; b <= N; b++) {
      // Altura por EIXO DE CRISTA, nao radial: uma funcao radial so sabe fazer
      // cone simetrico — almofada. Montanha tem um eixo, com cumes e selas ao
      // longo dele e queda pela perpendicular.
      const u = a - N / 2, v = b - N / 2;
      const t = u * 0.91 + v * 0.41;             // distancia AO LONGO da crista
      const s = -u * 0.41 + v * 0.91;            // distancia PERPENDICULAR
      const aoLongo = 1 - Math.min(1, Math.abs(t) / (K * 0.62));
      const through = 1 - Math.min(1, Math.abs(s) / (K * 0.34));
      if (aoLongo <= 0 || through <= 0) { cot[a][b] = 0; continue; }
      const cume = aoLongo * Math.pow(through, 0.75);
      // cumes e selas ao longo do eixo + rugosidade fina no flanco
      const picos = 0.70 + 0.52 * ruido1(t * 3 + 11, 2.1, 61);
      const rug = 0.86 + 0.28 * h2(a * 5, b * 5, 67);
      cot[a][b] = 3.8 * cume * picos * rug;
    }
  }

  // ponto de tela de um canto da malha, ja levantado pela cota
  const cantoTela = (a, b) => [
    px(R0 + a, C0 + b),
    py(R0 + a, C0 + b) - cot[a][b] * SV
  ];
  const cantoChao = (a, b) => [px(R0 + a, C0 + b), py(R0 + a, C0 + b)];

  const luz = (() => { const v = [-0.60, -0.28, 0.75]; const m = Math.hypot(...v); return v.map(c => c / m); })();

  // 3. ordem do pintor: a+b crescente, como o paintOrder do S3
  const tiles = [];
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) tiles.push([a, b]);
  tiles.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]));

  for (const [a, b] of tiles) {
    const cN = cot[a][b], cE = cot[a + 1][b], cS = cot[a + 1][b + 1], cW = cot[a][b + 1];
    if (cN + cE + cS + cW <= 0.001) continue;     // tile raso: so relva

    // PAREDES: das arestas da frente ate o chao. Como pintamos de tras para a
    // frente, o excesso e coberto pelo tile seguinte — sem teste de oclusao.
    const parede = (p1, p2, escuro) => {
      const [x1, y1] = cantoTela(...p1), [x2, y2] = cantoTela(...p2);
      const [gx1, gy1] = cantoChao(...p1), [gx2, gy2] = cantoChao(...p2);
      poli([[x1, y1], [x2, y2], [gx2, gy2], [gx1, gy1]], (x, y) => {
        const prof = (y - Math.min(y1, y2)) / Math.max(1, gy1 - y1);
        let t = escuro - prof * 1.3;
        t += (h2(x >> 1, y >> 1, 83) - 0.5) * 0.55;           // granito
        if (ruido1(x * 0.7 + y, 9, 13) > 0.70) t -= 1.1;      // goela vertical
        return tom(R.pedra, t, x, y);
      });
    };
    parede([a + 1, b], [a + 1, b + 1], 3.4);      // face leste, na sombra
    parede([a + 1, b + 1], [a, b + 1], 4.6);      // face sul, meia-luz

    // TOPO: quadrilatero dos 4 cantos levantados. A normal sai do proprio
    // quadrilatero em espaco de mundo — e isto que faz a luz obedecer a forma.
    const v1 = [1, -1, cE - cW], v2 = [1, 1, cS - cN];
    const n = [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0]
    ];
    const nm = Math.hypot(...n);
    const dot = nm ? (n[0] * luz[0] + n[1] * luz[1] + n[2] * luz[2]) / nm : 0;
    const alturaMedia = (cN + cE + cS + cW) / 4;

    poli([cantoTela(a, b), cantoTela(a + 1, b), cantoTela(a + 1, b + 1), cantoTela(a, b + 1)], (x, y) => {
      let t = 4.0 + dot * 3.4;                                 // luz pela normal
      t += (h2(x >> 1, y >> 1, 71) - 0.5) * 0.6;               // granulacao
      if (ruido1(x * 0.6 + y * 1.4, 11, 29) > 0.76) t -= 0.8;  // fratura
      const cor = tom(R.pedra, t, x, y);
      // NEVE: por cota de MUNDO e so onde a face aponta para cima. Borda
      // esfarrapada por dither, nunca corte reto.
      const lim = 1.75 + ruido1(x, 17, 31) * 0.45;
      if (alturaMedia > lim && dot > 0.25) {
        const borda = (alturaMedia - lim) / 0.5;
        if (borda > 1 || bayer(x, y) < borda * borda) {
          return tom(R.neve, 2.4 + dot * 2.6 + (h2(x >> 1, y >> 1, 91) - 0.5) * 0.6, x, y);
        }
      }
      return cor;
    });
  }

  // 4. talus: cascalho desprendido acumulado na saia, so no anel externo
  const [bx, by] = cantoChao(N / 2, N / 2);
  for (let k = 0; k < 170; k++) {
    const ang = h2(k, 404, 3) * Math.PI * 2, rr = 0.55 + h2(k, 404, 7) * 0.45;
    const x = bx + Math.cos(ang) * (K * TW / 2) * rr;
    const y = by + Math.sin(ang) * (K * TH / 2) * rr;
    põe(x, y, tom(R.pedra, 2.5 + (h2(k, 404, 11) - 0.5), x, y));
    if (h2(k, 404, 13) < 0.5) põe(x + 1, y, tom(R.pedra, 2.0, x + 1, y));
  }
})();

/* ---------------- 6. regua humana — 0,5 x 1,2 tile ------------------------ */
(function humano() {
  const [cx, pe] = pegada(4, 4, 1);            // a regua tambem pisa numa tile
  const alt = 38;                                  // 1,2 tile de 32 px
  contato(cx, pe, 9, 5);
  // Pano claro sobre verde medio: a figura tem de saltar do fundo.
  const corpo = (x, y, t) => põe(x, y, tom(R.pano, t, x, y));
  // pernas (metade da altura), quadril estreito, ombro largo, cabeca 1/7
  for (let y = 0; y < alt; y++) {
    const u = y / alt;
    let meiaLarg;
    if (u < 0.14) meiaLarg = 3.0;                       // cabeca
    else if (u < 0.20) meiaLarg = 2.0;                  // pescoco
    else if (u < 0.42) meiaLarg = 5.5 - (u - 0.20) * 4; // ombro -> cintura
    else if (u < 0.52) meiaLarg = 4.0;                  // quadril
    else meiaLarg = 3.4;                                // pernas
    for (let dx = -meiaLarg; dx <= meiaLarg; dx++) {
      if (u >= 0.55 && Math.abs(dx) < 0.9) continue;    // vao entre as pernas
      const luz = -dx / Math.max(1, meiaLarg);
      corpo(cx + dx, pe - alt + y, (u < 0.14 ? 4.6 : 2.6) + luz * 1.1 - u * 0.5);
    }
  }
})();

/* ---------------- 7. contorno de separacao -------------------------------
   1 px mais escuro onde o objeto encosta na relva. Na AoE o contorno nao e
   preto: e a propria rampa do material, dois passos abaixo. E o que garante
   que a silhueta sobreviva contra qualquer fundo.                          */

const ehVerde = c => R.verde.indexOf(c) >= 0;
{
  const copia = buf.slice();
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const c = copia[y * W + x];
      if (!c || ehVerde(c)) continue;
      const viz = [copia[y * W + x - 1], copia[y * W + x + 1], copia[(y - 1) * W + x], copia[(y + 1) * W + x]];
      if (!viz.some(v => !v || ehVerde(v))) continue;
      for (const nome of ['pedra', 'neve', 'minerio', 'pano', 'terra']) {
        const i = R[nome].indexOf(c);
        if (i >= 0) { põe(x, y, R[nome][Math.max(0, i - 2)]); break; }
      }
    }
  }
}

/* ---------------- emissao e injecao --------------------------------------- */

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
const paths = [...porCor.entries()].sort((a, b) => b[1].length - a[1].length)
  .map(([c, d]) => `        <path fill="${c}" d="${d.join('')}"/>`);

const card = `  <!-- FOLHA:INICIO — gerado por tools/rochagen.js, nao editar a mao -->
  <div class="card folha">
    <div class="folha-cena">
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
${paths.join('\n')}
      </svg>
    </div>
    <div class="era">FOLHA DE PROVA · ATRELADA À GRADE</div>
    <div class="arch">Cada ativo OCUPA tiles do jogo (64×32) — não paira sobre eles</div>
    <div class="desc">
      Todos plantados na mesma fileira (i+j=8), com a pegada em tiles marcada no
      chão: régua humana em (4,4) e pedregulho em (5,3), 1 tile cada; veio mineral
      em (6,2), 1 tile; escarpa em (8,0), pegada 2×2; maciço nevado em (12,−4),
      pegada 5×5, montado como mosaico: campo de altura amostrado nos cantos da
      malha (a mesma da D56), face superior de cada tile sombreada pela normal
      real da face e paredes de rocha onde a cota cai para o vizinho.
      Nenhuma posição é escrita em pixel — todas saem de (i,j), e a
      base de cada objeto casa com o losango que ele ocupa, que é o que o S3
      precisa para desenhar por tile no paintOrder.
      Nos cards abaixo os cinco estão num quadro de 120×110 cada, do mesmo tamanho
      e sem grade: por isso nenhum parece o que é — o olho julga tamanho por
      comparação, e não havia comparação nenhuma.
      Silhueta irregular em vez de poliedro convexo, planos de clivagem por setor,
      granulação por bloco, fratura, líquen só no lado iluminado, cascalho ao pé,
      tálus na saia da montanha e neve com borda esfarrapada acima da cota.
    </div>
  </div>
  <!-- FOLHA:FIM -->
`;

let html = fs.readFileSync(ALVO, 'utf8');
const ini = html.indexOf('  <!-- FOLHA:INICIO');
if (ini >= 0) {
  const fim = html.indexOf('<!-- FOLHA:FIM -->', ini) + '<!-- FOLHA:FIM -->\n'.length;
  html = html.slice(0, ini) + card + html.slice(fim);
} else {
  const marca = html.indexOf('<div class="biome-section-title">1. TIPOS DE PEDRAS');
  const quebra = html.indexOf('\n', marca) + 1;
  html = html.slice(0, quebra) + card + html.slice(quebra);
}
fs.writeFileSync(ALVO, html);

console.log(`folha ${W}x${H} · ${porCor.size} cores · ${[...porCor.values()].reduce((s, v) => s + v.length, 0)} corridas`);
console.log('pixels pintados:', buf.filter(Boolean).length, 'de', W * H);
