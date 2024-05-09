/**
 * @typedef {Object} ProjectItem
 * @prop {string} name                         Project Name
 * @prop {{nick: string}} author               Project author
 * @prop {number} createAt                     Project created timestamp
 * @prop {number} projectId                    Id of project
 * @prop {Object} data
 * @prop {Object} graphData
 */
/**
 * @typedef {Object} Project
 * @prop {number} projectId
 * @prop {string} name
 * @prop {string} author
 * @prop {number} createAt
 * @prop {boolean} removed
 * @prop {Object} schema
 */

import { useEndpoint } from '@opentiny/tiny-engine-http';
import { reactive, ref } from 'vue';
const ep = useEndpoint();

const newProject = (name) => {
    return ep.post('/endpoint/project/', {name})
}

const deleteProject = (id) => {
    return ep.delete(`/endpoint/project`, {query: {id}});
}

const rename = (id, name) => {
    return ep.patch(`/endpoint/project/${id}`, {name})
}

const save = (id, schema, graphData) => {
    return ep.patch(`/endpoint/project/${id}`, {
        data: schema,
        graphData
    })
}

/**
 * 
 * @param {number} page 
 */
const getProjects = (page=0) => {
    let _page = page;
    /**
     * @type {{project: ProjectItem[], totalPages: number}}
     */
    const res = reactive({
        project: [],
        totalPages: 0
    });
    const canLoad = ref(true);
    const nextPage = () => {
        if (_page === res.totalPages){
            return;
        }
        ep.get('/endpoint/project', {params: {
            page: _page + 1
        }})
        .then((data)=>{
            canLoad.value = data.projects.length!==0
            res.totalPages = data.totalPages;
            res.project.push(...data.projects);
            _page += 1;
        });
    }
    ep.get('/endpoint/project', {params: {_page}})
    .then((data)=>{
        canLoad.value = data.projects.length!==0
        res.totalPages = data.totalPages;
        res.project = data.projects;
    });
    return {res, nextPage, canLoad}
}

/**
 * 
 * @param {number} id 
 */
const getProjectInfo = (id) => {
    /**
     * @type {import('vue').Ref<ProjectItem>}
     */
    const data = ref(null);
    const error = ref(false);
    const loading = ref(true);
    ep.get(`/endpoint/project/${id}`)
    .then((res)=>{
        data.value = res;
    })
    .catch(()=>{
        error.value = true;
    })
    .finally(()=>{
        loading.value = false;
    })
    return {data, loading, error};
}

const  useProjects = () => {
    return {
        getProjects,
        deleteProject,
        rename,
        save,
        newProject,
        getProjectInfo
    }
}

export default useProjects