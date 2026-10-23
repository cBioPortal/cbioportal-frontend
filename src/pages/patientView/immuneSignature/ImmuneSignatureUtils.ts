import { ClinicalData, GenericAssayData } from 'cbioportal-ts-api-client';

export enum ImmuneSignatureAttribute {
    KNN_CLASS = 'ISIG_KNN_CLASS',
    KNN_CONFIDENCE = 'ISIG_KNN_CONFIDENCE',
    CENTROID_CLASS = 'ISIG_CENTROID_CLASS',
    METHODS_AGREE = 'ISIG_METHODS_AGREE',
    SCALING_MODE = 'ISIG_SCALING_MODE',
}

export const MFP_CLASSES = ['D', 'F', 'IE', 'IE/F'];

export const MFP_CLASS_SCORE_ATTRIBUTES: Record<string, string> = {
    D: 'ISIG_PROB_D',
    F: 'ISIG_PROB_F',
    IE: 'ISIG_PROB_IE',
    'IE/F': 'ISIG_PROB_IE_F',
};

// Entities read from the ISIG_PROBABILITY generic assay profile. All other
// fields, including the KNN confidence, are read from sample clinical data.
const GENERIC_ASSAY_ATTRIBUTES = new Set<string>(
    Object.values(MFP_CLASS_SCORE_ATTRIBUTES)
);

export const MFP_CLASS_COLORS: Record<string, string> = {
    D: '#c8b631',
    F: '#c4375b',
    IE: '#3b4fb8',
    'IE/F': '#2a9d8f',
};

export const MFP_CLASS_LABELS: Record<string, string> = {
    D: 'Desert (D)',
    F: 'Fibrotic (F)',
    IE: 'Immune Enriched (IE)',
    'IE/F': 'Immune Enriched / Fibrotic (IE/F)',
};

export type ImmuneSignature = {
    knnClass: string;
    knnConfidence?: string;
    centroidClass?: string;
    methodsAgree?: boolean;
    scalingMode?: string;
    classScores: Record<string, number>;
};

function toNumber(value: string | undefined): number | undefined {
    if (value === undefined) {
        return undefined;
    }
    const n = parseFloat(value);
    return isNaN(n) ? undefined : n;
}

function toBoolean(value: string | undefined): boolean | undefined {
    if (value === undefined) {
        return undefined;
    }
    return value.toLowerCase() === 'true';
}

// Generic assay values take precedence over clinical data for the
// GENERIC_ASSAY_ATTRIBUTES, whose entity stable ids match the attribute ids.
// Returns undefined when the sample has no MFP class.
export function getImmuneSignature(
    sampleClinicalData: ClinicalData[],
    sampleGenericAssayData: GenericAssayData[] = []
): ImmuneSignature | undefined {
    const values: Record<string, string> = {};
    sampleClinicalData.forEach(d => {
        values[d.clinicalAttributeId] = d.value;
    });
    sampleGenericAssayData.forEach(d => {
        if (GENERIC_ASSAY_ATTRIBUTES.has(d.stableId)) {
            values[d.stableId] = d.value;
        }
    });

    const knnClass = values[ImmuneSignatureAttribute.KNN_CLASS];
    if (!knnClass) {
        return undefined;
    }

    const classScores: Record<string, number> = {};
    MFP_CLASSES.forEach(cls => {
        classScores[cls] =
            toNumber(values[MFP_CLASS_SCORE_ATTRIBUTES[cls]]) || 0;
    });

    return {
        knnClass,
        knnConfidence: values[ImmuneSignatureAttribute.KNN_CONFIDENCE],
        centroidClass: values[ImmuneSignatureAttribute.CENTROID_CLASS],
        methodsAgree: toBoolean(values[ImmuneSignatureAttribute.METHODS_AGREE]),
        scalingMode: values[ImmuneSignatureAttribute.SCALING_MODE],
        classScores,
    };
}
