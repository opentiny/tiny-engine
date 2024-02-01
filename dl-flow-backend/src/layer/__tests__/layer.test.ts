import { expect, test } from 'vitest';
import { App } from '~/app';


test('Layer', async () => {
    const app = await App();
    const rep = await app.inject({
        method: 'get',
        url: '/layer'
    });
    expect(rep.statusCode).toBe(200);
});