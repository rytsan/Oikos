// tools/monta-delegacao.js — node tools/monta-delegacao.js docs/delegacoes/<arquivo>.md
// Emite o prompt final de delegacao: prompt do modulo + carta integral +
// bloco real do kernel. Carta e kernel sao INJETADOS na hora, das fontes
// vigentes, para que nenhuma copia deles envelheca dentro de docs/delegacoes/.
const fs = require('fs');

const arq = process.argv[2];
if (!arq) {
  console.error('uso: node tools/monta-delegacao.js docs/delegacoes/<arquivo>.md');
  process.exit(2);
}

const prompt = fs.readFileSync(arq, 'utf8');
const carta = fs.readFileSync('Oikos.md', 'utf8');

const html = fs.readFileSync('index.html', 'utf8');
const ini = '/* ===== OIKOS S1 KERNEL — INÍCIO ===== */';
const fim = '/* ===== OIKOS S1 KERNEL — FIM ===== */';
const a = html.indexOf(ini), b = html.indexOf(fim);
if (a < 0 || b < 0) {
  console.error('marcadores do kernel nao encontrados em index.html');
  process.exit(1);
}
const kernel = html.slice(a, b + fim.length);

for (const ph of ['{{CARTA}}', '{{KERNEL}}']) {
  if (!prompt.includes(ph)) { console.error('placeholder ausente no prompt: ' + ph); process.exit(1); }
}

const versao = (/^Vers[aã]o:\s*([\d.]+)/m.exec(carta) || [, '?'])[1];
process.stderr.write('carta v' + versao + ' · kernel ' + kernel.split('\n').length + ' linhas\n');

process.stdout.write(prompt.replace('{{CARTA}}', carta).replace('{{KERNEL}}', kernel));
