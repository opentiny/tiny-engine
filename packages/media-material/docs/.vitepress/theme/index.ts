
import DefaultTheme from 'vitepress/theme';
import type { App } from 'vue';
import { install } from '../../../src/preview';
import Space from './components/space.vue';

import './custom.css';
import ExampleDoc from './components/ExampleDoc.vue';
import * as Examples from '../../examples/index';

export default {
    extends: DefaultTheme,
    enhanceApp({ app }: { app: App }) {
        install(app);
        app.component('ExampleDoc', ExampleDoc)
        app.component('Space', Space);
        Object.keys(Examples).forEach(key => {
            app.component(key, Examples[key]);
        });
    },
};
