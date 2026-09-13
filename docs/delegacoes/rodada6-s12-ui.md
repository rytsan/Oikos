Você é o desenvolvedor responsável por UM módulo do projeto OIKOS, descrito na
CARTA MESTRA abaixo. Regras absolutas:

1. Implemente apenas o módulo **S12 — UI/HUD** (seção 6).
2. O Contrato comum (seção 4) e o Núcleo canônico (seção 5) são imutáveis.
3. Proibido `Math.random`. **A S12 é uma das duas exceções autorizadas ao DOM**
   (a outra é S3) — use à vontade, mas só para interface.
4. Entregue conforme a seção 9, com os ajustes de formato abaixo.
5. Ambiguidade: escolha o mais simples e registre `// DECISÃO:`.
6. Proibida inferência silenciosa: `// LACUNA:` + o mais simples.
7. Plugins de ambiente não alteram este contrato.
8. **RUNTIME NECESSÁRIO.** Embuta VERBATIM o runtime do fim deste prompt.

---

## Adendo S12

**Marcadores** (nome canônico — é `UI`):

```
/* ===== OIKOS S12 UI — INÍCIO ===== */
/* ===== OIKOS S12 UI — FIM ===== */
```

### O problema de contrato que você VAI encontrar — declare, não resolva sozinho

A seção 4.2 lista o que um módulo pode consumir: `consts`, `rng`, `makeRng`,
`state`, `bus`, `Mods`, `Chron`, `Elliptic`. **Não lista `Sim`, `Eras`,
`Border`, `Render` nem `Worldgen`.**

Só que a S12 existe para orquestrar exatamente esses: a toolbar planta pelo
`Sim.place`, o painel Constituição adota pelo `Eras.adopt` e mostra
`Eras.custoReforma` ao vivo, o decreto chama `Border.decretar`, o tooltip de
tile precisa do `Render.unproject`.

A leitura mais simples é que a S12 é a camada de apresentação e **pode**
consumir as APIs dos módulos — a carta já a trata como especial ao abrir a
exceção de DOM. Siga essa leitura, mas **declare `// LACUNA:` explicitamente**:
é extensão da seção 4.2 e precisa de ratificação do dono, não de silêncio.

### Você é dona do resume (D46)

A **D46** é recente e é sua: o S8 pausa ao abrir a decisão e **não retoma**.
Quem devolve o loop ao jogo é a S12, ao fechar o modal, via `loop.resume()`.

A regra 5.7 continua valendo: `loop.pause()` e `loop.resume()` são os **únicos**
mutadores de `state.paused`. Nunca escreva no campo.

Hoje, sem você, a partida congela na primeira transição de era. Você é o
conserto.

### O que montar

**Topbar**: recursos (`state.res`), ano, era. **Toolbar por era** com hotkeys
1–6 e ESC — o catálogo vem de `Sim.BUILDINGS`, e o que está disponível depende
de `state.era`. **Tooltip de tile** no hover (`state.hover`, que o S3 mantém).
**Toasts** — o dicionário já tem `ui:toast`, e a S9 emite recusa por lá.
**Painéis Crônicas** (`Chron.timeline()`) e **Constituição** (vigentes, custo de
reforma ao vivo). **Modal de decisão** em `decision:open`, que pausa o tick —
e é onde o `resume()` acontece ao fechar.

**Notícias diegéticas dos sintomas**: a S10 emite eventos-sintoma em limiares
cruzados, e o `colony:collapsed` está no dicionário. Escute o bus; não invente
número na tela — a D3 proíbe barra de felicidade, e o mapa é que narra.

### Estética

Paleta terrosa e verde-oliva, fonte com caráter, **tudo navegável por teclado**.
Google Fonts é permitido com fallback (seção 3); nada mais de rede.

### Convivendo com o S3

O S3 já cria e possui o `<canvas id="oikos">`, trata arrasto, roda e hover, e
`draw()` altera só `camera` e `hover`. Não dispute esses eventos: monte sua UI
**por cima**, em elementos próprios, e cuide para que cliques na interface não
virem pan no mapa.

### Estado

Seu: `state.tool` (o schema já o tem). Não seu: todo o resto — vá pelas APIs
dos módulos e pelo bus. Acesso sempre via `OIKOS.state.x`, nunca por referência
presa em closure.

## Harness — formato contratual (seção 4 item 9, D31)

Aqui a separação importa mais que nos outros. **A lógica da UI tem de ser
testável sem browser**: quais ferramentas a era oferece, que texto o tooltip
produz, qual o custo de reforma exibido, se o `resume()` foi chamado ao fechar
o modal. Isso tudo roda headless.

Só o que exige DOM de verdade é `[browser]`, e imprime **SKIP** sob Node,
nunca FAIL (4.9b). A fronteira é estrita: só é `[browser]` o declaradamente
visual.

Linha contratual (4.9c):

```
OIKOS S12 harness: 9/9 PASS (+3 SKIP [browser])
```

## Critérios de aceite (spec S12)

- Toolbar reflete a era; hotkeys 1–6 e ESC selecionam e cancelam.
- Tooltip descreve o tile sob o cursor.
- Modal de decisão abre em `decision:open` e **`resume()` ao fechar** (D46).
- Painel Constituição mostra custo de reforma ao vivo.
- Toasts aparecem em `ui:toast`.
- Navegável por teclado.

## Entregáveis

1. HTML único rodável por duplo clique — e este é o que o dono vai ABRIR para
   ver o jogo. 2. Runtime VERBATIM + módulo entre marcadores. 3. Harness fora
   dos marcadores. 4. Exports. 5. `// DECISÃO:` e `// LACUNA:` — a extensão da
   seção 4.2 é uma delas, obrigatória. 6. Ausência de `Math.random`.

=== CARTA MESTRA ===

{{CARTA}}

=== RUNTIME INTEGRADO — BLOCOS REAIS (VERBATIM) ===

{{RUNTIME}}
