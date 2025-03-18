module.exports = {
  './packages/**/**.{js,mjs,jsx,ts,mts,tsx,vue}': 'eslint',
  './packages/**/**.{js,mjs,jsx,ts,mts,tsx,vue,html,json,less}': 'prettier --write'
}
