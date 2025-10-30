const { extractApiFromUrl } = require('../../src/api-generation/web-table-based-api-generator');
const {
  generateComponentApiFromUploadedSource,
  generateComponentApiFromNpmPackage
} = require('../../src/api-generation/file-based-api-generator');
const { batchConvertToTinyEngineSchema } = require('../../src/schema-conversion/convertor');
const { postProcessSchemas } = require('../../src/post-processing/post-process-schemas');
const { saveApiArrayToFiles } = require('../../src/schema-conversion/cli');
const { createTask, updateTask, getTask, TASK_STATUS } = require('../utils/taskManager');
const { bulkCreateMaterials } = require('../db/dao/materialDao');
const { dbReadyPromise } = require('../db/index');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// 配置multer临时存储（仅内存存储）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// 维护活跃任务的可中断资源
const activeTaskResources = new Map(); // key: taskId, value: { abortController, ... }

// 验证数据库是否初始化完成
dbReadyPromise.then(() => {
  console.log('✅ 数据库已初始化完成');
}).catch(err => {
  console.error('❌ 数据库初始化失败:', err.message);
});

/**
 * 获取有效的默认路径
 */
function getValidDefaultPath(envKey, fallback) {
  const rawPath = process.env[envKey] || fallback;
  const absolutePath = path.resolve(__dirname, '../../', rawPath);
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
    console.log(`📁 自动创建默认目录：${absolutePath}`);
  }
  return absolutePath;
}

/**
 * 统一导入任务创建入口（合并URL爬取、源码上传、NPM包信息提交）
 * @param {Request} req - 含参数（所有类型）+ 文件（仅code类型）
 * @param {Response} res 
 * @param {NextFunction} next 
 */
