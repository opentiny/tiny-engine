<script lang="jsx">
import ConfigCollapse from './ConfigCollapse.vue'

export default {
  props: {
    group: Object,
    index: Number,
    design: Boolean,
    emptyText: {
      type: String,
      default: '空'
    }
  },
  render() {
    const list = this.group.content || []
    const { item } = this.$slots
    const number = this.group.collapse?.number || list.length
    const propNodes = list.map((data, propIndex) => item({ data, propIndex })) // 使用插槽构造vnode list

    // 将vNodes拆分为默认显示与更多两部份分别渲染
    const expandItems = propNodes.slice(0, number)
    const collapseItems = propNodes.slice(number)

    const expandNode = (
      <div class="item-container" data-group-index={this.index}>
        {expandItems.length ? expandItems : <div class="empty">{this.emptyText}</div>}
      </div>
    )

    const collapseNode = collapseItems.length ? (
      <ConfigCollapse>
        <div class="item-container" data-group-index={this.index}>
          {collapseItems}
        </div>
      </ConfigCollapse>
    ) : null

    return (
      <div style="width:100%">
        {expandNode} {collapseNode}
      </div>
    )
  }
}
</script>

<style lang="less" scoped>
.item-container {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  .empty {
    height: 40px;
    line-height: 40px;
    text-align: center;
    width: 100%;
  }
}
</style>
