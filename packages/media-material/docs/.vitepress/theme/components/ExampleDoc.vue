<template>
    <div class="example-doc">
        <div class="example-header">
            <a href="#" @click="showCode = !showCode">{{ showCode ? '隐藏代码' : '查看代码' }}</a>
        </div>
        <div class="example-case"><slot/></div>
        <div v-show="showCode" class="example-code">
            <slot name="code"/>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue'

export default {
    props: {
        expanded: Boolean, 
    },
    setup(props) {
        const showCode = ref(props.expanded)
        return {
            showCode
        }
    }
}
</script>

<style>
.example-doc {
    border: 1px solid rgb(220, 223, 230);
    border-radius: 6px;
    overflow: hidden;
    margin: 10px 0;
}

.example-header {
    text-align: right;
    padding: 16px;
}

.example-case {
    border-top: 1px solid rgb(220, 223, 230);
    padding: 16px;
    overflow: auto;
}

.example-code {
    border-top: 1px solid rgb(220, 223, 230);
    padding-top: 16px;
    /* max-height: 400px;
    overflow: auto; */
}

.example-code div[class*='language-'] {
    margin: 0;
    border-radius: 0;
}


</style>