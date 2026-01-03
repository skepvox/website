import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FLAGS = new Set(process.argv.slice(2))
const DRY_RUN = FLAGS.has('--dry-run')
const YEAR = '2025'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC_ROOT = path.join(ROOT, 'src', 'public', 'enem', YEAR)

const log = (message) => console.log(message)

const ensureDir = async (dir) => {
  if (DRY_RUN) {
    return
  }
  await fs.mkdir(dir, { recursive: true })
}

const pathExists = async (target) => {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

const listFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }
  return files
}

const renameFileBase = (base) => {
  let match = base.match(/^q(\d{3})_chart_(\d{3})_meta\.json$/i)
  if (match) {
    return `${YEAR}-${match[1]}-chart-${match[2]}-meta.json`
  }
  match = base.match(/^q(\d{3})_chart_(\d{3})\.(json|csv)$/i)
  if (match) {
    return `${YEAR}-${match[1]}-chart-${match[2]}.${match[3]}`
  }
  match = base.match(/^q(\d{3})_img_(\d{3})\.(.+)$/i)
  if (match) {
    return `${YEAR}-${match[1]}-img-${match[2]}.${match[3]}`
  }
  match = base.match(/^q(\d{3})_table_(\d{3})\.json$/i)
  if (match) {
    return `${YEAR}-${match[1]}-table-${match[2]}.json`
  }
  match = base.match(/^q(\d{3})\.json$/i)
  if (match) {
    return `${YEAR}-${match[1]}.json`
  }
  return base
}

const renameAssetPath = (value) => {
  if (!value) {
    return value
  }
  const posix = path.posix
  const dir = posix.dirname(value)
  const base = posix.basename(value)
  const renamed = renameFileBase(base)
  if (renamed === base) {
    return value
  }
  if (dir === '.') {
    return renamed
  }
  return posix.join(dir, renamed)
}

const renameChartId = (value) => {
  if (!value) {
    return value
  }
  const match = String(value).match(/^q(\d{3})_chart_(\d{3})$/i)
  if (!match) {
    return value
  }
  return `${YEAR}-${match[1]}-chart-${match[2]}`
}

const renameChartType = (value) => {
  if (!value) {
    return value
  }
  const match = String(value).match(/^q(\d{3})-(.+)$/i)
  if (!match) {
    return value
  }
  return `${YEAR}-${match[1]}-${match[2]}`
}

const renameChartAnchor = (value) => {
  if (!value) {
    return value
  }
  return String(value).replace(/asset:q(\d{3})_chart_(\d{3})/gi, (_match, q, c) => {
    return `asset:${YEAR}-${q}-chart-${c}`
  })
}

const renameFile = async (fromPath, toPath) => {
  if (fromPath === toPath) {
    return
  }
  await ensureDir(path.dirname(toPath))
  log(`${DRY_RUN ? 'DRY RUN rename' : 'rename'} ${path.relative(ROOT, fromPath)} -> ${path.relative(ROOT, toPath)}`)
  if (!DRY_RUN) {
    await fs.rename(fromPath, toPath)
  }
}

const updateChartMetaId = async (filePath) => {
  const base = path.basename(filePath)
  if (!/-chart-\d{3}-meta\.json$/i.test(base)) {
    return
  }
  const content = await fs.readFile(filePath, 'utf-8')
  const data = JSON.parse(content)
  const newId = base.replace(/-meta\.json$/i, '')
  const newType = renameChartType(data.type)
  if (data.id === newId && data.type === newType) {
    return
  }
  data.id = newId
  data.type = newType
  const output = `${JSON.stringify(data, null, 2)}\n`
  log(`${DRY_RUN ? 'DRY RUN write' : 'write'} ${path.relative(ROOT, filePath)}`)
  if (!DRY_RUN) {
    await fs.writeFile(filePath, output, 'utf-8')
  }
}

const updateTableId = async (filePath) => {
  const base = path.basename(filePath)
  if (!/-table-\d{3}\.json$/i.test(base)) {
    return
  }
  const content = await fs.readFile(filePath, 'utf-8')
  const data = JSON.parse(content)
  const newId = base.replace(/\.json$/i, '')
  if (data.id === newId) {
    return
  }
  data.id = newId
  const output = `${JSON.stringify(data, null, 2)}\n`
  log(`${DRY_RUN ? 'DRY RUN write' : 'write'} ${path.relative(ROOT, filePath)}`)
  if (!DRY_RUN) {
    await fs.writeFile(filePath, output, 'utf-8')
  }
}

