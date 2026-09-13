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

// Recorta TODOS os blocos entre marcadores, na ordem em que estao no
// index.html. {{KERNEL}} injeta so o S1; {{RUNTIME}} injeta o runtime
// integrado inteiro, para modulos que dependem de outros ja integrados
// (o S7 precisa de Mods, Chron e da ilha do Worldgen para o harness rodar).
const re = /\/\* ===== (OIKOS S\d+ [A-Z]+) — INÍCIO ===== \*\/[\s\S]*?\/\* ===== \1 — FIM ===== \*\//g;
const blocos = html.match(re) || [];
if (!blocos.length) { console.error('nenhum bloco entre marcadores em index.html'); process.exit(1); }

const kernel = blocos.find(b => b.indexOf('OIKOS S1 KERNEL') >= 0);
if (!kernel) { console.error('bloco do kernel nao encontrado em index.html'); process.exit(1); }
const runtime = blocos.join('\n\n');

const usaKernel = prompt.includes('{{KERNEL}}');
const usaRuntime = prompt.includes('{{RUNTIME}}');
if (!prompt.includes('{{CARTA}}')) { console.error('placeholder ausente no prompt: {{CARTA}}'); process.exit(1); }
if (!usaKernel && !usaRuntime) { console.error('prompt nao pede {{KERNEL}} nem {{RUNTIME}}'); process.exit(1); }

const nomes = blocos.map(b => (/OIKOS (S\d+)/.exec(b) || [, '?'])[1]).join(' ');
const versao = (/^Vers[aã]o:\s*([\d.]+)/m.exec(carta) || [, '?'])[1];
process.stderr.write('carta v' + versao + ' · ' +
  (usaRuntime ? 'runtime [' + nomes + '] ' + runtime.split('\n').length
              : 'kernel ' + kernel.split('\n').length) + ' linhas\n');

let saida = prompt.replace('{{CARTA}}', carta);
if (usaKernel) saida = saida.replace('{{KERNEL}}', kernel);
if (usaRuntime) saida = saida.replace('{{RUNTIME}}', runtime);
process.stdout.write(saida);
