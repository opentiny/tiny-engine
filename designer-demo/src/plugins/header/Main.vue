<template>
  <div class="github-plugin">
    <tiny-engine-logo></tiny-engine-logo>
    <tiny-dropdown :show-icon="false" class="github-dropdown">
      <github-icon></github-icon>
      <template #dropdown>
        <tiny-dropdown-menu>
          <tiny-dropdown-item>
            <a class="link" href="https://github.com/opentiny/tiny-engine" target="_blank" rel="noopener noreferrer">
              TinyEngine 前端设计器
            </a>
          </tiny-dropdown-item>
          <tiny-dropdown-item>
            <a
              class="link"
              href="https://github.com/opentiny/tiny-engine-backend-java"
              target="_blank"
              rel="noopener noreferrer"
            >
              TinyEngine Java 后端
            </a>
          </tiny-dropdown-item>
        </tiny-dropdown-menu>
      </template>
    </tiny-dropdown>
  </div>
</template>
<script lang="jsx" setup>
import { TinyDropdown, TinyDropdownMenu, TinyDropdownItem } from '@opentiny/vue'
import GithubIcon from './GithubIcon.vue'
import TinyEngineLogo from './Logo.vue'
</script>
<style lang="less" scoped>
.github-plugin {
  display: flex;
  align-items: center;
  column-gap: 10px;
  margin-left: 10px;
}
.link {
  color: #191919;
}
.tiny-dropdown.github-dropdown {
  display: flex;
  align-items: center;
  :deep(.tiny-dropdown__title) {
    display: flex;
    align-items: center;
  }
  :deep(.tiny-dropdown__trigger) {
    .tiny-svg {
      fill: #191919;
      &:hover {
        fill: #191919;
      }
    }
  }
}
</style>
