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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB上限
});

// 验证数据库是否初始化完成
dbReadyPromise.then(() => {
  console.log('✅ 数据库已初始化完成，DAO 方法可正常调用');
}).catch(err => {
  console.error('❌ 数据库初始化失败（DAO 方法不可用）:', err.message);
});

/**
 * 获取有效的默认路径（工具函数，不变）
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
      .then(async (schemaOnlyResults) => {
        try {
          // 数据库写入逻辑包裹在独立 try/catch 中
          if (Array.isArray(schemaOnlyResults) && schemaOnlyResults.length > 0) {
            // 1. 修复 source 字段的变量作用域问题（之前提到的隐患）
            let source;
            if (importType === 'url') {
              source = req.body.url?.trim(); // 直接从 req.body 取，避免作用域问题
            } else if (importType === 'npm') {
              source = req.body.packageName?.trim();
            } else if (importType === 'code' && req.files?.length > 0) {
              source = req.files[0].originalname;
            }

            // 2. 构造物料数据
            const materials = schemaOnlyResults.map((schema, index) => ({
              taskId,
              importType,
              source: source || 'unknown',
              // 组件名：优先从 schema 中取，若没有则用索引+默认名
              componentName: schema.name?.zh_CN || schema.component || `Component-${index + 1}`,
              content: schema, // 直接将处理后的 schema 作为 content 存入
              status: 'active'
            }));

            // 3. 批量写入数据库
            await bulkCreateMaterials(materials);
            console.log(`✅ [任务${taskId}] 物料已保存到数据库，共${materials.length}条`);
          } else {
            console.log(`ℹ️ [任务${taskId}] 无有效物料数据，跳过数据库写入`);
          }
        } catch (dbError) {
          // 👇 新增：打印数据库写入失败的错误
          console.error(`❌ [任务${taskId}] 数据库写入失败:`, dbError.message);
          console.error(`❌ [任务${taskId}] 数据库错误堆栈:`, dbError.stack);
        }
      })
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

  try {
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
        apiArray = await extractApiFromUrl(url, tableSelector);
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
        apiArray = await generateComponentApiFromUploadedSource(uploadData);
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
        apiArray = await generateComponentApiFromNpmPackage(packageName, componentName);
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

    // 2. 校验API数组有效性
    if (!Array.isArray(apiArray) || apiArray.length === 0) {
      throw new Error('生成的API数组为空或格式错误');
    }

    // 3. 保存API JSON（共用逻辑）
    const saveResult = await saveApiArrayToFiles(apiArray, apiLogDir);

    // 4. 转换为TinyEngine物料（共用逻辑）
    updateTask(taskId, {
      progress: 60,
      step: {
        name: 'convertSchema',
        message: '开始转换组件物料JSON（调用大模型）'
      }
    });
    const conversionResults = await batchConvertToTinyEngineSchema(
      apiArray,
      process.env.OPENAI_MODEL,
      true, // 保存Schema
      5, // 并发数
      schemaLogDir
    );
    updateTask(taskId, {
      progress: 85,
      step: {
        name: 'convertSchema',
        message: '物料JSON转换完成，开始后续处理'
      }
    });

    // 5. 物料后续处理（共用逻辑）
    const finalResults = await postProcessSchemas(conversionResults, outputDir);

    // 过滤数组，只提取每个项的schema字段
    const schemaOnlyResults = finalResults.map(item => {
      // 确保item存在且包含schema字段，避免解构报错
      if (item && item.schema) {
        return item.schema;
      }
      return null;
    }).filter(Boolean);

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

// 导出接口（仅保留统一入口）
module.exports = {
  createImportTask,  // 统一导入入口
  getTaskStatus,
  upload             // multer中间件（用于文件上传）
};