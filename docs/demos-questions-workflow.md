# Demos — Workflow de Perguntas e Conexões (política operacional)

Este documento define o **processo padrão** para fazer a rota `/demos` avançar de forma
investigativa e rastreável, sem virar uma “mini‑wikipedia”.

O objetivo é simples: **reduzir incerteza** (perguntas) e **aumentar auditabilidade** (conexões + fontes).

## 1) Conceitos

- **Pergunta**: item em `## Perguntas abertas (hipóteses)` com ID `q--<note-id>--<nnn>`.
- **Nota-contêiner**: a nota onde a pergunta “vive” (o `note-id` do ID).
- **Nota derivada**: uma nota criada/atualizada para atacar 1–3 perguntas-alvo.
- **Perguntas-alvo (rastreamento)**: as perguntas que uma nota derivada declara que pretende avançar.

## 2) Fonte de verdade (regra operacional)

Para rastreabilidade e automação, adotamos **uma regra de ouro**:

- **`demos.target-questions` é a fonte de verdade para “esta nota está trabalhando nesta pergunta”**.
- A lista humana **“Notas que avançam”** dentro da pergunta deve refletir isso.

Política:

- Se uma nota inclui `demos.target-questions: [q--…]`, então a pergunta correspondente deve listar essa nota em **“Notas que avançam”**.
- Se uma pergunta lista uma nota em **“Notas que avançam”**, então essa nota deve declarar a pergunta em `demos.target-questions`.
- Se uma nota é apenas contextual/relacionada, ela deve aparecer em **Pessoas/Organizações/Casos relacionados**, e **não** em “Notas que avançam”.

## 3) Estados das perguntas (regra prática)

- `aberta`: não existe trabalho direcionado (sem notas-alvo e sem “Notas que avançam”).
- `em-apuracao`: existe ao menos 1 nota trabalhando a pergunta (ou seja, ao menos 1 nota-alvo / nota que avança).
- `parcial`: houve avanço verificável com fontes, mas faltam lacunas materiais.
- `respondida` / `refutada` / `inconclusiva`: use quando houver fechamento justificável com evidência pública.

Regra rápida:

- Se **alguém** está trabalhando a pergunta (há nota-alvo), ela **não** deve permanecer `aberta`.

## 4) Checklist ao criar/atualizar uma nota derivada

1. Escolha **1 pergunta** prioritária (no máximo 3) para atacar.
2. No frontmatter da nota derivada, declare `demos.target-questions` com as perguntas escolhidas.
3. No corpo da nota, em `## Por que está no mapa`, escreva **“Perguntas-alvo (rastreamento)”** com os IDs.
4. Volte à nota-contêiner da pergunta e:
   - atualize `Estado` (geralmente → `em-apuracao` ou `parcial`);
   - adicione a nota em **“Notas que avançam”**.
5. Se a nota criou/fortaleceu uma conexão relevante, registre a conexão:
   - em seções **relacionadas** (para aparecer no mapa), e
   - com fonte(s) no corpo (para justificar).

## 5) Backlog (como escolher o próximo passo)

Use o painel `/demos/perguntas` como fila de trabalho:

- Priorize **perguntas sem trabalho** (sem notas-alvo).
- Priorize perguntas com **documentos primários acessíveis** (DOU, STF, TCU/CGU, Senado, etc.).
- Evite expandir o grafo “por curiosidade”: crie novos nós apenas quando eles reduzirem uma pergunta-alvo.

## 6) Auditoria rápida (drift)

O export do `/demos` agora gera:

- `src/public/demos-data/questions.json` — índice agregado de perguntas, incluindo alertas (`issues`) para:
  - backlinks faltando (nota-alvo não listada em “Notas que avançam”),
  - estados inconsistentes,
  - perguntas órfãs (sem trabalho),
  - targets inexistentes.

Fluxo recomendado:

1. Rode `pnpm demos:data` (ou `pnpm dev` / `pnpm build`, que já exportam).
2. Abra `/demos/perguntas` para ver backlog e alertas.
3. Corrija drift antes de criar novos nós.

