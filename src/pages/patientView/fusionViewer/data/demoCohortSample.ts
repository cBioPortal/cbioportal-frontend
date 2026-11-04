import { StructuralVariant } from 'cbioportal-ts-api-client';

// Synthetic multi-sample cohort for the Fusion Cohort Builder demo. No real
// patient/sample identifiers. GRCh38-style coordinates are illustrative only.
// Chosen to exercise every visual state: a recurrent pair with mixed frame
// across samples, one sample with two breakpoints of that pair, single-sample
// one-offs, an out-of-frame-only pair, and an intragenic GENE::- event.

function makeSV(partial: Partial<StructuralVariant>): StructuralVariant {
    return {
        uniqueSampleKey: '',
        uniquePatientKey: '',
        molecularProfileId: 'demo_cohort_fusion',
        structuralVariantId: 0,
        sampleId: '',
        patientId: '',
        studyId: 'demo_cohort',
        site1EntrezGeneId: 0,
        site2EntrezGeneId: 0,
        site1HugoSymbol: '',
        site2HugoSymbol: '',
        site1EnsemblTranscriptId: '',
        site2EnsemblTranscriptId: '',
        site1Chromosome: '',
        site2Chromosome: '',
        site1Position: 0,
        site2Position: 0,
        site1Description: '',
        site2Description: '',
        site1Region: '',
        site2Region: '',
        site1RegionNumber: 0,
        site2RegionNumber: 0,
        site2EffectOnFrame: '',
        ncbiBuild: 'GRCh38',
        dnaSupport: '',
        rnaSupport: '',
        normalReadCount: 0,
        tumorReadCount: 0,
        normalVariantCount: 0,
        tumorVariantCount: 0,
        normalPairedEndReadCount: 0,
        tumorPairedEndReadCount: 0,
        normalSplitReadCount: 0,
        tumorSplitReadCount: 0,
        annotation: '',
        breakpointType: '',
        connectionType: '',
        eventInfo: '',
        variantClass: '',
        length: 0,
        comments: '',
        ...partial,
    } as StructuralVariant;
}

const tmprss2 = {
    site1HugoSymbol: 'TMPRSS2',
    site1Chromosome: '21',
    site1EnsemblTranscriptId: 'ENST00000332149',
    site2HugoSymbol: 'ERG',
    site2Chromosome: '21',
    site2EnsemblTranscriptId: 'ENST00000288319',
    variantClass: 'FUSION',
    eventInfo: 'Fusion {TMPRSS2::ERG}',
};

export const DEMO_COHORT_STRUCTURAL_VARIANTS: StructuralVariant[] = [
    // SAMPLE_001 — TMPRSS2::ERG, two breakpoints, both in-frame
    makeSV({
        ...tmprss2,
        sampleId: 'SAMPLE_001',
        patientId: 'SAMPLE_001',
        site1Position: 41508081,
        site2Position: 38445621,
        site2EffectOnFrame: 'in_frame',
        tumorVariantCount: 12,
    }),
    makeSV({
        ...tmprss2,
        sampleId: 'SAMPLE_001',
        patientId: 'SAMPLE_001',
        site1Position: 41498119,
        site2Position: 38423561,
        site2EffectOnFrame: 'in_frame',
        tumorVariantCount: 5,
    }),
    // SAMPLE_002 — TMPRSS2::ERG in-frame + an intragenic KMT2A event
    makeSV({
        ...tmprss2,
        sampleId: 'SAMPLE_002',
        patientId: 'SAMPLE_002',
        site1Position: 41508081,
        site2Position: 38445621,
        site2EffectOnFrame: 'in_frame',
        tumorVariantCount: 9,
    }),
    makeSV({
        sampleId: 'SAMPLE_002',
        patientId: 'SAMPLE_002',
        site1HugoSymbol: 'KMT2A',
        site1Chromosome: '11',
        site1Position: 118482040,
        site1EnsemblTranscriptId: 'ENST00000534358',
        site2HugoSymbol: '', // no valid site2 -> intragenic GENE::- key
        site2EffectOnFrame: '',
        eventInfo: 'Intragenic {KMT2A}',
        tumorVariantCount: 3,
    }),
    // SAMPLE_003 — TMPRSS2::ERG out-of-frame
    makeSV({
        ...tmprss2,
        sampleId: 'SAMPLE_003',
        patientId: 'SAMPLE_003',
        site1Position: 41508081,
        site2Position: 38380027,
        site2EffectOnFrame: 'frameshift',
        tumorVariantCount: 7,
    }),
    // SAMPLE_004 — EWSR1::FLI1 in-frame one-off
    makeSV({
        sampleId: 'SAMPLE_004',
        patientId: 'SAMPLE_004',
        site1HugoSymbol: 'EWSR1',
        site1Chromosome: '22',
        site1Position: 29683123,
        site1EnsemblTranscriptId: 'ENST00000397938',
        site2HugoSymbol: 'FLI1',
        site2Chromosome: '11',
        site2Position: 128675261,
        site2EnsemblTranscriptId: 'ENST00000527786',
        site2EffectOnFrame: 'in_frame',
        variantClass: 'FUSION',
        eventInfo: 'Fusion {EWSR1::FLI1}',
        tumorVariantCount: 15,
    }),
    // SAMPLE_005 — CCDC6::RET out-of-frame one-off
    makeSV({
        sampleId: 'SAMPLE_005',
        patientId: 'SAMPLE_005',
        site1HugoSymbol: 'CCDC6',
        site1Chromosome: '10',
        site1Position: 59906122,
        site1EnsemblTranscriptId: 'ENST00000263102',
        site2HugoSymbol: 'RET',
        site2Chromosome: '10',
        site2Position: 43116584,
        site2EnsemblTranscriptId: 'ENST00000355710',
        site2EffectOnFrame: 'frameshift',
        variantClass: 'FUSION',
        eventInfo: 'Fusion {CCDC6::RET}',
        tumorVariantCount: 4,
    }),
];

export const DEMO_COHORT_STUDY_ID = 'demo_cohort';
