export const capitalizeFirstLetter = (string) => {
  if (!string) return string // 检查空字符串
  return string.charAt(0).toUpperCase() + string.slice(1)
}
