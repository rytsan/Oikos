// tools/smoke.js — smoke pos-integracao contra o index.html (CLAUDE.md secao 6)
require('./shim');
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  vm.runInThisContext(m[1], { filename: 'index.html' });
}

OIKOS.reset(42);
OIKOS.Worldgen.generate();
console.log('geo:', OIKOS.state.geo);
OIKOS.Chron.log({ type: 'marco', titulo: 'Fogada inicial', prosa: 'A Casa acorda.' });
console.log('cronicas:', OIKOS.Chron.timeline().length);
const per = new OIKOS.Elliptic.Pendulum({ id: 'main', omega: 1 }).period();
console.log('periodo main:', per.toFixed(3));

// asseroes da secao 6: geo com os 7 campos, hasRiver booleano, 1 entrada na
// timeline, periodo plausivel (> 4, crescendo com k).
const campos = ['riverLength', 'hasRiver', 'forestTiles', 'fertileTiles', 'oreVeins', 'mountainness', 'landTiles'];
for (const c of campos) assert.ok(c in OIKOS.state.geo, 'geo sem o campo ' + c);
assert.strictEqual(typeof OIKOS.state.geo.hasRiver, 'boolean', 'hasRiver nao e booleano');
assert.strictEqual(OIKOS.Chron.timeline().length, 1, 'timeline deveria ter 1 entrada');
assert.ok(per > 4, 'periodo <= 4');
OIKOS.state.pendulums.main.k = 0.9;
const perRigido = new OIKOS.Elliptic.Pendulum({ id: 'main', omega: 1 }).period();
console.log('periodo main com k=0.9:', perRigido.toFixed(3));
assert.ok(perRigido > per, 'periodo nao cresce com k');

// S3 integrado: as funcoes puras do render respondem sem canvas.
assert.ok(OIKOS.Render && typeof OIKOS.Render.draw === 'function', 'Render ausente');
const p = OIKOS.Render.project(10, 10);
const q = OIKOS.Render.unproject(p.x, p.y);
console.log('render roundtrip (10,10):', q.x + ',' + q.y);
assert.strictEqual(q.x, 10, 'roundtrip x');
assert.strictEqual(q.y, 10, 'roundtrip y');
const vis = OIKOS.Render.visibleTiles(960, 540);
console.log('visibleTiles 960x540:', vis.length, 'tiles');
assert.ok(vis.length > 0, 'visibleTiles vazio');

// S5 integrado: motor de modificadores responde e a ordem D28 vale.
assert.ok(OIKOS.Mods && typeof OIKOS.Mods.push === 'function', 'Mods ausente');
OIKOS.Mods.push({ id: 'smoke.mult', source: 'smoke', target: 'foodProd', kind: 'mult', value: 2 });
OIKOS.Mods.push({ id: 'smoke.add', source: 'smoke', target: 'foodProd', kind: 'add', value: 5 });
const comMods = OIKOS.Mods.get('foodProd', { foodProd: 10 });
console.log('mods foodProd (base 10, add 5, mult 2):', comMods);
assert.strictEqual(comMods, 30, 'ordem D28: (10+5)*2 = 30');
assert.strictEqual(OIKOS.Mods.removeBySource('smoke'), 2, 'removeBySource devolve a contagem');
assert.strictEqual(OIKOS.Mods.get('foodProd', { foodProd: 10 }), 10, 'motor vazio devolve a base');

console.log('SMOKE OK');
