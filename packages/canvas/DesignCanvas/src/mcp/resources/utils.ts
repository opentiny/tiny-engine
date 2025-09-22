// 通用工具：根据二级标题（以 `## ` 开头）裁切文档的指定章节文本
// 约束：
// - 标题大小写不敏感（转换为小写后匹配）
// - 仅在两个相邻的二级标题之间切片
export function pickSectionByHeading(markdown: string, title: string): string {
  if (typeof markdown !== 'string') return ''
  if (!title) return markdown
  const lines = markdown.split('\n')
  const startIdx = lines.findIndex((l) => l.trim().toLowerCase() === `## ${title}`.toLowerCase())
  if (startIdx === -1) return ''
  let endIdx = lines.length
  for (let i = startIdx + 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      endIdx = i
      break
    }
  }
  return lines.slice(startIdx, endIdx).join('\n')
}
