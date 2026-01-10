---
title: "Operação Spoofing"
description: "Linha do tempo e fontes públicas sobre a Operação Spoofing (PF), que investigou invasões a contas do Telegram de autoridades e seus desdobramentos judiciais."
demos:
  id: case--operacao-spoofing
  type: case
  mapLabel: spoofing
  seed: no
  seed-id: person--jose-antonio-dias-toffoli
  target-questions:
    - q--person-jose-antonio-dias-toffoli-efeitos-leniencia-spoofing-impacto-sistemico
  country: BR
  identifiers:
    wikidata: Q86727345
    wikipedia: https://pt.wikipedia.org/wiki/Opera%C3%A7%C3%A3o_Spoofing
    intercept-series: https://www.intercept.com.br/especiais/mensagens-lava-jato/
  aliases:
    - Operação Spoofing (PF)
  tags:
    - justica
    - investigacao
    - hacking
    - telegram
    - lava-jato
---
# Operação Spoofing

::: info Nota editorial (Skepvox)
Este caso envolve **invasão ilegal** de comunicações e, ao mesmo tempo, alegações
de alto impacto institucional sobre agentes públicos (Lava Jato). Por isso:

- o Skepvox registra **cronologia** e **status**, mas não trata mensagens obtidas por invasão como “verdade” sem auditoria;
- a **cadeia de custódia** e a **possibilidade de manipulação** são partes centrais do problema;
- decisões e declarações públicas (STF/AGU/imprensa) são registradas como o que são: posições e atos documentados, não “prova final”.
:::

_Última atualização: 2026-01-09. ID Skepvox: `case--operacao-spoofing`._

## Situação atual

