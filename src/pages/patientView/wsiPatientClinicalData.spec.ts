import { assert } from 'chai';
import { wsiPatientClinicalData } from './PatientViewPageTabs';

function complete<T>(result: T) {
    return { isComplete: true, isError: false, result };
}

function makeStore(overrides: any = {}): any {
    return {
        studyId: 'study_a',
        pageMode: 'patient',
        cohortStudyIds: complete(['study_a']),
        clinicalAttributes: complete([{ clinicalAttributeId: 'AGE' }]),
        clinicalDataPatient: complete([{ clinicalAttributeId: 'AGE' }]),
        clinicalDataForSamples: complete([]),
        ...overrides,
    };
}

describe('wsiPatientClinicalData', () => {
    it("reuses the page's data for a cohort of the patient's own study", () => {
        const data = wsiPatientClinicalData(makeStore());
        assert.deepEqual(data!.attributes as any, [
            { clinicalAttributeId: 'AGE' },
        ]);
    });

    it('leaves the fetch to the viewer when the cohort spans other studies', () => {
        // The page's attributes may then hold another study's definitions.
        const store = makeStore({
            cohortStudyIds: complete(['study_b', 'study_a']),
        });
        assert.isUndefined(wsiPatientClinicalData(store));
    });

    it('waits while the cohort is loading', () => {
        const store = makeStore({
            cohortStudyIds: { isComplete: false, isError: false },
        });
        assert.isNull(wsiPatientClinicalData(store));
    });

    it('leaves the fetch to the viewer in the sample view', () => {
        assert.isUndefined(
            wsiPatientClinicalData(makeStore({ pageMode: 'sample' }))
        );
    });
});
