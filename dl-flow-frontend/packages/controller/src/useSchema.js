import {reactive} from 'vue';
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
 * @prop {Relation[]} relation[]
 */


/**
 * @type {Schema}
 */
const schema = reactive({
    meta:{
        start: '',
        end: '',
    },
    relation: []
})

/**
 * 
 * @param {import('@antv/x6').Cell | string} node 
 */
const setStartNode = (node)=>{
    if (!node){
        return;
    }
    schema.meta.start = node?.id ?? node;
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
}

const unsetEndNode = () => schema.meta.end = '';
const unsetStartNode = () => schema.meta.start = '';
const hasStartNode = () => schema.meta.start !== '';
const hasEndNode = () => schema.meta.end !== '';

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
    }
}