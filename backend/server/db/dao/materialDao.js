// backend/server/db/dao/materialDao.js
const { dbReadyPromise } = require('../index');
const Material = require('../models/Material');
const { getRepository } = require('typeorm');

let materialRepository;

/**
 * 物料实体的 TypeORM Repository 单例（确保数据库连接后初始化）
 * @returns {Promise<import("typeorm").Repository<Material>>} 
 */
async function getMaterialRepository() {
  if (!materialRepository) {
    await dbReadyPromise;
    const { AppDataSource } = require('../index');
    materialRepository = AppDataSource.getRepository('Material');
  }
  return materialRepository;
}

/**
 * 保存单个物料到数据库
 * @param {Partial<Material>} materialData - 物料数据（包含物料实体的部分/全部属性）
 * @returns {Promise<Material>} 保存后的完整物料实体（含自动生成的 ID 等）
 */
async function createMaterial(materialData) {
  const repo = await getMaterialRepository();
  const material = repo.create(materialData);
  return await repo.save(material);
}

/**
 * 批量保存物料（通过事务保证数据一致性）
 * @param {Partial<Material>[]} materials - 待批量保存的物料数据数组
 * @returns {Promise<Material[]>} 批量保存后的物料实体数组
 */
async function bulkCreateMaterials(materials) {
  // 1. 等待仓库初始化
  await getMaterialRepository();
  const { AppDataSource } = require('../index');

  // 2. 显式事务：确保数据一致性
  const savedMaterials = await AppDataSource.transaction(async (manager) => {
    const result = await manager.save('Material', materials);
    return result;
  });

  return savedMaterials;
}

/**
 * 根据 ID 查询物料详情
 * @param {number} id - 物料 ID
 * @returns {Promise<Material | null>} 物料实体（不存在时返回 null）
 */
async function getMaterialById(id) {
  const repo = await getMaterialRepository();
  return await repo.findOneBy({ id });
}

/**
 * 分页查询物料（支持精确条件 + 模糊关键词）
 * @param {object} exactQuery 精确匹配的条件（如 importType/componentName）
 * @param {string} keyword 模糊匹配的关键词（匹配 content 字段）
 * @param {number} page 页码
 * @param {number} limit 每页数量
 * @returns {Promise<{ rows: Material[], count: number }>}
 */
async function getMaterials(exactQuery, keyword, page, limit) {
  // 等待数据库初始化完成
  await dbReadyPromise;
  const { AppDataSource } = require('../index'); // 获取已初始化的数据源

  // 从已初始化的数据源创建查询构建器
  const queryBuilder = AppDataSource.createQueryBuilder(Material, 'material');
  if (exactQuery && exactQuery.status !== undefined && exactQuery.status !== null) {
    queryBuilder.where('material.status = :status', { status: exactQuery.status });
  }

  // 追加「精确匹配」条件
  if (exactQuery.importType) {
    queryBuilder.andWhere('material.importType = :importType', { importType: exactQuery.importType });
  }
  if (exactQuery.componentName) {
    queryBuilder.andWhere('material.componentName = :componentName', { componentName: exactQuery.componentName });
  }

  // 追加「模糊关键词」条件（对 content 字段转字符串后模糊匹配）
  if (keyword) {
    queryBuilder.andWhere('CAST(material.content AS CHAR) LIKE :keyword', { keyword: `%${keyword}%` });
  }

  // 分页配置
  queryBuilder.skip((page - 1) * limit)
    .take(limit);

  // 执行查询并返回结果
  const [rows, count] = await queryBuilder.getManyAndCount();
  return { rows, count };
}


/**
 * 更新物料（仅支持修改允许的字段，如 content）
 * @param {number} id - 要更新的物料 ID
 * @param {object} updates - 要更新的字段集合（例如：{ content: newContent }）
 * @returns {Promise<number>} 数据库实际受影响的行数
 */
async function updateMaterial(id, updates) {
  const repo = await getMaterialRepository();
  // 执行更新并获取结果（TypeORM 的 UpdateResult 包含 affected 字段）
  const updateResult = await repo.update(id, updates);
  // 返回实际受影响的行数
  return updateResult.affected;
}

/**
 * 彻底删除物料（从数据库物理删除）
 * @param {number} id - 要彻底删除的物料 ID
 * @returns {Promise<number>} 受影响的行数（成功时固定返回 1）
 */
async function deleteMaterial(id) {
  const repo = await getMaterialRepository();
  const res = await repo.delete(id);
  return res.affected || 0;
}

/**
 * 批量彻底删除物料（从数据库物理删除）
 * @param {number[]} ids - 要彻底删除的物料ID数组
 * @returns {Promise<number>} 数据库实际受影响的行数
 */
async function batchDeleteMaterials(ids) {
  const repo = await getMaterialRepository();
  const deleteResult = await repo.delete(ids);
  return deleteResult.affected;
}

/**
 * 查询所有去重的 componentName（仅活跃状态物料）
 * @returns {Promise<string[]>} 去重后的组件名数组
 */
async function getDistinctComponentNames() {
  // 确保数据库已初始化
  await dbReadyPromise;
  const { AppDataSource } = require('../index');

  // 使用 QueryBuilder 执行「去重查询」
  const rawResults = await AppDataSource.createQueryBuilder(Material, 'material')
    .select('material.componentName')
    .distinct(true)
    .where('material.status = :status', { status: 'active' })
    .getRawMany();

  return rawResults.map(item => item.material_componentName);
}


module.exports = {
  createMaterial,
  bulkCreateMaterials,
  getMaterialById,
  getMaterials,
  updateMaterial,
  deleteMaterial,
  batchDeleteMaterials,
  getDistinctComponentNames
};