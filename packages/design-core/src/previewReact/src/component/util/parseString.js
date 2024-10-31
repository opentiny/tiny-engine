// 解析字符串为函数或组件
export const parseStringToFunction = (str) => {
  return eval(`(${str})`)
}
