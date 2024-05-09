import { NPM } from "../const.meta";
import { Component, ComponentEvent, ComponentProp, Snippet } from "../type";
import { EVENT_NAMES, audioName, videoName } from "./const";


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

const mediaProps: ComponentProp[] = [
    {
        ...CommProp,
        property: 'src',
        type: 'string',
        label: {
            text: {
                zh_CN: '地址'
            }
        },
        description: {
            zh_CN: '输入资源地址'
        },
        widget: {
            component: 'MetaInput',
            props: {}
        }
    },
    {
        ...CommProp,
        property: 'autoplay',
        type: 'boolean',
        label: {
            text: {
                zh_CN: '自动播放'
            }
        },
        description: {
            zh_CN: '资源加载完成后是否自动播放'
        },
        defaultValue: false,
        widget: {
            component: 'MetaSwitch',
            props: {}
        }
    },
    {
        ...CommProp,
        property: 'muted',
        type: 'boolean',
        label: {
            text: {
                zh_CN: '静音播放'
            }
        },
        description: {
            zh_CN: '是否静音播放'
        },
        defaultValue: false,
        widget: {
            component: 'MetaSwitch',
            props: {}
        }
    },
    {
        ...CommProp,
        property: 'loop',
        type: 'boolean',
        label: {
            text: {
                zh_CN: '循环播放'
            }
        },
        description: {
            zh_CN: '是否循环播放'
        },
        defaultValue: false,
        widget: {
            component: 'MetaSwitch',
            props: {}
        }
    },
    {
        ...CommProp,
        property: 'currentTime',
        type: 'number',
        label: {
            text: {
                zh_CN: '快进到当前'
            }
        },
        description: {
            zh_CN: '快进到当前播放位置，范围0到资源时长'
        },
        defaultValue: 0,
        widget: {
            component: 'MetaNumber',
            props: {}
        }
    },
    {
        ...CommProp,
        property: 'volume',
        type: 'number',
        label: {
            text: {
                zh_CN: '音量'
            }
        },
        description: {
            zh_CN: '当前音量，范围0-1'
        },
        defaultValue: 0.5,
        widget: {
            component: 'MetaNumber',
            props: {}
        }
    },
    {
        ...CommProp,
        property: 'speed',
        type: 'number',
        label: {
            text: {
                zh_CN: '倍速播放'
            }
        },
        description: {
            zh_CN: '倍速播放'
        },
        defaultValue: 1,
        widget: {
            component: 'MetaSelect',
            props: {
                options: [
                    { label: '0.5倍', value: 0.5 },
                    { label: '正常', value: 1 },
                    { label: '1.5倍', value: 1.5 },
                    { label: '2倍', value: 2 },
                    { label: '4倍', value: 4 }
                ]
            }
        }
    },
    {
        ...CommProp,
        property: 'crossorigin',
        type: 'number',
        description: {
            zh_CN: '跨域策略'
        },
        defaultValue: '',
        widget: {
            component: 'MetaSelect',
            props: {
                options: [
                    {
                        "label": "匿名",
                        "value": "anonymous"
                      },
                      {
                        "label": "携带凭证",
                        "value": "use-credentials"
                      }
                ]
            }
        }
    },
] 

export const VideoDesc: Component = {
    name: {
        zh_CN: '视频'
    },
    npm: {
        ...NPM,
        exportName: videoName
    },
    component: videoName,
    icon: 'video',
    group: "多媒体组件",
    category: "多媒体",
    description: '视频组件',
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
                        description: {
                            zh_CN: '海报地址，视频播放前展示'
                        },
                        property: 'poster',
                        type: 'string',
                        widget: {
                            component: 'MetaInput',
                            props: {}
                        }
                    },
                    ...mediaProps,
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
            properties: ['src', 'poster', 'autoplay']
        },
    }
}

export const VideoSnippet: Snippet = {
    icon: 'video',
    snippetName: videoName,
    name: {
        zh_CN: '视频'
    },
    screenshot: '',
    schema: {
        componentName: videoName,
        props: {
            src: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4",
            poster: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg" 
        },
    }
}

export const AudioDesc: Component = {
    name: {
        zh_CN: '音频'
    },
    npm: {
        ...NPM,
        exportName: audioName
    },
    component: audioName,
    icon: 'audio',
    group: "多媒体组件",
    category: "多媒体",
    description: '音频组件',
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
                    ...mediaProps
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
            properties: ['src', 'autoplay']
        },
    }
}

export const AudioSnippet: Snippet = {
    icon: 'audio',
    snippetName: audioName,
    name: {
        zh_CN: '音频'
    },
    screenshot: '',
    schema: {
        componentName: audioName,
        props: {
            src: "https://cdn.plyr.io/static/demo/Kishi_Bashi_-_It_All_Began_With_a_Burst.mp3",
        },
    }
}