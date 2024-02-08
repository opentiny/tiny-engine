<template>
  <plugin-panel title="Schema" @close="$emit('close')">
    <template #header>
      <svg-button
        class="item icon-sidebar"
        :class="[fixedPanels?.includes(PLUGIN_NAME.Schema) && 'active']"
        name="fixed"
        :tips="!fixedPanels?.includes(PLUGIN_NAME.Schema) ? '固定面板' : '解除固定面板'"
        @click="$emit('fixPanel', PLUGIN_NAME.Schema)"
      ></svg-button>
    </template>
    <template #content>
      <vue-monaco :value="code" language="json" class="editor" @change="onChange" />
    </template>
  </plugin-panel>
</template>

<script setup>
import { VueMonaco } from '@opentiny/tiny-engine-common'
import { defineProps, toRefs, computed } from 'vue';
import { useSchema, useLayout, useX6 } from '@opentiny/tiny-engine-controller';
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
const {schema, updateSchema} = useSchema();
const code = computed(() => JSON.stringify(schema,null,2));
const props = defineProps({
  fixedPanels: {
    type: Array
  }
})
const { fixedPanels } = toRefs(props)
const { PLUGIN_NAME } = useLayout()
let g = null;
let reRender = null;
const onChange = (args) => {
  if (!reRender){
    const x6 = useX6();
    g = x6.g;
    reRender = x6.reRender;
    onChange(args);
    return;
  }
  code.value = args;
  const obj = JSON.parse(code.value ?? '{}');

  updateSchema(obj?.payload);
  reRender(g, schema.payload);
}
</script>

<style lang="less" scoped>
.editor{
  height: 100%;
  flex: 1 1 auto;
}
</style>