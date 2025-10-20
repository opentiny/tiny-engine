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

import { h, computed, provide, nextTick, reactive, watch, defineComponent, inject } from 'vue'
import Loading from '../components/Loading.vue'
import { parseData } from './parser'
import { renderer } from './render.ts'
import { setPageCss, useState } from './page-function'
import useContext from './useContext.ts'
import { useRouter, useRoute } from 'vue-router'
import { useAppSchema } from '../composables/useAppSchema'
import type { PageContent as Schema } from '../types/schema'
import { getDataSource, getUtilsAll } from '../app-function'

interface Props {
  pageId: number
}

export default defineComponent({
  name: 'RenderMain',
  props: {
    pageId: {
      type: Number,
      default: 0
    }
  },
  setup(props: Props) {
    const { getPageById } = useAppSchema()

    const currentSchema = computed(() => {
      const page = getPageById(props.pageId) // 通过 pageId 获取最新的页面对象
      const pageContent = page?.meta?.page_content
      if (!pageContent) return null
      return JSON.parse(JSON.stringify(pageContent))
    })

    const route = useRoute()
    const router = useRouter()
    const { context, setContext, getContext } = useContext()
    const reset = (obj: Record<string, any>) => {
      Object.keys(obj).forEach((key) => delete obj[key])
    }
    const stores = inject('stores')
    provide('pageContext', context)

    const pageSchema = reactive<Schema>({} as Schema)
    const methods: Record<string, any> = {}
    const { state, setState } = useState({ getContext })

    const setMethods = (data: Record<string, any> = {}, clear?: boolean) => {
      if (clear) reset(methods)
      // 这里有些方法在画布还是有执行的必要的，比如说表格的renderer和formatText方法，包括一些自定义渲染函数
      Object.assign(
        methods,
        Object.fromEntries(
          Object.keys(data).map((key) => {
            return [key, parseData(data[key], {}, getContext())]
          })
        )
      )
      setContext(methods)
    }

    const setSchema = async (data: Schema) => {
      if (!data) {
        return
      }

      const newSchema = JSON.parse(JSON.stringify(data))

      const context = {
        state,
        route,
        router,
        stores,
        dataSourceMap: getDataSource(),
        utils: getUtilsAll()
      }
      // 此处提升很重要，因为setState、initProps也会触发画布重新渲染，所以需要提升上下文环境的设置时间
      setContext(context, true)

      // 设置方法调用上下文
      setMethods(newSchema.methods, true)

      // 这里setState（会触发画布渲染），是因为状态管理里面的变量会用到props、utils、bridge、stores、methods
      setState(newSchema.state, true)
      await nextTick()
      setPageCss(data.css || '', String(props.pageId) || 'render-main')

      Object.assign(pageSchema, newSchema)
    }

    // 监听 schema 变化
    watch(
      () => currentSchema.value,
      async (schema) => {
        if (!schema) return
        if (Object.keys(schema).length === 0) return
        await setSchema(schema)
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
    const { pageSchema }: { pageSchema: Schema } = this as any

    // 渲染画布增加根节点，与出码和预览保持一致
    const rootChildrenSchema: any = {
      componentName: 'div',
      // 把页级 props（主要是 className: "page-base-style"）挂到根容器
      props: { ...(pageSchema.props || {}) },
      children: pageSchema.children
    }

    return this.pageSchema.children?.length
      ? h(renderer, { schema: rootChildrenSchema, parent: this.pageSchema })
      : [h(Loading)]
  }
})
