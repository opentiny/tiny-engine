<template>
    <MAudio ref="audioRef" src="https://cdn.plyr.io/static/demo/Kishi_Bashi_-_It_All_Began_With_a_Burst.mp3" />
</template>

<script setup>

import { ref, onMounted } from 'vue'
import { MAudio } from 'media-material'
const audioRef = ref(null)

onMounted(() => {
    console.log(audioRef.value)
})
</script>