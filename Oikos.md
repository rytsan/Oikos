OIKOS — CARTA MESTRA
crônicas da primeira casa

Versão: 1.2 · Estado: design fechado, implementação fase 1 iniciandoComo usar: este documento é a única fonte de verdade do projeto. Todadelegação a IA recebe este arquivo integral + o template da seção 8.1.Nada aqui pode ser alterado sem registrar o motivo na seção 11.Contexto de ambiente (memórias, grafos, conversas anteriores) NÃO prevalecesobre esta carta.

1. Visão
Jogo de construção de civilização numa ilha procedural, visão pseudo-isométrica,100% no navegador em um único index.html — sem build, sem dependências,sem rede — hospedável em GitHub Pages. Do acampamento paleolítico à eracontemporânea, o jogador não constrói apenas uma cidade: promulga asinstituições de um povo e responde, era após era, por como a Casa (a ilha)é tratada. Cada decisão impõe vantagem e restrição; cedo condiciona tarde;a ilha finita é a árbitra final.

2. Princípios de design (decisões constitutivas)
Instituições com inércia. Leis têm vantagem + restrição + idade; reformarfica mais caro com o tempo. O menu de opções futuras é o verdadeiro recurso.
Pêndulo elíptico como substrato único. Funções de Jacobi (sn/cn/dn, K(k))regem Harmonia↔Exploração, colheitas e economia. k = rigidez sistêmica;K(k) diverge quando k→1 → a decadência existe como teorema, não como timer.
A ilha é a premissa. O worldgen define o cardápio de possibilidades(sem rio → sem hidrelétrica). Rejogabilidade por premissas, não por caos.
Efeitos sensíveis a contexto. Decisões dimensionam-se sobre um snapshotreal do mundo (represar = f(comprimento do rio); corveia = f(distância)).
Estabilidade oculta, sintomas diegéticos. Nada de barra de felicidade:fumaça de revolta, ruínas, êxodo, pichações. O mapa narra.
Ruínas permanentes. Colapso deixa terreno de ruína no save. Fase 4:"nova casa sobre as ruínas" (mesma seed, ruínas dão conhecimento).
Epílogo gerado, não escrito. O log de crônicas registra ato → efeitomedido; o texto final é costurado desses dados. Nenhuma partida repete o epílogo.
Tom mítico-poético. Todo texto de evento no registro de crônica("A Casa responde...").
3. Restrições técnicas duras
Um arquivo (index.html), roda offline, sem build, sem bibliotecas.
Canvas 2D, 60 fps em desktop modesto. Zero alert().
Proibido Math.random: toda aleatoriedade via OIKOS.rng (seed determinística).
Save automático em localStorage; seed visível e compartilhável.
Google Fonts permitido (com fallback); nada além disso de rede.
4. Contrato comum de módulo (válido para TODAS as delegações)
1. Cada módulo é uma IIFE anexada a window.OIKOS.<NomeModulo>.2. Pode consumir: OIKOS.consts, OIKOS.rng, OIKOS.state, OIKOS.bus,   OIKOS.Mods, OIKOS.Chron, OIKOS.Elliptic.3. NÃO pode: usar Math.random, tocar no DOM (exceto S3 Render e S12 UI),   escrever em estado de módulo alheio, importar bibliotecas.4. Comunicação apenas por: leitura de OIKOS.state + eventos em OIKOS.bus.5. Entrega: (a) código entre marcadores (seção 9); (b) harness de teste   autônomo provando os critérios de aceite sem o jogo completo;   (c) lista de funções exportadas; (d) decisões em comentário // DECISÃO:.6. Acesso ao estado SEMPRE via OIKOS.state.x (nunca capturar referência   em closure — reset() reatribui o objeto).7. Proibida inferência silenciosa. Se algo necessário não está no prompt   ou na carta, declare `// LACUNA: ...` e escolha a solução mais simples.   Contexto do ambiente (memórias, grafos, conversas anteriores) NÃO cria   requisitos nem decisões: onde conflitar com a carta, prevalece a carta,   e o conflito é registrado em `// LACUNA:`.8. Ambiguidade dentro da spec: escolha o mais simples e registre // DECISÃO:.
Grafo de dependências:

