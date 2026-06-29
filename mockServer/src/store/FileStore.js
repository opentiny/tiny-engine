/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const StoreAdapter = require('./StoreAdapter')

/**
 * FileStore - File-based storage adapter with atomic writes and concurrency support
 */
class FileStore extends StoreAdapter {
  constructor(collectionName, dataPath, options = {}) {
    super()
    this.collectionName = collectionName
    this.dataPath = dataPath
    this.collectionPath = path.join(dataPath, collectionName)
    this.namingFields = Array.isArray(options.namingFields) ? options.namingFields : []

    // Extract unique fields from indexes array
    this.uniqueFields = []
    if (options.indexes && Array.isArray(options.indexes)) {
      this.uniqueFields = options.indexes.filter((idx) => idx.unique === true).map((idx) => idx.fieldName)
    }

    // Ensure collection directory exists
    this.ensureDirectory()

    // Detect whether the collection directory lives on a case-sensitive
    // filesystem, so a file rename that only changes letter case (e.g.
    // Login -> login) is handled correctly. On a case-insensitive FS (macOS
    // APFS and Windows NTFS defaults) such a rename points at the same physical
    // file, so writeAtomic + unlink would otherwise delete the just-written file.
    this.caseSensitive = this.detectCaseSensitive()
  }

  ensureDirectory() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true })
    }
    if (!fs.existsSync(this.collectionPath)) {
      fs.mkdirSync(this.collectionPath, { recursive: true })
    }
  }

  /**
   * Probe whether the collection directory lives on a case-sensitive filesystem
   * by writing a marker file and checking whether a differently-cased name
   * resolves to it. Returns true (case-sensitive) or false (case-insensitive),
   * defaulting to false if probing fails so we never unlink on a case-only rename.
   */
  detectCaseSensitive() {
    const probeName = `.casesens-${crypto.randomBytes(4).toString('hex')}`
    const probePath = path.join(this.collectionPath, probeName)
    try {
      fs.writeFileSync(probePath, '')
      // On a case-insensitive FS the upper-cased name resolves to the same file.
      return !fs.existsSync(path.join(this.collectionPath, probeName.toUpperCase()))
    } catch {
      // Conservative default: treat as case-insensitive to avoid data loss.
      return false
    } finally {
      try {
        if (fs.existsSync(probePath)) {
          fs.unlinkSync(probePath)
        }
      } catch {
        /* best-effort cleanup of the probe file */
      }
    }
  }

  /**
   * Generate a unique ID similar to NeDB's format
   */
  generateId() {
    return crypto.randomBytes(8).toString('hex')
  }

  sanitizeFileName(name) {
    if (!name) {
      return ''
    }

    const normalized = String(name)
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^\.+/, '')
      .replace(/\.+$/, '')
      .slice(0, 120)

    if (!normalized || normalized === '.' || normalized === '..') {
      return ''
    }

    return normalized
  }

  buildFileBaseName(doc, allEntries = [], excludeId = null, reservedNames = null) {
    let baseName = ''

    for (const field of this.namingFields) {
      const value = this.sanitizeFileName(doc[field])
      if (value) {
        baseName = value
        break
      }
    }

    if (!baseName) {
      baseName = this.sanitizeFileName(doc.id) || this.sanitizeFileName(doc._id) || 'record'
    }

    const usedNames = new Set(
      allEntries
        .filter((entry) => entry.doc && entry.doc._id !== excludeId)
        .map((entry) => path.parse(entry.fileName).name.toLowerCase())
    )
    if (reservedNames) {
      for (const name of reservedNames) {
        usedNames.add(name)
      }
    }

    if (!usedNames.has(baseName.toLowerCase())) {
      return baseName
    }

    const suffix = String(doc._id || doc.id || 'item').slice(0, 6)
    let candidate = `${baseName}-${suffix}`
    let seq = 2

    while (usedNames.has(candidate.toLowerCase())) {
      candidate = `${baseName}-${suffix}-${seq}`
      seq += 1
    }

    return candidate
  }

  /**
   * Atomic write using temporary file and rename
   */
  writeAtomic(filePath, data) {
    const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`
    try {
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8')
      fs.renameSync(tempPath, filePath)
    } catch (error) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath)
      }
      throw error
    }
  }

  readDocumentFromFilePath(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const doc = JSON.parse(content)
      return doc
    } catch (error) {
      console.error(`Error reading document ${filePath}:`, error)
      return null
    }
  }

  readAllEntries() {
    if (!fs.existsSync(this.collectionPath)) {
      return []
    }

    const files = fs.readdirSync(this.collectionPath)
    const entries = []

    for (const fileName of files) {
      if (!fileName.endsWith('.json') || fileName.includes('.tmp.')) {
        continue
      }

      const filePath = path.join(this.collectionPath, fileName)
      const doc = this.readDocumentFromFilePath(filePath)
      if (doc) {
        if (!doc._id && doc.id !== undefined) {
          doc._id = String(doc.id)
        }
        entries.push({ doc, filePath, fileName })
      }
    }

    return entries
  }

  readAllDocuments() {
    return this.readAllEntries().map((entry) => entry.doc)
  }

  /**
   * Deep equality, mirroring NeDB's areThingsEqual: primitives by ===, Dates by
   * timestamp, arrays and plain objects by recursive value comparison. An array
   * never equals a non-array.
   */
  deepEqual(a, b) {
    if (a === b) return true
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false

    const aIsArray = Array.isArray(a)
    const bIsArray = Array.isArray(b)
    if (aIsArray !== bIsArray) return false

    if (a instanceof Date || b instanceof Date) {
      return a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
    }

    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    for (const k of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false
      if (!this.deepEqual(a[k], b[k])) return false
    }
    return true
  }

  /**
   * Check if a document matches the query (NeDB-compatible semantics).
   * An object query value is treated as an operator object only when every key
   * starts with `$`; otherwise (plain object or array) it is deep-compared, so
   * `{ config: { mode: 'x' } }` or `{ tags: ['a'] }` does not silently match all
   * records. A RegExp query value is matched like `$regex`.
   */
  matchesQuery(doc, query) {
    if (!query || Object.keys(query).length === 0) {
      return true
    }

    for (const [key, value] of Object.entries(query)) {
      if (value !== null && typeof value === 'object' && !(value instanceof RegExp)) {
        const keys = Object.keys(value)
        const isOperatorObject = keys.length > 0 && keys.every((k) => k.startsWith('$'))

        if (isOperatorObject) {
          if (value.$regex && !value.$regex.test(doc[key])) return false
          if (value.$ne !== undefined && doc[key] === value.$ne) return false
          if (value.$in !== undefined && !value.$in.includes(doc[key])) return false
          if (value.$nin !== undefined && value.$nin.includes(doc[key])) return false
          if (value.$gt !== undefined && !(doc[key] > value.$gt)) return false
          if (value.$gte !== undefined && !(doc[key] >= value.$gte)) return false
          if (value.$lt !== undefined && !(doc[key] < value.$lt)) return false
          if (value.$lte !== undefined && !(doc[key] <= value.$lte)) return false
        } else if (!this.deepEqual(doc[key], value)) {
          // Plain object or array query value: deep-compare (NeDB areThingsEqual)
          return false
        }
      } else if (value instanceof RegExp) {
        if (!value.test(doc[key])) return false
      } else if (doc[key] !== value) {
        // Simple equality check
        return false
      }
    }

    return true
  }

  /**
   * Apply update operations to a document
   */
  applyUpdate(doc, update) {
    const newDoc = { ...doc }

    if (update.$set) {
      Object.assign(newDoc, update.$set)
    }

    if (update.$unset) {
      for (const key of Object.keys(update.$unset)) {
        delete newDoc[key]
      }
    }

    if (update.$inc) {
      for (const [key, value] of Object.entries(update.$inc)) {
        newDoc[key] = (newDoc[key] || 0) + value
      }
    }

    // If no operators, treat as direct replacement
    if (!update.$set && !update.$unset && !update.$inc) {
      Object.assign(newDoc, update)
    }

    return newDoc
  }

  /**
   * Check for unique field violations
   */
  async checkUniqueConstraints(data, excludeId = null) {
    if (this.uniqueFields.length === 0) {
      return
    }

    const allDocs = this.readAllDocuments()

    for (const field of this.uniqueFields) {
      if (data[field] !== undefined) {
        const existing = allDocs.find((doc) => doc[field] === data[field] && doc._id !== excludeId)
        if (existing) {
          throw new Error(`Unique constraint violated for field: ${field}`)
        }
      }
    }
  }

  /**
   * Insert a new document
   */
  async insert(data) {
    const id = data._id || this.generateId()
    const doc = {
      ...data,
      _id: id
    }

    // Check unique constraints
    await this.checkUniqueConstraints(doc)

    const allEntries = this.readAllEntries()
    const existing = allEntries.find((entry) => entry.doc && entry.doc._id === id)
    if (existing) {
      throw new Error(`Document with id ${id} already exists`)
    }

    const fileBaseName = this.buildFileBaseName(doc, allEntries)
    const filePath = path.join(this.collectionPath, `${fileBaseName}.json`)

    this.writeAtomic(filePath, doc)
    return doc
  }

  /**
   * Update documents matching the query
   */
  async update(query, update, options = {}) {
    const allEntries = this.readAllEntries()
    const matchingEntries = allEntries.filter((entry) => this.matchesQuery(entry.doc, query))

    if (matchingEntries.length === 0) {
      return 0
    }

    const multi = options.multi === true
    const entriesToUpdate = multi ? matchingEntries : [matchingEntries[0]]
    const reservedNames = new Set()

    for (const entry of entriesToUpdate) {
      const updatedDoc = this.applyUpdate(entry.doc, update)

      // Check unique constraints for updated document
      await this.checkUniqueConstraints(updatedDoc, entry.doc._id)

      const fileBaseName = this.buildFileBaseName(updatedDoc, allEntries, entry.doc._id, reservedNames)
      const targetPath = path.join(this.collectionPath, `${fileBaseName}.json`)
      reservedNames.add(fileBaseName.toLowerCase())

      this.writeAtomic(targetPath, updatedDoc)
      // Only unlink the previous file when it is a genuinely different physical
      // file. On a case-insensitive FS a case-only rename (Login -> login) points
      // at the same file, so unlinking would delete the document we just wrote.
      const pathsDiffer = this.caseSensitive
        ? targetPath !== entry.filePath
        : targetPath.toLowerCase() !== entry.filePath.toLowerCase()
      if (pathsDiffer && fs.existsSync(entry.filePath)) {
        fs.unlinkSync(entry.filePath)
      }
    }

    return entriesToUpdate.length
  }

  /**
   * Find documents matching the query
   */
  async find(query) {
    const allDocs = this.readAllDocuments()
    return allDocs.filter((doc) => this.matchesQuery(doc, query))
  }

  /**
   * Find one document matching the query
   */
  async findOne(query) {
    const allDocs = this.readAllDocuments()
    return allDocs.find((doc) => this.matchesQuery(doc, query)) || null
  }

  /**
   * Remove documents matching the query
   */
  async remove(query, options = {}) {
    const allEntries = this.readAllEntries()
    const matchingEntries = allEntries.filter((entry) => this.matchesQuery(entry.doc, query))

    if (matchingEntries.length === 0) {
      return 0
    }

    const multi = options.multi === true
    const entriesToRemove = multi ? matchingEntries : [matchingEntries[0]]

    for (const entry of entriesToRemove) {
      if (fs.existsSync(entry.filePath)) {
        fs.unlinkSync(entry.filePath)
      }
    }

    return entriesToRemove.length
  }
}

module.exports = FileStore
