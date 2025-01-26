import postcss from 'postcss'
import scopedPlugin from './scope-css-plugin'

export function handleScopedCss(id: string, content: string) {
  return postcss([scopedPlugin(id)]).process(content, { from: undefined })
}
