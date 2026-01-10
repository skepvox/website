---
title: Metodologia
description: "Regras de escrita, fontes, status e correções para a rota `/demos` do Skepvox."
---

# Metodologia (Skepvox)

Esta página define regras mínimas para manter a rota `/demos` do Skepvox útil,
verificável e justa.

## 1) Princípios

- Evidência antes de opinião.
- Linguagem neutra e anti-difamação (sem rótulos; status explícito).
- Privacidade: sem doxxing e sem incentivo a assédio.
- Correções fazem parte do trabalho (conteúdo é vivo).

## 2) Tipos de conteúdo

- **Pessoa**: atuação pública (política, empresarial, institucional).
- **Organização**: empresa, órgão público, partido, associação etc.
- **Evento**: fato datado (nomeação, contrato, denúncia, sentença, votação…).
- **Caso/Processo**: inquérito/ação/processo com identificador, quando houver.

## 3) Linha do tempo vs Eventos

Para reduzir ambiguidade e facilitar cruzamentos, cada nota de entidade deve ter
duas camadas:

- **Linha do tempo**: “CV” contínuo (por períodos) desde o marco inicial.
  - Pessoa: começa com **nascimento**.
  - Organização/empresa: começa com **fundação/criação**.
  - Caso: começa com a **ocorrência** (ou abertura do procedimento) que define o caso.
  - Se houver lacunas relevantes, elas devem ser explícitas (ex.: `1975–1980 — Nenhuma informação encontrada.`).
- **Eventos**: lista de fatos datados, pontuais e verificáveis (o máximo possível),
  cada um com `Status` + `Fonte`.

## 4) Como escrever eventos

Cada evento deve ter:

- Data (ou intervalo).
- Descrição curta e neutra.
- Status quando aplicável: investigado/denunciado/réu/condenado/absolvido etc.
- Fonte(s) (idealmente primárias).

Evitar:

- “Fulano é corrupto”.
- Julgamento moral sem base documental.

Preferir:

- “Segundo decisão X…”
- “De acordo com reportagem Y…”
- “Foi denunciado por… (status atual: …)”

## 5) Fontes

Fonte é **evidência**, não “autoridade”. Nenhuma fonte é automaticamente
confiável — inclusive fontes oficiais, indicadores e KPIs podem ser publicados
de forma incompleta, enviesada ou manipulada.

Regras práticas:

- **Triangulação**: para afirmações relevantes, buscar 2+ fontes independentes.
  Se houver apenas 1 fonte, escrever isso explicitamente e reduzir o escopo do
  texto ao que a fonte diz (“segundo X…”).
- **Fontes conflitantes**: não “escolher um lado” sem base; registrar a
  divergência e atualizar quando houver decisão/auditoria/retificação.
- **KPI/indicador**: sempre incluir definição, metodologia, período, base de
  comparação e possíveis limitações. Tratar como “indicador publicado por X”
  até haver auditoria/checagem independente.
- **Arquivamento**: sempre registrar data de acesso e, quando possível, guardar
  link arquivado (ex.: Web Archive/Wayback) e registrar data de acesso.

### Páginas mutáveis (arquivamento)

Algumas URLs são “mutáveis” (ex.: páginas institucionais que trocam de conteúdo
quando muda a gestão). Para reduzir perda de contexto:

- priorize links arquivados (Wayback/Web Archive) quando funcionarem;
- registre claramente a data de acesso e, se aplicável, a data do arquivamento.

Nota: nesta fase, o Skepvox **não** mantém snapshots locais (PDF/PNG/HTML) como
rotina, por custo/escala.

Tipos de fontes (uso recomendado):

- **Documento público/primário** (Diário Oficial, decisões, acórdãos, TCU):
  ótimo para “o que foi registrado”, mas não garante interpretação correta.
- **Auditoria/controle** (TCU, CGU, relatórios técnicos públicos):
  geralmente forte, mas ainda exige leitura crítica e contexto.
- **Imprensa**: útil para cronologia e contexto; preferir múltiplas matérias e
  evitar extrapolar além do texto publicado.

## 6) Correções

Quando houver disputa, a regra é simples:

- Ajustar texto para refletir o que a fonte realmente diz.
- Atualizar status (ex.: investigação arquivada).
- Registrar a mudança na própria página (data + motivo + fonte).

## 7) IDs e consistência

Para facilitar automação e grafos, as páginas devem usar IDs estáveis (ex.:
`person--nome-sobrenome`, `org--empresa-x`, `evt--yyyy-mm-dd--slug`).

- Use `--` entre tipo e slug (`person--...`).
- Use `-` dentro do slug (sem espaços e sem `--`).
- Use `demos.mapLabel` para um rótulo curto no `/demos/mapa` (1–2 palavras ou sigla; use `-` para separar).

Além do `demos.id`, use `demos.identifiers` para guardar identificadores
externos públicos (ex.: `wikidata`, `tse`, `cnpj` quando aplicável).

- Não armazenar CPF (nem “parcial”).
- Para rastrear a linhagem do grafo, toda página de entidade deve declarar:
  - `demos.seed`: `yes` (semente) ou `no` (nota derivada);
  - `demos.seed-id`: o `demos.id` da semente que originou a nota.

## 8) Abordagem investigativa (hipóteses e rede)

O Skepvox não assume que “já sabemos a verdade”. A postura é **investigativa**:
partimos do que é verificável, registramos lacunas e formulamos hipóteses
**testáveis**.

Regras:

- **Hipótese não é fato**: hipótese deve ser escrita como pergunta ou possibilidade
  (“pode ter havido…?”), nunca como acusação (“houve manipulação…”), até haver
  evidência robusta e corroborada.
