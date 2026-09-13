# AGENTS.md — briefing do agente auditor

## 0. Seu papel

Você é **auditor independente**, segunda opinião. Não é o executor.

Você **verifica e reporta**. Não emenda código, não altera a carta, não
integra. Achado vira relatório para o dono (Template A, seção 7 aqui); o dono
decide; outro agente executa. Se você "consertou" alguma coisa, saiu do papel.

O valor do seu trabalho está em ser **independente**. Há uma auditoria prévia
em `docs/auditorias/` — recomendação: forme sua própria opinião primeiro e só
depois leia aquilo, para não ancorar. Divergir da auditoria anterior é
resultado útil, não conflito.

## 1. O projeto em cinco linhas

OIKOS é um jogo de construção de civilização numa ilha procedural, em **um
único `index.html`**: sem build, sem dependências, sem rede, roda por duplo
clique. Treze módulos (S1–S13) são delegados a IAs diferentes, um por vez, e
integrados por extração de blocos marcados. O substrato matemático é o pêndulo
elíptico (funções de Jacobi); a decadência existe como teorema, não como timer.

## 2. Fontes de verdade (precedência)

1. **`OIKOS.md`** — carta mestra. Design, specs de módulo, critérios de aceite,
   registro de decisões (seção 11). **É a autoridade.**
2. **`CLAUDE.md`** — processo apenas: como auditar, emendar, integrar.
3. Este arquivo — briefing de entrada. Onde conflitar com a carta, **vale a
   carta**, e o conflito é achado a reportar.

Regra que decide quase tudo: **conflito código↔carta = defeito do código.**
Mas registre a possibilidade inversa — já aconteceu de o registro estar
desatualizado e o código, certo (ver D29).

A carta se versiona pela sua **seção 14**: toda alteração aceita sobe 0,1 e
ganha linha na seção 13. Cabeçalho `Versão:` que não bate com a última linha da
seção 13 é achado. Se uma mudança de carta invalidou critério de aceite já
cumprido, o módulo devia ter voltado para ☐ na seção 12 — conferir.

## 3. Estado atual

| Módulo | Estado |
|---|---|
| S1 Kernel | auditado, integrado |
| S2 Worldgen | auditado, integrado |
| S4 Elíptico | auditado, integrado (emenda D21) |
| S6 Crônicas | auditado, integrado (emenda D22) |
| S3 Render, S5 Mods | spec + adendo prontos, **não delegados** |
| S7–S13 | só spec |

`index.html` carrega S1 → S2 → S4 → S6 (ordem da seção 7 do `CLAUDE.md`).
A seção 12 da carta é o status canônico — se divergir desta tabela, a carta manda.

## 4. Como rodar

Node puro, sem instalar nada (testado no v24). Do diretório raiz:

```bash
# harness de um módulo — sai 0 se todos os critérios passarem
node tools/run-harness.js docs/devolucoes/oikos-s1-kernel.html
node tools/run-harness.js docs/devolucoes/oikos-s2-worldgen.html
node tools/run-harness.js docs/devolucoes/oikos-s4-elliptic.html
node tools/run-harness.js docs/devolucoes/oikos-s6-chronicles.html

# cópias com emendas aprovadas
node tools/run-harness.js docs/devolucoes/emendadas/oikos-s4-elliptic.html
node tools/run-harness.js docs/devolucoes/emendadas/oikos-s6-chronicles.html

# smoke do arquivo integrado
node tools/smoke.js
```

`tools/shim.js` dá a um HTML de devolução o mínimo de browser para rodar sob
Node (`window`, `performance`, `requestAnimationFrame`, `localStorage`,
`document` de mentira). `run-harness.js` extrai cada `<script>` na ordem,
avalia e espera a bateria assíncrona até o resumo `x/x PASS`.

Contagens esperadas hoje: **S1 11/11 · S2 13/13 · S4 11/11 · S6 9/9**.
Qualquer número diferente é achado.

## 5. Regras duras — verificáveis por grep, sempre

```bash
grep -n "Math.random" <arquivo>
grep -nE "document\.|querySelector|getElementById|createElement" <arquivo>
```

- **`Math.random` é proibido.** Só ocorrências em *comentário* passam. Toda
  aleatoriedade vem de `OIKOS.rng` / `OIKOS.makeRng` (seed determinística).
- **DOM é proibido** dentro de bloco de módulo. Só no harness — e, quando
  existirem, em S3 Render e S12 UI. Dentro dos marcadores = rejeição.
