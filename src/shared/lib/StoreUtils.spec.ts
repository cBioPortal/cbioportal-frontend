import {
    fetchCosmicData, fetchOncoKbData, makeStudyToCancerTypeMap,
    mergeMutationsIncludingUncalled, generateMutationIdByEvent, generateMutationIdByGeneAndProteinChangeAndEvent,
    fetchCivicGenes, fetchCnaCivicGenes, fetchCivicVariants, findSamplesWithoutCancerTypeClinicalData,
    fetchSamplesWithoutCancerTypeClinicalData, fetchStudiesForSamplesWithoutCancerTypeClinicalData,
    fetchGermlineConsentedSamples
} from "./StoreUtils";
import * as _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import {MobxPromise} from "mobxpromise";
import {CancerStudy, Mutation, ClinicalData, Sample} from "../api/generated/CBioPortalAPI";
import {initMutation} from "test/MutationMockUtils";

describe('StoreUtils', () => {

    let emptyMutationData: MobxPromise<Mutation[]>;
    let emptyUncalledMutationData: MobxPromise<Mutation[]>;
    let mutationDataWithNoKeyword: MobxPromise<Mutation[]>;
    let mutationDataWithKeywords: MobxPromise<Mutation[]>;
    let mutationDataWithFusionsOnly: MobxPromise<Mutation[]>;
    let uncalledMutationDataWithNewEvent: MobxPromise<Mutation[]>;
    let mutationDataWithMutationsOnly: MobxPromise<Mutation[]>;
    let mutationDataWithBothMutationsAndFusions: MobxPromise<Mutation[]>;

    before(() => {
        emptyMutationData =  {
            result: [],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        mutationDataWithNoKeyword =  {
            result: [{}, {}] as Mutation[],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        mutationDataWithKeywords =  {
            result: [{keyword:"one"}] as Mutation[],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        emptyUncalledMutationData =  {
            result: [],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };


        const fusions: Mutation[] = [
            initMutation({gene: { // fusion for ERG
                hugoGeneSymbol: "ERG",
                proteinChange: "TMPRSS2-ERG fusion"
            }}),
            initMutation({gene: { // same fusion for TMPRSS2
                hugoGeneSymbol: "TMPRSS2",
                proteinChange: "TMPRSS2-ERG fusion"
            }}),
            initMutation({gene: { // different fusion
                hugoGeneSymbol: "FOXP1",
                proteinChange: "FOXP1-intragenic"
            }}),
        ];

        const mutations: Mutation[] = [
            initMutation({ // mutation
                gene: {
                    chromosome: "X",
                    hugoGeneSymbol: "TP53",
                },
                proteinChange: "mutated",
                startPosition: 100,
                endPosition: 100,
                referenceAllele: "A",
                variantAllele: "T"
            }),
            initMutation({ // another mutation with the same mutation event
                gene: {
                    chromosome: "X",
                    hugoGeneSymbol: "TP53"
                },
                proteinChange: "mutated",
                startPosition: 100,
                endPosition: 100,
                referenceAllele: "A",
                variantAllele: "T"
            }),
            initMutation({ // mutation with different mutation event
                gene: {
                    chromosome: "Y",
                    hugoGeneSymbol: "PTEN"
                },
                proteinChange: "mutated",
                startPosition: 111,
                endPosition: 112,
                referenceAllele: "T",
                variantAllele: "A"
            }),
        ];

        uncalledMutationDataWithNewEvent =  {
            result: [
                initMutation({ // mutation with different mutation event
                    gene: {
                        chromosome: "17",
                        hugoGeneSymbol: "BRCA1"
                    },
                    proteinChange: "mutated",
                    startPosition: 111,
                    endPosition: 112,
                    referenceAllele: "T",
                    variantAllele: "A"
                })
            ],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        mutationDataWithFusionsOnly =  {
            result: fusions,
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        mutationDataWithMutationsOnly =  {
            result: mutations,
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        mutationDataWithBothMutationsAndFusions = {
            result: [...mutations, ...fusions],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };
    });

    after(() => {

    });

    describe('fetchCosmicCount', () => {

        it("won't fetch cosmic data if there are no mutations", (done) => {
            const fetchStub = sinon.stub();
            const internalClient = {
                fetchCosmicCountsUsingPOST: fetchStub
            };

            fetchCosmicData(emptyMutationData, emptyUncalledMutationData, internalClient as any).then((data: any) => {
                assert.isUndefined(data);
                assert.isFalse(fetchStub.called);
                done();
            });
        });

        it("won't fetch cosmic data if there ARE mutations, but none with keywords", (done) => {
            const fetchStub = sinon.stub();
            const internalClient = {
                fetchCosmicCountsUsingPOST: fetchStub
            };

            fetchCosmicData(mutationDataWithNoKeyword, emptyUncalledMutationData, internalClient as any).then((data: any) => {
                assert.isUndefined(data);
                assert.isFalse(fetchStub.called);
                done();
            });
        });

        it('will fetch cosmic data if there are mutations with keywords', (done) => {
            const fetchStub = sinon.stub();
            fetchStub.returns(Promise.resolve([]));

            const internalClient = {
                fetchCosmicCountsUsingPOST: fetchStub
            };

            fetchCosmicData(mutationDataWithKeywords, emptyUncalledMutationData, internalClient as any).then((data: any) => {
                //assert.isUndefined(data);
                assert.isTrue(fetchStub.called);
                done();
            });
        });
    });

    describe('makeStudyToCancerTypeMap', ()=>{
        let studies:CancerStudy[];
        before(()=>{
            studies = [];
            studies.push({
                studyId: "0",
                cancerType: {
                    name: "ZERO"
                }
            } as CancerStudy);
            studies.push({
                studyId: "1",
                cancerType: {
                    name: "ONE"
                }
            } as CancerStudy);
            studies.push({
                studyId: "2",
                cancerType: {
                    name: "TWO"
                }
            } as CancerStudy);
            studies.push({
                studyId: "3",
                cancerType: {
                    name: "three"
                }
            } as CancerStudy);
        });

        it('gives empty map if no studies', ()=>{
            assert.deepEqual(makeStudyToCancerTypeMap([]), {});
        });
        it('handles one study properly', ()=>{
            assert.deepEqual(makeStudyToCancerTypeMap([studies[0]]), { 0: "ZERO" });
        });
        it('handles more than one study properly', ()=>{
            assert.deepEqual(makeStudyToCancerTypeMap([studies[1], studies[2]]), { 1: "ONE", 2:"TWO" });
            assert.deepEqual(makeStudyToCancerTypeMap([studies[2], studies[1], studies[3]]), { 1:"ONE", 2:"TWO", 3:"three" });
            assert.deepEqual(makeStudyToCancerTypeMap(studies), { 0: "ZERO", 1:"ONE", 2:"TWO", 3:"three" });
        });
    });

    describe('mergeMutationsIncludingUncalled', () => {
        it("merges mutations properly when there is only fusion data", () => {
            const mergedFusions = mergeMutationsIncludingUncalled(mutationDataWithFusionsOnly, emptyMutationData);

            assert.equal(mergedFusions.length, 3);
        });

        it("merges mutations properly when there is only mutation data", () => {
            const mergedMutations = mergeMutationsIncludingUncalled(mutationDataWithMutationsOnly, emptyMutationData);

            assert.equal(mergedMutations.length, 2);

            const sortedMutations = _.sortBy(mergedMutations, "length");

            assert.equal(sortedMutations[0].length, 1);
            assert.equal(sortedMutations[1].length, 2);

            assert.equal(generateMutationIdByGeneAndProteinChangeAndEvent(sortedMutations[1][0]),
                generateMutationIdByGeneAndProteinChangeAndEvent(sortedMutations[1][1]),
                "mutation ids of merged mutations should be same");

            assert.equal(generateMutationIdByEvent(sortedMutations[1][0]),
                generateMutationIdByEvent(sortedMutations[1][1]),
                "event based mutation ids of merged mutations should be same, too");
        });

        it("merges mutations properly when there are both mutation and fusion data ", () => {
            const mergedMutations = mergeMutationsIncludingUncalled(mutationDataWithBothMutationsAndFusions, emptyMutationData);

            assert.equal(mergedMutations.length, 5);
        });

        it("does not include new mutation events from the uncalled mutations, only mutation events already called in >=1 sample should be added", () => {
            const mergedMutations = mergeMutationsIncludingUncalled(mutationDataWithBothMutationsAndFusions, uncalledMutationDataWithNewEvent);

            assert.equal(mergedMutations.length, 5);
        });
    });

    describe('fetchOncoKbData', () => {
        it("won't fetch onkokb data if there are no mutations", (done) => {
            fetchOncoKbData({}, [], emptyMutationData).then((data: any) => {
                assert.deepEqual(data, {uniqueSampleKeyToTumorType: {}, indicatorMap: {}});
                done();
            });
        });
    });

    describe('fetchGermlineConsentedSamples', () => {
        const studyIdsWithoutGermlineData: MobxPromise<string[]> = {
            result: [
                "study_with_no_germline_data"
            ],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        const studyIdsWithSomeGermlineData: MobxPromise<string[]> = {
            result: [
                "study_with_no_germline_data",
                "mskimpact"
            ],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        const studiesWithGermlineConsentedSamples = ["mskimpact"];


        it("won't fetch germline consented samples for studies with no germline data", (done) => {
            const getAllSampleIdsInSampleListStub = sinon.stub();
            const client = {
                getAllSampleIdsInSampleListUsingGET: getAllSampleIdsInSampleListStub,
            };

            fetchGermlineConsentedSamples(studyIdsWithoutGermlineData, studiesWithGermlineConsentedSamples, client as any)
                .then((data: any) => {
                    assert.deepEqual(data, []);
                    assert.isTrue(getAllSampleIdsInSampleListStub.notCalled, "getAllSampleIdsInSample should NOT be called");
                    done();
                }).catch(done);
        });

        it("will fetch germline consented samples for only the studies with germline data", (done) => {
            const getAllSampleIdsInSampleListStub = sinon.stub();
            getAllSampleIdsInSampleListStub.returns(Promise.resolve([
                {
                    sampleId: "mskimpact_sample_0",
                    studyId: "mskimpact"
                },
                {
                    sampleId: "mskimpact_sample_1",
                    studyId: "mskimpact"
                },
                {
                    sampleId: "mskimpact_sample_2",
                    studyId: "mskimpact"
                }
            ]));

            const client = {
                getAllSampleIdsInSampleListUsingGET: getAllSampleIdsInSampleListStub,
            };

            fetchGermlineConsentedSamples(studyIdsWithSomeGermlineData, studiesWithGermlineConsentedSamples, client as any)
                .then((data: any) => {
                    assert.isTrue(getAllSampleIdsInSampleListStub.calledOnce,
                        "getAllSampleIdsInSample should be called only once");
                    assert.isTrue(getAllSampleIdsInSampleListStub.calledWith({sampleListId: "mskimpact_germline"}),
                        "getAllSampleIdsInSample should be called with the correct sample list id (mskimpact_germline)");
                    assert.equal(data.length, 3, "getAllSampleIdsInSample should return an array of size 3");
                    done();
                }).catch(done);
        });
    });

    describe('fetchCivicData', () => {
        it("won't fetch civic genes if there are no mutations", (done) => {
            fetchCivicGenes(emptyMutationData, emptyUncalledMutationData).then((data: any) => {
                assert.deepEqual(data, {});
                done();
            });
        });

        it("won't fetch civic variants if there are no mutations", (done) => {
            fetchCivicVariants({}, emptyMutationData, emptyUncalledMutationData).then((data: any) => {
                assert.deepEqual(data, {});
                done();
            });
        });
        it("won't fetch civic variants if there are no civic genes", (done) => {
            fetchCivicVariants({}).then((data: any) => {
                assert.deepEqual(data, {});
                done();
            });
        });
    });

    describe('samples without cancer type clinical data', () => {
        const studyId: string = "study";
        let samples: MobxPromise<Sample[]> = {
            result: [
                {sampleId: "Sample1", uniqueSampleKey: "Sample1"},
                {sampleId: "Sample2", uniqueSampleKey: "Sample2"},
                {sampleId: "Sample3", uniqueSampleKey: "Sample3"},
                {sampleId: "Sample4", uniqueSampleKey: "Sample4"}
            ] as Sample[],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        let samplesWithoutCancerTypeClinicalData: MobxPromise<Sample[]> = {
            result: [
                {sampleId: "Sample4", studyId: "study4", uniqueSampleKey: "Sample4"}
            ] as Sample[],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        let sampleIds: MobxPromise<string[]> = {
            result: ["Sample1", "Sample2", "Sample3", "Sample4"] as string[],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        let clinicalDataForSamples: MobxPromise<ClinicalData[]> = {
            result: [
                {clinicalAttributeId: 'CANCER_TYPE_DETAILED', sampleId: 'Sample1', value: "Invasive Breast Carcinoma", uniqueSampleKey: "Sample1"},
                {clinicalAttributeId: 'CANCER_TYPE', sampleId: 'Sample1', value: "Breast", uniqueSampleKey: "Sample1"},
                {clinicalAttributeId: 'CANCER_TYPE_DETAILED', sampleId: 'Sample2', value: "Prostate Adenocarcinoma", uniqueSampleKey: "Sample2"},
                {clinicalAttributeId: 'CANCER_TYPE', sampleId: 'Sample3', value: "Skin", uniqueSampleKey: "Sample3"}
            ] as ClinicalData[],
            status: 'complete' as 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };

        it('finds samples without cancer type clinical data', () => {
            const samplesWithoutCancerType = findSamplesWithoutCancerTypeClinicalData(samples, clinicalDataForSamples);

            assert.deepEqual(samplesWithoutCancerType, [{sampleId: "Sample4", uniqueSampleKey: "Sample4"} as Partial<Sample>]);
        });

        const fetchSamplesStub = sinon.stub();
        const getStudyStub = sinon.stub();

        const client = {
            fetchSamplesUsingPOST: fetchSamplesStub,
            getStudyUsingGET: getStudyStub
        };

        it('fetches samples without cancer type clinical data', () => {
            const samplesWithoutCancerTypeClinicalData = fetchSamplesWithoutCancerTypeClinicalData(
                sampleIds, studyId, clinicalDataForSamples, client as any);

            assert.isTrue(fetchSamplesStub.called, "fetchSamples should be called");
            assert.isTrue(fetchSamplesStub.calledWith(
                {
                    sampleFilter: {
                        sampleIdentifiers: [{sampleId: "Sample4", studyId: "study"}]
                    }
                }
            ), "fetchSamples should be called with the correct sample id (Sample4)");
        });

        it('fetches studies for samples without cancer type clinical data', () => {
            const studies = fetchStudiesForSamplesWithoutCancerTypeClinicalData(
                samplesWithoutCancerTypeClinicalData, client as any);

            assert.isTrue(getStudyStub.calledOnce, "getStudy should be called only once");
            assert.isTrue(getStudyStub.calledWith({studyId: "study4"}),
                "fetchStudy should be called with the correct study id (study4)");
        });
    });
});
