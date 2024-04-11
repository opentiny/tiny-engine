import { build } from "vite"
import { getBuildLibConfig, getBuildMetaConfig,  } from "./shared.mjs"

const main = async () => {
    await build(getBuildLibConfig())
    await build(getBuildMetaConfig({
        define: {
            'process.env': {
                HOST: '/'
            },
        }, 
    }))
}

main()