S1 Kernel ──┬── S2 Worldgen ── S3 Render            ├── S4 Elíptico (paralelo com tudo)            ├── S5 Modificadores ── S7 Sim ── S8 Eras ── S9 Fronteira ── S10 Decadência ── S11 Epílogo            ├── S6 Crônicas (paralelo com S5)            └── S12 UI (cresce com tudo)
5. Núcleo canônico (imutável)
5.1 Constantes
{ TILE_W:64, TILE_H:32, MAP:56, TICK_MS:2000, MAX_TICKS_PER_FRAME:5,  ZOOM_MIN:0.5, ZOOM_MAX:2.5, SAVE_KEY:'oikos_v1', SCHEMA_VERSION:1 }
5.2 API do kernel
OIKOS.rng      // makeRng(seed): .f() .i(n) .pick(arr) .child(label)               // child: stream derivado por xmur3(label)^seed; não consome o paiOIKOS.state    // estado central (schema 5.3); única fonte de verdadeOIKOS.bus      // .on/.emit/.off — síncrono, FIFO; exceção num handler não               // impede os demaisOIKOS.use(name,{init,update,draw})  // init 1×; update 1×/tick; draw 1×/frameOIKOS.loop     // rAF 60fps + tick fixo por acumulador; pause()/resume()               // sem rajada de dívida; tick emite 'sim:tick' e year++OIKOS.save/load/reset/serialize/deserialize  // TypedArrays como {__ta,v}
5.3 Schema do estado (v1)
{ schemaVersion, seed, year:0, era:0, paused,  meters:{ knowledge, legitimacy:50, harmonyAxis },        // eixo -100..100  res:{ food, wood, stone, copper, iron, coal, gold },  tiles:{ terrain:U8, resource:U8, building:U8, level:U8, owner:U8,          pollution:F32 },   // índice = y*MAP+x  geo:{},                    // resumo da ilha (S2 preenche)  pendulums:{ main:{u,k}, harvest:{u,k}, economy:{u,k} },  institutions:[],           // [{id, yearAdopted}]  chronicle:[], clock:{stagnation,decayStage},  camera:{x,y,zoom}, tool:null, hover:null,  sim:{ pop, jobs, foodProd, housing, tension } }
terrain: 0 oceano, 1 água doce, 2 areia, 3 grama, 4 fértil, 5 floresta,6 pedra, 7 montanha · resource: 0 nada, 1 caça, 2 peixe, 3 cobre,4 ferro, 5 carvão

5.4 Dicionário de eventos
sim:tick · mods:changed · inst:adopted · inst:reformed · era:ready ·era:advanced · chron:entry · border:changed · tile:changed · ui:toast ·decision:open · decision:closed · colony:collapsed · game:won

5.5 RNG de referência (obrigatório)
function xmur3(str){ let h=1779033703^str.length;  for(let i=0;i<str.length;i++){ h=Math.imul(h^str.charCodeAt(i),3432918353);    h=(h<<13)|(h>>>19); }  return function(){ h=Math.imul(h^(h>>>16),2246822507);    h=Math.imul(h^(h>>>13),3266489909); return (h^=h>>>16)>>>0; }; }function mulberry32(a){ return function(){ a|=0; a=(a+0x6D2B79F5)|0;  let t=Math.imul(a^(a>>>15),1|a);  t=(t+Math.imul(t^(t>>>7),61|t))^t;  return ((t^(t>>>14))>>>0)/4294967296; }; }
5.6 RNG sob load()/reset()
reset(newSeed?) e load() REcriam OIKOS.rng a partir da seed (nova ourestaurada). OIKOS.rng não é serializado.
Consequência documentada em código: após load(), os draws do streamprincipal recomeçam da seed; o determinismo ESTRUTURAL se preserva porqueworldgen e variações usam streams filhos por label.
Harness: reset(42) duas vezes → sequências de child('elev') idênticasentre as duas rodadas.
5.7 Fonte de verdade da pausa
loop.pause()/resume() são os únicos mutadores e espelham o valor emstate.paused (para serialização). isPaused() === state.paused.
Após load(), o loop retoma PAUSADO por padrão; o integrador decide quandodar resume(). (Elimina duplicidade de verdade entre state e loop.)
5.8 Leitura viva de consts
O loop lê OIKOS.consts.TICK_MS e SAVE_KEY a cada uso — o harness podesobrescrevê-los antes de start() sem hacks.
5.9 Ordem e assinaturas dos hooks
No tick: state.year++ ANTES de bus.emit('sim:tick', {year}).
init() sem args · update() sem args (lê state) · draw(dt) com dt em ms.
use() após start(): permitido; roda init() imediatamente.
6. Especificações dos módulos
S1 — KERNEL
Fundação determinística; zero lógica de jogo. API e schema da seção 5.Aceite: mesma seed → 1000 draws idênticos; save/load roundtrip comTypedArrays e rejeição de schemaVersion estranho sem corromper estado;bus FIFO + isolamento de exceção; loop ~35 ticks em 350 ms com pausa limpa;use() em ordem; frame < 50 ms com módulos dummy; 5.6–5.9 cobertos peloharness (duplicidade de reset(42), pausa pós-load, consts sobrescrito).

S2 — WORLDGEN
Ilha determinística por seed: fBm 4 oitavas → máscara radial → rio greedy dopico ao mar (lago em depressão; sem nascente = hasRiver:false, hidrelétricasome do menu futuro) → solo fértil (ruído, amplificado no rio) → floresta,afloramentos, veios (cobre raso, ferro alto, carvão médio).Preenche state.geo = { riverLength, hasRiver, forestTiles, fertileTiles, oreVeins, mountainness, landTiles }.Aceite: hash do terrain estável por seed; mar na borda; terra ≥ 900 tiles;30 seeds sem exceção; floresta entre 8% e 30% da terra.

S3 — RENDER
Canvas 2D isométrico 2:1 (telaX=(x−y)·32, telaY=(x+y)·16), picking exatodo diamante. Camadas: terreno → fronteira → edifícios (painter por x+y) →efeitos → overlay (hover/ghost verde-vermelho). Sprites procedurais com regrade 3 tons e variação por rng.child('v'+x+','+y). Degradação visível: águainterpolada por pollution[], tocos, prédios abandonados dessaturados.Câmera: pan/zoom clampado, centrada ao iniciar.Aceite: picking nos 4 cantos; 56×56 a 60 fps; casa em (10,10) oclui (11,9).

S4 — NÚCLEO ELÍPTICO
K(k), sn/cn/dn via AGM + descida de Landen; clamp k ∈ [0, 0.9999].

class Pendulum { constructor({omega,k,u0}); step(dt); get pos; get vel }OIKOS.Elliptic.couple(ps, strength, dt)  // acoplamento fraco entre pêndulos
Aceite: sn(u,0)===sin(u) < 1e-9; K(0)=π/2; K crescente e >10 emk=0.999; deriva de energia < 1e-6 em 10.000 passos; 1000 sn < 5 ms.

S5 — MOTOR DE MODIFICADORES
OIKOS.Mods.push({id, source, target, kind:'add'|'mult', value|fn(snapshot), expiresAt?})OIKOS.Mods.get(target, snapshot)   // add soma, mult multiplica;                                   // empate: lei mais antiga primeiroOIKOS.Mods.removeBySource(sourceId)
fn(snapshot) é o que torna decisões sensíveis a contexto. Valida NaN/∞;emite mods:changed.Aceite: remover instituição remove só seus mods; fn-mods recalculam com osnapshot; motor vazio devolve o valor base; 1000 pushes sem NaN.

S6 — CRÔNICAS
Chron.log(entry), Chron.query({era,type,source}), Chron.timeline().Entrada: {id, year, era, type:'ato'|'evento'|'consequencia'|'desastre'|'marco', titulo, prosa, ato, efeitoMedido, refs}. Instituições registram sondas(p.ex. Corveia → sonda anual de Δprodução e êxodos); resultado de sonda viraentrada consequencia vinculada ao ato. Serializável no save.Aceite: toda decisão gera ≥1 ato + sondas; timeline ordenada;200 entradas sem custo perceptível no tick.

S7 — SIMULAÇÃO
Por tick (1 ano = 2 s): consumo → produção via Mods.get → excedente →crescimento logístico limitado por moradia → empregos → fome (pop cai +crônica). Era 1 jogável: acampamento, cabana de coletor, pesca (rio/mar),lascamento (perto de pedra), trilha; conhecimento ≥ limiar → era:ready.Degradação: colheita excessiva consome floresta; solo perde fertilidade;poluição em raio, decaimento lento (base da reversibilidade cara).Aceite: pop em S, sem explosão; fome forçada derruba pop e registra;todo número passa por Mods.

S8 — ERAS & INSTITUIÇÕES
Data-driven: ERAS[6], INSTITUTIONS[~12] com {id, era, titulo, prosa, pros, cons, mods[], gates[], custoReformaBase}. Transição: era:ready →pausa → carta de decisão material (dimensionada por state.geo) → 1–2instituições → Mods.push + Chron.log. Gates: lei adotada bloqueiaopções futuras (chefia aloca → sem ligas livres → sem guildas → só trabalhoautoritário). Reforma: custo = base × (1+idade/fator) × (1−legitimidade/100) × K(k)/K(0); janela constitucional = crise reduz k temporariamente.

Era	Par institucional	Vantagem / Restrição
Pedra Lascada	Terra comum ↔ Chefia aloca	fronteira orgânica grátis ↔ zoneamento fora de controle
Semeadura	Celeiro coletivo ↔ Excedente privado	resistência à fome ↔ sem comércio interno
Primeiro Metal	Corveia ↔ Trabalho pactuado	construção 2× e custo zero ↔ tensão contínua
Engrenagens	Guildas ↔ Mercado livre	qualidade e estabilidade ↔ crescimento lento
Vapor	Jornada longa ↔ Jornada regulada	produção ++ ↔ saúde cai, revoltas
Contemporânea	Constituição ecológica ↔ Carta da extração	a Casa regenera ↔ produção livre, colapso possível
Aceite: gate testável (adotar A → B some da era seguinte); custo dereforma cresce com idade e k; painel Constituição alimentado via bus.

S9 — FRONTEIRA & EXPANSÃO
Tiles fora da fronteira não são zoneáveis (toast de recusa). Orgânica:avança por atratividade (água/fértil), raio = f(pop, contentamento), semcontrole. Decreto: paga ouro + legitimidade; montanha ×2; custo cresce comdistância ao centro. Tiles distantes: imposto × 1/(1+dist/c), tensão sobe.Aceite: instituição vigente modula o modo; overlay visível; ilha esgota.

S10 — DECADÊNCIA & COLAPSO
Relógio de estagnação por era; enche sob tensão/fome/poluição extrema,velocidade × k. Completou → 3 estágios de decadência (−15/−30/−50% viaMods, abandono visual, desertificação). Persistiu → colapso: êxodo, prédiosviram terreno ruína permanente, colony:collapsed, crônica registra.Estabilidade nunca é número: só eventos-sintoma em limiares cruzados.Aceite: escassez forçada → espiral → colapso; ruínas sobrevivem asave/load; sintoma dispara 1× por limiar.

S11 — FINAIS & EPÍLOGO
Marco final: avaliar harmonia + pop + decadência → Florescimento(3 variantes) | Cicatrizada | Colapso narrado. Gerador de epílogo:agrupa Chron.timeline() por era, preenche templates com efeitoMedidoreal, fecha com estado da ilha (floresta %, poluição, o que persistiu).300–500 palavras, tom mítico-poético. Sandbox continua após o final.Aceite: partidas diferentes → epílogos diferentes (diff automatizado);nenhum placeholder vaza.

S12 — UI/HUD
Topbar (recursos, ano, era); toolbar por era, hotkeys 1–6, ESC; tooltip detile; toasts; painéis Crônicas e Constituição (custo de reforma ao vivo);modal de decisão (pausa o tick); notícias diegéticas dos sintomas.Paleta terrosa/verde-oliva, fonte com caráter, tudo navegável por teclado.

S13 — POLISH (itens independentes)
Limbo no horizonte + fumaça/nuvens Lissajous (cn/sn) + mar com dn(S3) · dia/noite por tint global · carros/barcos em trilhas · áudioWebAudio procedural (sem arquivos) · nova casa sobre as ruínas (S2+S10).

Landmarks (1/era, únicos): Círculo dos Antepassados → Grande Celeiro →Forja Sagrada → Cidadela do Saber → Grande Fábrica ou Terminal Ferroviário →Arcologia-Jardim ou Torre-Fundição. Maiores que prédios normais, comanimação própria e bônus permanente.

7. Matemática de referência
// K(k) — integral elíptica completa, AGM (~6 iterações)const K = k => { let a=1, b=Math.sqrt(1-k*k);  while(Math.abs(a-b)>1e-14) [a,b]=[(a+b)/2, Math.sqrt(a*b)];  return Math.PI/(2*a); };// sn(u,k) — AGM + descida de Landenfunction sn(u,k){ const A=[1], B=[Math.sqrt(1-k*k)], C=[k];  while(Math.abs(A.at(-1)-B.at(-1))>1e-13 && C.length<12){    const a=A.at(-1), b=B.at(-1);    A.push((a+b)/2); B.push(Math.sqrt(a*b)); C.push((a-b)/2); }  const n=C.length-1; let phi=(2**n)*A[n]*u;  for(let i=n;i>=1;i--) phi=(phi+Math.asin((C[i]/A[i])*Math.sin(phi)))/2;  return Math.sin(phi); }
Período do pêndulo: 4·K(k)/ω — diverge quando k→1 (fundamento do relógiode decadência e do custo de reforma).
Custo de reforma: base × (1 + idade/fator) × (1 − legitimidade/100) × K(k)/K(0).
k (rigidez) sobe com: tensão, fome, poluição extrema, instituições rígidas.Desce com: participação, bem-estar, crises (janela constitucional, temporária).
8. Processo de delegação e integração
8.1 Template de prompt de delegação (genérico)
Você é o desenvolvedor responsável por UM módulo do projeto OIKOS, descritona CARTA MESTRA abaixo. Regras absolutas:1. Implemente apenas o módulo {{S#}} (seção 6.{{n}}). Nada além dele.2. O Contrato comum (seção 4) e o Núcleo canônico (seção 5) são imutáveis.3. Proibido Math.random e DOM (exceto S3/S12). Use OIKOS.rng.4. Entregue conforme a seção 9.5. Ambiguidade: escolha o mais simples e registre // DECISAO:.6. Plugins de ambiente (estilos de saída, memória, grafos de contexto)   não alteram este contrato. Única fonte de verdade: a carta abaixo.   Economia de resposta nunca corta entregáveis contratuais (código entre   marcadores, harness, tabela PASS/FAIL, notas). O estilo da conversa é   irrelevante; o formato do ARQUIVO é contratual.7. Estilo de saída do ambiente NUNCA prevalece sobre o formato da seção 9.=== CARTA MESTRA ===(conteúdo integral deste arquivo)
8.2 Ordem de delegação
Rodada	Specs	Paralelo
1	S1	— (trava contratos)
2	S2 + S4 + S6	sim
3	S3 + S5	sim
4	S7	—
5	S8 + S9	sim
6	S10 + S11 + S12	sim
7	S13, item a item	sim
8.3 Fluxo por rodada
Delegar → testar harness localmente → auditar → integrar → rodar o jogo →próxima rodada. Nunca delegar a rodada seguinte com a anterior não integrada.

8.4 Checklist de auditoria
 Sem Math.random, sem DOM fora de S3/S12, sem libs
 Schema/eventos/consts respeitados (nenhum renome, nenhuma extensão silenciosa)
 Marcadores de extração presentes e corretos
 Harness roda standalone e dá PASS em todos os critérios da spec
 Escopo fechado (nada de módulos vizinhos "de brinde")
 // DECISÃO: conformes com a seção 11; // LACUNA: revisadose, se legítimos, transformados em patch desta carta
9. Formato de entrega
Cada devolução = um arquivo HTML rodável por duplo clique, com o móduloentre marcadores exatos:

/* ===== OIKOS S{n} {NOME} — INÍCIO ===== */... código do módulo .../* ===== OIKOS S{n} {NOME} — FIM ===== */
Seguido do harness (fora dos marcadores) que imprime tabela PASS/FAIL no DOMe no console. Acompanham: lista de exports, decisões // DECISÃO: resumidas,lacunas // LACUNA: listadas, confirmação de ausência de Math.random.O integrador extrai os blocos para o index.html na ordem do grafo dedependências.

10. Roteiro de fases
Fase	Entrega	Módulos
1	Ilha + câmera + Era 1 jogável + Mods + Crônicas + núcleo elíptico	S1–S7
2	Recursos, economia, eras, decisões sensíveis a contexto	S8
3	Acoplamento de pêndulos, reformas via K(k), decadência, ruínas	S9, S10
4	Cadeias completas, finais + epílogo, landmarks, polish	S11, S13
Duração alvo da partida completa: 60–120 min · 6 eras · ~12 instituições.

11. Registro de decisões (append-only)
#	Decisão	Motivo
D1	Nome OIKOS	raiz de oikonomia (administrar a casa) e oikologia (conhecer a casa) — a tese do jogo. "Primórdia" descartada por homenagem a jogo homônimo de dev admirado
D2	Pêndulo elíptico como substrato único	decadência como teorema (K diverge), ciclos acoplados de graça, identidade visual
D3	Estabilidade oculta / sintomas diegéticos	o mapa narra; evita HUD de números
D4	Ruínas permanentes + "nova casa sobre as ruínas"	a Casa tem memória; derrota narrada também é conteúdo
D5	Epílogo gerado do log, não escrito	nenhuma partida repete o epílogo; exige Crônicas desde a fase 1
D6	Motor de modificadores desde o dia 1	decisões = forças contínuas, não bônus únicos; impossível retrofitar
D7	RNG seeded obrigatório	determinismo entre módulos desenvolvidos por IAs diferentes
D8	Mapa 56×56, tick = 1 ano = 2 s	equilíbrio densidade × performance Canvas 2D
D9	RNG recriado por seed em load/reset; streams filhos carregam o determinismo estrutural	rng não serializável; estruturas estáveis por label
D10	loop é a autoridade da pausa, espelhada em state.paused	elimina duplicidade de verdade
D11	consts lidos vivos pelo loop	testabilidade do harness sem gambiarras
D12	Proibida inferência silenciosa; lacunas declaradas como // LACUNA:; contexto externo (memória/grafos) não prevalece sobre a carta	decisões por palpite contaminam módulos a jusante; correção tardia é cara
12. Status
Módulo	Spec	Delegado	Auditado	Integrado
S1 Kernel	✅ v1.2	☐	☐	☐
S2 Worldgen	✅ v1.2	☐	☐	☐
S3 Render	✅ v1.2	☐	☐	☐
S4 Elíptico	✅ v1.2	☐	☐	☐
S5 Mods	✅ v1.2	☐	☐	☐
S6 Crônicas	✅ v1.2	☐	☐	☐
S7 Sim	✅ v1.2	☐	☐	☐
S8 Eras	✅ v1.2	☐	☐	☐
S9 Fronteira	✅ v1.2	☐	☐	☐
S10 Decadência	✅ v1.2	☐	☐	☐
S11 Epílogo	✅ v1.2	☐	☐	☐
S12 UI	✅ v1.2	☐	☐	☐
S13 Polish	✅ v1.2	☐	☐	☐
Changelog v1.0 → v1.2 (para você validar o diff contra o que já salvou):

Contrato comum: novo item 7 (proibida inferência silenciosa, // LACUNA:, contexto externo não prevalece) — antigo item 6 virou 8.
Seção 5: novas subseções 5.6 a 5.9 (RNG sob load/reset, autoridade da pausa, consts vivos, ordem/assinaturas dos hooks).
S1: critérios de aceite ampliados para cobrir 5.6–5.9.
Template 8.1: novo item 6 (plugins de ambiente não alteram contrato; formato do arquivo é o que vale).
Seção 9: devolução inclui lista de // LACUNA:.
Checklist 8.4: novo item — lacunas legítimas viram patch da carta, não decisão local da IA.
Seção 11: D9–D12 registradas. Seção 12: versão anotada por linha.