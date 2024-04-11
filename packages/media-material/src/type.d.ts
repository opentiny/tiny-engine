export interface I18N {
    zh_CN: string
}

export interface NPMInfo {
    package?: string
    exportName?: string
    version?: string
    destructuring?: boolean
    script?: string
    css?: string
}

export interface ComponentEvent {
    label: I18N,
    description: I18N,
    type: string,
    functionInfo: {
        params: Array<{
            name: string,
            type: string,
            defaultValue: any,
            description: I18N,
        }>,
        returns?: {
            type: string,
            defaultValue: any,
            description: I18N
        }
    },
    defaultValue: string
}

export interface ComponentProp {
    property?: string
    type?: string
    defaultValue?: string| boolean | number
    label?: {
        text: I18N
    },
    description?: I18N,
    cols?: number,
    rules?: Array,
    hidden?: boolean
    required?: boolean
    readOnly?: boolean
    disabled?: boolean,
    widget?: {
        component?: string,
        props?: any
    },
    device?: string,
}

export interface ComponentProps {
    label: I18N,
    name?: string,
    description: I18N,
    collapse?: {
        number: number,
        text: {
            zh_CN: string
        }
    },
    content: ComponentProp[]
}

export interface Component {
    name: I18N
    component: string
    icon: string
    screenshot?: string
    description?: string
    npm: NPMInfo
    group: string
    category: string
    schema: {
        properties: ComponentProps[]
        events?: Record<string, ComponentEvent>,
    }
    configure?: {
        loop?: boolean
        condition?: boolean
        styles?: boolean
        isContainer?: boolean
        isModal?: boolean
        nestingRule?: {
            childWhitelist?: string
            parentWhitelist?: string
            descendantBlacklist?: string
            ancestorWhitelist?: string
        }
        isNullNode?: boolean
        isLayout?: boolean
        rootSelector?: string
        shortcuts: {
            properties: string[]
        },
        contextMenu?: {
            actions: string[],
            disable: string[]
        }
    }
    version?: string
}

export interface SnippetSchema {
    componentName: string,
    props?: any,
    children?: SnippetSchema[]
}

export interface Snippet {
    name: I18N
    icon: string
    snippetName: string
    screenshot: string
    schema: SnippetSchema
}

export interface Meta {
    data: {
        framework: string
        materials: {
            components: Component[],
            blocks?: Array,
            snippets: Array<{
                group: string,
                children: Snippet[]
            }>
        }
    }
 }