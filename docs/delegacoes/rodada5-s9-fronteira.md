Você é o desenvolvedor responsável por UM módulo do projeto OIKOS, descrito na
CARTA MESTRA abaixo. Regras absolutas:

1. Implemente apenas o módulo **S9 — FRONTEIRA & EXPANSÃO** (seção 6). Nada além.
2. O Contrato comum (seção 4) e o Núcleo canônico (seção 5) são imutáveis.
3. Proibido `Math.random` e proibido tocar o DOM (as exceções são S3 e S12).
   Se precisar de sorteio, use `OIKOS.rng.child('fronteira')`.
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

## Adendo S9 — o que a spec pressupõe

**Marcadores exatos** (nome canônico da seção 9 — o nome é `BORDER`):

```
/* ===== OIKOS S9 BORDER — INÍCIO ===== */
/* ===== OIKOS S9 BORDER — FIM ===== */
```

### A superfície de export NÃO está fixada pela carta

Declare `// LACUNA:` e resolva pelo mais simples. A S12 vai precisar desenhar o
overlay e pedir decretos; o S3 já desenha a fronteira lendo `tiles.owner`
direto. Mantenha enxuto.

### O campo da fronteira é `tiles.owner`

O schema v1 já tem `tiles.owner` (Uint8, índice `y*MAP+x`) e o **S3 já desenha
contorno em todo tile com `owner !== 0`** — leia o bloco do Render no runtime
antes de decidir a semântica. Se você usar `owner` com outro significado, o
mapa vai desenhar errado sem ninguém reclamar.

`0` é "fora da fronteira". Qualquer outro valor é seu para definir; registre
com `// DECISÃO:`.

### Uma fronteira que o S7 ainda não respeita — declare, não conserte

A spec diz: *"Tiles fora da fronteira não são zoneáveis (toast de recusa)"*.

Só que o **S7 já está integrado e auditado**, e o `canBuild` dele valida
terreno, ocupação, custo e condição — **não consulta `tiles.owner`**. E você
não pode consertar isso daqui: a seção 4.2 não permite que um módulo consuma
outro, e emendar módulo alheio está fora do seu escopo (regra 1).

O que fazer: implemente a regra do SEU lado (exponha a consulta de fronteira e
emita o `ui:toast` de recusa), e **declare `// LACUNA:`** apontando que a
aplicação em `canBuild` exige emenda no S7, que é decisão do dono. Não invente
dependência, não duplique o catálogo do S7.

### Os dois modos, e a instituição que escolhe

**Orgânica**: avança por atratividade (água e solo fértil), com raio
`f(pop, contentamento)`. Sem controle do jogador.

**Decreto**: paga ouro mais legitimidade; montanha custa ×2; o custo cresce com
a distância ao centro.

*"Instituição vigente modula o modo"* é critério de aceite. A S8 é quem adota
instituições e roda **em paralelo com você nesta rodada** — então não dependa
do código dela. Leia `state.institutions` (`[{id, yearAdopted}]`, schema 5.3) e
declare com `// DECISÃO:` quais ids você reconhece. A carta nomeia o par da
Era 1: **Terra comum ↔ Chefia aloca**, com "fronteira orgânica grátis" contra
"zoneamento fora de controle".

### Imposto e tensão por distância

`imposto × 1/(1+dist/c)` — tiles distantes rendem menos e **sobem a tensão**.
Tensão não é sua: ela é calculada pelo S7 e passa por `Mods.get('tension',
snapshot)`. O jeito certo de empurrar tensão é **um mod** contra o alvo
`tension`, pela D39. Não escreva em `state.sim.tension`.

### O que você escreve, e o que não toca

Seu: `tiles.owner`, e `state.res.gold` / `state.meters.legitimacy` quando o
decreto cobra.

Não seu: `state.sim` e o resto de `state.res` (do S7 — vá por `Mods`),
`state.tiles.terrain` e `pollution` (do S7), `camera`/`hover` (do S3),
`state.institutions` e `state.era` (da S8), `state.chronicle` direto (vá por
`Chron.log`).

Acesso sempre via `OIKOS.state.x`, nunca por referência presa em closure —
`reset()` e `load()` REATRIBUEM o objeto.

### Eventos

`border:changed` é seu, e está no dicionário (5.4). A recusa de zoneamento usa
`ui:toast`. Payload uniforme: o projeto já fixou `{target}` para `mods:changed`
(D38) e `{i, x, y, ...}` para `tile:changed` (D42) — siga a casa.

## Harness — formato contratual (seção 4 item 9)

Roda sob Node pelo executor do integrador, com shim mínimo. Sem DOM no módulo,
nenhum critério seu é `[browser]`. Última linha contratual — com zero
`[browser]` o sufixo é opcional (4.9c):

```
OIKOS S9 harness: 10/10 PASS
```

## Critérios de aceite (spec S9)

- **Instituição vigente modula o modo** (orgânica vs decreto).
- **Overlay visível**: `tiles.owner` preenchido de forma que o S3 desenhe — o
  harness pode provar contando tiles com dono e conferindo contiguidade.
- **A ilha esgota**: a expansão para quando não há mais terra, sem laço infinito
  nem estouro de limites.
- Custo de decreto cresce com distância; montanha ×2; recusa quando falta ouro.

E do contrato comum: sem `Math.random`, sem DOM, determinismo por seed,
sobrevivência a `reset()`/`load()`.

## Entregáveis

1. HTML único, rodável por duplo clique.
2. Runtime VERBATIM, depois o seu módulo entre os marcadores.
3. Harness FORA dos marcadores.
4. Lista dos exports e a semântica escolhida para `tiles.owner`.
5. `// DECISÃO:` e `// LACUNA:` — a superfície de export e a aplicação da
   fronteira no `canBuild` do S7 são duas delas.
6. Confirmação de ausência de `Math.random`.

=== CARTA MESTRA ===

{{CARTA}}

=== RUNTIME INTEGRADO — BLOCOS REAIS (VERBATIM) ===

{{RUNTIME}}
