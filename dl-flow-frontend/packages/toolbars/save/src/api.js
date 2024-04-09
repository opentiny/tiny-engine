import { useSearchParam, useState, useX6 } from '@opentiny/tiny-engine-controller';
import {useSchema,useProjects,useNotify} from '@opentiny/tiny-engine-controller';
const state = useState();
export const saveSchema = () => {
    const {save} = useProjects();
    const {schema} = useSchema();
    const graphData = useX6().g.toJSON();
    let timer = setTimeout(() => {
        state.loading.value = true;
    }, 500);
    const id = useSearchParam(window.location.search).get('projectId');
    save(id, schema, graphData)
        .then(()=>{
            useNotify({
                type: 'success',
                message: '保存成功'
            })
        })
        .catch((reason)=>{
            useNotify({
                type: 'error',
                message: `保存失败: ${reason}`
            })
        })
        .finally(()=>{
            clearTimeout(timer)
            state.loading.value = false;
        })
}