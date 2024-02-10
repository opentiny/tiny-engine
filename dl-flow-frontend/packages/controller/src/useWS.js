import {ref} from 'vue';
import {io} from 'socket.io-client';

const client = io('/endpoint')
/**
 * @type {import('vue').Ref<null|import('socket.io-client').Socket>}
 */
const socket = ref(null);
/**
 * 
 * @param {(socket: import('socket.io-client').Socket)=>void} cb 
 */
const onConnect = (cb) => {
    client.on('connection', (socket) => {
        cb(socket);
    })
}

/**
 * 
 * @param {(message: string)=>void} cb 
 */
const onProgess = (cb) => {
    client.on('progress', cb);
}

const onFinish = (cb) => {
    client.on('finish', cb);
}

/**
 * 
 * @param {(reason: string)=>void} cb 
 */
const onError = (cb) => {
    client.on('err', cb);
}

export default ()=>{
    /**
     * 
     * @param {(socket: import('socket.io-client').Socket)=>void} cb 
     */
    const init = (s) => {
        socket.value = s; 
        client.off('connection', init);
    }
    if (!socket.value){
        client.on('connection', init);
    }
    return {
        socket,
        onConnect,
        onProgess,
        onFinish,
        onError
    }
}