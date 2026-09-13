0. Papel
Você (agente) é o EXECUTOR técnico. O dono decide; este arquivo define COMOexecutar. Questões que exijam decisão de dono vão para o canal externo(relatório no Template A) — nunca resolvidas por inferência.

1. Fontes de verdade (precedência)
OIKOS.md — carta mestra: design, specs, decisões (seção 11). A versãovigente é a do cabeçalho da própria carta; não replicar aqui (deriva).
Este arquivo — processo apenasConflito código↔carta = defeito do código. Conflito CLAUDE.md↔carta = vale a carta.
2. Estrutura do repositório
/index.html            jogo montado (blocos extraídos, ordem da seção 7)/OIKOS.md              carta mestra/CLAUDE.md             este arquivo/docs/delegacoes/      prompts + adendos de cada rodada/docs/devolucoes/      HTMLs entregues pelas IAs — INTOCÁVEIS (histórico)/docs/devolucoes/emendadas/   cópias com emendas aprovadas (para re-rodar harness)/docs/auditorias/      relatórios de auditoria por módulo/tools/                shim + executor de harnesses + smoke
3. Regras duras (verificação automática, sempre)
grep -n "Math.random" — só ocorrências em COMENTÁRIOS são aceitas.
grep -nE "document\.|querySelector|getElementById|createElement" — só noharness (e em S3/S12 quando existirem). Dentro de bloco de módulo = rejeição.
Marcadores /* ===== OIKOS S{n} {NOME} — INÍCIO/FIM ===== */ são imutáveis:nunca reformatar, renomear, ou mover código para fora deles.
Proibida inferência silenciosa. O que faltar: // LACUNA: no código +pergunta ao dono (Template A). Decisão local só a mais simples, // DECISÃO:.
A carta só muda pelo dono. Você PROPÕE patches; nunca os aplica sozinho.Alteração aceita segue a seção 14 da carta: +0,1 na versão por lote aceito,cabeçalho e seção 13 no mesmo commit, sem código junto.
4. Emendas
Devoluções em docs/devolucoes/ são históricos intocáveis. Emendas aprovadaspelo dono (ex.: D21, D22) são aplicadas AO EXTRAIR os blocos para o index.html,marcadas no código com // EMENDA v{versão vigente da carta} D{n}:, com diffregistrado no relatório (Template B). A cópia emendada vai para docs/devolucoes/emendadas/.

5. Harnesses sob Node — tools/shim.js + tools/run-harness.js
// tools/shim.js — carregar ANTES dos scripts do arquivo do móduloglobal.window = global;global.performance = global.performance || { now: () => Date.now() };global.requestAnimationFrame = (fn) => setTimeout(() => fn(performance.now()), 16);global.localStorage = (() => { const m = {}; return {  getItem: (k) => (k in m ? m[k] : null),  setItem: (k, v) => { m[k] = String(v); } }; })();global.document = { getElementById: () => ({ _h: '',  set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; } }) };if (!console.table) console.table = (rows) => console.log(rows);
Executor: node tools/run-harness.js <arquivo>.html — carrega o shim, extraicada <script> do HTML em ordem, avalia, aguarda a bateria assíncrona eimprime o resumo do console (tabela + "x/x PASS"). Os testes de tempo usamrelógio real — o shim acima os satisfaz.

6. Smoke test pós-integração (tools/smoke.js, contra o index.html)
OIKOS.reset(42);OIKOS.Worldgen.generate();console.log('geo:', OIKOS.state.geo);OIKOS.Chron.log({ type: 'marco', titulo: 'Fogada inicial', prosa: 'A Casa acorda.' });console.log('cronicas:', OIKOS.Chron.timeline().length);console.log('periodo main:', new OIKOS.Elliptic.Pendulum({ id: 'main', omega: 1 }).period().toFixed(3));
Esperado: geo com os 7 campos; hasRiver booleano; 1 entrada na timeline;período plausível (> 4, crescendo com k).

7. Ordem canônica de integração no index.html
S1 → S2 → S4 → S6 → S3 → S5 → S7 → S8 → S9 → S10 → S11 → S12 → S13

8. Fluxo por rodada
Delegar (template 8.1 da carta + Anexo A + adendo) → salvar em docs/delegacoes/
Receber → docs/devolucoes/ (sem editar)
Auditar: greps da seção 3 + harness (seção 5) + schema/consts/eventos/marcadores vs carta + classificar cada // DECISÃO: e // LACUNA:
Relatar ao dono (Template A). AGUARDAR aprovação.
Emendar (só o aprovado) → re-rodar harness das cópias emendadas
Integrar no index.html (seção 7) + smoke (seção 6)
Commit por módulo: "S{n} {nome}: auditado e integrado (harness x/x)"
Atualizar seção 12 do OIKOS.md no mesmo commit
9. Decisões e pendências — NÃO decida por conta própria
D27 (veios em toda a terra): SUPERADA por D29 — veios restritos a PEDRAe MONTANHA, como o código auditado da S2 já fazia. Nada a fazer.
D-variabilidade: RATIFICADA por D30 — alvo de terra [1010,1350] efloresta [12%,26%] por seed via child('world'), label 'world' incorporadoao contrato de streams da S2. Encerrada; nada pendente nesta frente.
10. Quando PARAR e perguntar ao dono
Qualquer FAIL de harness não explicado.
Divergência de contrato sem patch aprovado.
LACUNA que exija escolha de design (não apenas "a mais simples").
Qualquer coisa que toque marcadores, API do kernel ou a seção 11 da carta.
11. Templates de relatório
Template A — relatório de rodada (após auditoria, antes de emendar)
RODADA {n} — {S#}1. Devoluções: arquivo · linhas do bloco2. Harness: x/x PASS por módulo (FAIL detalhado, se houver)3. Greps: Math.random (n — onde) · DOM (n — onde)4. Exports declarados vs carta: divergências?5. // DECISÃO: lista + classificação (ok / patch / rejeitar)6. // LACUNA: lista + impacto + proposta de patch (diff pronto p/ seção 11)7. Divergências de contrato/aceite8. Perguntas ao dono (máx. 3, objetivas)
Template C — registro de auditoria por módulo (docs/auditorias/S{n}.md)
Arquivo por módulo, durável. Substitui a conversa em chat: é onde os pareceresde auditores distintos, a divergência entre eles e a resolução do dono ficam.# Auditoria S{n} — {NOME}## 1. Harness   (stdout do run-harness; estado original e, se houver, emendado)## 2. Achados — auditor {quem}, {data}   tabela: # · severidade · achado · evidência (arquivo:linha) · proposta   greps da seção 3 · exports vs carta · // DECISÃO: e // LACUNA: classificadas## 3. Achados — auditor {quem}, {data}   segundo parecer, escrito SEM ler a seção 2 (senão vira eco, não verificação)## 4. Divergência entre auditores   só onde os pareceres se contradizem, com o argumento de cada lado## 5. Resolução do dono   o que foi aceito, o que foi rejeitado e por quê; virou D{n} na carta?   commit que aplicou
Template B — relatório de integração (após aprovação)
INTEGRAÇÃO — {S#}1. Emendas aplicadas: diffs + re-rodagem do harness (x/x)2. index.html: blocos na ordem + tamanho total3. Smoke test: saída do console4. Commits: hashes + mensagens5. Seção 12 da carta: linhas atualizadas