async function createImportTask(req, res, next) {
  try {
    // 1. 必传参数：importType（区分导入类型）
    const { importType } = req.body;
    if (!importType || !['url', 'code', 'npm'].includes(importType)) {
      return res.status(400).json({
        code: 400,
        message: 'importType必须为"url"（URL爬取）、"code"（源码文件）、"npm"（NPM包）',
        success: false
      });
    }

    // 2. 基础参数（所有类型共用）
    const defaultPaths = {
      outputDir: getValidDefaultPath('DEFAULT_OUTPUT_DIR', 'output-log'),
      schemaLogDir: getValidDefaultPath('DEFAULT_SCHEMA_LOG_DIR', 'schema-log'),
      apiLogDir: getValidDefaultPath('DEFAULT_API_LOG_DIR', 'raw-api-log')
    };

    // 3. 按导入类型校验参数并构造任务参数
    let taskParams;
    switch (importType) {
      // 类型1：URL爬取
      case 'url': {
        const { url, tableSelector } = req.body;
        // 校验URL和选择器
        if (!url || typeof url !== 'string' || url.trim() === '') {
          return res.status(400).json({
            code: 400,
            message: 'url类型必须提供有效的URL地址',
            success: false
          });
        }
        if (!tableSelector || typeof tableSelector !== 'string' || tableSelector.trim() === '') {
          return res.status(400).json({
            code: 400,
            message: 'url类型必须提供有效的tableSelector（CSS选择器）',
            success: false
          });
        }
        // 构造参数
        taskParams = {
          ...defaultPaths,
          importType: 'url',
          url: url.trim(),
          tableSelector: tableSelector.trim()
        };
        break;
      }

      // 类型2：源码文件上传（单个文件或ZIP压缩包）
      case 'code': {
        // 校验文件（必传，且仅单个）
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            code: 400,
            message: 'code类型必须上传至少一个文件（单个源码文件或ZIP压缩包）',
            success: false
          });
        }
        if (req.files.length > 1) {
          return res.status(400).json({
            code: 400,
            message: 'code类型仅支持上传单个文件（单个源码文件或ZIP压缩包）',
            success: false
          });
        }
        const file = req.files[0];
        // 构造参数（适配generateComponentApiFromUploadedSource）
        taskParams = {
          ...defaultPaths,
          importType: 'code',
          uploadFile: {
            data: file.buffer,       // 二进制数据
            fileName: file.originalname, // 原始文件名
            fileType: file.originalname.endsWith('.zip') ? 'zip' : 'single' // 自动判断文件类型
          }
        };
        break;
      }

      // 类型3：NPM包信息提交（无需上传文件）
      case 'npm': {
        const { packageName, componentName } = req.body;
        // 校验包名和组件名
        if (!packageName || typeof packageName !== 'string' || packageName.trim() === '') {
          return res.status(400).json({
            code: 400,
            message: 'npm类型必须提供有效的packageName（如"element-plus"）',
            success: false
          });
        }
        if (!componentName || typeof componentName !== 'string' || componentName.trim() === '') {
          return res.status(400).json({
            code: 400,
            message: 'npm类型必须提供有效的componentName（如"button"）',
            success: false
          });
        }
        // 构造参数（适配generateComponentApiFromNpmPackage）
        taskParams = {
          ...defaultPaths,
          importType: 'npm',
          npmInfo: {
            packageName: packageName.trim(),
            componentName: componentName.trim()
          }
        };
        break;
      }
    }

    // 4. 创建任务并初始化状态
    const taskId = createTask(taskParams);
    updateTask(taskId, {
      status: TASK_STATUS.PROCESSING,
      step: {
        name: 'init',
        message: `任务创建成功（类型：${importType}），开始处理`
      }
    });

    // 5. 异步执行核心流程（添加数据库存储逻辑）
    processImportTask(taskId, taskParams)
      .catch(err => {
        console.error(`❌ [任务${taskId}] 核心流程失败:`, err.message);
      });

    // 6. 返回任务ID给前端
    res.status(200).json({
      code: 200,
      message: `${importType}类型任务创建成功，可通过taskId查询进度`,
      taskId,
      success: true
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 核心流程执行函数（适配三种导入类型）
 * @param {string} taskId 
 * @param {object} params 
 */
async function processImportTask(taskId, params) {
  const {
    importType,
    // url类型参数
    url,
    tableSelector,
    // code类型参数
    uploadFile,
    // npm类型参数
    npmInfo,
    // 共用路径参数
    outputDir,
    schemaLogDir,
    apiLogDir
  } = params;
  let apiArray;

  // 创建AbortController用于中断任务
  const abortController = new AbortController();
  const signal = abortController.signal;
  // 存储可中断资源
  activeTaskResources.set(taskId, { abortController });

  try {
    // 监听中断信号
    signal.addEventListener('abort', () => {
      console.log(`[任务${taskId}] 收到中断信号，准备停止执行`);
    });

    // 1. 按导入类型生成API JSON
    switch (importType) {
      // 类型1：URL爬取
      case 'url': {
        updateTask(taskId, {
          progress: 20,
          step: {
            name: 'extractApi',
            message: `开始爬取URL：${url}`
          }
        });
        const u = new URL(url);
        if (!['http:', 'https:'].includes(u.protocol)) {
          throw new Error(`不支持的URL协议：${u.protocol}`);
        }
        apiArray = await extractApiFromUrl(url, tableSelector, { signal });
        updateTask(taskId, {
          progress: 40,
          step: {
            name: 'extractApi',
            message: `URL爬取完成，共识别${apiArray.length}个组件`
          }
        });
        break;
      }

      // 类型2：源码文件解析
      case 'code': {
        updateTask(taskId, {
          progress: 20,
          step: {
            name: 'generateApiFromFile',
            message: `开始处理${uploadFile.fileType}文件：${uploadFile.fileName}`
          }
        });
        // 构造uploadData（严格适配generateComponentApiFromUploadedSource）
        const uploadData = {
          data: uploadFile.data,
          fileName: uploadFile.fileName,
          type: uploadFile.fileType
        };
        apiArray = await generateComponentApiFromUploadedSource(uploadData, { signal });
        updateTask(taskId, {
          progress: 40,
          step: {
            name: 'generateApiFromFile',
            message: `源码文件解析完成，共识别${apiArray.length}个组件`
          }
        });
        break;
      }

      // 类型3：NPM包解析
      case 'npm': {
        const { packageName, componentName } = npmInfo;
        updateTask(taskId, {
          progress: 20,
          step: {
            name: 'generateApiFromNpm',
            message: `开始处理NPM包：${packageName}，组件：${componentName}`
          }
        });
        // 直接传递包名和组件名（适配generateComponentApiFromNpmPackage）
        apiArray = await generateComponentApiFromNpmPackage(packageName, componentName, { signal });
        updateTask(taskId, {
          progress: 40,
          step: {
            name: 'generateApiFromNpm',
            message: `NPM包解析完成，共识别${apiArray.length}个组件`
          }
        });
        break;
      }
    }

    // 监听中断信号
    if (signal.aborted) throw new Error('任务被用户取消');
    // 2. 校验API数组有效性
    if (!Array.isArray(apiArray) || apiArray.length === 0) {
      throw new Error('生成的API数组为空或格式错误');
    }

    // 监听中断信号
    if (signal.aborted) throw new Error('任务被用户取消');
    // 3. 保存API JSON（共用逻辑）
    const saveResult = await saveApiArrayToFiles(apiArray, apiLogDir);

    // 监听中断信号
    if (signal.aborted) throw new Error('任务被用户取消');
    // 4. 转换为TinyEngine物料（共用逻辑）
    updateTask(taskId, {
      progress: 60,
      step: {
        name: 'convertSchema',
        message: '开始转换组件物料JSON（调用大模型）'
      }
    });

    if (signal.aborted) throw new Error('任务被用户取消');

    const conversionResults = await batchConvertToTinyEngineSchema(
      apiArray,
      process.env.OPENAI_MODEL,
      true, // 保存Schema
      5, // 并发数
      schemaLogDir,
      { signal }
    );

    if (signal.aborted) throw new Error('任务被用户取消');

    updateTask(taskId, {
      progress: 85,
      step: {
        name: 'convertSchema',
        message: '物料JSON转换完成，开始后续处理'
      }
    });

    // 5. 物料后续处理（共用逻辑）
    const finalResults = await postProcessSchemas(conversionResults, outputDir, { signal });

    // 过滤数组，只提取每个项的schema字段
    const schemaOnlyResults = finalResults.map(item => {
      // 确保item存在且包含schema字段，避免解构报错
      if (item && item.schema) {
        return item.schema;
      }
      return null;
    }).filter(Boolean);

    if (signal.aborted) throw new Error('任务被用户取消');

    // 6. 更新任务状态
    updateTask(taskId, {
      status: TASK_STATUS.SUCCESS,
      progress: 100,
      step: {
        name: 'finish',
        message: '组件物料处理完成'
      },
      result: {
        totalComponents: apiArray.length,
        successCount: conversionResults.filter(r => r.success).length,
        failCount: conversionResults.filter(r => !r.success).length,
        outputDir: path.resolve(outputDir),
        finalSchemas: schemaOnlyResults // 最终物料JSON数组
      }
    });

    return schemaOnlyResults;
  } catch (error) {
    if (error.message === '任务被用户取消') {
      updateTask(taskId, {
        status: TASK_STATUS.FAILED,
        progress: 100,
        step: { name: 'cancelled', message: '任务已被用户取消' },
        error: { message: '任务被用户取消' }
      });
    } else {
      console.error(`[任务${taskId}] 执行失败：`, error.message, '堆栈：', error.stack);
      try {
        // 更新任务状态
        updateTask(taskId, {
          status: TASK_STATUS.FAILED,
          progress: 100,
          step: {
            name: 'error',
            message: `流程失败：${error.message || '未知错误'}`
          },
          error: {
            message: error.message || '未知错误',
            stack: process.env.NODE_ENV === 'development' ? error.stack : ''
          }
        });
      } catch (updateError) {
        console.error('更新任务状态失败:', updateError);
      }
    }
  } finally {
    // 任务结束（成功/失败/取消）时清理资源
    activeTaskResources.delete(taskId);
  }
}

/**
 * 查询任务状态
 */
function getTaskStatus(req, res, next) {
  try {
    const { taskId } = req.params;
    const task = getTask(taskId);

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: `任务${taskId}不存在或已过期`,
        success: false
      });
    }

    res.status(200).json({ code: 200, success: true, ...task });
  } catch (error) {
    next(error);
  }
}

