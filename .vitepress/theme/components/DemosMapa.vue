<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import * as d3 from 'd3'

type GraphNode = {
  id: string
  type: 'person' | 'org' | 'case' | string
  url: string
  dataUrl?: string
  title?: string | null
  description?: string | null
  mapLabel?: string | null
  seed?: boolean
  seedId?: string | null
  tags?: string[]
  primaryRoles?: string[]
}

type GraphEdge = {
  source: string
  target: string
  kind: 'related' | 'family' | string
  count?: number
  sections?: Record<string, number>
}

type GraphData = {
  schema: string
  schemaVersion: number
  nodeCount: number
  edgeCount: number
  nodes: GraphNode[]
  edges: GraphEdge[]
}

const containerEl = ref<HTMLDivElement | null>(null)
const svgEl = ref<SVGSVGElement | null>(null)

const graph = ref<GraphData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const edgeKindFilter = ref<'related' | 'family'>('related')
const query = ref('')
const showPeople = ref(true)
const showOrganizations = ref(true)
const showCases = ref(true)
const showLabels = ref(true)

const selectedNodeId = ref<string | null>(null)
const selectedNote = ref<any | null>(null)
const selectedNoteLoading = ref(false)
const selectedNoteError = ref<string | null>(null)
let selectedNoteAbort: AbortController | null = null

const filteredGraph = computed(() => {
  const data = graph.value
  if (!data) return null

  const visibleType = (type: string) => {
    if (type === 'person') return showPeople.value
    if (type === 'org') return showOrganizations.value
    if (type === 'case') return showCases.value
    return true
  }

  const nodes = data.nodes.filter((node) => visibleType(node.type))
  const nodeIds = new Set(nodes.map((node) => node.id))

  const edgesByKind =
    edgeKindFilter.value === 'family'
      ? data.edges.filter((edge) => edge.kind === 'family')
      : data.edges.filter((edge) => edge.kind === 'related' || edge.kind === 'family')

  const edges = edgesByKind.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))

  return { nodes, edges }
})

const selectedNode = computed(() => {
  const data = filteredGraph.value
  if (!data || !selectedNodeId.value) return null
  return data.nodes.find((node) => node.id === selectedNodeId.value) ?? null
})

const selectedNeighbors = computed(() => {
  const data = filteredGraph.value
  const focus = selectedNodeId.value
  if (!data || !focus) return []

  const neighborIds = new Set<string>()
  for (const edge of data.edges) {
    if (edge.source === focus) neighborIds.add(edge.target)
    if (edge.target === focus) neighborIds.add(edge.source)
  }

  const labelForSort = (node: GraphNode) => labelForNode(node).toLowerCase()
  const typeRank = (type: string) => (type === 'person' ? 0 : type === 'org' ? 1 : type === 'case' ? 2 : 3)

  return data.nodes
    .filter((node) => neighborIds.has(node.id))
    .sort((a, b) => {
      const byType = typeRank(a.type) - typeRank(b.type)
      if (byType !== 0) return byType
      return labelForSort(a).localeCompare(labelForSort(b))
    })
})

type NeighborEdgeInfo = {
  outgoing: GraphEdge[]
  incoming: GraphEdge[]
}

const selectedNeighborEdgesById = computed<Record<string, NeighborEdgeInfo>>(() => {
  const data = filteredGraph.value
  const focus = selectedNodeId.value
  const byId: Record<string, NeighborEdgeInfo> = {}
  if (!data || !focus) return byId

  for (const edge of data.edges) {
    if (edge.source === focus) {
      const neighborId = edge.target
      byId[neighborId] ??= { outgoing: [], incoming: [] }
      byId[neighborId].outgoing.push(edge)
    }
    if (edge.target === focus) {
      const neighborId = edge.source
      byId[neighborId] ??= { outgoing: [], incoming: [] }
      byId[neighborId].incoming.push(edge)
    }
  }

  const kindRank = (kind: string) =>
    kind === 'family' ? 0 : kind === 'related' ? 1 : 2

  const sortEdges = (edges: GraphEdge[]) =>
    edges.sort((a, b) => {
      const byKind = kindRank(a.kind) - kindRank(b.kind)
      if (byKind !== 0) return byKind
      return (b.count ?? 1) - (a.count ?? 1)
    })

  for (const entry of Object.values(byId)) {
    sortEdges(entry.outgoing)
    sortEdges(entry.incoming)
  }

  return byId
})

