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
    this.uniqueFields = options.uniqueFields || []
    this.lockMap = new Map() // Simple in-memory lock for file operations

    // Ensure collection directory exists
    this.ensureDirectory()
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
   * Generate a unique ID similar to NeDB's format
   */
  generateId() {
    return crypto.randomBytes(8).toString('hex')
  }

  /**
   * Get file path for a document by ID
   */
  getFilePath(id) {
    return path.join(this.collectionPath, `${id}.json`)
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

  /**
   * Read a single document from file
   */
  readDocument(id) {
    const filePath = this.getFilePath(id)
    if (!fs.existsSync(filePath)) {
      return null
    }
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      console.error(`Error reading document ${id}:`, error)
      return null
    }
  }

  /**
   * Read all documents in the collection
   */
  readAllDocuments() {
    if (!fs.existsSync(this.collectionPath)) {
      return []
    }
    const files = fs.readdirSync(this.collectionPath)
    const documents = []

    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('.tmp.')) {
        const id = file.replace('.json', '')
        const doc = this.readDocument(id)
     if (doc) {
        documents.push(doc)
        }
      }
    }

    return documents
  }

  /**
   * Check if a document matches the query
   */
  matchesQuery(doc, query) {
    if (!query || Object.keys(query).length === 0) {
      return true
    }

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'object' && value !== null) {
     // Handle special operators
        if (value.$regex) {
          const regex = value.$regex
          if (!regex.test(doc[key])) {
            return false
          }
        } else if (value.$ne !== undefined) {
        if (doc[key] === value.$ne) {
          return false
          }
        } else if (value.$in !== undefined) {
          if (!value.$in.includes(doc[key])) {
          return false
          }
        } else if (value.$nin !== undefined) {
        if (value.$nin.includes(doc[key])) {
         return false
          }
        } else if (value.$gt !== undefined) {
          if (!(doc[key] > value.$gt)) {
        return false
          }
        } else if (value.$gte !== undefined) {
       if (!(doc[key] >= value.$gte)) {
       return false
        }
        } else if (value.$lt !== undefined) {
          if (!(doc[key] < value.$lt)) {
      return false
          }
      } else if (value.$lte !== undefined) {
          if (!(doc[key] <= value.$lte)) {
          return false
          }
        }
      } else {
        // Simple equality check
        if (doc[key] !== value) {
          return false
        }
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
        const existing = allDocs.find(
          doc => doc[field] === data[field] && doc._id !== excludeId
        )
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

    const filePath = this.getFilePath(id)
    if (fs.existsSync(filePath)) {
      throw new Error(`Document with id ${id} already exists`)
    }

    this.writeAtomic(filePath, doc)
    return doc
  }

  /**
   * Update documents matching the query
   */
  async update(query, update, options = {}) {
    const allDocs = this.readAllDocuments()
    const matchingDocs = allDocs.filter(doc => this.matchesQuery(doc, query))

    if (matchingDocs.length === 0) {
      return 0
    }

    const multi = options.multi !== false
    const docsToUpdate = multi ? matchingDocs : [matchingDocs[0]]

    for (const doc of docsToUpdate) {
   const updatedDoc = this.applyUpdate(doc, update)

      // Check unique constraints for updated document
      await this.checkUniqueConstraints(updatedDoc, doc._id)

      const filePath = this.getFilePath(doc._id)
      this.writeAtomic(filePath, updatedDoc)
    }

    return docsToUpdate.length
  }

  /**
   * Find documents matching the query
   */
  async find(query) {
    const allDocs = this.readAllDocuments()
    return allDocs.filter(doc => this.matchesQuery(doc, query))
  }

  /**
   * Find one document matching the query
   */
  async findOne(query) {
    const allDocs = this.readAllDocuments()
    return allDocs.find(doc => this.matchesQuery(doc, query)) || null
  }

  /**
   * Remove documents matching the query
   */
  async remove(query, options = {}) {
    const allDocs = this.readAllDocuments()
    const matchingDocs = allDocs.filter(doc => this.matchesQuery(doc, query))

    if (matchingDocs.length === 0) {
      return 0
    }

    const multi = options.multi !== false
    const docsToRemove = multi ? matchingDocs : [matchingDocs[0]]

    for (const doc of docsToRemove) {
      const filePath = this.getFilePath(doc._id)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    return docsToRemove.length
  }
}

module.exports = FileStore