/**
 * 接收前端取消请求，中断正在执行的任务
 */
async function cancelTask(req, res, next) {
  try {
    const { taskId } = req.body;
    if (!taskId) {
      return res.status(400).json({
        code: 400,
        message: 'taskId为必填参数',
        success: false
      });
    }

    // 1. 检查任务是否存在
    const task = getTask(taskId);
    if (!task) {
      return res.status(404).json({
        code: 404,
        message: `任务${taskId}不存在或已结束`,
        success: false
      });
    }

    // 2. 检查任务是否在执行中
    if (task.status !== TASK_STATUS.PROCESSING) {
      return res.status(200).json({
        code: 200,
        message: `任务${taskId}当前状态：${task.status}，无需取消`,
        success: true
      });
    }

    // 3. 中断任务
    const taskResources = activeTaskResources.get(taskId);
    if (taskResources?.abortController) {
      taskResources.abortController.abort(); // 触发中断
      updateTask(taskId, {
        progress: 100,
        step: { name: 'cancelling', message: '正在取消任务...' }
      });
    }

    res.status(200).json({
      code: 200,
      message: `已发送取消信号给任务${taskId}`,
      success: true
    });

  } catch (error) {
    next(error);
  }
}

/**
 * 保存物料到数据库
 * @param {Request} req - 前端传递的物料数组（req.body.materials）
 * @param {Response} res - 返回保存结果
 * @param {NextFunction} next - 错误传递
 */
