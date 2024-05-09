<template>
    <MVideo ref="videoRef" src="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4" poster="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg" />
</template>

<script setup>

import { ref, onMounted } from 'vue'
import { MVideo } from 'media-material'
const videoRef = ref(null)

onMounted(() => {
    console.log(videoRef.value)
})
</script>