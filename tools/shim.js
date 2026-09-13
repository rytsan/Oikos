// tools/shim.js — carregar ANTES dos scripts do arquivo do módulo
global.window = global;
global.performance = global.performance || { now: () => Date.now() };
global.requestAnimationFrame = (fn) => setTimeout(() => fn(performance.now()), 16);
global.localStorage = (() => { const m = {}; return {
  getItem: (k) => (k in m ? m[k] : null),
  setItem: (k, v) => { m[k] = String(v); }
}; })();
global.document = { getElementById: () => ({ _h: '',
  set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; } }) };
if (!console.table) console.table = (rows) => console.log(rows);