let resizeObserver: ResizeObserver | null = null
let stopRenderWatch: (() => void) | null = null
let stopQueryWatch: (() => void) | null = null
let stopLabelsWatch: (() => void) | null = null
let stopSelectionWatch: (() => void) | null = null
let stopFilterWatch: (() => void) | null = null

function colorForType(type: string) {
  if (type === 'person') return '#3b82f6'
  if (type === 'org') return '#10b981'
  if (type === 'case') return '#f59e0b'
  return '#94a3b8'
}

function typeLabel(type: string) {
  if (type === 'person') return 'Pessoa'
  if (type === 'org') return 'Organização'
  if (type === 'case') return 'Caso'
  return type
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase()
}

function labelForNode(node: GraphNode) {
  const preferred = typeof node.mapLabel === 'string' ? node.mapLabel.trim() : ''
  if (preferred) return preferred
  const raw = (node.title ?? node.id).replace(/\s+—\s+Skepvox\s*$/i, '').trim()
  if (raw.length <= 44) return raw
  return `${raw.slice(0, 41)}…`
}

function edgeKindLabel(kind: string) {
  if (kind === 'family') return 'Família'
  if (kind === 'related') return 'Relações'
  return kind
}

function formatEdgeSections(sections?: Record<string, number>) {
  if (!sections) return ''
  const entries = Object.entries(sections)
  if (!entries.length) return ''

  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  const maxItems = 4
  const head = entries.slice(0, maxItems)
  const rest = entries.length - head.length

  const parts = head.map(([section, count]) => (count > 1 ? `${section}×${count}` : section))
  if (rest > 0) parts.push(`+${rest}`)
  return parts.join(', ')
}

function formatEdgeReason(edge: GraphEdge) {
  const kind = edgeKindLabel(edge.kind)
  const count = edge.count ?? 1
  const countPart = count > 1 ? ` ×${count}` : ''
  const sections = formatEdgeSections(edge.sections)
  if (!sections) return `${kind}${countPart}`
  return `${kind}${countPart}: ${sections}`
}

function clearSelection() {
  selectedNodeId.value = null
}

function applyVisibilityDefaultsForEdgeFilter(kind: 'related' | 'family') {
  if (kind === 'family') {
    showPeople.value = true
    showOrganizations.value = false
    showCases.value = false
    showLabels.value = true
    return
  }

  showPeople.value = true
  showOrganizations.value = true
  showCases.value = true
  showLabels.value = true
}

