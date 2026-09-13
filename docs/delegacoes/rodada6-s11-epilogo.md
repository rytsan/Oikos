Você é o desenvolvedor responsável por UM módulo do projeto OIKOS, descrito na
CARTA MESTRA abaixo. Regras absolutas:

1. Implemente apenas o módulo **S11 — FINAIS & EPÍLOGO** (seção 6).
2. O Contrato comum (seção 4) e o Núcleo canônico (seção 5) são imutáveis.
3. Proibido `Math.random` e proibido tocar o DOM (exceções: S3 e S12). Se
   precisar de sorteio, use `OIKOS.rng.child('epilogo')`.
4. Entregue conforme a seção 9, com os ajustes de formato abaixo.
5. Ambiguidade: escolha o mais simples e registre `// DECISÃO:`.
6. Proibida inferência silenciosa: `// LACUNA:` + o mais simples.
7. Plugins de ambiente não alteram este contrato.
8. **RUNTIME NECESSÁRIO.** Embuta VERBATIM o runtime do fim deste prompt.

---

## Adendo S11

**Marcadores** (nome canônico — é `EPILOGUE`):

```
/* ===== OIKOS S11 EPILOGUE — INÍCIO ===== */
/* ===== OIKOS S11 EPILOGUE — FIM ===== */
```

**Export não fixado pela carta.** Declare `// LACUNA:`, mantenha enxuto. A S12
vai querer pedir o texto final e o tipo de desfecho.

### Você gera TEXTO, não desenha

O S11 não toca o DOM. Devolve string (ou estrutura com strings) e a S12
apresenta. Isso também é o que torna o seu harness testável sob Node.

### A matéria-prima é a crônica, e ela tem schema

`OIKOS.Chron.timeline()` devolve **cópia** ordenada por ano, com desempate pela
ordem de emissão. Cada entrada segue a D23:

```
{ id, year, era, type, titulo, prosa, ato, efeitoMedido, refs }
```

Os campos `text` e `source` **não existem** — não os procure. `type` está em
`{ato, evento, consequencia, desastre, marco}`.

**O vínculo ato→consequência é a espinha dorsal (D22).** As sondas do S6 gravam
`consequencia` com `refs:[source]` **e** `ato: source`. A S8 registra a adoção
de instituição como `ato`, e o id desse ato é o que as consequências citam. É
daí que sai "a Casa decidiu X, e anos depois colheu Y" — que é a tese do
epílogo gerado (D5), não um enfeite.

`Chron.query({era, type, source})` casa `source` por `refs` ou por `ato`.

### O fecho é material

*"fecha com estado da ilha (floresta %, poluição, o que persistiu)"*. Leia
`state.geo` — e note que a **D43** mantém `geo.forestTiles` e
`geo.fertileTiles` vivos justamente para que isso meça o mundo de agora, não o
do worldgen. Poluição está em `tiles.pollution`; ruínas, no que a S10 deixou
em `tiles.building`.

### Os desfechos

Florescimento (3 variantes) · Cicatrizada · Colapso narrado. Avalie sobre
harmonia (`state.meters.harmonyAxis`), população (`state.sim.pop`) e decadência
(`state.clock.decayStage`). *Sandbox continua após o final* — gerar o epílogo
não pode encerrar nem travar a partida.

### Tom

Mítico-poético, como todo texto de evento do projeto ("A Casa responde…").
300–500 palavras. O aceite diz **nenhum placeholder vaza**: nada de `{{x}}`,
`undefined`, `NaN` ou `[object Object]` no texto final, inclusive quando a
crônica está vazia ou um campo faltou.

## Harness — formato contratual (seção 4 item 9)

Sob Node, shim mínimo, sem `[browser]`:

```
OIKOS S11 harness: 9/9 PASS
```

## Critérios de aceite (spec S11)

- **Partidas diferentes geram epílogos diferentes** — prove por diff
  automatizado, não por inspeção.
- **Nenhum placeholder vaza**, inclusive nos casos degenerados (crônica vazia,
  `efeitoMedido` ausente, partida de um ano).
- 300–500 palavras; vínculos ato→consequência aparecem no texto; o fecho cita
  números reais da ilha.

## Entregáveis

1. HTML único. 2. Runtime VERBATIM + módulo entre marcadores. 3. Harness fora.
4. Exports. 5. `// DECISÃO:` e `// LACUNA:`. 6. Ausência de `Math.random`.

=== CARTA MESTRA ===

{{CARTA}}

=== RUNTIME INTEGRADO — BLOCOS REAIS (VERBATIM) ===

{{RUNTIME}}
