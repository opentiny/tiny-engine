import prettier from 'prettier'
import parserHtml from 'prettier/parser-html'
import parseCss from 'prettier/parser-postcss'
import parserBabel from 'prettier/parser-babel'

const defaultOption = {
  singleQuote: true,
  printWidth: 120,
  semi: false,
  trailingComma: 'none'
}

export const formatCode = (content, parser, options = {}) => {
  if (!content || typeof content !== 'string') {
    return content
  }

  return prettier.format(content, {
    parser,
    plugins: [parserBabel, parseCss, parserHtml],
    ...defaultOption,
    ...options
  })
}