async function loadSelectedNote() {
  const id = selectedNodeId.value
  if (!id) {
    selectedNote.value = null
    selectedNoteError.value = null
    selectedNoteLoading.value = false
    selectedNoteAbort?.abort()
    selectedNoteAbort = null
    return
  }

  const node = graph.value?.nodes?.find((item) => item.id === id)
  if (!node?.dataUrl) {
    selectedNote.value = null
    selectedNoteError.value = null
    selectedNoteLoading.value = false
    return
  }

  selectedNoteAbort?.abort()
  const controller = new AbortController()
  selectedNoteAbort = controller

  selectedNoteLoading.value = true
  selectedNoteError.value = null

  try {
    const res = await fetch(withBase(node.dataUrl), {
      cache: 'no-store',
      signal: controller.signal
    })
    if (!res.ok) {
      throw new Error(`Falha ao carregar ${node.dataUrl} (${res.status})`)
    }
    const data = await res.json()
    if (selectedNodeId.value === id) {
      selectedNote.value = data
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') return
    if (selectedNodeId.value === id) {
      selectedNoteError.value = e?.message ?? String(e)
      selectedNote.value = null
    }
  } finally {
    if (selectedNodeId.value === id) {
      selectedNoteLoading.value = false
    }
  }
}

function render() {
  const data = filteredGraph.value
  const container = containerEl.value
  const svgNode = svgEl.value

  if (!data || !container || !svgNode) return

  const width = Math.max(320, Math.floor(container.clientWidth))
  const height = Math.max(520, Math.floor(container.clientHeight || 720))

  const svg = d3.select(svgNode)
  svg.selectAll('*').remove()
  svg.attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`)
  svg.attr('width', width)
  svg.attr('height', height)

  const zoomRoot = svg.append('g')

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 4])
    .on('zoom', (event) => {
      zoomRoot.attr('transform', event.transform)
    })

  svg.call(zoom as any)

  const nodes = data.nodes.map((node) => ({
    ...node,
    x: (Math.random() - 0.5) * width,
    y: (Math.random() - 0.5) * height
  }))

  const nodeById = new Map<string, GraphNode>()
  for (const node of nodes) nodeById.set(node.id, node)

  const links = data.edges
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      kind: edge.kind,
      count: edge.count ?? 1
    }))
    .filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target))

  const edgeKinds = Array.from(new Set(links.map((d) => d.kind))).sort()
  const colorForEdgeKind = (kind: string) => {
    if (kind === 'related') return '#64748b'
    if (kind === 'family') return '#e11d48'
    return '#a855f7'
  }
  const edgeColor = d3
    .scaleOrdinal<string, string>()
    .domain(edgeKinds)
    .range(edgeKinds.map(colorForEdgeKind))

  svg
    .append('defs')
    .selectAll('marker')
    .data(edgeKinds)
    .join('marker')
    .attr('id', (d) => `arrow-${d}`)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 18)
    .attr('refY', 0)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto')
    .append('path')
    .attr('fill', (d) => edgeColor(d))
    .attr('opacity', (d) => (d === 'family' ? 0.6 : 0.2))
    .attr('d', 'M0,-3L10,0L0,3')

  const linkForce = d3
    .forceLink(links as any)
    .id((d: any) => d.id)
    .distance(70)
    .strength(0.9)

  const simulation = d3
    .forceSimulation(nodes as any)
    .force('link', linkForce as any)
    .force('charge', d3.forceManyBody().strength(-420))
    .force('x', d3.forceX().strength(0.08))
    .force('y', d3.forceY().strength(0.08))
    .force('collide', d3.forceCollide().radius((d: any) => (d.seed ? 22 : 16)))

  const locationHref =
    typeof window !== 'undefined' ? window.location.href : 'https://skepvox.com/'

  function linkArc(d: any) {
    const source = typeof d.source === 'string' ? nodeById.get(d.source) : d.source
    const target = typeof d.target === 'string' ? nodeById.get(d.target) : d.target
    if (!source || !target) return ''

    const dx = (target.x ?? 0) - (source.x ?? 0)
    const dy = (target.y ?? 0) - (source.y ?? 0)
    const r = Math.max(10, Math.hypot(dx, dy))

    const directionFlag = source.id < target.id ? 1 : 0
    const sweep = directionFlag ^ 1

    return `M${source.x},${source.y}A${r},${r} 0 0,${sweep} ${target.x},${target.y}`
  }

  const link = zoomRoot
    .append('g')
    .attr('fill', 'none')
    .selectAll('path')
    .data(links as any)
    .join('path')
    .attr('stroke', (d: any) => edgeColor(d.kind))
    .attr('stroke-opacity', (d: any) => (d.kind === 'family' ? 0.6 : 0.2))
    .attr('stroke-width', (d: any) => {
      const base = d.kind === 'family' ? 1.35 : d.kind === 'related' ? 1.15 : 0.9
      const boost = Math.min(2, Math.log2(Math.max(1, d.count)))
      return base + boost * 0.28
    })
    .attr('marker-end', (d: any) => `url(${new URL(`#arrow-${d.kind}`, locationHref)})`)

  const node = zoomRoot
    .append('g')
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .style('cursor', 'pointer')

  const circles = node
    .append('circle')
    .attr('r', (d: any) => (d.seed ? 7 : 5))
    .attr('fill', (d: any) => colorForType(d.type))
    .attr('stroke-width', 1.6)
    .style('stroke', 'var(--vp-c-bg)')

  const labels = node
    .append('text')
    .attr('x', 10)
    .attr('y', '0.31em')
    .attr('fill', 'currentColor')
    .attr('font-size', 12)
    .text((d: any) => labelForNode(d))

  const labelsOutline = labels
    .clone(true)
    .lower()
    .attr('fill', 'none')
    .attr('stroke-width', 3)
    .style('stroke', 'var(--vp-c-bg)')

  node.append('title').text((d) => {
    const title = d.title ?? d.id
    const type = d.type ?? 'unknown'
    return `${title}\n${type} · ${d.id}`
  })

  let didDrag = false

  const applySelectedMarker = () => {
    const selectedId = selectedNodeId.value
    circles
      .attr('r', (d: any) => {
        const base = d.seed ? 7 : 5
        return d.id === selectedId ? base + 2.5 : base
      })
      .attr('stroke-width', (d: any) => (d.id === selectedId ? 2.4 : 1.6))
      .style('stroke', (d: any) =>
        d.id === selectedId ? 'var(--vp-c-brand-1)' : 'var(--vp-c-bg)'
      )
  }

  node.on('click', (event: any, d) => {
    if (didDrag) return
    event?.stopPropagation?.()

    const isAlreadySelected = selectedNodeId.value === d.id
    selectedNodeId.value = d.id

    if (isAlreadySelected && typeof window !== 'undefined' && d.url) {
      window.location.href = d.url
    }
  })

  node.call(
    d3
      .drag<SVGGElement, any>()
      .on('start', (event, d) => {
        didDrag = false
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        didDrag = true
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      }) as any
  )

  const neighborsById = new Map<string, Set<string>>()
  const addNeighbor = (from: string, to: string) => {
    let entry = neighborsById.get(from)
    if (!entry) {
      entry = new Set<string>()
      neighborsById.set(from, entry)
    }
    entry.add(to)
  }

  for (const l of links as any[]) {
    const sourceId = typeof l.source === 'string' ? l.source : l.source?.id
    const targetId = typeof l.target === 'string' ? l.target : l.target?.id
    if (!sourceId || !targetId) continue
    addNeighbor(sourceId, targetId)
    addNeighbor(targetId, sourceId)
  }

  const isNeighbor = (a: GraphNode, b: GraphNode) =>
    a.id === b.id || neighborsById.get(a.id)?.has(b.id) === true

  const computeHopSets = (focusId: string) => {
    const hop1 = new Set(neighborsById.get(focusId) ?? [])
    const hop2 = new Set<string>()

    for (const neighborId of hop1) {
      const neighbors = neighborsById.get(neighborId)
      if (!neighbors) continue

      for (const secondHopId of neighbors) {
        if (secondHopId === focusId) continue
        if (hop1.has(secondHopId)) continue
        hop2.add(secondHopId)
      }
    }

    return { hop1, hop2 }
  }

  const applyLabelsVisibility = () => {
    const display = showLabels.value ? null : 'none'
    labels.attr('display', display)
    labelsOutline.attr('display', display)
  }

  const applyQueryStyles = () => {
    const q = normalizeQuery(query.value)
    const matchesNode = (d: GraphNode) => {
      if (!q) return true
      const haystack = `${d.id} ${d.mapLabel ?? ''} ${d.title ?? ''} ${d.description ?? ''}`.toLowerCase()
      return haystack.includes(q)
    }

    node.attr('opacity', (d: any) => (matchesNode(d) ? 1 : 0.14))
    link.attr('opacity', (d: any) => {
      if (!q) return 1
      const source = typeof d.source === 'string' ? nodeById.get(d.source) : d.source
      const target = typeof d.target === 'string' ? nodeById.get(d.target) : d.target
      return (source && matchesNode(source)) || (target && matchesNode(target)) ? 1 : 0.06
    })
  }

  const applyFocusStyles = (focus: GraphNode) => {
    node.attr('opacity', (d: any) => (isNeighbor(focus, d) ? 1 : 0.06))
    link.attr('opacity', (d: any) =>
      (typeof d.source === 'string' ? d.source : d.source.id) === focus.id ||
      (typeof d.target === 'string' ? d.target : d.target.id) === focus.id
        ? 1
        : 0.05
    )
  }

  const applyHoverFocusStyles = (focus: GraphNode) => {
    const { hop1, hop2 } = computeHopSets(focus.id)
    const visible = new Set<string>([focus.id, ...hop1, ...hop2])

    node.attr('opacity', (d: any) => {
      if (d.id === focus.id) return 1
      if (hop1.has(d.id)) return 1
      if (hop2.has(d.id)) return 0.32
      return 0
    })

    link.attr('opacity', (d: any) => {
      const sourceId = typeof d.source === 'string' ? d.source : d.source.id
      const targetId = typeof d.target === 'string' ? d.target : d.target.id

      if (!visible.has(sourceId) || !visible.has(targetId)) return 0
      if (sourceId === focus.id || targetId === focus.id) return 1

      const sourceHop1 = hop1.has(sourceId)
      const targetHop1 = hop1.has(targetId)
      const sourceHop2 = hop2.has(sourceId)
      const targetHop2 = hop2.has(targetId)

      if ((sourceHop1 && targetHop2) || (sourceHop2 && targetHop1)) return 0.62
      if (sourceHop1 && targetHop1) return 0.42
      if (sourceHop2 && targetHop2) return 0.22
      return 0
    })
  }

  const applyDefaultStyles = () => {
    const selected = selectedNodeId.value ? nodeById.get(selectedNodeId.value) : null
    if (selected) applyFocusStyles(selected)
    else applyQueryStyles()
    applySelectedMarker()
  }

  node
    .on('mouseenter', (_event, d: any) => applyHoverFocusStyles(d))
    .on('mouseleave', () => applyDefaultStyles())

  simulation.on('tick', () => {
    link.attr('d', linkArc as any)
    node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  })

  applyLabelsVisibility()
  applyDefaultStyles()

  const cleanup = () => simulation.stop()
  return { cleanup, applyDefaultStyles, applyLabelsVisibility }
}

async function loadGraph() {
  try {
    loading.value = true
    error.value = null

    const res = await fetch(withBase('/demos-data/graph.json'), { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Falha ao carregar /demos-data/graph.json (${res.status})`)
    }

    graph.value = (await res.json()) as GraphData
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadGraph()

  let cleanup: (() => void) | null = null
  let applyDefaultStyles: (() => void) | null = null
  let applyLabelsVisibility: (() => void) | null = null

  const rerender = () => {
    cleanup?.()

    const result = render() as
      | { cleanup: () => void; applyDefaultStyles: () => void; applyLabelsVisibility: () => void }
      | undefined
    cleanup = result?.cleanup ?? null
    applyDefaultStyles = result?.applyDefaultStyles ?? null
    applyLabelsVisibility = result?.applyLabelsVisibility ?? null
  }

  stopRenderWatch = watch([filteredGraph], () => rerender(), {
    immediate: true
  })

  stopFilterWatch = watch(
    edgeKindFilter,
    (value) => {
      applyVisibilityDefaultsForEdgeFilter(value)
    },
    { immediate: true }
  )

  stopQueryWatch = watch([query], () => applyDefaultStyles?.())
  stopLabelsWatch = watch([showLabels], () => applyLabelsVisibility?.())
  stopSelectionWatch = watch([selectedNodeId], () => applyDefaultStyles?.())

  if (containerEl.value) {
    resizeObserver = new ResizeObserver(() => rerender())
    resizeObserver.observe(containerEl.value)
  }

  onBeforeUnmount(() => {
    stopRenderWatch?.()
    stopRenderWatch = null
    stopFilterWatch?.()
    stopFilterWatch = null
    stopQueryWatch?.()
    stopQueryWatch = null
    stopLabelsWatch?.()
    stopLabelsWatch = null
    stopSelectionWatch?.()
    stopSelectionWatch = null
    resizeObserver?.disconnect()
    resizeObserver = null
    cleanup?.()
    cleanup = null
  })
})

