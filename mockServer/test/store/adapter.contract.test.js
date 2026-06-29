/**
 * Adapter contract tests — run the SAME assertions against BOTH NedbStore and
 * FileStore to lock in behavioural parity. These directly cover:
 *   - default `multi:false` for update/remove (matches NeDB semantics)
 *   - update/remove return a number (the StoreAdapter contract)
 *   - compound query operators evaluated independently ({ $gte, $lte }, ...)
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const NedbStore = require('../../src/store/NedbStore')
const FileStore = require('../../src/store/FileStore')

const INDEX_OPTS = { indexes: [{ fieldName: '_id', unique: true }] }

// Each adapter is constructed fresh in beforeEach for isolation. Both are built
// in a per-test temp directory so nothing touches the real mockServer/data or
// src/database files, and no MOCK_DB_MODE env is required.
const createdDirs = []
const adapterFactories = [
  [
    'NedbStore',
    () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contract-nedb-'))
      createdDirs.push(dir)
      return new NedbStore({ filename: path.join(dir, 'contract.db'), ...INDEX_OPTS })
    }
  ],
  [
    'FileStore',
    () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contract-file-'))
      createdDirs.push(dir)
      return new FileStore('things', dir, { ...INDEX_OPTS, namingFields: ['name'] })
    }
  ]
]

afterAll(() => {
  for (const dir of createdDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {
      /* best-effort cleanup */
    }
  }
})

describe.each(adapterFactories)('%s honours the StoreAdapter contract', (_name, factory) => {
  let store

  beforeEach(() => {
    store = factory()
  })

  const seedGroup = async () => {
    await store.insert({ _id: 'a', name: 'alpha', group: 'g' })
    await store.insert({ _id: 'b', name: 'beta', group: 'g' })
    await store.insert({ _id: 'c', name: 'gamma', group: 'g' })
  }

  test('insert returns the document with its _id', async () => {
    const doc = await store.insert({ _id: 'a', name: 'alpha' })
    expect(doc._id).toBe('a')
  })

  test('findOne / find read back inserted docs', async () => {
    await store.insert({ _id: 'a', name: 'alpha' })
    const one = await store.findOne({ _id: 'a' })
    expect(one && one.name).toBe('alpha')
    const all = await store.find({})
    expect(all).toHaveLength(1)
  })

  test('unique _id constraint rejects a duplicate insert', async () => {
    await store.insert({ _id: 'a', name: 'alpha' })
    await expect(store.insert({ _id: 'a', name: 'alpha-2' })).rejects.toBeDefined()
  })

  test('update defaults to a single record and returns a number count', async () => {
    await seedGroup()
    const affected = await store.update({ group: 'g' }, { $set: { tagged: true } })
    expect(affected).toBe(1)
    expect(typeof affected).toBe('number')
    const tagged = await store.find({ tagged: true })
    expect(tagged).toHaveLength(1)
  })

  test('update with { multi: true } updates all matches and returns the count', async () => {
    await seedGroup()
    const affected = await store.update({ group: 'g' }, { $set: { tagged: true } }, { multi: true })
    expect(affected).toBe(3)
    const tagged = await store.find({ tagged: true })
    expect(tagged).toHaveLength(3)
  })

  test('remove defaults to a single record and returns a number count', async () => {
    await seedGroup()
    const removed = await store.remove({ group: 'g' })
    expect(removed).toBe(1)
    expect(typeof removed).toBe('number')
    const remaining = await store.find({ group: 'g' })
    expect(remaining).toHaveLength(2)
  })

  test('remove with { multi: true } removes all matches', async () => {
    await seedGroup()
    const removed = await store.remove({ group: 'g' }, { multi: true })
    expect(removed).toBe(3)
    const remaining = await store.find({ group: 'g' })
    expect(remaining).toHaveLength(0)
  })

  test('compound query { $gte, $lte } evaluates every operator on a field', async () => {
    await store.insert({ _id: 'p1', age: 10 })
    await store.insert({ _id: 'p2', age: 20 })
    await store.insert({ _id: 'p3', age: 40 })
    const matches = await store.find({ age: { $gte: 15, $lte: 30 } })
    expect(matches).toHaveLength(1)
    expect(matches[0]._id).toBe('p2')
  })

  test('single operators $ne / $in / $nin / $regex behave consistently', async () => {
    await store.insert({ _id: 'p1', name: 'foo' })
    await store.insert({ _id: 'p2', name: 'bar' })
    await store.insert({ _id: 'p3', name: 'baz' })

    expect(await store.find({ _id: { $ne: 'p1' } })).toHaveLength(2)
    expect(await store.find({ _id: { $in: ['p1', 'p2'] } })).toHaveLength(2)
    expect(await store.find({ _id: { $nin: ['p1'] } })).toHaveLength(2)
    expect(await store.find({ name: { $regex: /^ba/ } })).toHaveLength(2)
  })

  test('plain object query value deep-compares instead of matching all', async () => {
    await store.insert({ _id: 'o1', config: { mode: 'x', n: 1 } })
    await store.insert({ _id: 'o2', config: { mode: 'y', n: 2 } })
    await store.insert({ _id: 'o3', config: { mode: 'x', n: 3 } })

    const matches = await store.find({ config: { mode: 'x', n: 1 } })
    expect(matches).toHaveLength(1)
    expect(matches[0]._id).toBe('o1')

    // a plain object that matches no record must return none — not everything
    expect(await store.find({ config: { mode: 'z' } })).toHaveLength(0)
  })

  test('array query value deep-compares instead of matching all', async () => {
    await store.insert({ _id: 'a1', tags: ['red', 'blue'] })
    await store.insert({ _id: 'a2', tags: ['green'] })

    const matches = await store.find({ tags: ['red', 'blue'] })
    expect(matches).toHaveLength(1)
    expect(matches[0]._id).toBe('a1')

    expect(await store.find({ tags: ['purple'] })).toHaveLength(0)
  })

  test('updating a naming field to a case-only variant keeps the document', async () => {
    await store.insert({ _id: 'login', name: 'Login' })
    const affected = await store.update({ _id: 'login' }, { $set: { name: 'login' } })
    expect(affected).toBe(1)
    // The document must still exist and read back with the updated value.
    // Regression guard: on a case-insensitive filesystem (macOS/Windows default)
    // a case-only rename used to make FileStore unlink the just-written file.
    const doc = await store.findOne({ _id: 'login' })
    expect(doc).not.toBeNull()
    expect(doc.name).toBe('login')
    expect(await store.find({})).toHaveLength(1)
  })
})
