# Próximos passos — qualidade gráfica e topológica

## 0. Estatuto deste documento

**Não é fonte de verdade.** A carta (`OIKOS.md`) prevalece sobre tudo aqui. Este
arquivo é plano de trabalho: carrega o *como* técnico que a carta não carrega —
matemática, abordagem, ordem. Onde conflitar com a carta, vale a carta.

O que daqui virar contrato (spec de módulo, critério de aceite, decisão)
**migra para a carta pela seção 14** e passa a valer de lá. Este documento então
deixa de descrevê-lo e passa a apontar para a carta.

Estado na redação: carta **v1.15**, doze módulos integrados, smoke OK.

---

## 1. O problema, com evidência

O jogo funciona e está cru no visual. As causas são quatro, e são específicas:

**Não existe cache de raster.** `drawImage` aparece zero vezes no `index.html`.
Todo frame redesenha cada tile visível do zero. Isso não é só custo: é o que
*impede* detalhe, porque qualquer enfeite multiplica por ~700 tiles a 60 fps.

**Cada tile é um `fill()` de losango chapado.** Uma cor por tile, vinda de
`TABELA[terreno][bucket]`. Areia ao lado de grama é aresta dura entre polígonos.

**O rio é descida gulosa de largura 1.** `cavarRio` acha o tile de montanha mais
alto, desce pelo vizinho mais baixo e marca `T[cur] = DOCE`. Uma nascente, um
caminho, um tile de largura, sem afluentes. Traçar bonito um caminho ruim
continua dando rio ruim.

**A floresta é corte global num ruído.** `eleg.sort(...)` ordena os tiles
elegíveis por um valor de ruído e corta no K-ésimo. Limiar global dá manchas de
borda dura, e nada relaciona floresta com água — daí não haver mata ciliar.

---

## 2. A divisão que decide o custo

| | Muda o que | Re-baselina seeds? | Custo |
|---|---|---|---|
| **Render (S3)** | como a ilha é desenhada | não | spec do S3 cresce + re-auditoria |
| **Topologia (S2)** | o que a ilha **é** | **sim** | spec + aceites + D26/D29/D30 superadas + `geo` desloca a S8 |

Mexer no S2 muda todas as seeds. O harness do S2 hasheia o terreno por seed, os
aceites re-baselinam, e `geo` muda — o que desloca as decisões da S8, que se
dimensionam sobre ele (D43 existe justamente para `geo` medir o mundo de agora).

---

## 3. Rodada 7A — render (S3)

### 3.1 Cache offscreen — o destravamento, e vem primeiro

O terreno é estático entre mudanças. Desenhar o mundo uma vez num canvas fora de
tela e, a cada frame, apenas `drawImage` da região visível.

Invalidar o cache em: `tile:changed`, `border:changed`, troca de zoom, e troca de
identidade do estado (`reset`/`load`) — o mesmo gatilho que D23, D36, D37, D41 e
o S7 já usam.

**Sem isto, nada abaixo cabe nos 17 ms/frame do aceite.** Com isto, o custo por
frame deixa de depender do detalhe, e dá para exagerar à vontade.

Nota de contrato: a spec do S3 já fala em "cache chaveado por seed", mas é cache
de **cor**, não de raster. É crescimento de spec, não correção de defeito.

### 3.2 Mosaico sub-tile

Cada tile desenhado como 3×3 ou 4×4 sub-células em espaço de tile. A cor de cada
sub-célula vem de um campo de ruído amostrado em **coordenada de mundo** (não de
tela, senão o padrão nada com a câmera), misturada com o terreno vizinho
dominante perto das bordas.

É isso que dissolve o losango e dá o "mosaico que vai se construindo".

A mistura de borda é um peso simples: para a sub-célula na posição `(u,v)` dentro
do tile, `peso_vizinho = smoothstep(distância à aresta)`. Mesma `smoothstep` que
o S2 já usa na máscara radial.

### 3.3 Rio traçado, não preenchido

Hoje o rio são tiles `DOCE` pintados como losangos. Proposta: extrair a **cadeia**
de tiles do rio e traçá-la como curva — Catmull-Rom pelos centros — com:

- largura variável (ver 4.2: `f(log(acumulação))`, quando o S2 fornecer; até lá,
  largura por ordem na cadeia)
- linha de margem mais escura
- brilho especular fraco, opcional

Isso sozinho transforma mais o visual do rio do que qualquer mudança no S2.

### 3.4 Floresta como marcas

Árvores desenhadas como glifos pequenos, com densidade por tile e posição por
**hash determinístico** da coordenada — nunca `rng` por frame, que a spec do S3
já proíbe e que quebraria o determinismo visual.

Faixa ciliar visual: tiles adjacentes a água doce ganham densidade maior. Isso é
render; a mata ciliar como **fato** vem no 7B.

