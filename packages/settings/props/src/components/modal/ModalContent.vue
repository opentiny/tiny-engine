<template>
  <h3>{{ panelTitle }}</h3>
  <div v-for="(section, index) in propertyList" :key="index" class="properties-item">
    <div v-if="section.meta.label && section.layoutType !== 'vertical'" class="item-label">
      <label :title="section.title">
        {{ section.name }}
      </label>
    </div>
    <div :class="{ 'item-component': section.meta.layoutType === 'vertical', 'component-wrap': true }">
      <component
        :is="Components[section.meta.inputType]"
        v-bind="section"
        :name="namePrefix + section.name"
      ></component>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { utils } from '@opentiny/tiny-engine-utils'
import { useResource } from '@opentiny/tiny-engine-meta-register'
import Components from '../../components'

const { getEnumData, camelize } = utils

export default {
  inheritAttrs: false,
  props: {
    namePrefix: {
      type: String,
      default: ''
    },
    values: {
      type: Object,
      default: () => ({})
    },
    properties: {
      type: Array,
      default: () => []
    },
    index: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const { appSchemaState } = useResource()

    const propertyList = computed(() => {
      const properties = JSON.parse(JSON.stringify(props.properties))

      properties.forEach((item) => {
        item.modelValue = props.values[camelize(item.name)] || item.default
        if (item.enum) {
          item.data = getEnumData(item)
        }
      })

      return properties
    })

    const panelTitle = computed(() => {
      let title = ''

      if (props.values.title && props.values.title.i18nKey) {
        const i18nKey = props.values.title.i18nKey
        title = appSchemaState.langs[i18nKey]
          ? appSchemaState.langs[i18nKey][appSchemaState.currentLang]
          : props.values.title[appSchemaState.currentLang]
      } else {
        title = props.values.title
      }

      return title
    })

    return {
      propertyList,
      panelTitle,
      Components
    }
  }
}
</script>

<style lang="less" scoped>
.properties-item {
  width: 100%;
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .item-label {
    width: 40%;
    word-break: break-all;
  }
  .item-component {
    width: 100%;
    padding-left: 8px;
  }
  .component-wrap {
    flex: 1;
    width: 100px;
    padding-left: 8px;
    &.item-component {
      width: 100%;
    }
  }
  .nolabel {
    width: 100%;
  }
  &.col-6 {
    width: 50%;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    .item-label {
      width: auto;
      margin-bottom: 6px;
    }
  }
  &.col-4 {
    width: 33.33%;
    flex-direction: column;
    align-items: flex-start;
    .item-label {
      width: auto;
      margin-bottom: 6px;
    }
  }
}
</style>
