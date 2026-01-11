<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import * as d3 from 'd3'
import { feature as topoFeature, mesh as topoMesh } from 'topojson-client'

// TopoJSON types (simplified for our use case)
type TopoGeometry = {
  type: string
  arcs?: number[][] | number[][][]
  geometries?: TopoGeometry[]
  id?: string | number
  properties?: Record<string, unknown>
}

type Topology = {
  type: 'Topology'
  objects: Record<string, TopoGeometry>
  arcs: number[][][]
  transform?: { scale: [number, number]; translate: [number, number] }
}

// GeoJSON types for features
type GeoGeometry = GeoJSON.Geometry | null

type GeoFeature = {
  type: 'Feature'
  id?: string | number | null
  properties?: Record<string, unknown> | null
  geometry: GeoGeometry
}

type GeoFeatureCollection = {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

// TopoJSON mesh result type
type GeoMesh = GeoJSON.MultiLineString

type LayerKey = 'states' | 'municipios'

const containerEl = ref<HTMLDivElement | null>(null)
const svgEl = ref<SVGSVGElement | null>(null)

const layer = ref<LayerKey>('states')
const topoData = ref<Topology | null>(null)
const geoData = ref<GeoFeatureCollection | null>(null)
const meshData = ref<GeoMesh | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const selectedId = ref<string | null>(null)

const featureIndex = ref(new Map<string, GeoFeature>())
const topoCache = new Map<LayerKey, Topology>()

const layerMeta: Record<LayerKey, { label: string; url: string; expectedPath: string }> = {
  states: {
    label: 'Estados (TopoJSON)',
    url: '/demos-data/geo/brasil-estados.topojson',
    expectedPath: 'src/public/demos-data/geo/brasil-estados.topojson'
  },
  municipios: {
    label: 'Municipios (TopoJSON)',
    url: '/demos-data/geo/brasil-municipios.topojson',
    expectedPath: 'src/public/demos-data/geo/brasil-municipios.topojson'
  }
}

const featureCount = computed(() => geoData.value?.features?.length ?? 0)
const selectedFeature = computed(() => {
  if (!selectedId.value) return null
  return featureIndex.value.get(selectedId.value) ?? null
})

let resizeObserver: ResizeObserver | null = null
let loadAbort: AbortController | null = null
let cleanup: (() => void) | null = null
let applyFocusStyles: ((id: string | null) => void) | null = null

function idForFeature(feature: GeoFeature) {
  const rawId = feature.id
  if (rawId !== null && rawId !== undefined) return String(rawId)

  const properties = feature.properties ?? {}
  const candidates = [
    properties.id,
    properties.ID,
    properties.codarea,
    properties.cod_area,
    properties.cod,
    properties.codigo,
    properties.CD_MUN,
    properties.CD_UF,
    properties.sigla,
    properties.SIGLA_UF,
    properties.uf
  ]

  for (const entry of candidates) {
    if (typeof entry === 'string' && entry.trim()) return entry.trim()
    if (typeof entry === 'number' && Number.isFinite(entry)) return String(entry)
  }

  return null
}

function nameForFeature(feature: GeoFeature) {
  const properties = feature.properties ?? {}
  const candidates = [
    properties.name,
    properties.nome,
    properties.NM_UF,
    properties.NM_MUN,
    properties.NOME,
    properties.SIGLA_UF,
    properties.sigla,
    properties.uf,
    properties.codarea,
    properties.cod_area
  ]

  for (const entry of candidates) {
    if (typeof entry === 'string' && entry.trim()) return entry.trim()
  }

  const fallback = idForFeature(feature)
  return fallback ?? 'Area'
}

function valueForFeature(feature: GeoFeature) {
  const properties = feature.properties ?? {}
  const candidates = [properties.value, properties.valor, properties.metric]
  for (const entry of candidates) {
    if (typeof entry === 'number' && Number.isFinite(entry)) return entry
  }
  return null
}

function buildFeatureIndex(data: GeoFeatureCollection) {
  const index = new Map<string, GeoFeature>()
  for (const feature of data.features) {
    const id = idForFeature(feature)
    if (id) index.set(id, feature)
  }
  featureIndex.value = index
}

function buildGeoFromTopo(topology: Topology) {
  const objectKeys = Object.keys(topology.objects ?? {})
  if (!objectKeys.length) {
    throw new Error('TopoJSON sem objetos para renderizar.')
  }

  const objectKey = objectKeys[0]
  const obj = topology.objects[objectKey]
  // Type assertion needed as topojson-client has complex overloads
  const featureResult = topoFeature(topology as Parameters<typeof topoFeature>[0], obj as Parameters<typeof topoFeature>[1])
  const features: GeoFeatureCollection =
    featureResult.type === 'FeatureCollection'
      ? (featureResult as unknown as GeoFeatureCollection)
      : { type: 'FeatureCollection', features: [featureResult as unknown as GeoFeature] }
  // No filter = all borders (internal + external/coastline)
  const mesh = topoMesh(topology as Parameters<typeof topoMesh>[0], obj as Parameters<typeof topoMesh>[1]) as GeoMesh
  return { features, mesh }
}

function render() {
  const data = geoData.value
  const mesh = meshData.value
  const container = containerEl.value
  const svgNode = svgEl.value

  if (!data || !container || !svgNode) return

  const width = Math.max(320, Math.floor(container.clientWidth))
  const height = Math.max(360, Math.round(width * 0.74))
  const padding = 12

  const svg = d3.select(svgNode)
  svg.selectAll('*').remove()
  svg.attr('viewBox', `0 0 ${width} ${height}`)
  svg.attr('width', width)
  svg.attr('height', height)

  const projection = d3
    .geoMercator()
    .fitExtent(
      [
        [padding, padding],
        [width - padding, height - padding]
      ],
      data as any
    )

  const path = d3.geoPath(projection as any)

  const values = data.features
    .map((feature) => valueForFeature(feature))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

  const valueExtent = values.length ? (d3.extent(values) as [number, number]) : null
  const color = valueExtent ? d3.scaleSequential(d3.interpolateYlGnBu).domain(valueExtent) : null

  const root = svg.append('g')

  const paths = root
    .selectAll('path')
    .data(data.features)
    .join('path')
    .attr('class', 'demos-brazil-map__feature')
    .attr('d', path as unknown as string)
    .attr('fill', (feature: GeoFeature) => {
      const value = valueForFeature(feature)
      if (typeof value === 'number' && color) return color(value)
      return 'var(--demos-br-fill)'
    })
    .attr('stroke', 'transparent')
    .attr('stroke-width', 0.9)
    .attr('vector-effect', 'non-scaling-stroke')

  paths
    .append('title')
    .text((feature: GeoFeature) => {
      const name = nameForFeature(feature)
      const value = valueForFeature(feature)
      return value === null ? name : `${name} - ${value}`
    })

  if (mesh) {
    root
      .append('path')
      .datum(mesh)
      .attr('class', 'demos-brazil-map__mesh')
      .attr('d', path as unknown as string)
      .attr('fill', 'none')
      .attr('stroke', 'var(--demos-br-stroke)')
      .attr('stroke-width', 0.8)
      .attr('vector-effect', 'non-scaling-stroke')
  }

  // Highlight path sits on top of mesh for clear selection visibility
  const highlight = root
    .append('path')
    .attr('class', 'demos-brazil-map__highlight')
    .attr('fill', 'none')
    .attr('stroke', 'var(--demos-br-stroke-active)')
    .attr('stroke-width', 1.6)
    .attr('vector-effect', 'non-scaling-stroke')
    .attr('pointer-events', 'none')
    .style('display', 'none')

  const focusStyles = (focusId: string | null) => {
    const hasFocus = Boolean(focusId)
    paths.attr('opacity', (feature: GeoFeature) => {
      if (!hasFocus) return 1
      const id = idForFeature(feature)
      if (!id) return 0.4
      return id === focusId ? 1 : 0.28
    })

    if (focusId) {
      const focusedFeature = featureIndex.value.get(focusId)
      if (focusedFeature) {
        highlight
          .datum(focusedFeature)
          .attr('d', path as unknown as string)
          .style('display', null)
      }
    } else {
      highlight.style('display', 'none')
    }
  }

  applyFocusStyles = focusStyles
  focusStyles(selectedId.value)

  svg.on('click', () => {
    selectedId.value = null
    focusStyles(null)
  })

  paths
    .on('click', (event: MouseEvent, feature: GeoFeature) => {
      event?.stopPropagation?.()
      const id = idForFeature(feature)
      if (!id) return
      selectedId.value = selectedId.value === id ? null : id
      focusStyles(selectedId.value)
    })
    .on('mouseenter', (_event: MouseEvent, feature: GeoFeature) => {
      const id = idForFeature(feature)
      if (!id) return
      focusStyles(selectedId.value ?? id)
    })
    .on('mouseleave', () => {
      focusStyles(selectedId.value)
    })

  cleanup = () => {
    svg.on('click', null)
  }
}

async function loadLayer() {
  const { url, expectedPath } = layerMeta[layer.value]
  const cached = topoCache.get(layer.value)
  if (cached) {
    topoData.value = cached
    const { features, mesh } = buildGeoFromTopo(cached)
    geoData.value = features
    meshData.value = mesh
    buildFeatureIndex(features)
    loading.value = false
    error.value = null
    selectedId.value = null
    await nextTick()
    render()
    return
  }

  loadAbort?.abort()
  const controller = new AbortController()
  loadAbort = controller

  loading.value = true
  error.value = null
  selectedId.value = null
  topoData.value = null
  geoData.value = null
  meshData.value = null

  try {
    const res = await fetch(withBase(url), {
      cache: 'no-store',
      signal: controller.signal
    })
    if (!res.ok) {
      throw new Error(`Falha ao carregar ${url} (${res.status}).`)
    }

    const data = await res.json()
    if (controller.signal.aborted) return

    topoCache.set(layer.value, data)
    topoData.value = data

    const { features, mesh } = buildGeoFromTopo(data)
    geoData.value = features
    meshData.value = mesh
    buildFeatureIndex(features)
    await nextTick()
    render()
  } catch (err: any) {
    if (err?.name === 'AbortError') return
    const message = err?.message ?? String(err)
    error.value = `${message} Adicione o TopoJSON em ${expectedPath}.`
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}

onMounted(() => {
  loadLayer()

  if (containerEl.value) {
    resizeObserver = new ResizeObserver(() => render())
    resizeObserver.observe(containerEl.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  loadAbort?.abort()
  loadAbort = null
  cleanup?.()
  cleanup = null
})

watch(layer, async () => {
  await loadLayer()
})

watch(selectedId, () => {
  applyFocusStyles?.(selectedId.value)
})
</script>

<template>
  <div class="demos-brazil-map">
    <div class="demos-brazil-map__controls">
      <label class="demos-brazil-map__field">
        <span>Camada</span>
        <select v-model="layer">
          <option value="states">Estados</option>
          <option value="municipios">Municipios</option>
        </select>
      </label>

      <div class="demos-brazil-map__meta">
        <div class="demos-brazil-map__meta-label">
          {{ layerMeta[layer].label }} - {{ featureCount }} areas
        </div>
        <div v-if="selectedFeature" class="demos-brazil-map__meta-value">
          Selecionado: <strong>{{ nameForFeature(selectedFeature) }}</strong>
          <span v-if="valueForFeature(selectedFeature) !== null" class="demos-brazil-map__meta-metric">
            {{ valueForFeature(selectedFeature) }}
          </span>
        </div>
        <div v-else class="demos-brazil-map__meta-hint">Clique em uma area para fixar.</div>
      </div>
    </div>

    <div class="demos-brazil-map__canvas" ref="containerEl">
      <svg ref="svgEl" class="demos-brazil-map__svg" aria-label="Mapa do Brasil"></svg>
      <div v-if="loading" class="demos-brazil-map__status">Carregando...</div>
      <div v-else-if="error" class="demos-brazil-map__status demos-brazil-map__status--error">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.demos-brazil-map {
  --demos-br-fill: #dcefe7;
  --demos-br-stroke: #1f4d43;
  --demos-br-stroke-active: #0f766e;
  --demos-br-bg: #f6faf8;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(140deg, var(--demos-br-bg), var(--vp-c-bg-soft));
}

:global(.dark) .demos-brazil-map {
  --demos-br-fill: #1d2e2b;
  --demos-br-stroke: #7ac6b0;
  --demos-br-stroke-active: #b9f6df;
  --demos-br-bg: #0f1917;
}

.demos-brazil-map__controls {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.demos-brazil-map__field {
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
  max-width: 220px;
}

.demos-brazil-map__field span {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.demos-brazil-map__field select {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.demos-brazil-map__meta {
  display: grid;
  gap: 6px;
  color: var(--vp-c-text-1);
}

.demos-brazil-map__meta-label {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.demos-brazil-map__meta-value {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.demos-brazil-map__meta-metric {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.demos-brazil-map__meta-hint {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.demos-brazil-map__canvas {
  position: relative;
  min-height: 360px;
  background: radial-gradient(circle at top left, rgba(16, 185, 129, 0.12), transparent 55%);
}

.demos-brazil-map__svg {
  width: 100%;
  height: 100%;
  display: block;
  color: var(--vp-c-text-1);
}

.demos-brazil-map__status {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--vp-c-text-2);
  font-size: 14px;
  padding: 16px;
  text-align: center;
  background: rgba(246, 250, 248, 0.75);
  backdrop-filter: blur(2px);
}

.demos-brazil-map__status--error {
  color: var(--vp-c-danger-1);
}

:global(.dark) .demos-brazil-map__status {
  background: rgba(15, 25, 23, 0.7);
}
</style>
