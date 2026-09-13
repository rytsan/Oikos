Você é o desenvolvedor responsável por UM módulo do projeto OIKOS, descrito na
CARTA MESTRA abaixo. Regras absolutas:

1. Implemente apenas o módulo **S10 — DECADÊNCIA & COLAPSO** (seção 6).
2. O Contrato comum (seção 4) e o Núcleo canônico (seção 5) são imutáveis.
3. Proibido `Math.random` e proibido tocar o DOM (exceções: S3 e S12). Se
   precisar de sorteio, use `OIKOS.rng.child('decadencia')`.
4. Entregue conforme a seção 9, com os ajustes de formato abaixo.
5. Ambiguidade: escolha o mais simples e registre `// DECISÃO:`.
6. Proibida inferência silenciosa: declare `// LACUNA:` e escolha o mais
   simples. Contexto do ambiente não cria requisitos; onde conflitar, vale a
   carta, e o conflito vai em `// LACUNA:`.
7. Plugins de ambiente não alteram este contrato. Economia de resposta NUNCA
   corta entregáveis.
8. **RUNTIME NECESSÁRIO.** Embuta VERBATIM, antes do seu módulo, o runtime do
   fim deste prompt. É código auditado e integrado: não reescreva.

---

## Adendo S10

**Marcadores** (nome canônico da seção 9 — é `DECAY`):

```
/* ===== OIKOS S10 DECAY — INÍCIO ===== */
/* ===== OIKOS S10 DECAY — FIM ===== */
```

**Export não fixado pela carta.** Declare `// LACUNA:` e mantenha enxuto, como
fizeram S7, S8 e S9. A S12 vai querer ler o estágio para as notícias diegéticas.

### O campo é `state.clock`

O schema v1 já tem `clock: { stagnation, decayStage }`. É seu. Não invente
campo novo — o schema é imutável (seção 5.3).

### O relógio

Enche sob tensão, fome e poluição extrema, com **velocidade × k**. O `k` vive
em `state.pendulums.main.k` e é a rigidez sistêmica; leia vivo, não copie.

Você lê os sintomas do mundo: `state.sim.tension` (o S7 calcula e passa por
`Mods`), a fome (excedente negativo com celeiro vazio), e `tiles.pollution`.

### Os três estágios

−15%, −30%, −50% **via Mods** — empurre contra os nove alvos da D39
(`foodProd`, `foodUse`, `woodProd`, `stoneProd`, `housing`, `jobs`, `growth`,
`tension`, `knowledge`). Não invente alvo; se precisar, `// LACUNA:`.

Lembre da D37: a closure do `Mods` zera quando o kernel reatribui o estado. Se
os seus mods devem sobreviver a um `load()`, **você** os re-registra, pelo
gatilho de identidade de `OIKOS.state` que S6, S3, S5, S7 e S8 já usam. Leia
esses blocos no runtime e siga a casa.

### Ruínas permanentes — e o schema não tem campo de ruína

*"prédios viram terreno ruína permanente"*, e a D4 diz que a Casa tem memória.
Mas `terrain` é domínio fechado 0..7 (seção 5.3) e você **não pode estendê-lo**.

O `tiles.building` é o caminho natural: o S7 usa ids 1..5 para a Era 1, e o
resto do domínio Uint8 está livre. Escolha um id de ruína, declare com
`// DECISÃO:`, e note que ele precisa sobreviver ao `save/load` — o que
acontece de graça, porque `tiles` serializa.

Cuidado: o S3 desenha caixa 3-tons para todo `building !== 0`. Ruína desenhada
como prédio inteiro seria mentira visual. Leia o bloco do Render no runtime e
decida o que isso implica; se exigir emenda no S3, **declare, não conserte** —
emendar módulo alheio está fora do seu escopo.

### Sintomas, não números

*"Estabilidade nunca é número: só eventos-sintoma em limiares cruzados."* O
aceite exige **1 disparo por limiar**, não um por ano. O padrão da casa é
aresta: o S7 registra a fome uma vez por episódio (D40). Faça igual, e use
`Chron.log` com o schema D23 — `{type, titulo, prosa, ato, efeitoMedido, refs}`,
sem `text` nem `source`.

`colony:collapsed` está no dicionário (5.4) e é seu.

## Harness — formato contratual (seção 4 item 9)

Roda sob Node com shim mínimo. Sem DOM no módulo, nenhum critério `[browser]`.
Última linha; com zero SKIP o sufixo é opcional (4.9c):

```
OIKOS S10 harness: 10/10 PASS
```

**Não dependa do loop real.** Avance o estado e chame o ciclo você mesmo.

## Critérios de aceite (spec S10)

- **Escassez forçada → espiral → colapso**, de ponta a ponta.
- **Ruínas sobrevivem a save/load.**
- **Sintoma dispara 1× por limiar**, não a cada ano acima dele.
- Relógio acelera com `k`; os três estágios cortam via `Mods`.

## Entregáveis

1. HTML único rodável por duplo clique. 2. Runtime VERBATIM + seu módulo entre
marcadores. 3. Harness fora dos marcadores. 4. Lista de exports e do id de
ruína escolhido. 5. `// DECISÃO:` e `// LACUNA:`. 6. Confirmação de ausência de
`Math.random`.

=== CARTA MESTRA ===

{{CARTA}}

=== RUNTIME INTEGRADO — BLOCOS REAIS (VERBATIM) ===

{{RUNTIME}}
