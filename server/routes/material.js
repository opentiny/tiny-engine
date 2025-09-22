const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { validateImportParams, validateFileImportParams } = require('../middlewares/paramsValidator');
const { upload } = require('../controllers/materialController');

/**
 * @api {POST} /api/material/import 创建物料导入任务（仅支持URL爬取）
 * @apiDescription 仅支持URL爬取一种途径（已移除本地目录导入）
 * @apiParam {string} url URL爬取途径：组件文档URL（必填）
 * @apiParam {object} config URL途径必填：爬取配置（如选择器）
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

/**
 * @api {POST} /api/material/import/file 创建物料导入任务（文件上传）
 * @apiDescription 支持通过文件上传导入组件源码或NPM包
 * @apiParam {file} files 必选：上传的文件列表（支持多文件，字段名固定为"files"）
 * @apiParam {string} sourceType 必选：文件类型（code 或 npm）
 * @apiSuccess {string} code 200
 * @apiSuccess {string} message 任务创建成功
 * @apiSuccess {string} taskId 任务ID（用于查询状态）
 * @apiSuccess {boolean} success true
 */
router.post(
  '/import/file', 
  upload.array('files'),    // 先处理文件
  validateFileImportParams, // 再校验参数
  materialController.createFileImportTask
);

// 接口文档（更新支持的途径）
router.get('/docs', (req, res) => {
  res.send(`
    <h1>物料导入接口文档</h1>
    <h2>1. URL爬取导入任务</h2>
    <p>POST /api/material/import</p>
    <p>Content-Type: application/json</p>
    <p>支持途径：仅URL爬取</p>
    <p>参数：</p>
    <ul>
      <li>url: 必选，URL爬取途径的文档地址</li>
      <li>config: 必选，URL爬取的解析配置（如选择器规则）</li>
    </ul>

    <h2>2. 文件上传导入任务</h2>
    <p>POST /api/material/import/file</p>
    <p>Content-Type: multipart/form-data</p>
    <p>支持途径：直接上传组件文件（源码/NPM包）</p>
    <p>参数：</p>
    <ul>
      <li>files: 必选，上传的文件列表（支持多文件，字段名固定为"files"）</li>
      <li>sourceType: 必选，文件类型（code 或 npm）</li>
    </ul>

    <h2>3. 查询任务状态</h2>
    <p>GET /api/material/status/:taskId</p>
    <p>参数：taskId 任务ID（创建任务时返回）</p>
  `);
});

module.exports = router;
