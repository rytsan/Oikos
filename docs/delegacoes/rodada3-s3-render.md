Você é o desenvolvedor responsável por UM módulo do projeto OIKOS, descrito na
CARTA MESTRA abaixo. Regras absolutas:

1. Implemente apenas o módulo **S3 — RENDER** (seção 6). Nada além dele.
2. O Contrato comum (seção 4) e o Núcleo canônico (seção 5) são imutáveis.
3. Proibido `Math.random`. Use `OIKOS.rng` / `OIKOS.makeRng`. **S3 é uma das
   duas exceções autorizadas a tocar o DOM** (a outra é S12) — e só para
   canvas 2D e eventos de entrada.
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
8. **KERNEL NECESSÁRIO.** Embuta o bloco do kernel fornecido no fim deste
   prompt VERBATIM, antes do seu módulo. É runtime já auditado e integrado —
   não o reescreva, não o "melhore". O integrador extrairá apenas o bloco do
   SEU módulo.

---

## Adendo S3 — pontos que a spec pressupõe

**Marcadores exatos** (imutáveis, o integrador faz grep por eles):

```
/* ===== OIKOS S3 RENDER — INÍCIO ===== */
... seu módulo ...
/* ===== OIKOS S3 RENDER — FIM ===== */
```

**Export:** `OIKOS.Render = { draw, project, unproject, isZoneable, paintOrder,
visibleTiles }`, mais `OIKOS.use('Render', { draw })` — **sem `update`**. O
módulo é leitor puro: `draw()` altera SOMENTE `state.camera` e `state.hover`.

**Geometria a partir de `consts`, nunca hardcoded.** A spec escreve
`telaX = (x−y)·32` e `telaY = (x+y)·16`; esses números são `TILE_W/2` e
`TILE_H/2`. Leia de `OIKOS.consts` — o harness sobrescreve constantes para
testar, e valor cravado no código quebra isso (regra 5.8).

**Sem `rng` por frame.** A variação visual por tile vem de cache chaveado pela
seed, montado uma vez. Chamar `rng.child()` dentro do laço de desenho mata o
frame e o determinismo.

**Estado sempre via `OIKOS.state.x`.** Nunca capture `state`, `state.tiles` ou
`state.camera` em closure: `reset()` e `load()` REATRIBUEM o objeto inteiro e
sua referência vira lixo silencioso. Esse foi o teste que pegou bugs em S4 e S6.

**Domínios que você vai desenhar:** `terrain` 0 oceano · 1 água doce · 2 areia ·
3 grama · 4 fértil · 5 floresta · 6 pedra · 7 montanha. `resource` 0 nada ·
1 caça · 2 peixe · 3 cobre · 4 ferro · 5 carvão. Índice sempre `y*MAP+x`.

## Harness — requisito de formato que a carta não fixa

O harness roda em DOIS ambientes e **precisa passar nos dois**:

1. **Navegador**, por duplo clique: imprime a tabela PASS/FAIL no DOM.
2. **Node**, pelo executor do integrador (`node tools/run-harness.js <arq>.html`),
   com um shim mínimo que fornece `window`, `performance`,
   `requestAnimationFrame`, `localStorage` e um `document.getElementById` de
   mentira que só aceita `innerHTML`. **Não há canvas nesse ambiente.**

Consequência de projeto, e é o ponto mais importante deste adendo:

- `project`, `unproject`, `isZoneable`, `paintOrder` e `visibleTiles` são
  funções **puras de geometria** e não podem exigir um contexto de canvas.
  Todos os critérios de aceite sobre elas têm de rodar headless.
- Só `draw()` precisa de canvas. Os critérios que dependem dele
  (snapshot-diff, smoke visual < 17 ms/frame) devem ser **detectados e
  pulados** quando não houver canvas, imprimindo `SKIP` em vez de `FAIL`, com o
  motivo. Um `FAIL` por ausência de canvas trava a auditoria por um defeito que
  não existe.
- Detecte assim, sem lançar:
  `var temCanvas = typeof document !== 'undefined' && typeof document.createElement === 'function';`
  e confirme que o `getContext('2d')` devolveu contexto antes de usá-lo.

**A última linha do console é contratual.** O executor do integrador procura
exatamente este padrão para saber que a bateria terminou:

```
OIKOS S3 harness: 12/12 PASS
```

Sem essa linha, o harness expira em timeout e a devolução volta. Conte apenas
os critérios executados; reporte os `SKIP` separadamente.

## Entregáveis (todos obrigatórios)

1. Um arquivo HTML único, rodável por duplo clique.
2. O bloco do kernel VERBATIM, depois o seu módulo entre os marcadores acima.
3. O harness FORA dos marcadores, cobrindo os critérios de aceite da spec S3:
   roundtrip `project`→`unproject` com erro 0; picking nos 4 cantos do diamante;
   `paintOrder` correto (desempate `(x+y)` ASC, depois `y` ASC — casa em (10,10)
   oclui (11,9)); tabela-verdade de `isZoneable`; culling saudável com margem de
   1 tile + altura de sprite; zoom com ponto-fixo no cursor invariante e clamp
   em `[ZOOM_MIN, ZOOM_MAX]`; 1000×(`unproject`+`visibleTiles`) < 5 ms.
4. Lista dos exports.
5. `// DECISÃO:` resumidas e `// LACUNA:` listadas.
6. Confirmação explícita de ausência de `Math.random`.

=== CARTA MESTRA ===

{{CARTA}}

=== KERNEL S1 — BLOCO REAL (VERBATIM) ===

{{KERNEL}}
