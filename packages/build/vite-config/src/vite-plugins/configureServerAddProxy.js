export function configServerAddProxy(path, target) {
  return [
    {
      name: 'vite-plugin-config-server-add-proxy',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url.includes(path)) {
            req.url = req.url.replace(path, target)
          }
          next()
        })
      }
    }
  ]
}
