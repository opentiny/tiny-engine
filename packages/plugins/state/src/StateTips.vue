<template>
  <div v-if="props.type === TIPS_TYPE.PAGE" class="tips">
    <div>字符串:"string"</div>
    <div>数字:123</div>
    <div>布尔值:true/false</div>
    <div>对象:{"name":"xxx"}</div>
    <div>数组:["1","2"]</div>
    <div>空值:null</div>
    <div>"color":red</div>
    <div>"background":"blue"</div>
  </div>
  <div v-else class="tips app-tips">
    <div class="tip-note">注意：必须是一个JSON对象 {}</div>
    <pre><code>{
  "app": "TinyEngine",
  "version": "2.0.0",
  "isAdmin": true,
  "userInfo": {
    "name": "张三",
    "age": 18,
    "gender": "男"
  }
}</code></pre>
  </div>
</template>
<script setup>
const TIPS_TYPE = {
  PAGE: 'page',
  APP: 'app'
}

const props = defineProps({
  type: {
    type: String,
    default: 'page'
  }
})
</script>

<style lang="less" scoped>
.tips {
  font-size: 12px;
  line-height: 18px;
  margin-top: 8px;
  border-radius: 4px;
  background: var(--te-state-tip-bg-color);
  color: var(--te-state-tip-text-color);
  padding: 8px 14px;
}
.app-tips {
  pre {
    margin: 0;
    padding: 0 14px;
  }
  .tip-note {
    font-weight: 500;
    padding: 8px 14px 0;
    color: var(--te-state-tip-highlight-color);
  }
}
</style>
