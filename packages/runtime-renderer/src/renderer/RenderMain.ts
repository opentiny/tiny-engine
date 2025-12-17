/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */
import { defaultRenderer } from './render.ts'
import { useContextPage } from './context/index.ts'
import { useLowcode } from './context/useLowcode.ts'
import { useAppSchema } from '../composables/useAppSchema.ts'
import type { PageContent as Schema } from '../types/index.ts'
import { computed, provide, reactive, watch, defineComponent } from 'vue'
import { I18nInjectionKey } from '@opentiny/tiny-engine-common/js/i18n'

interface Props {
  pageId: string
}

export default defineComponent({
  name: 'RenderMain',
  props: {
    pageId: {
      type: [String, Number],
      default: '0'
    }
  },
  setup(props: Props, ctx: any) {
    const { getPageById } = useAppSchema()
    // 通过 pageId 获取最新的页面对象
    const currentSchema = computed(() => {
      const page = getPageById(props.pageId)
      const pageContent = page?.page_content
      if (!pageContent) return null
      return JSON.parse(JSON.stringify(pageContent))
    })
    const pageSchema = reactive<Schema>({} as Schema)
    // TODO 暂时置空解决区块编译后获取报错问题
    provide('page-ancestors', [])
    // 提供翻译及区块Lowcode函数上下文
    const { TinyI18nHost } = useLowcode()
    provide(I18nInjectionKey, TinyI18nHost)
    // 提供页面级上下文
    const { state, methods, context, initContext } = useContextPage()
    provide('pageContext', context)
    const initPage = async (newSchema: Schema) => {
      initContext({ schema: newSchema, props: props, ctx }, () => {
        Object.assign(pageSchema, newSchema)
      })
    }
    // 监听 schema 变化
    watch(
      () => currentSchema.value,
      (schema) => {
        if (schema && Object.keys(schema).length !== 0) {
          initPage(JSON.parse(JSON.stringify(schema)))
        }
      },
      { immediate: true }
    )
    return {
      pageSchema,
      methods,
      state
    }
  },
  render(): any {
    return defaultRenderer(this.pageSchema as any)
  }
})
