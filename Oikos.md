crônicas da primeira casa

Versão: 1.11 · Estado: rodadas 2 e 3 auditadas e integradas (S1+S2+S4+S6+S3+S5 no index.html, smoke OK); rodada 4 (S7 Sim) delegávelComo usar: este documento é a única fonte de verdade do projeto. Todadelegação a IA recebe este arquivo integral + o template da seção 8.1(+ adendo do módulo, quando houver). Nada aqui pode ser alterado semregistrar o motivo na seção 11. Contexto de ambiente (memórias, grafos,conversas anteriores) NÃO prevalece sobre esta carta.

1. Visão
Jogo de construção de civilização numa ilha procedural, visão pseudo-isométrica,100% no navegador em um único index.html — sem build, sem dependências,sem rede — hospedável em GitHub Pages. Do acampamento paleolítico à eracontemporânea, o jogador não constrói apenas uma cidade: promulga asinstituições de um povo e responde, era após era, por como a Casa (a ilha)é tratada. Cada decisão impõe vantagem e restrição; cedo condiciona tarde;a ilha finita é a árbitra final.

2. Princípios de design (decisões constitutivas)
Instituições com inércia. Leis têm vantagem + restrição + idade; reformarfica mais caro com o tempo. O menu de opções futuras é o verdadeiro recurso.
Pêndulo elíptico como substrato único. Funções de Jacobi (sn/cn/dn, K(k))regem Harmonia↔Exploração, colheitas e economia. k = rigidez sistêmica;K(k) diverge quando k→1 → a decadência existe como teorema, não como timer(operacionalizada pelo clamp — ver seção 7, D19).
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
1. Cada módulo é uma IIFE anexada a window.OIKOS.<NomeModulo>.2. Pode consumir: OIKOS.consts, OIKOS.rng, OIKOS.makeRng, OIKOS.state,   OIKOS.bus, OIKOS.Mods, OIKOS.Chron, OIKOS.Elliptic.3. NÃO pode: usar Math.random, tocar no DOM (exceto S3 Render e S12 UI),   escrever em estado de módulo alheio, importar bibliotecas.4. Comunicação apenas por: leitura de OIKOS.state + eventos em OIKOS.bus.5. Entrega: (a) código entre marcadores (seção 9); (b) harness de teste   autônomo provando os critérios de aceite sem o jogo completo;   (c) lista de funções exportadas; (d) decisões em comentário // DECISÃO:.6. Acesso ao estado SEMPRE via OIKOS.state.x (nunca capturar referência   em closure — reset() reatribui o objeto).7. Proibida inferência silenciosa. Se algo necessário não está no prompt   ou na carta, declare `// LACUNA: ...` e escolha a solução mais simples.   Contexto do ambiente (memórias, grafos, conversas anteriores) NÃO cria   requisitos nem decisões: onde conflitar com a carta, prevalece a carta,   e o conflito é registrado em `// LACUNA:`.8. Ambiguidade dentro da spec: escolha o mais simples e registre // DECISÃO:.9. O harness DEVE executar sob Node (tools/run-harness.js do executor):   a) lógica do módulo separada de DOM/canvas — as funções puras exportadas      são testáveis sem browser (S3: project/unproject/isZoneable/paintOrder/      visibleTiles; regra geral para todos os módulos futuros);   b) critérios dependentes de canvas/DOM marcados [browser] no adendo      imprimem SKIP sob Node — NUNCA FAIL por ausência de canvas; todo o      resto imprime PASS/FAIL normalmente. A fronteira do SKIP é o que é      declaradamente visual (smoke de browser e qualquer critério que exija      draw() de fato); critérios puramente geométricos — roundtrip de      projeção, picking, paintOrder, isZoneable, culling — permanecem      PASS/FAIL obrigatórios sob Node;   c) linha de resumo contratual: "x/x PASS (+y SKIP [browser])" — é o que o      integrador extrai. O sufixo "(+y SKIP [browser])" só é EXIGIDO quando      y > 0; com y = 0 a linha "x/x PASS" basta, e o runner aceita as duas      formas. O aceite visual [browser] acontece no browser, pelo dono, na      devolução.
Grafo de dependências:

