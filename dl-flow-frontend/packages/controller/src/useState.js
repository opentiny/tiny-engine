import {reactive} from 'vue';
const state = reactive({
    saving: false
})

const useState = () => state;


export default useState;