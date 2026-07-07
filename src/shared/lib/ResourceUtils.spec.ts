import { assert } from 'chai';
import {
    getStudyResourceCount,
    hasNonEmptyDescriptionInDefinitions,
    hasNonEmptyDescriptionInResources,
} from './ResourceUtils';
import { ResourceCount, ResourceDefinition } from 'cbioportal-ts-api-client';

function makeDef(description: string | undefined): ResourceDefinition {
    return {
        resourceId: 'R1',
        displayName: 'Resource',
        description: description as string,
        priority: '1',
        customMetaData: '',
        resourceType: 'PATIENT',
        studyId: 'study1',
        openByDefault: false,
    };
}

function makeResourceData(
    description: string | undefined
): {
    resourceDefinition?: ResourceDefinition;
} {
    return { resourceDefinition: makeDef(description) };
}

describe('hasNonEmptyDescriptionInDefinitions', () => {
    it('returns false for undefined input', () => {
        assert.isFalse(hasNonEmptyDescriptionInDefinitions(undefined));
    });

    it('returns false for empty array', () => {
        assert.isFalse(hasNonEmptyDescriptionInDefinitions([]));
    });

    it('returns false when all descriptions are empty strings', () => {
        assert.isFalse(
            hasNonEmptyDescriptionInDefinitions([makeDef(''), makeDef('')])
        );
    });

    it('returns false when all descriptions are undefined', () => {
        assert.isFalse(
            hasNonEmptyDescriptionInDefinitions([
                makeDef(undefined),
                makeDef(undefined),
            ])
        );
    });

    it('returns true when at least one description is non-empty', () => {
        assert.isTrue(
            hasNonEmptyDescriptionInDefinitions([
                makeDef(''),
                makeDef('Some description'),
            ])
        );
    });

    it('returns true when all descriptions are non-empty', () => {
        assert.isTrue(
            hasNonEmptyDescriptionInDefinitions([
                makeDef('Desc A'),
                makeDef('Desc B'),
            ])
        );
    });
});

describe('hasNonEmptyDescriptionInResources', () => {
    it('returns false for empty array', () => {
        assert.isFalse(hasNonEmptyDescriptionInResources([]));
    });

    it('returns false when all descriptions are empty', () => {
        assert.isFalse(
            hasNonEmptyDescriptionInResources([
                makeResourceData(''),
                makeResourceData(''),
            ])
        );
    });

    it('returns false when resourceDefinition is absent', () => {
        assert.isFalse(
            hasNonEmptyDescriptionInResources([
                { resourceDefinition: undefined },
            ])
        );
    });

    it('returns true when at least one resource has a non-empty description', () => {
        assert.isTrue(
            hasNonEmptyDescriptionInResources([
                makeResourceData(''),
                makeResourceData('Has a description'),
            ])
        );
    });

    it('returns true when all resources have non-empty descriptions', () => {
        assert.isTrue(
            hasNonEmptyDescriptionInResources([
                makeResourceData('Desc A'),
                makeResourceData('Desc B'),
            ])
        );
    });
});

describe('getStudyResourceCount', () => {
    function makeResourceCount(
        resourceType: 'PATIENT' | 'SAMPLE' | 'STUDY',
        patientCount: number,
        sampleCount: number
    ): ResourceCount {
        return {
            resourceId: 'HE',
            displayName: 'H&E Slide',
            description: 'H&E Slide',
            priority: '1',
            customMetaData: '',
            resourceType,
            studyId: 'study1',
            openByDefault: true,
            patientCount,
            sampleCount,
        };
    }

    it('returns patientCount for patient-level resources', () => {
        assert.equal(getStudyResourceCount(makeResourceCount('PATIENT', 12, 99)), 12);
    });

    it('returns sampleCount for sample-level resources', () => {
        assert.equal(getStudyResourceCount(makeResourceCount('SAMPLE', 12, 99)), 99);
    });

    it('returns 0 for undefined resources', () => {
        assert.equal(getStudyResourceCount(undefined), 0);
    });
});
