import { build } from "vite"
import { preview } from "vite"
import { getBuildLibConfig, getBuildMetaConfig,  } from "./shared.mjs"

const main = async () => {
    const server = await preview({
        preview: {
            port: 9527,
            host: '0.0.0.0'
        },
    })

    const host = server.resolvedUrls.local[0];
    await build(getBuildLibConfig({ build: { watch: true } }))
    await build(getBuildMetaConfig({
        build: { watch: true },  
        define: {
            'process.env': {
                HOST: host
            },
        }, 
    }))

    server.printUrls()
    server.bindCLIShortcuts({ print: true })
    console.log(`Material URL：${host}assets/bundle.json`)
}

main()
