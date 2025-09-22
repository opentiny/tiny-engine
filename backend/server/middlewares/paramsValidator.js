const { TASK_STATUS } = require('../utils/taskManager');

/**
 * 验证「URL爬取」导入参数（已移除本地目录校验）
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
function validateImportParams(req, res, next) {
  try {
    const { url, config } = req.body;

    // 仅保留URL爬取一种途径，强制校验url和config
    if (!url) {
      return res.status(400).json({
        code: 400,
        message: 'URL导入途径必须提供 url 参数',
        success: false
      });
    }
    if (!config) {
      return res.status(400).json({
        code: 400,
        message: 'URL导入途径必须提供 config 参数（解析配置）',
        success: false
      });
    }

    // 补全默认路径参数
    req.body = {
      url,
      config
    };

    next();
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: `URL参数验证失败：${error.message}`,
      success: false
    });
  }
}

/**
 * 验证「文件上传」导入参数
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
function validateFileImportParams(req, res, next) {
  try {
    // 1. 校验上传文件
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '文件上传途径必须提供至少一个文件',
        success: false
      });
    }

    // 2. 校验sourceType
    const { sourceType } = req.body;
    if (!sourceType) {
      return res.status(400).json({
        code: 400,
        message: '文件上传途径必须提供 sourceType 参数（code 或 npm）',
        success: false
      });
    }
    if (!['code', 'npm'].includes(sourceType)) {
      return res.status(400).json({
        code: 400,
        message: 'sourceType 必须为 "code" 或 "npm"',
        success: false
      });
    }

    // 3. 补全参数
    req.body = {
      sourceType
    };

    next();
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: `文件上传参数验证失败：${error.message}`,
      success: false
    });
  }
}

module.exports = {
  validateImportParams,
  validateFileImportParams
};
