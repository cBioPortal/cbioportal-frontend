/**
 * @jest-environment jsdom
 */
import {
    clearMolecularProfileIdCache,
    fetchCnaData,
    fetchMutationData,
} from './wsiCbioportalDataUtils';

describe('wsiCbioportalDataUtils molecular profile caching', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = (global as any).fetch;
        clearMolecularProfileIdCache();
    });

    afterEach(() => {
        (global as any).fetch = originalFetch;
        clearMolecularProfileIdCache();
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
});
