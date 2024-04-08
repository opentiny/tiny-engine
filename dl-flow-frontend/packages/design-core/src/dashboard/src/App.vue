<script setup>
import {IconUser} from '@opentiny/vue-icon';
import {Button, DialogBox,Form as TinyForm,FormItem,Input as TinyInput, Notify} from '@opentiny/vue';
import {useProjects} from '@opentiny/tiny-engine-controller';
import List from './components/List';
import ListItem from './components/ListItem';
import Empty from './components/empty.vue'
import {useSessionStorage} from '@vueuse/core';
import { reactive, ref, computed } from 'vue';
/**
 * @param {number} hours
 */
const getWelcomeMessage = (hours) => {
    if (hours > 23 && hours <= 6){
        return '凌晨好'
    }
    if (hours > 6 && hours <= 10){
        return '上午好'
    }
    if (hours > 10 && hours <= 14){
        return '中午好'
    }
    if (hours > 14 && hours <= 16){
        return '下午好'
    }
    if (hours > 16 && hours <= 23){
        return '晚上好'
    }
}
const userName = useSessionStorage('userName', '')
const welcomeMessage = `${getWelcomeMessage(new Date().getHours())},${userName.value}`
const {getProjects, newProject} = useProjects();
const projectInfo = reactive({
    projectName: ''
})
const {res, nextPage, canLoad} = getProjects()
const dialogVisible = ref(false);
const createProject = () =>{
    newProject(projectInfo.projectName)
    .then((data)=>{
        Notify({
            type: 'success',
            message: '创建成功'
        })
        res.project.push(data);
        projectInfo.projectName = '';
        dialogVisible.value = false;
    })
    .catch((reason) => {
        Notify({
            type: 'error',
            message: reason
        })
    })
}
const iconUser = IconUser();
const isEmpty = computed(() => res.project.length === 0);
const loadMore = () => {
    if (isEmpty.value){
        return;
    }
    if (!canLoad.value){
        return;
    }
    nextPage()
}
const storageState = (id) => {
    window.location.href = `/?projectId=${id}`
}

</script>

<template>
    <div class="dashboard">
        <h1 class="dashboard__title">{{welcomeMessage}}</h1>
        <div class="dashboard__tool-bar">
            <Button :reset-time="500"  @click="() => dialogVisible = true">
                创建项目
            </Button>
        </div>
        <div class="dashboard__projects">
            <list @scroll-finish="loadMore">
                <Empty v-if="isEmpty" />
                <list-item v-else v-for="item of res.project" :key="item.id" class="dashboard__projects-item">
                    <div class="dashboard__projects__item">
                        <div class="dashboard__projects__item__title">
                            {{ item.name }}
                        </div>
                        <div class="dashboard__projects__item__footer">
                            <div>
                                <icon-user />
                            </div>
                            <span>{{ item.author.nick }}</span>
                        </div>
                    </div>
                    <template #suffix>
                        <div class="dashboard__projects__item__suffix">
                            <span @click="()=>storageState(item.projectId)" class="dashboard__projects__item__link">
                                进入
                            </span>
                            <!-- <Link @click="()=>storageState(item.projectId)" :href="``">
                                
                            </Link> -->
                        </div>
                    </template>
                </list-item>
            </list>
        </div>
        <dialog-box :visible="dialogVisible" title="创建项目">
            <tiny-form :model="projectInfo">
                <form-item label="项目名称" required>
                    <tiny-input v-model="projectInfo.projectName" required />
                </form-item>
            </tiny-form>
            <template #footer>
                <Button type="primary" @click="createProject">
                    确认
                </Button>
                <Button @click="()=>dialogVisible=false">
                    再想想
                </Button>
            </template>
        </dialog-box>
    </div>
</template>

<style lang="less">
h1,h2,h3,h4,h5,h6{
    margin: 0;
}
html,body, #app{
    width: 100%;
    min-height: 100%;
    padding: 0;
    margin: 0%;
    background: #fdfdfd;
}
.dashboard{
    padding-top: 64px;
    max-width: 640px;
    width: 100%;
    margin: auto;
    &__tool-bar {
        display: flex;
        margin-bottom: 16px;
        justify-content: flex-end;
    }
    &__title{
        margin-bottom: 64px;
    }
    &__projects {
        padding-bottom: 64px;
        &-item {
            align-items: center;
        }
        &__item {
            display: flex;
            flex-direction: column;
            gap: 8px;
            &__title {
                font-size: var(--ti-common-font-size-2);
            }
            &__footer{
                display: flex;
                gap: 8px;
                align-items: center;
                font-size: var(--ti-common-font-size-base);
            }
            &__link{
                cursor: pointer;
                transition: all 200ms ease;
                &:hover {
                    color: rgb(16, 60, 255);
                }
            }
        }
    }
}
</style>