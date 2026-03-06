import { IOncoKbData } from 'cbioportal-utils';
import { getAnnotatedSamples } from './PatientReportUtils';
import {
    ClinicalData,
    DiscreteCopyNumberData,
    Mutation,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import { assert } from 'chai';

describe('Patient Report Utils', () => {
    const clinicalDataGroupedBySample: {
        id: string;
        clinicalData: ClinicalData[];
    }[] = [
        { id: '1', clinicalData: [] },
        { id: '2', clinicalData: [] },
    ];
    const uniqueSampleKeyToTumorType: { [sampleId: string]: string } = {
        '1': 'Melanoma',
        '2': 'Breast Cancer',
    };
    const mutations: Partial<Mutation>[] = [
        {
            entrezGeneId: 673,
            gene: {
                entrezGeneId: 673,
                geneticEntityId: 0,
                hugoGeneSymbol: 'BRAF',
                type: '',
            },
            mutationType: 'Missense_Mutation',
            proteinChange: 'V600E',
            sampleId: '1',
            uniqueSampleKey: '1',
        },
    ];
    const mutationsOncoKBData: IOncoKbData = {
        indicatorMap: { '673_Melanoma_V600E_Missense_Mutation': {} as any },
    };
    const copyNumberAlterations: Partial<DiscreteCopyNumberData>[] = [
        {
            alteration: 2, // Amplification
            entrezGeneId: 2064,
            gene: {
                entrezGeneId: 2064,
                geneticEntityId: 0,
                hugoGeneSymbol: 'ERBB2',
                type: '',
            },
            molecularProfileId: '',
            sampleId: '1',
            uniqueSampleKey: '1',
        },
    ];
    const copyNumberAlterationsOncoKBData: IOncoKbData = {
        indicatorMap: { '2064_Melanoma_Amplification': {} as any },
    };
    const structuralVariants: Partial<StructuralVariant>[] = [
        {
            sampleId: '2',
            site1EntrezGeneId: 613,
            site1HugoSymbol: 'BCR',
            site2EntrezGeneId: 25,
            site2HugoSymbol: 'ABL1',
            uniqueSampleKey: '2',
        },
    ];
    const structuralVariantsOncoKBData: IOncoKbData = { indicatorMap: {} };

    it('should construct samples from alteration data', () => {
        const annotatedSamples = getAnnotatedSamples(
            clinicalDataGroupedBySample,
            uniqueSampleKeyToTumorType,
            mutations as Mutation[],
            mutationsOncoKBData,
            copyNumberAlterations as DiscreteCopyNumberData[],
            copyNumberAlterationsOncoKBData,
            structuralVariants as StructuralVariant[],
            structuralVariantsOncoKBData
        );

        const sample1 = annotatedSamples.find(sample => sample.id === '1');
        assert(sample1 !== undefined);
        const sample2 = annotatedSamples.find(sample => sample.id === '2');
        assert(sample2 !== undefined);

        assert(sample1!.mutations.length === 1);
        assert(sample1!.copyNumberAlterations.length === 1);
        assert(sample1!.structuralVariants.length === 0);

        assert(sample2!.mutations.length === 0);
        assert(sample2!.copyNumberAlterations.length === 0);
        assert(sample2!.structuralVariants.length === 1);

        const structuralVariant = sample2!.structuralVariants[0];
        assert(structuralVariant.query.hugoSymbol === 'BCR');
        assert(structuralVariant.query.alteration === 'BCR-ABL1 Fusion');
        assert(structuralVariant.query.consequence === 'fusion');
    });
});
