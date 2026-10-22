import { assert } from 'chai';
import { GenericAssayData, Sample } from 'cbioportal-ts-api-client';
import { getImmuneSignature } from './ImmuneSignatureUtils';
import {
    addClinicalDataFromFile,
    parseClinicalSampleFile,
} from './mockImmuneSignatureClinicalData';

function makeSample(sampleId: string): Sample {
    return {
        sampleId,
        patientId: 'P1',
        studyId: 'study',
        uniqueSampleKey: `${sampleId}_KEY`,
        uniquePatientKey: 'P1_KEY',
    } as Sample;
}

const FILE = [
    '#Sample Identifier\tMFP Class (KNN)\tMFP Methods Agree\tMFP Score D\tMFP Score F\tMFP Score IE\tMFP Score IE/F',
    '#Sample Identifier\tclass\tagree\td\tf\tie\tief',
    '#STRING\tSTRING\tSTRING\tNUMBER\tNUMBER\tNUMBER\tNUMBER',
    '#1\t1\t1\t1\t1\t1\t1',
    'SAMPLE_ID\tISIG_KNN_CLASS\tISIG_METHODS_AGREE\tISIG_PROB_D\tISIG_PROB_F\tISIG_PROB_IE\tISIG_PROB_IE_F',
    'S1\tF\tTrue\t0.25\t0.75\t0.0\t0.0',
    'S2\tIE\tFalse\t0.0\t0.0\t1.0\t0.0',
    'S2\tD\tFalse\t1.0\t0.0\t0.0\t0.0',
    '',
].join('\n');

describe('ImmuneSignatureUtils', () => {
    const file = parseClinicalSampleFile(FILE);

    it('parses the clinical sample file header rows', () => {
        assert.deepEqual(file.attributes[6], {
            clinicalAttributeId: 'ISIG_PROB_IE_F',
            displayName: 'MFP Score IE/F',
            description: 'ief',
            datatype: 'NUMBER',
            priority: '1',
        });
    });

    it('keeps the first row for a duplicated sample id', () => {
        assert.equal(file.rowsBySampleId.get('S2')![1], 'IE');
    });

    it('adds clinical data only for samples whose id is in the file', () => {
        const clinicalData = addClinicalDataFromFile(
            [],
            [makeSample('S1'), makeSample('MISSING')],
            file
        );
        assert.isTrue(
            clinicalData.every(
                d =>
                    d.sampleId === 'S1' &&
                    d.uniqueSampleKey === 'S1_KEY' &&
                    d.clinicalAttribute.studyId === 'study'
            )
        );
        assert.deepEqual(getImmuneSignature(clinicalData), {
            knnClass: 'F',
            knnConfidence: undefined,
            centroidClass: undefined,
            methodsAgree: true,
            scalingMode: undefined,
            classScores: { D: 0.25, F: 0.75, IE: 0, 'IE/F': 0 },
        });
    });

    it('does not add data to samples that already have it', () => {
        const existing = addClinicalDataFromFile([], [makeSample('S1')], file);
        assert.equal(
            addClinicalDataFromFile(existing, [makeSample('S1')], file).length,
            existing.length
        );
    });

    it('reads only the probability fields from generic assay data', () => {
        const clinicalData = addClinicalDataFromFile(
            [],
            [makeSample('S1')],
            file
        );
        const genericAssayData = [
            { stableId: 'ISIG_PROB_F', value: '0.6' },
            { stableId: 'ISIG_PROB_IE_F', value: '0.4' },
            { stableId: 'ISIG_KNN_CLASS', value: 'IE' },
            { stableId: 'ISIG_KNN_CONFIDENCE', value: 'low' },
        ] as GenericAssayData[];
        const signature = getImmuneSignature(clinicalData, genericAssayData)!;
        assert.equal(signature.knnClass, 'F');
        assert.isUndefined(signature.knnConfidence);
        assert.deepEqual(signature.classScores, {
            D: 0.25,
            F: 0.6,
            IE: 0,
            'IE/F': 0.4,
        });
    });

    it('returns undefined when the sample has no MFP class', () => {
        assert.isUndefined(getImmuneSignature([]));
    });
});
