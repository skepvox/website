---
title: "CPMI do INSS"
description: "Linha do tempo e fontes públicas sobre a CPMI do INSS (Congresso/Senado), criada para apurar descontos não autorizados em benefícios."
demos:
  id: case--cpmi-do-inss
  type: case
  mapLabel: cpmi-inss
  seed: no
  seed-id: person--luiz-inacio-lula-da-silva
  target-questions:
    - q--person--antonio-carlos-camilo-antunes--001
    - q--person--fabio-luis-lula-da-silva--001
  country: BR
  aliases:
    - CPMI do INSS
    - Comissão Parlamentar Mista de Inquérito do INSS
    - Fraudes no INSS (CPMI)
    - Descontos indevidos no INSS (CPMI)
    - Descontos associativos no INSS (CPMI)
  tags:
    - previdencia
    - inss
    - cpmi
    - senado
---

# CPMI do INSS

::: info Nota editorial (Skepvox)
Esta página descreve a **CPMI do INSS** (Congresso/Senado) como instrumento de investigação parlamentar,
com foco em **cronologia**, **status** e **fontes públicas**. Alegações aparecem como alegações (“segundo cobertura”).
:::

_Última atualização: 2026-01-12. ID Skepvox: `case--cpmi-do-inss`._

<DemosEntityMap />

## Situação atual

