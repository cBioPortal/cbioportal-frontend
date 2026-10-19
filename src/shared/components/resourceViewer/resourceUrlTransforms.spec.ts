import { assert } from 'chai';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import {
    applyCustomUrlTransforms,
    CUSTOM_URL_TRANSFORMERS,
} from './resourceUrlTransforms';

describe('resourceUrlTransforms', () => {
    const context = (overrides: Partial<any> = {}) => ({
        resourceId: 'SLIDE',
        url: 'https://example.com/slide/index.html',
        ...overrides,
    });

    const minervaTest = CUSTOM_URL_TRANSFORMERS[0].test;

    it('recognises Minerva from the URL alone', () => {
        // How every live study identifies it: crc_hta11_htan_2021, crc_hta8_htan_2024 and
        // crc_orion_2024 all carry /minerva/ in the URL and set nothing else.
        assert.isTrue(
            minervaTest(
                context({
                    url:
                        'https://labsyspharm.github.io/orion-crc/minerva/P37_S29-CRC01/index.html#s=0',
                })
            )
        );
    });

    it('also recognises it from the id, display name or description', () => {
        assert.isTrue(minervaTest(context({ resourceId: 'MINERVA' })));
        assert.isTrue(
            minervaTest(context({ resourceDisplayName: 'Minerva Story' }))
        );
        assert.isTrue(
            minervaTest(context({ description: 'A minerva narrative' }))
        );
    });

    it('leaves other resources alone', () => {
        const plain = context();
        assert.isFalse(minervaTest(plain));
        assert.equal(applyCustomUrlTransforms(plain, plain.url), plain.url);
    });

    it('registers the message listener once, not once per call', () => {
        // The listener records the viewer's channel group; adding it per render leaked one
        // listener per paint.
        const win = getBrowserWindow();
        const original = win.addEventListener;
        let added = 0;
        win.addEventListener = (...args: any[]) => {
            if (args[0] === 'message') {
                added += 1;
            }
            return (original as any).apply(win, args);
        };

        try {
            const minerva = context({
                url: 'https://x.org/minerva/index.html',
            });
            applyCustomUrlTransforms(minerva, minerva.url);
            applyCustomUrlTransforms(minerva, minerva.url);
            applyCustomUrlTransforms(minerva, minerva.url);
        } finally {
            win.addEventListener = original;
        }

        assert.isAtMost(added, 1);
    });

    it('appends the stored channel group to a Minerva URL', () => {
        const win = getBrowserWindow();
        win.localStorage.setItem('MINVERVA_STATE_KEY', '4');
        try {
            const minerva = context({
                url: 'https://x.org/minerva/index.html',
            });
            const out = applyCustomUrlTransforms(minerva, minerva.url);
            assert.include(out, 'https://x.org/minerva/index.html#');
            assert.include(out, '#g=4#');
        } finally {
            win.localStorage.removeItem('MINVERVA_STATE_KEY');
        }
    });
});
