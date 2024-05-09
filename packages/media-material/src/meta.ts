import { Meta } from "./type";
import { AudioDesc, VideoDesc, AudioSnippet, VideoSnippet } from './media/index.meta'
import { IframeDesc, IframeSnippet } from './iframe/index.meta'
export const meta: Meta = {
    data: {
        framework: 'vue',
        materials: {
            components: [VideoDesc, AudioDesc, IframeDesc],
            snippets: [{
                group: '多媒体',
                children: [ VideoSnippet, AudioSnippet, IframeSnippet]
            }],
            blocks: []
        }
    }
}