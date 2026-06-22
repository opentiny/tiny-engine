#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const sourceDir = path.resolve(__dirname, '../src/database')
const outputDir = process.env.MOCK_FILE_DB_PATH || path.resolve(__dirname, '../data')
const forceOverwrite = process.argv.includes('--force')

const collectionNamingFields = {
  pages: ['name'],
  apps: ['name'],
  appsSchema: ['id'],
  blocks: ['label', 'name'],
  blockGroups: ['name'],
  blockCategories: ['name']
}

function isNedbMetadataRecord (doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return false
  }

  return Object.keys(doc).some((key) => key.startsWith('$$'))
}

function sanitizeFileName (name) {
  if (!name) {
    return ''
  }

  const normalized = String(name)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .slice(0, 120)

  if (!normalized || normalized === '.' || normalized === '..') {
    return ''
  }

  return normalized
}

function resolveFileBaseName (doc, collectionName, usedNames) {
  const namingFields = collectionNamingFields[collectionName] || ['name', 'label']
  let preferred = ''

  for (const field of namingFields) {
    const value = sanitizeFileName(doc[field])
    if (value) {
      preferred = value
      break
    }
  }

  if (!preferred) {
    preferred = sanitizeFileName(doc.id) || sanitizeFileName(doc._id) || 'record'
  }

  const idSuffix = String(doc._id || doc.id || 'item').slice(0, 6)
  const normalizedPreferred = preferred.toLowerCase()
  if (!usedNames.has(normalizedPreferred)) {
    usedNames.add(normalizedPreferred)
    return preferred
  }

  let attempt = `${preferred}-${idSuffix}`
  let seq = 2

  while (usedNames.has(attempt.toLowerCase())) {
    attempt = `${preferred}-${idSuffix}-${seq}`
    seq += 1
  }

  usedNames.add(attempt.toLowerCase())
  return attempt
}

function parseDbFile (dbPath) {
  const content = fs.readFileSync(dbPath, 'utf8')
  const docs = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line)
      } catch (error) {
        throw new Error(`Failed to parse ${path.basename(dbPath)} line ${index + 1}: ${error.message}`)
      }
    })

  const filteredDocs = docs.filter((doc) => !isNedbMetadataRecord(doc))

  return {
    docs: filteredDocs,
    filtered: docs.length - filteredDocs.length
  }
}

function ensureDirectory (dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function cleanCollectionDirectory (collectionPath) {
  if (!fs.existsSync(collectionPath)) {
    return
  }

  const files = fs.readdirSync(collectionPath)
  for (const fileName of files) {
    if (fileName.endsWith('.json')) {
      fs.unlinkSync(path.join(collectionPath, fileName))
    }
  }
}

function exportCollection (dbFile) {
  const collectionName = path.basename(dbFile, '.db')
  const dbPath = path.join(sourceDir, dbFile)
  const collectionPath = path.join(outputDir, collectionName)
  const { docs, filtered } = parseDbFile(dbPath)

  ensureDirectory(collectionPath)
  if (forceOverwrite) {
    cleanCollectionDirectory(collectionPath)
  }

  let written = 0
  let skipped = 0
  const usedNames = new Set()

  for (const doc of docs) {
    if (!doc._id && doc.id !== undefined) {
      doc._id = String(doc.id)
    }

    const fileBaseName = resolveFileBaseName(doc, collectionName, usedNames)
    const filePath = path.join(collectionPath, `${fileBaseName}.json`)

    if (!forceOverwrite && fs.existsSync(filePath)) {
      skipped += 1
      continue
    }

    fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf8')
    written += 1
  }

  return {
    collectionName,
    total: docs.length + filtered,
    filtered,
    written,
    skipped
  }
}

function run () {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Database directory not found: ${sourceDir}`)
  }

  ensureDirectory(outputDir)

  const dbFiles = fs.readdirSync(sourceDir).filter((fileName) => fileName.endsWith('.db'))

  if (dbFiles.length === 0) {
    console.log('No .db files found, nothing to export.')
    return
  }

  const summary = dbFiles.map(exportCollection)

  console.log(`Export complete. Output: ${outputDir}`)
  summary.forEach((item) => {
    console.log(
      `- ${item.collectionName}: total=${item.total}, filtered=${item.filtered}, written=${item.written}, skipped=${item.skipped}`
    )
  })
}

try {
  run()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
