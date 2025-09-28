const { TASK_STATUS, updateTask } = require('../utils/taskManager');

/**
 * 全局错误处理中间件
 * @param {Error} err 
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
function errorHandler(err, req, res, next) {
  // 格式化错误响应
  res.status(err.statusCode || 500).json({
    code: err.statusCode || 500,
    message: err.message || '服务器内部错误',
    success: false,
    taskId: taskId || null
  });
}

module.exports = errorHandler;