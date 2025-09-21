const { TASK_STATUS } = require('../utils/taskManager');

/**
 * 验证物料导入参数
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
function validateImportParams(req, res, next) {
  try {
    const { url, componentDir, config, sourceType } = req.body;
    const importTypes = [];

    // 校验导入途径（至少一种）
    if (url) importTypes.push('url');
    if (componentDir) importTypes.push('source/npm');
    if (importTypes.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '必须提供一种导入途径：url 或 componentDir',
        success: false
      });
    }
    if (importTypes.length > 1) {
      return res.status(400).json({
        code: 400,
        message: '只能提供一种导入途径：url 或 componentDir',
        success: false
      });
    }

    // 校验URL途径必填参数
    if (url && !config) {
      return res.status(400).json({
        code: 400,
        message: 'URL导入途径必须提供 config 参数',
        success: false
      });
    }

    // 校验源码/NPM途径必填参数
    if (componentDir && !sourceType) {
      return res.status(400).json({
        code: 400,
        message: '源码/NPM导入途径必须提供 sourceType 参数（code 或 npm）',
        success: false
      });
    }
    if (componentDir && !['code', 'npm'].includes(sourceType)) {
      return res.status(400).json({
        code: 400,
        message: 'sourceType 必须为 "code" 或 "npm"',
        success: false
      });
    }

    // 校验路径参数（可选，前端未传则用默认值）
    const { outputDir, schemaLogDir, apiLogDir } = req.body;
    req.body = {
      url: url || null,
      componentDir: componentDir || null,
      config: config || null,
      sourceType: sourceType || null,
      outputDir: outputDir || process.env.DEFAULT_OUTPUT_DIR,
      schemaLogDir: schemaLogDir || process.env.DEFAULT_SCHEMA_LOG_DIR,
      apiLogDir: apiLogDir || process.env.DEFAULT_API_LOG_DIR
    };

    next();
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: `参数验证失败：${error.message}`,
      success: false
    });
  }
}

module.exports = {
  validateImportParams
};