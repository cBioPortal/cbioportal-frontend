import { ClinicalData } from 'cbioportal-ts-api-client';

export enum ImmuneSignatureAttribute {
    KNN_CLASS = 'ISIG_KNN_CLASS',
    KNN_PROBABILITY = 'ISIG_KNN_PROBABILITY',
    KNN_CONFIDENCE = 'ISIG_KNN_CONFIDENCE',
    CENTROID_CLASS = 'ISIG_CENTROID_CLASS',
    CENTROID_CORR = 'ISIG_CENTROID_CORR',
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
    knnProbability?: number;
    knnConfidence?: string;
    centroidClass?: string;
    centroidCorr?: number;
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

// Returns undefined when the sample has no MFP class.
export function getImmuneSignature(
    sampleClinicalData: ClinicalData[]
): ImmuneSignature | undefined {
    const values: Record<string, string> = {};
    sampleClinicalData.forEach(d => {
        values[d.clinicalAttributeId] = d.value;
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
        knnProbability: toNumber(
            values[ImmuneSignatureAttribute.KNN_PROBABILITY]
        ),
        knnConfidence: values[ImmuneSignatureAttribute.KNN_CONFIDENCE],
        centroidClass: values[ImmuneSignatureAttribute.CENTROID_CLASS],
        centroidCorr: toNumber(values[ImmuneSignatureAttribute.CENTROID_CORR]),
        methodsAgree: toBoolean(values[ImmuneSignatureAttribute.METHODS_AGREE]),
        scalingMode: values[ImmuneSignatureAttribute.SCALING_MODE],
        classScores,
    };
}
