const express = require('express');
const router = express.Router();
const {
  getMaterialById,
  getMaterials,
  updateMaterial,
  softDeleteMaterial,
  deleteMaterial
} = require('../db/dao/materialDao');

/**
 * @api {GET} /api/materials 获取物料列表
 * @apiDescription 分页查询物料，支持按类型、组件名等筛选
 * @apiParam {string} [importType] 可选：导入类型（url/code/npm）
 * @apiParam {string} [componentName] 可选：组件名
 * @apiParam {number} [page=1] 可选：页码（1-∞）
 * @apiParam {number} [limit=20] 可选：每页数量（1-100）
 * @apiSuccess {array} rows 物料列表
 * @apiSuccess {number} count 总数量
 * @apiSuccess {string} message 操作提示
 * @apiSuccess {boolean} success true
 */
router.get('/', async (req, res, next) => {
  try {
    const { importType, componentName, page = 1, limit = 20 } = req.query;
    const query = {};

    // 1. 校验分页参数
    const pageNum = Number(page);
    const limitNum = Number(limit);
    if (isNaN(pageNum) || pageNum < 1) throw new Error('页码必须为正整数');
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) throw new Error('每页数量必须为1-100的整数');

    // 2. 构建查询条件
    if (importType) query.importType = importType;
    if (componentName) query.componentName = componentName;
    query.status = 'active';

    // 3. 执行查询
    const result = await getMaterials(query, pageNum, limitNum);

    // 4. 返回响应（含空数据提示）
    res.json({
      code: 200,
      success: true,
      ...result,
      message: result.rows.length === 0 ? '未查询到符合条件的物料' : '查询成功'
    });
  } catch (error) {
    // 参数错误单独处理
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
 * @apiDescription 更新物料内容或状态
 * @apiParam {number} id 物料ID
 * @apiBody {object} [content] 可选：物料内容（JSON）
 * @apiBody {string} [status] 可选：状态（active/inactive）
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

    const { content, status } = req.body;
    const updates = {};

    // 校验状态合法性
    if (status !== undefined && !['active', 'inactive'].includes(status)) {
      throw new Error('状态必须为 "active" 或 "inactive"');
    }

    if (content !== undefined) updates.content = content;
    if (status !== undefined) updates.status = status;

    // 无更新内容时直接返回
    if (Object.keys(updates).length === 0) {
      return res.json({
        code: 200,
        success: true,
        affectedCount: 0,
        message: '未传入任何更新内容'
      });
    }

    const affectedCount = await updateMaterial(materialId, updates);
    res.json({
      code: 200,
      success: true,
      affectedCount,
      message: '更新成功'
    });
  } catch (error) {
    if (error.message.includes('状态必须为')) {
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
 * @api {DELETE} /api/materials/:id 软删除物料
 * @apiDescription 将物料状态设为inactive（不实际删除数据）
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

    const affectedCount = await softDeleteMaterial(materialId);
    res.json({
      code: 200,
      success: true,
      affectedCount,
      message: affectedCount > 0 ? '软删除成功' : '物料不存在或已删除'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @api {DELETE} /api/materials/:id/force 彻底删除物料
 * @apiDescription 从数据库中彻底删除物料（谨慎使用）
 * @apiParam {number} id 物料ID
 * @apiSuccess {number} affectedCount 受影响的行数
 * @apiSuccess {boolean} success true
 */
router.delete('/:id/force', async (req, res, next) => {
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