# Próximos passos — geometria, parte a parte

## 0. Estatuto deste documento

**Não é fonte de verdade.** A carta (`OIKOS.md`) prevalece. Este arquivo é plano
de trabalho: carrega o *como* geométrico que a carta não carrega. Onde
conflitar, vale a carta.

O que daqui virar contrato migra para a carta pela **seção 14** e passa a valer
de lá. Estado na redação: carta **v1.15**, doze módulos integrados, smoke OK.

---

## 1. O método

O modo típico de errar é jogar um nome de matemática em cima do desenho e
produzir algo que parece deliberado e é arbitrário — e que quebra assim que a
câmera move. A defesa é mecânica, não é boa intenção:

> **Para cada parte: enunciar a afirmação geométrica → verificar numericamente →
> só então implementar.** Se não fechar, a ideia cai, em vez de virar código
> bonito e errado.

E uma regra que vale para tudo:

> **Pense em espaço de MUNDO, projete no fim.** Nunca desenhe em coordenada de
> tela um objeto que pertence ao mundo. Ele deixa de ser objeto do mundo assim
> que a câmera move.

O código atual viola isso na caixa 3-tons do prédio, desenhada direto em
coordenada de tela — é por isso que ela lê como adesivo, não como volume.

### 1.1 Fundamentos já verificados

Três fatos medidos, não afirmados. São a base de todas as partes.

**F1 · Círculo do mundo = elipse da tela, alinhada aos eixos, 2:1 exata.**
Um círculo de raio `r` em coordenada de mundo projeta numa elipse de semieixos
`(r·HW·√2, r·HH·√2)`, **sem termo de rotação**. Resíduo medido ~1e-15, invariante
por translação.
Consequência: `ctx.ellipse()` nativo desenha qualquer objeto redondo do mundo —
copa, poça, ondulação, pedra, cardume — exato, sem tesselar polígono.
A elipse inscrita no tile (`r = 0,5`) mede **22,627 × 11,314** e tangencia as
quatro arestas do losango nos pontos médios (resíduo 2e-16).

**F2 · Escala vertical `S = √(HW² + HH²) = 35,777088` px por unidade de mundo.**
É a única escala em que as três arestas de um cubo unitário projetam com
comprimento igual — medido: 35,777088 nas três. Relação limpa: `S = HH·√5`.
Ângulos na tela: 126,870° / 116,565° / 116,565° — dois iguais e um diferente,
assinatura de projeção **dimétrica**, não isométrica (a carta acerta ao dizer
"pseudo-isométrica").
**O código usa `ALTURA_PREDIO = 24`, que é 32,9% curto.** É a causa de os prédios
lerem achatados contra o chão.

**F3 · Meandro por `sn` generaliza a curva senoidal.**
Curva de direção senoidal (Langbein & Leopold) com `θ(s) = θmax·sn(2πs/L, k)`.
Em `k=0` reproduz `sin()` **exatamente** (erro 0,00e+0 — o critério 1 do harness
do S4 já garante `sn(u,0) === sin(u)`). Sinuosidade medida sobe monotonicamente
**1,5146 → 1,9002** com `k` de 0 a 0,99, sempre finita.
Rios meandrantes reais ficam entre 1,3 e 2,0: `k` cobre a faixa realista inteira.
**Armadilha:** `sn` tem período `4K(k)`, não `2π`. Sem renormalizar por `K(k)`,
mexer em `k` muda o *comprimento de onda* em vez da *forma*.

E `k` já significa rigidez sistêmica no jogo (D2). Sistema rígido cava rio mais
incisivo: gráfico e simulação passam a dividir um parâmetro, em vez de o gráfico
ter enfeite próprio.

---

## 2. As partes

Cada parte traz: **o que é hoje · a geometria · o que verificar antes**.

### Parte 1 · Cache offscreen — o destravamento

**Hoje:** `drawImage` aparece zero vezes. Todo frame redesenha cada tile visível
do zero. Isso não é só custo — é o que *impede* detalhe.

