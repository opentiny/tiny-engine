const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { validateImportParams } = require('../middlewares/paramsValidator');

/**
 * @api {POST} /api/material/import 创建物料导入任务
 * @apiDescription 支持URL爬取、源码导入、NPM包导入三种途径
 * @apiParam {string} [url] URL爬取途径：组件文档URL
 * @apiParam {string} [componentDir] 源码/NPM途径：组件文件夹路径
 * @apiParam {object} [config] URL途径必填：爬取配置（如选择器）
 * @apiParam {string} [sourceType] 源码/NPM途径必填：code 或 npm
 * @apiParam {string} [outputDir] 可选：物料输出目录（默认./output）
 * @apiParam {string} [schemaLogDir] 可选：Schema日志目录（默认./schema-log）
 * @apiParam {string} [apiLogDir] 可选：API日志目录（默认./raw-api-log）
 * @apiSuccess {string} code 200
 * @apiSuccess {string} message 任务创建成功
 * @apiSuccess {string} taskId 任务ID（用于查询状态）
 * @apiSuccess {boolean} success true
 */
router.post('/import', validateImportParams, materialController.createImportTask);

/**
 * @api {GET} /api/material/status/:taskId 查询任务状态
 * @apiDescription 轮询查询任务进度、结果或错误
 * @apiParam {string} taskId 任务ID
 * @apiSuccess {string} taskId 任务ID
 * @apiSuccess {string} status 任务状态（pending/processing/success/failed）
 * @apiSuccess {number} progress 进度（0-100）
 * @apiSuccess {array} steps 流程步骤详情
 * @apiSuccess {object} [result] 成功结果（status=success时返回）
 * @apiSuccess {object} [error] 错误信息（status=failed时返回）
 * @apiSuccess {boolean} success true
 */
router.get('/status/:taskId', materialController.getTaskStatus);

// 接口文档（简单实现）
router.get('/docs', (req, res) => {
  res.send(`
    <h1>物料导入接口文档</h1>
    <h2>1. 创建导入任务</h2>
    <p>POST /api/material/import</p>
    <p>参数：见代码注释</p>
    <h2>2. 查询任务状态</h2>
    <p>GET /api/material/status/:taskId</p>
  `);
});

module.exports = router;