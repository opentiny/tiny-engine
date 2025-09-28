const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { validateImportParams } = require('../middlewares/paramsValidator');
const { upload } = require('../controllers/materialController');

/**
 * @api {POST} /api/material/import 创建物料导入任务（统一入口）
 * @apiDescription 支持三种导入途径：URL爬取、源码文件上传、NPM包信息提交
 * @apiParam {string} importType 必选：导入类型（url/code/npm）
 * @apiParam {string} [url] 可选（url类型必填）：组件文档URL（如https://element-plus.org/zh-CN/component/button.html）
 * @apiParam {string} [tableSelector] 可选（url类型必填）：表格CSS选择器（如.vp-table）
 * @apiParam {file} [files] 可选（code类型必填）：单个文件（源码文件或ZIP压缩包，字段名固定为"files"）
 * @apiParam {string} [packageName] 可选（npm类型必填）：NPM包名（如element-plus）
 * @apiParam {string} [componentName] 可选（npm类型必填）：组件名（如button）
 * @apiSuccess {string} code 200
 * @apiSuccess {string} message 任务创建成功
 * @apiSuccess {string} taskId 任务ID（用于查询状态）
 * @apiSuccess {boolean} success true
 */
// 注意：upload.any() 需放在校验前，确保code类型的req.files能被正确解析
router.post('/import', upload.any(), validateImportParams, materialController.createImportTask);

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
 * @api {GET} /api/material/docs 接口文档
 * @apiDescription 三种导入途径的参数说明
 */
router.get('/docs', (req, res) => {
  res.send(`
    <h1>物料导入接口文档</h1>
    <h2>统一导入入口（唯一接口）</h2>
    <p>POST /api/material/import</p>
    <p>Content-Type: 按类型区分（JSON或multipart/form-data）</p>
    <p>支持途径：URL爬取、源码文件上传、NPM包信息提交</p>
    
    <h3>1. 必传公共参数</h3>
    <ul>
      <li>importType: 字符串，必选，值为"url"、"code"或"npm"</li>
    </ul>

    <h3>2. 各类型专属参数</h3>
    <h4>（1）URL爬取（importType="url"）</h4>
    <p>Content-Type: application/json</p>
    <ul>
      <li>url: 字符串，必选，组件文档URL（如https://element-plus.org/zh-CN/component/button.html）</li>
      <li>tableSelector: 字符串，必选，表格CSS选择器（如.vp-table、#api-table）</li>
    </ul>

    <h4>（2）源码文件上传（importType="code"）</h4>
    <p>Content-Type: multipart/form-data</p>
    <ul>
      <li>files: 文件，必选，单个文件（支持源码文件或ZIP压缩包，字段名固定为"files"）</li>
    </ul>

    <h4>（3）NPM包信息提交（importType="npm"）</h4>
    <p>Content-Type: application/json</p>
    <ul>
      <li>packageName: 字符串，必选，NPM包名（如element-plus、vue）</li>
      <li>componentName: 字符串，必选，组件名（如button、input）</li>
    </ul>

    <h3>3. 查询任务状态</h3>
    <p>GET /api/material/status/:taskId</p>
    <p>参数：taskId 任务ID（创建任务时返回）</p>
  `);
});

module.exports = router;