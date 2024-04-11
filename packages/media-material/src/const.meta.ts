import { NPMInfo } from "./type"

export const VERSION = '0.0.1'

export const HOST = process.env.HOST 

export const NPM: NPMInfo = {
    package: "media-material",
    version: VERSION,
    script: `${HOST}index.es-browser.js`,
    css: `${HOST}index.css`,
}