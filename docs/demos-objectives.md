# Skepvox — Estratégia de Conteúdo (Pessoas, Poder e Responsabilização)

> A rota `/demos` (do grego: “povo”) aqui é um projeto de cidadania: construir um atlas
> navegável de **pessoas**, **cargos**, **organizações** e **eventos públicos**
> (bons, ruins e controversos), com **fontes** e **rastreabilidade**, para apoiar
> análise, visualização de conexões e pesquisa assistida por IA.

Este documento é a “fonte de verdade” sobre o modelo editorial e técnico do
conteúdo da rota `/demos` dentro deste repositório (VitePress).

---

## 1) Princípios (não negociáveis)

### Evidência antes de opinião

- Toda afirmação factual relevante deve ter **fonte**.
- Quando algo for **alegação**, deve estar rotulado como tal (ex.: “segundo X”,
  “foi acusado”, “está sob investigação”).
- Separe claramente:
  - **Fato documentado** (há registro/documento público; isso não implica “verdade final”).
  - **Relato/denúncia** (imprensa, relatório, delação, auditoria, etc.).
  - **Interpretação** (leitura do autor sobre o que os fatos sugerem).
  - **Hipótese** (algo a investigar; não tratado como fato).

### Abordagem investigativa (hipóteses e “mapa de poder”)

A rota `/demos` do Skepvox não é uma mini‑enciclopédia. É um sistema para **investigar** e
**explicitar redes de influência e poder** com rastreabilidade.

Premissas:

- O retrato público é frequentemente **incompleto**; podem existir incentivos a
  omitir, editar ou confundir. O método assume **lacunas** e trabalha com
  hipóteses testáveis, não com certezas instantâneas.
- “Investigar” aqui significa **formular hipóteses**, buscar evidências,
  registrar contradições e atualizar o status conforme o conjunto de fontes.

Regras para não virar difamação:

- Hipóteses devem ser escritas como **perguntas/possibilidades**, nunca como
  acusações fechadas (“pode ter havido influência indevida…?”).
- Para cada hipótese importante, registrar ao menos 1 **contra‑hipótese**
  plausível (e quais fatos a sustentariam), para reduzir viés de confirmação.
- Não afirmar culpa/crime sem base documental e corroborada; use sempre status
  processual e linguagem condicional quando houver incerteza.

Como expandir a rede (a partir de uma pessoa‑semente):

- Não criar nós “por intuição”. Criar novas páginas de pessoa/organização/caso
  somente quando houver uma **conexão documentada** (evento, vínculo formal,
  menção relevante em fonte identificável).
- Preferir construir primeiro: **casos/processos → eventos → relações**. Isso
  mantém o grafo auditável: cada aresta deve ter “por quê” + “quando” + fonte.

Como escolher o **próximo** nó (não aleatório):

- Toda nova nota deve ser uma “próxima pista” **deliberada**, escolhida para
  reduzir incerteza do mapa (e não para “cobrir tudo”).
- Perguntas obrigatórias antes de criar uma página:
  - Qual hipótese/pergunta ela ajuda a **testar** agora?
  - Qual é a **conexão documentada** que justifica a página (link + fonte)?
  - Que novos documentos/linhas de apuração ela desbloqueia (ex.: votos,
    acórdãos, relatórios, atas, contratos, registros oficiais)?
  - Qual contra‑hipótese plausível existe e como a página ajuda a avaliá‑la?

Regra editorial (para tornar auditável):

- Toda nova página deve ter, logo após a linha de atualização, uma seção
  **“Situação atual”** com o melhor resumo disponível do estado atual (com fonte
  quando possível): cargo/função, localização em alto nível (país-estado-cidade),
  vínculo institucional e custódia (se aplicável) — sempre sem doxxing.
- Em seguida, a página deve ter a seção **“Por que está no mapa”** com:
  - conexão de origem (de qual pessoa/caso veio),
  - evidência mínima (1–3 fontes públicas),
  - e “próximas fontes‑alvo” (documentos primários a buscar).

### Linha do tempo vs Eventos (duas camadas)

Para evitar mistura de “biografia” com “fatos pontuais”:

- **Linha do tempo**: “CV” contínuo (por períodos) desde o marco inicial.
  - Pessoa: começa com **nascimento**.
  - Organização/empresa: começa com **fundação/criação**.
  - Caso: começa com a **ocorrência** (ou abertura do procedimento) que define o caso.
  - Se houver lacunas relevantes, elas devem ser explícitas (ex.: `1975–1980 — Nenhuma informação encontrada.`).
