import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import path from 'path';
import { ensureFileSync } from 'fs-extra';
import { writeFileSync } from 'fs';
import { mergeConfig } from 'vite';

const rootDir = process.cwd();
const SOURCE_PATH = path.join(rootDir, './src/components.ts');
const META_PATH = path.join(rootDir, './src/meta.ts');
const META_BUNDLE = path.join(rootDir, 'dist/assets/bundle.json');

export const getBuildLibConfig = (config) => {
    const defaultConfig = defineConfig({
        outDir: 'dist',
        plugins: [
            vue(),
            vueJsx(),
            vanillaExtractPlugin(),
        ],
        build: {
            emptyOutDir: true,
            minify: false,
            lib: {
                entry: SOURCE_PATH,
                name: 'MediaPlayer',
                fileName: () => {
                    return `index.es-browser.js`;
                },
                formats: ['es'],
            },
            rollupOptions: {
                external: ['vue'],
                output: {
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name === 'style.css') return `index.css`;
                        return assetInfo.name;
                    },
                    exports: 'named',
                    globals: {
                        vue: 'Vue',
                    },
                },
            },
        },
    }) 
    return mergeConfig(defaultConfig, config)
}


export default function TransformMetaToJSON() {
    return {
      name: 'transform-meta-to-json',
      async writeBundle(options, bundle) {
        eval((bundle['meta.js'].code))
        const meta = globalThis.MediaMeta.meta;
        const metaJson = JSON.stringify(meta, null, 2);
        ensureFileSync(META_BUNDLE)
        writeFileSync(META_BUNDLE, metaJson)
        console.log('built dist/assets/bundle.json')
      },
    }
  }

export const getBuildMetaConfig = (config) => {
    const defaultConfig = defineConfig({
        outDir: 'dist',
        plugins: [
            vue(),
            vueJsx(),
            vanillaExtractPlugin(),
            TransformMetaToJSON()
        ],
        define: {
            'process.env': {
                HOST: 'http://localhost'
            },
        },
        build: {
            emptyOutDir: false,
            lib: {
                entry: META_PATH,
                name: 'MediaMeta',
                fileName: () => {
                    return `meta.js`;
                },
                formats: ['umd'],
            },
        }
    }) 
    return mergeConfig(defaultConfig, config)
}