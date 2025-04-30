import { z } from 'zod'
import useTranslate from '../useTranslate'

const inputSchema = z.object({
  // 不需要任何输入参数
})

export const getAllI18n = {
  name: 'get_all_i18n',
  description:
    'Retrieve all i18n entries from the current TinyEngine low-code application. Use this when you need to get a complete list of all internationalization translations.',
  inputSchema,
  handler: async (_args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { getLangs } = useTranslate()
    const langs = getLangs() as Record<string, any>

    if (!Object.keys(langs).length) {
      return {
        content: [
          {
            type: 'json',
            value: { message: 'No i18n entries found' }
          }
        ]
      }
    }

    return {
      content: [
        {
          type: 'json',
          value: langs
        }
      ]
    }
  }
}
