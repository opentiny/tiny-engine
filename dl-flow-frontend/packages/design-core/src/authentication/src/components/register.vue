<template>
    <div class="form">
        <div class="form__wrapper">
            <tiny-form :model="registerData" :rules="rules" validate-type="text" label-position="top" ref="form" message-type="block">
                <h1>注册</h1>
                <tiny-form-item label="邮箱" prop="email">
                    <tiny-input v-model="registerData.email" />
                </tiny-form-item>
                <tiny-form-item label="昵称" prop="nick">
                    <tiny-input v-model="registerData.nick" />
                </tiny-form-item>
                <tiny-form-item label="密码" prop="password">
                    <tiny-input v-model="registerData.password" type="password" show-password />
                </tiny-form-item>
                <tiny-form-item>
                    <tiny-button type="primary" @click="submit" :loading="loading">
                        注册
                    </tiny-button>
                    <tiny-button @click="_active='Login'">
                        取消
                    </tiny-button>
                </tiny-form-item>
            </tiny-form>
        </div>
    </div>
</template>

<script setup>
import {useEndpoint} from '@opentiny/tiny-engine-http';
import {useSessionStorage} from '@vueuse/core';
import {Form as TinyForm, FormItem as TinyFormItem, Input as TinyInput, Button as TinyButton, Modal} from '@opentiny/vue';
import {defineProps, defineEmits, reactive, watch, ref} from 'vue';
const endpoint = useEndpoint();
const props = defineProps(['modelValue', 'active']);
const emits = defineEmits(['update:modelValue', 'update:active'])
const _active = ref(props.active);
const form = ref();
const loading = ref(false);
const storage = useSessionStorage('token', '');
const userName = useSessionStorage('userName', '');
watch(_active, ()=>{
    emits('update:active', _active.value)
})
const registerData = reactive({
    email: props.modelValue.email ?? '',
    nick: props.modelValue.nick ?? '',
    password: props.modelValue.password ?? '',
})
const rules = {
    email: {
        type: 'email',
        required: true,
    },
    nick: {
        type: 'string',
        required: true,
    },
    password: {
        type: 'string',
        required: true
    }
}
watch(registerData, () => {
    emits('update:modelValue', registerData);
})
const submit = () => {
    form.value.validate((valid) => {
        if (!valid){
            return;
        }
        endpoint.post('/endpoint/user/reg',registerData)
        .then(()=>endpoint.post('/endpoint/user/login', {email: registerData.email, password: registerData.password}))
        .then(({jwt, nick})=>{
            Modal.message({
                status: 'success',
                message: '登陆成功!',
            })
            storage.value = jwt;
            userName.value = nick;
            window.location.href= '/dashboard.html'
        })
        .catch((reason) => {
            Modal.message({
                status: 'error',
                message: reason,
            })
            
        })
        .finally(()=>{
            loading.value = false;
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