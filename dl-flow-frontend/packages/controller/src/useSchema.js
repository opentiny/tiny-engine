import {reactive} from 'vue';
import { Channel } from '../utils';
/**
 * @typedef {Object} Meta
 * @prop {string|string[]} [start] 整个流程图起始节点ID
 * @prop {string|string[]} [end] 整个流程图结束节点的ID
 */
/**
 * @typedef {Object} Relation
 * @prop {string} source
 * @prop {string} target
 */
/**
 * @typedef {Object} Schema
 * @prop {Meta} meta
 * @prop {{cells: import('@antv/x6').Cell[], edges: import('@antv/x6').Edge[]}} payload
 */


/**
 * @type {import('vue').UnwrapNestedRefs<Schema>}
 */
const schema = reactive({
    meta:{
        start: '',
        end: '',
    },
    payload: {
        cells: [],
        edges: []
    }
})

const eventEmitter = new Channel();

/**
 * 
 * @param {()=>void} cb 
 */
const onSchemaChange = (cb) => {
    eventEmitter.on('schema-change', cb);
}

const notifyChange = () => {
    eventEmitter.emit('schema-change', schema);
}

/**
 * 
 * @param {import('@antv/x6').Cell | string} node 
 */
const setStartNode = (node)=>{
    if (!node){
        return;
    }
    schema.meta.start = node?.id ?? node;
    notifyChange()
}
/**
 * 
 * @param {import('@antv/x6').Cell | string} node 
 */
const setEndNode = (node) => {
    if (!node){
        return;
    }
    schema.meta.end = node?.id ?? node;
    notifyChange()
}

const unsetEndNode = () => {
    schema.meta.end = '';
    notifyChange();
}
const unsetStartNode = () => {
    schema.meta.start = '';
    notifyChange();
}
const hasStartNode = () => {
    schema.meta.start !== '';
    notifyChange();
}
const hasEndNode = () => {
    schema.meta.end !== '';
    notifyChange();
}

/**
 * 
 * @param {import('@antv/x6').Cell|string} cell
 */
const isStartNode = (cell) => (cell?.id ?? cell) === schema.meta.start;
/**
 * 
 * @param {import('@antv/x6').Cell|string} cell
 */
const isEndNode = (cell) => (cell?.id ?? cell) === schema.meta.end;

const clearStartNode = () => schema.meta.start = '';
const clearEndNode = () => schema.meta.end = '';

const updateSchema = (obj) => {
    schema.payload = obj;
    notifyChange();
}


export default ()=>{
    return {
        schema,
        setStartNode,
        setEndNode,
        unsetEndNode,
        unsetStartNode,
        hasStartNode,
        hasEndNode,
        isStartNode,
        isEndNode,
        clearStartNode,
        clearEndNode,
        updateSchema,
        onSchemaChange,
        notifyChange
    }
}