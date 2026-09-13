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

console.log('SMOKE OK');