- **Eventos**: lista de fatos datados e verificáveis (o máximo possível), sem “curadoria”
  por relevância (a relevância vem depois, nas análises).

### Neutralidade de linguagem (anti-difamação)

- Evite rótulos (“corrupto”, “bandido”, etc.). Prefira descrições verificáveis.
- Use termos de status: **investigado**, **denunciado**, **réu**, **condenado**,
  **absolvido**, **arquivado**, **anulado**, **prescreveu**, etc.
- Cada evento deve indicar **situação atual** (quando aplicável) e data de
  atualização.

### Sem doxxing e sem incentivo a assédio

- Não publicar endereço residencial, telefone pessoal, dados familiares,
  documentos privados, nem qualquer dado que facilite assédio.
- Apenas informações de domínio público e relevantes ao papel público do agente
  (mandato, cargo, empresa, contratos, decisões públicas, processos públicos).

### Correção é parte do sistema

- O conteúdo é vivo: decisões mudam, processos evoluem, fatos são corrigidos.
- Deve existir caminho para **contestação e correção** com base em fontes.
  - Quando uma nota derivada for criada ou atualizada, notas relacionadas devem
    ser revisadas para avaliar se precisam de novos itens em **Linha do tempo**
    e/ou **Eventos**, ou se basta atualizar links.

### Cuidado extra com “fontes oficiais” e indicadores

- Fontes oficiais e números públicos (KPIs, relatórios, séries históricas) podem
  ser incompletos, enviesados ou até manipulados.
- Trate números como **declarações publicadas por alguém**: registre contexto,
  metodologia e, quando possível, triangule com auditorias/dados independentes.
- Quando houver conflito entre fontes, prefira **documentar o conflito** (com
  links) em vez de concluir além do que é verificável.

### Arquivamento (prova do que foi visto)

Algumas páginas mudam ao longo do tempo (por atualização, mudança de governo,
ou edição do conteúdo). Para garantir rastreabilidade:

- sempre registre `dateAccessed`;
- quando possível, guarde um `archivedUrl` (ex.: Wayback/Web Archive);
- nesta fase, não manter snapshots locais (PDF/PNG/HTML) como rotina.

---

## 2) Modelo mental: “Markdown para significado, dados para movimento”

Para evitar duplicação e manter consistência:

- **Markdown (páginas)**: identidade, contexto humano, resumo e leitura.
- **Eventos (dados estruturados)**: linha do tempo e fatos datados, pois um
  evento costuma envolver múltiplas pessoas e organizações.
- **Relações (dados estruturados)**: arestas do grafo (quem se conecta a quem,
  por quê, e por qual fonte).

O site pode renderizar o conteúdo humano (Markdown) e, progressivamente, usar
os dados estruturados para gerar:

- linhas do tempo consolidadas,
- grafos de conexões,
- filtros por período/tipo,
- e suporte a pesquisa/IA com rastreabilidade.

---

## 3) Entidades (o que existe no mapa Skepvox)

### Tipos principais

- **Pessoa**: indivíduo com atuação pública (político, servidor, empresário,
  lobista, dirigente partidário, etc.).
- **Organização**: empresa, órgão público, partido, associação, ONG, fundação.
- **Cargo/Função**: papel exercido (mandato, nomeação, diretoria, conselho).
- **Evento**: fato datado (nomeação, votação, contrato, denúncia, sentença,
  doação, CPI, etc.).
- **Caso/Processo**: procedimento formal (inquérito, ação judicial, processo no
  TCU, etc.) com número/identificador, quando existir.
- **Fonte**: documento ou referência verificável (link, PDF, diário oficial,
  acórdão, entrevista, matéria jornalística, relatório).

### Relações (arestas)

Relações sempre têm:

- **tipo** (ex.: `works-for`, `member-of`, `appointed-by`, `donated-to`,
  `contract-with`, `investigated-in`, `indicted-in`, `convicted-in`),
- **intervalo temporal** (quando aplicável),
- **fonte(s)**.

---

## 4) Convenção de IDs (estáveis e “machine-friendly”)

Regras:

- minúsculo e ASCII.
- Use `-` (hífen) para separar palavras no slug.
- Reserve `--` como separador entre “tipo” e “slug” (não use `--` dentro do slug).
- IDs não mudam, mesmo se o título da página mudar.

Formatos recomendados:

