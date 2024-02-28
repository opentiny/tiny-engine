import {io} from 'socket.io-client';
import {useSessionStorage} from '@vueuse/core'

const token = useSessionStorage('token', '');

const client = io({
    path: '/socket.io',
    retries: 0,
    extraHeaders: {
        authorization: token.value
    }
})

client.on('unauth', ()=>{
    window.location.href = '/authentication.html'
})

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

/**
 * 
 * @param {(fileName: string)=>void} cb 
 */
const onDone = (cb) => {
    client.on('done', cb);
}

export default ()=>{
    /**
     * 
     * @param {(socket: import('socket.io-client').Socket)=>void} cb 
     */
    return {
        client,
        onConnect,
        onProgess,
        onFinish,
        onError,
        onDone
    }
}