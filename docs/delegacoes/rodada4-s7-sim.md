Você é o desenvolvedor responsável por UM módulo do projeto OIKOS, descrito na
CARTA MESTRA abaixo. Regras absolutas:

1. Implemente apenas o módulo **S7 — SIMULAÇÃO** (seção 6). Nada além dele.
2. O Contrato comum (seção 4) e o Núcleo canônico (seção 5) são imutáveis.
3. Proibido `Math.random` e proibido tocar o DOM (S7 não é exceção; as exceções
   são S3 e S12). Se precisar de sorteio, use `OIKOS.rng.child('sim')`.
4. Entregue conforme a seção 9 da carta, com os ajustes de formato abaixo.
5. Ambiguidade dentro da spec: escolha o mais simples e registre `// DECISÃO:`.
6. Proibida inferência silenciosa: o que faltar, declare `// LACUNA:` e escolha
   o mais simples. Contexto do ambiente (memórias, grafos, outras conversas)
   NÃO cria requisitos nem decisões; onde conflitar, prevalece a carta, e o
   conflito vai em `// LACUNA:`.
7. Plugins de ambiente (estilos de saída, memória, grafos de contexto) não
   alteram este contrato. Única fonte de verdade: a carta. Economia de resposta
   NUNCA corta entregáveis contratuais (código entre marcadores, harness,
   tabela PASS/FAIL, notas). O estilo da conversa é irrelevante; o formato do
   ARQUIVO é contratual.
8. **RUNTIME NECESSÁRIO.** Embuta VERBATIM, antes do seu módulo, todo o bloco
   de runtime fornecido no fim deste prompt — S1 Kernel, S2 Worldgen, S4
   Elíptico, S6 Crônicas, S3 Render e S5 Mods. É código já auditado e
   integrado: não reescreva, não "melhore", não corrija. O integrador extrairá
   apenas o bloco do SEU módulo.

---

## Adendo S7 — o que a spec pressupõe

**Marcadores exatos** (nome canônico fixado na seção 9 da carta):

```
/* ===== OIKOS S7 SIM — INÍCIO ===== */
... seu módulo ...
/* ===== OIKOS S7 SIM — FIM ===== */
```

### A superfície de export NÃO está fixada pela carta

Diferente de S3 e S5, a carta **não diz** quais funções o S7 exporta. Isso é
lacuna real, não descuido seu: declare-a com `// LACUNA:` e resolva pelo mais
simples.

Orientação para o mais simples: registre-se com `OIKOS.use('Sim', { init,
update })` — o S7 é o primeiro módulo que de fato **roda por tick** — e anexe
em `OIKOS.Sim` apenas o mínimo que o seu harness precisa para provar os
critérios de aceite. Superfície enxuta é mais fácil de ratificar depois do que
superfície larga é de cortar. Liste o que exportou e por quê.

### Semântica do tick (D13) — não inverta

`state.year++` → `update()` de TODOS os módulos → `bus.emit('sim:tick', {year})`.

Seu trabalho acontece no `update()`: ele **produz** o ano. Handlers de
`sim:tick` **consomem** o ano já fechado. Não assuma que `sim:tick` precede o
seu `update()` no mesmo tick, e não faça a simulação dentro de um handler de
`sim:tick`.

### Todo número passa por Mods — e a base vem do snapshot (D34)

É critério de aceite, não sugestão. Nenhum valor de produção, consumo,
crescimento ou tensão pode ser calculado direto: cada um passa por
`OIKOS.Mods.get(target, snapshot)`.

A D34 fixa a semântica da base: **`get` lê a base de `snapshot[target]`**
quando for número finito, e usa 0 quando não houver snapshot ou a chave. O
snapshot nunca é escrito. Então o padrão é:

```js
var snap = { foodProd: bruto, pop: st.sim.pop, housing: st.sim.housing, /* ... */ };
var comida = OIKOS.Mods.get('foodProd', snap);
```

O mesmo `snapshot` alimenta as `fn(snapshot)` dos modificadores — é o que torna
as decisões sensíveis a contexto. Escolha nomes de `target` estáveis e
declare-os na sua lista de exports: a S8 vai empurrar mods contra esses nomes.

### Crônicas: use Chron.log, respeite o schema D23

