export function getBaseUrlFromCli(fallback = '') {
  // 理论上要从resolvedConfig阶段的钩子里面拿到base，由于插件嵌套插件，子插件的配置项需要在resolveConfig前传入这里，无法等resolvedConfig，故手动获取命令行base
  const index = process.argv?.indexOf('--base')
  return index > -1 ? process.argv[index + 1] || fallback : fallback
}