- Status (penal): em 2023-08, houve sentença da Justiça Federal do DF (10ª Vara Federal Criminal) condenando o hacker [Walter Delgatti Neto](/demos/pessoas/walter-delgatti-neto) e outros acusados por crimes associados às invasões (segundo cobertura). Situação recursal não mapeada nesta nota (lacuna). Fontes: [VEJA (2023-08-21)](https://veja.abril.com.br/coluna/radar/juiz-condena-delgatti-a-20-anos-de-prisao-por-crimes-na-operacao-spoofing/), [CNN Brasil (2023-08-21)](https://www.cnnbrasil.com.br/politica/hacker-walter-delgatti-e-condenado-a-20-anos-de-prisao/).
- Status (uso institucional do material): em 2023-09 e 2024-02, decisões do ministro Dias Toffoli mencionaram o material apreendido na Operação Spoofing em debates sobre Lava Jato/leniências (segundo cobertura). Fontes: [Agência Brasil (2023-09-06)](https://agenciabrasil.ebc.com.br/politica/noticia/2023-09/toffoli-invalida-provas-obtidas-no-acordo-de-leniencia-da-odebrecht), [Agência Brasil (2024-02-01)](https://agenciabrasil.ebc.com.br/justica/noticia/2024-02/dias-toffoli-suspende-multa-da-novonor-antiga-odebrecht).

## Por que está no mapa

- Conexão de origem: nota derivada da semente [José Antonio Dias Toffoli](/demos/pessoas/jose-antonio-dias-toffoli), porque decisões recentes citam o material da Spoofing como insumo para reavaliar atos da Lava Jato/leniências. Fontes: [Agência Brasil (2023-09-06)](https://agenciabrasil.ebc.com.br/politica/noticia/2023-09/toffoli-invalida-provas-obtidas-no-acordo-de-leniencia-da-odebrecht), [Agência Brasil (2024-02-01)](https://agenciabrasil.ebc.com.br/justica/noticia/2024-02/dias-toffoli-suspende-multa-da-novonor-antiga-odebrecht).
- Perguntas-alvo (rastreamento): `q--person-jose-antonio-dias-toffoli-efeitos-leniencia-spoofing-impacto-sistemico`.
- Evidência mínima: a Operação Spoofing foi deflagrada em 2019 para investigar invasões a contas do Telegram de autoridades, em meio à divulgação pública de mensagens (Vaza Jato), segundo cobertura. Fontes: [G1 (2019-07-23)](https://g1.globo.com/politica/noticia/2019/07/23/pf-deflagra-operacao-em-busca-de-hacker-que-invadiu-celular-de-moro.ghtml), [Intercept (página especial)](https://www.intercept.com.br/especiais/mensagens-lava-jato/).
- Fontes-alvo (próximos passos): sentença/acórdãos integrais, laudos periciais (hashes, extração e método), peças de denúncia, movimentações processuais e regras de acesso/compartilhamento do material apreendido.

## Perguntas abertas (hipóteses)

- `q--case-operacao-spoofing-auditabilidade-integridade-cadeia-de-custodia` — Pergunta: o material apreendido na Spoofing é tecnicamente auditável (integridade, hashes, logs, método de extração) a ponto de sustentar inferências institucionais amplas? Estado: `em-apuracao`.
  - Hipótese: é auditável de forma suficientemente robusta para sustentar inferências institucionais amplas.
  - Contra‑hipótese: a auditabilidade pública disponível é insuficiente (ou limitada por lacunas de cadeia de custódia) para sustentar inferências amplas sem ressalvas.
  - Próximos passos: laudos integrais; cadeia de custódia; reprodutibilidade da extração; comparação com registros de servidor/dispositivo; auditorias independentes.
  - Notas que avançam: [Walter Delgatti Neto](/demos/pessoas/walter-delgatti-neto).
- `q--case-operacao-spoofing-uso-em-decisoes-limites-processuais` — Pergunta: decisões que citam a Spoofing (ex.: leniências/Lava Jato) usam o material dentro de limites processuais consistentes, ou ampliam indevidamente o alcance de prova/indício? Estado: `em-apuracao`.
  - Hipótese: algumas decisões ampliam indevidamente o alcance do material como prova/indício além de limites processuais consistentes.
  - Contra‑hipótese: mesmo com controvérsia técnica, o material tem valor probatório ao menos para garantir direito de defesa e revelar contradições, sem exigir “perfeita” cadeia de custódia.
  - Próximos passos: leitura das decisões integrais e fundamentos; decisões correlatas (STF/STJ); efeitos concretos; comparação com jurisprudência.
  - Notas que avançam: [Walter Delgatti Neto](/demos/pessoas/walter-delgatti-neto).

## Resumo

- Operação da Polícia Federal deflagrada em 2019 para investigar invasões a contas do Telegram de autoridades e pessoas associadas à Lava Jato, segundo cobertura. Fonte: [G1 (2019-07-23)](https://g1.globo.com/politica/noticia/2019/07/23/pf-deflagra-operacao-em-busca-de-hacker-que-invadiu-celular-de-moro.ghtml).
- O contexto público inclui a publicação, pelo Intercept, de uma série de reportagens com mensagens atribuídas a membros da Lava Jato (“Vaza Jato”) a partir de junho de 2019. Fonte: [Intercept (página especial)](https://www.intercept.com.br/especiais/mensagens-lava-jato/).
- Em 2023-08, houve condenações em 1ª instância na Justiça Federal do DF, segundo cobertura (com referência a laudos e à técnica de ataques via telefonia/VoIP). Fonte: [VEJA (2023-08-21)](https://veja.abril.com.br/coluna/radar/juiz-condena-delgatti-a-20-anos-de-prisao-por-crimes-na-operacao-spoofing/).
- Em 2023-09 e 2024-02, decisões do ministro Dias Toffoli citaram o material apreendido na Spoofing em controvérsias sobre atos/leniências relacionados à Lava Jato (segundo cobertura). Fontes: [Agência Brasil (2023-09-06)](https://agenciabrasil.ebc.com.br/politica/noticia/2023-09/toffoli-invalida-provas-obtidas-no-acordo-de-leniencia-da-odebrecht), [Agência Brasil (2024-02-01)](https://agenciabrasil.ebc.com.br/justica/noticia/2024-02/dias-toffoli-suspende-multa-da-novonor-antiga-odebrecht).

## Casos relacionados

- [Operação Lava Jato](/demos/casos/operacao-lava-jato)

## Linha do tempo

### 2019-06–2019-07 — Vazamento público e deflagração

- 2019-06-09 — O Intercept publica a página especial “Mensagens Lava Jato” (início de divulgação do material atribuído a conversas no Telegram). Status: `documented`. Fonte: [Intercept](https://www.intercept.com.br/especiais/mensagens-lava-jato/).
- 2019-07-23 — PF prende quatro em operação ligada à investigação de invasão do celular do então ministro Sergio Moro (segundo cobertura). Status: `documented`. Fonte: [G1](https://g1.globo.com/politica/noticia/2019/07/23/pf-deflagra-operacao-em-busca-de-hacker-que-invadiu-celular-de-moro.ghtml).
- 2019-07-26 — Preso diz à PF que entregou de forma anônima a jornalista mensagens interceptadas, segundo cobertura (depoimento citado). Status: `documented`. Fonte: [G1](https://g1.globo.com/politica/noticia/2019/07/26/preso-diz-a-pf-que-entregou-de-forma-anonima-a-jornalista-mensagens-interceptadas.ghtml).
- 2019-07-26 — Hacker diz que Manuela D’Ávila intermediou contato com Glenn Greenwald; ex-deputada confirma ter sido contatada, segundo cobertura. Status: `documented`. Fonte: [G1](https://g1.globo.com/politica/noticia/2019/07/26/hacker-diz-que-manuela-davila-intermeditou-contato-com-glenn-greenwald-ex-candidata-confirma.ghtml).
- 2019-07-26 — Análise técnica descreve “receita de ataque” e limitações do método (segundo cobertura/coluna especializada). Status: `documented`. Fonte: [G1 (Altieres Rohr)](https://g1.globo.com/economia/tecnologia/blog/altieres-rohr/post/2019/07/26/receita-de-ataque-expoe-limitacoes-e-amadorismo-de-hackers-que-acessaram-mensagens-do-telegram.ghtml).

### 2019-08–2023-08 — Processo e julgamento (lacuna parcial)

- 2019-08–2023-08 — Nenhuma informação encontrada até o momento (nesta nota) sobre denúncia, audiências, pedidos, decisões intermediárias e recursos; a cronologia retoma na sentença de 2023-08 (a expandir com documentos primários e movimentação processual).

### 2023–2024 — Sentença e uso institucional do material

- 2023-08-21 — Sentença condena [Walter Delgatti Neto](/demos/pessoas/walter-delgatti-neto) e outros acusados por crimes ligados à Operação Spoofing (organização criminosa, lavagem, invasão de dispositivo informático, interceptação etc.), segundo cobertura. Status: `documented`. Fontes: [VEJA](https://veja.abril.com.br/coluna/radar/juiz-condena-delgatti-a-20-anos-de-prisao-por-crimes-na-operacao-spoofing/), [CNN Brasil](https://www.cnnbrasil.com.br/politica/hacker-walter-delgatti-e-condenado-a-20-anos-de-prisao/).
- 2023-09-06 — Em decisão sobre leniência da Odebrecht, o ministro Dias Toffoli determina que a PF apresente o conteúdo integral das mensagens apreendidas na Operação Spoofing (segundo cobertura). Status: `documented`. Fontes: [Agência Brasil](https://agenciabrasil.ebc.com.br/politica/noticia/2023-09/toffoli-invalida-provas-obtidas-no-acordo-de-leniencia-da-odebrecht), [Decisão (PDF)](https://www.conjur.com.br/wp-content/uploads/2023/09/toffoli-declara-imprestaveis-provas.pdf).
- 2024-02-01 — Em decisão sobre Novonor (antiga Odebrecht), Toffoli suspende multa e relaciona a medida ao acesso/análise do material da Operação Spoofing (segundo cobertura). Status: `documented`. Fonte: [Agência Brasil](https://agenciabrasil.ebc.com.br/justica/noticia/2024-02/dias-toffoli-suspende-multa-da-novonor-antiga-odebrecht).

## Eventos

### 2019

- 2019-06-09 — Início público do episódio conhecido como “Vaza Jato” (publicação do Intercept). Status: `documented`. Fonte: [Intercept](https://www.intercept.com.br/especiais/mensagens-lava-jato/).
- 2019-07-23 — Deflagração da Operação Spoofing e prisões/mandados relacionados à investigação de invasões de contas do Telegram (segundo cobertura). Status: `documented`. Fonte: [G1](https://g1.globo.com/politica/noticia/2019/07/23/pf-deflagra-operacao-em-busca-de-hacker-que-invadiu-celular-de-moro.ghtml).
- 2019-07-26 — Depoimento (segundo cobertura): preso afirma ter entregue mensagens a jornalista de forma anônima. Status: `documented`. Fonte: [G1](https://g1.globo.com/politica/noticia/2019/07/26/preso-diz-a-pf-que-entregou-de-forma-anonima-a-jornalista-mensagens-interceptadas.ghtml).
- 2019-07-26 — Depoimento e reação pública (segundo cobertura): hacker aponta intermediação de contato com Glenn Greenwald; Manuela D’Ávila confirma versão de contato, com ressalvas. Status: `documented`. Fonte: [G1](https://g1.globo.com/politica/noticia/2019/07/26/hacker-diz-que-manuela-davila-intermeditou-contato-com-glenn-greenwald-ex-candidata-confirma.ghtml).
- 2019-07-26 — Análise técnica do método de invasão (“receita de ataque”), com discussão de limitações e possíveis vetores. Status: `documented`. Fonte: [G1 (Altieres Rohr)](https://g1.globo.com/economia/tecnologia/blog/altieres-rohr/post/2019/07/26/receita-de-ataque-expoe-limitacoes-e-amadorismo-de-hackers-que-acessaram-mensagens-do-telegram.ghtml).

### 2023–2024

- 2023-08-21 — Sentença: condenações e descrição (na cobertura) de laudos periciais e volume de alvos/chamadas via VoIP associados aos ataques. Status: `documented`. Fonte: [VEJA](https://veja.abril.com.br/coluna/radar/juiz-condena-delgatti-a-20-anos-de-prisao-por-crimes-na-operacao-spoofing/).
- 2023-09-06 — Decisão do ministro Dias Toffoli determina apresentação integral das mensagens apreendidas na Operação Spoofing (segundo cobertura/documento). Status: `documented`. Fontes: [Agência Brasil](https://agenciabrasil.ebc.com.br/politica/noticia/2023-09/toffoli-invalida-provas-obtidas-no-acordo-de-leniencia-da-odebrecht), [Decisão (PDF)](https://www.conjur.com.br/wp-content/uploads/2023/09/toffoli-declara-imprestaveis-provas.pdf).
- 2024-02-01 — Decisão do ministro Dias Toffoli suspende multa da Novonor e relaciona o tema ao acesso/análise do material da Spoofing (segundo cobertura). Status: `documented`. Fonte: [Agência Brasil](https://agenciabrasil.ebc.com.br/justica/noticia/2024-02/dias-toffoli-suspende-multa-da-novonor-antiga-odebrecht).

## Pessoas relacionadas

- [José Antonio Dias Toffoli](/demos/pessoas/jose-antonio-dias-toffoli) — decisões recentes citam/acionam o material da Spoofing (segundo cobertura). Fontes: [Agência Brasil (2023-09-06)](https://agenciabrasil.ebc.com.br/politica/noticia/2023-09/toffoli-invalida-provas-obtidas-no-acordo-de-leniencia-da-odebrecht), [Agência Brasil (2024-02-01)](https://agenciabrasil.ebc.com.br/justica/noticia/2024-02/dias-toffoli-suspende-multa-da-novonor-antiga-odebrecht).
- [Walter Delgatti Neto](/demos/pessoas/walter-delgatti-neto) — citado como réu/condenado em 1ª instância no caso (segundo cobertura). Fonte: [G1 (2023-08-21)](https://g1.globo.com/politica/noticia/2023/08/21/hacker-delgatti-e-condenado-a-20-anos-na-operacao-que-investiga-o-vazamento-de-conversas-da-lava-jato.ghtml).
- [Sergio Fernando Moro](/demos/pessoas/sergio-fernando-moro) — citado nas matérias como alvo inicial/central das invasões (2019). Fonte: [G1](https://g1.globo.com/politica/noticia/2019/07/23/pf-deflagra-operacao-em-busca-de-hacker-que-invadiu-celular-de-moro.ghtml).
- [Luiz Inácio Lula da Silva (Lula)](/demos/pessoas/luiz-inacio-lula-da-silva) — citado na cobertura sobre decisões que determinam acesso/uso do material em disputas sobre Lava Jato. Fonte: [Agência Brasil](https://agenciabrasil.ebc.com.br/politica/noticia/2023-09/toffoli-invalida-provas-obtidas-no-acordo-de-leniencia-da-odebrecht).
- Pessoas citadas nas fontes (sem página ainda no Skepvox): Glenn Greenwald; Manuela D’Ávila; integrantes do MPF/Lava Jato (ex.: Deltan Dallagnol); juiz Ricardo Leite (10ª Vara Federal Criminal do DF); delator Luiz Henrique Molição.

## Organizações relacionadas

- Instituições citadas nas fontes (sem página ainda no Skepvox): Polícia Federal (PF); Justiça Federal do Distrito Federal (10ª Vara Federal Criminal); Supremo Tribunal Federal (STF); Ministério Público Federal (MPF); Advocacia-Geral da União (AGU); Novonor/Odebrecht; empresa de telefonia VoIP mencionada na cobertura (ex.: BRVOZ); The Intercept Brasil.

## Fontes

- Wikipédia — “Operação Spoofing” (acesso em 2026-01-09): https://pt.wikipedia.org/wiki/Opera%C3%A7%C3%A3o_Spoofing
- Intercept — “Mensagens Lava Jato” (página especial) (acesso em 2026-01-09): https://www.intercept.com.br/especiais/mensagens-lava-jato/
- G1 — “Polícia Federal prende quatro em operação que investiga invasão do celular de Sergio Moro” (acesso em 2026-01-09): https://g1.globo.com/politica/noticia/2019/07/23/pf-deflagra-operacao-em-busca-de-hacker-que-invadiu-celular-de-moro.ghtml
- G1 — “Preso diz à PF que entregou de forma anônima a jornalista mensagens interceptadas” (acesso em 2026-01-09): https://g1.globo.com/politica/noticia/2019/07/26/preso-diz-a-pf-que-entregou-de-forma-anonima-a-jornalista-mensagens-interceptadas.ghtml
- G1 — “Hacker diz que Manuela D’Ávila intermediou contato com Glenn Greenwald; ex-deputada confirma” (acesso em 2026-01-09): https://g1.globo.com/politica/noticia/2019/07/26/hacker-diz-que-manuela-davila-intermeditou-contato-com-glenn-greenwald-ex-candidata-confirma.ghtml
- G1 (Altieres Rohr) — “‘Receita de ataque’ expõe limitações e amadorismo de hackers que acessaram mensagens do Telegram” (acesso em 2026-01-09): https://g1.globo.com/economia/tecnologia/blog/altieres-rohr/post/2019/07/26/receita-de-ataque-expoe-limitacoes-e-amadorismo-de-hackers-que-acessaram-mensagens-do-telegram.ghtml
- G1 — “Hacker Delgatti é condenado a 20 anos de prisão…” (Operação Spoofing) (acesso em 2026-01-09): https://g1.globo.com/politica/noticia/2023/08/21/hacker-delgatti-e-condenado-a-20-anos-na-operacao-que-investiga-o-vazamento-de-conversas-da-lava-jato.ghtml
- VEJA — “Juiz condena Delgatti a 20 anos de prisão por crimes na Operação Spoofing” (acesso em 2026-01-09): https://veja.abril.com.br/coluna/radar/juiz-condena-delgatti-a-20-anos-de-prisao-por-crimes-na-operacao-spoofing/
- CNN Brasil — “Justiça do DF condena hacker Delgatti a 20 anos de prisão pela operação Spoofing” (acesso em 2026-01-09): https://www.cnnbrasil.com.br/politica/hacker-walter-delgatti-e-condenado-a-20-anos-de-prisao/
- Agência Brasil — “Toffoli invalida provas obtidas no acordo de leniência da Odebrecht” (acesso em 2026-01-09): https://agenciabrasil.ebc.com.br/politica/noticia/2023-09/toffoli-invalida-provas-obtidas-no-acordo-de-leniencia-da-odebrecht
- ConJur — Decisão (PDF) citada (acesso em 2026-01-09): https://www.conjur.com.br/wp-content/uploads/2023/09/toffoli-declara-imprestaveis-provas.pdf
- Agência Brasil — “Dias Toffoli suspende multa da Novonor, antiga Odebrecht” (acesso em 2026-01-09): https://agenciabrasil.ebc.com.br/justica/noticia/2024-02/dias-toffoli-suspende-multa-da-novonor-antiga-odebrecht
