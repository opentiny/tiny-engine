const { extractApiFromUrl } = require('../../src/api-generation/web-based-api-generator');
const { generateComponentApiJson,
  generateComponentApiFromUploadedNpmFiles,
  generateComponentApiFromUploadedCodeFiles
} = require('../../src/api-generation/file-based-api-generator');
const { batchConvertToTinyEngineSchema } = require('../../src/schema-conversion/convertor');
const { postProcessSchemas } = require('../../src/post-processing/post-process-schemas');
const { saveApiArrayToFiles } = require('../../src/schema-conversion/cli');
const { createTask, updateTask, getTask, TASK_STATUS } = require('../utils/taskManager');
const path = require('path');
const fs = require('fs');

const multer = require('multer'); // 处理文件上传的中间件
const { v4: uuidv4 } = require('uuid'); // 生成临时文件名（可选）

// 配置multer临时存储（仅内存存储，避免磁盘写入）
const upload = multer({
  storage: multer.memoryStorage(), // 文件暂存到内存
  limits: { fileSize: 50 * 1024 * 1024 }, // 限制单文件50MB
});

/**
 * 获取有效的默认路径（优先环境变量，次选兜底路径，确保绝对路径）
 * @param {string} envKey - 环境变量键名
 * @param {string} fallback - 兜底路径（相对于项目根目录）
 * @returns {string} 绝对路径
 */
function getValidDefaultPath(envKey, fallback) {
  // 1. 优先取环境变量，无则用兜底
  const rawPath = process.env[envKey] || fallback;
  // 2. 转换为绝对路径（基于项目根目录）
  const absolutePath = path.resolve(__dirname, '../../', rawPath);
  // 3. 若目录不存在则自动创建
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
    console.log(`📁 自动创建默认目录：${absolutePath}`);
  }
  return absolutePath;
}

/**
 * 创建物料导入任务（URL爬取）
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
async function createImportTask(req, res, next) {
  try {
    const { url, config: configStr } = req.body;

    const defaultPaths = {
      outputDir: getValidDefaultPath('DEFAULT_OUTPUT_DIR', 'output-log'),
      schemaLogDir: getValidDefaultPath('DEFAULT_SCHEMA_LOG_DIR', 'schema-log'),
      apiLogDir: getValidDefaultPath('DEFAULT_API_LOG_DIR', 'raw-api-log')
    };

    const taskParams = {
      ...defaultPaths,
      url,
      config: configStr
    };

    // 创建任务并初始化状态
    const taskId = createTask(taskParams);
    updateTask(taskId, {
      status: TASK_STATUS.PROCESSING,
      step: {
        name: 'init',
        message: '任务创建成功，开始处理'
      }
    });

    // 异步执行核心流程（不阻塞响应）
    processImportTask(taskId, taskParams).catch(err => {
      console.error(`任务${taskId}执行失败：`, err);
    });

    // 立即返回taskId给前端
    res.status(200).json({
      code: 200,
      message: '任务创建成功，可通过taskId查询进度',
      taskId,
      success: true
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 新增：创建文件上传导入任务（支持code和npm类型）
 * @param {Request} req - 包含上传的文件和表单参数
 * @param {Response} res 
 * @param {NextFunction} next 
 */
