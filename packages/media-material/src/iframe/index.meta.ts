import { NPM } from "../const.meta";
import { Component, ComponentEvent, Snippet } from "../type";
import { ComponentName, EVENT_NAMES } from "./const";


const CommEvent: Record<string, ComponentEvent> = {}
EVENT_NAMES.forEach(name => {
    const evtName = `on${name.replace(name[0], name[0].toLocaleUpperCase())}`
    CommEvent[evtName] = {
        label: {
            zh_CN: evtName,
        },
        description: {
            zh_CN: evtName,
        },
        type: 'event',
        functionInfo: {
            params: [{
                name: "event",
                type: "Object",
                defaultValue: "",
                description: {
                    zh_CN: "event"
                }
            }],
        },
        defaultValue: ""
    }
})

const CommProp = {
    required: true,
    readOnly: false,
    disabled: false,
    cols: 12,
    labelPosition: "top",
}
export const IframeDesc: Component = {
    name: {
        zh_CN: '嵌入网页'
    },
    npm: {
        ...NPM,
        exportName: ComponentName
    },
    component: ComponentName,
    icon: 'iframe',
    group: "多媒体组件",
    category: "多媒体",
    description: '嵌入网页',
    schema: {
        properties: [
            {
                name: '0',
                label: {
                    zh_CN: '基础属性',
                },
                description: {
                    zh_CN: '基础属性',
                },
                content: [
                    {
                        ...CommProp,
                        property: 'src',
                        type: 'string',
                        description: {
                            zh_CN: '网页地址'
                        },
                        widget: {
                            component: 'MetaInput',
                            props: {}
                        }
                    },
                    {
                        ...CommProp,
                        property: 'width',
                        type: 'string',
                        description: {
                            zh_CN: '宽度'
                        },
                        widget: {
                            component: 'MetaInput',
                            props: {}
                        }
                    },
                    {
                        ...CommProp,
                        property: 'height',
                        type: 'string',
                        description: {
                            zh_CN: '高度'
                        },
                        widget: {
                            component: 'MetaInput',
                            props: {}
                        }
                    },
                    {
                        ...CommProp,
                        property: 'name',
                        type: 'string',
                        description: {
                            zh_CN: '网页名称,用于定位嵌入的浏览上下文的名称'
                        },
                        widget: {
                            component: 'MetaInput',
                            props: {}
                        }
                    },
                    {
                        ...CommProp,
                        property: 'referrerpolicy',
                        type: 'string',
                        description: {
                            zh_CN: '表示在获取 iframe 资源时如何发送 referrer 首部'
                        },
                        widget: {
                            component: 'MetaSelect',
                            props: {
                                options: [
                                    { value: 'no-referrer', label: '不发送' },
                                    { value: 'no-referrer-when-downgrade', label: '仅在从 HTTPS 到 HTTP 时发送' },
                                    { value: 'origin', label: '只发送域名' },
                                    { value: 'origin-when-cross-origin', label: '跨域时只发送域名' },
                                    { value: 'same-origin', label: '同源时发送完整的 referrer' },
                                    { value: 'strict-origin', label: '同源并且同协议时发送完整的 referrer' },
                                    { value: 'strict-origin-when-cross-origin', label: '跨域并且是HTTPS时发送完整的 referrer' },
                                    { value: 'unsafe-url', label: '总是发送' },
                                ]
                            }
                        }
                    },

                ]
            }
        ],
        events: { ...CommEvent },
    },
    configure: {
        loop: true,
        condition: true,
        styles: true,
        shortcuts: {
            properties: ['src', 'width', 'height']
        },
    }
}

export const IframeSnippet: Snippet = {
    icon: 'iframe',
    snippetName: ComponentName,
    name: {
        zh_CN: '嵌入网页'
    },
    screenshot: '',
    schema: {
        componentName: ComponentName,
        props: {
            src: 'https://opentiny.design/',
            width: '100%',
            height: '350px',
        },
    }
}