import _ from 'lodash';
import { ClinicalData, GenericAssayData } from 'cbioportal-ts-api-client';
import {
    GenericAssayTypeConstants,
    getGenericAssayCategories,
} from 'shared/lib/GenericAssayUtils/GenericAssayConfig';

export enum ImmuneSignatureAttribute {
    KNN_CLASS = 'ISIG_KNN_CLASS',
    KNN_CONFIDENCE = 'ISIG_KNN_CONFIDENCE',
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

// Colors and labels are shared with the oncoprint's immune signature tracks.
const MFP_CATEGORIES = _.keyBy(
    getGenericAssayCategories(GenericAssayTypeConstants.ISIG_PROBABILITY),
    c => c.stableId
);

export const MFP_CLASS_COLORS: Record<string, string> = _.mapValues(
    MFP_CLASS_SCORE_ATTRIBUTES,
    stableId => MFP_CATEGORIES[stableId].color
);

export const MFP_CLASS_LABELS: Record<string, string> = _.mapValues(
    MFP_CLASS_SCORE_ATTRIBUTES,
    stableId => MFP_CATEGORIES[stableId].label
);

export type ImmuneSignature = {
    knnClass: string;
    knnConfidence?: string;
    classScores: Record<string, number>;
};

function toNumber(value: string | undefined): number | undefined {
    if (value === undefined) {
        return undefined;
    }
    const n = parseFloat(value);
    return isNaN(n) ? undefined : n;
}

// Generic assay values take precedence over clinical data for the
// GENERIC_ASSAY_ATTRIBUTES, whose entity stable ids match the attribute ids.
// The class is the clinical KNN class, or else the most probable class.
// Returns undefined when the sample has neither a class nor probabilities.
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

    const scores = MFP_CLASSES.map(cls =>
        toNumber(values[MFP_CLASS_SCORE_ATTRIBUTES[cls]])
    );
    const hasScores = scores.some(score => score !== undefined);
    const classScores: Record<string, number> = {};
    MFP_CLASSES.forEach((cls, i) => {
        classScores[cls] = scores[i] || 0;
    });

    const knnClass =
        values[ImmuneSignatureAttribute.KNN_CLASS] ||
        (hasScores
            ? MFP_CLASSES.reduce((best, cls) =>
                  classScores[cls] > classScores[best] ? cls : best
              )
            : undefined);
    if (!knnClass) {
        return undefined;
    }

    return {
        knnClass,
        knnConfidence: values[ImmuneSignatureAttribute.KNN_CONFIDENCE],
        classScores,
    };
}
