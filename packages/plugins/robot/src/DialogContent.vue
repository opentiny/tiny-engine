<template>
  <div v-html="renderedMarkdown" />
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue';
import useMarkdown from './js/useDialogContent'

export default {
  props: {
    markdownContent: String,
  },
  setup(props) {
    const renderedMarkdown = ref('');
    const { md, initClipboard } = useMarkdown();
    watch(
      () => props.markdownContent,
      (newValue) => {
      render(newValue)
    });

    onMounted(() => {
      render(props.markdownContent)
    });

    const render = (text) =>{
      renderedMarkdown.value = md.render(text);
      initClipboard();
    }

    return {
      renderedMarkdown,
    };
  },
};
</script>
<style lang="less">
.code-block{
  position: relative;
}
.code-block:hover .copy-btn {
  opacity: 1;
  transition: opacity .3s ease, transform .3s ease;
}
.hljs{
  padding:10px;
}
.copy-btn {
  width:56px;
  font-size: 12px;
  background-color: #ccc;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  position: absolute;
  top: 5px;
  right: 5px;
  border-radius: 3px;
  transition: all .3s;
  opacity: 0;
}
</style>