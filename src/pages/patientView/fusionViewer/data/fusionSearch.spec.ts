import { assert } from 'chai';
import { filterFusions } from './fusionSearch';
import { FusionEvent } from './types';

function makeFusion(overrides: Partial<FusionEvent> = {}): FusionEvent {
    return {
        id: 'fusion-1',
        tumorId: 'tumor-1',
        gene1: {
            symbol: 'TMPRSS2',
            chromosome: '21',
            position: 42880000,
            selectedTranscriptId: 'ENST_A',
            siteDescription: 'exon',
        },
        gene2: {
            symbol: 'ERG',
            chromosome: '21',
            position: 39956000,
            selectedTranscriptId: 'ENST_B',
            siteDescription: 'exon',
        },
        fusion: 'TMPRSS2::ERG',
        eventLabel: '',
        ncbiBuild: '',
        totalReadSupport: 10,
        callMethod: '',
        frameCallMethod: '',
        annotation: '',
        position: '',
        significance: 'NA',
        note: '',
        connectionType: '5to3',
        svIdiom: 'INTRACHROM_FUSION',
        frame: 'UNKNOWN',
        isRnaDerived: true,
        ...overrides,
        // Cast: eventLabel/ncbiBuild exist only on branches with the
        // data-refresh-fixes FusionEvent.
    } as FusionEvent;
}

const tmprssErg = makeFusion({ id: 'erg' });
const alkDel = makeFusion({
    id: 'alk',
    gene1: {
        ...tmprssErg.gene1,
        symbol: 'EML4',
        chromosome: '2',
        position: 42522656,
    },
    gene2: {
        ...tmprssErg.gene2!,
        symbol: 'ALK',
        chromosome: '2',
        position: 29446394,
    },
    callMethod: 'DELETION',
    svIdiom: 'INTRAGENIC_DELETION',
});
const igr = makeFusion({
    id: 'igr',
    gene1: {
        ...tmprssErg.gene1,
        symbol: 'MYC',
        chromosome: '8',
        position: 127736000,
    },
    gene2: null,
    callMethod: 'TRANSLOCATION',
    svIdiom: 'INTERGENIC_FUSION',
});
const all = [tmprssErg, alkDel, igr];
const ids = (q: string) => filterFusions(all, q).map(f => f.id);

describe('filterFusions', () => {
    it('returns everything for an empty or blank query', () => {
        assert.deepEqual(ids(''), ['erg', 'alk', 'igr']);
        assert.deepEqual(ids('   '), ['erg', 'alk', 'igr']);
    });

    it('matches either partner symbol, case-insensitively and by prefix', () => {
        // Regression: "erg" is inside "intergenic" but must not match it.
        assert.notInclude(ids('erg'), 'igr');
        assert.deepEqual(ids('erg'), ['erg']);
        assert.deepEqual(ids('tmprss'), ['erg']);
        assert.deepEqual(ids('alk'), ['alk']);
        assert.deepEqual(ids('m'), ['igr']); // MYC, not TMPRSS2/EML4
        assert.deepEqual(ids('rss2'), []);
        assert.deepEqual(ids('igr'), ['igr']);
    });

    it('matches variant class and SV type', () => {
        assert.deepEqual(ids('deletion'), ['alk']);
        assert.deepEqual(ids('translocation'), ['igr']);
        assert.deepEqual(ids('intrachrom'), ['erg']);
    });

    it('matches coordinates: chromosome, position prefix, and range', () => {
        assert.deepEqual(ids('chr2'), ['alk']);
        assert.deepEqual(ids('21'), ['erg']);
        assert.deepEqual(ids('chr2:29,446'), ['alk']);
        assert.deepEqual(ids('chr21:39000000-40000000'), ['erg']);
        assert.deepEqual(ids('chr21:1-100'), []);
        assert.deepEqual(ids('8:127736000'), ['igr']);
    });

    it('requires every term to match', () => {
        assert.deepEqual(ids('alk deletion'), ['alk']);
        assert.deepEqual(ids('erg deletion'), []);
        assert.deepEqual(ids('chr2 eml4'), ['alk']);
    });

    it('matches a pasted fusion name in either order and separator', () => {
        assert.deepEqual(ids('tmprss2::erg'), ['erg']);
        assert.deepEqual(ids('TMPRSS2-ERG'), ['erg']);
        assert.deepEqual(ids('erg::tmprss2'), ['erg']);
        assert.deepEqual(ids('tmprss2::e'), ['erg']); // still typing
        assert.deepEqual(ids('tmprss2::alk'), []);
    });

    it('reads a trailing colon or dash as a partial coordinate', () => {
        assert.deepEqual(ids('chr21:'), ['erg']);
        assert.deepEqual(ids('chr2:29000000-'), ['alk']); // open range: >= start
        assert.deepEqual(ids('chr2:43000000-'), []);
    });

    it('accepts a reversed range', () => {
        assert.deepEqual(ids('chr21:40000000-39000000'), ['erg']);
    });

    it('matches the mitochondrial chromosome whichever way it is stored', () => {
        const mt = makeFusion({
            id: 'mt',
            gene1: { ...tmprssErg.gene1, symbol: 'MT-ND1', chromosome: 'M' },
            gene2: null,
        });
        const mt2 = makeFusion({
            id: 'mt2',
            gene1: { ...tmprssErg.gene1, symbol: 'MT-CO1', chromosome: 'MT' },
            gene2: null,
        });
        const q = (t: string) => filterFusions([mt, mt2], t).map(f => f.id);
        assert.deepEqual(q('chrM'), ['mt', 'mt2']);
        assert.deepEqual(q('chrMT'), ['mt', 'mt2']);
    });

    it('still finds a gene whose symbol looks like a chromosome term', () => {
        const chrm = makeFusion({
            id: 'chrm',
            gene1: { ...tmprssErg.gene1, symbol: 'CHRM1', chromosome: '11' },
            gene2: null,
        });
        assert.deepEqual(
            filterFusions([chrm, tmprssErg], 'chrm').map(f => f.id),
            ['chrm']
        );
    });
    describe('sample', () => {
        const t01 = makeFusion({ id: 't01', tumorId: 'PT-0001-T01-IM5' });
        const t02 = makeFusion({ id: 't02', tumorId: 'PT-0001-T02-IM6' });
        const samples = (q: string) =>
            filterFusions([t01, t02], q).map(f => f.id);

        it('matches a full or partly typed sample id', () => {
            assert.deepEqual(samples('PT-0001-T01-IM5'), ['t01']);
            assert.deepEqual(samples('pt-0001-t0'), ['t01', 't02']);
        });

        it('matches one part of a sample id, such as the specimen', () => {
            assert.deepEqual(samples('t02'), ['t02']);
            assert.deepEqual(samples('im5'), ['t01']);
        });

        it('combines with a gene term', () => {
            assert.deepEqual(samples('erg t01'), ['t01']);
        });
    });
});
