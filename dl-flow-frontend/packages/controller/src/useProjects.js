/**
 * @typedef {Object} ProjectItem
 * @prop {string} name                  Project Name
 * @prop {{nick: string}} author        Project author
 * @prop {number} createAt              Project created timestamp
 * @prop {number} projectid                    Id of project
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
    return ep.patch('/endpoint/project', {
        query: {id},
        body: {name}
    })
}

const save = (id, schema) => {
    return ep.patch('/endpoint/project', {
        query: {id},
        body: schema
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
    const schema = ref(null);
    const loading = ref(true);
    ep.get(`/endpoint/project/${id}`)
    .then(({data})=>{
        schema.value = data;
    })
    .finally(()=>{
        loading.value = false;
    })
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