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

// S7 integrado: catalogo, colocacao e quarenta anos de simulacao.
assert.ok(OIKOS.Sim && typeof OIKOS.Sim.step === 'function', 'Sim ausente');
assert.strictEqual(OIKOS.Sim.BUILDINGS.length, 5, 'catalogo da Era 1 com cinco');
OIKOS.state.res.wood = 200; OIKOS.state.res.food = 100;
function plantarSmoke(nome, n) {
  let feitos = 0;
  const M = OIKOS.consts.MAP;
  for (let y = 0; y < M && feitos < n; y++)
    for (let x = 0; x < M && feitos < n; x++)
      if (OIKOS.Sim.place(nome, x, y)) feitos++;
  return feitos;
}
const nAcamp = plantarSmoke('acampamento', 3);
const nPesca = plantarSmoke('pesca', 3);
console.log('plantados: acampamento', nAcamp, '· pesca', nPesca);
assert.ok(nAcamp >= 1 && nPesca >= 1, 'nao plantou o basico da Era 1');
for (let i = 0; i < 40; i++) { OIKOS.state.year++; OIKOS.Sim.step(); }
console.log('pop apos 40 anos:', OIKOS.state.sim.pop.toFixed(2),
  '· moradia:', OIKOS.state.sim.housing, '· floresta em geo:', OIKOS.state.geo.forestTiles);
assert.ok(OIKOS.state.sim.pop > 1, 'populacao nao cresceu');
assert.ok(OIKOS.state.sim.housing > 0, 'moradia zerada');

// S8 integrado: catalogo, par da era e adocao empurrando mods de verdade.
assert.ok(OIKOS.Eras && Array.isArray(OIKOS.Eras.ERAS), 'Eras ausente');
assert.strictEqual(OIKOS.Eras.ERAS.length, 6, 'seis eras');
assert.strictEqual(OIKOS.Eras.INSTITUTIONS.length, 12, 'doze instituicoes');
const opsEra0 = OIKOS.Eras.opcoes(0);
console.log('opcoes da era 0:', opsEra0.map(i => i.id).join(' | '));
assert.strictEqual(opsEra0.length, 2, 'par institucional da era 0');
const growthAntes = OIKOS.Mods.get('growth', { growth: 1 });
OIKOS.Eras.adopt('inst.terraComum');
const growthDepois = OIKOS.Mods.get('growth', { growth: 1 });
console.log('growth apos adotar Terra comum:', growthAntes.toFixed(3), '->', growthDepois.toFixed(3));
assert.ok(growthDepois > growthAntes, 'instituicao nao empurrou mod');

// S9 integrado: a fronteira nasce e o S7 passa a respeita-la (D44).
assert.ok(OIKOS.Border && typeof OIKOS.Border.expandir === 'function', 'Border ausente');
let ganhos = 0;
for (let i = 0; i < 15; i++) ganhos += OIKOS.Border.expandir();
console.log('fronteira apos 15 passos:', ganhos, 'tiles · centro', JSON.stringify(OIKOS.Border.centro()));
assert.ok(ganhos > 0, 'fronteira nao expandiu');
const dentroFront = OIKOS.Border.isInside(Math.round(OIKOS.Border.centro().x), Math.round(OIKOS.Border.centro().y));
console.log('centro dentro da fronteira:', dentroFront);

// S10 integrado: relogio, estagio e id de ruina.
assert.ok(OIKOS.Decay && typeof OIKOS.Decay.passo === 'function', 'Decay ausente');
assert.strictEqual(OIKOS.Decay.RUINA, 200, 'id de ruina');
assert.strictEqual(OIKOS.Decay.estagio(), 0, 'partida saudavel nao esta em decadencia');

// S11 integrado: epilogo dentro da faixa e sem placeholder.
assert.ok(OIKOS.Epilogue && typeof OIKOS.Epilogue.gerar === 'function', 'Epilogue ausente');
const epi = OIKOS.Epilogue.gerar();
const nPal = epi.trim().split(/\s+/).length;
console.log('epilogo:', nPal, 'palavras ·', OIKOS.Epilogue.desfecho().id);
assert.ok(nPal >= 300 && nPal <= 500, 'epilogo fora da faixa de 300 a 500');
assert.ok(!/undefined|NaN|\[object Object\]|\{\{/.test(epi), 'placeholder vazou no epilogo');

// S12 integrado: a ferramenta selecionada efetiva no clique (D47), e a
// fronteira criada acima faz o canBuild do S7 aplicar a D44.
assert.ok(OIKOS.UI && typeof OIKOS.UI.executarFerramenta === 'function', 'UI ausente');
const ferramentas = OIKOS.UI.ferramentasDaEra();
assert.strictEqual(ferramentas.length, 5, 'toolbar com cinco ferramentas');
const c = OIKOS.Border.centro();
const cx = Math.round(c.x), cy = Math.round(c.y);
OIKOS.UI.selecionar(ferramentas[0].id);
const efeito = OIKOS.UI.executarFerramenta(cx, cy);
console.log('clique no centro da fronteira:', JSON.stringify(efeito));
assert.ok(efeito.ok || efeito.motivo === 'ocupado', 'ferramenta nao efetivou: ' + efeito.motivo);
assert.strictEqual(OIKOS.UI.alternarPainel('cronicas'), 'cronicas', 'painel nao abriu');

console.log('SMOKE OK');
