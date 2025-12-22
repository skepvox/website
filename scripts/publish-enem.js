import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FLAGS = new Set(process.argv.slice(2))
const DRY_RUN = FLAGS.has('--dry-run')
const SKIP_IMAGES = FLAGS.has('--skip-images')
const SKIP_CHARTS = FLAGS.has('--skip-charts')
const SKIP_ANSWERS = FLAGS.has('--skip-answers')
const SKIP_BY_AREA = FLAGS.has('--skip-by-area')
const SKIP_QUESTIONS = FLAGS.has('--skip-questions')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PIPELINE_ROOT = path.join(ROOT, 'pipeline-enem-extraction', 'processed')
const OVERRIDES_ROOT = path.join(ROOT, 'src', 'enem', 'overrides')
const PUBLIC_ROOT = path.join(ROOT, 'src', 'public', 'enem')

function usage() {
  return [
    'Usage:',
    '  node scripts/publish-enem.js --year 2025',
    '  node scripts/publish-enem.js --all',
    '',
    'Options:',
    '  --dry-run        Print actions without writing files',
    '  --skip-images    Do not copy images from the pipeline',
    '  --skip-charts    Do not copy charts from the pipeline',
    '  --skip-answers   Do not copy answers.json',
    '  --skip-by-area   Do not copy by_area if present',
    '  --skip-questions Do not write by_question JSON output',
    ''
  ].join('\n')
}

function collectYears(args) {
  const years = []
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--year' && args[i + 1]) {
      years.push(args[i + 1])
      i += 1
      continue
    }
    if (arg.startsWith('--year=')) {
      years.push(arg.split('=', 2)[1])
    }
  }
  return years
}

async function pathExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function mergeDeep(base, override) {
  if (override === null) {
    return null
  }
  if (Array.isArray(override)) {
    return override
  }
  if (isPlainObject(override)) {
    const result = isPlainObject(base) ? { ...base } : {}
    for (const [key, value] of Object.entries(override)) {
      result[key] = mergeDeep(base ? base[key] : undefined, value)
    }
    return result
  }
  return override
}

function resolveOverrideKey(filename, year) {
  const base = filename.replace(/\.json$/, '')
  if (/^q\d{3}$/i.test(base)) {
    return base.toLowerCase()
  }
  const match = base.match(/^(\d{4})_q(\d{3})$/i)
  if (match && match[1] === String(year)) {
    return `q${match[2]}`
  }
  return null
}

async function readOverrides(year) {
  const overridesDir = path.join(OVERRIDES_ROOT, String(year))
  if (!(await pathExists(overridesDir))) {
    return new Map()
  }
  const entries = await fs.readdir(overridesDir, { withFileTypes: true })
  const overrides = new Map()

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue
    }
    const key = resolveOverrideKey(entry.name, year)
    if (!key) {
      continue
    }
    const filePath = path.join(overridesDir, entry.name)
    const content = await fs.readFile(filePath, 'utf-8')
    overrides.set(key, JSON.parse(content))
  }

  return overrides
}

async function ensureDir(target) {
  if (!DRY_RUN) {
    await fs.mkdir(target, { recursive: true })
  }
}

async function copyFile(source, dest) {
  await ensureDir(path.dirname(dest))
  console.log(`${DRY_RUN ? 'DRY RUN copy' : 'copy'} ${path.relative(ROOT, source)} -> ${path.relative(ROOT, dest)}`)
  if (!DRY_RUN) {
    await fs.copyFile(source, dest)
  }
}

async function copyDir(source, dest) {
  if (!(await pathExists(source))) {
    return
  }
  await ensureDir(dest)
  const entries = await fs.readdir(source, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue
    }
    const sourcePath = path.join(source, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDir(sourcePath, destPath)
    } else if (entry.isFile()) {
      await copyFile(sourcePath, destPath)
    }
  }
}

async function publishYear(year) {
  const yearValue = String(year)
  if (!/^\d{4}$/.test(yearValue)) {
    throw new Error(`Invalid year: ${yearValue}`)
  }

  const sourceYearDir = path.join(PIPELINE_ROOT, yearValue)
  if (!(await pathExists(sourceYearDir))) {
    throw new Error(`Missing pipeline data for year ${yearValue}`)
  }

  const overrides = await readOverrides(yearValue)
  const destYearDir = path.join(PUBLIC_ROOT, yearValue)
  const byQuestionSource = path.join(sourceYearDir, 'by_question')
  const byQuestionDest = path.join(destYearDir, 'by_question')

  if (!SKIP_QUESTIONS) {
    await ensureDir(byQuestionDest)
    const entries = await fs.readdir(byQuestionSource, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) {
        continue
      }
      const questionKey = resolveOverrideKey(entry.name, yearValue)
      if (!questionKey) {
        continue
      }
      const sourcePath = path.join(byQuestionSource, entry.name)
      const baseContent = await fs.readFile(sourcePath, 'utf-8')
      const baseJson = JSON.parse(baseContent)
      const override = overrides.get(questionKey)
      const merged = override ? mergeDeep(baseJson, override) : baseJson

      if (override && override.id && override.id !== baseJson.id) {
        console.warn(`Override id mismatch for ${entry.name}: ${override.id} != ${baseJson.id}`)
      }

      const outputPath = path.join(byQuestionDest, entry.name)
      await ensureDir(path.dirname(outputPath))
      console.log(`${DRY_RUN ? 'DRY RUN write' : 'write'} ${path.relative(ROOT, outputPath)}`)
      if (!DRY_RUN) {
        await fs.writeFile(outputPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8')
      }
    }
  }

  if (!SKIP_ANSWERS) {
    const answersPath = path.join(sourceYearDir, 'answers.json')
    if (await pathExists(answersPath)) {
      await copyFile(answersPath, path.join(destYearDir, 'answers.json'))
    }
  }

  if (!SKIP_BY_AREA) {
    const byAreaSource = path.join(sourceYearDir, 'by_area')
    if (await pathExists(byAreaSource)) {
      await copyDir(byAreaSource, path.join(destYearDir, 'by_area'))
    }
  }

  if (!SKIP_IMAGES) {
    const imagesSource = path.join(sourceYearDir, 'images')
    if (await pathExists(imagesSource)) {
      await copyDir(imagesSource, path.join(destYearDir, 'images'))
    }
  }

  if (!SKIP_CHARTS) {
    const chartsSource = path.join(sourceYearDir, 'charts')
    if (await pathExists(chartsSource)) {
      await copyDir(chartsSource, path.join(destYearDir, 'charts'))
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (FLAGS.has('--help') || FLAGS.has('-h')) {
    console.log(usage())
    return
  }

  const years = collectYears(args)
  const allYears = FLAGS.has('--all')

  if (!allYears && years.length === 0) {
    console.log(usage())
    process.exitCode = 1
    return
  }

  let targetYears = years
  if (allYears) {
    if (!(await pathExists(PIPELINE_ROOT))) {
      throw new Error('Missing pipeline folder: pipeline-enem-extraction/processed')
    }
    const entries = await fs.readdir(PIPELINE_ROOT, { withFileTypes: true })
    targetYears = entries
      .filter((entry) => entry.isDirectory() && /^\d{4}$/.test(entry.name))
      .map((entry) => entry.name)
  }

  for (const year of targetYears) {
    await publishYear(year)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