```
person--<nome-sobrenome>
org--<slug>
role--<slug>
case--<slug-ou-numero-normalizado>
evt--<yyyy-mm-dd>--<slug-curto>
src--<slug>
```

Exemplos:

- `person--joao-silva`
- `org--empresa-x-sa`
- `role--senador-republica`
- `evt--2016-05-12--nomeacao-ministerio-y`

### Identificadores externos (sem dados pessoais)

Além do `demos.id`, cada página pode registrar identificadores externos públicos
em `demos.identifiers`. Isso serve para:

- desambiguar homônimos,
- manter identidade estável caso o slug/título mude no futuro,
- facilitar ingestão de dados e cruzamento entre entidades.

Regras:

- **Não usar CPF**.
- Usar apenas identificadores públicos e relevantes (ex.: `wikidata`, `tse`,
  `cnpj` quando aplicável).

### Sementes (seed) e linhagem

Para manter rastreável “de onde o grafo nasceu”:

- Toda página de entidade (pessoa/organização/caso) deve declarar se ela é uma
  **semente** (`seed: yes`) ou não (`seed: no`).
- Toda página de entidade deve declarar `seed-id` com o `demos.id` da semente
  que originou aquela nota.
- Para a própria semente, `seed-id` deve ser igual ao seu próprio `demos.id`.

---

## 5) Estrutura de pastas (no site)

Proposta (incremental, sem gerar listas gigantes na sidebar):

```
src/
  demos/
    index.md                # hub (visão geral + metodologia + navegação)
    pessoas/
      <slug>.md             # uma página por pessoa
    organizacoes/
      <slug>.md             # opcional (mas recomendado)
    casos/
      <slug>.md             # opcional (mas recomendado)
public/
  demos/
    events.jsonl            # eventos (1 por linha)
    relations.jsonl         # relações (1 por linha)
    sources.jsonl           # catálogo de fontes (opcional)
```

Se o projeto começar só com páginas Markdown, tudo bem. O objetivo é evoluir
para dados estruturados assim que houver volume/complexidade.

---

## 6) Template — página de Pessoa (Markdown)

Cada pessoa tem **uma página canônica**.

Frontmatter sugerido:

```yaml
---
title: "NOME COMPLETO — Skepvox"
description: "Resumo factual e fontes públicas sobre NOME COMPLETO."
demos:
  id: person--nome-sobrenome
  type: person
  mapLabel: nome-curto
  seed: yes
  seed-id: person--nome-sobrenome
  country: BR
  identifiers:
    wikidata: Q123456
    tse: "..." # quando existir um identificador público estável
  aliases: []
  tags: []
  primaryRoles: []
---
```

Estrutura do corpo (sugestão):

1) **Situação atual**  
   3–6 bullets: cargo/função atual, localização em alto nível (país-estado-cidade),
   vínculo institucional e custódia (se aplicável).

2) **Por que está no mapa**  
   conexão de origem + evidência mínima + fontes-alvo.

3) **Resumo**  
   5–10 linhas: quem é, por que é relevante, e 3–5 fatos com fonte.

4) **Identidade e atuação pública**  
   - cargos, mandatos, empresas, partidos, conselhos, etc. (com datas)

5) **Linha do tempo**  
   - “CV” por períodos, começando com nascimento/fundação/ocorrência.
   - Incluir lacunas explícitas quando necessário.

6) **Eventos**  
   - Lista de fatos pontuais com data + descrição + status + fonte (o máximo possível).

7) **Conexões relevantes**  
   - Links para outras pessoas/organizações/casos (com justificativa e fonte).

8) **Fontes e documentos**  
   - Prefira fontes primárias e auditorias públicas, mas **não trate como
     infalíveis** (especialmente KPIs e relatórios de desempenho).
   - Triangule sempre que possível (2+ fontes independentes).
   - Use imprensa como suporte/contexto e cite explicitamente quando algo for
     “segundo reportagem X…”.

9) **Perguntas abertas (hipóteses)** *(opcional, rotulado)*  
   - Itens do tipo: “Evidência sugere X; falta confirmar Y; próxima busca: Z.”

---

## 7) Esquema de Eventos (para JSONL)

Um evento deve ser “pequeno” e atômico, e pode referenciar várias entidades.

Campos recomendados (um JSON por linha):

