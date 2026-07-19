/**
 * @jest-environment jsdom
 */
import {
    clearWsiCbioportalRequestCaches,
    fetchClinicalDataRecords,
    fetchClinicalDataRecordsReadOnly,
    clearMolecularProfileIdCache,
    fetchCnaData,
    fetchCnaDataReadOnly,
    fetchMutationData,
    fetchMutationDataReadOnly,
    fetchMutationFrequencyData,
    fetchMutationFrequencyDataReadOnly,
    fetchSampleTimepointMaps,
    fetchStructuralVariantData,
    fetchStructuralVariantDataReadOnly,
} from './wsiCbioportalDataUtils';
import { Sample } from './wsiViewerTypes';

describe('wsiCbioportalDataUtils molecular profile caching', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = (global as any).fetch;
        clearMolecularProfileIdCache();
        clearWsiCbioportalRequestCaches();
    });

    afterEach(() => {
        (global as any).fetch = originalFetch;
        clearMolecularProfileIdCache();
        clearWsiCbioportalRequestCaches();
    });

    it('reuses the clinical-data request for the same sample identifier set', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('[]'),
        });
        (global as any).fetch = fetchMock;

        const identifiers = [{ studyId: 'study-1', sampleId: 'S-1' }];
        await fetchClinicalDataRecords('', identifiers);
        await fetchClinicalDataRecords('', identifiers);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toContain('/api/clinical-data/fetch');
    });

    it('returns cloned clinical-data records so callers cannot mutate the shared cache', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            text: () =>
                Promise.resolve(
                    JSON.stringify([
                        {
                            sampleId: 'S-1',
                            clinicalAttributeId: 'ATTR',
                            value: 'original',
                        },
                    ])
                ),
        });
        (global as any).fetch = fetchMock;

        const first = await fetchClinicalDataRecords('', [
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);
        expect(first).not.toBeNull();
        first![0].value = 'mutated';

        const second = await fetchClinicalDataRecords('', [
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second).toEqual([
            {
                sampleId: 'S-1',
                clinicalAttributeId: 'ATTR',
                value: 'original',
            },
        ]);
        expect(second).not.toBe(first);
    });

    it('reuses the cached clinical-data reference for read-only callers', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            text: () =>
                Promise.resolve(
                    JSON.stringify([
                        {
                            sampleId: 'S-1',
                            clinicalAttributeId: 'ATTR',
                            value: 'original',
                        },
                    ])
                ),
        });
        (global as any).fetch = fetchMock;

        const identifiers = [{ studyId: 'study-1', sampleId: 'S-1' }];
        const first = await fetchClinicalDataRecordsReadOnly('', identifiers);
        const second = await fetchClinicalDataRecordsReadOnly('', identifiers);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });

    it('reuses the clinical-data request and deduplicates payload identifiers when duplicate sample IDs are present', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('[]'),
        });
        (global as any).fetch = fetchMock;

        const dedupedIdentifiers = [{ studyId: 'study-1', sampleId: 'S-1' }];
        const duplicateIdentifiers = [
            { studyId: 'study-1', sampleId: 'S-1' },
            { studyId: 'study-1', sampleId: 'S-1' },
        ];

        await fetchClinicalDataRecords('', dedupedIdentifiers);
        await fetchClinicalDataRecords('', duplicateIdentifiers);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
            identifiers: [{ studyId: 'study-1', entityId: 'S-1' }],
        });
    });

    it('returns an empty list without posting when no sample identifiers are provided', async () => {
        const fetchMock = jest.fn();
        (global as any).fetch = fetchMock;

        const result = await fetchClinicalDataRecordsReadOnly('', []);

        expect(result).toEqual([]);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('posts clinical-data identifiers in canonical order for equivalent sample sets', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('[]'),
        });
        (global as any).fetch = fetchMock;

        await fetchClinicalDataRecords('', [
            { studyId: 'study-1', sampleId: 'S-2' },
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);

        expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
            identifiers: [
                { studyId: 'study-1', entityId: 'S-1' },
                { studyId: 'study-1', entityId: 'S-2' },
            ],
        });
    });

    it('reuses the molecular profile lookup for repeated mutation fetches', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_mutations',
                            molecularAlterationType: 'MUTATION_EXTENDED',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });
        (global as any).fetch = fetchMock;

        await fetchMutationData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);
        await fetchMutationData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-2' },
        ]);

        expect(fetchMock.mock.calls[0][0]).toContain(
            '/api/studies/study-1/molecular-profiles'
        );
        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/molecular-profiles')
            )
        ).toHaveLength(1);
    });

    it('reuses the mutation-data request for the same sample identifier set', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_mutations',
                            molecularAlterationType: 'MUTATION_EXTENDED',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });
        (global as any).fetch = fetchMock;

        const identifiers = [{ studyId: 'study-1', sampleId: 'S-1' }];
        await fetchMutationData('', 'study-1', identifiers);
        await fetchMutationData('', 'study-1', identifiers);

        expect(fetchMock.mock.calls.filter(([url]) =>
            String(url).includes('/api/mutations/fetch')
        )).toHaveLength(1);
    });

    it('returns cloned mutation-data maps so callers cannot mutate the shared cache', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_mutations',
                            molecularAlterationType: 'MUTATION_EXTENDED',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            sampleId: 'S-1',
                            gene: {
                                hugoGeneSymbol: 'KRAS',
                                entrezGeneId: 3845,
                            },
                            proteinChange: 'p.G12D',
                            mutationType: 'Missense_Mutation',
                            tumorAltCount: 10,
                            tumorRefCount: 10,
                        },
                    ]),
            });
        (global as any).fetch = fetchMock;

        const first = await fetchMutationData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);
        expect(first).not.toBeNull();
        first!.allMutsBySample.get('S-1')![0].token = 'MUTATED';
        first!.detailsBySample.get('S-1')!.get('KRAS p.G12D')!.type = 'Mutated';

        const second = await fetchMutationData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);

        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/api/mutations/fetch')
            )
        ).toHaveLength(1);
        expect(second?.allMutsBySample.get('S-1')).toEqual([
            { token: 'KRAS p.G12D', vaf: 50 },
        ]);
        expect(second?.detailsBySample.get('S-1')!.get('KRAS p.G12D')!.type).toBe(
            'Missense'
        );
        expect(second).not.toBe(first);
        expect(second?.allMutsBySample).not.toBe(first?.allMutsBySample);
        expect(second?.detailsBySample).not.toBe(first?.detailsBySample);
    });

    it('reuses the cached mutation-data reference for read-only callers', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_mutations',
                            molecularAlterationType: 'MUTATION_EXTENDED',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            sampleId: 'S-1',
                            gene: {
                                hugoGeneSymbol: 'KRAS',
                                entrezGeneId: 3845,
                            },
                            proteinChange: 'p.G12D',
                            mutationType: 'Missense_Mutation',
                            tumorAltCount: 10,
                            tumorRefCount: 10,
                        },
                    ]),
            });
        (global as any).fetch = fetchMock;

        const identifiers = [{ studyId: 'study-1', sampleId: 'S-1' }];
        const first = await fetchMutationDataReadOnly(
            '',
            'study-1',
            identifiers
        );
        const second = await fetchMutationDataReadOnly(
            '',
            'study-1',
            identifiers
        );

        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/api/mutations/fetch')
            )
        ).toHaveLength(1);
        expect(second).toBe(first);
    });

    it('returns empty mutation maps without posting when no sample identifiers are provided', async () => {
        const fetchMock = jest.fn();
        (global as any).fetch = fetchMock;

        const result = await fetchMutationDataReadOnly('', 'study-1', []);

        expect(result).toEqual({
            allMutsBySample: new Map(),
            detailsBySample: new Map(),
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('reuses the mutation-data request and deduplicates sample molecular identifiers when duplicates are present', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_mutations',
                            molecularAlterationType: 'MUTATION_EXTENDED',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });
        (global as any).fetch = fetchMock;

        const dedupedIdentifiers = [{ studyId: 'study-1', sampleId: 'S-1' }];
        const duplicateIdentifiers = [
            { studyId: 'study-1', sampleId: 'S-1' },
            { studyId: 'study-1', sampleId: 'S-1' },
        ];

        await fetchMutationData('', 'study-1', dedupedIdentifiers);
        await fetchMutationData('', 'study-1', duplicateIdentifiers);

        const mutationFetchCall = fetchMock.mock.calls.find(([url]) =>
            String(url).includes('/api/mutations/fetch')
        );
        expect(mutationFetchCall).toBeDefined();
        expect(JSON.parse(String(mutationFetchCall?.[1]?.body))).toEqual({
            sampleMolecularIdentifiers: [
                {
                    molecularProfileId: 'study_mutations',
                    sampleId: 'S-1',
                },
            ],
        });
        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/api/mutations/fetch')
            )
        ).toHaveLength(1);
    });

    it('posts mutation sample molecular identifiers in canonical order for equivalent sample sets', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_mutations',
                            molecularAlterationType: 'MUTATION_EXTENDED',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });
        (global as any).fetch = fetchMock;

        await fetchMutationData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-2' },
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);

        const mutationFetchCall = fetchMock.mock.calls.find(([url]) =>
            String(url).includes('/api/mutations/fetch')
        );
        expect(mutationFetchCall).toBeDefined();
        expect(JSON.parse(String(mutationFetchCall?.[1]?.body))).toEqual({
            sampleMolecularIdentifiers: [
                {
                    molecularProfileId: 'study_mutations',
                    sampleId: 'S-1',
                },
                {
                    molecularProfileId: 'study_mutations',
                    sampleId: 'S-2',
                },
            ],
        });
    });

    it('keeps separate cache entries per alteration type', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_mutations',
                            molecularAlterationType: 'MUTATION_EXTENDED',
                        },
                    ]),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_cna',
                            molecularAlterationType:
                                'COPY_NUMBER_ALTERATION',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });
        (global as any).fetch = fetchMock;

        await fetchMutationData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);
        await fetchCnaData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);

        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/molecular-profiles')
            )
        ).toHaveLength(2);
    });

    it('reuses the CNA-data request and deduplicates sample IDs when duplicates are present', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_cna',
                            molecularAlterationType:
                                'COPY_NUMBER_ALTERATION',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });
        (global as any).fetch = fetchMock;

        const dedupedIdentifiers = [{ studyId: 'study-1', sampleId: 'S-1' }];
        const duplicateIdentifiers = [
            { studyId: 'study-1', sampleId: 'S-1' },
            { studyId: 'study-1', sampleId: 'S-1' },
        ];

        await fetchCnaData('', 'study-1', dedupedIdentifiers);
        await fetchCnaData('', 'study-1', duplicateIdentifiers);

        const cnaFetchCall = fetchMock.mock.calls.find(([url]) =>
            String(url).includes('/molecular-data/fetch')
        );
        expect(cnaFetchCall).toBeDefined();
        expect(JSON.parse(String(cnaFetchCall?.[1]?.body))).toEqual({
            sampleIds: ['S-1'],
        });
        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/molecular-data/fetch')
            )
        ).toHaveLength(1);
    });

    it('returns cloned CNA maps so callers cannot mutate the shared cache', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_cna',
                            molecularAlterationType:
                                'COPY_NUMBER_ALTERATION',
                        },
                    ]),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            sampleId: 'S-1',
                            value: 2,
                            gene: {
                                entrezGeneId: 672,
                                hugoGeneSymbol: 'BRCA1',
                                cytoband: '17q21',
                            },
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            alteration: 2,
                            entrezGeneId: 672,
                            hugoGeneSymbol: 'BRCA1',
                            numberOfAlteredCases: 2,
                            numberOfProfiledCases: 10,
                        },
                    ]),
            });
        (global as any).fetch = fetchMock;

        const first = await fetchCnaData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);
        expect(first).not.toBeNull();
        first!.get('S-1')![0].gene = 'MUTATED';

        const second = await fetchCnaData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);

        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/molecular-data/fetch')
            )
        ).toHaveLength(1);
        expect(second?.get('S-1')![0].gene).toBe('BRCA1');
        expect(second).not.toBe(first);
        expect(second?.get('S-1')).not.toBe(first?.get('S-1'));
    });

    it('reuses the cached CNA reference for read-only callers', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_cna',
                            molecularAlterationType:
                                'COPY_NUMBER_ALTERATION',
                        },
                    ]),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            sampleId: 'S-1',
                            value: 2,
                            gene: {
                                entrezGeneId: 672,
                                hugoGeneSymbol: 'BRCA1',
                                cytoband: '17q21',
                            },
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            alteration: 2,
                            entrezGeneId: 672,
                            hugoGeneSymbol: 'BRCA1',
                            numberOfAlteredCases: 2,
                            numberOfProfiledCases: 10,
                        },
                    ]),
            });
        (global as any).fetch = fetchMock;

        const identifiers = [{ studyId: 'study-1', sampleId: 'S-1' }];
        const first = await fetchCnaDataReadOnly('', 'study-1', identifiers);
        const second = await fetchCnaDataReadOnly('', 'study-1', identifiers);

        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/molecular-data/fetch')
            )
        ).toHaveLength(1);
        expect(second).toBe(first);
    });

    it('returns an empty CNA map without posting when no sample identifiers are provided', async () => {
        const fetchMock = jest.fn();
        (global as any).fetch = fetchMock;

        const result = await fetchCnaDataReadOnly('', 'study-1', []);

        expect(result).toEqual(new Map());
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('posts CNA sample IDs in canonical order for equivalent sample sets', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_cna',
                            molecularAlterationType:
                                'COPY_NUMBER_ALTERATION',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });
        (global as any).fetch = fetchMock;

        await fetchCnaData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-2' },
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);

        const cnaFetchCall = fetchMock.mock.calls.find(([url]) =>
            String(url).includes('/molecular-data/fetch')
        );
        expect(cnaFetchCall).toBeDefined();
        expect(JSON.parse(String(cnaFetchCall?.[1]?.body))).toEqual({
            sampleIds: ['S-1', 'S-2'],
        });
    });

    it('reuses the structural-variant request and deduplicates sample molecular identifiers when duplicates are present', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_sv',
                            molecularAlterationType: 'STRUCTURAL_VARIANT',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });
        (global as any).fetch = fetchMock;

        const dedupedIdentifiers = [{ studyId: 'study-1', sampleId: 'S-1' }];
        const duplicateIdentifiers = [
            { studyId: 'study-1', sampleId: 'S-1' },
            { studyId: 'study-1', sampleId: 'S-1' },
        ];

        await fetchStructuralVariantData('', 'study-1', dedupedIdentifiers);
        await fetchStructuralVariantData('', 'study-1', duplicateIdentifiers);

        const structuralVariantFetchCall = fetchMock.mock.calls.find(([url]) =>
            String(url).includes('/api/structural-variant/fetch')
        );
        expect(structuralVariantFetchCall).toBeDefined();
        expect(
            JSON.parse(String(structuralVariantFetchCall?.[1]?.body))
        ).toEqual({
            sampleMolecularIdentifiers: [
                {
                    molecularProfileId: 'study_sv',
                    sampleId: 'S-1',
                },
            ],
        });
        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/api/structural-variant/fetch')
            )
        ).toHaveLength(1);
    });

    it('returns cloned structural-variant maps so callers cannot mutate the shared cache', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_sv',
                            molecularAlterationType: 'STRUCTURAL_VARIANT',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            sampleId: 'S-1',
                            site1HugoSymbol: 'EML4',
                            site2HugoSymbol: 'ALK',
                            site1EntrezGeneId: 27436,
                            site2EntrezGeneId: 238,
                            variantClass: 'Fusion',
                            tumorVariantCount: 1,
                        },
                    ]),
            });
        (global as any).fetch = fetchMock;

        const first = await fetchStructuralVariantData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);
        expect(first).not.toBeNull();
        first!.get('S-1')![0].gene1 = 'MUTATED';

        const second = await fetchStructuralVariantData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);

        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/api/structural-variant/fetch')
            )
        ).toHaveLength(1);
        expect(second?.get('S-1')![0].gene1).toBe('EML4');
        expect(second).not.toBe(first);
        expect(second?.get('S-1')).not.toBe(first?.get('S-1'));
    });

    it('reuses the cached structural-variant reference for read-only callers', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_sv',
                            molecularAlterationType: 'STRUCTURAL_VARIANT',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            sampleId: 'S-1',
                            site1HugoSymbol: 'EML4',
                            site2HugoSymbol: 'ALK',
                            site1EntrezGeneId: 27436,
                            site2EntrezGeneId: 238,
                            variantClass: 'Fusion',
                            tumorVariantCount: 1,
                        },
                    ]),
            });
        (global as any).fetch = fetchMock;

        const identifiers = [{ studyId: 'study-1', sampleId: 'S-1' }];
        const first = await fetchStructuralVariantDataReadOnly(
            '',
            'study-1',
            identifiers
        );
        const second = await fetchStructuralVariantDataReadOnly(
            '',
            'study-1',
            identifiers
        );

        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/api/structural-variant/fetch')
            )
        ).toHaveLength(1);
        expect(second).toBe(first);
    });

    it('returns an empty structural-variant map without posting when no sample identifiers are provided', async () => {
        const fetchMock = jest.fn();
        (global as any).fetch = fetchMock;

        const result = await fetchStructuralVariantDataReadOnly(
            '',
            'study-1',
            []
        );

        expect(result).toEqual(new Map());
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('posts structural-variant sample molecular identifiers in canonical order for equivalent sample sets', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            molecularProfileId: 'study_sv',
                            molecularAlterationType: 'STRUCTURAL_VARIANT',
                        },
                    ]),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });
        (global as any).fetch = fetchMock;

        await fetchStructuralVariantData('', 'study-1', [
            { studyId: 'study-1', sampleId: 'S-2' },
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);

        const structuralVariantFetchCall = fetchMock.mock.calls.find(([url]) =>
            String(url).includes('/api/structural-variant/fetch')
        );
        expect(structuralVariantFetchCall).toBeDefined();
        expect(
            JSON.parse(String(structuralVariantFetchCall?.[1]?.body))
        ).toEqual({
            sampleMolecularIdentifiers: [
                {
                    molecularProfileId: 'study_sv',
                    sampleId: 'S-1',
                },
                {
                    molecularProfileId: 'study_sv',
                    sampleId: 'S-2',
                },
            ],
        });
    });

    it('reuses the sample-timepoint request for the same patient context', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            text: () =>
                Promise.resolve(
                    JSON.stringify([
                        {
                            eventType: 'Sample acquisition',
                            startNumberOfDaysSinceDiagnosis: -10,
                            attributes: [
                                { key: 'SAMPLE_ID', value: 'S-1' },
                            ],
                        },
                    ])
                ),
        });
        (global as any).fetch = fetchMock;

        await fetchSampleTimepointMaps('', 'study-1', 'P-1');
        await fetchSampleTimepointMaps('', 'study-1', 'P-1');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toContain('/clinical-events');
    });

    it('returns cloned sample-timepoint maps so callers cannot mutate the shared cache', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            text: () =>
                Promise.resolve(
                    JSON.stringify([
                        {
                            eventType: 'Sample acquisition',
                            startNumberOfDaysSinceDiagnosis: -10,
                            attributes: [{ key: 'SAMPLE_ID', value: 'S-1' }],
                        },
                        {
                            eventType: 'Sequencing',
                            startNumberOfDaysSinceDiagnosis: 5,
                            attributes: [{ key: 'SAMPLE_ID', value: 'S-1' }],
                        },
                    ])
                ),
        });
        (global as any).fetch = fetchMock;

        const first = await fetchSampleTimepointMaps('', 'study-1', 'P-1');
        expect(first).not.toBeNull();
        first!.acquisitionBySample.set('S-1', 999);
        first!.sequencingBySample.set('S-1', 999);

        const second = await fetchSampleTimepointMaps('', 'study-1', 'P-1');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second?.acquisitionBySample.get('S-1')).toBe(-10);
        expect(second?.sequencingBySample.get('S-1')).toBe(5);
        expect(second).not.toBe(first);
        expect(second?.acquisitionBySample).not.toBe(
            first?.acquisitionBySample
        );
        expect(second?.sequencingBySample).not.toBe(
            first?.sequencingBySample
        );
    });

    it('reuses the mutation-frequency request for the same sample mutation query', async () => {
        const sample = {
            sample_id: 'S-1',
            cancer_type: '',
            cancer_type_detailed: '',
            oncotree_code: '',
            primary_site: '',
            sample_type: 'Primary',
            parts: [],
            oncogenic_mutation_details: [
                {
                    token: 'KRAS p.G12D',
                    entrezGeneId: 3845,
                    proteinStart: 12,
                    proteinEnd: 12,
                },
            ],
        } as Sample;
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ sequencedSampleCount: 10 }),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([{ count: 2 }]),
            });
        (global as any).fetch = fetchMock;

        await fetchMutationFrequencyData('', 'study-1', [sample]);
        await fetchMutationFrequencyData('', 'study-1', [sample]);

        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/api/studies/study-1')
            )
        ).toHaveLength(1);
        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/api/mutation-counts-by-position/fetch')
            )
        ).toHaveLength(1);
    });

    it('returns cloned mutation-frequency results so callers cannot mutate the shared cache', async () => {
        const sample = {
            sample_id: 'S-1',
            cancer_type: '',
            cancer_type_detailed: '',
            oncotree_code: '',
            primary_site: '',
            sample_type: 'Primary',
            parts: [],
            oncogenic_mutation_details: [
                {
                    token: 'KRAS p.G12D',
                    entrezGeneId: 3845,
                    proteinStart: 12,
                    proteinEnd: 12,
                },
            ],
        } as Sample;
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ sequencedSampleCount: 10 }),
            })
            .mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve([
                        {
                            entrezGeneId: 3845,
                            proteinPosStart: 12,
                            proteinPosEnd: 12,
                            count: 2,
                        },
                    ]),
            });
        (global as any).fetch = fetchMock;

        const first = await fetchMutationFrequencyData('', 'study-1', [sample]);
        expect(first).not.toBeNull();
        first!.counts[0].count = 999;

        const second = await fetchMutationFrequencyData('', 'study-1', [sample]);

        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/api/mutation-counts-by-position/fetch')
            )
        ).toHaveLength(1);
        expect(second).toEqual({
            counts: [
                {
                    entrezGeneId: 3845,
                    proteinPosStart: 12,
                    proteinPosEnd: 12,
                    count: 2,
                },
            ],
            total: 10,
        });
        expect(second).not.toBe(first);
        expect(second?.counts).not.toBe(first?.counts);
    });

    it('reuses the cached mutation-frequency reference for read-only callers', async () => {
        const sample = {
            sample_id: 'S-1',
            cancer_type: '',
            cancer_type_detailed: '',
            oncotree_code: '',
            primary_site: '',
            sample_type: 'Primary',
            parts: [],
            oncogenic_mutation_details: [
                {
                    token: 'KRAS p.G12D',
                    entrezGeneId: 3845,
                    proteinStart: 12,
                    proteinEnd: 12,
                },
            ],
        } as Sample;
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ sequencedSampleCount: 10 }),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([{ count: 2 }]),
            });
        (global as any).fetch = fetchMock;

        const first = await fetchMutationFrequencyDataReadOnly('', 'study-1', [
            sample,
        ]);
        const second = await fetchMutationFrequencyDataReadOnly(
            '',
            'study-1',
            [sample]
        );

        expect(
            fetchMock.mock.calls.filter(([url]) =>
                String(url).includes('/mutation-counts-by-position/fetch')
            )
        ).toHaveLength(1);
        expect(second).toBe(first);
    });

    it('posts a canonical mutation-frequency query order for the same logical mutation set', async () => {
        const sample = {
            sample_id: 'S-1',
            cancer_type: '',
            cancer_type_detailed: '',
            oncotree_code: '',
            primary_site: '',
            sample_type: 'Primary',
            parts: [],
            oncogenic_mutation_details: [
                {
                    token: 'KRAS p.G12D',
                    entrezGeneId: 3845,
                    proteinStart: 12,
                    proteinEnd: 12,
                },
                {
                    token: 'EGFR p.L858R',
                    entrezGeneId: 1956,
                    proteinStart: 858,
                    proteinEnd: 858,
                },
            ],
        } as Sample;
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ sequencedSampleCount: 10 }),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([{ count: 2 }]),
            });
        (global as any).fetch = fetchMock;

        await fetchMutationFrequencyData('', 'study-1', [sample]);

        const mutationFrequencyCall = fetchMock.mock.calls.find(([url]) =>
            String(url).includes('/api/mutation-counts-by-position/fetch')
        );
        expect(mutationFrequencyCall).toBeDefined();
        expect(JSON.parse(String(mutationFrequencyCall?.[1]?.body))).toEqual([
            {
                entrezGeneId: 1956,
                proteinPosStart: 858,
                proteinPosEnd: 858,
            },
            {
                entrezGeneId: 3845,
                proteinPosStart: 12,
                proteinPosEnd: 12,
            },
        ]);
    });
});
