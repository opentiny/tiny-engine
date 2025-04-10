<template>
  <plugin-setting
    v-if="isShow"
    :fixed-name="PLUGIN_NAME.AppManage"
    :align="align"
    :title="`模板已被覆盖${state.title}`"
    class="page-plugin-setting"
  >
    <template #header>
      <button-group>
        <tiny-button type="primary" @click="savePageSetting">保存</tiny-button>
        <svg-button
          v-if="!pageSettingState.isNew"
          name="text-copy-page"
          placement="bottom"
          tips="复制页面"
          @click="copyPage"
        ></svg-button>
        <svg-button v-if="!pageSettingState.isNew" name="delete" tips="删除页面" @click="deletePage"></svg-button>
        <svg-button name="close" @click="cancelPageSetting"></svg-button>
      </button-group>
    </template>

    <template #content>
      <div class="page-setting-content">
        <tiny-collapse v-model="state.activeName" class="page-setting-collapse">
          <tiny-collapse-item title="基本设置" :name="PAGE_SETTING_SESSION.general">
            <component :is="pageGeneral" ref="pageGeneralRef" :isFolder="isFolder"></component>
          </tiny-collapse-item>

          <tiny-collapse-item
            class="base-setting"
            v-if="pageSettingState.currentPageData.group !== 'public'"
            title="输入输出"
            :name="PAGE_SETTING_SESSION.inputOutput"
          >
            <page-input-output></page-input-output>
          </tiny-collapse-item>
          <tiny-collapse-item
            class="input-output"
            v-if="pageSettingState.currentPageData.group !== 'public'"
            title="页面生命周期配置"
            :name="PAGE_SETTING_SESSION.lifeCycles"
          >
            <div class="life-cycles-container">
              <life-cycles
                :bindLifeCycles="pageSettingState.currentPageData.page_content?.lifeCycles"
                @updatePageLifeCycles="updatePageLifeCycles"
              ></life-cycles>
            </div>
          </tiny-collapse-item>

          <tiny-collapse-item class="history-source" title="历史备份" :name="PAGE_SETTING_SESSION.history">
            <page-history @restorePage="restorePage"></page-history>
          </tiny-collapse-item>
        </tiny-collapse>
      </div>
    </template>
  </plugin-setting>
</template>
