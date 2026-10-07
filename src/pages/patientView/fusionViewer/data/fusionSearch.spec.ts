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
});
