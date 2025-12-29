export default (schema, options) => {
  const { agentRoot, sessionId } = options

  // 转义单引号以防止生成的代码出现语法错误
  const escapedAgentRoot = (agentRoot || '').replace(/'/g, "\\'")
  const escapedSessionId = (sessionId || '').replace(/'/g, "\\'")

  return `export const AGENT_ROOT = '${escapedAgentRoot}'
export const SESSION_ID = '${escapedSessionId}'`
}
