<template>
    <div class="auth">
        <component :is="component[active]" v-model:modelValue="data" v-model:active="active" />
    </div>
</template>

<script setup>
import Login from './components/login';
import Register from './components/register.vue';
import {ref} from 'vue';
const active = ref('Login');

const component = {
    Login,
    Register,
}
const data = ref({
    email: '',
    password: '',
    nick: '',
})
</script>

<style lang="less">
html,body, #app{
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0%;
}
.auth{
    display: flex;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 1em;
    .form-tool-bar {
        max-width: 320px;
        width: 100%;
        display: flex;
        flex-flow: column;
        gap: 8px;
        // align-items: center;
        // justify-content: center;
        &__link{
            align-self: flex-start;
            justify-self: start;
        }
    }
}
</style>