- **Evitar viés de confirmação**: para cada hipótese relevante, registrar pelo
  menos 1 **contra-hipótese** plausível e quais evidências a sustentariam.
- **Expansão do grafo não é aleatória**: novas páginas (pessoas/organizações/casos)
  devem nascer de uma **conexão documentada** (um evento, vínculo ou citação com fonte).
  Isso mantém o mapa “rastreador”, não “enciclopédico”.
- **Perguntas abertas são parte do conteúdo**: manter uma seção “Perguntas abertas”
  quando existir incerteza material, com próximos passos e fontes-alvo (ex.: decisão,
  acórdão, relatório técnico, auditoria, entrevistas públicas). Para reforçar o foco
  investigativo, essa seção deve ficar **logo no topo** da nota, imediatamente após
  “Por que está no mapa”.

### Rastreio de perguntas (perguntas-alvo)

Para garantir que o mapa avance hipóteses (em vez de só criar novas), cada “Pergunta aberta”
deve ser rastreável e cada nota derivada deve declarar quais perguntas ela tenta reduzir.

Regras:

- **Toda pergunta tem um ID estável** (para busca, automação e revisão):
  - Formato: `q--<escopo>-<slug-do-escopo>-<assunto>`.
  - `escopo`: `person`, `org` ou `case`.
  - `slug-do-escopo`: o slug do arquivo da entidade (sem o prefixo `person--`/`org--`/`case--`).
  - `assunto`: resumo curto em slug (`-`), sem `--`.
  - Ex.: `q--case-operacao-spoofing-auditabilidade-integridade-cadeia-de-custodia`.
- **Toda pergunta tem um “Estado”** (sempre explícito):
  - `aberta` — sem trabalho direcionado ainda.
  - `em-apuracao` — existe pelo menos 1 nota derivada atacando a pergunta.
  - `parcial` — parte da pergunta foi respondida com evidência; lacunas relevantes permanecem.
  - `respondida` — a pergunta foi respondida dentro do que é verificável publicamente (com fontes).
  - `refutada` — evidência robusta contradiz a hipótese principal (e a contra-hipótese explica melhor).
  - `inconclusiva` — não há evidência suficiente, mesmo após tentativas de apuração.
- **Notas derivadas devem declarar perguntas-alvo no frontmatter**:
  - `demos.target-questions`: lista de IDs `q--...` que a nota pretende avançar (1–3, por padrão).
  - No corpo, repetir em `## Por que está no mapa` como “Perguntas-alvo (rastreamento)” (para leitura humana).
- **Manutenção obrigatória (mapa vivo)**:
  - Ao criar/atualizar uma nota derivada, revisitar as notas onde as perguntas-alvo vivem para:
    - atualizar o `Estado` (geralmente para `em-apuracao` ou `parcial`),
    - adicionar “Notas que avançam” (links) dentro da pergunta,
    - e ajustar “Próximos passos” conforme novos documentos/peças surgirem.

Formato sugerido para hipóteses (no corpo da página):

- `Hipótese (aberta)` — enunciado curto; o que sustentaria; o que refutaria; quais fontes buscar.

Formato sugerido para perguntas abertas (no corpo da página):

- `q--...` — Pergunta: … Estado: `aberta`.
  - Hipótese: …
  - Contra-hipótese: …
  - Próximos passos: … (documentos-alvo)
  - Notas que avançam: … (links internos)

### Escolha do próximo nó (não aleatório)

Para evitar um “mini‑wikipedia”, novas páginas devem ser criadas como **próximo
passo investigativo** — isto é, como uma pista que reduz incerteza e abre
documentos/decisões para verificação.

Antes de criar uma nova página, responda:

- Qual hipótese/pergunta ela ajuda a **testar** agora?
- Qual conexão **documentada** justifica a criação (evento/vínculo + fonte)?
- Quais documentos primários essa página ajuda a buscar (voto, acórdão,
  relatório, ata, contrato, registro público)?

Regra: toda nova página deve, logo após a linha de atualização, incluir:

- **“Situação atual”** (o que sabemos hoje: cargo/função, localização em alto nível,
  vínculo institucional, custódia quando aplicável — sempre sem doxxing);
- **“Por que está no mapa”** (conexão de origem + evidência mínima + fontes-alvo).
- **“Perguntas abertas (hipóteses)”** (quando houver): IDs `q--...`, estado, próximos passos
  e links para “Notas que avançam”.

Regra de manutenção (mapa vivo):

- Quando uma nota derivada for criada ou atualizada, revisar as notas relacionadas
  para decidir se:
  - um novo item deve entrar em **Eventos** e/ou **Linha do tempo**, ou
  - se basta criar/atualizar o **link** entre as notas (com fonte).

## 9) Exportação de dados (JSON/JSONL) e Mapa

Para manter o conteúdo “pronto” para:

- **busca/SEO** (dados estruturados e indexáveis),
- **visualização de rede** (nós/arestas),
- e futura **aplicação de IA** (treino/consulta),

o Skepvox exporta cada nota do `/demos` para um artefato público em JSON.

Regras:

- **Markdown é a fonte da verdade**: o JSON é derivado (regerável).
- A exportação deve preservar o conteúdo integral (frontmatter + corpo).
- O grafo do `/demos/mapa` deve ser gerado a partir desses dados, não “na mão”.

Comandos:

- Gerar dados: `pnpm demos:data`
- Restaurar notas a partir do JSON (emergência): `pnpm demos:import`

Saídas:

- `src/public/demos-data/notes/<demos.id>.json` — 1 arquivo por nota.
- `src/public/demos-data/notes.jsonl` — todas as notas em JSONL (1 linha por nota).
- `src/public/demos-data/graph.json` — grafo agregado consumido por `/demos/mapa`.
