import { ClinicalData, Sample } from 'cbioportal-ts-api-client';
import { ImmuneSignatureAttribute } from './ImmuneSignatureUtils';
import MOCK_CLINICAL_SAMPLE_FILE from './mockImmuneSignatureClinicalFile';

// Placeholder sample-level clinical data for the immune signature, read from
// a cBioPortal clinical sample file until the portal serves these attributes.

type ParsedAttribute = {
    clinicalAttributeId: string;
    displayName: string;
    description: string;
    datatype: string;
    priority: string;
};

export type ParsedClinicalSampleFile = {
    attributes: ParsedAttribute[];
    rowsBySampleId: Map<string, string[]>;
};

export function parseClinicalSampleFile(
    file: string
): ParsedClinicalSampleFile {
    const lines = file.split('\n').filter(line => line.length > 0);
    const [displayNames, descriptions, datatypes, priorities] = lines
        .slice(0, 4)
        .map(line => line.replace(/^#/, '').split('\t'));
    const attributeIds = lines[4].split('\t');
    const attributes = attributeIds.map((clinicalAttributeId, i) => ({
        clinicalAttributeId,
        displayName: displayNames[i],
        description: descriptions[i],
        datatype: datatypes[i],
        priority: priorities[i],
    }));
    const sampleIdIndex = attributeIds.indexOf('SAMPLE_ID');
    const rowsBySampleId = new Map<string, string[]>();
    lines.slice(5).forEach(line => {
        const row = line.split('\t');
        if (!rowsBySampleId.has(row[sampleIdIndex])) {
            rowsBySampleId.set(row[sampleIdIndex], row);
        }
    });
    return { attributes, rowsBySampleId };
}

export function addClinicalDataFromFile(
    clinicalData: ClinicalData[],
    samples: Sample[],
    { attributes, rowsBySampleId }: ParsedClinicalSampleFile
): ClinicalData[] {
    const samplesWithData = new Set(
        clinicalData
            .filter(
                d =>
                    d.clinicalAttributeId === ImmuneSignatureAttribute.KNN_CLASS
            )
            .map(d => d.uniqueSampleKey)
    );
    const fileData: ClinicalData[] = [];
    for (const sample of samples) {
        const row = rowsBySampleId.get(sample.sampleId);
        if (!row || samplesWithData.has(sample.uniqueSampleKey)) {
            continue;
        }
        attributes.forEach((attribute, i) => {
            if (attribute.clinicalAttributeId === 'SAMPLE_ID') {
                return;
            }
            fileData.push({
                clinicalAttribute: {
                    ...attribute,
                    patientAttribute: false,
                    studyId: sample.studyId,
                },
                clinicalAttributeId: attribute.clinicalAttributeId,
                patientAttribute: false,
                patientId: sample.patientId,
                sampleId: sample.sampleId,
                studyId: sample.studyId,
                uniquePatientKey: sample.uniquePatientKey,
                uniqueSampleKey: sample.uniqueSampleKey,
                value: row[i],
            });
        });
    }
    return clinicalData.concat(fileData);
}

// The portal database now serves the immune signature attributes, so the
// placeholder file is not merged in. Set to true to re-enable it.
const USE_MOCK_IMMUNE_SIGNATURE_DATA = false;

let mockFile: ParsedClinicalSampleFile | undefined;

export function addMockImmuneSignatureClinicalData(
    clinicalData: ClinicalData[],
    samples: Sample[]
): ClinicalData[] {
    if (!USE_MOCK_IMMUNE_SIGNATURE_DATA) {
        return clinicalData;
    }
    if (!mockFile) {
        mockFile = parseClinicalSampleFile(MOCK_CLINICAL_SAMPLE_FILE);
    }
    return addClinicalDataFromFile(clinicalData, samples, mockFile);
}
