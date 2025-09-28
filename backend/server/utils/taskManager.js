/**
 * 任务状态枚举
 * pending: 等待中
 * processing: 处理中
 * success: 成功
 * failed: 失败
 */
const TASK_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed'
};

// 内存存储任务状态（key: taskId, value: 任务详情）
const taskStore = new Map();

/**
 * 生成唯一任务ID
 * @returns {string} taskId (格式：task-时间戳-随机6位)
 */
function generateTaskId() {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).slice(2, 8);
  return `task-${timestamp}-${randomStr}`;
}

/**
 * 创建新任务
 * @param {object} params - 任务参数
 * @returns {string} taskId
 */
function createTask(params) {
  const taskId = generateTaskId();
  const task = {
    taskId,
    status: TASK_STATUS.PENDING,
    progress: 0, // 进度百分比（0-100）
    params: { ...params }, // 入参快照（深拷贝避免外部修改）
    steps: [], // 流程步骤详情（数组，存储所有步骤）
    result: null, // 成功结果
    error: null, // 错误信息
    createTime: new Date().toISOString()
  };
  taskStore.set(taskId, task);
  console.log(`[createTask] 任务创建成功 | taskId: ${taskId}`);
  return taskId;
}

/**
 * 更新任务状态
 * @param {string} taskId - 任务ID
 * @param {object} updates - 待更新字段（支持：status、progress、step、result、error）
 * @returns {boolean} 是否更新成功（任务存在则返回true）
 */
function updateTask(taskId, updates) {
  console.log(`[updateTask 调用] 任务${taskId} | 传入参数：`, JSON.stringify(updates));

  // 1. 校验任务是否存在
  const task = taskStore.get(taskId);
  if (!task) {
    console.error(`[updateTask] ❌ 任务不存在 | taskId: ${taskId}`);
    return false;
  }

  // 2. 打印更新前状态（便于调试对比）
  console.log(
    `[updateTask] 任务${taskId} 更新前 | 状态: ${task.status} | 进度: ${task.progress}%`
  );

  // 3. 先合并基础字段（status、progress、result、error）
  // 仅更新传入的字段，未传入则保留原值
  if (updates.status !== undefined) task.status = updates.status;
  if (updates.progress !== undefined) task.progress = updates.progress;
  if (updates.result !== undefined) task.result = updates.result;
  if (updates.error !== undefined) task.error = updates.error;

  // 4. 单独处理步骤（若传入step，则添加到steps数组）
  // 核心修改：将 stepName 改为 name，统一字段名
  if (updates.step && typeof updates.step === 'object') {
    const newStep = {
      name: updates.step.name || 'unknown-step', // 改为 name 字段，前端更易识别
      status: updates.step.status || task.status, // 步骤状态（默认继承当前任务状态）
      message: updates.step.message || '无描述', // 步骤描述（必填）
      timestamp: new Date().toISOString() // 步骤执行时间
    };
    // 推入步骤数组（不重复，不覆盖）
    task.steps.push(newStep);
    console.log(`[updateTask] 任务${taskId} 新增步骤 | ${newStep.name}: ${newStep.message}`);
  }

  // 5. 保存更新后的任务到内存
  taskStore.set(taskId, task);

  // 6. 打印更新后状态（便于调试确认）
  console.log(
    `[updateTask] 任务${taskId} 更新后 | 状态: ${task.status} | 进度: ${task.progress}% | 累计步骤: ${task.steps.length}个`
  );

  return true;
}

/**
 * 获取任务详情
 * @param {string} taskId - 任务ID
 * @returns {object|null} 任务详情（返回副本，避免外部直接修改内存数据）
 */
function getTask(taskId) {
  const task = taskStore.get(taskId);
  if (!task) {
    console.warn(`[getTask] ⚠️  任务不存在或已过期 | taskId: ${taskId}`);
    return null;
  }

  // 深拷贝：避免外部修改原始数据，同时处理序列化问题
  const taskCopy = JSON.parse(JSON.stringify({
    taskId: task.taskId,
    status: task.status,
    progress: task.progress,
    steps: task.steps, // 此时steps格式已统一，可正常序列化
    result: task.result,
    error: task.error,
    createTime: task.createTim,
    // 过滤params字段：避免其中的复杂对象导致序列化异常
    params: {
      importType: task.params.importType // 仅返回类型，避免敏感/复杂数据
    }
  }));

  // 打印返回给前端的steps数组，验证是否完整
  console.log(`[getTask] 任务${taskId}返回steps:`, JSON.stringify(taskCopy.steps));
  return taskCopy;
}

/**
 * 清理过期任务（超过24小时）
 */
function cleanExpiredTasks() {
  const now = Date.now();
  const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24小时（毫秒）
  let deletedCount = 0;

  for (const [taskId, task] of taskStore.entries()) {
    const taskAge = now - new Date(task.createTime).getTime();
    if (taskAge > EXPIRY_TIME) {
      taskStore.delete(taskId);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    console.log(`[cleanExpiredTasks] 清理过期任务 ${deletedCount} 个 | 剩余任务: ${taskStore.size} 个`);
  }
}

// 每天清理一次过期任务（初始启动时先清理一次）
cleanExpiredTasks();
setInterval(cleanExpiredTasks, 24 * 60 * 60 * 1000);

module.exports = {
  TASK_STATUS,
  generateTaskId,
  createTask,
  updateTask,
  getTask
};