async function saveMaterials(req, res, next) {
  try {
    // 1. 等待数据库初始化完成（确保DAO可用）
    await dbReadyPromise;

    // 2. 提取并校验前端传递的物料数组
    const { materials } = req.body;
    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: '请传递有效的物料数组（非空数组）'
      });
    }

    // 3. 校验物料数组中每个项的必填字段
    const validMaterials = [];
    for (const mat of materials) {
      // 必填字段校验：componentName、importType、content 必须存在
      if (!mat.componentName || !mat.importType || !mat.content) {
        console.warn(`⚠️ 跳过无效物料（缺少必填字段）：${JSON.stringify(mat)}`);
        continue;
      }
      // 格式化物料数据（适配Material实体字段）
      validMaterials.push({
        taskId: mat.taskId || 'manual-save', // 手动保存时可自定义taskId
        importType: mat.importType, // 前端传递的导入类型（url/npm/code）
        source: mat.source || 'unknown', // 前端传递的来源（URL/NPM包名/文件名）
        componentName: mat.componentName, // 前端传递的组件名
        chineseName: mat.chineseName || '', // 前端传递的中文名称（可选）
        content: mat.content, // 前端传递的完整物料内容（后端生成的finalSchemas项）
        status: 'active', // 固定为活跃状态
        createdAt: new Date(), // 创建时间
        updatedAt: new Date() // 更新时间
      });
    }

    // 4. 无有效物料时返回提示
    if (validMaterials.length === 0) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: '所有物料均缺少必填字段（componentName/importType/content）'
      });
    }

    // 5. 调用DAO批量保存到数据库
    const savedMaterials = await bulkCreateMaterials(validMaterials);

    // 6. 返回成功结果
    res.status(200).json({
      code: 200,
      success: true,
      message: `成功保存${savedMaterials.length}个物料到数据库`,
      savedCount: savedMaterials.length, // 成功保存的数量
      savedIds: savedMaterials.map(mat => mat.id) // 返回保存后的物料ID（可选）
    });
  } catch (error) {
    console.error(`❌ 手动保存物料失败:`, error.message);
    next(error); // 异常交给全局错误处理
  }
}

module.exports = {
  createImportTask,
  getTaskStatus,
  saveMaterials,
  cancelTask,
  upload
};