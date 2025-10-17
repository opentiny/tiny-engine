const express = require('express');
const router = express.Router();
const {
  getMaterialById,
  getMaterials,
  updateMaterial,
  deleteMaterial,
  getDistinctComponentNames,
  batchDeleteMaterials
} = require('../db/dao/materialDao');

/**
 * @api {GET} /api/materials 获取物料列表
 * @apiDescription 分页查询物料，支持：
 * - importType/componentName 精确匹配；
 * - content 字段关键词模糊匹配。
 * @apiParam {string} [importType] 可选：导入类型（url/code/npm）
 * @apiParam {string} [componentName] 可选：组件名（精确匹配）
 * @apiParam {string} [keyword] 可选：内容关键词（模糊匹配物料content中的所有内容）
 * @apiParam {number} [page=1] 可选：页码（1-∞）
 * @apiParam {number} [limit=20] 可选：每页数量（1-100）
 * @apiSuccess {array} rows 物料列表
 * @apiSuccess {number} totalCount 总数量
 * @apiSuccess {number} currentPage 当前页码
 * @apiSuccess {number} pageSize 每页数量
 * @apiSuccess {string} message 操作提示
 * @apiSuccess {boolean} success true
 */
router.get('/', async (req, res, next) => {
  try {
    // 提取所有查询参数
    const { importType, componentName, keyword, page = 1, limit = 20 } = req.query;
    const exactQuery = {};

    // 分页参数校验
    const pageNum = Number(page);
    const limitNum = Number(limit);
    if (isNaN(pageNum) || pageNum < 1) throw new Error('页码必须为正整数');
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) throw new Error('每页数量必须为1-100的整数');

    // 构建精确匹配条件
    if (importType) exactQuery.importType = importType;
    if (componentName) exactQuery.componentName = componentName;
    exactQuery.status = 'active';

    // 执行查询
    const result = await getMaterials(exactQuery, keyword, pageNum, limitNum);

    // 返回响应（新增分页元数据）
    res.json({
      code: 200,
      success: true,
      ...result,
      totalCount: result.count, // 总数量（新字段，与count保持一致）
      currentPage: pageNum,     // 当前页码
      pageSize: limitNum,       // 每页数量
      message: result.rows.length === 0 ? '未查询到符合条件的物料' : '查询成功'
    });
  } catch (error) {
    if (error.message.includes('页码') || error.message.includes('每页数量')) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

/**
 * @api {GET} /api/materials/component-names 获取所有去重的组件名
 * @apiDescription 查询物料表中所有不重复的 `componentName`（仅返回活跃状态物料的组件名）
 * @apiSuccess {array} componentNames 去重后的组件名列表
 * @apiSuccess {boolean} success true
 */
router.get('/component-names', async (req, res, next) => {
  try {
    const componentNames = await getDistinctComponentNames();
    res.json({
      code: 200,
      success: true,
      componentNames,
      message: '查询成功'
    });
  } catch (error) {
    next(error);
  }
});


/**
 * @api {GET} /api/materials/:id 获取单个物料详情
 * @apiDescription 根据ID查询物料详情
 * @apiParam {number} id 物料ID
 * @apiSuccess {object} data 物料详情
 * @apiSuccess {boolean} success true
 */
router.get('/:id', async (req, res, next) => {
  try {
    const materialId = Number(req.params.id);
    if (isNaN(materialId)) {
      return res.status(400).json({
        code: 400,
        message: '物料ID必须为数字',
        success: false
      });
    }

    const material = await getMaterialById(materialId);
    if (!material) {
      return res.status(404).json({
        code: 404,
        message: '物料不存在或已删除',
        success: false
      });
    }

    res.json({
      code: 200,
      success: true,
      data: material,
      message: '查询成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @api {PUT} /api/materials/:id 更新物料
 * @apiDescription 仅更新物料的 `content` 字段（必填）
 * @apiParam {number} id 物料ID
 * @apiBody {object} content 物料内容（JSON 格式，必填）
 * @apiSuccess {number} affectedCount 受影响的行数
 * @apiSuccess {boolean} success true
 */
router.put('/:id', async (req, res, next) => {
  try {
    const materialId = Number(req.params.id);
    if (isNaN(materialId)) {
      return res.status(400).json({
        code: 400,
        message: '物料ID必须为数字',
        success: false
      });
    }

    // 仅从请求体中提取 `content` 字段（其他字段不允许更新）
    const { content } = req.body;
    const updates = {};

    // 校验：必须传入 `content` 才允许更新
    if (content === undefined) {
      return res.json({
        code: 200,
        success: true,
        affectedCount: 0,
        message: '未传入content更新内容'
      });
    }

    updates.content = content; // 仅更新 `content` 字段

    const affectedCount = await updateMaterial(materialId, updates);
    res.json({
      code: 200,
      success: true,
      affectedCount,
      message: '更新成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @api {DELETE} /api/materials/batch 批量彻底删除物料
 * @apiDescription 从数据库中批量彻底删除物料（谨慎使用）
 * @apiBody {number[]} ids 要删除的物料ID数组（必填）
 * @apiSuccess {number} affectedCount 受影响的行数
 * @apiSuccess {boolean} success true
 */
router.delete('/batch', async (req, res, next) => {
  try {
    const { ids } = req.body;

    // 校验1：ids必须是数组且非空
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请传入有效的物料ID数组',
        success: false
      });
    }

    // 校验2：每个ID必须为有效数字
    const invalidIds = ids.filter(id => isNaN(Number(id)));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        code: 400,
        message: `存在无效的物料ID：${invalidIds.join(', ')}，ID必须为数字`,
        success: false
      });
    }

    // 执行批量删除
    const affectedCount = await batchDeleteMaterials(ids);
    res.json({
      code: 200,
      success: true,
      affectedCount,
      message: affectedCount > 0
        ? `成功删除${affectedCount}个物料`
        : '未找到匹配的物料'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @api {DELETE} /api/materials/:id 删除单个物料
 * @apiDescription 从数据库中彻底删除物料
 * @apiParam {number} id 物料ID
 * @apiSuccess {number} affectedCount 受影响的行数
 * @apiSuccess {boolean} success true
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const materialId = Number(req.params.id);
    if (isNaN(materialId)) {
      return res.status(400).json({
        code: 400,
        message: '物料ID必须为数字',
        success: false
      });
    }

    const affectedCount = await deleteMaterial(materialId);
    res.json({
      code: 200,
      success: true,
      affectedCount,
      message: affectedCount > 0 ? '彻底删除成功' : '物料不存在'
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;