import { assert } from 'chai';
import {
    generatePfamDomainColorMap,
    readableTextColor,
    PFAM_DOMAIN_COLORS,
} from './pfamColors';

describe('generatePfamDomainColorMap', () => {
    it('assigns palette colors to unique pfam ids in ascending start order', () => {
        const map = generatePfamDomainColorMap([
            { pfamId: 'PF00B', startAA: 200 },
            { pfamId: 'PF00A', startAA: 50 },
        ]);
        // PF00A starts first → first color; PF00B → second color.
        assert.equal(map['PF00A'], PFAM_DOMAIN_COLORS[0]);
        assert.equal(map['PF00B'], PFAM_DOMAIN_COLORS[1]);
    });

    it('gives the same color to repeated occurrences of one pfam id', () => {
        const map = generatePfamDomainColorMap([
            { pfamId: 'PF00A', startAA: 10 },
            { pfamId: 'PF00A', startAA: 300 },
            { pfamId: 'PF00B', startAA: 150 },
        ]);
        assert.equal(map['PF00A'], PFAM_DOMAIN_COLORS[0]);
        // Second unique id (PF00B) gets the second color regardless of repeats.
        assert.equal(map['PF00B'], PFAM_DOMAIN_COLORS[1]);
    });

    it('wraps around the palette after 15 unique domains', () => {
        const domains = Array.from({ length: 16 }, (_, i) => ({
            pfamId: `PF${i}`,
            startAA: i,
        }));
        const map = generatePfamDomainColorMap(domains);
        assert.equal(map['PF15'], PFAM_DOMAIN_COLORS[0]); // 16th wraps to index 0
    });

    it('does not mutate the input array order', () => {
        const input = [
            { pfamId: 'PF00B', startAA: 200 },
            { pfamId: 'PF00A', startAA: 50 },
        ];
        generatePfamDomainColorMap(input);
        assert.equal(input[0].pfamId, 'PF00B'); // original order preserved
    });

    it('ignores domains without a pfam id', () => {
        const map = generatePfamDomainColorMap([
            { startAA: 10 },
            { pfamId: 'PF00A', startAA: 20 },
        ]);
        assert.deepEqual(Object.keys(map), ['PF00A']);
    });
});

describe('readableTextColor', () => {
    it('returns dark text on light fills', () => {
        assert.equal(readableTextColor('#ebd61d'), '#333'); // yellow
        assert.equal(readableTextColor('#cafeb8'), '#333'); // light green
    });

    it('returns white text on dark fills', () => {
        assert.equal(readableTextColor('#ba21e0'), '#fff'); // purple
        assert.equal(readableTextColor('#0e180f'), '#fff'); // near-black
    });

    it('falls back to dark text for malformed input', () => {
        assert.equal(readableTextColor('not-a-color'), '#333');
    });
});
