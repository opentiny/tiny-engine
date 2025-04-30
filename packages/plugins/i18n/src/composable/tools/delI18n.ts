import { z } from 'zod'
import useTranslate from '../useTranslate'

const inputSchema = z.object({
  key: z.string().describe('The unique key for the i18n entry to delete, e.g. lowcode.36223242')
})

export const delI18n = {
  name: 'delete_i18n',
  description:
    'Delete an i18n entry from the current TinyEngine low-code application by its key. Use this when you need to remove internationalization translations.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { key } = args

    if (!key) {
      throw new Error('Key is required')
    }

    const { getLangs, removeI18n } = useTranslate()
    const langs = getLangs() as Record<string, any>

    if (!langs[key]) {
      throw new Error(`I18n key not found: ${key}`)
    }

    const deletedEntry = langs[key]

    // removeI18n expects an array of keys
    removeI18n([key])

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: 'I18n entry deleted successfully',
            data: {
              key,
              deletedEntry
            }
          }
        }
      ]
    }
  }
}
