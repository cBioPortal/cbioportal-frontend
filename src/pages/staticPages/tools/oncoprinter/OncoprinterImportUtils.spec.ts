import { assert } from 'chai';
import {
    getOncoprinterClinicalInput,
    getOncoprinterGeneticInput,
} from './OncoprinterImportUtils';
import { AlterationTypeConstants } from '../../../resultsView/ResultsViewPageStore';
import { PUTATIVE_DRIVER } from '../../../../shared/constants';
import { SpecialAttribute } from '../../../../shared/cache/ClinicalDataCache';
import { ONCOPRINTER_CLINICAL_VAL_NA } from './OncoprinterClinicalUtils';

describe('OncoprinterImportUtils', () => {
    describe('getOncoprinterGeneticInput', () => {
        const data: any[] = [
            {
                sample: 'sample1',
                patient: 'patient1',
                data: [
                    {
                        molecularProfileAlterationType:
                            AlterationTypeConstants.MUTATION_EXTENDED,
                        proteinChange: 'proteinChange1',
                        mutationType: 'missense',
                        hugoGeneSymbol: 'gene1',
                        mutationStatus: 'germline',
                        driverFilter: PUTATIVE_DRIVER,
                    },
                    {
                        molecularProfileAlterationType:
                            AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                        hugoGeneSymbol: 'gene1',
                        value: -2,
                    },
                    {
                        molecularProfileAlterationType:
                            AlterationTypeConstants.MRNA_EXPRESSION,
                        hugoGeneSymbol: 'gene1',
                        alterationSubType: 'high',
                    },
                ],
            },
            {
                sample: 'sample1',
                patient: 'patient1',
                data: [
                    {
                        molecularProfileAlterationType:
                            AlterationTypeConstants.MUTATION_EXTENDED,
                        proteinChange: 'promoter',
                        mutationType: 'promoter',
                        hugoGeneSymbol: 'gene2',
                    },
                    {
                        molecularProfileAlterationType:
                            AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                        hugoGeneSymbol: 'gene2',
                        value: 1,
                    },
                    {
                        molecularProfileAlterationType:
                            AlterationTypeConstants.MRNA_EXPRESSION,
                        hugoGeneSymbol: 'gene2',
                        alterationSubType: 'low',
                    },
                ],
            },
            {
                sample: 'sample2',
                patient: 'patient2',
                data: [
                    {
                        molecularProfileAlterationType:
                            AlterationTypeConstants.MUTATION_EXTENDED,
                        proteinChange: 'proteinChange2',
                        mutationType: 'frameshift',
                        mutationStatus: 'germline',
                        hugoGeneSymbol: 'gene1',
                    },
                    {
                        molecularProfileAlterationType:
                            AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                        hugoGeneSymbol: 'gene1',
                        value: 2,
                    },
                    {
                        molecularProfileAlterationType:
                            AlterationTypeConstants.PROTEIN_LEVEL,
                        hugoGeneSymbol: 'gene1',
                        alterationSubType: 'high',
                    },
                ],
            },
            {
                sample: 'sample2',
                patient: 'patient2',
                data: [
                    {
                        molecularProfileAlterationType:
                            AlterationTypeConstants.MUTATION_EXTENDED,
                        proteinChange: 'proteinChange3',
                        mutationType: 'fusion',
                        hugoGeneSymbol: 'gene2',
                    },
                    {
                        molecularProfileAlterationType:
                            AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                        hugoGeneSymbol: 'gene2',
                        value: 0,
                    },
                    {
                        molecularProfileAlterationType:
                            AlterationTypeConstants.PROTEIN_LEVEL,
                        hugoGeneSymbol: 'gene2',
                        alterationSubType: 'low',
                    },
                ],
            },
        ];
        it('produces correct oncoprinter genetic input for 2 samples x 2 genes', () => {
            assert.deepEqual(
                getOncoprinterGeneticInput(
                    data,
                    ['sample1', 'sample2'],
                    'sample'
                ),
                'sample1  gene1  proteinChange1  MISSENSE_GERMLINE_DRIVER\n' +
                    'sample1  gene1  HOMDEL  CNA\n' +
                    'sample1  gene1  HIGH  EXP\n' +
                    'sample1  gene2  promoter  PROMOTER\n' +
                    'sample1  gene2  GAIN  CNA\n' +
                    'sample1  gene2  LOW  EXP\n' +
                    'sample2  gene1  proteinChange2  TRUNC_GERMLINE\n' +
                    'sample2  gene1  AMP  CNA\n' +
                    'sample2  gene1  HIGH  PROT\n' +
                    'sample2  gene2  proteinChange3  FUSION\n' +
                    'sample2\n' +
                    'sample2  gene2  LOW  PROT\n' +
                    'sample1\nsample2'
            );
        });
        it('produces correct oncoprinter genetic input for 2 patients x 2 genes', () => {
            assert.deepEqual(
                getOncoprinterGeneticInput(
                    data,
                    ['patient1', 'patient2'],
                    'patient'
                ),
                'patient1  gene1  proteinChange1  MISSENSE_GERMLINE_DRIVER\n' +
                    'patient1  gene1  HOMDEL  CNA\n' +
                    'patient1  gene1  HIGH  EXP\n' +
                    'patient1  gene2  promoter  PROMOTER\n' +
                    'patient1  gene2  GAIN  CNA\n' +
                    'patient1  gene2  LOW  EXP\n' +
                    'patient2  gene1  proteinChange2  TRUNC_GERMLINE\n' +
                    'patient2  gene1  AMP  CNA\n' +
                    'patient2  gene1  HIGH  PROT\n' +
                    'patient2  gene2  proteinChange3  FUSION\n' +
                    'patient2\n' +
                    'patient2  gene2  LOW  PROT\n' +
                    'patient1\npatient2'
            );
        });
    });

    describe('getOncoprinterClinicalInput', () => {
        const data: any[] = [
            {
                attr_id: 'MUTATION_COUNT',
                sample: 'sample1',
                patient: 'patient1',
                attr_val: 5,
            },
            {
                attr_id: 'cancer_type',
                sample: 'sample1',
                patient: 'patient1',
                attr_val: 'Prostate',
            },
            {
                attr_id: SpecialAttribute.MutationSpectrum,
                sample: 'sample1',
                patient: 'patient1',
                attr_val: {
                    'C>A': 3,
                    'C>G': 4,
                    'C>T': 5,
                    'T>A': 10,
                    'T>C': 2,
                    'T>G': 0,
                },
            },
            {
                attr_id: 'age',
                sample: 'sample1',
                patient: 'patient1',
                na: true,
            },
            {
                attr_id: 'MUTATION_COUNT',
                sample: 'sample2',
                patient: 'patient2',
                attr_val: 12,
            },
            {
                attr_id: 'cancer_type',
                sample: 'sample2',
                patient: 'patient2',
                na: true,
            },
            {
                attr_id: SpecialAttribute.MutationSpectrum,
                sample: 'sample2',
                patient: 'patient2',
                na: true,
            },
            {
                attr_id: 'age',
                sample: 'sample2',
                patient: 'patient2',
                attr_val: 19,
            },
        ];
        const attributeIdToAttribute: any = {
            age: {
                displayName: 'Age',
                datatype: 'NUMBER',
                clinicalAttributeId: 'age',
            },
            MUTATION_COUNT: {
                displayName: 'Mutation Count',
                datatype: 'NUMBER',
                clinicalAttributeId: 'MUTATION_COUNT',
            },
            cancer_type: {
                displayName: 'Cancer type',
                datatype: 'STRING',
                clinicalAttributeId: 'cancer_type',
            },
            [SpecialAttribute.MutationSpectrum]: {
                displayName: 'Mutation Spectrum',
                datatype: 'COUNTS_MAP',
                clinicalAttributeId: SpecialAttribute.MutationSpectrum,
            },
        };

        it('produces correct oncoprinter clinical input for 2 samples x 4 tracks', () => {
            assert.deepEqual(
                getOncoprinterClinicalInput(
                    data,
                    ['sample1', 'sample2'],
                    [
                        'age',
                        'MUTATION_COUNT',
                        'cancer_type',
                        SpecialAttribute.MutationSpectrum,
                    ],
                    attributeIdToAttribute,
                    'sample'
                ),
                'Sample  Age(number)  Mutation_Count(lognumber)  Cancer_type(string)  Mutation_Spectrum(C>A/C>G/C>T/T>A/T>C/T>G)\n' +
                    `sample1  ${ONCOPRINTER_CLINICAL_VAL_NA}  5  Prostate  3/4/5/10/2/0\n` +
                    `sample2  19  12  ${ONCOPRINTER_CLINICAL_VAL_NA}  ${ONCOPRINTER_CLINICAL_VAL_NA}`
            );
        });
        it('produces correct oncoprinter clinical input for 2 patients x 4 tracks', () => {});
    });
});