watch(selectedNodeId, async () => {
  await loadSelectedNote()
})

watch(
  [filteredGraph, selectedNodeId],
  () => {
    if (!selectedNodeId.value) return
    const nodes = filteredGraph.value?.nodes ?? []
    if (!nodes.some((node) => node.id === selectedNodeId.value)) {
      clearSelection()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="demos-map">
    <div class="demos-map__controls">
      <label class="demos-map__field demos-map__field--grow">
        <span>Buscar</span>
        <input v-model="query" type="search" placeholder="Nome ou ID" />
      </label>

      <div class="demos-map__field">
        <span>Filtro</span>
        <div class="demos-map__radio-group" role="radiogroup" aria-label="Filtro">
          <label class="demos-map__radio">
            <input v-model="edgeKindFilter" type="radio" name="demos-map-filter" value="related" />
            <span>Relações</span>
          </label>

          <label class="demos-map__radio">
            <input v-model="edgeKindFilter" type="radio" name="demos-map-filter" value="family" />
            <span>Família</span>
          </label>
        </div>
      </div>

      <div class="demos-map__field demos-map__field--toggles">
        <span>Exibir</span>
        <div class="demos-map__toggles">
          <label class="demos-map__toggle">
            <input v-model="showPeople" type="checkbox" />
            <span>Pessoas</span>
          </label>

          <label class="demos-map__toggle">
            <input v-model="showOrganizations" type="checkbox" />
            <span>Organizações</span>
          </label>

          <label class="demos-map__toggle">
            <input v-model="showCases" type="checkbox" />
            <span>Casos</span>
          </label>

          <label class="demos-map__toggle">
            <input v-model="showLabels" type="checkbox" />
            <span>Rótulos</span>
          </label>
        </div>
      </div>
    </div>

    <div class="demos-map__canvas" ref="containerEl">
      <div v-if="loading" class="demos-map__status">Carregando…</div>
      <div v-else-if="error" class="demos-map__status demos-map__status--error">
        {{ error }}
      </div>
      <svg v-else ref="svgEl" class="demos-map__svg" aria-label="Mapa de relações do Skepvox"></svg>

      <div v-if="selectedNode" class="demos-map__panel" role="dialog" aria-label="Detalhes do nó selecionado">
        <div class="demos-map__panel-header">
          <div class="demos-map__panel-title">
            {{ selectedNode.mapLabel || labelForNode(selectedNode) }}
          </div>
          <button class="demos-map__panel-close" type="button" @click="clearSelection">Fechar</button>
        </div>

        <div class="demos-map__panel-meta">
          <span class="demos-map__badge" :style="{ borderColor: colorForType(selectedNode.type) }">
            {{ typeLabel(selectedNode.type) }}
          </span>
          <code class="demos-map__mono">{{ selectedNode.id }}</code>
        </div>

        <div class="demos-map__panel-actions">
          <a class="demos-map__panel-link" :href="withBase(selectedNode.url)">Abrir nota</a>
        </div>

        <div class="demos-map__panel-body">
          <div v-if="selectedNoteLoading" class="demos-map__panel-status">Carregando nota…</div>
          <div v-else-if="selectedNoteError" class="demos-map__panel-status demos-map__panel-status--error">
            {{ selectedNoteError }}
          </div>
          <template v-else-if="selectedNote">
            <div v-if="selectedNote.description" class="demos-map__panel-desc">
              {{ selectedNote.description }}
            </div>

            <details class="demos-map__panel-section" open>
              <summary>
                Perguntas abertas
                <span class="demos-map__panel-count">({{ selectedNote.openQuestions?.length ?? 0 }})</span>
              </summary>

              <ul v-if="(selectedNote.openQuestions?.length ?? 0) > 0" class="demos-map__panel-list">
                <li v-for="q in selectedNote.openQuestions" :key="q.id">
                  <div class="demos-map__panel-item-title">
                    <code class="demos-map__mono">{{ q.state }}</code>
                    <span>{{ q.question }}</span>
                  </div>
                </li>
              </ul>
              <div v-else class="demos-map__panel-empty">Sem perguntas registradas nesta nota.</div>
            </details>

            <details class="demos-map__panel-section" open>
              <summary>
                Conexões visíveis no mapa
                <span class="demos-map__panel-count">({{ selectedNeighbors.length }})</span>
              </summary>

              <ul v-if="selectedNeighbors.length > 0" class="demos-map__panel-list">
                <li v-for="n in selectedNeighbors" :key="n.id">
                  <a class="demos-map__panel-neighbor" :href="withBase(n.url)" @click.prevent="selectedNodeId = n.id">
                    <span class="demos-map__dot demos-map__dot--inline" :style="{ background: colorForType(n.type) }"></span>
                    <span>{{ n.mapLabel || labelForNode(n) }}</span>
                  </a>

                  <div class="demos-map__panel-edge-reasons">
                    <div
                      v-for="edge in (selectedNeighborEdgesById[n.id]?.outgoing ?? [])"
                      :key="`out-${edge.kind}-${edge.source}-${edge.target}`"
                      class="demos-map__panel-edge-reason"
                    >
                      → {{ formatEdgeReason(edge) }}
                    </div>
                    <div
                      v-for="edge in (selectedNeighborEdgesById[n.id]?.incoming ?? [])"
                      :key="`in-${edge.kind}-${edge.source}-${edge.target}`"
                      class="demos-map__panel-edge-reason"
                    >
                      ← {{ formatEdgeReason(edge) }}
                    </div>
                  </div>
                </li>
              </ul>
              <div v-else class="demos-map__panel-empty">Nenhuma conexão visível com os filtros atuais.</div>
            </details>
          </template>
          <div v-else class="demos-map__panel-status">Selecione um nó para ver detalhes.</div>
        </div>
      </div>
    </div>

    <div class="demos-map__legend">
      <span class="demos-map__legend-item">
        <span class="demos-map__dot" style="background: #3b82f6"></span>
        Pessoa
      </span>
      <span class="demos-map__legend-item">
        <span class="demos-map__dot" style="background: #10b981"></span>
        Organização
      </span>
      <span class="demos-map__legend-item">
        <span class="demos-map__dot" style="background: #f59e0b"></span>
        Caso
      </span>
      <span class="demos-map__legend-sep" aria-hidden="true"></span>
      <span class="demos-map__legend-item">
        <span class="demos-map__edge" style="--edge-color: #64748b"></span>
        Relações
      </span>
      <span class="demos-map__legend-item">
        <span class="demos-map__edge" style="--edge-color: #e11d48"></span>
        Família
      </span>
    </div>
  </div>
</template>

<style scoped>
.demos-map {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
}

.demos-map__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  padding: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.demos-map__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}

.demos-map__radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.demos-map__radio {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.demos-map__radio input {
  accent-color: var(--vp-c-brand-1);
}

.demos-map__field--grow {
  flex: 1;
  min-width: 240px;
}

.demos-map__field--toggles {
  min-width: 260px;
}

.demos-map__field > span {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.demos-map__field input,
.demos-map__field select {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.demos-map__toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-left: auto;
}

.demos-map__toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 12px;
}

.demos-map__toggle input {
  width: 14px;
  height: 14px;
}

.demos-map__canvas {
  position: relative;
  height: 70vh;
  min-height: 520px;
  background: var(--vp-c-bg);
}

.demos-map__svg {
  width: 100%;
  height: 100%;
  color: var(--vp-c-text-1);
}

.demos-map__panel {
  position: absolute;
  top: 12px;
  right: 12px;
  bottom: 12px;
  width: min(380px, calc(100% - 24px));
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.16);
}

.demos-map__panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.demos-map__panel-title {
  font-weight: 600;
  color: var(--vp-c-text-1);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demos-map__panel-close {
  margin-left: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 12px;
  background: var(--vp-c-bg-soft);
  color: #991b1b;
  font-weight: 700;
}

.demos-map__panel-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.demos-map__badge {
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
}

.demos-map__mono {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.demos-map__panel-actions {
  display: flex;
  padding: 10px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.demos-map__panel-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 12px;
}

.demos-map__panel-body {
  padding: 10px 12px;
  overflow: auto;
  color: var(--vp-c-text-1);
}

.demos-map__panel-status {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.demos-map__panel-status--error {
  color: var(--vp-c-danger-1);
}

.demos-map__panel-desc {
  font-size: 13px;
  color: var(--vp-c-text-1);
  margin-bottom: 10px;
}

.demos-map__panel-section {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  padding: 8px 10px;
  margin-bottom: 10px;
}

.demos-map__panel-section summary {
  cursor: pointer;
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.demos-map__panel-count {
  margin-left: 6px;
}

.demos-map__panel-list {
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--vp-c-text-1);
  font-size: 13px;
}

.demos-map__panel-item-title {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.demos-map__panel-neighbor {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.demos-map__panel-neighbor:hover {
  text-decoration: underline;
}

.demos-map__panel-edge-reasons {
  margin: 4px 0 8px;
  margin-left: 17px;
  display: grid;
  gap: 2px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  word-break: break-word;
}

.demos-map__panel-edge-reason {
  line-height: 1.25;
}

.demos-map__dot--inline {
  width: 9px;
  height: 9px;
}

.demos-map__panel-empty {
  margin-top: 8px;
  font-size: 12px;
  color: var(--vp-c-text-2);
}

@media (max-width: 720px) {
  .demos-map__panel {
    left: 10px;
    right: 10px;
    top: auto;
    bottom: 10px;
    width: auto;
    height: 56vh;
    min-height: 320px;
  }
}

.demos-map__status {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.demos-map__status--error {
  color: var(--vp-c-danger-1);
  padding: 16px;
  text-align: center;
}

.demos-map__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 12px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.demos-map__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.demos-map__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.demos-map__legend-sep {
  flex: 1;
}

.demos-map__edge {
  --edge-color: currentColor;
  position: relative;
  display: inline-block;
  width: 22px;
  height: 2px;
  border-radius: 999px;
  background: var(--edge-color);
  opacity: 0.85;
}

.demos-map__edge::after {
  content: '';
  position: absolute;
  right: -1px;
  top: 50%;
  transform: translateY(-50%);
  border-left: 6px solid var(--edge-color);
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}
</style>