S1 Kernel ──┬── S2 Worldgen ── S3 Render            ├── S4 Elíptico (paralelo com tudo)            ├── S5 Modificadores ── S7 Sim ── S8 Eras ── S9 Fronteira ── S10 Decadência ── S11 Epílogo            ├── S6 Crônicas (paralelo com S5)            └── S12 UI (cresce com tudo)
5. Núcleo canônico (imutável)
5.1 Constantes
{ TILE_W:64, TILE_H:32, MAP:56, TICK_MS:2000, MAX_TICKS_PER_FRAME:5,  ZOOM_MIN:0.5, ZOOM_MAX:2.5, SAVE_KEY:'oikos_v1', SCHEMA_VERSION:1 }
5.2 API do kernel (sincronizada com o código auditado)
OIKOS.makeRng(seed)  // fábrica de streams: {seed, f(), i(n), pick(arr),                     //  child(label)}; child deriva da seed de CONSTRUÇÃO                     //  (não consome o pai, estável em qualquer momento)OIKOS.rng            // instância principal; recriada por reset()/load() (5.6)OIKOS.state          // estado central (schema 5.3); única fonte de verdade;                     // reatribuído (nunca mutado por referência)OIKOS.bus            // .on(evt,fn) RETORNA FUNÇÃO de unsubscribe; .emit                     // síncrono FIFO; itera sobre CÓPIA dos handlers;                     // exceção num handler não impede os demaisOIKOS.use(name,{init,update,draw})  // init 1× (ou imediato se pós-start);                     // update 1×/tick; draw 1×/frameOIKOS.loop           // rAF + tick fixo por acumulador (cap 5, descarta dívida);                     // pause()/resume() únicos mutadores de state.paused (5.7);                     // leitura viva de consts (5.8); start() idempotenteOIKOS.save/load/reset/serialize/deserialize                     // TypedArrays como {__ta,v}; persistência best-effort                     // com fallback em memória (5.10/D18)
5.3 Schema do estado (v1)
{ schemaVersion, seed, year:0, era:0, paused,  meters:{ knowledge, legitimacy:50, harmonyAxis },        // eixo -100..100  res:{ food, wood, stone, copper, iron, coal, gold },  tiles:{ terrain:U8, resource:U8, building:U8, level:U8, owner:U8,          pollution:F32 },   // índice = y*MAP+x  geo:{},                    // resumo da ilha (S2 preenche)  pendulums:{ main:{u,k}, harvest:{u,k}, economy:{u,k} },  institutions:[],           // [{id, yearAdopted}]  chronicle:[], clock:{stagnation,decayStage},  camera:{x,y,zoom}, tool:null, hover:null,  sim:{ pop, jobs, foodProd, housing, tension } }
terrain: 0 oceano, 1 água doce, 2 areia, 3 grama, 4 fértil, 5 floresta,6 pedra, 7 montanha · resource: 0 nada, 1 caça, 2 peixe, 3 cobre,4 ferro, 5 carvão

5.4 Dicionário de eventos
sim:tick (ÚNICO emitido pelo kernel) · mods:changed · inst:adopted ·inst:reformed · era:ready · era:advanced · chron:entry ·border:changed · tile:changed · ui:toast · decision:open ·decision:closed · colony:collapsed · game:wonO bus aceita qualquer string; módulos emitem os demais nomes.

5.5 RNG de referência (obrigatório)
function xmur3(str){ let h=1779033703^str.length;  for(let i=0;i<str.length;i++){ h=Math.imul(h^str.charCodeAt(i),3432918353);    h=(h<<13)|(h>>>19); }  return function(){ h=Math.imul(h^(h>>>16),2246822507);    h=Math.imul(h^(h>>>13),3266489909); return (h^=h>>>16)>>>0; }; }function mulberry32(a){ return function(){ a|=0; a=(a+0x6D2B79F5)|0;  let t=Math.imul(a^(a>>>15),1|a);  t=(t+Math.imul(t^(t>>>7),61|t))^t;  return ((t^(t>>>14))>>>0)/4294967296; }; }// child(label): const h = xmur3(String(label))(); makeRng((seed ^ h) >>> 0);
5.6 RNG sob load()/reset()
reset(newSeed?) e load() REcriam OIKOS.rng a partir da seed (nova ourestaurada). OIKOS.rng não é serializado.
Após load(), draws do stream principal recomeçam da seed; o determinismoESTRUTURAL se preserva porque cada módulo usa rng.child('<label>'),derivado só da seed.
5.7 Fonte de verdade da pausa
loop.pause()/resume() são os ÚNICOS mutadores e espelham em state.paused.isPaused() === state.paused. resume() zera o acumulador (sem rajada).
Após load(), o loop retoma PAUSADO; o integrador decide o resume().
5.8 Leitura viva de consts
O loop lê consts.TICK_MS/SAVE_KEY a cada uso — sobrescrevê-los antes(ou durante) a execução altera o comportamento sem hacks.
5.9 Ordem e assinaturas dos hooks (com semântica do tick — D13)
Semântica do tick: state.year++ → update() de TODOS os módulos →bus.emit('sim:tick', {year}). update() PRODUZ o ano; handlers desim:tick CONSOMEM o ano consolidado. Módulos NÃO assumem que sim:tickprecede update() no mesmo tick.
init() sem args · update() sem args (lê state) · draw(dt) com dt em ms.
use() após start(): permitido; roda init() imediatamente.
5.10 Semântica de runtime
D15: emit itera sobre CÓPIA do array de handlers.
D16: start() é idempotente.
D17: seed de boot padrão 1337; reset() sem argumento reutiliza aseed vigente. UI futura define seeds de partida via reset(n).
D18: localStorage indisponível (file:// restrito) → fallback emmemória da sessão; save() não lança; load() retorna false em sessãovazia e não corrompe o estado vigente em caso de falha.
D28: Mods vivem em closure VOLÁTIL (o schema v1 não tem campo de mods);fontes persistentes (instituições, via S8) re-registram após load.
6. Especificações dos módulos
S1 — KERNEL — IMPLEMENTADO E AUDITADO ✅
Fundação determinística; zero lógica de jogo. API e schema da seção 5.Harness: 11/11 PASS (determinismo, range, streams, roundtrip + schemaVersionrejeitado, 5.6, bus, loop, 5.7, 5.8, use()/5.9, performance).Integração: extrair o bloco entre marcadores para o index.html.

S2 — WORLDGEN — IMPLEMENTADO E AUDITADO ✅ (registros D26, D29, D30)
Ilha determinística por seed: fBm 4 oitavas → máscara radial → rio greedy dopico montanhoso ao mar (lago em depressão; sem nascente = hasRiver:false,hidrelétrica some do menu futuro) → solo fértil (ruído, amplificado na várzea)→ floresta → veios minerais (cobre raso, carvão médio, ferro alto) → caça nafloresta, peixe na água de beira.Preenche state.geo = { riverLength, hasRiver, forestTiles, fertileTiles, oreVeins, mountainness, landTiles }. Escreve SOMENTE em tiles.terrain,tiles.resource e geo. Streams por label: 'elev', 'fert', 'forest','ore' (o stream 'ore' cobre TODOS os resources — D24) e 'world' (premissasda ilha sorteadas por seed — D30).Implementação auditada: nível do mar por QUANTIL, com alvo de terra ∈ [1010, 1350]e floresta ∈ [12%, 26%] sorteados por seed (D30), margem costeira 3 tiles,célula fBm base 4, máscara smoothstep, hasRiver = rio que alcança o mar (D26);veios restritos a PEDRA e MONTANHA (D29, supersede D27).Aceite: hash FNV-1a do terrain estável e idempotente por seed, distintoentre seeds; mar em 100% do perímetro; terra ≥ 900 tiles; floresta ∈ [8%, 30%]da terra; hasRiver === true em ≥ 20/30 seeds (asserido pelo harness — D20);30 seeds sem exceção; generate não altera campo algum além de tiles e geo;determinismo estrutural: após load(), generate() reproduz a mesma ilha.

S3 — RENDER (adendo da rodada 3 emitido)
Canvas 2D isométrico 2:1 (telaX=(x−y)·32, telaY=(x+y)·16), picking exatodo diamante (unproject inverso). Export: OIKOS.Render = { draw, project, unproject, isZoneable, paintOrder, visibleTiles } + use('Render',{draw})sem update (leitor puro). Camadas: oceano de fundo → terreno → marcadoresde resource → fronteira → edifícios por paintOrder (placeholder de caixa3-tons; desempate (x+y) ASC, y ASC — casa em (10,10) oclui (11,9)) →overlay hover/ghost verde-vermelho. Câmera em state.camera: pan por arrasto,zoom na roda com ponto-fixo no cursor, clamp [ZOOM_MIN, ZOOM_MAX];state.hover atualizado no mousemove. Culling com margem de 1 tile + alturade sprite. Variação visual por tile via cache chaveado por seed (não porrng.child a cada frame). Degradação: cor da água interpolada porpollution[]. draw() altera SOMENTE camera e hover.Aceite: roundtrip project→unproject erro 0; picking nos 4 cantos dodiamante; paintOrder correto; tabela-verdade de isZoneable; culling saudável;zoom com ponto-fixo invariante; snapshot-diff; 1000×(unproject+visibleTiles)< 5 ms; smoke visual no browser < 17 ms/frame.

S4 — NÚCLEO ELÍPTICO — IMPLEMENTADO E AUDITADO ✅ (emenda D21 na extração)
OIKOS.Elliptic = { K, sn, cn, dn, Pendulum, couple }; clamp k ∈ [0, 0.9999],nunca lança; k negativo usa |k| (as funções dependem só de k²); u não-finitotratado como 0 (D24). cn = cos(phi), dn = sqrt(1−k²·sn²) a partir daamplitude phi da descida de Landen (base única, sem ramificação de sinal).Pendulum standalone {omega,k,u0} (k congelado, não escreve no state) OUbound {id,omega} (resolve state.pendulums[id] a CADA acesso — sobrevive areset(); lê k vivo; escreve u de volta). Superfície do pêndulo: u, k,pos (= sn(u,k)), vel (= omega·cn(u,k) — D21), step(dt) (u += omega·dt;dt em anos, omega em rad/ano), period() (= 4·K(k)/ω; extensão aceita, D21).couple(ps, strength, dt): m = média dos p.pos (antes de qualquer mutação);p.u += strength·dt·(m − p.pos). amp() NÃO é exportada.Aceite (D19): sn(u,0)===sin(u) < 1e-9; K(0)=π/2 (erro < 1e-14); Kestritamente crescente em toda a faixa clampada; K(0.9999)/K(0) ≥ 3.5;simetrias sn(−u)=−sn(u), cn/dn pares; identidades sn²+cn²=1 e dn²+k²·sn²=1(erro < 1e-12); periodicidade sn(u+4·K(k),k)=sn(u,k); entradas inválidas nãolançam nem produzem NaN; bound sobrevive a reset() sem closure presa;standalone isolado do state; 1000 sn < 5 ms; couple 10.000 passos sem NaN.

S5 — MOTOR DE MODIFICADORES (adendo da rodada 3 emitido)
OIKOS.Mods = { push, get, removeBySource } — closure VOLÁTIL (D28): o schemav1 não tem campo de mods; fontes persistentes (instituições) re-registram apósload via S8. Biblioteca pura: sem use(), sem escrita no state, zero DOM.

push({id, source, target, kind:'add'|'mult', value|fn(snapshot), expiresAt?}) → mod|null// valida: id/source/target strings; kind ∈ {add,mult}; value finito OU fn// função (senão console.error + null, sem emitir); id existente SUBSTITUI// preservando a posição de fila (reforma não reordena precedência);// expiresAt = ano de jogo (ausente = permanente); sucesso → 'mods:changed' {target}get(target, snapshot?) → número// lazy-sweep de expiresAt <= year; ordem (D28): TODOS os 'add' por idade de// adoção, depois TODOS os 'mult' por idade; fn(snapshot) avaliado no get,// retorno não-finito → mod ignorado + console.error; nunca muta a base; nunca lançaremoveBySource(sourceId) → contagem removida   // emite 'mods:changed' se removeu
fn(snapshot) é o que torna decisões sensíveis a contexto.Aceite: motor vazio devolve o valor base; ordem add→mult provada; doisadds somam / dois mults compõem por ordem de push; fn recalcula a cada get;removeBySource remove só a fonte; expiração com lazy-sweep; re-push substituisem duplicar e mantém precedência; validações rejeitam sem emitir; evento compayload correto; 1000 pushes + 1000 gets sem NaN, get médio < 5 µs.

S6 — CRÔNICAS — IMPLEMENTADO E AUDITADO ✅ (emenda D22 na extração)
OIKOS.Chron = { log, query, timeline, probe }. Escuta de ticksEXCLUSIVAMENTE via bus.on('sim:tick') — nunca via update() (D13).log(entry): preenche id ('c'+contador, monotônico, reidratado do maiorid pós-load por troca de identidade de state — D23), year, era; validatype ∈ {ato, evento, consequencia, desastre, marco}; inválido →console.error + retorna null (nunca lança — D25); grava emstate.chronicle e emite chron:entry.Schema canônico da entrada (D23): {id, year, era, type, titulo, prosa, ato, efeitoMedido, refs} — campos text e source NÃO fazem parte; stringssão responsabilidade do chamador (D25).query({era,type,source}) — source casa por refs OU por ato.timeline() — cópia ordenada por year, desempate pela ordem de emissão.probe({source, every, fn}) → {cancel()}: nos anos (year − registro) % every === 0,fn(year,state) não-nulo gera entrada consequencia com refs:[source] Eato: source (D22 — espinha dorsal do epílogo S11). Sondas são VOLÁTEIS;o módulo dono re-registra após load.Aceite: ids sequenciais sem reuso pós-load; timeline ordenada e estável(cópia); query por era/type/source correta isolada e combinada; sonda disparanos anos certos, gera consequencia vinculada e cancel() interrompe;roundtrip preserva chronicle, sondas fora do JSON; 200 entradas + 10 sondascom tick < 2 ms; reage a sim:tick mesmo sem loop.

S7 — SIMULAÇÃO
Por tick (1 ano = 2 s): consumo → produção via Mods.get → excedente →crescimento logístico limitado por moradia → empregos → fome (pop cai +crônica). Era 1 jogável: acampamento, cabana de coletor, pesca (rio/mar),lascamento (perto de pedra), trilha; conhecimento ≥ limiar → era:ready.Degradação: colheita excessiva consome floresta; solo perde fertilidade;poluição em raio, decaimento lento (base da reversibilidade cara).Aceite: pop em S, sem explosão; fome forçada derruba pop e registra;todo número passa por Mods.

S8 — ERAS & INSTITUIÇÕES
Data-driven: ERAS[6], INSTITUTIONS[~12] com {id, era, titulo, prosa, pros, cons, mods[], gates[], custoReformaBase}. Transição: era:ready →pausa → carta de decisão material (dimensionada por state.geo) → 1–2instituições → Mods.push + Chron.log (com titulo/prosa/ato — D23).Responsável por re-registrar os Mods das instituições vigentes apósload() (D28). Gates: lei adotada bloqueia opções futuras (chefiaaloca → sem ligas livres → sem guildas → só trabalho autoritário). Reforma:custo = base × (1+idade/fator) × (1−legitimidade/100) × K(k)/K(0) (tetooperacional ≈ 3.59× — D19); janela constitucional = crise reduz ktemporariamente.

Era	Par institucional	Vantagem / Restrição
Pedra Lascada	Terra comum ↔ Chefia aloca	fronteira orgânica grátis ↔ zoneamento fora de controle
Semeadura	Celeiro coletivo ↔ Excedente privado	resistência à fome ↔ sem comércio interno
Primeiro Metal	Corveia ↔ Trabalho pactuado	construção 2× e custo zero ↔ tensão contínua
Engrenagens	Guildas ↔ Mercado livre	qualidade e estabilidade ↔ crescimento lento
Vapor	Jornada longa ↔ Jornada regulada	produção ++ ↔ saúde cai, revoltas
Contemporânea	Constituição ecológica ↔ Carta da extração	a Casa regenera ↔ produção livre, colapso possível
Aceite: gate testável (adotar A → B some da era seguinte); custo dereforma cresce com idade e k; re-registro pós-load provado; painelConstituição alimentado via bus.

S9 — FRONTEIRA & EXPANSÃO
Tiles fora da fronteira não são zoneáveis (toast de recusa). Orgânica:avança por atratividade (água/fértil), raio = f(pop, contentamento), semcontrole. Decreto: paga ouro + legitimidade; montanha ×2; custo cresce comdistância ao centro. Tiles distantes: imposto × 1/(1+dist/c), tensão sobe.Aceite: instituição vigente modula o modo; overlay visível; ilha esgota.

S10 — DECADÊNCIA & COLAPSO
Relógio de estagnação por era; enche sob tensão/fome/poluição extrema,velocidade × k. Completou → 3 estágios de decadência (−15/−30/−50% viaMods, abandono visual, desertificação). Persistiu → colapso: êxodo, prédiosviram terreno ruína permanente, colony:collapsed, crônica registra.Estabilidade nunca é número: só eventos-sintoma em limiares cruzados.Aceite: escassez forçada → espiral → colapso; ruínas sobrevivem asave/load; sintoma dispara 1× por limiar.

S11 — FINAIS & EPÍLOGO
Marco final: avaliar harmonia + pop + decadência → Florescimento(3 variantes) | Cicatrizada | Colapso narrado. Gerador de epílogo:agrupa Chron.timeline() por era, preenche templates com efeitoMedidoreal e vínculos ato→consequencia (D22), fecha com estado da ilha(floresta %, poluição, o que persistiu). 300–500 palavras, tommítico-poético. Sandbox continua após o final.Aceite: partidas diferentes → epílogos diferentes (diff automatizado);nenhum placeholder vaza.

S12 — UI/HUD
Topbar (recursos, ano, era); toolbar por era, hotkeys 1–6, ESC; tooltip detile; toasts; painéis Crônicas e Constituição (custo de reforma ao vivo);modal de decisão (pausa o tick); notícias diegéticas dos sintomas.Paleta terrosa/verde-oliva, fonte com caráter, tudo navegável por teclado.

S13 — POLISH (itens independentes)
Limbo no horizonte + fumaça/nuvens Lissajous (cn/sn) + mar com dn(S3) · dia/noite por tint global · carros/barcos em trilhas · áudioWebAudio procedural (sem arquivos) · nova casa sobre as ruínas (S2+S10).

Landmarks (1/era, únicos): Círculo dos Antepassados → Grande Celeiro →Forja Sagrada → Cidadela do Saber → Grande Fábrica ou Terminal Ferroviário →Arcologia-Jardim ou Torre-Fundição. Maiores que prédios normais, comanimação própria e bônus permanente.

7. Matemática de referência
// K(k) — integral elíptica completa, AGM (~6 iterações)const K = k => { let a=1, b=Math.sqrt(1-k*k);  while(Math.abs(a-b)>1e-14) [a,b]=[(a+b)/2, Math.sqrt(a*b)];  return Math.PI/(2*a); };// sn(u,k) — AGM + descida de Landen; cn = cos(phi); dn = sqrt(1−k²·sn²)function sn(u,k){ const A=[1], B=[Math.sqrt(1-k*k)], C=[k];  while(Math.abs(A.at(-1)-B.at(-1))>1e-13 && C.length<12){    const a=A.at(-1), b=B.at(-1);    A.push((a+b)/2); B.push(Math.sqrt(a*b)); C.push((a-b)/2); }  const n=C.length-1; let phi=(2**n)*A[n]*u;  for(let i=n;i>=1;i--) phi=(phi+Math.asin((C[i]/A[i])*Math.sin(phi)))/2;  return Math.sin(phi); }
Período do pêndulo: 4·K(k)/ω — diverge quando k→1 (fundamento teóricodo relógio de decadência e do custo de reforma).
Nota operacional (D19): com o clamp k ∈ [0, 0.9999], o escalonamentomáximo é K(0.9999)/K(0) ≈ 3.59. A divergência de K permanece como tese dodesign; dentro do jogo, rigidez máxima multiplica custos e períodos por ~3.6.
Custo de reforma: base × (1 + idade/fator) × (1 − legitimidade/100) × K(k)/K(0).
k (rigidez) sobe com: tensão, fome, poluição extrema, instituições rígidas.Desce com: participação, bem-estar, crises (janela constitucional, temporária).
8. Processo de delegação e integração
8.1 Template de prompt de delegação (genérico)
Você é o desenvolvedor responsável por UM módulo do projeto OIKOS, descritona CARTA MESTRA abaixo. Regras absolutas:1. Implemente apenas o módulo {{S#}} (seção 6.{{n}}). Nada além dele.2. O Contrato comum (seção 4) e o Núcleo canônico (seção 5) são imutáveis.3. Proibido Math.random e DOM (exceto S3/S12). Use OIKOS.rng/makeRng.4. Entregue conforme a seção 9.5. Ambiguidade: escolha o mais simples e registre // DECISÃO:.6. Proibida inferência silenciosa: o que faltar, declare // LACUNA: e   escolha o mais simples. Contexto do ambiente (memórias, grafos, outras   conversas) NÃO cria requisitos nem decisões; onde conflitar, prevalece   a carta, e o conflito vai em // LACUNA:.7. Plugins de ambiente (estilos de saída, memória, grafos de contexto)   não alteram este contrato. Única fonte de verdade: a carta (+ adendo).   Economia de resposta NUNCA corta entregáveis contratuais (código entre   marcadores, harness, tabela PASS/FAIL, notas). O estilo da conversa é   irrelevante; o formato do ARQUIVO é contratual.8. Se a delegação marcar "KERNEL NECESSÁRIO", embuta o bloco do kernel   fornecido VERBATIM antes do seu módulo (é runtime já auditado); o   integrador extrairá apenas o bloco do SEU módulo.=== CARTA MESTRA ===(conteúdo integral deste arquivo)=== ADENDO DO MÓDULO ===(quando houver — complementa a spec; em conflito, vale o adendo)=== KERNEL S1 — BLOCO REAL ===(quando "KERNEL NECESSÁRIO")
8.2 Ordem de delegação
Rodada	Specs	Paralelo	Estado
1	S1	—	✅ auditado
2	S2 + S4 + S6	sim	✅ auditado (emendas D21/D22 aplicam-se na extração)
3	S3 + S5	sim	✅ auditado e integrado (emendas D35/D36 na S3, D37/D38 na S5)
4	S7	—	delegável (rodada 3 integrada)
5	S8 + S9	sim	—
6	S10 + S11 + S12	sim	—
7	S13, item a item	sim	—
8.3 Fluxo por rodada
Delegar → testar harness localmente → auditar → emendar (aprovado) →integrar → rodar o jogo → próxima rodada. Nunca delegar a rodada seguintecom a anterior não integrada.Delegação oficial: prompts em docs/delegacoes/, montados portools/monta-delegacao.js, que injeta a carta e o RUNTIME INTEGRADO vigentesno envio: o kernel sozinho quando o módulo é independente, e os blocosintegrados inteiros quando o módulo depende de outros já auditados — o S7consome Mods, Chron e a ilha do Worldgen, e seu harness não roda sem eles.Nada é duplicado em novo local: a fonte é sempre o index.html, recortadoentre marcadores na hora do envio (D32).

8.4 Checklist de auditoria
 Sem Math.random, sem DOM fora de S3/S12, sem libs
 Schema/eventos/consts respeitados (nenhum renome, nenhuma extensão silenciosa)
 Marcadores de extração presentes e corretos
 Harness roda standalone e dá PASS em todos os critérios da spec
 Escopo fechado (nada de módulos vizinhos "de brinde")
 // DECISÃO: conformes com a seção 11; // LACUNA: revisadose, se legítimos, transformados em patch desta carta
8.5 Anexo A — Runtime S1 (canônico; extraído do código auditado)
Para toda delegação que consumir o kernel. Fatos vigentes — CONSUMA, não recrie:

Exports: OIKOS.{consts, makeRng, rng, state, makeState, bus, use, loop,         save, load, reset, serialize, deserialize}- rng: {seed, f(), i(n), pick(arr), child(label)}; child deriva da seed de  construção (não consome o pai, estável em qualquer momento).- bus.on(evt,fn) RETORNA unsubscribe; emit itera sobre cópia; exceção num  handler não impede os demais.- Ordem do tick (D13): state.year++ → update() dos módulos →  emit('sim:tick', {year}). update() PRODUZ; o handler CONSOME o ano fechado.- reset()/load() recriam OIKOS.rng (5.6); load() deixa o loop pausado (5.7);  consts lidos vivos (5.8); start() idempotente; boot seed 1337 (D17).- Persistência best-effort com fallback em memória (D18).- Módulo registra-se com OIKOS.use('<Nome>', {init, update, draw}) se  precisar de ciclo de vida; biblioteca pura apenas anexa ao OIKOS.
9. Formato de entrega
Cada devolução = um arquivo HTML rodável por duplo clique, com o móduloentre marcadores exatos:

/* ===== OIKOS S{n} {NOME} — INÍCIO ===== */... código do módulo .../* ===== OIKOS S{n} {NOME} — FIM ===== */
Seguido do harness (fora dos marcadores) que imprime tabela PASS/FAIL no DOMe no console. Acompanham: lista de exports, decisões // DECISÃO: resumidas,lacunas // LACUNA: listadas, confirmação de ausência de Math.random.O integrador extrai os blocos para o index.html na ordem do grafo dedependências; emendas aprovadas aplicam-se NA EXTRAÇÃO, marcadas// EMENDA v{n} D{x}:.Nomes canônicos dos marcadores: S1 KERNEL · S2 WORLDGEN · S3 RENDER ·S4 ELLIPTIC · S5 MODS · S6 CHRONICLES · S7 SIM · S8 ERAS · S9 BORDER ·S10 DECAY · S11 EPILOGUE · S12 UI · S13 POLISH. Padrão: nome curto dodomínio, casando com o export quando há export único.

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
D12	Proibida inferência silenciosa; lacunas como // LACUNA:; contexto externo não prevalece sobre a carta	decisões por palpite contaminam módulos a jusante; correção tardia é cara
D13	Ordem do tick: year++ → update() → emit('sim:tick'); payload = ano processado	separa produção (update) de consumo (handlers); handlers veem estado consolidado
D14	makeRng público	kernel o usa em reset/load; útil ao integrador e a módulos
D15	emit itera sobre cópia de handlers	on/off durante emit é edge case real
D16	start() idempotente	múltiplos usos não duplicam rAF
D17	Seed de boot 1337; reset() sem arg reutiliza seed	determinismo; partida real nasce de reset(n) pela UI
D18	localStorage indisponível → memória, sem lançar	carta exige duplo clique; persistência best-effort
D19	Clamp k ∈ [0, 0.9999] como operacionalização; aceite S4 por fator K(0.9999)/K(0) ≥ 3.5	aceite original ("K(0.999) > 10") era estimativa não verificada e inalcançável; devolução S4 declarou a lacuna corretamente (D12 funcionou); a divergência permanece como tese (seção 7)
D20	Rio presente em ≥ 20/30 seeds; nascente exige pico montanhoso; harness ASSERE o limiar	variedade de premissa > uniformidade; ~30% das ilhas sem hidrelétrica é premissa legítima
D21	Pendulum expõe get vel = omega·cn(u,k); period() aceito como extensão	a carta fixa a superfície de export; S8/S10/render consomem vel
D22	Sonda grava consequencia com refs:[source] E ato: source	espinha dorsal do epílogo (S11 agrupa consequência→ato)
D23	Entrada canônica: titulo/prosa/ato/efeitoMedido/refs; campos text e source NÃO fazem parte; contador de ids reidrata por troca de identidade de state	harnesses são o exemplo que módulos futuros copiam; kernel só reatribui state em reset/load — gatilho correto e barato
D24	Stream 'ore' cobre TODOS os resources (caça, peixe, veios); u não-finito → 0 em sn/cn/dn	domínios de tiles disjuntos tornam a correlação inócua; evita label fora do contrato; coerente com "nunca lançar"
D25	log() valida apenas type; strings são responsabilidade do chamador	simplicidade; sem normalização dentro de Chron
D26	Implementação S2 aceita: quantil adaptativo de nível do mar, floresta por contagem-alvo 18%, margem costeira 3 tiles, célula fBm base 4, máscara smoothstep, hasRiver = rio que alcança o mar	aceites estruturais cumpridos por construção; caráter visual é livre
D27	Veios minerais em TODA a terra (não restritos a PEDRA/MONTANHA), ratificado pelo dono	revisar no balanceamento da fase 2 se a premissa "ilha montanhosa = rica em minério" precisar voltar
D28	Mods em closure VOLÁTIL; fontes persistentes re-registram após load (via S8); expiração por ano com lazy-sweep no get; ordem: todos os 'add' por idade, depois todos os 'mult' por idade; re-push substitui preservando precedência	decorrência do schema v1 (sem campo de mods); alternativa (patchear o kernel auditado) é mais cara; veto possível até S7
D29	Veios minerais restritos a PEDRA e MONTANHA (supersede D27)	"ilha montanhosa = rica em minério" é premissa no sentido da seção 2, com a mesma forma de "sem rio → sem hidrelétrica"; com veios em toda a terra, geo.mountainness perde vínculo causal com geo.oreVeins e a S9 perde o prêmio de expandir para a montanha. É a revisão que a própria D27 adiou para a fase 2, já implementada e asserida (harness S2, critério 13). PEDRA conta junto com MONTANHA: 30/30 seeds com oreVeins > 0, inclusive ilhas com 2% de montanha
D30	D-variabilidade RATIFICADA nos números implementados: alvo de terra ∈ [1010, 1350] e floresta ∈ [12%, 26%] sorteados por seed via child('world'); label 'world' incorporado ao contrato de streams da S2	piso 1010 e não os 950 propostos porque o quantil é calculado ANTES de o rio converter terra em água doce — 60 tiles de folga mantêm terra ≥ 900 mesmo com rio longo; ilha de tamanho fixo é menos premissa que ilha que varia (seção 2). Encerra o pendente D-variabilidade; 'world' é aditivo e não consome draws dos streams de contrato (child deriva da seed de construção)
D31	Harness executável sob Node; funções puras sem contexto de canvas; SKIP restrito a critérios [browser]	aceite tem de ser executável no pipeline do executor; SKIP ilimitado deixaria um draw() quebrado passar, então a fronteira é o que é declaradamente visual; a rodada 2 só funcionou por coincidência de formato, não por contrato
D32	Delegação via monta-delegacao.js; kernel nunca duplicado em novo local	delegar contra kernel morto é contaminação silenciosa, e o kernel já vive em duas fontes canônicas (index.html e a devolução auditada do S1)
D33	S3: visibleTiles devolve Int16Array e paintOrder troca índices y*MAP+x, não objetos {x,y}; isZoneable = dentro do mapa E terreno ≥ 2 (montanha inclusa, água fora)	índices são a convenção de indexação da própria carta (5.3) e o que torna o teto de 5 ms alcançável — objeto por tile daria ~1,1 milhão de alocações no aceite; montanha zoneável é coerente com o "montanha ×2" do decreto na S9; a checagem de fronteira da S9 soma-se depois sem reescrever nada
D34	S5: em get(target, snapshot?) a base é snapshot[target] quando número finito, e 0 quando não houver snapshot ou a chave; o snapshot NUNCA é escrito	o aceite exige "motor vazio devolve o valor base", mas a assinatura não traz parâmetro de base; ler do próprio snapshot cumpre o aceite sem inventar parâmetro e sem mudar a assinatura que a S7 vai consumir
D35	Emenda S3 na extração: tile de oceano com pollution > 0 deixa de ser pulado no desenho	a spec pede cor da água interpolada por pollution[]; pular terrain 0 confiando no retângulo de fundo deixava oceano poluído com cor de mar limpo (achado 1 da auditoria, severidade média)
D36	Emenda S3 na extração: a centralização da câmera volta a valer quando o kernel reatribui o estado (reset/load)	a flag de centralização vivia no módulo e sobrevivia ao reset, deixando a câmera fora de lugar na ilha nova (achado 2 da auditoria)
D37	S5: a closure de Mods ZERA quando o kernel reatribui o estado (reset/load), pelo mesmo gatilho de identidade que a S6 usa; SUPERSEDE a // DECISÃO: em contrário registrada na devolução	a D28 exige que fontes persistentes re-registrem após load — cláusula que só faz sentido se o motor começa vazio, e a leitura anterior a tornava letra morta; sem zerar, instituições de uma partida anterior sobrevivem no save carregado e alteram seus números em silêncio, sem que nada as remova (achado 1 da auditoria do S5, severidade alta)
D38	Contrato de emissão de mods:changed: payload sempre { target }; re-push que troca de alvo emite para o alvo ANTIGO e para o novo; removeBySource emite um evento por alvo afetado	forma única de payload poupa o ouvinte de tratar dois formatos; sem evento no alvo antigo, quem mantém cache daquele alvo nunca fica sabendo que mudou (achados 2 e 4 da auditoria do S5)
12. Status
Módulo	Spec	Delegado	Auditado	Integrado
S1 Kernel	✅ v1.5	✅	✅ (código + harness 11/11)	✅ integrado no index.html (sessão #1)
S2 Worldgen	✅ v1.5	✅	✅ (código + harness 13/13 medido; D26, D29, D30)	✅ integrado no index.html (sessão #1)
S3 Render	✅ v1.5 + adendo	✅	✅ (código + harness 9/9 +3 SKIP [browser]; parecer do auditor #2; D33, D35, D36)	✅ integrado no index.html (sessão #1)
S4 Elíptico	✅ v1.5	✅	✅ (código + harness 11/11 medido; emenda D21)	✅ integrado no index.html (sessão #1)
S5 Mods	✅ v1.5 + adendo	✅	✅ (código + harness 12/12 +0 SKIP; parecer do auditor #2; D37, D38)	✅ integrado no index.html (sessão #1)
S6 Crônicas	✅ v1.5	✅	✅ (código + harness 9/9; emenda D22)	✅ integrado no index.html (sessão #1)
S7 Sim	✅ v1.5	☐	☐	☐
S8 Eras	✅ v1.5	☐	☐	☐
S9 Fronteira	✅ v1.5	☐	☐	☐
S10 Decadência	✅ v1.5	☐	☐	☐
S11 Epílogo	✅ v1.5	☐	☐	☐
S12 UI	✅ v1.5	☐	☐	☐
S13 Polish	✅ v1.5	☐	☐	☐
13. Histórico de versões
Versão	Conteúdo
v1.0	Design fechado; specs S1–S13; processo de delegação
v1.1	Seções 5.6–5.9; D9–D11 (RNG sob load/reset, pausa, consts vivos)
v1.2	D12 (anti-inferência, // LACUNA:); regra de plugins no contrato e no template
v1.3	Pós-auditoria S1: D13–D18; 5.10; makeRng público; semântica do tick
v1.4	Consolidação: carta sincronizada com o código auditado; specs S2/S4/S6 absorvem adendos; 8.5 Anexo A; seção 13
v1.5	Pós-auditoria rodada 2: D19–D28; aceites S4/S2 corrigidos; spec S5 consolidada com contrato de Mods (D28); schema canônico de crônica (D23); emendas na extração marcadas // EMENDA v1.5 D{n}:; D-variabilidade pendente documentada
v1.6	Pós-integração rodada 2: D29 (veios restritos a PEDRA e MONTANHA, supersede D27) e D30 (D-variabilidade ratificada — terra [1010, 1350], floresta [12%, 26%], label 'world' no contrato de streams da S2); seção 6 (spec S2) e seção 12 sincronizadas
v1.7	Seção 14 — versionamento da carta com critérios de aceite: incremento de 0,1 por lote aceito, o que incrementa e o que não, e a regra de remedição (14.5 item 7)
v1.8	Contratos de harness: seção 4 item 9 (execução sob Node, funções puras sem canvas, SKIP restrito a [browser], linha de resumo "x/x PASS (+y SKIP [browser])"); seção 8.3 delegação oficial via monta-delegacao.js; seção 9 nomes canônicos dos marcadores; D31 e D32
v1.9	Pós-auditoria S3 (rodada 3): D33 (Int16Array/índices e tabela de isZoneable), D34 (base do get da S5), D35 e D36 (emendas S3 na extração — poluição em oceano e centralização da câmera); seção 4 item 9c passa a exigir o sufixo de SKIP só quando y > 0
v1.10	Pós-auditoria S5 (rodada 3): D37 (closure de Mods zera na troca de identidade do estado, supersedendo decisão local da devolução) e D38 (contrato de emissão de mods:changed); emendas S5 aplicadas na extração
v1.11	Seção 8.3: o montador injeta o RUNTIME INTEGRADO vigente, não só o kernel — kernel sozinho para módulo independente, blocos integrados inteiros para módulo de dependência serial (caso do S7). Extensão de D32; nada passa a ser duplicado, a fonte segue sendo o index.html lido no envio
Changelog v1.4 → v1.5 (para validação rápida):

S1/S2/S4/S6 marcados como implementados e auditados, com as emendas de extração indicadas (D21 na S4, D22 na S6).
S4: aceite substituído (D19 — o alvo K(0.999) > 10 era matematicamente inalcançável com o clamp); superfície do pêndulo agora inclui vel e period() explicitamente.
S2: aceite do rio fixado em ≥ 20/30 asserido pelo harness (D20); implementação auditada incorporada como registro (D26/D27).
S5: spec consolidada com o contrato completo de Mods — volatilidade, ordem add→mult, re-push com precedência (D28) — pronta para a rodada 3.
S6: schema canônico da entrada com titulo/prosa (D23); log() não valida strings (D25); sonda grava ato (D22).
Seção 7: nota operacional do teto de escalonamento (~3.59×).
Seção 9 + 11: emendas aplicam-se na extração, marcadas // EMENDA v1.5 D{n}:; D19–D28 registradas; D-variabilidade documentada como pendente.
Seção 12: status real — integração em andamento pela sessão agêntica #1; rodada 3 delegável.

14. Versionamento da carta (critérios de aceite)
14.1 Regra de incremento
Toda alteração ACEITA desta carta incrementa a versão em exatamente 0,1:1.5 → 1.6 → 1.7 → 1.8 → 1.9 → 2.0 → 2.1 → … Sem salto e sem versão pulada.O número inteiro NÃO é marco: v2.0 é apenas o sucessor de v1.9. Em especial,a versão da carta NÃO tem relação com as Fases do roteiro (seção 10) —carta v2.0 ≠ Fase 2.
14.2 Um lote aceito = um incremento
O incremento conta ATOS DE ACEITE do dono, não linhas alteradas. Uma rodadaque aceita três decisões de uma vez sobe 0,1, não 0,3. Dois aceites emmomentos distintos são dois incrementos, ainda que no mesmo dia.
14.3 O que incrementa
Decisão nova na seção 11 · mudança em spec de módulo (seção 6), critérios deaceite incluídos · mudança no núcleo canônico (seção 5: API, schema, consts,dicionário de eventos) · mudança em princípio de design (seção 2) ou emrestrição técnica (seção 3) · mudança no processo de delegação (seção 8) ·mudança nesta seção 14.
14.4 O que NÃO incrementa
Seção 12 (status): é placar, não contrato, e muda a cada integração ·correção de grafia ou de formatação que não altera significado ·preenchimento de célula já prevista em tabela existente.
14.5 Critérios de aceite — TODOS obrigatórios
1. Motivo registrado: decisão nova entra na seção 11 com a coluna Motivo   preenchida.2. Append-only preservado: decisão superada NÃO é apagada; permanece no   registro e a sucessora declara "supersede D{n}" (padrão D27 → D29).3. Cabeçalho coerente: o campo "Versão:" do topo bate com a última linha da   seção 13. Divergência é defeito da carta, e é verificável por leitura.4. Linha nova na seção 13 nomeando o que mudou.5. Sem código no mesmo commit: alteração de carta viaja sozinha. Se um módulo   precisa mudar junto, são dois commits.6. Mensagem de commit lista as seções tocadas.7. Se a alteração invalida critério de aceite já cumprido, o módulo afetado   volta para ☐ na seção 12 e o harness é re-rodado antes de voltar a ✅.
O item 7 é o que impede a carta de passar por cima de um módulo já auditado:mudar a régua obriga a remedir.