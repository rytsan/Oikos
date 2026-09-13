// tools/run-harness.js — node tools/run-harness.js <arquivo>.html
// Carrega o shim, extrai cada <script> do HTML em ordem, avalia e aguarda a
// bateria assincrona ate o harness imprimir "<tag> harness: x/x PASS".
require('./shim');
const fs = require('fs');
const vm = require('vm');

const file = process.argv[2];
if (!file) { console.error('uso: node tools/run-harness.js <arquivo>.html'); process.exit(2); }

const html = fs.readFileSync(file, 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);

let summary = null;
const log = console.log.bind(console);
console.log = function (...args) {
  const line = args.map(String).join(' ');
  const m = /harness:\s*(\d+)\/(\d+)\s*PASS/.exec(line);
  if (m) summary = { pass: +m[1], total: +m[2] };
  log(...args);
};

console.log('# ' + file + ' — ' + scripts.length + ' blocos <script>');
for (let i = 0; i < scripts.length; i++) {
  vm.runInThisContext(scripts[i], { filename: file + ' [script ' + (i + 1) + ']' });
}

(async () => {
  const deadline = Date.now() + 30000;
  while (!summary && Date.now() < deadline) await new Promise(r => setTimeout(r, 100));
  if (!summary) { console.error('TIMEOUT: harness nao imprimiu o resumo em 30 s'); process.exit(1); }
  console.log('# resultado: ' + summary.pass + '/' + summary.total +
    (summary.pass === summary.total ? ' PASS' : ' — HA FALHAS'));
  process.exit(summary.pass === summary.total ? 0 : 1);
})();
