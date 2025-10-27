export default (schema, options) => {
  const { routes } = options

  // 生成路由枚举
  const routeEnum = routes.map((route) => `"${route}"`).join(', ')

  return `import { z } from "@opentiny/next-sdk"
import type { WebMcpServer } from "@opentiny/next-sdk"
import type { Router } from 'vue-router'

export function registerNavigationTools(server: WebMcpServer, router: Router) {
  server.registerTool(
    "navigate-to-page",
    {
      title: "页面导航",
      description: "导航到指定页面",
      inputSchema: {
        path: z.enum([${routeEnum}])
          .describe("目标页面路径"),
      },
    },
    async ({ path }: { path: string }) => {
      try {
        await router.push(\`/\${path}\`)
        return {
          content: [{ type: "text", text: \`已导航到 \${path} 页面\` }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: \`导航失败：\${error}\` }],
        }
      }
    }
  )

  server.registerTool(
    "go-back",
    {
      title: "返回上一页",
      description: "返回到上一个页面",
      inputSchema: {},
    },
    async () => {
      try {
        router.back()
        return {
          content: [{ type: "text", text: "已返回上一页" }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: \`返回上一页失败：\${error}\` }],
        }
      }
    }
  )

  server.registerTool(
    "go-forward",
    {
      title: "前进到下一页",
      description: "前进到下一个页面",
      inputSchema: {},
    },
    async () => {
      try {
        router.forward()
        return {
          content: [{ type: "text", text: "已前进到下一页" }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: \`前进到下一页失败：\${error}\` }],
        }
      }
    }
  )

  server.registerTool(
    "get-current-route",
    {
      title: "获取当前路由",
      description: "获取当前页面的路由信息",
      inputSchema: {},
    },
    async () => {
      try {
        const currentRoute = router.currentRoute.value
        return {
          content: [{ 
            type: "text", 
            text: \`当前路由：\${currentRoute.path}，页面名称：\${String(currentRoute.name)}\` 
          }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: \`获取当前路由失败：\${error}\` }],
        }
      }
    }
  )
}`
}
