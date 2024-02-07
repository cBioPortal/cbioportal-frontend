import { CancerStudy } from 'cbioportal-ts-api-client';
import {
    getSampleCountsPerFilter,
    getStudyCountPerFilter,
} from 'shared/components/query/filteredSearch/StudySearchControls';

describe('DataTypeFilter', () => {
    it('Calculate the number of samples with a specific data type', () => {
        const studies: CancerStudy[] = [
            {
                allSampleCount: 1500,
                cancerType: {
                    cancerTypeId: 'biliary_tract',
                    dedicatedColor: 'Green',
                    name: 'Biliary Tract',
                    parent: 'tissue',
                    shortName: 'BILIARY_TRACT',
                },
                cancerTypeId: 'test1',
                citation: 'No citation',
                cnaSampleCount: 250,
                completeSampleCount: 1500,
                description: 'Test 1 study for data filter',
                groups: '',
                importDate: '',
                massSpectrometrySampleCount: 15,
                methylationHm27SampleCount: 49,
                miRnaSampleCount: 650,
                mrnaMicroarraySampleCount: 750,
                mrnaRnaSeqSampleCount: 1500,
                mrnaRnaSeqV2SampleCount: 0,
                name: 'Test study 1',
                pmid: '',
                publicStudy: false,
                readPermission: true,
                referenceGenome: 'hg19',
                rppaSampleCount: 0,
                sequencedSampleCount: 240,
                status: 1,
                studyId: 'teststudy1',
                treatmentCount: 45,
                structuralVariantCount: 10,
            },
            {
                allSampleCount: 1500,
                cancerType: {
                    cancerTypeId: 'biliary_tract',
                    dedicatedColor: 'Green',
                    name: 'Biliary Tract',
                    parent: 'tissue',
                    shortName: 'BILIARY_TRACT',
                },
                cancerTypeId: 'test2',
                citation: 'No citation',
                cnaSampleCount: 160,
                completeSampleCount: 1500,
                description: 'Test 2 study for data filter',
                groups: '',
                importDate: '',
                massSpectrometrySampleCount: 160,
                methylationHm27SampleCount: 150,
                miRnaSampleCount: 67,
                mrnaMicroarraySampleCount: 750,
                mrnaRnaSeqSampleCount: 1500,
                mrnaRnaSeqV2SampleCount: 0,
                name: 'Test study 2',
                pmid: '',
                publicStudy: false,
                readPermission: true,
                referenceGenome: 'hg19',
                rppaSampleCount: 10,
                sequencedSampleCount: 100,
                status: 1,
                studyId: 'teststudy2',
                treatmentCount: 45,
                structuralVariantCount: 0,
            },
        ];

        const filter = [
            {
                id: 'cnaSampleCount',
                name: 'CNA',
                checked: false,
            },
            {
                id: 'treatmentCount',
                name: 'Treatment',
                checked: false,
            },
        ];
        const testResultCNA = getSampleCountsPerFilter(filter, studies);
        expect(testResultCNA).toStrictEqual([410, 90]);
    });
    it('Calculate the number of studies with a specific data type', () => {
        const studies: CancerStudy[] = [
            {
                allSampleCount: 1500,
                structuralVariantCount: 0,
                cancerType: {
                    cancerTypeId: 'biliary_tract',
                    dedicatedColor: 'Green',
                    name: 'Biliary Tract',
                    parent: 'tissue',
                    shortName: 'BILIARY_TRACT',
                },
                cancerTypeId: 'test1',
                citation: 'No citation',
                cnaSampleCount: 250,
                completeSampleCount: 1500,
                description: 'Test 1 study for data filter',
                groups: '',
                importDate: '',
                massSpectrometrySampleCount: 15,
                methylationHm27SampleCount: 49,
                miRnaSampleCount: 650,
                mrnaMicroarraySampleCount: 750,
                mrnaRnaSeqSampleCount: 1500,
                mrnaRnaSeqV2SampleCount: 0,
                name: 'Test study 1',
                pmid: '', //
                publicStudy: false,
                readPermission: true,
                referenceGenome: 'hg19',
                rppaSampleCount: 0,
                sequencedSampleCount: 240,
                status: 1,
                studyId: 'teststudy1',
                treatmentCount: 45,
            },
            {
                allSampleCount: 1500,
                cancerType: {
                    cancerTypeId: 'biliary_tract',
                    dedicatedColor: 'Green',
                    name: 'Biliary Tract',
                    parent: 'tissue',
                    shortName: 'BILIARY_TRACT',
                },
                structuralVariantCount: 0,
                cancerTypeId: 'test2',
                citation: 'No citation',
                cnaSampleCount: 160,
                completeSampleCount: 1500,
                description: 'Test 2 study for data filter',
                groups: '',
                importDate: '',
                massSpectrometrySampleCount: 160,
                methylationHm27SampleCount: 150,
                miRnaSampleCount: 67,
                mrnaMicroarraySampleCount: 750,
                mrnaRnaSeqSampleCount: 1500, //
                mrnaRnaSeqV2SampleCount: 0,
                name: 'Test study 2',
                pmid: '',
                publicStudy: false,
                readPermission: true,
                referenceGenome: 'hg19',
                rppaSampleCount: 10,
                sequencedSampleCount: 100,
                status: 1,
                studyId: 'teststudy2',
                treatmentCount: 45,
            },
        ];

        const filter = [
            {
                id: 'cnaSampleCount',
                name: 'CNA',
                checked: false,
            },
            {
                id: 'treatmentCount',
                name: 'Treatment',
                checked: false,
            },
        ];
        const testResultStudyCount = getStudyCountPerFilter(filter, studies);
        expect(testResultStudyCount).toStrictEqual([2, 2]);
    });
    it('Calculate the number of studies with a specific data type not measured', () => {
        const studies: CancerStudy[] = [
            {
                allSampleCount: 1500,
                cancerType: {
                    cancerTypeId: 'biliary_tract',
                    dedicatedColor: 'Green',
                    name: 'Biliary Tract',
                    parent: 'tissue',
                    shortName: 'BILIARY_TRACT',
                },
                cancerTypeId: 'test1',
                citation: 'No citation',
                cnaSampleCount: 250,
                completeSampleCount: 1500,
                description: 'Test 1 study for data filter',
                groups: '',
                importDate: '',
                massSpectrometrySampleCount: 15,
                methylationHm27SampleCount: 49,
                miRnaSampleCount: 650,
                mrnaMicroarraySampleCount: 750,
                mrnaRnaSeqSampleCount: 1500,
                mrnaRnaSeqV2SampleCount: 0,
                name: 'Test study 1',
                pmid: '',
                publicStudy: false,
                readPermission: true,
                referenceGenome: 'hg19',
                rppaSampleCount: 0,
                sequencedSampleCount: 240,
                status: 1,
                studyId: 'teststudy1',
                treatmentCount: 45,
                structuralVariantCount: 10,
            },
            {
                structuralVariantCount: 0,
                allSampleCount: 1500,
                cancerType: {
                    cancerTypeId: 'biliary_tract',
                    dedicatedColor: 'Green',
                    name: 'Biliary Tract',
                    parent: 'tissue',
                    shortName: 'BILIARY_TRACT',
                },
                cancerTypeId: 'test2',
                citation: 'No citation',
                cnaSampleCount: 0,
                completeSampleCount: 1500,
                description: 'Test 2 study for data filter',
                groups: '',
                importDate: '',
                massSpectrometrySampleCount: 160,
                methylationHm27SampleCount: 150,
                miRnaSampleCount: 67,
                mrnaMicroarraySampleCount: 750,
                mrnaRnaSeqSampleCount: 1500,
                mrnaRnaSeqV2SampleCount: 0,
                name: 'Test study 2',
                pmid: '',
                publicStudy: false,
                readPermission: true,
                referenceGenome: 'hg19',
                rppaSampleCount: 10,
                sequencedSampleCount: 100,
                status: 1,
                studyId: 'teststudy2',
                treatmentCount: 45,
            },
        ];

        const filter = [
            {
                id: 'cnaSampleCount',
                name: 'CNA',
                checked: false,
            },
            {
                id: 'treatmentCount',
                name: 'Treatment',
                checked: false,
            },
        ];
        const testResultStudyCount = getStudyCountPerFilter(filter, studies);
        expect(testResultStudyCount).toStrictEqual([1, 2]);
    });
});
