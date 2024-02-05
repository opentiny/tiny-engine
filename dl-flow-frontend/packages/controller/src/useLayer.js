import {ref} from 'vue';
import {useEndpoint} from '@opentiny/tiny-engine-http'

let cache = null;
const layers = ref([]);
const http = useEndpoint();

const fetchLayer = (cacheExpire = 1000 * 60 * 15) => {
    return async ()=>{
        if (cache){
            return cache
        }
        if (!cache){
            setTimeout(() => {
                cache = null;
            }, cacheExpire);
        }
        cache = http.get('/endpoint/layer');
    }
}
const flushCache = () => {
    cache = null;
    return true;
}
/**
 * 
 * @param {import('./useResource').LayerItem} layer 
 */
const createLayer = async (layer) => {
    const loading = ref(true);
    const error = ref(false);
    const reason = ref(null);
    const data = ref();
    http.post('/endpoint/layer', layer)
        .then((payload) => {
            data.value = payload;
            layers.value.push(payload);
        })
        .catch((errReason) => {
            reason.value = errReason;
            error.value = false;
        })
        .finally(()=>loading.value=false)
    return {
        loading,error,reason,data
    }
}

const getLayer = () => {
    const loading = ref(true);
    const error = ref(false);
    const reason = ref(false);
    const fetcher = fetchLayer();
    if (!cache){
        fetcher();
    }
    if (cache){
        if (cache instanceof Promise){
            cache.then((data) => {
                layers.value = data;
            })
        }
    }
    return {loading,error,reason};
}

export default  () => {
    return {
        createLayer,
        getLayer,
        flushCache,
        fetch,
        layers
    }
}