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
router.post('/import', upload.array('files', 1), validateImportParams, materialController.createImportTask);

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
 * @api {POST} /api/material/cancel 取消物料导入任务
 * @apiDescription 接收前端取消请求，立即中断正在执行的任务
 * @apiBody {string} taskId 任务ID（必填）
 * @apiSuccess {boolean} success true
 * @apiSuccess {string} message 取消结果描述
 */
router.post('/cancel', materialController.cancelTask);

// 保存物料到数据库
/**
 * @api {POST} /api/material/save 手动保存物料到数据库
 * @apiDescription 接收前端传递的物料数组，批量保存到数据库
 * @apiBody {array} materials 物料数组（必填）
 * @apiBody {string} materials[0].componentName 组件名（必填）
 * @apiBody {string} materials[0].importType 导入类型（url/npm/code，必填）
 * @apiBody {string} materials[0].source 来源（URL/NPM包名/文件名，必填）
 * @apiBody {object} materials[0].content 物料完整内容（必填，即后端返回的finalSchemas项）
 * @apiSuccess {number} savedCount 成功保存的物料数量
 * @apiSuccess {boolean} success true
 */
router.post('/save', materialController.saveMaterials);

// 接口文档
router.get('/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <title>物料管理系统API接口文档</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 20px; }
        h1, h2, h3, h4 { margin-top: 20px; }
        ul { margin: 10px 0; }
        li { margin: 5px 0; }
        code { background-color: #f5f5f5; padding: 2px 4px; border-radius: 2px; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>物料管理系统API接口文档</h1>

      <h2>一、物料导入与任务管理接口（前缀：<code>http://localhost:3001/api/material</code>）</h2>

      <h3>1. 创建物料导入任务（统一入口）</h3>
      <p><strong>请求方式：</strong> POST</p>
      <p><strong>接口路径：</strong> <code>/import</code></p>
      <p><strong>Content-Type：</strong></p>
      <ul>
        <li>url/npm类型：<code>application/json</code></li>
        <li>code类型：<code>multipart/form-data</code></li>
      </ul>
      <p><strong>必填公共参数：</strong></p>
      <ul>
        <li><code>importType</code>：字符串，必选，值为<code>"url"</code>、<code>"code"</code>或<code>"npm"</code></li>
      </ul>
      <p><strong>各类型专属必填参数：</strong></p>
      <ul>
        <li>url类型：<code>url</code>（组件文档URL）、<code>tableSelector</code>（表格CSS选择器）</li>
        <li>code类型：<code>files</code>（单个文件/ZIP，字段名固定）</li>
        <li>npm类型：<code>packageName</code>（NPM包名）、<code>componentName</code>（组件名）</li>
      </ul>
      <p><strong>响应示例：</strong></p>
      <pre>{ "code": 200, "success": true, "message": "任务创建成功", "taskId": "task-123456" }</pre>

      <h3>2. 查询任务状态</h3>
      <p><strong>请求方式：</strong> GET</p>
      <p><strong>接口路径：</strong> <code>/status/:taskId</code></p>
      <p><strong>路径参数：</strong> <code>taskId</code>（创建任务返回的ID，必填）</p>
      <p><strong>响应示例（成功）：</strong></p>
      <pre>{
  "code": 200, "success": true, "taskId": "task-123456",
  "status": "success", "progress": 100,
  "steps": [{"step": "初始化", "status": "success"}],
  "result": { "finalSchemas": [/* 物料JSON */] }
}</pre>

      <h3>3. 保存物料到数据库</h3>
      <p><strong>请求方式：</strong> POST</p>
      <p><strong>接口路径：</strong> <code>/save</code></p>
      <p><strong>Content-Type：</strong> <code>application/json</code></p>
      <p><strong>必填参数（Body）：</strong></p>
      <ul>
        <li><code>materials</code>：物料数组（必填）</li>
        <li><code>materials[].componentName</code>：组件名（必填）</li>
        <li><code>materials[].importType</code>：导入类型（必填）</li>
        <li><code>materials[].source</code>：来源（URL/包名/文件名，必填）</li>
        <li><code>materials[].content</code>：物料完整内容（必填）</li>
      </ul>
      <p><strong>响应示例：</strong></p>
      <pre>{ "code": 200, "success": true, "savedCount": 1, "message": "物料保存成功" }</pre>

      <h3>4. 取消物料导入任务</h3>
      <p><strong>请求方式：</strong> POST</p>
      <p><strong>接口路径：</strong> <code>/cancel</code></p>
      <p><strong>Content-Type：</strong> <code>application/json</code></p>
      <p><strong>必填参数（Body）：</strong></p>
      <ul>
        <li><code>taskId</code>：字符串，必选，创建任务返回的任务ID</li>
      </ul>
      <p><strong>响应示例（成功）：</strong></p>
      <pre>{ "code": 200, "success": true, "message": "已发送取消信号给任务task-123456" }</pre>
      <p><strong>说明：</strong> 接收前端取消请求，立即中断正在执行的任务（如文件分析、LLM转换等），并清理相关资源（如临时文件）</p>

      <h3>5. 获取接口文档（当前接口）</h3>
      <p><strong>请求方式：</strong> GET</p>
      <p><strong>接口路径：</strong> <code>/docs</code></p>
      <p><strong>说明：</strong> 返回当前HTML格式的完整接口说明</p>


      <h2>二、物料基础管理接口（前缀：<code>http://localhost:3001/api/materials</code>）</h2>

      <h3>1. 获取物料列表</h3>
      <p><strong>请求方式：</strong> GET</p>
      <p><strong>接口路径：</strong> <code>/</code></p>
      <p><strong>查询参数：</strong></p>
      <ul>
        <li><code>importType</code>：字符串，可选，导入类型（精确匹配）</li>
        <li><code>componentName</code>：字符串，可选，组件名（精确匹配）</li>
        <li><code>keyword</code>：字符串，可选，内容关键词（模糊匹配）</li>
        <li><code>page</code>：数字，可选，页码（默认1）</li>
        <li><code>limit</code>：数字，可选，每页数量（默认20，1-100）</li>
      </ul>
      <p><strong>响应示例：</strong></p>
      <pre>{
  "code": 200, "success": true,
  "rows": [/* 物料列表 */],
  "totalCount": 10, "currentPage": 1, "pageSize": 20
}</pre>

      <h3>2. 获取去重组件名</h3>
      <p><strong>请求方式：</strong> GET</p>
      <p><strong>接口路径：</strong> <code>/component-names</code></p>
      <p><strong>响应示例：</strong></p>
      <pre>{ "code": 200, "success": true, "componentNames": ["Button", "Input"] }</pre>

      <h3>3. 获取单个物料详情</h3>
      <p><strong>请求方式：</strong> GET</p>
      <p><strong>接口路径：</strong> <code>/:id</code></p>
      <p><strong>路径参数：</strong> <code>id</code>（物料ID，数字，必填）</p>
      <p><strong>响应示例：</strong></p>
      <pre>{ "code": 200, "success": true, "data": { "id": 1, "componentName": "Button", "content": {} } }</pre>

      <h3>4. 更新物料</h3>
      <p><strong>请求方式：</strong> PUT</p>
      <p><strong>接口路径：</strong> <code>/:id</code></p>
      <p><strong>Content-Type：</strong> <code>application/json</code></p>
      <p><strong>路径参数：</strong> <code>id</code>（物料ID，数字，必填）</p>
      <p><strong>必填参数（Body）：</strong> <code>content</code>（物料内容JSON，必填）</p>
      <p><strong>响应示例：</strong></p>
      <pre>{ "code": 200, "success": true, "affectedCount": 1, "message": "更新成功" }</pre>

      <h3>5. 批量删除物料</h3>
      <p><strong>请求方式：</strong> DELETE</p>
      <p><strong>接口路径：</strong> <code>/batch</code></p>
      <p><strong>Content-Type：</strong> <code>application/json</code></p>
      <p><strong>必填参数（Body）：</strong> <code>ids</code>（物料ID数组，数字类型，必填）</p>
      <p><strong>响应示例：</strong></p>
      <pre>{ "code": 200, "success": true, "affectedCount": 2, "message": "成功删除2个物料" }</pre>

      <h3>6. 删除单个物料</h3>
      <p><strong>请求方式：</strong> DELETE</p>
      <p><strong>接口路径：</strong> <code>/:id</code></p>
      <p><strong>路径参数：</strong> <code>id</code>（物料ID，数字，必填）</p>
      <p><strong>响应示例：</strong></p>
      <pre>{ "code": 200, "success": true, "affectedCount": 1, "message": "彻底删除成功" }</pre>
    </body>
    </html>
  `);
});

module.exports = router;