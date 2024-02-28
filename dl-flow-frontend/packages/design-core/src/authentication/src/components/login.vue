<template>
    <div class="form">
        <div class="form__wrapper">
            <tiny-form ref="form" :model="loginData" :rules="rules" validate-type="text" label-position="top" style="display:flex; flex-flow: column;">
                <h1>登录</h1>
                <tiny-form-item label="邮箱" prop="email">
                    <tiny-input v-model="loginData.email" />
                </tiny-form-item>
                <tiny-form-item label="密码" prop="password">
                    <tiny-input v-model="loginData.password" type="password" show-password />
                </tiny-form-item>
                <tiny-form-item>
                    <tiny-link class="form-tool-bar__link"  @click="_active = 'Register'" v-if="_active === 'Login'">
                        注册
                    </tiny-link>
                </tiny-form-item>
                <tiny-form-item>
                    <tiny-button type="primary" native-type="submit" @click="login">
                        登录
                    </tiny-button>
                </tiny-form-item>
            </tiny-form>
        </div>
    </div>
</template>

<script setup>
import {useEndpoint} from '@opentiny/tiny-engine-http';
import {Link as TinyLink, Button as TinyButton, Form as TinyForm, FormItem as TinyFormItem, Input as TinyInput, Modal} from '@opentiny/vue';
import {defineProps, defineEmits, reactive, watch ,ref} from 'vue';
import {useSessionStorage} from '@vueuse/core';
const form = ref();
const token = useSessionStorage('token', '');
const endpoint = useEndpoint();
const props = defineProps(['modelValue', 'active']);
const emits = defineEmits(['update:modelValue', 'update:active'])
const loginData = reactive({
    email: props.modelValue.email,
    password: props.modelValue.password,
})
const _active = ref(props.active);
watch(_active, ()=>{
    emits('update:active', _active.value);
})
watch(loginData, ()=>{
    emits('update:modelValue', {
        ...props.modelValue,
        ...loginData,
    })
}, {deep: true})
const rules = {
    email: {
        required: true,
        type: 'email',
        trigger: 'blur'
    },
    password: {
        required: true,
        trigger: 'blur'
    }
}
const login = () => {
    form.value.validate((valid) => {
        if (!valid){
            return;
        }
        endpoint.post('/endpoint/user/login', loginData)
        .then(({jwt})=>{
            token.value = jwt;
            Modal.message({
                status: 'success',
                message: '登陆成功'
            })
            window.location.href = '/'
        })
        .catch((reason) => {
            Modal.message({
                status: 'error',
                message: reason
            })
        })
    })
}
</script>

<style lang="less" scoped>

.form{
    width: 100%;
    height: fit-content;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    background: #fefefe;
    &__wrapper{
        max-width: 320px;
        flex: 1 1 auto;
    }
    h1 {
        text-align: center;
        color: #222;
        font-weight: 400;
        margin: 0;
    }
    &__button{
        display: flex;
        width: fit-content;
        margin: 8px auto;
    }
}
</style>