import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AUTHOR_CATEGORY = {
  'augustine': 'filosofia',
  'graciliano-ramos': 'literatura',
  'louis-lavelle': 'filosofia',
  'machado-de-assis': 'literatura',
  'plato': 'filosofia',
  'raul-pompeia': 'literatura'
}

const VALID_CATEGORIES = new Set(['literatura', 'filosofia'])
const DRY_RUN = process.argv.includes('--dry-run')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PIPELINE_DIR = path.join(ROOT, 'pipeline-book-extraction', 'processed')
const TARGET_ROOT = path.join(ROOT, 'src')

async function pathExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

function renderCopy(source, dest) {
  const label = DRY_RUN ? 'DRY RUN copy' : 'copy'
  return `${label} ${path.relative(ROOT, source)} -> ${path.relative(ROOT, dest)}`
}

async function main() {
  if (!(await pathExists(PIPELINE_DIR))) {
    throw new Error('Missing pipeline folder: pipeline-book-extraction/processed')
  }

  const entries = await fs.readdir(PIPELINE_DIR, { withFileTypes: true })
  const unknownAuthors = []
  let copiedCount = 0

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) {
      continue
    }

    const author = entry.name
    const category = AUTHOR_CATEGORY[author]

    if (!category) {
      unknownAuthors.push(author)
      continue
    }

    if (!VALID_CATEGORIES.has(category)) {
      throw new Error(`Unknown category for ${author}: ${category}`)
    }

    const sourceDir = path.join(PIPELINE_DIR, author)
    const targetDir = path.join(TARGET_ROOT, category, author)
    const files = await fs.readdir(sourceDir, { withFileTypes: true })

    if (!DRY_RUN) {
      await fs.mkdir(targetDir, { recursive: true })
    }

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.md')) {
        continue
      }

      const sourcePath = path.join(sourceDir, file.name)
      const targetPath = path.join(targetDir, file.name)

      console.log(renderCopy(sourcePath, targetPath))
      if (!DRY_RUN) {
        await fs.copyFile(sourcePath, targetPath)
      }
      copiedCount += 1
    }
  }

  if (unknownAuthors.length > 0) {
    console.warn(
      `Skipped authors without a category: ${unknownAuthors.sort().join(', ')}`
    )
    console.warn('Update AUTHOR_CATEGORY in scripts/sync-book-pipeline.js to include them.')
  }

  const summaryLabel = DRY_RUN ? 'Would copy' : 'Copied'
  console.log(`${summaryLabel} ${copiedCount} file(s).`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
