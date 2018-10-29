import {assert} from "chai";
import {
    CLIN_ATTR_DATA_TYPE, getMutationProfileDuplicateSamplesReport, makeAxisDataPromise_Molecular_MakeMutationData,
    makeScatterPlotData, MUT_PROFILE_COUNT_MULTIPLE, MUT_PROFILE_COUNT_MUTATED, MUT_PROFILE_COUNT_NOT_MUTATED,
    MUT_PROFILE_COUNT_NOT_PROFILED,
    mutationTypeToDisplayName,
    mutTypeCategoryOrder, mutVsWildCategoryOrder
} from "./PlotsTabUtils";
import {MolecularProfile, Mutation, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import {AlterationTypeConstants} from "../ResultsViewPageStore";
import {MutationCountBy} from "./PlotsTab";
import {CoverageInformation} from "../ResultsViewPageStoreUtils";

describe("PlotsTabUtils", ()=>{
    describe("makeScatterPlotData", ()=>{
        it ("does not create data for NaN values", ()=>{
            const data = makeScatterPlotData(
                    {
                        datatype:"number",
                        data:[
                            { uniqueSampleKey:"sample1", value:NaN}, { uniqueSampleKey:"sample2", value:3},
                            { uniqueSampleKey:"sample3", value:1}
                        ],
                    },
                    {
                        datatype:"number",
                        data:[
                            { uniqueSampleKey:"sample1", value:0}, { uniqueSampleKey:"sample2", value:NaN},
                            { uniqueSampleKey:"sample3", value:4}
                        ],
                    },
                    { sample1: {sampleId:"sample1", studyId:"study"} as Sample,
                        sample2: {sampleId:"sample2", studyId:"study"} as Sample,
                        sample3: {sampleId:"sample3", studyId:"study"} as Sample
                    },
                    {}
                );
            assert.equal(data.length, 1, "only one datum - others have NaN");
            const datum:any = data[0];
            const target:any = {
                uniqueSampleKey:"sample3",
                sampleId:"sample3",
                studyId:"study",
                x:1,
                y:4,
            };
            for (const key of ["uniqueSampleKey", "sampleId", "studyId", "x", "y"]) {
                assert.equal(target[key], datum[key], key);
            }
        });
    });

    describe("getMutationProfileDuplicateSamplesReport", ()=>{
        let horzAxisDataWithDuplicates:any;
        let vertAxisDataWithDuplicates:any;
        let horzAxisData:any;
        let vertAxisData:any;

        before(()=>{
            horzAxisData = {
                data: [{ uniqueSampleKey:"sample1", value:[0]}, { uniqueSampleKey:"sample2", value:[1]}, { uniqueSampleKey:"sample3", value:[3]}]
            };
            vertAxisData = {
                data: [{ uniqueSampleKey:"sample1", value:[0]}, { uniqueSampleKey:"sample2", value:[3]}, { uniqueSampleKey:"sample3", value:[1]}]
            };
            horzAxisDataWithDuplicates = {
                data: [{ uniqueSampleKey:"sample1", value:[0,1]}, { uniqueSampleKey:"sample2", value:[1]}, { uniqueSampleKey:"sample3", value:[1,2,3]}]
            };
            vertAxisDataWithDuplicates = {
                data: [{ uniqueSampleKey:"sample1", value:[0]}, { uniqueSampleKey:"sample2", value:[1,2,3,4]}, { uniqueSampleKey:"sample3", value:[1,2]}]
            };
        });

        it ("gives the correct result with zero mutation profiles", ()=>{
            assert.deepEqual(getMutationProfileDuplicateSamplesReport(
                horzAxisData, vertAxisData, { dataType:CLIN_ATTR_DATA_TYPE }, {dataType: AlterationTypeConstants.COPY_NUMBER_ALTERATION}
            ), { showMessage: false, numSamples: 0, numSurplusPoints: 0 });

            assert.deepEqual(getMutationProfileDuplicateSamplesReport(
                horzAxisDataWithDuplicates, vertAxisDataWithDuplicates, { dataType:CLIN_ATTR_DATA_TYPE }, {dataType: AlterationTypeConstants.COPY_NUMBER_ALTERATION}
            ), { showMessage: false, numSamples: 0, numSurplusPoints: 0 });
        });
        it ("gives the correct result with one mutation profile", ()=>{
            assert.deepEqual(getMutationProfileDuplicateSamplesReport(
                horzAxisData, vertAxisData, { dataType:CLIN_ATTR_DATA_TYPE }, {dataType: AlterationTypeConstants.MUTATION_EXTENDED}
            ), { showMessage: false, numSamples: 0, numSurplusPoints: 0 });

            assert.deepEqual(getMutationProfileDuplicateSamplesReport(
                horzAxisDataWithDuplicates, vertAxisDataWithDuplicates, { dataType:CLIN_ATTR_DATA_TYPE }, {dataType: AlterationTypeConstants.MUTATION_EXTENDED}
            ), { showMessage: true, numSamples: 2, numSurplusPoints: 4 });
        });
        it ("gives the correct result with two mutation profiles", ()=>{
            assert.deepEqual(getMutationProfileDuplicateSamplesReport(
                horzAxisData, vertAxisData, { dataType:AlterationTypeConstants.MUTATION_EXTENDED }, {dataType: AlterationTypeConstants.MUTATION_EXTENDED}
            ), { showMessage: false, numSamples: 0, numSurplusPoints: 0 });

            assert.deepEqual(getMutationProfileDuplicateSamplesReport(
                horzAxisDataWithDuplicates, vertAxisData, { dataType:AlterationTypeConstants.MUTATION_EXTENDED }, {dataType: AlterationTypeConstants.MUTATION_EXTENDED}
            ), { showMessage: true, numSamples: 2, numSurplusPoints: 3 });

            assert.deepEqual(getMutationProfileDuplicateSamplesReport(
                horzAxisDataWithDuplicates, vertAxisDataWithDuplicates, { dataType:AlterationTypeConstants.MUTATION_EXTENDED }, {dataType: AlterationTypeConstants.MUTATION_EXTENDED}
            ), { showMessage: true, numSamples: 3, numSurplusPoints: 9 });

        });
    });

    describe("makeAxisDataPromise_Molecular_MakeMutationData", ()=>{
        let mutations:Pick<Mutation, "uniqueSampleKey"|"proteinChange"|"mutationType">[];
        let coverageInformation:CoverageInformation;
        let samples:Pick<Sample, "uniqueSampleKey">[];
        let molecularProfileId:string;

        before(()=>{
            molecularProfileId = "mutations";
            mutations = [{
                uniqueSampleKey: "sample1",
                proteinChange: "",
                mutationType: "missense"
            },{
                uniqueSampleKey: "sample1",
                proteinChange: "",
                mutationType: "missense"
            },{
                uniqueSampleKey: "sample2",
                proteinChange: "",
                mutationType: "in_frame_del"
            },{
                uniqueSampleKey: "sample2",
                proteinChange: "",
                mutationType:"nonsense"
            },{
                uniqueSampleKey: "sample3",
                proteinChange: "",
                mutationType:"fusion"
            }];
            coverageInformation = {
                samples: {
                    sample1: {
                        byGene: {"BRCA1":[{molecularProfileId} as any]},
                        allGenes: [],
                        notProfiledByGene:{},
                        notProfiledAllGenes:[]
                    },
                    sample2: {
                        byGene: {},
                        allGenes: [{molecularProfileId} as any],
                        notProfiledByGene:{},
                        notProfiledAllGenes:[]
                    },
                    sample3: {
                        byGene: {"BRCA1":[{molecularProfileId} as any]},
                        allGenes: [],
                        notProfiledByGene:{},
                        notProfiledAllGenes:[]
                    },
                    sample4: {
                        byGene: {},
                        allGenes: [{molecularProfileId} as any],
                        notProfiledByGene:{},
                        notProfiledAllGenes:[]
                    },
                    sample5: {
                        byGene: {},
                        allGenes: [],
                        notProfiledByGene:{"BRCA1":[{molecularProfileId} as any]},
                        notProfiledAllGenes:[]
                    },
                    sample6: {
                        byGene: {},
                        allGenes: [],
                        notProfiledByGene:{},
                        notProfiledAllGenes:[{molecularProfileId} as any]
                    }
                },
                patients: {
                }
            };
            samples = [
                { uniqueSampleKey: "sample1" },{ uniqueSampleKey: "sample2" },{ uniqueSampleKey: "sample3" },
                { uniqueSampleKey: "sample4" },{ uniqueSampleKey: "sample5" }, { uniqueSampleKey: "sample6" }
            ];
        });

        it("gives the correct result with no mutations", ()=>{
            assert.deepEqual(
                makeAxisDataPromise_Molecular_MakeMutationData(
                    molecularProfileId, "BRCA1", [], {} as any, MutationCountBy.MutationType, []
                ),
                {
                    data:[],
                    hugoGeneSymbol: "BRCA1",
                    datatype: "string",
                    categoryOrder: mutTypeCategoryOrder
                }
            );
        });
        it("gives the correct result for mutated vs wild type data", ()=>{
            assert.deepEqual(
                makeAxisDataPromise_Molecular_MakeMutationData(
                    molecularProfileId, "BRCA1", mutations, coverageInformation, MutationCountBy.MutatedVsWildType, samples
                ),
                {
                    data:[
                        {uniqueSampleKey:"sample1", value:MUT_PROFILE_COUNT_MUTATED},
                        {uniqueSampleKey:"sample2", value:MUT_PROFILE_COUNT_MUTATED},
                        {uniqueSampleKey:"sample3", value:MUT_PROFILE_COUNT_MUTATED},
                        {uniqueSampleKey:"sample4", value:MUT_PROFILE_COUNT_NOT_MUTATED},
                        {uniqueSampleKey:"sample5", value:MUT_PROFILE_COUNT_NOT_PROFILED},
                        {uniqueSampleKey:"sample6", value:MUT_PROFILE_COUNT_NOT_PROFILED},
                    ],
                    hugoGeneSymbol: "BRCA1",
                    datatype: "string",
                    categoryOrder: mutVsWildCategoryOrder
                }
            );
        });
        it("gives the correct result for mutation type data", ()=>{
            assert.deepEqual(
                makeAxisDataPromise_Molecular_MakeMutationData(
                    molecularProfileId, "BRCA1", mutations, coverageInformation, MutationCountBy.MutationType, samples
                ),
                {
                    data:[
                        {uniqueSampleKey:"sample1", value:[mutationTypeToDisplayName.missense]},
                        {uniqueSampleKey:"sample2", value:MUT_PROFILE_COUNT_MULTIPLE},
                        {uniqueSampleKey:"sample3", value:[mutationTypeToDisplayName.fusion]},
                        {uniqueSampleKey:"sample4", value:MUT_PROFILE_COUNT_NOT_MUTATED},
                        {uniqueSampleKey:"sample5", value:MUT_PROFILE_COUNT_NOT_PROFILED},
                        {uniqueSampleKey:"sample6", value:MUT_PROFILE_COUNT_NOT_PROFILED},
                    ],
                    hugoGeneSymbol: "BRCA1",
                    datatype: "string",
                    categoryOrder: mutTypeCategoryOrder
                }
            );
        });
    });
});