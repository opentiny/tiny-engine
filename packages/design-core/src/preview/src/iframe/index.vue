<template>
    <div>
        <iframe v-if="show" ref="iframeRef" frameborder="0" :src="src" style="border: 1px solid #ccc;"
            class="iframe"></iframe>
    </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

export default {
    props: {
        src: {
            type: String,
            required: true,
        },
        show: {
            type: Boolean,
            required: true,
        },
        initialMessage: {
            type: Object,
            required: true,
        },
        isDebug: {
            type: Function,
            required: false,
        },
    },
    setup(props) {
        const iframeRef = ref(null)
        const timer = ref(null)

        // 发送消息到 iframe
        const sendMessageToIframe = async (message) => {
            await nextTick()
            if (iframeRef.value && iframeRef.value.contentWindow) {
                iframeRef.value.contentWindow.postMessage({ key: 'files', type: 'files', message }, 'http://127.0.0.1:5173/');
            }
        };

        const receiveMessage = (event) => {
            if (event.data === 'OK') {
                clearInterval(timer.value)
            }
        }

        onMounted(async () => {
            timer.value = setInterval(() => {
                sendMessageToIframe({ ...props.initialMessage, ...props.isDebug });
            }, 500)

            window.addEventListener('message', receiveMessage);
        });

        onBeforeUnmount(() => {
            window.removeEventListener('message', receiveMessage);
        });

        return { iframeRef, sendMessageToIframe };
    },
};
</script>

<style scoped>
/* 添加样式 */
.iframe {
    width: 100%;
    height: 100vh
}
</style>