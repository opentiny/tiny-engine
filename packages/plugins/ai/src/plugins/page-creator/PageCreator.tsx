import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Image } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { sharedApi } from '../shared-api'
import systemPrompt from '../../prompts/schema.system.md?raw'
import { ChangeEventHandler, forwardRef, useCallback, useState } from 'react'
import { chatLLM, extractCode } from '../fetch-llm'
import { ComponentProps } from '@/components/business/ApiConfigSteps'
import icon from '/public/page-creator.svg'

export default function PageCreator({ apiConfig, onClose }: ComponentProps) {
  const [imageSrc, setImageSrc] = useState<FileReader['result']>(null)
  const [msg, setMsg] = useState('')
  const handleImageChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target?.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageSrc(e.target!.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const [fetching, setFetching] = useState(false)

  const generateCode = useCallback(() => {
    setFetching(true)
    chatLLM(
      [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: msg
            },
            ...[imageSrc].filter(Boolean).map(
              (src) =>
                ({
                  type: 'image_url',
                  image_url: {
                    url: src as string
                  }
                } as const)
            )
          ]
        }
      ],
      [],
      'gpt-4-turbo',
      'none',
      apiConfig
    )
      .then((choices) => {
        const schema = JSON.parse(extractCode(choices))
        sharedApi.saveSchema(schema)
        onClose()
      })
      .finally(() => {
        setFetching(false)
      })
  }, [apiConfig, onClose, msg, imageSrc])

  return (
    <>
      <DialogHeader>
        <DialogTitle>描述 UI 需求</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 p-4">
        <div className="rounded-lg overflow-hidden p-1">
          <Textarea
            className="w-full h-32 p-4 resize-none"
            placeholder="描述您的代码生成需求，可包含图像或文本"
            value={msg}
            onChange={(evt) => setMsg(evt.currentTarget.value)}
            disabled={fetching}
          />
          <div className="">
            <div className="flex items-center mt-1">
              <Label htmlFor="picture">
                <Image size={20} className="mr-2" />
              </Label>
              <Input id="picture" type="file" onChange={handleImageChange} disabled={fetching} />
            </div>
            {imageSrc && (
              <img
                src={imageSrc as string}
                alt="Uploaded Preview"
                className="rounded-md object-contain w-[160px] h-auto mt-1"
              />
            )}
          </div>
        </div>
        <Button variant="default" onClick={() => generateCode()} disabled={fetching}>
          {fetching ? '生成中...' : '生成'}
        </Button>
      </div>
    </>
  )
}

export const Trigger = forwardRef<HTMLImageElement>((props, ref) => {
  return <img src={icon} ref={ref} {...props} width={24} height={24} />
})
