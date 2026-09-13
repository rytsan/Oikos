Você é o desenvolvedor responsável por UM módulo do projeto OIKOS, descrito na
CARTA MESTRA abaixo. Regras absolutas:

1. Implemente apenas o módulo **S8 — ERAS & INSTITUIÇÕES** (seção 6). Nada além.
2. O Contrato comum (seção 4) e o Núcleo canônico (seção 5) são imutáveis.
3. Proibido `Math.random` e proibido tocar o DOM (as exceções são S3 e S12).
   Se precisar de sorteio, use `OIKOS.rng.child('eras')`.
4. Entregue conforme a seção 9 da carta, com os ajustes de formato abaixo.
5. Ambiguidade dentro da spec: escolha o mais simples e registre `// DECISÃO:`.
6. Proibida inferência silenciosa: o que faltar, declare `// LACUNA:` e escolha
   o mais simples. Contexto do ambiente NÃO cria requisitos nem decisões; onde
   conflitar, prevalece a carta, e o conflito vai em `// LACUNA:`.
7. Plugins de ambiente não alteram este contrato. Única fonte de verdade: a
   carta. Economia de resposta NUNCA corta entregáveis contratuais.
8. **RUNTIME NECESSÁRIO.** Embuta VERBATIM, antes do seu módulo, o runtime
   fornecido no fim deste prompt. É código auditado e integrado: não reescreva.

---

## Adendo S8 — o que a spec pressupõe

**Marcadores exatos** (nome canônico da seção 9):

```
/* ===== OIKOS S8 ERAS — INÍCIO ===== */
/* ===== OIKOS S8 ERAS — FIM ===== */
```

### A superfície de export NÃO está fixada pela carta

Mesma situação do S7: declare `// LACUNA:` e resolva pelo mais simples. A S12
vai precisar listar eras, ler as instituições vigentes e mostrar o custo de
reforma ao vivo; o seu harness vai precisar adotar e reformar sem UI. Mantenha
enxuto e justifique cada item.

### Você é o par da D37 — sem você, os mods somem

A D37 fez a closure do `Mods` **zerar** quando o kernel reatribui o estado
(`reset`/`load`). A D28 sempre disse que fontes persistentes re-registram após
`load` — **essa fonte é você**. Depois de um `load()`, as instituições vivem em
`state.institutions`, mas os modificadores delas não existem mais no motor.

Re-registrar é critério de aceite, não detalhe. Note que `re-push` por id
substitui no lugar preservando precedência (D28), então re-registrar é
idempotente e pode ser feito sem medo de duplicar.

O kernel não emite evento de `load`. O gatilho barato e correto é a **troca de
identidade de `OIKOS.state`** — o mesmo padrão que D23 (S6), D36 (S3), D37 (S5)
e o S7 já usam. Leia esses blocos no runtime; siga a casa.

### Os alvos de Mods são contrato (D39)

Os modificadores das instituições empurram contra exatamente estes nove nomes,
fixados pela D39 e consumidos pelo S7:

`foodProd` · `foodUse` · `woodProd` · `stoneProd` · `housing` · `jobs` ·
`growth` · `tension` · `knowledge`

Inventar um alvo novo é extensão silenciosa de contrato — se precisar de um,
declare `// LACUNA:`. A base de cada um vem do snapshot (D34), e `fn(snapshot)`
é o que torna as vantagens e restrições sensíveis ao mundo real.

### A pendência que a D41 deixou para você

O S7 emite `era:ready` quando o conhecimento cruza o limiar, e a D41 chaveou o
evento pela era vigente. **Mas o conhecimento não é consumido na virada.** Se
você apenas avançar `state.era`, o portão da era seguinte abre no mesmo
instante, porque o conhecimento já está acima do limiar.

Resolver isso é seu: consumir o conhecimento na transição, elevar o limiar por
era, ou outra coisa que você registre com `// DECISÃO:`. Não deixe passar.

### Transição, e a pausa

`era:ready` → **pausa** → carta de decisão material → 1–2 instituições →
`Mods.push` + `Chron.log`.

A pausa é do kernel: `OIKOS.loop.pause()` são os ÚNICOS mutadores de
`state.paused` (regra 5.7). Nunca escreva `state.paused` na mão.

A carta de decisão é **dimensionada por `state.geo`** — e a D43 acabou de
manter `geo.forestTiles` e `geo.fertileTiles` vivos justamente para isso. Uma
decisão da Era 4 deve se dimensionar sobre a floresta que existe agora.

### Eventos do dicionário (5.4) que são seus

`era:advanced` · `inst:adopted` · `inst:reformed` · `decision:open` ·
`decision:closed`. O bus aceita qualquer string, mas ficar no dicionário é
contrato.

### Crônicas

`Chron.log` com o schema D23: `{type, titulo, prosa, ato, efeitoMedido, refs}`.
Os campos `text` e `source` **não existem**. A adoção de uma instituição é um
`ato` — e é o `id` dele que as consequências futuras citarão em `refs`/`ato`
(D22), que é a espinha dorsal do epílogo da S11.

### Custo de reforma

```
base × (1 + idade/fator) × (1 − legitimidade/100) × K(k)/K(0)
```

`K` vem de `OIKOS.Elliptic.K`, que você PODE consumir (seção 4.2). O clamp
`k ∈ [0, 0.9999]` dá teto operacional de ~3,59× (D19) — não espere divergência
numérica. `k` vive em `state.pendulums.main.k`.

### O que você escreve, e o que não toca

Seu: `state.institutions`, `state.era`, `state.meters.legitimacy`, e o `k` dos
pêndulos na janela constitucional.

Não seu: `state.sim` e `state.res` (do S7 — vá por `Mods`), `state.camera` e
`state.hover` (do S3), `state.tiles.owner` (da S9), `state.chronicle` direto
(vá por `Chron.log`), `state.paused` direto (vá por `loop.pause()`).

Acesso sempre via `OIKOS.state.x`, nunca por referência presa em closure.

## Harness — formato contratual (seção 4 item 9)

Roda sob Node pelo executor do integrador, com shim mínimo (`window`,
`performance`, `requestAnimationFrame`, `localStorage`, `getElementById` de
mentira). Sem DOM no módulo, nenhum critério seu é `[browser]`.

Última linha contratual — com zero `[browser]`, o sufixo é opcional (4.9c):

```
OIKOS S8 harness: 11/11 PASS
```

## Critérios de aceite (spec S8)

- **Gate testável**: adotar A faz B sumir do menu da era seguinte.
- **Custo de reforma cresce com idade e com k** — prove os dois isoladamente.
- **Re-registro pós-load provado**: salve com instituições vigentes, `load()`,
  e mostre que `Mods.get` volta a refletir os modificadores delas.
- **Painel Constituição alimentado via bus** — os eventos saem com payload útil.

E do contrato comum: sem `Math.random`, sem DOM, sobrevivência a `reset()` e
`load()` sem closure presa.

## Entregáveis

1. HTML único, rodável por duplo clique.
2. Runtime VERBATIM, depois o seu módulo entre os marcadores.
3. Harness FORA dos marcadores.
4. Lista dos exports e das instituições/gates implementados.
5. `// DECISÃO:` e `// LACUNA:` — a superfície de export e o destino do
   conhecimento na virada de era são duas delas.
6. Confirmação de ausência de `Math.random`.

=== CARTA MESTRA ===

{{CARTA}}

=== RUNTIME INTEGRADO — BLOCOS REAIS (VERBATIM) ===

{{RUNTIME}}
