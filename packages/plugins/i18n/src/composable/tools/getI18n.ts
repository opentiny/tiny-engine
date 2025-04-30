import { z } from 'zod'
import useTranslate from '../useTranslate'

const inputSchema = z.object({
  key: z.string().describe('The unique key for the i18n entry to retrieve, e.g. lowcode.36223242')
})

export const getI18n = {
  name: 'get_i18n',
  description:
    'Retrieve an i18n entry from the current TinyEngine low-code application by its key. Use this when you need to get existing internationalization translations.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { key } = args

    if (!key) {
      throw new Error('Key is required')
    }

    const { getLangs } = useTranslate()
    const langs = getLangs() as Record<string, any>

    if (!langs[key]) {
      throw new Error(`I18n key not found: ${key}`)
    }

    return {
      content: [
        {
          type: 'json',
          value: langs[key]
        }
      ]
    }
  }
}
