import { build } from 'vite'

const buildRE = /(?:\?|&)build=(?<name>.*?)(?:&|$)/
const queryRE = /[?#].*$/

const bundleCache = new WeakMap()

function cleanUrl(url) {
  return url.replace(queryRE, '')
}
function saveEmitBundleAssets(config, asset) {
  const bundleMap = bundleCache.get(config)
  bundleMap.assets.set(asset.fileName, asset)
}

async function bundleBuildEntry(config, options) {
  const viteConfigFile = options.customBuildConfig[options.buildConfig]
  const {
    output: [outputChunk, ...outputChunks]
  } = await build({
    configFile: viteConfigFile,
    build: {
      rollupOptions: {
        input: options.entries
      }
    }
  })

  // handle sourceMap
  const { map: sourcemap, fileName: chunkFileName } = outputChunk
  if (sourcemap) {
    if (config.build.sourcemap === 'hidden' || config.build.sourcemap === true) {
      saveEmitBundleAssets(config, {
        fileName: chunkFileName + '.map',
        source: sourcemap.toString()
      })
    }
  }

  // handle assets
  outputChunks.forEach((assets) => {
    if (assets.type === 'assets') {
      saveEmitBundleAssets(config, assets)
    } else if (assets.type === 'chunk') {
      saveEmitBundleAssets(config, {
        fileName: assets.fileName,
        source: assets.code
      })
    }
  })
  return outputChunk
}

function isSameContent(a, b) {
  if (typeof a === 'string') {
    if (typeof b === 'string') {
      return a === b
    }
    return Buffer.from(a).equals(b)
  }
  return Buffer.from(b).equals(a)
}

export async function vitePluginBuildEntry(customBuildConfig) {
  let config
  return {
    name: 'vite-plugin-build-entry',
    apply: 'build',
    enforce: 'pre',
    configResolved(resolveConfig) {
      config = resolveConfig
    },
    buildStart() {
      bundleCache.set(config, {
        assets: new Map(),
        bundle: new Map(),
        fileNameHash: new Map()
      })
    },
    async load(id) {
      const match = buildRE.exec(id)
      if (!match) {
        return
      }
      const file = cleanUrl(id)
      const { code } = await bundleBuildEntry(config, {
        customBuildConfig,
        buildConfig: match.groups.name,
        entries: [file]
      })
      const formatBase64 = (code) => {
        return 'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
      }
      return `export default ${JSON.stringify(formatBase64(code))}\n`
    },
    generateBundle(opts, bundle) {
      if (opts.__vite_skip_assets_emit__) {
        return
      }
      const bundleMap = bundleCache.get(config)
      bundleMap.assets.forEach((asset) => {
        const duplicateAsset = bundle[asset.fileName]
        if (duplicateAsset) {
          const content = duplicateAsset.type === 'asset' ? duplicateAsset.source : duplicateAsset.code
          if (isSameContent(content, asset.source)) {
            return
          }
        }
        this.emitFile({
          type: 'asset',
          fileName: asset.fileName,
          source: asset.source
        })
        bundleMap.assets.clear()
      })
    }
  }
}

export default vitePluginBuildEntry