A entrada canônica é `{id, year, era, type, titulo, prosa, ato, efeitoMedido,
refs}`. Os campos `text` e `source` **não existem**. `type` tem de estar em
`{ato, evento, consequencia, desastre, marco}` — qualquer outro devolve `null`
com `console.error`, sem lançar.

A fome é o caso que a spec exige registrar: população cai **e** gera crônica,
com o efeito real em `efeitoMedido`.

### O que você escreve no estado, e o que não toca

Seu: `state.sim` (`pop`, `jobs`, `foodProd`, `housing`, `tension`),
`state.res` (comida, madeira, pedra e o resto), `state.meters.knowledge`, e
— pela degradação — `tiles.terrain` e `tiles.pollution`.

Não seu: `state.camera` e `state.hover` (do S3), `state.chronicle` direto (vá
por `Chron.log`), modificadores direto (vá por `Mods`), `state.institutions`
(da S8). Acesso sempre via `OIKOS.state.x`, **nunca** capturando referência em
closure — `reset()` e `load()` REATRIBUEM o objeto, e módulos anteriores já
tropeçaram nisso.

Quando alterar tiles, o dicionário de eventos da seção 5.4 tem `tile:changed`.

### Era 1 jogável

A spec nomeia cinco: acampamento, cabana de coletor, pesca (rio/mar),
lascamento (perto de pedra), trilha. Você precisa de um catálogo com id, custo,
o que produz e onde pode existir — "perto de pedra" e "rio/mar" são condições
de posicionamento reais, dimensionadas sobre o mapa do S2.

Quem **planta** é o jogador, pela UI (S12), que ainda não existe. Você simula o
que já está plantado em `tiles.building` / `tiles.level`. O harness planta na
mão para testar.

`conhecimento ≥ limiar` emite `era:ready` no bus.

### Degradação

Colheita excessiva consome floresta; solo perde fertilidade; poluição se
espalha em raio e decai devagar. É a base da "reversibilidade cara" do design —
o decaimento lento é proposital, não um número a ajustar para o teste passar.

## Harness — formato contratual (seção 4 item 9 da carta)

Roda em DOIS ambientes e precisa passar nos dois:

1. **Navegador**, por duplo clique: tabela PASS/FAIL no DOM.
2. **Node**, pelo executor do integrador (`node tools/run-harness.js <arq>.html`),
   com um shim mínimo que dá `window`, `performance`, `requestAnimationFrame`,
   `localStorage` e um `document.getElementById` de mentira que só aceita
   `innerHTML`. Nada mais de DOM existe lá.

Como o S7 não toca o DOM, o módulo roda idêntico nos dois, e nenhum critério
seu deve ser `[browser]`.

**Não dependa do loop real para testar.** O `update()` é público pelo registro
em `use()`, mas o jeito determinístico de testar N anos é avançar o estado e
chamar o ciclo você mesmo, sem `rAF`. Teste de tempo real deixa o harness
lento e instável.

**A última linha do console é contratual:**

```
OIKOS S7 harness: 11/11 PASS
```

Com zero critérios `[browser]`, o sufixo `(+0 SKIP [browser])` é opcional —
`x/x PASS` basta (seção 4 item 9c). Sem essa linha, o harness expira em timeout
e a devolução volta.

## Critérios de aceite (seção 6, spec S7)

- **População em S, sem explosão**: crescimento logístico limitado por moradia;
  rode muitos anos e prove que a curva satura em vez de divergir.
- **Fome forçada derruba a população E registra crônica**, com `efeitoMedido`
  real.
- **Todo número passa por Mods**: prove empurrando um mod e vendo o resultado
  mudar — para cada `target` que você usa.

E, do contrato comum: sem `Math.random`, sem DOM, determinismo por seed,
sobrevivência a `reset()`/`load()` sem closure presa.

## Entregáveis (todos obrigatórios)

1. Um arquivo HTML único, rodável por duplo clique.
2. O runtime fornecido VERBATIM, depois o seu módulo entre os marcadores.
3. O harness FORA dos marcadores, cobrindo os critérios acima.
4. Lista dos exports **e dos nomes de `target` de Mods** que você usa.
5. `// DECISÃO:` resumidas e `// LACUNA:` listadas — a superfície de export é
   uma delas.
6. Confirmação explícita de ausência de `Math.random`.

=== CARTA MESTRA ===

{{CARTA}}

=== RUNTIME INTEGRADO — BLOCOS REAIS (VERBATIM) ===

{{RUNTIME}}