**A abordagem:** desenhar o mundo uma vez num canvas fora de tela; cada frame
vira um `drawImage` da região visível. Invalidar em `tile:changed`,
`border:changed`, troca de zoom e troca de identidade do estado (`reset`/`load`)
— o mesmo gatilho de D23, D36, D37 e D41.

**Verificar antes:** custo de redesenho total do cache (56×56 com detalhe cheio)
cabe num frame de folga? Se não, o cache vira por-chunk.

Vem primeiro. **Sem ele, nada abaixo cabe nos 17 ms/frame do aceite.**

### Parte 2 · Tile e mosaico

**Hoje:** um `fill()` de losango chapado, cor única de `TABELA[terreno][bucket]`.
Areia ao lado de grama é aresta dura entre polígonos.

**A geometria:** a elipse inscrita (F1) tangencia as quatro arestas nos pontos
médios. Então o tile decompõe em **núcleo elíptico + quatro pontas**: o núcleo
recebe a cor do próprio terreno, e cada ponta é zona de transição para o vizinho
daquele lado, com peso `smoothstep` da distância à aresta.

Dentro do núcleo, textura por amostragem de ruído em **coordenada de mundo** —
nunca de tela, senão o padrão nada junto com a câmera.

**Verificar antes:** a decomposição núcleo+pontas cobre o losango sem falha nem
sobreposição? Área do núcleo é `π·a·b` contra `2·HW·HH` do losango — a razão
`π/4 ≈ 0,785` diz quanto é transição.

### Parte 3 · Costa e praia

**Hoje:** máscara radial circular com `smoothstep`. Toda ilha é uma bolha
redonda.

**A geometria:** **superelipse** `|x/a|ⁿ + |y/b|ⁿ = 1`. `n` controla o quão
quadrada (n=2 elipse, n→∞ retângulo, n<2 estrela), `a/b` o alongamento. Ambos
sorteados por seed via `child('world')`, como a D30 já faz com os alvos.

A praia é a faixa onde a elevação fica perto do nível do mar — largura da faixa
inversamente proporcional ao gradiente local. Encosta íngreme dá praia estreita;
isso já sai da geometria, sem regra extra.

**Verificar antes:** faixas de `n` e `a/b` que preservam os aceites — perímetro
100% marítimo e terra ≥ 900 tiles.

### Parte 4 · Rio

**Hoje:** descida gulosa de largura 1 (`cavarRio`), uma nascente, sem afluentes.

**A geometria:** linha de centro pelo meandro-`sn` (F3), com `k` vindo da
rigidez. Traçada em Catmull-Rom pelos pontos, largura variável por
`f(log(acumulação))` quando a Parte 9 existir. **Margens são curvas-offset** da
linha de centro — distância constante na normal, não escala.

**Verificar antes:** curva-offset de Catmull-Rom gera auto-interseção em curva
fechada demais. Medir o raio de curvatura mínimo contra a largura máxima; se
`R < largura/2`, a margem se cruza e precisa de corte.

### Parte 5 · Mar

**Hoje:** retângulo de fundo de cor única, mais interpolação por poluição.

**A geometria:** `dn(u,k)` oscila entre `√(1−k²)` e 1 e **nunca cruza zero** —
`sn` e `cn` invertem sinal. Ondulação de superfície que não inverte é o
comportamento certo, e é por isso que o palpite da carta de usar `dn` para o mar
está correto.

Cristas como elipses concêntricas (F1) expandindo a partir de focos, amplitude
modulada por `dn`.

**Verificar antes:** período de `dn` também é função de `K(k)` — mesma armadilha
de F3.

### Parte 6 · Floresta e árvores

**Hoje:** tile verde chapado. Floresta é cor, não objeto.

**A geometria:** copa = círculo de mundo de raio `r` elevado por `h` → elipse
(F1) centrada em `project(x,y)` deslocada `h·S` para cima (F2). **Três ou quatro
elipses sobrepostas** de raio decrescente subindo dão volume sem sprite.