- **Marcadores são imutáveis:** `/* ===== OIKOS S{n} {NOME} — INÍCIO/FIM ===== */`.
  Nunca reformatar, renomear, nem mover código para fora deles.
- Sem bibliotecas, sem build, sem rede (Google Fonts é a única exceção prevista).
- Acesso a estado sempre via `OIKOS.state.x`, **nunca** capturando referência em
  closure — `reset()` reatribui o objeto inteiro.

## 6. Checklist de auditoria de um módulo

1. Os dois greps acima, no bloco **e** no harness.
2. Harness roda standalone e dá PASS em **todos** os critérios da spec.
3. Exports declarados conferem com a carta, sem renome e sem extensão silenciosa.
4. Schema do estado, constantes e nomes de evento respeitados (seções 5.1–5.4).
5. Marcadores presentes e corretos.
6. Escopo fechado — nada de módulo vizinho "de brinde".
7. Cada `// DECISÃO:` classificada: ok / vira patch / rejeitar.
8. Cada `// LACUNA:` avaliada: é pergunta legítima ao dono ou inferência disfarçada?
9. Critérios de aceite da spec conferidos **um a um** — o harness testa o que a
   carta pede, ou testa outra coisa que passa mais fácil?

O item 9 é onde um segundo olhar rende mais. Harness que passa não prova que
mede o certo.

## 7. Como reportar

```
RODADA {n} — {S#}
1. Devoluções: arquivo · linhas do bloco
2. Harness: x/x PASS por módulo (FAIL detalhado, se houver)
3. Greps: Math.random (n — onde) · DOM (n — onde)
4. Exports declarados vs carta: divergências?
5. // DECISÃO: lista + classificação (ok / patch / rejeitar)
6. // LACUNA: lista + impacto + proposta de patch (diff pronto p/ seção 11)
7. Divergências de contrato/aceite
8. Perguntas ao dono (máx. 3, objetivas)
```

Patch é **proposta com diff pronto**, nunca aplicado por você.

## 8. Decisões já ratificadas — não reabrir

A seção 11 da carta é append-only e tem o registro completo (D1–D30). As que
mais mordem numa auditoria:

- **D12** — proibida inferência silenciosa. O que faltar vira `// LACUNA:` +
  pergunta ao dono. Contexto de ambiente (memórias, grafos, conversas) **não
  cria requisito**; onde conflitar, vale a carta.
- **D13** — ordem do tick: `year++` → `update()` de todos os módulos →
  `emit('sim:tick')`. Módulos não podem assumir que `sim:tick` precede `update()`.
- **D19** — clamp `k ∈ [0, 0.9999]`. O aceite antigo "K(0.999) > 10" era
  inalcançável e foi substituído por `K(0.9999)/K(0) ≥ 3.5`.
- **D21** — `Pendulum` expõe `get vel = omega·cn(u,k)`.
- **D22** — sonda de crônica grava `refs:[source]` **e** `ato: source`.
- **D23** — entrada de crônica é `{id, year, era, type, titulo, prosa, ato,
  efeitoMedido, refs}`. Os campos `text` e `source` **não existem**.
- **D28** — Mods vivem em closure volátil; fontes persistentes re-registram
  após `load()`.
- **D29** — veios minerais restritos a PEDRA e MONTANHA (supersede D27).
- **D30** — alvo de terra `[1010, 1350]` e floresta `[12%, 26%]` sorteados por
  seed via `child('world')`.

Se você discordar de uma decisão ratificada, isso é **pergunta ao dono**, não
correção. Traga o argumento; não mexa.

## 9. O que você nunca faz

- Editar qualquer HTML em `docs/devolucoes/` — são histórico intocável. As
  cópias emendadas vivem em `docs/devolucoes/emendadas/`.
- Editar `OIKOS.md`. Só o dono muda a carta; você propõe.
- Alterar o kernel S1, a API do kernel ou os marcadores.
- Integrar, commitar ou "já deixar arrumado".
- Decidir design no lugar do dono. Na dúvida entre duas leituras da spec:
  reporte as duas, não escolha.

## 10. Quando PARAR e perguntar

- FAIL de harness que você não consegue explicar.
- Divergência de contrato sem patch aprovado.
- `// LACUNA:` que exija escolha de design (não apenas "a mais simples").
- Qualquer coisa que toque marcadores, API do kernel ou a seção 11 da carta.
