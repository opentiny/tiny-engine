export default () => {
  return `import { TinyRemoter } from "@opentiny/next-remoter";
import {
  WebMcpClient,
  createMessageChannelPairTransport,
} from "@opentiny/next-sdk";
import type { Transport } from "@opentiny/next-sdk";
import { AGENT_ROOT, SESSION_ID } from "./base";
import { mcpServerManager } from "./mcp/server";`
}
