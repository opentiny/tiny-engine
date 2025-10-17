/**
 * 统一验证「三种导入类型」的参数（URL爬取、源码上传、NPM包提交）
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
function validateImportParams(req, res, next) {
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

    // 2. 按导入类型校验专属参数
    switch (importType) {
      // 类型1：URL爬取（需url + tableSelector）
      case 'url': {
        const { url, tableSelector } = req.body;
        if (!url || typeof url !== 'string' || url.trim() === '') {
          return res.status(400).json({
            code: 400,
            message: 'url类型必须提供有效的URL地址（如：https://element-plus.org/zh-CN/component/button.html）',
            success: false
          });
        }
        if (!tableSelector || typeof tableSelector !== 'string' || tableSelector.trim() === '') {
          return res.status(400).json({
            code: 400,
            message: 'url类型必须提供有效的tableSelector（CSS选择器，如：.vp-table）',
            success: false
          });
        }
        // 补全参数（去除冗余字段）
        req.body = {
          ...req.body,
          url: url.trim(),
          tableSelector: tableSelector.trim()
        };
        break;
      }

      // 类型2：源码上传（需单个文件，无需其他参数）
      case 'code': {
        // 校验文件：必须上传，且仅单个（支持单个文件或ZIP压缩包）
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
        // 补全参数（保留文件信息）
        req.body = { ...req.body };
        break;
      }

      // 类型3：NPM包提交（需packageName + componentName）
      case 'npm': {
        const { packageName, componentName } = req.body;
        // 校验包名
        if (!packageName || typeof packageName !== 'string' || packageName.trim() === '') {
          return res.status(400).json({
            code: 400,
            message: 'npm类型必须提供有效的packageName（如：element-plus）',
            success: false
          });
        }
        // 校验组件名
        if (!componentName || typeof componentName !== 'string' || componentName.trim() === '') {
          return res.status(400).json({
            code: 400,
            message: 'npm类型必须提供有效的componentName（如：button）',
            success: false
          });
        }
        // 补全参数（去除冗余字段，修剪空格）
        req.body = {
          ...req.body,
          packageName: packageName.trim(),
          componentName: componentName.trim()
        };
        break;
      }
    }

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