```json
{
  "id": "evt--2016-05-12--nomeacao-ministerio-y",
  "date": "2016-05-12",
  "type": "appointment",
  "title": "Nomeação para o cargo X",
  "summary": "Descrição curta e neutra do que ocorreu.",
  "entities": ["person--nome-sobrenome", "org--ministerio-y"],
  "jurisdiction": "BR",
  "status": "documented",
  "corroboration": "single-source",
  "confidence": "medium",
  "sources": [
    {
      "url": "https://...",
      "publisher": "Diário Oficial",
      "kind": "official",
      "archivedUrl": "https://web.archive.org/...",
      "dateAccessed": "2026-01-09",
      "quote": "Trecho relevante (curto)."
    }
  ],
  "updatedAt": "2026-01-09"
}
```

Campos editoriais (recomendados):

- `corroboration`: `single-source` | `multi-source` | `conflicting`
- `confidence`: `low` | `medium` | `high` (avaliação editorial; não é “prova”)
- `sources[].kind`: `official` | `judicial` | `audit` | `journalism` | `dataset` | `other`
- `sources[].archivedUrl`: link arquivado quando possível

### Vocabulário controlado (tipos de evento)

Comece simples e cresça conforme necessidade:

- `appointment`, `election`, `resignation`
- `vote`, `bill-authored`, `committee-membership`
- `contract-signed`, `contract-awarded`, `procurement`
- `donation`, `campaign-finance`
- `investigation-opened`, `indictment`, `trial`, `conviction`, `acquittal`,
  `appeal`, `case-archived`, `sanction`
- `asset-declaration`, `conflict-of-interest-declared`

### Status (sempre explícito)

Sugestão:

- `reported` (relatado por fonte, sem documento primário)
- `alleged` (alegação formal, denúncia pública, etc.)
- `documented` (há registro/documento público verificável; não implica “verdade final”)
- `contested` (fontes conflitantes ou integridade questionável; requer triangulação)
- `charged` (denúncia/ação formalizada)
- `convicted`, `acquitted`
- `archived`, `annulled`, `prescribed`

---

## 8) Esquema de Relações (para JSONL)

Relações viram arestas do grafo.

```json
{
  "id": "rel--person--nome-sobrenome--works-for--org--empresa-x-sa--2019-01-01",
  "from": "person--nome-sobrenome",
  "to": "org--empresa-x-sa",
  "type": "works-for",
  "startDate": "2019-01-01",
  "endDate": null,
  "confidence": "high",
  "sources": [{ "url": "https://...", "publisher": "..." }],
  "updatedAt": "2026-01-09"
}
```

---

## 9) Visualização (meta do projeto)

Objetivo: um “mapa navegável” que permita:

- explorar conexões (pessoa ↔ organização ↔ caso ↔ evento),
- filtrar por tempo e tipo de relação,
- clicar em nós/arestas e ver **fontes**,
- gerar links compartilháveis para um recorte do grafo.

Implementação sugerida (futuro):

- um componente de grafo (D3) em `.vitepress/theme/`,
- carregando `public/demos/events.jsonl` e `public/demos/relations.jsonl`,
- com um modo “evidência” (sempre mostrar fontes na UI).

---

## 10) IA (assistência, não “oráculo”)

A IA deve operar sob regras rígidas:

- **sempre citar fontes** ao resumir fatos;
- separar **fatos** de **hipóteses** explicitamente;
- não produzir acusações; apenas recontar o que as fontes dizem;
- sinalizar incerteza quando as fontes forem fracas ou conflitantes.

Casos de uso desejados:

- “Resuma a linha do tempo desta pessoa em 10 bullets, com links.”
- “Quais conexões aparecem em comum entre A e B?”
- “Quais eventos mudaram de status nos últimos 90 dias?”

---

## 11) Roadmap (fases)

1) **Fase 0 — scaffolding**
   - criar hub `/demos` + templates (pessoa/organização/caso)
   - definir vocabulário inicial de eventos e relações

2) **Fase 1 — seed**
   - adicionar um conjunto pequeno (ex.: 10 pessoas, 10 organizações, 30 eventos)
   - calibrar escrita, fontes e status

3) **Fase 2 — dados estruturados**
   - consolidar `events.jsonl` + `relations.jsonl`
   - gerar views (linha do tempo por pessoa, conexões por caso)

4) **Fase 3 — visualização**
   - grafo interativo + filtros + “modo evidência”

5) **Fase 4 — IA**
   - busca assistida + resumos com rastreabilidade

---

## Regra de ouro (uma frase)

**Skepvox não acusa. Skepvox documenta, conecta e explica — sempre com fonte.**
