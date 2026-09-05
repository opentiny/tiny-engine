// 通用工具：根据二级标题（以 `## ` 开头）裁切文档的指定章节文本
// 约束：
// - 标题大小写不敏感（转换为小写后匹配）
// - 仅在两个相邻的二级标题之间切片
export function pickSectionByHeading(markdown: string, title: string): string {
  if (typeof markdown !== 'string' || !markdown) {
    return ''
  }

  if (typeof title !== 'string' || !title.trim()) {
    return markdown
  }

  const normalize = (s: string) =>
    s
      .trim()
      .replace(/\u2019/g, "'")
      .replace(/\s+/g, ' ')
      .toLowerCase()
  const target = normalize(title)
  const lines = markdown.split(/\r?\n/)
  const isH2 = (line: string) => line.trim().startsWith('## ')
  const headingText = (line: string) => line.trim().replace(/^##\s+/, '')
  let startIdx = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (isH2(lines[i]) && normalize(headingText(lines[i])) === target) {
      startIdx = i
      break
    }
  }

  if (startIdx === -1) {
    return ''
  }

  let endIdx = lines.length

  for (let i = startIdx + 1; i < lines.length; i += 1) {
    if (isH2(lines[i])) {
      endIdx = i
      break
    }
  }

  return lines.slice(startIdx, endIdx).join('\n')
}
