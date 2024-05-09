import {ref} from 'vue';
import {createGlobalState} from '@vueuse/core';
const useState = createGlobalState(()=>{
    const loading = ref(false);
    const name = ref('');
    const renameLoading = ref(false);
    return {
        loading,
        name,
        renameLoading
    }
})


export default useState;