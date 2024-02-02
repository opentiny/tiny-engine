import { describe, expect, test } from 'vitest';
import { App } from '~/app';


describe('Layer', () => {
    test('get layer', async () => {
        const app = await App();
        const rep = await app.inject({
            method: 'get',
            url: '/layers'
        });
        expect(rep.statusCode).toBe(200);
    });
}, {
    timeout: 60 * 1000
});