Posição por **rede jitterada**: divide o tile em células, e o centro de cada
árvore é o centro da célula deslocado por um hash da coordenada. Isso dá
espaçamento tipo ruído-azul sem sorteador de Poisson — árvores não encostam nem
formam grade.

Densidade por tile vem da umidade (Parte 10); até lá, do próprio terreno.

**Verificar antes:** a rede jitterada com deslocamento máximo de meia célula
garante distância mínima entre vizinhas? Medir o menor espaçamento sobre muitas
células.

### Parte 7 · Montanha e pedra

**Hoje:** dois terrenos chapados, 6 e 7, sem relevo algum.

**A geometria:** montanha é **cone** no mundo — base circular de raio `r`, ápice
a `h`. A base projeta em elipse (F1); o ápice, num ponto `h·S` acima do centro
(F2). A silhueta são as **duas retas tangentes** do ápice à elipse da base, mais
o arco distante entre os pontos de tangência. Tangente de ponto a elipse tem
forma fechada — não precisa de busca.

Pedra é o mesmo cone, achatado e com o ápice deslocado, repetido em poucos
exemplares por tile.

**Verificar antes:** as tangentes do ápice à elipse da base existem sempre
(ápice sempre fora da elipse, porque está acima do plano). Confirmar que a
fórmula fechada não degenera quando `h → 0`.

### Parte 8 · Minas e veios — cobre, ferro, carvão

**Hoje:** um `arc()` de raio fixo, colorido por recurso. Um ponto no chão.

**A geometria:** veio é **filão**, não ponto. Um segmento curto de direção
determinística pelo hash do tile, com pequenas elipses (F1) enfileiradas ao
longo dele, tamanho decrescente nas pontas. Cor por minério; brilho especular só
no cobre, que é o único metálico nativo da Era 1.

Só desenha em tile de pedra ou montanha — o que a D29 já garante.

**Verificar antes:** nada de geometria nova; herda F1. Verificar só que o filão
não vaza do losango, por interseção com as quatro arestas.

### Parte 9 · Caça e peixe

**Hoje:** o mesmo `arc()` genérico dos minérios. Peixe e cobre desenham igual.

**A geometria:** peixe é elipse alongada (F1, com `r` diferente nos dois eixos
do mundo antes de projetar) mais um triângulo de cauda. Vive em água; **o
cardume anda**: caminho por **Lissajous com `sn`/`cn`**, que a carta já prevê
para a S13. Lissajous com funções elípticas "demora" nos extremos conforme
`k→1` — bom para giro de cardume, que de fato desacelera na volta.

Caça é o mesmo princípio em terra, dentro de floresta, com passo mais lento.

**Verificar antes:** o caminho fecha? Lissajous fecha quando a razão de
frequências é racional; com `sn` o período é `4K(k)`, então a razão tem de ser
tomada sobre `K`, não sobre `2π`. É a armadilha de F3 de novo, num lugar novo.

### Parte 10 · Umidade, mata ciliar e floresta como fato

**Hoje:** floresta é corte global num ruído — `eleg.sort()` e corta no K-ésimo.
Limiar global dá mancha de borda dura, e nada relaciona mata com água.

**A geometria:** `umidade = decaimento(distância à água doce) + ruído de chuva`,
e `floresta = smoothstep(umidade) × aptidão(terreno)`.
**A mata ciliar cai de graça:** tile na margem tem umidade máxima, logo faixa
densa acompanhando o rio. Vira fato do mundo, não desenho.

**Custo de contrato:** o aceite fixa floresta em `[12%, 26%]` por sorteio (D30).
Com umidade, a fração **emerge** da geografia. Ou a D30 é superada, ou o aceite
vira faixa mais larga mantendo o sorteio. **Decisão aberta nº 4.**

### Parte 11 · Edifícios

**Hoje:** caixa 3-tons desenhada em coordenada de tela, altura 24 px arbitrária.

**A geometria:** **caixa de mundo projetada** — 8 vértices em coordenada de
mundo, projetados com F2, faces ordenadas por profundidade. Altura em unidades
de mundo, não em pixels: um acampamento tem 0,6 de altura, não "24 px".