async function createFileImportTask(req, res, next) {
  try {
    // 1. 校验上传文件和参数
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请上传至少一个组件文件',
        success: false
      });
    }

    const { sourceType, config: configStr } = req.body;
    if (!sourceType || !['code', 'npm'].includes(sourceType)) {
      return res.status(400).json({
        code: 400,
        message: 'sourceType必须为"code"或"npm"',
        success: false
      });
    }

    const defaultPaths = {
      outputDir: getValidDefaultPath('DEFAULT_OUTPUT_DIR', 'output-log'),
      schemaLogDir: getValidDefaultPath('DEFAULT_SCHEMA_LOG_DIR', 'schema-log'),
      apiLogDir: getValidDefaultPath('DEFAULT_API_LOG_DIR', 'raw-api-log')
    };

    const taskParams = {
      ...defaultPaths, // 合并后端默认路径
      sourceType,
      config: configStr,
      files: req.files.map(f => ({ originalname: f.originalname, buffer: f.buffer })) // 保留文件信息
    };

    // 创建任务并初始化状态
    const taskId = createTask(taskParams);
    updateTask(taskId, {
      status: TASK_STATUS.PROCESSING,
      step: {
        name: 'init',
        message: `文件上传任务创建成功（类型：${sourceType}），开始处理`
      }
    });

    // 3. 异步执行核心流程（不阻塞响应）
    processImportTask(taskId, taskParams).catch(err => {
      console.error(`文件上传任务${taskId}执行失败：`, err);
    });

    // 4. 立即返回taskId给前端
    res.status(200).json({
      code: 200,
      message: '文件上传任务创建成功，可通过taskId查询进度',
      taskId,
      success: true
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 核心流程执行函数（异步）
 * @param {string} taskId 
 * @param {object} params 
 */
async function processImportTask(taskId, params) {
  const {
    url,
    files, // 仅保留文件上传
    config: configStr,
    sourceType,
    outputDir,
    schemaLogDir,
    apiLogDir
  } = params;
  let apiArray;

  try {
    // 1. 生成API JSON（根据导入途径）
    if (url) {
      // 途径1：URL爬取
      updateTask(taskId, {
        progress: 20,
        step: {
          name: 'extractApi',
          message: `开始爬取URL：${url}`
        }
      });

      // 调用封装函数解析校验config
      const config = parseAndValidateConfig(configStr);

      // 解析通过后执行爬取
      apiArray = await extractApiFromUrl(url, config);
      updateTask(taskId, {
        progress: 40,
        step: {
          name: 'extractApi',
          message: `URL爬取完成，共${apiArray.length}个子组件`
        }
      });
    } else if (files && files.length > 0) {
      // 途径2：文件上传（code或npm类型）
      updateTask(taskId, {
        progress: 20,
        step: {
          name: 'generateApiFromFiles',
          message: `开始处理${sourceType}类型上传文件（共${files.length}个）`
        }
      });

      // 根据sourceType调用对应的生成函数
      if (sourceType === 'code') {
        apiArray = await generateComponentApiFromUploadedCodeFiles(files);
      } else if (sourceType === 'npm') {
        apiArray = await generateComponentApiFromUploadedNpmFiles(files);
      } else {
        throw new Error(`不支持的文件上传类型：${sourceType}`);
      }

      if (!Array.isArray(apiArray) || apiArray.length === 0) {
        throw new Error('文件上传生成的API数组为空或格式不正确');
      }

      updateTask(taskId, {
        progress: 40,
        step: {
          name: 'generateApiFromFiles',
          message: `文件上传API生成完成，共${apiArray.length}个子组件`
        }
      });
    }

    // 2. 保存API JSON（仅后端操作，不暴露给前端）
    const saveResult = await saveApiArrayToFiles(apiArray, apiLogDir);
    if (saveResult.failCount === apiArray.length) {
      throw new Error("所有API文件保存失败，终止流程");
    }

    // 3. 转换为符合TinyEngine组件协议的物料json
    updateTask(taskId, {
      progress: 60,  // 调整进度值，原50→60
      step: {
        name: 'convertSchema',
        message: '开始转换组件物料json（调用大模型）'
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
        message: '组件物料json转换完成，开始后续处理'
      }
    });

    // 4. 后续处理，形成符合平台使用规则的物料json
    const finalResults = await postProcessSchemas(conversionResults, outputDir);

    // 5. 更新成功状态
    updateTask(taskId, {
      status: TASK_STATUS.SUCCESS,
      progress: 100,
      step: {
        name: 'finish',
        message: '组件物料json后续处理完成，请确认后完成导入'
      },
      result: {
        totalComponents: apiArray.length,
        successCount: conversionResults.filter(r => r.success).length,
        failCount: conversionResults.filter(r => !r.success).length,
        outputDir: path.resolve(outputDir),
        finalSchemas: finalResults // 最终物料JSON数组
      }
    });
  } catch (error) {
    console.error(`[任务${taskId}] 执行中断！错误：`, error.message, '堆栈：', error.stack);
    try {
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
      // 即使更新任务状态失败，也不影响主进程
      console.error('更新任务状态时发生错误:', updateError);
    }
  }
}

/**
 * 解析并验证URL爬取所需的config参数
 * @param {string|object} configStr - 待解析的config（字符串或对象）
 * @returns {object} 解析后的config对象
 * @throws {Error} 解析失败或结构不合法时抛出错误
 */
function parseAndValidateConfig(configStr) {
  // 1. 先判断是否传递了config
  if (configStr === undefined || configStr === null) {
    throw new Error('URL爬取模式必须传递config参数（页面解析规则）');
  }

  // 2. 解析字符串为对象（若已是对象则直接使用）
  let config;
  if (typeof configStr === 'string') {
    try {
      config = JSON.parse(configStr);
      console.log('✅ config解析成功，解析后对象：', JSON.stringify(config, null, 2));
    } catch (parseError) {
      throw new Error(`❌ config解析失败（JSON语法错误）：${parseError.message}`);
    }
  } else if (typeof configStr === 'object' && configStr !== null) {
    config = configStr;
    console.log('✅ config为对象类型，无需解析');
  } else {
    throw new Error(`❌ config参数类型不合法（需JSON字符串或对象），当前类型：${typeof configStr}`);
  }

  // 3. 验证config核心结构
  const requiredStructs = [
    { key: 'components', type: 'array', desc: '组件解析规则数组' },
  ];
  for (const { key, type, desc } of requiredStructs) {
    // 区分数组和普通对象的判断逻辑
    let isValid = false;
    if (type === 'array') {
      // 数组类型：必须是数组且长度 > 0
      isValid = Array.isArray(config[key]) && config[key].length > 0;
    } else {
      // 其他类型（如object）：直接用typeof判断
      isValid = typeof config[key] === type && config[key] !== null;
    }

    if (!isValid) {
      const errorMsg = type === 'array'
        ? `必须是非空数组`
        : `必须是${type}类型且非空`;
      throw new Error(`❌ config.${key} ${errorMsg}（${desc}）`);
    }
  }

  // 4. 验证components内部字段（确保每个组件有name和tables）
  const invalidComp = config.components.find(comp =>
    !comp.name || !comp.tables || typeof comp.tables !== 'object'
  );
  if (invalidComp) {
    const invalidReason = !invalidComp.name ? '缺少name字段' : '缺少tables对象';
    throw new Error(`❌ config.components中存在无效组件：${JSON.stringify(invalidComp)}（${invalidReason}）`);
  }

  return config;
}

/**
 * 查询任务状态
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
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

    res.status(200).json({
      code: 200,
      success: true,
      ...task // 直接返回完整 task 对象（已过滤敏感字段）
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createImportTask,
  createFileImportTask,
  getTaskStatus,
  upload
};