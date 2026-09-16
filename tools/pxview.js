// tools/pxview.js — olho do agente para os sprites gerados.
//
// Reconstrói o sprite a partir do <svg class="px"> já escrito no caderno e
// mede o que distingue sombreamento de chuvisco, além de imprimir a silhueta
// em ASCII por luminância. Serve para iterar sem navegador.
//
// Uso: node tools/pxview.js [arquivo.html]

'use strict';
const fs = require('fs');
const path = require('path');

const ALVO = process.argv[2] || path.join(__dirname, '..', 'docs', 'exemplos.html');
const html = fs.readFileSync(ALVO, 'utf8');
// Acha o sprite: primeiro o <svg class="px">, senao o da folha de prova.
let ini = html.indexOf('<svg class="px"');
if (ini < 0) {
  const folha = html.indexOf('<!-- FOLHA:INICIO');
  if (folha >= 0) ini = html.indexOf('<svg ', folha);
}
if (ini < 0) { console.error('nenhum sprite gerado encontrado em ' + ALVO); process.exit(1); }
const bloco = html.slice(ini, html.indexOf('</svg>', ini));

const vb = bloco.match(/viewBox="0 0 (\d+) (\d+)"/);
const W = +vb[1], H = +vb[2];
const g = new Array(W * H).fill(null);

for (const m of bloco.matchAll(/<path fill="(#[0-9a-f]{6})" d="([^"]+)"/g)) {
  for (const r of m[2].matchAll(/M(\d+) (\d+)h(\d+)/g)) {
    const x = +r[1], y = +r[2], n = +r[3];
    for (let i = 0; i < n; i++) if (x + i < W && y < H) g[y * W + x + i] = m[1];
  }
}

const lum = (c) => (0.2126 * parseInt(c.slice(1, 3), 16)
                  + 0.7152 * parseInt(c.slice(3, 5), 16)
                  + 0.0722 * parseInt(c.slice(5, 7), 16)) / 255;

/* --- métrica 1: corridas. Corrida curta demais em toda parte = chuvisco --- */
let corridas = [], pintados = 0;
for (let y = 0; y < H; y++) {
  let x = 0;
  while (x < W) {
    const c = g[y * W + x];
    if (!c) { x++; continue; }
    let n = 1;
    while (x + n < W && g[y * W + x + n] === c) n++;
    corridas.push(n); pintados += n; x += n;
  }
}
const de1 = corridas.filter(n => n === 1).length;

/* --- métrica 2: pixel isolado. Acima de ~12% o olho lê ruído, não forma --- */
let isolados = 0, total = 0;
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const c = g[y * W + x];
    if (!c) continue;
    total++;
    const v = [g[y * W + x - 1], g[y * W + x + 1], g[(y - 1) * W + x], g[(y + 1) * W + x]];
    if (v.every(k => k !== c)) isolados++;
  }
}

/* --- métrica 3: quanto de cada tom. Rampa usada de ponta a ponta? -------- */
const conta = new Map();
for (const c of g) if (c) conta.set(c, (conta.get(c) || 0) + 1);

console.log(`sprite ${W}x${H} · ${pintados} px pintados · ${conta.size} cores`);
console.log(`corridas: ${corridas.length} · media ${(pintados / corridas.length).toFixed(2)} px · de 1px: ${(100 * de1 / corridas.length).toFixed(0)}%`);
console.log(`pixels isolados: ${(100 * isolados / total).toFixed(0)}%  (alvo: abaixo de 12%)`);
console.log('tons mais usados: ' + [...conta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  .map(([c, n]) => `${c}:${n}`).join('  '));
console.log('');

/* --- silhueta em ASCII. Reamostra para caber no terminal: sprite largo sai
       com 640 colunas e vira ilegivel. Cada caractere e a media da celula. -- */
const RAMPA = ' .:-=+*#%@';
const COLS = 150;

// Recorte: node tools/pxview.js <arquivo> --crop x,y,w,h
// Sem recorte a folha inteira reamostra 5x10 px por caractere e objeto pequeno
// some; com recorte da para inspecionar um objeto a 1:1.
let X0 = 0, Y0 = 0, X1 = W, Y1 = H;
const ic = process.argv.indexOf('--crop');
if (ic > 0 && process.argv[ic + 1]) {
  const [a, b, w, h] = process.argv[ic + 1].split(',').map(Number);
  X0 = Math.max(0, a); Y0 = Math.max(0, b);
  X1 = Math.min(W, a + w); Y1 = Math.min(H, b + h);
  console.log(`recorte ${X0},${Y0} ${X1 - X0}x${Y1 - Y0}`);
}
// Separacao figura-fundo, medida so entre FIGURA e FUNDO — nao entre duas
// medias que o mesmo capim domina. Cor presente no anel ao redor conta como
// fundo; cor que so existe dentro do recorte e figura.
if (ic > 0) {
  const anel = new Set();
  for (let y = Y0 - 10; y < Y1 + 10; y++) {
    for (let x = X0 - 10; x < X1 + 10; x++) {
      if (x >= X0 && x < X1 && y >= Y0 && y < Y1) continue;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const c = g[y * W + x];
      if (c) anel.add(c);
    }
  }
  let sf = 0, nf = 0, sb = 0, nb = 0;
  for (let y = Y0; y < Y1; y++) {
    for (let x = X0; x < X1; x++) {
      const c = g[y * W + x];
      if (!c) continue;
      if (anel.has(c)) { sb += lum(c); nb++; } else { sf += lum(c); nf++; }
    }
  }
  if (!nf) {
    console.log('separacao: nenhuma cor exclusiva do objeto — figura e fundo usam a mesma paleta');
  } else {
    const F = sf / nf, B = nb ? sb / nb : 0;
    console.log(`figura ${F.toFixed(3)} (${nf} px) · fundo ${B.toFixed(3)} (${nb} px) · separacao ${Math.abs(F - B).toFixed(3)} (alvo > 0.10)`);
  }
}

const px = Math.max(1, Math.ceil((X1 - X0) / COLS));
const py = px * 2;
for (let y = Y0; y < Y1; y += py) {
  let l = '';
  for (let x = X0; x < X1; x += px) {
    let soma = 0, n = 0;
    for (let dy = 0; dy < py && y + dy < H; dy++) {
      for (let dx = 0; dx < px && x + dx < W; dx++) {
        const c = g[(y + dy) * W + x + dx];
        if (c) { soma += lum(c); n++; }
      }
    }
    // celula so conta como preenchida se a maioria dos pixels tem cor
    l += (n > (px * py) / 3) ? RAMPA[Math.min(9, Math.floor((soma / n) * 13))] : ' ';
  }
  console.log(l.replace(/\s+$/, ''));
}
