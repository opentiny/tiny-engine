export default (schema, options) => {
  const { agentRoot, sessionId } = options

  return `export const AGENT_ROOT = '${agentRoot}'
export const SESSION_ID = '${sessionId}'`
}
