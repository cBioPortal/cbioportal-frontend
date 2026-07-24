import {
    shouldSkipEmptyClinicalDataFetch,
    shouldSkipEmptySampleDiscreteCnaFetch,
    shouldSkipEmptySampleMutationFetch,
} from './cbioportalClientInstance';
import { shouldSkipEmptySampleStructuralVariantFetch } from './cbioportalInternalClientInstance';

describe('cbioportal client empty-sample guards', () => {
    it('skips mutation requests with empty sample ids and no sample list', () => {
        expect(
            shouldSkipEmptySampleMutationFetch({
                mutationFilter: { sampleIds: [] },
            })
        ).toBe(true);
        expect(
            shouldSkipEmptySampleMutationFetch({
                mutationFilter: { sampleIds: [], sampleListId: 'study_all' },
            })
        ).toBe(false);
    });

    it('skips discrete cna requests with empty sample ids and no sample list', () => {
        expect(
            shouldSkipEmptySampleDiscreteCnaFetch({
                discreteCopyNumberFilter: { sampleIds: [] },
            })
        ).toBe(true);
        expect(
            shouldSkipEmptySampleDiscreteCnaFetch({
                discreteCopyNumberFilter: {
                    sampleIds: [],
                    sampleListId: 'study_all',
                },
            })
        ).toBe(false);
    });

    it('skips clinical data requests with empty identifiers', () => {
        expect(
            shouldSkipEmptyClinicalDataFetch({
                clinicalDataMultiStudyFilter: { identifiers: [] },
            })
        ).toBe(true);
        expect(
            shouldSkipEmptyClinicalDataFetch({
                clinicalDataMultiStudyFilter: {
                    identifiers: [{ entityId: 'S1', studyId: 'study' }],
                },
            })
        ).toBe(false);
    });

    it('skips structural variant requests with empty sample molecular identifiers', () => {
        expect(
            shouldSkipEmptySampleStructuralVariantFetch({
                structuralVariantFilter: { sampleMolecularIdentifiers: [] },
            })
        ).toBe(true);
        expect(
            shouldSkipEmptySampleStructuralVariantFetch({
                structuralVariantFilter: {
                    sampleMolecularIdentifiers: [
                        {
                            molecularProfileId: 'profile',
                            sampleId: 'sample',
                        },
                    ],
                },
            })
        ).toBe(false);
    });
});
