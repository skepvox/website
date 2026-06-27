# Brás Cubas — editorial reading-divisions proposal

> **Status: PROPOSAL ONLY — not implemented.** No code, route, data, `canonicalId`, `segmentPrefix`, or
> `groupPath` is changed by this document. Produced during the post-Brás-Cubas consolidation from a
> full-text reading of the novel. Machado authored **no "Partes"** here (the pipeline's `structure.yaml`
> records this correctly); the divisions below are **editorial reading aids** — a render-layer grouping,
> explicitly NOT Machado's structure, and must never be presented as his part titles.

## Why

Brás Cubas's work hub is a 160-chapter list. The B2/B3→consolidation harmonization already renders it in
the same calm book-map grammar as Lavelle (a quiet "Capítulos" group of chapter-rows), so it is correct
and calm today. **Editorial reading divisions are an enhancement**: they would group the 160 chapters
into a handful of named movements so a reader can find their place, without inventing authored Parts.

## Recommended scheme — 8 divisions

Front matter (Dedicatória / Prólogo / Ao leitor) stays its own "Abertura" group (already handled). The
divisions cover the 160 chapters; every boundary lands on a tonal seam the text itself marks (e.g. ch 9
*Transição*, ch 117 *O Humanitismo*, ch 136 *Inutilidade*). Titles are restrained, descriptive, and
deliberately avoid reusing the famous chapter titles they sit near.

| # | Editorial title (PT) | Chapters | segmentPrefix range | Why it ends there |
|---|---|---|---|---|
| 1 | O defunto autor | 1–8 | `00-00-001-004` → `00-00-008-011` | ch 8 closes the delirium; ch 9 *Transição* is the cleanest seam |
| 2 | Meninice e mocidade | 9–25 | `00-00-009-012` → `00-00-025-028` | ch 25 *Na Tijuca* closes the formation years |
| 3 | O noivado desfeito | 26–46 | `00-00-026-029` → `00-00-046-049` | ch 46 *A herança* closes the ambition/engagement movement |
| 4 | O amor de Virgília | 47–77 | `00-00-047-050` → `00-00-077-080` | ch 77 *Entrevista* = the affair at its settled peak, before the threat |
| 5 | Sob suspeita | 78–101 | `00-00-078-081` → `00-00-101-104` | ch 78 *A presidência* threat → ch 101 sets up the departure |
| 6 | A despedida | 102–116 | `00-00-102-105` → `00-00-116-119` | ch 116 *Filosofia das folhas velhas*; ch 117 pivots to Humanitas |
| 7 | Humanitas | 117–135 | `00-00-117-120` → `00-00-135-138` | ch 135 *Oblivion* — the threshold of old age |
| 8 | O acerto de contas | 136–160 | `00-00-136-139` → `00-00-160-163` | ch 160 *Das negativas* — the final tally |

Alternatives considered: **5 movements** (the affair as one 70-chapter block — best ToC clarity + literary
fidelity, worst on mobile density); **11 divisions** (split divs 2 + 4 — best mobile brevity, but eleven
dividers start to read as *segmented* rather than calm). **8 is the smallest count that keeps every group
on a hard tonal seam and all-but-one group phone-scannable** (div 4, the deliberately long settled heart,
is the one outlier; alt-11's 47–61/62–77 split serves a reader who wants it shorter). Two titles risk a
narrative tinge — *O noivado desfeito* → calmer **"Ambição e luto"** if zero plot implication is preferred.

## Data / model recommendation

These are NOT authored Parts, so they must NOT reuse Lavelle's `levels: kind: part` channel (which becomes
`groupPath kind:"part"`). They need their **own** channel, marked non-authored, that never touches
`groupPath` and never becomes a route.

**Recommended home: book-pipeline `structure.yaml` → an optional `reading-divisions:` block, emitted as a
sibling `readingDivisions` field on the work record** (NOT folded into any segment). Co-located with the
work's structural metadata, survives re-export, and makes the next flat book mechanical. Rejected:
website-only metadata (drifts from the source of truth) and a builder-invented field (no declarative source).

```yaml
# structure.yaml — optional; flat works only. Render-layer editorial aids, NOT authored Parts.
reading-divisions:
  authored: false
  divisions:
    - { label: O defunto autor,     start: 00-00-001-004, end: 00-00-008-011 }
    - { label: Meninice e mocidade, start: 00-00-009-012, end: 00-00-025-028 }
    # … six more …
```

```json
// export work record (sibling to segments)
"readingDivisions": { "authored": false, "divisions": [
  { "label": "O defunto autor", "startPrefix": "00-00-001-004", "endPrefix": "00-00-008-011" }
]}
```

`PipelineWorkContents` would bucket the existing flat chapter list by `startPrefix`/`endPrefix` (it
already sorts by `order`), never from `groupPath`. `authored: false` is the single switch the UI reads.

## Relationship to PipelineWorkContents

The component already has the two heading registers needed: **authored** (Lavelle Part divider:
`.pwc__part-heading`, full-ink + hairline) and **editorial** (the lighter `.pwc__opening-heading` register,
used today for the Abertura group and the harmonized "Capítulos" group — no hairline). If divisions are
accepted, the flat branch adds a fourth render path that inserts the editorial division headings into the
chapter-row list (chapters stay direct links — no disclosure), plus **one quiet caption per map**
(e.g. *"Divisões de leitura — agrupamento editorial, não de Machado."*) driven by `authored: false`. The
cue is *authored = full ink + hairline; editorial = lighter heading + one quiet footnote* — never a loud
per-divider badge. Dividers render always-open (orientation, not interaction).

## Verdict: design the seam now, implement content later

**Do NOT implement the divisions before the next book.** Brás Cubas already renders correctly and calmly
as the harmonized flat "Capítulos" list; divisions are an enhancement, not a fix, and these editorial
titles should finish settling in review before being frozen into pipeline data. **Do** treat this
proposal's data shape (`reading-divisions:` → `readingDivisions`, `authored:false`) + the component's
editorial heading register as the agreed contract, so the grouped render is **purely additive** later (a
quieter heading variant + the data feed + a one-line caption) with no change to identity, routes, or the
existing branches — and so the next flat work is mechanical.
