import { z } from 'zod'
import useTranslate from '../useTranslate'

const inputSchema = z.object({
  key: z.string().describe('The unique key for the i18n entry, e.g. lowcode.36223242'),
  zh_CN: z.string().describe('The Chinese translation text'),
  en_US: z.string().describe('The English translation text')
})

export const addI18n = {
  name: 'add_i18n',
  description:
    'Add a new i18n entry to the current TinyEngine low-code application. Use this when you need to add new internationalization translations to your application.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { key, zh_CN, en_US } = args

    if (!key) {
      throw new Error('Key is required')
    }

    if (!zh_CN) {
      throw new Error('zh_CN is required')
    }

    if (!en_US) {
      throw new Error('en_US is required')
    }

    const { existI18nKey, ensureI18n } = useTranslate()

    if (existI18nKey(key)) {
      throw new Error('I18n key already exists')
    }

    await ensureI18n(
      {
        en_US,
        key,
        type: 'i18n',
        zh_CN
      },
      true
    )

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `I18n entry created successfully`,
            data: {
              key,
              zh_CN,
              en_US,
              type: 'i18n'
            }
          }
        }
      ]
    }
  }
}
