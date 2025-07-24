import { z } from 'zod'
import { usePage } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'

const { validateParams } = utils

const inputSchema = z.object({
  id: z.string().describe('The id of the page')
})

export const editSpecificPage = {
  name: 'Edit page in canvas.',
  order: 9,
  description: 'Edit a specific page in canvas. Use this tool when you need to edit some page in canvas.',
  inputSchema,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args

    const validateResult = validateParams(args, {
      id: {
        required: true,
        message: 'Id is required'
      }
    })

    if (!validateResult.isValid) {
      return validateResult.error
    }

    const { switchPage } = usePage()

    await switchPage(id)

    const res = {
      status: 'success',
      message: `Page now can be edited.`,
      data: {}
    }

    return {
      content: [
        {
          type: 'text',
          value: JSON.stringify(res)
        }
      ]
    }
  }
}
