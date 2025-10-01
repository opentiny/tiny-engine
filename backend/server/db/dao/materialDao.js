// backend/server/db/dao/materialDao.js
const { dbReadyPromise } = require('../index'); // 只导入 Promise，不直接读 AppDataSource

// 🌟 关键：等待数据库初始化完成后，再获取仓库（只初始化一次）
let materialRepository;
async function getMaterialRepository() {
  if (!materialRepository) {
    // 等待数据库初始化完成
    await dbReadyPromise;
    // 初始化完成后，从 AppDataSource 获取仓库
    const { AppDataSource } = require('../index');
    // 必须与 MaterialSchema 中的 "name: 'Material'" 一致
    materialRepository = AppDataSource.getRepository('Material');
  }
  return materialRepository;
}

// 以下所有 DAO 方法均改为先等待仓库初始化
/**
 * 保存物料
 */
async function createMaterial(materialData) {
  const repo = await getMaterialRepository(); // 先等待仓库
  const material = repo.create(materialData);
  return await repo.save(material);
}

/**
 * 批量保存物料
 */
async function bulkCreateMaterials(materials) {
  // 1. 等待仓库初始化 + 获取数据源和 sqlDb
  await getMaterialRepository();
  const { AppDataSource, sqlDb } = require('../index'); // 导入 sqlDb
  const fs = require('fs'); // 确保引入 fs 模块
  const { dbPath } = require('../index'); // 若 dbPath 未导出，需先在 db/index.js 导出

  // 2. 显式事务：确保数据写入内存
  const savedMaterials = await AppDataSource.transaction(async (manager) => {
    const result = await manager.save('Material', materials);
    console.log(`🔍 DAO调试：事务提交成功，共保存 ${result.length} 条物料数据`);
    // 事务内验证：立即查询内存中的数据，确认写入成功
    const count = await manager.count('Material', { where: { taskId: materials[0].taskId } });
    console.log(`🔍 DAO调试：内存中物料数量=${count}（应与保存数量一致）`);
    return result;
  });

  // 3. 核心修复：手动导出内存数据并写入文件（绕开 onUpdate）
  try {
    console.log(`🔍 手动持久化：开始导出 sql.js 内存数据`);
    // 导出内存中的数据库（包含所有数据）
    const dbData = sqlDb.export();
    // 验证导出数据有效性（正常应 > 100 字节）
    if (dbData.length < 100) {
      throw new Error(`导出数据无效，长度=${dbData.length} bytes`);
    }
    console.log(`🔍 手动持久化：导出数据长度=${dbData.length} bytes`);
    // 写入文件（覆盖旧文件）
    fs.writeFileSync(dbPath, Buffer.from(dbData));
    // 验证文件大小
    const stats = fs.statSync(dbPath);
    console.log(`✅ 手动持久化成功！文件路径=${dbPath}，大小=${stats.size} bytes`);
  } catch (manualErr) {
    // console.error(`❌ 手动持久化失败：`, manualErr.message);
    // console.error(`❌ 手动持久化错误栈：`, manualErr.stack);
  }

  return savedMaterials;
}

/**
 * 根据ID查询物料
 */
async function getMaterialById(id) {
  const repo = await getMaterialRepository();
  return await repo.findOneBy({ id });
}

/**
 * 根据条件查询物料列表
 */
async function getMaterials(query = {}, page = 1, limit = 20) {
  const repo = await getMaterialRepository();
  const skip = (page - 1) * limit;
  const [rows, count] = await repo.findAndCount({
    where: query,
    skip,
    take: limit,
    order: { createdAt: 'DESC' },
  });
  return { rows, count };
}

/**
 * 更新物料
 */
async function updateMaterial(id, updates) {
  const repo = await getMaterialRepository();
  await repo.update(id, updates);
  return 1;
}

/**
 * 软删除物料
 */
async function softDeleteMaterial(id) {
  return await updateMaterial(id, { status: 'inactive' });
}

/**
 * 彻底删除物料
 */
async function deleteMaterial(id) {
  const repo = await getMaterialRepository();
  await repo.delete(id);
  return 1;
}

module.exports = {
  createMaterial,
  bulkCreateMaterials,
  getMaterialById,
  getMaterials,
  updateMaterial,
  softDeleteMaterial,
  deleteMaterial
};