const isDevelopEnv = import.meta.env.MODE?.includes('dev')

export default {
  id: 'engine.config',
  theme: 'light',
  material: ['/mock/bundle.json'],
  scripts: [],
  styles: [],
  // 是否开启 TailWindCSS 特性
  enableTailwindCSS: true,
  // 是否启用登录
  enableLogin: isDevelopEnv ? false : true
}
