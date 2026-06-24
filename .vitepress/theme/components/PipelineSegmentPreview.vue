<script setup lang="ts">
import preview from '../data/pipeline-preview-segment.json'

// REVIEW-ONLY single-segment reading preview (Slice 2E). Joins the vendored pipeline metadata with
// ONE segment's sanitized prose body (via the build-time artifact pipeline-preview-segment.json,
// joined by segmentPrefix/language — never routePath) to prove the future leaf-rendering model. It
// renders authored Part -> Chapter context (from groupPath, never inferred from slugs), the segment
// displayTitle, and the prose body as a reading leaf. It is hosted ONLY on the buffer (noindex/
// unlisted/out-of-search) page src/reading-review/introduction-a-l-ontologie-segment.md, creates no
// public route, and never renders routePath as an href. bodyHtml is build-time-sanitized (escaped +
// *italics* only), so v-html is safe here.

const work = (preview as any).work
const seg = (preview as any).segment
const part = seg.groupPath.find((l: any) => l.kind === 'part') ?? null
const chapter = seg.groupPath.find((l: any) => l.kind === 'chapter') ?? null
</script>

<template>
  <article
    class="pe-leaf"
    data-source="pipeline-export"
    :data-segment="seg.segmentPrefix"
    :data-lang="seg.language"
  >
    <p class="pe-leaf__eyebrow">
      <span class="pe-leaf__work">{{ work.title }}</span>
      <span class="pe-leaf__sep">·</span>
      <span class="pe-leaf__lang">{{ seg.language }}</span>
      <template v-if="part">
        <span class="pe-leaf__sep">·</span>
        <span
          >{{ part.label }}<template v-if="part.title"> — {{ part.title }}</template></span
        >
      </template>
      <template v-if="chapter">
        <span class="pe-leaf__sep">·</span>
        <span>{{ chapter.title || chapter.label }}</span>
      </template>
    </p>

    <h2 class="pe-leaf__title">{{ seg.displayTitle }}</h2>

    <!-- eslint-disable-next-line vue/no-v-html -- build-time sanitized prose (escape + *italics* only) -->
    <div class="pe-leaf__prose" v-html="seg.bodyHtml" />

    <details class="pe-leaf__qa" data-testid="pe-leaf-qa">
      <summary>QA (internal)</summary>
      <dl>
        <div>
          <dt>canonicalId</dt>
          <dd>{{ seg.canonicalId }}</dd>
        </div>
        <div>
          <dt>join key</dt>
          <dd>{{ seg.segmentPrefix }} / {{ seg.language }}</dd>
        </div>
        <div>
          <dt>routePath (data only — not a link)</dt>
          <dd>
            <code>{{ seg.routePath }}</code>
          </dd>
        </div>
        <div>
          <dt>urlStability / maturity</dt>
          <dd>{{ seg.urlStability }} / {{ seg.maturity }}</dd>
        </div>
        <div>
          <dt>source</dt>
          <dd>{{ (preview as any).source }}</dd>
        </div>
      </dl>
    </details>
  </article>
</template>

<style scoped>
.pe-leaf {
  max-width: 38rem;
  margin: 0 0 3rem;
}
.pe-leaf__eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.74rem;
  letter-spacing: 0.04em;
  color: var(--sk-text-muted);
}
.pe-leaf__sep {
  margin: 0 0.4rem;
  opacity: 0.5;
}
.pe-leaf__lang {
  text-transform: uppercase;
}
.pe-leaf__title {
  margin: 0 0 1.4rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--sk-reading-heading);
}

/* Reading prose — applied to v-html children via :deep (v-html content is unscoped). */
.pe-leaf__prose :deep(p) {
  margin: 0 0 1.25rem;
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--sk-reading-text, var(--sk-reading-muted));
}
.pe-leaf__prose :deep(em) {
  font-style: italic;
}

.pe-leaf__qa {
  margin-top: 2rem;
  font-size: 0.72rem;
  color: var(--sk-text-muted);
}
.pe-leaf__qa summary {
  cursor: pointer;
}
.pe-leaf__qa dt {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.75;
}
.pe-leaf__qa dd {
  margin: 0 0 0.4rem;
}
.pe-leaf__qa code {
  opacity: 0.7;
}
</style>
