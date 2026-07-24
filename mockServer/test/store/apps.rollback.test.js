/**
 * AppsService.create() best-effort rollback test.
 *
 * create() awaits the app insert then the schema insert; if the schema insert
 * fails it must remove the just-inserted app (they live in different collections)
 * and rethrow. We force file mode at a temp dir so nothing touches real data,
 * then swap in a throwing schemaStore and assert the app is rolled back.
 *
 * Uses jest.isolateModules so config/StoreFactory are loaded fresh with the env
 * we set, regardless of any module caching from other test files.
 */

const fs = require('fs')
const os = require('os')
const path = require('path')

describe('AppsService.create() rollback', () => {
  let tmpDir
  let prevMode
  let prevPath

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apps-rollback-'))
    prevMode = process.env.MOCK_DB_MODE
    prevPath = process.env.MOCK_FILE_DB_PATH
    process.env.MOCK_DB_MODE = 'file'
    process.env.MOCK_FILE_DB_PATH = tmpDir
  })

  afterEach(() => {
    if (prevMode === undefined) delete process.env.MOCK_DB_MODE
    else process.env.MOCK_DB_MODE = prevMode
    if (prevPath === undefined) delete process.env.MOCK_FILE_DB_PATH
    else process.env.MOCK_FILE_DB_PATH = prevPath
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {
      /* best-effort cleanup */
    }
  })

  test('removes the inserted app and rethrows when the schema insert fails', async () => {
    let AppsService
    jest.isolateModules(() => {
      AppsService = require('../../src/services/apps').default
    })

    const service = new AppsService()
    // appList is empty in a fresh service, so the generated id falls back to 3.
    const generatedId = 3

    // Real FileStore for apps; throw on schema insert.
    service.schemaStore = {
      insert: jest.fn().mockRejectedValue(new Error('schema write failed'))
    }
    const removeSpy = jest.spyOn(service.store, 'remove')

    await expect(service.create({ name: 'rollback-app' })).rejects.toThrow('schema write failed')

    expect(service.schemaStore.insert).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledWith({ id: generatedId })

    const leftover = await service.store.findOne({ id: generatedId })
    expect(leftover).toBeNull()
  })
})
