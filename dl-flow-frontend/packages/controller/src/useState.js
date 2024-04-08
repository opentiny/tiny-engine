import {reactive} from 'vue';
const state = reactive({
    loading: false
})

const useState = () => state;


export default useState;