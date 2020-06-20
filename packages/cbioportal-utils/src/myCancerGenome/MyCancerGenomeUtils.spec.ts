import { parseMyCancerGenomeLink } from './MyCancerGenomeUtils';
import { assert } from 'chai';

describe('MyCancerGenomeUtils', () => {
    describe('parseMyCancerGenomeLink', () => {
        it('extracts URL and text from a pre-formatted my cancer genome HTML string', () => {
            const htmlLink =
                '<a href="http://mycancergenome.org/content/disease/colorectal-cancer/kras/38/">KRAS c.37G>T (G13C) Mutation in Colorectal Cancer</a>';

            const parsed = parseMyCancerGenomeLink(htmlLink);

            assert.isNotNull(parsed);
            assert.equal(
                parsed!.text,
                'KRAS c.37G>T (G13C) Mutation in Colorectal Cancer'
            );
            assert.equal(
                parsed!.url,
                'http://mycancergenome.org/content/disease/colorectal-cancer/kras/38/'
            );
        });
    });
});