### 3.5 Ruínas

Pendência aberta desde a auditoria do S10: o S3 pinta caixa 3-tons para todo
`building !== 0`, então ruína (id 200) desenha como prédio inteiro. Cabe aqui,
como emenda de render — altura menor, cor dessaturada, silhueta quebrada.

### 3.6 Impacto em aceite

Os critérios geométricos do S3 (roundtrip, picking, `paintOrder`, `isZoneable`,
culling) **não mudam** — a emenda é de pintura, não de geometria. Os critérios
`[browser]` (snapshot-diff, 17 ms/frame) mudam de linha de base e precisam ser
re-rodados. Pela **14.5 item 7**, o S3 volta para ☐ até o harness re-rodar.

---

## 4. Rodada 7B — topologia (S2)

### 4.1 Preenchimento de depressões

Antes de qualquer hidrologia: encher as bacias fechadas do ruído (Planchon-
Darboux, ou priority-flood). É o que hoje obriga o `lago()` de contingência
quando a descida gulosa encalha.

### 4.2 Acumulação de fluxo — o rio de verdade

1. Direção de escoamento por tile: vizinho de descida mais íngreme (D8).
2. Processar os tiles **em ordem decrescente de elevação**, cada um passando
   `1 + acumulado` ao seu vizinho de jusante.
3. Rio = tiles com acumulação acima de um limiar.
4. **Largura = f(log(acumulação))**.

Saem de graça: tronco que engrossa rio abaixo, afluentes, meandro. É o método de
livro-texto e são ~40 linhas.

`geo.riverLength` passa a medir a cadeia principal; vale decidir se `hasRiver`
continua "alcança o mar" (D26) ou vira "acumulação máxima acima do limiar".

### 4.3 Umidade — e a mata ciliar como fato

```
umidade = decaimento(distância à água doce) + ruído de chuva
floresta = smoothstep(umidade) × aptidão(terreno)
```

Substitui o corte global no ruído. **A mata ciliar cai de graça**: tile na margem
tem umidade máxima, logo faixa densa de floresta acompanhando o rio.

Consequência de contrato: o aceite atual fixa floresta em faixa da terra (D30,
`[12%, 26%]`). Com umidade, a fração passa a **emergir** da geografia em vez de
ser alvo sorteado. Ou o aceite vira faixa mais larga, ou a D30 é superada.

### 4.4 O custo, dito claro

Toda seed gera uma ilha diferente. Hashes do harness re-baselinam. D26, D29 e D30
são superadas no que tocam geração. `geo` muda, e com ele o dimensionamento das
decisões da S8.

Não é motivo para não fazer — é motivo para fazer **depois** do 7A, e de uma vez.

---

## 5. Por que render antes de topologia

1. É onde está a maior parte do ganho percebido.
2. Não invalida nada — nenhuma seed muda, nenhum aceite de gameplay se mexe.
3. Quando o S2 melhorar depois, **o renderizador bom já está lá para mostrar**.

O inverso — topologia excelente desenhada como losango chapado — você quase não
veria, e teria pago o re-baseline antes de ter como julgar o resultado.

---

## 6. Fronteira com a S13 Polish

A S13 já é dona de: limbo no horizonte, fumaça e nuvens em Lissajous (`cn`/`sn`),
mar animado com `dn`, dia/noite por tint, carros e barcos em trilhas, áudio
procedural, nova casa sobre as ruínas.

**Mosaico, rio traçado e árvores não são S13** — são crescimento da spec do S3.
Vale manter a fronteira explícita para as duas não colidirem: a S13 põe
*atmosfera* sobre o mundo; o 7A melhora *o desenho do mundo*.

---

## 7. Decisões abertas

1. **Ordem 7A → 7B confirmada?** Ou topologia primeiro, aceitando re-baselinar
   seeds antes de ter como enxergar a diferença?
2. **A fronteira S3 × S13 da seção 6 está certa?**
3. **As ruínas entram no 7A** como emenda de render?
4. **No 7B, a D30 é superada** (fração de floresta emerge da umidade) ou o aceite
   vira faixa mais larga mantendo o sorteio?

---

## 8. Se aprovado, o que muda na carta

- **Spec do S3** (seção 6): cache de raster, mosaico sub-tile, rio traçado,
  floresta como marcas, ruínas. Critérios `[browser]` re-baselinam.
- **Spec do S2** (seção 6), no 7B: depressões, acumulação de fluxo, umidade.
  Aceites de floresta e rio reescritos.
- **Seção 11**: decisões novas para o que for ratificado; D26/D29/D30 superadas
  no 7B, sem apagar (registro é append-only).
- **Seção 8.2**: rodada 7 desdobrada em 7A e 7B.
- Incremento de **0,1 por lote aceito** (14.2), com cabeçalho e seção 13 no mesmo
  commit (14.5).
