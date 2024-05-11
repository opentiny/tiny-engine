/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { defineCustomElement } from '@opentiny/tiny-engine-webcomponent-core'
import * as vue from 'vue'
import {
  resolveComponent,
  openBlock,
  createElementBlock,
  createElementVNode,
  Fragment,
  renderList,
  toDisplayString,
  normalizeClass,
  createVNode,
  withCtx,
  createBlock,
  createCommentVNode,
  pushScopeId,
  popScopeId
} from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import { IconCheckOut, IconDeltaDown, IconGroup, IconHelpQuery, IconSetting, IconYes } from '@opentiny/vue-icon'
import { Popover, Tooltip } from '@opentiny/vue'
Object.freeze({})
Object.freeze([])
const cacheStringFunction = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null)
  return (str) => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }
}
const hyphenateRE = /\B([A-Z])/g
const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, '-$1').toLowerCase())
const _style_0 =
  '\n.team-list-item.active[data-v-b66e3972] {\r\n  border: 1px solid #38acff;\n}\n.toolbars-item[data-v-b66e3972]:hover {\r\n  cursor: pointer;\r\n  background-color: #f1f2f3;\n}\n.toolbars-item.active[data-v-b66e3972] {\r\n  background-color: #e5e6e8;\n}\n'
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc
  for (const [key, val] of props) {
    target[key] = val
  }
  return target
}
const _sfc_main = {
  components: {
    TinyIconCheckOut: IconCheckOut(),
    TinyIconDeltaDown: IconDeltaDown(),
    TinyIconGroup: IconGroup(),
    TinyIconHelpQuery: IconHelpQuery(),
    TinyIconSetting: IconSetting(),
    TinyIconYes: IconYes(),
    TinyPopover: Popover,
    TinyTooltip: Tooltip
  },
  props: {
    tenant: { type: Object, default: () => "{tenant_id: 'public'}" }
  },
  emits: ['handle-route'],
  setup(props, context) {
    const { t, lowcodeWrap } = vue.inject(I18nInjectionKey).lowcode()
    const wrap = lowcodeWrap(props, context, t)
    const state = vue.reactive({
      menuData: [
        {
          label: '\u9996\u9875',
          url: '/home'
        },
        {
          label: '\u6211\u7684\u5E94\u7528',
          url: '/home'
        },
        {
          label: '\u5E94\u7528\u4E2D\u5FC3',
          url: '/home'
        },
        {
          label: '\u6211\u7684\u5E73\u53F0',
          url: '/home'
        },
        {
          label: '\u5E73\u53F0\u4E2D\u5FC3',
          url: '/home'
        },
        {
          label: '\u6211\u7684\u7269\u6599',
          url: '/home'
        },
        {
          label: '\u751F\u6001\u4E2D\u5FC3',
          url: '/home'
        },
        {
          label: '\u76D1\u63A7\u4E2D\u5FC3',
          url: '/home'
        }
      ],
      tenants: [
        {
          id: 1,
          tenant_id: 'public',
          name_cn: '\u516C\u5171\u79DF\u6237',
          name_en: 'Public Tenant',
          description: 'Default tenant for new user to explore.',
          published_at: '2021-12-28T11:39:10.000Z',
          created_by: null,
          updated_by: null,
          created_at: '2021-12-28T11:39:10.000Z',
          updated_at: '2022-06-27T03:52:15.000Z',
          createdBy: null
        },
        {
          id: 2,
          tenant_id: 'crm',
          name_cn: '\u5BA2\u6237\u5173\u7CFB\u7BA1\u7406\u7CFB\u7EDF',
          name_en: 'Cloud CRM',
          description: null,
          published_at: '2021-12-30T07:39:19.000Z',
          created_by: null,
          created_at: '2021-12-30T14:41:57.000Z',
          updated_at: '2022-06-14T06:28:08.000Z',
          createdBy: null
        },
        {
          id: 3,
          tenant_id: 'tinyMock',
          name_cn: 'mock\u5E73\u53F0',
          name_en: null,
          description: null,
          published_at: '2022-05-26T07:13:28.000Z',
          created_by: null,
          updated_by: null,
          created_at: '2022-05-26T07:13:29.000Z',
          updated_at: '2022-05-26T07:13:29.000Z',
          createdBy: null,
          updatedBy: null
        },
        {
          id: 4,
          tenant_id: 'tinyStage',
          name_cn: '\u5F00\u53D1\u5DE5\u5177\u96C6',
          name_en: 'toolkits',
          description: null,
          published_at: '2022-05-18T07:56:55.000Z',
          created_by: null,
          updated_by: null,
          created_at: '2022-05-18T07:56:55.000Z',
          updated_at: '2022-05-18T07:56:55.000Z'
        },
        {
          id: 5,
          tenant_id: 'tinyUI',
          name_cn: 'UI\u7EC4\u4EF6',
          name_en: 'components',
          description: null,
          published_at: '2022-05-18T08:29:32.000Z',
          created_by: null,
          updated_by: null,
          created_at: '2022-05-18T08:29:32.000Z',
          updated_at: '2022-05-18T08:29:33.000Z'
        },
        {
          id: 6,
          tenant_id: 'tinyGate',
          name_cn: '\u95E8\u7981\u7CFB\u7EDF',
          name_en: 'gate',
          description: null,
          published_at: '2022-06-23T10:15:42.000Z',
          created_by: null,
          updated_by: null,
          created_at: '2022-05-23T10:40:14.000Z',
          updated_at: '2022-05-23T10:40:14.000Z',
          createdBy: null,
          updatedBy: null
        },
        {
          id: 7,
          tenant_id: 'guestGroup',
          name_cn: '\u6E38\u5BA2\u56E2\u961F',
          name_en: 'guest',
          description: null,
          published_at: '2022-06-23T10:15:38.000Z',
          created_by: null,
          updated_by: null,
          created_at: '2022-06-22T14:58:22.000Z',
          updated_at: '2022-06-22T14:58:22.000Z'
        },
        {
          id: 265,
          tenant_id: 'myteam',
          name_cn: null,
          name_en: null,
          description: null,
          published_at: '2022-06-14T06:49:58.000Z',
          created_by: null,
          updated_by: null,
          created_at: '2022-06-14T06:49:58.000Z',
          updated_at: '2022-06-14T06:49:58.000Z'
        },
        {
          id: 267,
          tenant_id: 'test',
          name_cn: null,
          name_en: null,
          description: null,
          published_at: '2022-06-15T03:35:14.000Z',
          created_by: null,
          updated_by: null,
          created_at: '2022-06-15T03:35:14.000Z',
          updated_at: '2022-06-15T03:35:14.000Z'
        },
        {
          id: 268,
          tenant_id: 'zzcTest',
          name_cn: null,
          name_en: null,
          description: null,
          published_at: '2022-06-17T08:47:17.000Z',
          created_by: null,
          updated_by: null,
          created_at: '2022-06-17T08:47:17.000Z',
          updated_at: '2022-06-17T08:47:17.000Z'
        }
      ]
    })
    const openHomePage = wrap(function openHomePage2(event) {
      this.router.push('/team-home')
    })
    const gotoRouter = wrap(function gotoRouter2(event) {
      this.emit('handle-route', event)
    })
    const attrs = wrap({
      state,
      openHomePage,
      gotoRouter
    })
    return attrs
  }
}
const _withScopeId = (n) => (pushScopeId('data-v-b66e3972'), (n = n()), popScopeId(), n)
const _hoisted_1 = {
  style: {
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'center',
    height: '50px',
    'border-radius': '0px'
  }
}
const _hoisted_2 = /* @__PURE__ */ _withScopeId(() =>
  /* @__PURE__ */ createElementVNode(
    'img',
    {
      src: 'http://localhost:9090/assets/images/bbb35cd0-db30-11ec-a1c4-7b3b3de0a1d8.png',
      style: { display: 'block', width: '48px', height: 'auto', 'margin-left': '10px' }
    },
    null,
    -1
  )
)
const _hoisted_3 = /* @__PURE__ */ _withScopeId(() =>
  /* @__PURE__ */ createElementVNode('span', { style: { 'font-weight': 'bolder', color: '#000000' } }, 'TinyEngine', -1)
)
const _hoisted_4 = [_hoisted_2, _hoisted_3]
const _hoisted_5 = {
  style: {
    width: '230px',
    height: '50px',
    display: 'flex',
    'justify-content': 'space-around',
    'align-items': 'center',
    'margin-right': '10px',
    'border-radius': '0px'
  },
  class: 'toolbars'
}
const _hoisted_6 = /* @__PURE__ */ _withScopeId(() =>
  /* @__PURE__ */ createElementVNode('div', { placeholder: '\u89E6\u53D1\u6E90' }, null, -1)
)
const _hoisted_7 = {
  style: {
    'padding-top': '6px',
    'padding-left': '6px',
    'padding-right': '6px',
    'padding-bottom': '6px',
    'margin-left': '8px',
    'border-radius': '6px'
  }
}
const _hoisted_8 = /* @__PURE__ */ _withScopeId(() =>
  /* @__PURE__ */ createElementVNode('div', { placeholder: '\u89E6\u53D1\u6E90' }, null, -1)
)
const _hoisted_9 = {
  style: {
    'padding-top': '6px',
    'padding-left': '6px',
    'padding-right': '6px',
    'padding-bottom': '6px',
    'margin-left': '8px',
    'border-radius': '6px'
  }
}
const _hoisted_10 = /* @__PURE__ */ _withScopeId(() =>
  /* @__PURE__ */ createElementVNode('div', { placeholder: '\u89E6\u53D1\u6E90' }, null, -1)
)
const _hoisted_11 = /* @__PURE__ */ _withScopeId(() =>
  /* @__PURE__ */ createElementVNode(
    'span',
    {
      class: 'split',
      style: { margin: '0 8px', 'font-size': '16px', 'border-radius': '0px', color: '#e5e6e8' }
    },
    '|',
    -1
  )
)
const _hoisted_12 = { placeholder: '\u89E6\u53D1\u6E90' }
const _hoisted_13 = {
  class: 'toolbars-item',
  style: { padding: '6px', 'border-radius': '6px', display: 'flex', 'align-items': 'center' }
}
const _hoisted_14 = /* @__PURE__ */ _withScopeId(() =>
  /* @__PURE__ */ createElementVNode('span', { style: { 'border-radius': '0px' } }, 'public', -1)
)
const _hoisted_15 = {
  placeholder: '\u63D0\u793A\u5185\u5BB9',
  style: { 'border-radius': '0px' }
}
const _hoisted_16 = {
  style: { 'border-radius': '0px' },
  class: 'team-list'
}
const _hoisted_17 = /* @__PURE__ */ _withScopeId(() =>
  /* @__PURE__ */ createElementVNode(
    'div',
    {
      class: 'team-list-title',
      style: {
        'font-size': '16px',
        'line-height': '22px',
        'font-weight': '500',
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap',
        overflow: 'hidden'
      }
    },
    [/* @__PURE__ */ createElementVNode('span', null, '\u7EC4\u7EC7/\u56E2\u961F')],
    -1
  )
)
const _hoisted_18 = {
  class: 'team-list-group',
  style: { height: 'auto', 'max-height': '335px', overflow: 'auto', 'margin-top': '16px', 'border-radius': '0px' }
}
const _hoisted_19 = {
  class: 'team-list-item-logo',
  style: {
    height: '28px',
    width: '28px',
    'border-radius': '8px',
    'font-size': '16px',
    color: '#fff',
    background: '#38acff',
    'margin-right': '12px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center'
  }
}
const _hoisted_20 = {
  style: {
    height: '22px',
    'font-size': '14px',
    'line-height': '22px',
    color: 'rgba(0, 0, 0, 0.8)',
    flex: '1',
    'margin-right': '5px',
    overflow: 'hidden',
    'text-overflow': 'ellipsis',
    'white-space': 'nowrap',
    'border-radius': '0px'
  }
}
const _hoisted_21 = {
  style: { 'border-radius': '0px' },
  class: 'team-list-item-icon'
}
const _hoisted_22 = /* @__PURE__ */ _withScopeId(() =>
  /* @__PURE__ */ createElementVNode(
    'img',
    {
      style: { width: '40px', height: 'auto', 'border-radius': '50px' },
      src: 'https://localhost:9090/assets/images/120'
    },
    null,
    -1
  )
)
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  let _a
  const _component_tiny_icon_setting = resolveComponent('tiny-icon-setting')
  const _component_tiny_tooltip = resolveComponent('tiny-tooltip')
  const _component_tiny_icon_check_out = resolveComponent('tiny-icon-check-out')
  const _component_tiny_icon_help_query = resolveComponent('tiny-icon-help-query')
  const _component_tiny_icon_delta_down = resolveComponent('tiny-icon-delta-down')
  const _component_tiny_icon_group = resolveComponent('tiny-icon-group')
  const _component_tiny_icon_yes = resolveComponent('tiny-icon-yes')
  const _component_tiny_popover = resolveComponent('tiny-popover')
  return (
    openBlock(),
    createElementBlock('div', null, [
      createElementVNode('div', _hoisted_1, [
        createElementVNode(
          'div',
          {
            style: { display: 'flex', 'align-items': 'center', 'border-radius': '0px' },
            onClick: _cache[0] || (_cache[0] = ($event) => _ctx.openHomePage(_ctx.event))
          },
          _hoisted_4
        ),
        createElementVNode('div', null, [
          (openBlock(true),
          createElementBlock(
            Fragment,
            null,
            renderList(_ctx.state.menuData, (item, index) => {
              return (
                openBlock(),
                createElementBlock(
                  'span',
                  {
                    key: index,
                    style: { 'font-size': '16px', 'margin-left': '10px', 'margin-right': '10px', color: '#747677' },
                    onClick: _cache[1] || (_cache[1] = ($event) => _ctx.gotoRouter(_ctx.event))
                  },
                  toDisplayString(item.label),
                  1
                )
              )
            }),
            128
          ))
        ]),
        createElementVNode('div', _hoisted_5, [
          createElementVNode(
            'div',
            {
              class: normalizeClass({
                'toolbars-item': true,
                active: ((_a = _ctx.route.path) == null ? void 0 : _a.indexOf('/permission-setting')) > -1
              }),
              style: {
                'padding-top': '6px',
                'padding-left': '6px',
                'padding-right': '6px',
                'padding-bottom': '6px',
                'margin-left': '8px',
                'border-radius': '6px'
              },
              onClick: _cache[2] || (_cache[2] = ($event) => _ctx.openPermission(_ctx.event))
            },
            [
              createVNode(
                _component_tiny_tooltip,
                {
                  content: '\u8BBE\u7F6E\u4E2D\u5FC3',
                  placement: 'top',
                  manual: false,
                  modelValue: true,
                  style: { color: '#878f95' }
                },
                {
                  default: withCtx(() => [_hoisted_6, createVNode(_component_tiny_icon_setting)]),
                  _: 1
                }
              )
            ],
            2
          ),
          createElementVNode('div', _hoisted_7, [
            createVNode(
              _component_tiny_tooltip,
              {
                content: '\u534F\u8BAE\u89C4\u8303',
                placement: 'top',
                manual: false,
                modelValue: true,
                style: { 'border-radius': '0px' }
              },
              {
                default: withCtx(() => [
                  _hoisted_8,
                  createVNode(_component_tiny_icon_check_out, { style: { color: '#878f95' } })
                ]),
                _: 1
              }
            )
          ]),
          createElementVNode('div', _hoisted_9, [
            createVNode(
              _component_tiny_tooltip,
              {
                content: '\u5E2E\u52A9\u4E2D\u5FC3',
                placement: 'top',
                manual: false,
                modelValue: true,
                class: 'tip-icon',
                style: { fill: '#878f95', 'border-radius': '0px' }
              },
              {
                default: withCtx(() => [
                  _hoisted_10,
                  createVNode(_component_tiny_icon_help_query, { style: { color: '#ffffff' } })
                ]),
                _: 1
              }
            )
          ]),
          _hoisted_11,
          createVNode(
            _component_tiny_popover,
            {
              width: 308,
              title: '\u5F39\u6846\u6807\u9898',
              trigger: 'manual',
              modelValue: true,
              placement: 'bottom-end',
              'popper-class': 'team-list-pop',
              style: { 'border-radius': '0px' }
            },
            {
              reference: withCtx(() => [
                createElementVNode('div', _hoisted_12, [
                  createElementVNode('div', _hoisted_13, [
                    _hoisted_14,
                    createVNode(_component_tiny_icon_delta_down, {
                      style: { 'font-size': '12px', 'border-radius': '0px', color: '#878f95' }
                    })
                  ])
                ])
              ]),
              default: withCtx(() => [
                createElementVNode('div', _hoisted_15, [
                  createElementVNode('div', _hoisted_16, [
                    _hoisted_17,
                    createElementVNode('div', _hoisted_18, [
                      (openBlock(true),
                      createElementBlock(
                        Fragment,
                        null,
                        renderList(_ctx.state.tenants, (item, index) => {
                          return (
                            openBlock(),
                            createElementBlock(
                              'div',
                              {
                                class: normalizeClass(['team-list-item', { active: item.id === $props.tenant.id }]),
                                key: item.id,
                                style: {
                                  display: 'flex',
                                  'align-items': 'center',
                                  height: '56px',
                                  'border-radius': '6px',
                                  'background-color': '#fff',
                                  cursor: 'pointer',
                                  padding: '8px 12px',
                                  'box-sizing': 'border-box'
                                }
                              },
                              [
                                createElementVNode('div', _hoisted_19, [
                                  createVNode(_component_tiny_icon_group, { style: { 'border-radius': '0px' } })
                                ]),
                                createElementVNode('span', _hoisted_20, toDisplayString(item.tenant_id), 1),
                                createElementVNode('div', _hoisted_21, [
                                  item.id === 1
                                    ? (openBlock(),
                                      createBlock(_component_tiny_icon_yes, {
                                        key: 0,
                                        style: { 'font-size': '20px', color: '#38acff' }
                                      }))
                                    : createCommentVNode('v-if', true)
                                ])
                              ],
                              2
                            )
                          )
                        }),
                        128
                      ))
                    ])
                  ])
                ])
              ]),
              _: 1
            }
          ),
          createVNode(_component_tiny_popover, {
            width: 200,
            title: '\u5F39\u6846\u6807\u9898',
            trigger: 'manual',
            modelValue: false,
            'append-to-body': false
          }),
          createVNode(_component_tiny_popover, {
            width: 308,
            title: '\u5F39\u6846\u6807\u9898',
            trigger: 'click',
            modelValue: false,
            placement: 'bottom-end',
            'append-to-body': false,
            'visible-arrow': false,
            'popper-class': 'team-list-pop'
          }),
          _hoisted_22
        ])
      ]),
      createVNode(_component_tiny_popover, {
        width: 200,
        title: '\u5F39\u6846\u6807\u9898',
        trigger: 'manual',
        modelValue: true
      }),
      createVNode(_component_tiny_popover, {
        width: 200,
        title: '\u5F39\u6846\u6807\u9898',
        trigger: 'manual',
        modelValue: false,
        'visible-arrow': true
      })
    ])
  )
}
const block = /* @__PURE__ */ _export_sfc(_sfc_main, [
  ['render', _sfc_render],
  ['styles', [_style_0]],
  ['__scopeId', 'data-v-b66e3972'],
  ['__file', 'D:/tmp/buildground/buildground_1673597845904/src/block/generated/components/PortalHeader.vue']
])
window.TinyLowcodeResource = window.TinyLowcodeResource || {}
const blockName = hyphenate('PortalHeader')
block.blockId = 998
block.blockVersion = '1.0.0'
if (customElements.get(blockName)) {
  if (window.TinyLowcodeResource[blockName]) {
    Object.assign(window.TinyLowcodeResource[blockName], block)
  }
} else {
  block.links = {
    VUE_APP_UI_LIB_FULL_STYLE_FILE_URL: ['//localhost:9090/assets/css/0.1.20/index.css']
  }.VUE_APP_UI_LIB_FULL_STYLE_FILE_URL
  window.TinyLowcodeResource[blockName] = block
  customElements.define(blockName, defineCustomElement(block))
}
export { block as default }
