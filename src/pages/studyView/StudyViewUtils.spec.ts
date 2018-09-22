import { assert } from 'chai';
import { updateGeneQuery } from 'pages/studyView/StudyViewUtils';
import { getVirtualStudyDescription } from 'pages/studyView/StudyViewUtils';
import { Gene } from 'shared/api/generated/CBioPortalAPI';
import { StudyViewFilter } from 'shared/api/generated/CBioPortalAPIInternal';

describe('StudyViewUtils', () => {

    describe('updateGeneQuery', () => {
        it('when gene selected in table', () => {
            assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }], 'TTN'), 'TP53;\nTTN;',);
            assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }, { gene: 'TTN', alterations: false }], 'ALK'), 'TP53;\nTTN;\nALK;',);
        });
        it('when gene unselected in table', () => {
            assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }], 'TP53'), '');
            assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }, { gene: 'TTN', alterations: false }], 'TP53'), 'TTN;',);
            assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }, { gene: 'TTN', alterations: false }], 'ALK'), 'TP53;\nTTN;\nALK;',);
        });
    });

    describe('getVirtualStudyDescription', () => {
        let studies = [{
            name: 'Study 1',
            studyId: 'study1',
            uniqueSampleKeys: ['1', '2']
        },
        {
            name: 'Study 2',
            studyId: 'study2',
            uniqueSampleKeys: ['3', '4']
        }];
        let selectedSamples = [{
            studyId: 'study1',
            uniqueSampleKey: '1'
        }, {
            studyId: 'study1',
            uniqueSampleKey: '2'
        }, {
            studyId: 'study2',
            uniqueSampleKey: '3'
        }, {
            studyId: 'study2',
            uniqueSampleKey: '4'
        }];

        it('when all samples are selected', () => {
            assert.isTrue(
                getVirtualStudyDescription(
                    studies as any,
                    selectedSamples as any,
                    {} as any,
                    {} as any,
                    []
                ).startsWith('4 samples from 2 studies:\n- Study 1 (2 samples)\n- Study 2 (2 samples)'));
        });
        it('when filters are applied', () => {
            let filter = {
                'clinicalDataEqualityFilters': [{
                    'attributeId': 'attribute1',
                    'clinicalDataType': "SAMPLE",
                    'values': ['value1']
                }],
                "mutatedGenes": [{ "entrezGeneIds": [1] }],
                "cnaGenes": [{ "alterations": [{ "entrezGeneId": 2, "alteration": -2 }] }],
                'studyIds': ['study1', 'study2']
            } as StudyViewFilter

            let genes = [{ entrezGeneId: 1, hugoGeneSymbol: "GENE1" }, { entrezGeneId: 2, hugoGeneSymbol: "GENE2" }] as Gene[];

            assert.isTrue(
                getVirtualStudyDescription(
                    studies as any,
                    [{ studyId: 'study1', uniqueSampleKey: '1' }] as any,
                    filter,
                    { 'SAMPLE_attribute1': 'attribute1 name' },
                    genes
                ).startsWith('1 sample from 1 study:\n- Study 1 (1 samples)\n\nFilters:\n- CNA Genes:\n  ' +
                    '- GENE2-DEL\n- Mutated Genes:\n  - GENE1\n  - attribute1 name: value1'));
        });
        it('when username is not null', () => {
            assert.isTrue(
                getVirtualStudyDescription(
                    studies as any,
                    selectedSamples as any,
                    {} as any,
                    {} as any,
                    [],
                    'user1'
                ).startsWith('4 samples from 2 studies:\n- Study 1 (2 samples)\n- Study 2 (2 samples)'));
            assert.isTrue(
                getVirtualStudyDescription(
                    studies as any,
                    selectedSamples as any,
                    {} as any,
                    {} as any,
                    [],
                    'user1'
                ).endsWith('by user1'));
        });
    });
});