const updateQuestionJson = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf-8')
  const data = JSON.parse(content)

  if (data.assets?.images) {
    data.assets.images = data.assets.images.map((asset) => ({
      ...asset,
      file: renameAssetPath(asset.file)
    }))
  }

  if (data.assets?.charts) {
    data.assets.charts = data.assets.charts.map((asset) => ({
      ...asset,
      id: renameChartId(asset.id),
      type: renameChartType(asset.type),
      data_file: renameAssetPath(asset.data_file),
      meta_file: renameAssetPath(asset.meta_file)
    }))
  }

  if (data.options) {
    data.options = data.options.map((option) => ({
      ...option,
      image: renameAssetPath(option.image),
      chart: option.chart
        ? {
            ...option.chart,
            id: renameChartId(option.chart.id),
            type: renameChartType(option.chart.type),
            data_file: renameAssetPath(option.chart.data_file),
            meta_file: renameAssetPath(option.chart.meta_file)
          }
        : option.chart
    }))
  }

  if (Array.isArray(data.text_flow)) {
    data.text_flow = data.text_flow.map((entry) => ({
      ...entry,
      anchor: renameChartAnchor(entry.anchor)
    }))
  }

  const output = `${JSON.stringify(data, null, 2)}\n`
  log(`${DRY_RUN ? 'DRY RUN write' : 'write'} ${path.relative(ROOT, filePath)}`)
  if (!DRY_RUN) {
    await fs.writeFile(filePath, output, 'utf-8')
  }
}

const renameQuestions = async () => {
  const questionsDirOld = path.join(PUBLIC_ROOT, 'by_question')
  const questionsDir = path.join(PUBLIC_ROOT, 'questions')

  if (await pathExists(questionsDirOld)) {
    if (await pathExists(questionsDir)) {
      throw new Error('Both by_question and questions directories exist. Resolve manually.')
    }
    log(`${DRY_RUN ? 'DRY RUN rename' : 'rename'} ${path.relative(ROOT, questionsDirOld)} -> ${path.relative(ROOT, questionsDir)}`)
    if (!DRY_RUN) {
      await fs.rename(questionsDirOld, questionsDir)
    }
  }

  if (!(await pathExists(questionsDir))) {
    throw new Error(`Missing questions directory at ${questionsDir}`)
  }

  const entries = await fs.readdir(questionsDir)
  for (const entry of entries) {
    if (!/\.json$/i.test(entry)) {
      continue
    }
    const oldPath = path.join(questionsDir, entry)
    const newName = renameFileBase(entry)
    const newPath = path.join(questionsDir, newName)
    if (newPath !== oldPath) {
      await renameFile(oldPath, newPath)
    }
  }

  const questionFiles = (await fs.readdir(questionsDir))
    .filter((entry) => entry.endsWith('.json'))
    .map((entry) => path.join(questionsDir, entry))

  for (const filePath of questionFiles) {
    await updateQuestionJson(filePath)
  }
}

const renameAssetsInDir = async (dirPath) => {
  if (!(await pathExists(dirPath))) {
    return
  }
  const files = await listFiles(dirPath)
  for (const filePath of files) {
    const base = path.basename(filePath)
    const renamed = renameFileBase(base)
    if (renamed === base) {
      continue
    }
    const newPath = path.join(path.dirname(filePath), renamed)
    await renameFile(filePath, newPath)
  }
}

const updateChartsMeta = async () => {
  const chartsDir = path.join(PUBLIC_ROOT, 'charts')
  if (!(await pathExists(chartsDir))) {
    return
  }
  const files = await listFiles(chartsDir)
  for (const filePath of files) {
    if (!filePath.endsWith('.json')) {
      continue
    }
    await updateChartMetaId(filePath)
  }
}

const updateTables = async () => {
  const tablesDir = path.join(PUBLIC_ROOT, 'tables')
  if (!(await pathExists(tablesDir))) {
    return
  }
  const files = await listFiles(tablesDir)
  for (const filePath of files) {
    if (!filePath.endsWith('.json')) {
      continue
    }
    await updateTableId(filePath)
  }
}

async function main() {
  await renameQuestions()
  await renameAssetsInDir(path.join(PUBLIC_ROOT, 'charts'))
  await renameAssetsInDir(path.join(PUBLIC_ROOT, 'images'))
  await renameAssetsInDir(path.join(PUBLIC_ROOT, 'tables'))
  await updateChartsMeta()
  await updateTables()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
