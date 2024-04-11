import { defineComponent, h } from "vue";

function generateHtmlComp(name: string) {
    return defineComponent((_, { attrs, slots }) => {
        return () => h(name, attrs, slots);
    });
}

export const MIframe = generateHtmlComp("iframe");