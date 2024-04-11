import * as components from './components';
import type { App, Component } from 'vue';

export const install = function (app: App) {
    Object.keys(components).forEach((key) => {
        const comp = components[key as keyof typeof components] as Component;
        if (/^([A-Z])/.test(key))
            app.component(comp.name || key, comp);
    });
    return app;
};