Forma própria por edifício, toda derivada das primitivas já verificadas:
acampamento é cone (Parte 7, pequeno); cabana é caixa com telhado de duas águas;
pesca é plataforma sobre estacas, avançando para a água; lascamento é caixa mais
monte de elipses (pedras); trilha não tem volume, é textura no próprio tile.

**Verificar antes:** a ordem de faces por profundidade é a mesma do
`paintOrder`, ou precisa de ordenação interna por face? Uma caixa tem três faces
visíveis; medir se a ordem `(x+y)` do tile basta.

### Parte 12 · Ruínas

**Hoje:** desenham como prédio inteiro — o S3 pinta caixa 3-tons para todo
`building !== 0`, e ruína é o id 200. Pendência aberta desde a auditoria do S10.

**A geometria:** mesma caixa da Parte 11, com altura reduzida, silhueta
interrompida (uma face cortada em altura irregular por hash do tile) e cor
dessaturada na direção do terreno. A D4 diz que a Casa tem memória — a ruína
precisa **ler como ruína** para isso significar algo.

### Parte 13 · Fronteira

**Hoje:** contorno de losango desenhado por tile com dono. Lê como grade.

**A geometria:** traçar o **contorno da região**, não de cada tile — marching
squares sobre o campo `owner`, resultando numa polilinha única por componente.
Menos desenho e lê como fronteira.

**Verificar antes:** marching squares em grade de losangos precisa da tabela de
casos adaptada à vizinhança-4 do espaço de tile, não do espaço de tela.

---

## 3. Ordem sugerida

**Bloco A — render puro, nada re-baselina:**
Parte 1 (cache) → 2 (tile) → 11 e 12 (edifícios e ruínas, que compartilham F2) →
6 (árvores) → 7 (montanha) → 8 e 9 (minérios, peixe, caça) → 13 (fronteira)

**Bloco B — topologia, re-baselina todas as seeds:**
Parte 3 (costa) → 10 (umidade) → 4 (rio, com acumulação de fluxo) → 5 (mar)

Render antes de topologia porque: é onde está a maior parte do ganho percebido;
não invalida nada; e quando o S2 melhorar depois, **o renderizador bom já está lá
para mostrar**. O inverso — topologia excelente desenhada como losango chapado —
você quase não veria, e teria pago o re-baseline antes de ter como julgar.

---

## 4. O que muda na carta

- **Spec do S3** (seção 6): F1, F2 e a regra "mundo primeiro, projete no fim"
  viram contrato. Cache de raster, mosaico, formas por elemento.
- **Spec do S2** (seção 6), no bloco B: superelipse, umidade, acumulação de
  fluxo. Aceites de floresta e rio reescritos.
- **Seção 7** (matemática de referência): F1, F2 e F3 pertencem lá — são
  geometria de referência, do mesmo nível de `K(k)` e `sn`.
- **Seção 11**: decisões novas; D26/D29/D30 superadas no bloco B, sem apagar.
- **Seção 8.2**: rodada 7 desdobrada em blocos A e B.
- Incremento de 0,1 por lote aceito (14.2), cabeçalho e seção 13 no mesmo commit.

---

## 5. Decisões abertas

1. **Ordem bloco A → bloco B confirmada?**
2. **`ALTURA_PREDIO = 24` vira `S = 35,777`?** É correção de defeito geométrico,
   não preferência — mas muda o visual de tudo que tem altura, e o snapshot-diff
   do S3 re-baselina.
3. **A fronteira S3 × S13 está certa?** A S13 põe *atmosfera* (limbo, nuvens
   Lissajous, dia/noite); o bloco A melhora *o desenho do mundo*.
4. **No bloco B, a D30 é superada** (fração de floresta emerge da umidade) ou o
   aceite vira faixa mais larga mantendo o sorteio?
5. **Uma parte por rodada, ou o bloco A inteiro numa rodada?** Parte a parte
   audita melhor; o bloco inteiro integra menos vezes.
