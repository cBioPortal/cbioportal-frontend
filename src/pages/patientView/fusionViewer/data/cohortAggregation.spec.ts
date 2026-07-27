import { assert } from 'chai';
import {
    classifyFrame,
    buildPairKey,
    pairKeyFromEvent,
    eventInBreakpointRegion,
    eventMatchesFilter,
    buildPairSummaries,
    buildSampleRows,
    extractGenePartnerOptions,
    extractSvTypeOptions,
    defaultCohortFilter,
} from './cohortAggregation';
import { FusionEvent, FusionCohortFilter } from './types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<FusionEvent> = {}): FusionEvent {
    return {
        id: 'sample1_GENE_A_GENE_B_5000_8000',
        tumorId: 'SAMPLE_001',
        gene1: {
            symbol: 'GENE_A',
            chromosome: '1',
            position: 5000,
            selectedTranscriptId: 'ENST00000001',
            siteDescription: 'Exon 5',
        },
        gene2: {
            symbol: 'GENE_B',
            chromosome: '2',
            position: 8000,
            selectedTranscriptId: 'ENST00000002',
            siteDescription: 'Exon 10',
        },
        fusion: 'GENE_A::GENE_B',
        totalReadSupport: 10,
        callMethod: 'FUSION',
        frameCallMethod: 'in_frame',
        annotation: '',
        position: '',
        significance: 'NA',
        note: '',
        connectionType: '5to3',
        svIdiom: 'INTERGENIC_FUSION',
        frame: 'IN_FRAME',
        isRnaDerived: true,
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// classifyFrame
// ---------------------------------------------------------------------------

describe('classifyFrame', () => {
    it('returns unknown for empty string', () => {
        assert.equal(classifyFrame(''), 'unknown');
    });

    it('returns unknown for NA', () => {
        assert.equal(classifyFrame('NA'), 'unknown');
    });

    it('classifies in_frame variants (underscore)', () => {
        assert.equal(classifyFrame('in_frame'), 'inFrame');
    });

    it('classifies In_frame (mixed case)', () => {
        assert.equal(classifyFrame('In_frame'), 'inFrame');
    });

    it('classifies IN_FRAME (upper case)', () => {
        assert.equal(classifyFrame('IN_FRAME'), 'inFrame');
    });

    it('classifies inframe (no separator)', () => {
        assert.equal(classifyFrame('inframe'), 'inFrame');
    });

    it('classifies in-frame (hyphen)', () => {
        assert.equal(classifyFrame('in-frame'), 'inFrame');
    });

    it('classifies frameshift', () => {
        assert.equal(classifyFrame('frameshift'), 'outOfFrame');
    });

    it('classifies Frameshift (mixed case)', () => {
        assert.equal(classifyFrame('Frameshift'), 'outOfFrame');
    });

    it('classifies frame_shift (with underscore)', () => {
        assert.equal(classifyFrame('frame_shift'), 'outOfFrame');
    });

    it('classifies out_of_frame', () => {
        assert.equal(classifyFrame('out_of_frame'), 'outOfFrame');
    });

    it('classifies outofframe', () => {
        assert.equal(classifyFrame('outofframe'), 'outOfFrame');
    });

    it('returns unknown for arbitrary string', () => {
        assert.equal(classifyFrame('some_other_value'), 'unknown');
    });

    it('returns unknown for whitespace-only', () => {
        assert.equal(classifyFrame('   '), 'unknown');
    });
});

// ---------------------------------------------------------------------------
// buildPairKey
// ---------------------------------------------------------------------------

describe('buildPairKey', () => {
    it('sorts symbols lexicographically', () => {
        // TMPRSS2 > ERG alphabetically; ERG should come first
        assert.equal(buildPairKey('TMPRSS2', 'ERG'), 'ERG::TMPRSS2');
    });

    it('is commutative — A::B and B::A produce the same key', () => {
        assert.equal(
            buildPairKey('TMPRSS2', 'ERG'),
            buildPairKey('ERG', 'TMPRSS2')
        );
    });

    it('handles intragenic (null gene3) as GENE::-', () => {
        assert.equal(buildPairKey('EWSR1', null), 'EWSR1::-');
    });

    it('handles intragenic (empty string gene3) as GENE::-', () => {
        assert.equal(buildPairKey('EWSR1', ''), 'EWSR1::-');
    });

    it('same symbol on both sides sorts correctly', () => {
        // Intragenic same gene — GENE:GENE sorts to GENE::GENE
        assert.equal(buildPairKey('ALK', 'ALK'), 'ALK::ALK');
    });
});

// ---------------------------------------------------------------------------
// pairKeyFromEvent
// ---------------------------------------------------------------------------

describe('pairKeyFromEvent', () => {
    it('builds a canonical key from event', () => {
        const ev = makeEvent(); // GENE_A::GENE_B
        // GENE_A < GENE_B alphabetically → GENE_A::GENE_B
        assert.equal(pairKeyFromEvent(ev), 'GENE_A::GENE_B');
    });

    it('is canonical even when gene symbols are reversed in the event', () => {
        const ev = makeEvent({
            gene1: {
                symbol: 'TMPRSS2',
                chromosome: '21',
                position: 41000000,
                selectedTranscriptId: '',
                siteDescription: '',
            },
            gene2: {
                symbol: 'ERG',
                chromosome: '21',
                position: 39000000,
                selectedTranscriptId: '',
                siteDescription: '',
            },
        });
        // ERG < TMPRSS2 → key is ERG::TMPRSS2 regardless of event orientation
        assert.equal(pairKeyFromEvent(ev), 'ERG::TMPRSS2');
    });

    it('returns GENE:- for intragenic events (null gene2)', () => {
        const ev = makeEvent({ gene2: null });
        assert.equal(pairKeyFromEvent(ev), 'GENE_A::-');
    });
});

// ---------------------------------------------------------------------------
// eventInBreakpointRegion
// ---------------------------------------------------------------------------

describe('eventInBreakpointRegion', () => {
    it('returns true when region is undefined', () => {
        const ev = makeEvent();
        assert.isTrue(eventInBreakpointRegion(ev, undefined));
    });

    it('matches site1 in window', () => {
        const ev = makeEvent(); // gene1: chr1:5000
        assert.isTrue(
            eventInBreakpointRegion(ev, {
                chromosome: '1',
                start: 4000,
                end: 6000,
            })
        );
    });

    it('matches site2 in window (gene2)', () => {
        const ev = makeEvent(); // gene2: chr2:8000
        assert.isTrue(
            eventInBreakpointRegion(ev, {
                chromosome: '2',
                start: 7000,
                end: 9000,
            })
        );
    });

    it('returns false when neither site falls in window', () => {
        const ev = makeEvent();
        assert.isFalse(
            eventInBreakpointRegion(ev, {
                chromosome: '1',
                start: 1000,
                end: 2000,
            })
        );
    });

    it('returns false when chromosome mismatches', () => {
        const ev = makeEvent(); // gene1: chr1:5000
        assert.isFalse(
            eventInBreakpointRegion(ev, {
                chromosome: '3',
                start: 4000,
                end: 6000,
            })
        );
    });

    it('is inclusive on boundaries', () => {
        const ev = makeEvent(); // gene1: chr1:5000
        assert.isTrue(
            eventInBreakpointRegion(ev, {
                chromosome: '1',
                start: 5000,
                end: 5000,
            })
        );
    });
});

// ---------------------------------------------------------------------------
// eventMatchesFilter
// ---------------------------------------------------------------------------

describe('eventMatchesFilter', () => {
    const baseFilter: FusionCohortFilter = defaultCohortFilter();

    it('passes everything when filter is empty (default)', () => {
        const ev = makeEvent();
        assert.isTrue(eventMatchesFilter(ev, baseFilter));
    });

    describe('genePartners facet', () => {
        it('passes when gene1 symbol is in the list', () => {
            const ev = makeEvent();
            assert.isTrue(
                eventMatchesFilter(ev, {
                    ...baseFilter,
                    genePartners: ['GENE_A'],
                })
            );
        });

        it('passes when gene2 symbol is in the list', () => {
            const ev = makeEvent();
            assert.isTrue(
                eventMatchesFilter(ev, {
                    ...baseFilter,
                    genePartners: ['GENE_B'],
                })
            );
        });

        it('fails when neither symbol is in the list', () => {
            const ev = makeEvent();
            assert.isFalse(
                eventMatchesFilter(ev, {
                    ...baseFilter,
                    genePartners: ['OTHER_GENE'],
                })
            );
        });

        it('is OR within the list', () => {
            const ev = makeEvent();
            assert.isTrue(
                eventMatchesFilter(ev, {
                    ...baseFilter,
                    genePartners: ['GENE_A', 'OTHER_GENE'],
                })
            );
        });
    });

    describe('fusionPairKeys facet', () => {
        it('passes when canonical key matches', () => {
            const ev = makeEvent();
            assert.isTrue(
                eventMatchesFilter(ev, {
                    ...baseFilter,
                    fusionPairKeys: ['GENE_A::GENE_B'],
                })
            );
        });

        it('fails when key not in list', () => {
            const ev = makeEvent();
            assert.isFalse(
                eventMatchesFilter(ev, {
                    ...baseFilter,
                    fusionPairKeys: ['OTHER::PAIR'],
                })
            );
        });
    });

    describe('svTypes facet', () => {
        it('passes when callMethod matches', () => {
            const ev = makeEvent({ callMethod: 'DELETION' });
            assert.isTrue(
                eventMatchesFilter(ev, {
                    ...baseFilter,
                    svTypes: ['DELETION'],
                })
            );
        });

        it('fails when callMethod not in list', () => {
            const ev = makeEvent({ callMethod: 'DELETION' });
            assert.isFalse(
                eventMatchesFilter(ev, {
                    ...baseFilter,
                    svTypes: ['FUSION'],
                })
            );
        });
    });

    describe('inFrame facet', () => {
        it('passes any frame when inFrame is "any"', () => {
            const ev = makeEvent({ frameCallMethod: 'frameshift' });
            assert.isTrue(
                eventMatchesFilter(ev, { ...baseFilter, inFrame: 'any' })
            );
        });

        it('passes in_frame events when inFrame is "inFrame"', () => {
            const ev = makeEvent({ frameCallMethod: 'in_frame' });
            assert.isTrue(
                eventMatchesFilter(ev, { ...baseFilter, inFrame: 'inFrame' })
            );
        });

        it('rejects out-of-frame when inFrame is "inFrame"', () => {
            const ev = makeEvent({ frameCallMethod: 'frameshift' });
            assert.isFalse(
                eventMatchesFilter(ev, { ...baseFilter, inFrame: 'inFrame' })
            );
        });

        it('matches "unknown" bucket for empty frameCallMethod', () => {
            const ev = makeEvent({ frameCallMethod: '' });
            assert.isTrue(
                eventMatchesFilter(ev, { ...baseFilter, inFrame: 'unknown' })
            );
        });

        it('unknown bucket is selectable and rejects in-frame events', () => {
            const ev = makeEvent({ frameCallMethod: 'in_frame' });
            assert.isFalse(
                eventMatchesFilter(ev, { ...baseFilter, inFrame: 'unknown' })
            );
        });
    });

    describe('breakpointRegion facet', () => {
        it('passes when site1 falls in region', () => {
            const ev = makeEvent(); // gene1: chr1:5000
            assert.isTrue(
                eventMatchesFilter(ev, {
                    ...baseFilter,
                    breakpointRegion: {
                        chromosome: '1',
                        start: 4000,
                        end: 6000,
                    },
                })
            );
        });

        it('fails when no site falls in region', () => {
            const ev = makeEvent();
            assert.isFalse(
                eventMatchesFilter(ev, {
                    ...baseFilter,
                    breakpointRegion: {
                        chromosome: '1',
                        start: 1000,
                        end: 2000,
                    },
                })
            );
        });
    });

    describe('cross-facet AND logic', () => {
        it('fails when gene partner matches but frame does not', () => {
            const ev = makeEvent({
                frameCallMethod: 'frameshift',
            });
            assert.isFalse(
                eventMatchesFilter(ev, {
                    ...baseFilter,
                    genePartners: ['GENE_A'],
                    inFrame: 'inFrame',
                })
            );
        });

        it('passes when all active facets match', () => {
            const ev = makeEvent({
                callMethod: 'FUSION',
                frameCallMethod: 'in_frame',
            });
            assert.isTrue(
                eventMatchesFilter(ev, {
                    ...baseFilter,
                    genePartners: ['GENE_A'],
                    svTypes: ['FUSION'],
                    inFrame: 'inFrame',
                })
            );
        });
    });
});

// ---------------------------------------------------------------------------
// buildPairSummaries
// ---------------------------------------------------------------------------

describe('buildPairSummaries', () => {
    it('returns empty array for no events', () => {
        assert.deepEqual(buildPairSummaries([]), []);
    });

    it('groups two events from the same sample into one summary', () => {
        const ev1 = makeEvent({ id: 'ev1' });
        const ev2 = makeEvent({
            id: 'ev2',
            gene1: { ...makeEvent().gene1, position: 5100 },
        });
        const summaries = buildPairSummaries([ev1, ev2]);
        assert.equal(summaries.length, 1);
        assert.equal(summaries[0].sampleCount, 1);
        assert.equal(summaries[0].eventCount, 2);
    });

    it('counts distinct samples correctly', () => {
        const ev1 = makeEvent({ id: 'ev1', tumorId: 'SAMPLE_001' });
        const ev2 = makeEvent({ id: 'ev2', tumorId: 'SAMPLE_002' });
        const summaries = buildPairSummaries([ev1, ev2]);
        assert.equal(summaries.length, 1);
        assert.equal(summaries[0].sampleCount, 2);
        assert.equal(summaries[0].eventCount, 2);
    });

    it('sampleCount < eventCount when same sample has multiple breakpoints', () => {
        const ev1 = makeEvent({ id: 'ev1', tumorId: 'SAMPLE_001' });
        const ev2 = makeEvent({ id: 'ev2', tumorId: 'SAMPLE_001' });
        const ev3 = makeEvent({ id: 'ev3', tumorId: 'SAMPLE_002' });
        const summaries = buildPairSummaries([ev1, ev2, ev3]);
        assert.equal(summaries[0].sampleCount, 2);
        assert.equal(summaries[0].eventCount, 3);
    });

    it('sets anyInFrame=true if any member event is in-frame', () => {
        const ev1 = makeEvent({
            id: 'ev1',
            tumorId: 'S1',
            frameCallMethod: 'frameshift',
        });
        const ev2 = makeEvent({
            id: 'ev2',
            tumorId: 'S2',
            frameCallMethod: 'in_frame',
        });
        const summaries = buildPairSummaries([ev1, ev2]);
        assert.isTrue(summaries[0].anyInFrame);
    });

    it('sets anyInFrame=false when no member is in-frame', () => {
        const ev1 = makeEvent({
            id: 'ev1',
            frameCallMethod: 'frameshift',
        });
        const summaries = buildPairSummaries([ev1]);
        assert.isFalse(summaries[0].anyInFrame);
    });

    it('sorts by sampleCount descending', () => {
        const rare = makeEvent({
            id: 'rare',
            tumorId: 'S1',
            gene1: {
                symbol: 'RARE',
                chromosome: '3',
                position: 1,
                selectedTranscriptId: '',
                siteDescription: '',
            },
            gene2: {
                symbol: 'PARTNER',
                chromosome: '4',
                position: 2,
                selectedTranscriptId: '',
                siteDescription: '',
            },
        });
        const common1 = makeEvent({ id: 'c1', tumorId: 'S2' });
        const common2 = makeEvent({ id: 'c2', tumorId: 'S3' });
        const summaries = buildPairSummaries([rare, common1, common2]);
        // GENE_A::GENE_B has 2 samples, RARE::PARTNER has 1
        assert.equal(summaries[0].sampleCount, 2);
        assert.equal(summaries[1].sampleCount, 1);
    });

    it('includes all event IDs in the summary', () => {
        const ev1 = makeEvent({ id: 'event_id_1' });
        const ev2 = makeEvent({ id: 'event_id_2' });
        const summaries = buildPairSummaries([ev1, ev2]);
        assert.deepEqual(summaries[0].eventIds.sort(), [
            'event_id_1',
            'event_id_2',
        ]);
    });

    it('produces GENE:- key for intragenic events', () => {
        const ev = makeEvent({ gene2: null });
        const summaries = buildPairSummaries([ev]);
        assert.equal(summaries[0].key, 'GENE_A::-');
        assert.isNull(summaries[0].gene3);
    });
});

// ---------------------------------------------------------------------------
// buildSampleRows
// ---------------------------------------------------------------------------

describe('buildSampleRows', () => {
    it('returns one row per distinct sample', () => {
        const ev1 = makeEvent({ id: 'e1', tumorId: 'S1' });
        const ev2 = makeEvent({ id: 'e2', tumorId: 'S2' });
        const rows = buildSampleRows([ev1, ev2]);
        assert.equal(rows.length, 2);
        const ids = rows.map(r => r.sampleId).sort();
        assert.deepEqual(ids, ['S1', 'S2']);
    });

    it('records pair key in pairFrameStatus', () => {
        const ev = makeEvent({ tumorId: 'S1', frameCallMethod: 'in_frame' });
        const rows = buildSampleRows([ev]);
        assert.equal(rows[0].pairFrameStatus['GENE_A::GENE_B'], 'inFrame');
    });

    it('takes the best frame status when a sample has multiple events for the same pair', () => {
        const ev1 = makeEvent({
            id: 'e1',
            tumorId: 'S1',
            frameCallMethod: 'frameshift',
        });
        const ev2 = makeEvent({
            id: 'e2',
            tumorId: 'S1',
            frameCallMethod: 'in_frame',
        });
        const rows = buildSampleRows([ev1, ev2]);
        // inFrame > outOfFrame — the row should record inFrame
        assert.equal(rows[0].pairFrameStatus['GENE_A::GENE_B'], 'inFrame');
    });

    it('caps columns to allowedPairKeys and drops samples with no allowed pair', () => {
        const a = makeEvent({ id: 'a', tumorId: 'S1' }); // GENE_A::GENE_B
        const b = makeEvent({
            id: 'b',
            tumorId: 'S2',
            gene1: {
                symbol: 'OTHER',
                chromosome: '5',
                position: 1,
                selectedTranscriptId: '',
                siteDescription: '',
            },
            gene2: null,
        }); // OTHER::-
        const rows = buildSampleRows([a, b], ['GENE_A::GENE_B']);
        // Only S1 (carries the allowed pair) survives; S2 is dropped.
        assert.equal(rows.length, 1);
        assert.equal(rows[0].sampleId, 'S1');
        assert.deepEqual(Object.keys(rows[0].pairFrameStatus), [
            'GENE_A::GENE_B',
        ]);
    });

    it('records every pair when no allow-list is given', () => {
        const a = makeEvent({ id: 'a', tumorId: 'S1' });
        const b = makeEvent({
            id: 'b',
            tumorId: 'S1',
            gene1: {
                symbol: 'OTHER',
                chromosome: '5',
                position: 1,
                selectedTranscriptId: '',
                siteDescription: '',
            },
            gene2: null,
        });
        const rows = buildSampleRows([a, b]);
        assert.equal(rows.length, 1);
        assert.deepEqual(
            Object.keys(rows[0].pairFrameStatus).sort(),
            ['GENE_A::GENE_B', 'OTHER::-'].sort()
        );
    });

    it('frame priority: inFrame > outOfFrame > unknown', () => {
        const base = {
            gene1: makeEvent().gene1,
            gene2: makeEvent().gene2,
            fusion: 'GENE_A::GENE_B',
            totalReadSupport: 5,
            callMethod: 'FUSION',
            annotation: '',
            position: '',
            significance: 'NA',
            note: '',
            connectionType: '',
            svIdiom: 'INTERGENIC_FUSION' as const,
            frame: 'IN_FRAME' as const,
            isRnaDerived: true,
        };

        const rows1 = buildSampleRows([
            { ...base, id: 'e1', tumorId: 'S1', frameCallMethod: '' },
            { ...base, id: 'e2', tumorId: 'S1', frameCallMethod: 'frameshift' },
        ]);
        assert.equal(rows1[0].pairFrameStatus['GENE_A::GENE_B'], 'outOfFrame');

        const rows2 = buildSampleRows([
            { ...base, id: 'e3', tumorId: 'S1', frameCallMethod: 'frameshift' },
            { ...base, id: 'e4', tumorId: 'S1', frameCallMethod: 'in_frame' },
        ]);
        assert.equal(rows2[0].pairFrameStatus['GENE_A::GENE_B'], 'inFrame');
    });
});

// ---------------------------------------------------------------------------
// extractGenePartnerOptions / extractSvTypeOptions
// ---------------------------------------------------------------------------

describe('extractGenePartnerOptions', () => {
    it('returns distinct sorted gene symbols from both sites', () => {
        const ev1 = makeEvent();
        const ev2 = makeEvent({
            gene1: {
                symbol: 'EWSR1',
                chromosome: '22',
                position: 1,
                selectedTranscriptId: '',
                siteDescription: '',
            },
            gene2: null,
        });
        const options = extractGenePartnerOptions([ev1, ev2]);
        assert.include(options, 'GENE_A');
        assert.include(options, 'GENE_B');
        assert.include(options, 'EWSR1');
        // Sorted check
        assert.deepEqual(options, [...options].sort());
    });
});

describe('extractSvTypeOptions', () => {
    it('returns distinct sorted callMethod values', () => {
        const ev1 = makeEvent({ callMethod: 'FUSION' });
        const ev2 = makeEvent({ callMethod: 'DELETION', id: 'e2' });
        const options = extractSvTypeOptions([ev1, ev2]);
        assert.deepEqual(options.sort(), ['DELETION', 'FUSION']);
    });
});
