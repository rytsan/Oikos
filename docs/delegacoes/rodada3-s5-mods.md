Você é o desenvolvedor responsável por UM módulo do projeto OIKOS, descrito na
CARTA MESTRA abaixo. Regras absolutas:

1. Implemente apenas o módulo **S5 — MOTOR DE MODIFICADORES** (seção 6). Nada
   além dele.
2. O Contrato comum (seção 4) e o Núcleo canônico (seção 5) são imutáveis.
3. Proibido `Math.random` e proibido tocar o DOM (S5 não é exceção; as
   exceções são S3 e S12). Use `OIKOS.rng` / `OIKOS.makeRng` se precisar.
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

## Adendo S5 — pontos que a spec pressupõe

**Marcadores exatos** (imutáveis, o integrador faz grep por eles):

```
/* ===== OIKOS S5 MODS — INÍCIO ===== */
... seu módulo ...
/* ===== OIKOS S5 MODS — FIM ===== */
```

**Export:** `OIKOS.Mods = { push, get, removeBySource }`. Nada mais. É
**biblioteca pura**: sem `OIKOS.use()`, sem hook de ciclo de vida, sem escrita
em `state`, zero DOM.

**D28 é o contrato inteiro, e é onde está a dificuldade.** Releia na seção 11
da carta. Os pontos que costumam sair errados:

- **Closure volátil.** O schema v1 não tem campo de mods. Os mods vivem em
  closure e **somem no `load()`** — isso é o comportamento correto, não um bug.
  Fontes persistentes (instituições) re-registram depois, via S8. Não tente
  persistir; não invente campo no schema.
- **Ordem de aplicação:** TODOS os `'add'` por idade de adoção, DEPOIS todos os
  `'mult'` por idade. Não é ordem de push intercalada — é dois grupos.
- **Re-push substitui preservando a posição de fila.** Reformar uma instituição
  não pode reordenar a precedência. `id` existente sobrescreve **no lugar**.
- **Expiração por lazy-sweep no `get`**, comparando `expiresAt` com
  `OIKOS.state.year`. Ausência de `expiresAt` = permanente. Não use timer nem
  `sim:tick` para varrer.
- **`fn(snapshot)` é avaliada no `get`**, toda vez — é o que torna decisões
  sensíveis a contexto. Retorno não-finito: ignora o mod e `console.error`.
- **Validação rejeita SEM emitir.** `push` inválido devolve `null` +
  `console.error`, e **não** dispara `mods:changed`. Sucesso emite
  `'mods:changed'` com payload `{target}`.
- **`get` nunca muta a base e nunca lança.** Motor vazio devolve o valor base
  intacto.

**Estado sempre via `OIKOS.state.x`.** Nunca capture `state` em closure:
`reset()` e `load()` REATRIBUEM o objeto e sua referência vira lixo silencioso.
Ler o ano é `OIKOS.state.year` no momento do `get`, não uma cópia guardada.

## Harness — requisito de formato que a carta não fixa

O harness roda em DOIS ambientes e **precisa passar nos dois**:

1. **Navegador**, por duplo clique: imprime a tabela PASS/FAIL no DOM.
2. **Node**, pelo executor do integrador (`node tools/run-harness.js <arq>.html`),
   com um shim mínimo que fornece `window`, `performance`,
   `requestAnimationFrame`, `localStorage` e um `document.getElementById` de
   mentira que só aceita `innerHTML`. Nada mais de DOM existe lá.

Como S5 não toca o DOM, seu módulo roda idêntico nos dois. Só o *render* da
tabela do harness usa `document`, e ele deve se limitar a
`getElementById(...).innerHTML`, sem `createElement` nem `querySelector`.

**Medir `get` médio < 5 µs** exige laço grande e aquecimento: meça com
`performance.now()` sobre pelo menos 10.000 chamadas e divida, descartando a
primeira rodada. Uma única chamada cronometrada mede ruído, não custo.

**A última linha do console é contratual** (seção 4 item 9c da carta). O
executor do integrador extrai exatamente este padrão:

```
OIKOS S5 harness: 11/11 PASS (+0 SKIP [browser])
```

S5 não toca o DOM, então **nenhum critério seu é `[browser]`**: o contador de
SKIP é `0` e todos os critérios são PASS/FAIL obrigatórios sob Node. Sem essa
linha, o harness expira em timeout e a devolução volta.

## Entregáveis (todos obrigatórios)

1. Um arquivo HTML único, rodável por duplo clique.
2. O bloco do kernel VERBATIM, depois o seu módulo entre os marcadores acima.
3. O harness FORA dos marcadores, cobrindo os critérios de aceite da spec S5:
   motor vazio devolve o valor base; ordem `add`→`mult` provada; dois adds
   somam e dois mults compõem por ordem de push; `fn` recalcula a cada `get`;
   `removeBySource` remove só a fonte e devolve a contagem; expiração com
   lazy-sweep; re-push substitui sem duplicar e mantém precedência; validações
   rejeitam sem emitir; evento com payload correto; 1000 pushes + 1000 gets sem
   NaN; `get` médio < 5 µs.
4. Lista dos exports.
5. `// DECISÃO:` resumidas e `// LACUNA:` listadas.
6. Confirmação explícita de ausência de `Math.random`.

=== CARTA MESTRA ===

{{CARTA}}

=== KERNEL S1 — BLOCO REAL (VERBATIM) ===

{{KERNEL}}
