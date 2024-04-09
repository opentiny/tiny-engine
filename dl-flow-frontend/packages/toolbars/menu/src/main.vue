<script setup lang="ts">
import exportToolBar from 'dl-flow-toolbar-export';
import saveTool from 'dl-flow-toolbar-save';
import { Dropdown,DropdownItem, DropdownMenu } from '@opentiny/vue';
import menuIcon from './menu-icon.vue';
const toDashboard = () => {
    window.location.href = '/dashboard.html';
}
const save = () => saveTool.api.saveSchema();
const {openDialog} = exportToolBar.api.useExport();
// console.log(exportToolBar.api);
</script>

<template>
    <div class="menu">
        <dropdown title="" trigger="click">
            <menu-icon />
            <template #suffix-icon>
            </template>
            <template #dropdown>
                <dropdown-menu placement="bottom-start">
                    <dropdown-item @click="toDashboard">
                        返回首页
                    </dropdown-item>
                    <dropdown-item @click="save">
                        保存
                    </dropdown-item>
                    <dropdown-item @click="openDialog">
                        导出
                    </dropdown-item>
                </dropdown-menu>
            </template>
        </dropdown>
    </div>
</template>


<style scoped lang="less">
.menu {
    margin-left: 16px;
}
</style>