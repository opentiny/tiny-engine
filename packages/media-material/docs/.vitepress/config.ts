import { defineConfig } from 'vitepress';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { navbar, sidebar } from './configs';
import path from 'path';

export default defineConfig({
    title: 'Material',
    description: '物料库文档',
    appearance: false,
    vite: {
        plugins: [vueJsx(), vanillaExtractPlugin()],
        optimizeDeps: {
            exclude: ['@vue/repl'],
        },
        ssr: {
            // lodash-es 模块是 esm，ssr 渲染的时候编译成 cjs 的引入方式，会引发 nodejs 的模块加载异常错误
            noExternal: ['lodash-es'],
            external: ['@vue/repl'],
        },
        resolve: {
            alias: {
                'media-material': path.resolve('src/components.ts')
            }
        }
    },

    head: [['link', { rel: 'icon', href: './logo.svg' }]],

    themeConfig: {
        logo: '/logo.svg',
        nav: navbar.zh,
        sidebar: sidebar.zh,

        outline: {
            label: '本页目录',
        },

        search: {
            provider: 'local',
        },

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2024-present Webank',
        },
    },
});
