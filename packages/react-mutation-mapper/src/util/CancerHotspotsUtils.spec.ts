import { assert } from 'chai';

import { IHotspotIndex } from '../model/CancerHotspot';
// import {Mutation} from "../model/Mutation";
import {
    indexHotspots,
    isHotspot,
    filterRecurrentHotspotsByMutations,
    filter3dHotspotsByMutations,
    filterHotspotsByMutations,
    groupHotspotsByMutations,
    defaultHotspotFilter,
} from './CancerHotspotsUtils';

describe('CancerHotspotsUtils', () => {
    const hotspots = [
        {
            genomicLocation: {
                chromosome: '17',
                start: 66,
                end: 66,
                referenceAllele: 'A',
                variantAllele: 'T',
            },
            transcriptId: '',
            proteinLocation: {
                transcriptId: '',
                start: 0,
                end: 0,
                mutationType: '',
            },
            variant: '10:g.66A>T',
            hotspots: [
                {
                    type: 'single residue',
                    transcriptId: 'ENST00002',
                    tumorCount: 1,
                    tumorTypeCount: 1,
                    inframeCount: 0,
                    missenseCount: 1,
                    spliceCount: 0,
                    truncatingCount: 0,
                    hugoSymbol: 'TP53',
                    residue: 'R273',
                    aminoAcidPosition: {
                        start: 273,
                        end: 273,
                    },
                },
            ],
        },
        {
            genomicLocation: {
                chromosome: '3',
                start: 666,
                end: 668,
                referenceAllele: 'G',
                variantAllele: 'CAT',
            },
            transcriptId: '',
            proteinLocation: {
                transcriptId: '',
                start: 0,
                end: 0,
                mutationType: '',
            },
            variant: '4:g.666G>CAT',
            hotspots: [
                {
                    type: 'in-frame indel',
                    tumorCount: 1,
                    tumorTypeCount: 1,
                    inframeCount: 1,
                    missenseCount: 0,
                    spliceCount: 0,
                    truncatingCount: 0,
                    transcriptId: 'ENST00003',
                    hugoSymbol: 'PIK3CA',
                    residue: '38-40',
                    aminoAcidPosition: {
                        start: 38,
                        end: 40,
                    },
                },
            ],
        },
        {
            genomicLocation: {
                chromosome: '4',
                start: 111,
                end: 111,
                referenceAllele: 'T',
                variantAllele: 'C',
            },
            transcriptId: '',
            proteinLocation: {
                transcriptId: '',
                start: 0,
                end: 0,
                mutationType: '',
            },
            variant: '6:g.111T>C',
            hotspots: [
                {
                    type: '3d',
                    tumorCount: 1,
                    tumorTypeCount: 1,
                    inframeCount: 0,
                    missenseCount: 1,
                    spliceCount: 0,
                    truncatingCount: 0,
                    transcriptId: 'ENST00005',
                    hugoSymbol: 'SMURF1',
                    residue: 'R101',
                    aminoAcidPosition: {
                        start: 101,
                        end: 101,
                    },
                },
            ],
        },
        {
            genomicLocation: {
                chromosome: '1',
                start: 2,
                end: 2,
                referenceAllele: 'A',
                variantAllele: 'T',
            },
            transcriptId: '',
            proteinLocation: {
                transcriptId: '',
                start: 0,
                end: 0,
                mutationType: '',
            },
            variant: '1:g.2>T',
            hotspots: [],
        },
    ];

    let hotspotIndex: IHotspotIndex;

    beforeAll(() => {
        hotspotIndex = indexHotspots(hotspots);
    });

    describe('indexHotspots', () => {
        it('properly creates hotspot index', () => {
            assert.equal(
                hotspotIndex['17,66,66,A,T'].hotspots.length,
                1,
                'Only one TP53 single-residue hotspot mutation should be indexed.'
            );

            assert.equal(
                hotspotIndex['3,666,668,G,CAT'].hotspots.length,
                1,
                'Only one PIK3CA in-frame indel hotspot mutation should be indexed.'
            );

            assert.equal(
                hotspotIndex['4,111,111,T,C'].hotspots.length,
                1,
                'Only one SMURF1 3d hotspot mutation should be indexed.'
            );
        });
    });

    // TODO remove as any[] after fixing the Mutation model...
    describe('isHotspot', () => {
        it('isHotspot works correctly', () => {
            assert.isFalse(
                isHotspot(
                    {
                        gene: { chromosome: '1' },
                        startPosition: 2,
                        endPosition: 2,
                        referenceAllele: 'A',
                        variantAllele: 'T',
                    } as any,
                    hotspotIndex
                )
            );
            assert.isTrue(
                isHotspot(
                    {
                        gene: { chromosome: '4' },
                        startPosition: 111,
                        endPosition: 111,
                        referenceAllele: 'T',
                        variantAllele: 'C',
                    } as any,
                    hotspotIndex
                )
            );
            assert.isFalse(
                isHotspot(
                    {
                        gene: { chromosome: 'asdkfjpaosid' },
                        startPosition: -1,
                        endPosition: -1,
                        referenceAllele: 'A',
                        variantAllele: 'T',
                    } as any,
                    hotspotIndex
                )
            );
        });
    });

    // TODO remove as any[] after fixing the Mutation model...
    describe('filterHotspots', () => {
        const mutations = [
            {
                gene: { chromosome: '17' },
                startPosition: 66,
                endPosition: 66,
                referenceAllele: 'A',
                variantAllele: 'T',
            },
            {
                gene: { chromosome: '3' },
                startPosition: 666,
                endPosition: 668,
                referenceAllele: 'G',
                variantAllele: 'CAT',
            },
            {
                gene: { chromosome: '4' },
                startPosition: 111,
                endPosition: 111,
                referenceAllele: 'T',
                variantAllele: 'C',
            },
            {
                gene: { chromosome: '1' },
                startPosition: 2,
                endPosition: 2,
                referenceAllele: 'A',
                variantAllele: 'T',
            },
            {
                gene: { chromosome: 'NA' },
                startPosition: -1,
                endPosition: -1,
                referenceAllele: 'A',
                variantAllele: 'T',
            },
        ] as any[];

        it('filters hotspots correctly with the default hotspot filter', () => {
            const filtered = filterHotspotsByMutations(
                mutations,
                hotspotIndex,
                defaultHotspotFilter
            );
            assert.equal(filtered.length, 3, '3 mutations should be identified as hotspot');
        });

        it('filters recurrent hotspots correctly', () => {
            const filtered = filterRecurrentHotspotsByMutations(mutations, hotspotIndex);
            assert.equal(
                filtered.length,
                2,
                '2 mutations should be identified as recurrent hotspot'
            );
        });

        it('filters 3D hotspots correctly', () => {
            const filtered = filter3dHotspotsByMutations(mutations, hotspotIndex);
            assert.equal(filtered.length, 1, 'only 1 mutation should be identified as 3D hotspot');
        });
    });

    // TODO remove as any[] after fixing the Mutation model...
    describe('groupHotspots', () => {
        const mutationsByPosition = {
            [1]: [
                {
                    gene: { chromosome: '17' },
                    startPosition: 66,
                    endPosition: 66,
                    referenceAllele: 'A',
                    variantAllele: 'T',
                },
            ] as any[],
            [2]: [
                {
                    gene: { chromosome: '3' },
                    startPosition: 666,
                    endPosition: 668,
                    referenceAllele: 'G',
                    variantAllele: 'CAT',
                },
                {
                    gene: { chromosome: '4' },
                    startPosition: 111,
                    endPosition: 111,
                    referenceAllele: 'T',
                    variantAllele: 'C',
                },
                {
                    gene: { chromosome: 'NA' },
                    startPosition: -1,
                    endPosition: -1,
                    referenceAllele: 'A',
                    variantAllele: 'T',
                },
            ] as any[],
            [4]: [
                {
                    gene: { chromosome: '1' },
                    startPosition: 2,
                    endPosition: 2,
                    referenceAllele: 'A',
                    variantAllele: 'T',
                },
            ] as any[],
        };

        it('groups hotspots by mutations grouped by protein position', () => {
            const grouped = groupHotspotsByMutations(
                mutationsByPosition,
                hotspotIndex,
                defaultHotspotFilter
            );

            assert.equal(
                grouped[1].length,
                1,
                'all mutations at position 1 should be filtered as hotspot'
            );
            assert.equal(
                grouped[2].length,
                2,
                '2 out of 3 mutations at position 2 should be filtered as hotspot'
            );
            assert.isUndefined(
                grouped[4],
                'there should NOT be any hotspot mutations at position 4'
            );
        });
    });
});
