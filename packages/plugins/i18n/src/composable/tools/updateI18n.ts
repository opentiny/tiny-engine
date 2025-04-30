import { z } from 'zod'
import useTranslate from '../useTranslate'

const inputSchema = z.object({
  key: z.string().describe('The unique key for the i18n entry to update, e.g. lowcode.36223242'),
  zh_CN: z.string().optional().describe('The updated Chinese translation text'),
  en_US: z.string().optional().describe('The updated English translation text')
})

export const updateI18n = {
  name: 'update_i18n',
  description:
    'Update an existing i18n entry in the current TinyEngine low-code application. Use this when you need to modify internationalization translations.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { key, zh_CN, en_US } = args

    if (!key) {
      throw new Error('Key is required')
    }

    if (!zh_CN && !en_US) {
      throw new Error('At least one translation (zh_CN or en_US) must be provided')
    }

    const { getLangs, ensureI18n } = useTranslate()
    const langs = getLangs() as Record<string, any>

    if (!langs[key]) {
      throw new Error(`I18n key not found: ${key}`)
    }

    // Get existing translations
    const existingEntry = langs[key]

    // Update with new translations, keeping existing values for ones not provided
    const updatedEntry = {
      key,
      zh_CN: zh_CN || existingEntry.zh_CN,
      en_US: en_US || existingEntry.en_US,
      type: existingEntry.type
    }

    await ensureI18n(updatedEntry, true)

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: 'I18n entry updated successfully',
            data: updatedEntry
          }
        }
      ]
    }
  }
}
