<template>
  <div v-if="showCheckbox && displayTable" class="table-selection">
    <tiny-checkbox :modelValue="props.checked" @change="handleCheck"></tiny-checkbox>
  </div>
  <div class="block-item-img">
    <img
      v-if="item.screenshot"
      class="item-image"
      :src="item.screenshot || defaultImg"
      draggable="false"
      @error="$event.target.src = defaultImg"
    />
    <svg-icon v-else class="item-image item-default-img" name="block-default"></svg-icon>
    <div v-if="showCheckbox && !displayTable" class="top-left">
      <tiny-checkbox :modelValue="props.checked" @change="handleCheck"></tiny-checkbox>
    </div>
  </div>
</template>

<script setup>
import { Checkbox as TinyCheckbox } from '@opentiny/vue'
import { defineEmits, defineProps } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({})
  },
  checked: {
    type: Boolean,
    default: false
  },
  // 是否显示多选框
  showCheckbox: {
    type: Boolean,
    default: false
  },
  displayTable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['check'])

const defaultImg =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAA11JREFUaEPtmUvIVVUYhp83CIJKpIsOEsSBAxEiEAwqRDGDBCmRkCwhwQQbSANDEbwNgvgzxEIUCwRBEB2EgiQR5MA/RcHImRBKkYhYaAliULzxwT6y3O1zzv735Rx+PN/srP1d3ve7rLX2PmKSiyY5fkYEhl3BUQVGFaiZgQdayPZTwOvA7Jp+2zI/C5yV9FcnQJ7AB8DetqI35HdM0qZuBL4HFjYUqC03pyUteigIPMC0rXSW8Ws77YzSFRgRKJPdMjqtVcD2DOC6pH/LAKmq0zgB2+uAXcCTwD1gs6Q9VQH2s2uDwO/A00ngv4EnJP3TD0zneZaEt4GvJB3uZdcoAdsBPAjkZaakX8sQsP0ecDDR/UhSVLRQGiUQEWzfAKYl0e4CU8rMgu0XgXMFSNdJ+rKIQRsE1gBjwDPAbWCLpH39sm97CvADMLeL7kpJR/PPGieQ9PGzkm72A57oB7i3Ev1vsstjZylmaJmkU6nP1giUBZ613U5gW2LzGzAHiEE+kKz/AbwhaTwhPtyT2PZK4EiO8MuSop1iprYAHyfPrwDLJV3Kng+PgO3ngZ9y4NdL2p9rk93Ah8naj8AKSVdbayHb0c+PASck/VkwfI8CASQd2v2S1nfZbeI8WJU8O53NzLHkmt/MZc72IWB1Fuxi9Lekk7ms5oe27wXR9rfAksTPCWAqsCBbq0/A9qfAxoIsfgJ8Lum67e3AjkQnzo55kq71Gn7bATZ6/oWc7fRGCNgO4EGgm5wJEkB+P18qKbbNvmI73smDxHMFytUrYDtaJlonldgeg9TjPZBtlPRZX+SJgu2XgJiBmKNUqhGw/RpwPBvajsMvJG2wvTQjcf9dNYkYl7X3JwK+o2v7TeDrnO0FSfM7a/mvEoX7bbYVxjDNTJwdlvRuEix2o61xtQYeydbHJb1SBXziN8inB93EKmA7hifA32cNnJIU34/+J7ajCu8AccWOgb5ch0DY2o6DbVbmZ8IEAvyyBMR54FVJd+oCK2tf+SADfgbWJoHid4D/pWzwJvSqEgiQac/fAhZLipN1oFKVQB7kEknfDRR5FqwJAoUvGoMi0wSBQWEtE6f0LlTG2TB0ehKY9J/XJ/cfHMPoh7oxR/9S1s1gXftRBepmsK79qAJ1M1jX/j/bzulAKB9d1wAAAABJRU5ErkJggg=='

const handleCheck = (v) => {
  emit('check', v)
}
</script>

<style lang="less" scoped>
.table-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.block-item-img {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1;
  border-radius: 4px;
  background-color: var(--te-component-block-bg-color);

  .top-left {
    display: flex;
    position: absolute;
    top: 4px;
    right: 4px;
  }
}

:deep(.tiny-checkbox__label) {
  padding: 0;
}

.item-image {
  width: 84px;
  height: 48px;
  overflow: hidden;
  object-fit: cover;
}
.item-default-img {
  width: 84px;
  height: 50px;
  color: var(--te-component-common-bg-color);
}

.block-item-small-list .item-image {
  width: 30px;
  height: 30px;
  min-width: 30px;
}
</style>