- Status (alto nível): a CPMI do INSS foi criada em agosto de 2025 e tem funcionamento previsto até março de 2026, segundo notícia institucional do Senado. Fonte: [Agência Senado (2025-09-25)](https://www12.senado.leg.br/noticias/materias/2025/09/25/careca-do-inss-se-compromete-a-enviar-documentos-de-empresas-a-cpmi).
- Fontes primárias (Senado): é possível auditar colegiado, reuniões, documentos e notas taquigráficas via Dados Abertos do Senado (ex.: colegiado `2794`). Fonte: [Senado (Dados Abertos)](https://legis.senado.leg.br/dadosabertos/comissao/2794).
- Atividade registrada: em 2025-09-25, [Antônio Carlos Camilo Antunes](/demos/pessoas/antonio-carlos-camilo-antunes) depôs à CPMI, segundo notícia institucional. Fonte: [Agência Senado (2025-09-25)](https://www12.senado.leg.br/noticias/materias/2025/09/25/careca-do-inss-se-compromete-a-enviar-documentos-de-empresas-a-cpmi).
- Nomes citados (cautela): [Fábio Luís Lula da Silva](/demos/pessoas/fabio-luis-lula-da-silva) é citado em cobertura no contexto da CPMI; a BBC registra que ele “não é investigado no caso” na data do texto. Fonte: [BBC (2025-12-04)](https://www.bbc.com/portuguese/articles/cj69rj80g00o).

## Por que está no mapa

- Conexão de origem: rede inicial de [Luiz Inácio Lula da Silva](/demos/pessoas/luiz-inacio-lula-da-silva), via menções em cobertura e registro institucional de atividades da CPMI no caso. Fontes: [Agência Senado (2025-09-25)](https://www12.senado.leg.br/noticias/materias/2025/09/25/careca-do-inss-se-compromete-a-enviar-documentos-de-empresas-a-cpmi), [BBC (2025-12-04)](https://www.bbc.com/portuguese/articles/cj69rj80g00o).
- Perguntas-alvo (rastreamento): `q--person--antonio-carlos-camilo-antunes--001`; `q--person--fabio-luis-lula-da-silva--001`.
- Evidência mínima: há registro institucional do Senado sobre a CPMI, incluindo oitiva de depoente e escopo relacionado a descontos não autorizados em benefícios do INSS. Fonte: [Agência Senado (2025-09-25)](https://www12.senado.leg.br/noticias/materias/2025/09/25/careca-do-inss-se-compromete-a-enviar-documentos-de-empresas-a-cpmi).
- Fontes-alvo (próximos passos): atas, requerimentos e transcrições públicas da CPMI; documentos disponibilizados oficialmente; relatório final (quando houver) e encaminhamentos formais.

## Perguntas abertas (hipóteses)

- `q--case--cpmi-do-inss--001`
  - Pergunta: quais requerimentos, oitivas, documentos recebidos e relatórios da CPMI do INSS estão publicamente acessíveis, e como eles se conectam a peças/decisões públicas da investigação (PF/CGU)?
  - Estado: `em-apuracao`.
  - Hipótese: existe documentação pública suficiente (atas, requerimentos e transcrições) para mapear, com rastreabilidade, o que foi alegado e quais foram os encaminhamentos formais da CPMI.
  - Contra‑hipótese: parte relevante permanece sem publicização (ou em formatos difíceis de auditar), e a CPMI gera mais sinal político do que evidência documental rastreável.
  - Próximos passos: inventariar (com IDs) reuniões, requerimentos, documentos e notas taquigráficas via Dados Abertos; registrar o que é público vs. não publicado; cruzar peças parlamentares com peças/decisões públicas da investigação (PF/CGU).
  - Notas que avançam: [Operação Sem Desconto (PF/CGU)](/demos/casos/operacao-sem-desconto).

## Fontes primárias (Senado / Dados Abertos)

Esta seção serve como “índice operacional” para localizar documentos e reuniões da CPMI do INSS em fontes públicas primárias.

### Colegiado (código `2794`)

- Detalhes do colegiado (CPMI - INSS): https://legis.senado.leg.br/dadosabertos/comissao/2794

### Documentos apresentados (Processo → Documento)

O endpoint recomendado (sucessor de `/comissao/.../documentos`) permite filtrar documentos por colegiado, mas restringe o período por requisição:

- https://legis.senado.leg.br/dadosabertos/processo/documento?codigoColegiado=2794&dataInicio=2025-08-01&dataFim=2026-01-12

Nota: a API limita o período a **6 meses** por consulta; para cobrir todo o intervalo, usar janelas sequenciais.

### Agenda e reuniões

- Agenda por data (`AAAAMMDD`): https://legis.senado.leg.br/dadosabertos/comissao/agenda/20250925
- A agenda retorna o `codigo` (ID) da reunião, que pode ser usado para buscar o detalhe.

### Detalhe da reunião (pauta, ata, resultado, vídeo)

- Detalhe de reunião (exemplo `13989`): https://legis.senado.leg.br/dadosabertos/comissao/reuniao/13989
- O detalhe pode incluir links diretos para PDFs publicados (pauta simples/cheia, ata, resultado) via `sdleg-getter/documento/download/<uuid>` e, quando aplicável, link para ECidadania.

### Notas taquigráficas (texto + áudio)

- Notas taquigráficas por reunião (exemplo `13989`): https://legis.senado.leg.br/dadosabertos/taquigrafia/notas/reuniao/13989

### Exemplo (25/09/2025 — reunião `13989`)

- Agenda (descobrir o ID): https://legis.senado.leg.br/dadosabertos/comissao/agenda/20250925
- Detalhe (pauta/ata/resultado + links): https://legis.senado.leg.br/dadosabertos/comissao/reuniao/13989
- Notas taquigráficas (texto + áudio): https://legis.senado.leg.br/dadosabertos/taquigrafia/notas/reuniao/13989

## Linha do tempo

- 2025-08 — Notícia institucional do Senado registra que a CPMI do INSS foi criada no “último mês de agosto”. Status: `documented`. Fonte: [Agência Senado (2025-09-25)](https://www12.senado.leg.br/noticias/materias/2025/09/25/careca-do-inss-se-compromete-a-enviar-documentos-de-empresas-a-cpmi).
- 2025-09-25 — [Antônio Carlos Camilo Antunes](/demos/pessoas/antonio-carlos-camilo-antunes) depõe à CPMI do INSS e declara inocência, segundo notícia institucional. Status: `documented`. Fonte: [Agência Senado (2025-09-25)](https://www12.senado.leg.br/noticias/materias/2025/09/25/careca-do-inss-se-compromete-a-enviar-documentos-de-empresas-a-cpmi).
- 2025-12-04 — Reportagem descreve disputas e alegações envolvendo o nome de [Fábio Luís Lula da Silva](/demos/pessoas/fabio-luis-lula-da-silva) no contexto da CPMI, e registra que ele não é investigado (na data do texto). Status: `reported`. Fonte: [BBC (2025-12-04)](https://www.bbc.com/portuguese/articles/cj69rj80g00o).

## Pessoas relacionadas

- [Antônio Carlos Camilo Antunes](/demos/pessoas/antonio-carlos-camilo-antunes) — depoente citado em notícia institucional da CPMI do INSS. Fonte: [Agência Senado (2025-09-25)](https://www12.senado.leg.br/noticias/materias/2025/09/25/careca-do-inss-se-compromete-a-enviar-documentos-de-empresas-a-cpmi).
- [Fábio Luís Lula da Silva](/demos/pessoas/fabio-luis-lula-da-silva) — citado em cobertura jornalística no contexto da CPMI do INSS; reportagem registra que ele não é investigado no caso (na data do texto). Fonte: [BBC (2025-12-04)](https://www.bbc.com/portuguese/articles/cj69rj80g00o).

## Organizações relacionadas

- Instituições citadas nas fontes (sem página ainda no Skepvox): Senado Federal; CPMI do INSS; Instituto Nacional do Seguro Social (INSS).

## Casos relacionados

- [Operação Sem Desconto (PF/CGU)](/demos/casos/operacao-sem-desconto)

## Fontes

- Senado Notícias — “‘Careca do INSS’ se compromete a enviar documentos de empresas à CPMI” (acesso em 2026-01-12): https://www12.senado.leg.br/noticias/materias/2025/09/25/careca-do-inss-se-compromete-a-enviar-documentos-de-empresas-a-cpmi
- BBC News Brasil — “Amiga de Lulinha na mira da PF: o que se sabe…” (acesso em 2026-01-12): https://www.bbc.com/portuguese/articles/cj69rj80g00o
- Senado (Dados Abertos) — Detalhes do colegiado `2794` (acesso em 2026-01-12): https://legis.senado.leg.br/dadosabertos/comissao/2794
- Senado (Dados Abertos) — Agenda de reuniões (2025-09-25) (acesso em 2026-01-12): https://legis.senado.leg.br/dadosabertos/comissao/agenda/20250925
- Senado (Dados Abertos) — Detalhe da reunião `13989` (acesso em 2026-01-12): https://legis.senado.leg.br/dadosabertos/comissao/reuniao/13989
- Senado (Dados Abertos) — Notas taquigráficas (reunião `13989`) (acesso em 2026-01-12): https://legis.senado.leg.br/dadosabertos/taquigrafia/notas/reuniao/13989
- Senado (Dados Abertos) — Documentos por colegiado (Processo → Documento; `codigoColegiado=2794`) (acesso em 2026-01-12): https://legis.senado.leg.br/dadosabertos/processo/documento?codigoColegiado=2794&dataInicio=2025-08-01&dataFim=2026-01-12
