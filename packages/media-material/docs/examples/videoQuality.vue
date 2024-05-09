<template>
    <MVideo 
    ref="videoRef"
    :src="source"
    :quality="720"
    poster="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg" />
</template>
<script setup>

import { ref, onMounted, reactive } from 'vue'
import { MVideo } from 'media-material'


const videoRef = ref(null)
const source = reactive([
    { src: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4", type: "video/mp4", size: "576"},
    { src: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4", type: "video/mp4", size: "720"},
    { src: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4", type: "video/mp4", size: "1080"},
])

onMounted(() => {
    console.log(videoRef.value)
})
</script>