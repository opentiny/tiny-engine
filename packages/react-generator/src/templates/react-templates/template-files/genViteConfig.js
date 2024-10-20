export default () => {
  // 避免在构建的时候，被 process. env 替换
  const processStr = ['process', 'env']

  const res = `
      plugins: [react()],
      define: {
        '${processStr.join('.')}': { ...${processStr.join('.')} }
      },
      server: {
        port: 3000, // 设置开发服务器端口
      },
      build: {
        outDir: "dist", // 设置输出目录
        rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              return "vendor";
            }
          },
        },
      },
    }`

  return res
}
