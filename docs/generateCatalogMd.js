const fs = require('fs')
const path = require('path')

// 读取 catalog.json 文件
const catalog = require('./catalog.json')

// 生成 markdown 文件
function generateMarkdown(catalog) {
  let markdown = '# 目录\n'

  catalog.chapters.forEach((chapter) => {
    markdown += `\n## ${chapter.title}\n\n`

    chapter.sections.forEach((section) => {
      markdown += `- ${section.title}\n`

      section.articles.forEach((article) => {
        const articlePath = path.join(section.name, article.name).replaceAll('\\', '/')

        // 如果存在子文章，则添加子文章
        if (Array.isArray(article.articles) && article.articles.length > 0) {
          markdown += `  - ${article.title}\n`
          article.articles.forEach((subarticle) => {
            const subarticlePath = path.join(articlePath, subarticle.name).replaceAll('\\', '/')
            markdown += `    - [${subarticle.title}](./${subarticlePath})\n`
          })
        } else {
          markdown += `  - [${article.title}](./${articlePath})\n`
        }
      })
    })
  })

  return markdown
}

// 写入到 markdown 文件
function writeToFile(markdown) {
  const outputPath = path.join(__dirname, 'README.md')
  fs.writeFileSync(outputPath, markdown, 'utf8')
}

// 执行生成过程
const markdown = generateMarkdown(catalog)
writeToFile(markdown)
