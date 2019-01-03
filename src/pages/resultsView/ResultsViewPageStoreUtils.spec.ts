import {assert} from "chai";
import {
    Gene, NumericGeneMolecularData, GenePanelData, MolecularProfile, Mutation, Patient,
    Sample, CancerStudy
} from "../../shared/api/generated/CBioPortalAPI";
import {
    annotateMolecularDatum,
    annotateMutationPutativeDriver,
    computeCustomDriverAnnotationReport, computeGenePanelInformation, computePutativeDriverAnnotatedMutations,
    filterSubQueryData,
    getOncoKbOncogenic,
    initializeCustomDriverAnnotationSettings,
    fetchQueriedStudies, isRNASeqProfile, isPanCanStudy, isTCGAProvStudy, isTCGAPubStudy, buildResultsViewPageTitle,
    getSampleAlteredMap, getSingleGeneResultKey, getMultipleGeneResultKey
} from "./ResultsViewPageStoreUtils";
import {IQueriedMergedTrackCaseData, AnnotatedExtendedAlteration} from "./ResultsViewPageStore";
import {
    OQLLineFilterOutput, MergedTrackLineFilterOutput
} from "../../shared/lib/oql/oqlfilter";
import {observable} from "mobx";
import {IndicatorQueryResp} from "../../shared/api/generated/OncoKbAPI";
import {AnnotatedMutation} from "./ResultsViewPageStore";
import * as _ from 'lodash';
import sinon from 'sinon';
import sessionServiceClient from "shared/api//sessionServiceInstance";
import { VirtualStudy, VirtualStudyData } from "shared/model/VirtualStudy";
import client from "shared/api/cbioportalClientInstance";
import AccessorsForOqlFilter, {getSimplifiedMutationType} from "../../shared/lib/oql/AccessorsForOqlFilter";

describe("ResultsViewPageStoreUtils", ()=>{
    describe("computeCustomDriverAnnotationReport", ()=>{
        let driverFilterMutation:Mutation;
        let driverTiersFilterMutation:Mutation;
        let bothMutation:Mutation;
        let neitherMutation:Mutation;

        before(()=>{
            driverFilterMutation = {
                driverFilter:"B"
            } as Mutation;

            driverTiersFilterMutation = {
                driverTiersFilter:"T"
            } as Mutation;

            bothMutation = {
                driverFilter:"ADFADF",
                driverTiersFilter:"SDPOIFJP"
            } as Mutation;

            neitherMutation = {
            } as Mutation;
        });

        it("returns the right report for empty list", ()=>{
            assert.deepEqual(computeCustomDriverAnnotationReport([]), {hasBinary: false, tiers:[]});
        });
        it("returns the right report for no annotations, one element", ()=>{
            assert.deepEqual(computeCustomDriverAnnotationReport([neitherMutation]), {hasBinary:false, tiers:[]});
        });
        it("returns the right report for no annotations, three elements", ()=>{
            assert.deepEqual(
                computeCustomDriverAnnotationReport([neitherMutation, neitherMutation, neitherMutation]),
                {hasBinary:false, tiers:[]}
            );
        });
        it("returns the right report for just binary annotations, one element", ()=>{
            assert.deepEqual(computeCustomDriverAnnotationReport([driverFilterMutation]), {hasBinary:true, tiers:[]});
        });
        it("returns the right report for just binary annotations, three elements", ()=>{
            assert.deepEqual(
                computeCustomDriverAnnotationReport([neitherMutation, driverFilterMutation, driverFilterMutation]),
                {hasBinary:true, tiers:[]}
            );
        });
        it("returns the right report for just tiers annotations, one element", ()=>{
            assert.deepEqual(computeCustomDriverAnnotationReport([driverTiersFilterMutation]), {hasBinary:false, tiers:["T"]});
        });
        it("returns the right report for just tiers annotations, three elements", ()=>{
            assert.deepEqual(
                computeCustomDriverAnnotationReport([driverTiersFilterMutation, driverTiersFilterMutation, neitherMutation]),
                {hasBinary:false, tiers:["T"]}
            );
        });
        it("returns the right report for binary and tier annotation in one element", ()=>{
            assert.deepEqual(computeCustomDriverAnnotationReport([bothMutation]), {hasBinary:true, tiers:["SDPOIFJP"]});
        });
        it("returns the right report for binary and tier annotation, both present in three elements", ()=>{
            assert.deepEqual(
                computeCustomDriverAnnotationReport([bothMutation, neitherMutation, bothMutation]),
                {hasBinary:true, tiers:["SDPOIFJP"]}
            );
        });
        it("returns the right report for binary and tier annotation in different elements", ()=>{
            assert.deepEqual(
                computeCustomDriverAnnotationReport([driverTiersFilterMutation, driverFilterMutation]),
                {hasBinary:true, tiers:["T"]}
            );
        });
        it("returns the right report for binary and tier annotation in different elements, including an element with no annotation", ()=>{
            assert.deepEqual(
                computeCustomDriverAnnotationReport([driverTiersFilterMutation, driverFilterMutation, neitherMutation]),
                {hasBinary:true, tiers:["T"]}
            );
        });
    });

    describe("filterSubQueryData", () => {
        // I believe these metadata to be all `new AccessorsForOqlFilter()` needs
        // tslint:disable-next-line no-object-literal-type-assertion
        const makeBasicExpressionProfile = () => ({
            "molecularAlterationType": "MRNA_EXPRESSION",
            "datatype": "Z-SCORE",
            "molecularProfileId": "brca_tcga_mrna_median_Zscores",
            "studyId": "brca_tcga"
        } as MolecularProfile);

        // I believe this to be the projection the filter function needs
        const makeMinimalExpressionData = (
            points: {entrezGeneId: number, uniqueSampleKey: string, value: number}[]
        ) => points.map(({entrezGeneId, uniqueSampleKey, value}) => ({
            entrezGeneId, value,uniqueSampleKey,
            sampleId: `TCGA-${uniqueSampleKey}`,
            uniquePatientKey: `${uniqueSampleKey}_PATIENT`,
            patientId: `TCGA-${uniqueSampleKey}_PATIENT`,
            molecularProfileId: 'brca_tcga_mrna_median_Zscores',
            studyId: 'brca_tcga',
            gene: {
                entrezGeneId, hugoGeneSymbol: `GENE${entrezGeneId}`,
                "type": "protein-coding", "cytoband": "1p20.1", "length": 4000
            }
        })) as NumericGeneMolecularData[];

        const makeMinimalCaseArrays = (sampleKeys: string[]) => ({
            samples: sampleKeys.map(
                uniqueSampleKey => ({uniqueSampleKey})
            ),
            patients: sampleKeys.map(
                uniqueSampleKey => ({uniquePatientKey: `${uniqueSampleKey}_PATIENT`})
            )
        });

        it("returns undefined when queried for a non-merged track", () => {
            // given
            const accessorsInstance = new AccessorsForOqlFilter([makeBasicExpressionProfile()]);
            const dataArray: NumericGeneMolecularData[] = makeMinimalExpressionData([{
                entrezGeneId: 1000,
                uniqueSampleKey: 'SAMPLE1',
                value: 1.5
            }]);
            const {samples, patients} = makeMinimalCaseArrays(['SAMPLE1']);
            const queryLine: OQLLineFilterOutput<object> = {
                gene: 'GENE400',
                oql_line: 'GENE400: EXP>=2;',
                parsed_oql_line: {gene: 'GENE400', alterations: [{
                    alteration_type: 'exp',
                    constr_rel: '>=',
                    constr_val: 2
                }]},
                data: []
            };
            // when
            const data = filterSubQueryData(
                queryLine,
                '',
                dataArray,
                accessorsInstance,
                samples, patients
            );
            // then
            assert.isUndefined(data);
        });

        it("returns a two-element array with no alterations if queried for a two-gene merged track that matches none", () => {
            // given
            const accessorsInstance = new AccessorsForOqlFilter([makeBasicExpressionProfile()]);
            const dataArray: NumericGeneMolecularData[] = makeMinimalExpressionData([
                {entrezGeneId: 1000, uniqueSampleKey: 'SAMPLE1', value: 1.5},
                {entrezGeneId: 1001, uniqueSampleKey: 'SAMPLE1', value: 1.5},
            ]);
            const {samples, patients} = makeMinimalCaseArrays(['SAMPLE1']);
            // [DATATYPES: EXP<-3; GENE1000 GENE1001],
            const queryLine: MergedTrackLineFilterOutput<object> = {
                list: [
                    {oql_line: 'GENE1000: EXP<-3;', gene: 'GENE1000', data: [], parsed_oql_line: {
                        gene: 'GENE1000', alterations: [{alteration_type: 'exp', constr_rel: '<', constr_val: -3}]
                    }},
                    {oql_line: 'GENE1001: EXP<-3;', gene: 'GENE1001', data: [], parsed_oql_line: {
                        gene: 'GENE1001', alterations: [{alteration_type: 'exp', constr_rel: '<', constr_val: -3}]
                    }}
                ]
            };
            // when
            const data = filterSubQueryData(
                queryLine,
                '',
                dataArray,
                accessorsInstance,
                samples, patients
            );
            // then
            assert.lengthOf(data!, 2);
            assert.deepEqual(
                data![0].cases,
                {
                    samples: {'SAMPLE1': []},
                    patients: {'SAMPLE1_PATIENT': []}
                }
            );
            assert.deepEqual(
                data![1].cases,
                {
                    samples: {'SAMPLE1': []},
                    patients: {'SAMPLE1_PATIENT': []}
                }
            );
        });

        it("lists alterations that match genes in a merged track", () => {
            // given
            const accessorsInstance = new AccessorsForOqlFilter([makeBasicExpressionProfile()]);
            const dataArray: NumericGeneMolecularData[] = makeMinimalExpressionData([
                {entrezGeneId: 1000, uniqueSampleKey: 'SAMPLE1', value: 0},
                {entrezGeneId: 1000, uniqueSampleKey: 'SAMPLE2', value: 0},
                {entrezGeneId: 1001, uniqueSampleKey: 'SAMPLE1', value: 2.2},
                {entrezGeneId: 1001, uniqueSampleKey: 'SAMPLE2', value: 2.7}
            ]);
            const {samples, patients} = makeMinimalCaseArrays(
                ['SAMPLE1', 'SAMPLE2']
            );
            // [DATATYPES: EXP >= 2.5; GENE1000 GENE1001]'
            const queryLine: MergedTrackLineFilterOutput<object> = {
                list: [
                    {oql_line: 'GENE1000: EXP>2.5;', gene: 'GENE1000', data: [], parsed_oql_line: {
                        gene: 'GENE1000', alterations: [{alteration_type: 'exp', constr_rel: '>', constr_val: 2.5}]
                    }},
                    {oql_line: 'GENE1001: EXP>2.5;', gene: 'GENE1001', data: [], parsed_oql_line: {
                        gene: 'GENE1001', alterations: [{alteration_type: 'exp', constr_rel: '>', constr_val: 2.5}]
                    }}
                ]
            };
            // when
            const data = filterSubQueryData(
                queryLine,
                '',
                dataArray,
                accessorsInstance,
                samples, patients
            );
            // then
            const gene2AlterationsBySample = data![1].cases.samples;
            assert.lengthOf(gene2AlterationsBySample['SAMPLE1'], 0);
            assert.lengthOf(gene2AlterationsBySample['SAMPLE2'], 1);
            assert.equal(
                gene2AlterationsBySample['SAMPLE2'][0].alterationSubType,
                'up'
            );
        });
    });

    describe("initializeCustomDriverAnnotationSettings", ()=>{
        it("initializes selection for empty list of tiers", ()=>{
            let mutationAnnotationSettings = {
                driverTiers: observable.map<boolean>()
            };

            initializeCustomDriverAnnotationSettings(
                { tiers: [] } as any,
                mutationAnnotationSettings,
                false,
                false
            );

            assert.deepEqual(mutationAnnotationSettings.driverTiers.toJS(), {});
        });

        it.skip("initializes selection for given tiers", ()=>{
            // TODO: figure out why doing driverTiers.set in this test is causing crazy problems
            let mutationAnnotationSettings = {
                driverTiers: observable.map<boolean>()
            };
            let enableCustomTiers = false;

            initializeCustomDriverAnnotationSettings(
                { tiers: ["a","b","c"] } as any,
                mutationAnnotationSettings,
                enableCustomTiers,
                false
            );

            assert.deepEqual(mutationAnnotationSettings.driverTiers.toJS(), {"a":false, "b":false, "c":false}, "initialized to false");

            enableCustomTiers = true;

            initializeCustomDriverAnnotationSettings(
                { tiers: ["a","b","c"] } as any,
                mutationAnnotationSettings,
                enableCustomTiers,
                false
            );

            assert.deepEqual(mutationAnnotationSettings.driverTiers.toJS(), {"a":true, "b":true, "c":true}, "initialized to true");
        });

        it("sets hotspots and oncoKb if option is set and there are no custom annotations", ()=>{
            let mutationAnnotationSettings = {
                hotspots: false,
                oncoKb: false,
                driverTiers: observable.map<boolean>()
            };
            initializeCustomDriverAnnotationSettings(
                {hasBinary: false, tiers: []} as any,
                mutationAnnotationSettings,
                false,
                true
            );

            assert.isTrue(mutationAnnotationSettings.hotspots);
            assert.isTrue(mutationAnnotationSettings.oncoKb);
        });
        it.skip("does not set hotspots and oncoKb if option is set and there are custom annotations", ()=>{
            // TODO: figure out why doing driverTiers.set in this test is causing crazy problems
            let mutationAnnotationSettings = {
                hotspots: false,
                oncoKb: false,
                driverTiers: observable.map<boolean>()
            };
            initializeCustomDriverAnnotationSettings(
                {hasBinary: true, tiers: []} as any,
                mutationAnnotationSettings,
                false,
                true
            );
            assert.isFalse(mutationAnnotationSettings.hotspots);
            assert.isFalse(mutationAnnotationSettings.oncoKb);
            initializeCustomDriverAnnotationSettings(
                {hasBinary: false, tiers: ["a"]} as any,
                mutationAnnotationSettings,
                false,
                true
            );
            assert.isFalse(mutationAnnotationSettings.hotspots);
            assert.isFalse(mutationAnnotationSettings.oncoKb);
        });
        it("does not set hotspots and oncoKb if option is not set", ()=>{
            let mutationAnnotationSettings = {
                hotspots: false,
                oncoKb: false,
                driverTiers: observable.map<boolean>()
            };
            initializeCustomDriverAnnotationSettings(
                {hasBinary: true, tiers: []} as any,
                mutationAnnotationSettings,
                false,
                true
            );
            assert.isFalse(mutationAnnotationSettings.hotspots);
            assert.isFalse(mutationAnnotationSettings.oncoKb);
        });
    });

    describe("annotateMutationPutativeDriver", ()=>{
        it("annotates with hotspot, oncokb", ()=>{
            assert.deepEqual(
                annotateMutationPutativeDriver(
                    {
                        mutationType: "missense",
                    } as Mutation,
                    {
                        hotspots: true,
                        oncoKb: "oncogenic"
                    } as any
                ),
                {
                    putativeDriver: true,
                    isHotspot: true,
                    oncoKbOncogenic: "oncogenic",
                    simplifiedMutationType: getSimplifiedMutationType("missense"),
                    mutationType: "missense",
                }
            );
        });
        it("annotates with cbioportal, cosmic", ()=>{
            assert.deepEqual(
                annotateMutationPutativeDriver(
                    {
                        mutationType: "in_frame_ins",
                    } as Mutation,
                    {
                        hotspots: false,
                        oncoKb: "",
                        cbioportalCount: true,
                        cosmicCount: false
                    } as any
                ),
                {
                    putativeDriver: true,
                    isHotspot: false,
                    oncoKbOncogenic: "",
                    simplifiedMutationType: getSimplifiedMutationType("in_frame_ins"),
                    mutationType: "in_frame_ins",
                },
                "cbioportal count"
            );

            assert.deepEqual(
                annotateMutationPutativeDriver(
                    {
                        mutationType: "in_frame_ins",
                    } as Mutation,
                    {
                        hotspots: false,
                        oncoKb: "",
                        cbioportalCount: false,
                        cosmicCount: true
                    } as any
                ),
                {
                    putativeDriver: true,
                    isHotspot: false,
                    oncoKbOncogenic: "",
                    simplifiedMutationType: getSimplifiedMutationType("in_frame_ins"),
                    mutationType: "in_frame_ins",
                },
                "cosmic count"
            );
        });
        it("annotates with custom driver annotations", ()=>{
            assert.deepEqual(
                annotateMutationPutativeDriver(
                    {
                        mutationType: "asdfasdf",
                    } as Mutation,
                    {
                        hotspots: false,
                        oncoKb: "",
                        customDriverBinary: false,
                        customDriverTier: "hello"
                    } as any
                ),
                {
                    putativeDriver: true,
                    isHotspot: false,
                    oncoKbOncogenic: "",
                    simplifiedMutationType: getSimplifiedMutationType("asdfasdf"),
                    mutationType: "asdfasdf",
                },
                "tier"
            );

            assert.deepEqual(
                annotateMutationPutativeDriver(
                    {
                        mutationType: "missense",
                    } as Mutation,
                    {
                        hotspots: false,
                        oncoKb: "",
                        customDriverBinary: true,
                    } as any
                ),
                {
                    putativeDriver: true,
                    isHotspot: false,
                    oncoKbOncogenic: "",
                    simplifiedMutationType: getSimplifiedMutationType("missense"),
                    mutationType: "missense",
                },
                "binary"
            );
        });
        it("annotates with all", ()=>{
            assert.deepEqual(
                annotateMutationPutativeDriver(
                    {
                        mutationType: "asdfasdf",
                    } as Mutation,
                    {
                        hotspots: true,
                        oncoKb: "oncogenic",
                        cbioportalCount: true,
                        cosmicCount: true,
                        customDriverBinary: true,
                        customDriverTier: "hello"
                    } as any
                ),
                {
                    putativeDriver: true,
                    isHotspot: true,
                    oncoKbOncogenic: "oncogenic",
                    simplifiedMutationType: getSimplifiedMutationType("asdfasdf"),
                    mutationType: "asdfasdf",
                }
            );
        });
        it("annotates with none", ()=>{
            assert.deepEqual(
                annotateMutationPutativeDriver(
                    {
                        mutationType: "cvzxcv",
                    } as Mutation,
                    {
                        hotspots: false,
                        oncoKb: "",
                        cbioportalCount: false,
                        cosmicCount: false,
                        customDriverBinary: false,
                    } as any
                ),
                {
                    putativeDriver: false,
                    isHotspot: false,
                    oncoKbOncogenic: "",
                    simplifiedMutationType: getSimplifiedMutationType("cvzxcv"),
                    mutationType: "cvzxcv",
                }
            );
        });
    });

    describe("computePutativeDriverAnnotatedMutations", ()=>{
        it("returns empty list for empty input", ()=>{
            assert.deepEqual(computePutativeDriverAnnotatedMutations([], ()=>({}) as any, {}, false), []);
        });
        it("annotates a single mutation", ()=>{
            assert.deepEqual(
                computePutativeDriverAnnotatedMutations(
                    [{mutationType:"missense", entrezGeneId:1} as Mutation],
                    ()=>({oncoKb:"", hotspots:true, cbioportalCount:false, cosmicCount:true, customDriverBinary:false}),
                    {1:{ hugoGeneSymbol:"mygene"} as Gene},
                    true
                ) as Partial<AnnotatedMutation>[],
                [{
                    mutationType:"missense",
                    hugoGeneSymbol:"mygene",
                    entrezGeneId:1,
                    simplifiedMutationType: getSimplifiedMutationType("missense"),
                    isHotspot: true,
                    oncoKbOncogenic: "",
                    putativeDriver: true
                } as AnnotatedMutation]
            );
        });
        it("annotates a few mutations", ()=>{
            assert.deepEqual(
                computePutativeDriverAnnotatedMutations(
                    [{mutationType:"missense", entrezGeneId:1} as Mutation, {mutationType:"in_frame_del", entrezGeneId:1} as Mutation, {mutationType:"asdf", entrezGeneId:134} as Mutation],
                    ()=>({oncoKb:"", hotspots:true, cbioportalCount:false, cosmicCount:true, customDriverBinary:false}),
                    {1:{hugoGeneSymbol:"gene1hello"} as Gene, 134:{hugoGeneSymbol:"gene3hello"} as Gene},
                    true
                ) as Partial<AnnotatedMutation>[],
                [{
                    mutationType:"missense",
                    hugoGeneSymbol:"gene1hello",
                    entrezGeneId:1,
                    simplifiedMutationType: getSimplifiedMutationType("missense"),
                    isHotspot: true,
                    oncoKbOncogenic: "",
                    putativeDriver: true
                },{
                    mutationType:"in_frame_del",
                    hugoGeneSymbol:"gene1hello",
                    entrezGeneId:1,
                    simplifiedMutationType: getSimplifiedMutationType("in_frame_del"),
                    isHotspot: true,
                    oncoKbOncogenic: "",
                    putativeDriver: true
                },{
                    mutationType:"asdf",
                    hugoGeneSymbol:"gene3hello",
                    entrezGeneId:134,
                    simplifiedMutationType: getSimplifiedMutationType("asdf"),
                    isHotspot: true,
                    oncoKbOncogenic: "",
                    putativeDriver: true
                }]
            );
        });
        it("excludes a single non-annotated mutation", ()=>{
            assert.deepEqual(
                computePutativeDriverAnnotatedMutations(
                    [{mutationType:"missense", entrezGeneId:1} as Mutation],
                    ()=>({oncoKb:"", hotspots:false, cbioportalCount:false, cosmicCount:false, customDriverBinary:false}),
                    {1:{hugoGeneSymbol:"gene1hello"} as Gene, 134:{hugoGeneSymbol:"gene3hello"} as Gene},
                    true
                ),
                []
            );
        });
        it("excludes non-annotated mutations from a list of a few", ()=>{
            assert.deepEqual(
                computePutativeDriverAnnotatedMutations(
                    [{mutationType:"missense", entrezGeneId:1} as Mutation, {mutationType:"in_frame_del", entrezGeneId:1} as Mutation, {mutationType:"asdf", entrezGeneId:134} as Mutation],
                    (m)=>(m.mutationType === "in_frame_del" ?
                        {oncoKb:"", hotspots:false, cbioportalCount:false, cosmicCount:false, customDriverBinary:true}:
                        {oncoKb:"", hotspots:false, cbioportalCount:false, cosmicCount:false, customDriverBinary:false}
                    ),
                    {1:{hugoGeneSymbol:"gene1hello"} as Gene, 134:{hugoGeneSymbol:"gene3hello"} as Gene},
                    true
                ) as Partial<AnnotatedMutation>[],
                [{
                    mutationType:"in_frame_del",
                    hugoGeneSymbol:"gene1hello",
                    entrezGeneId:1,
                    simplifiedMutationType: getSimplifiedMutationType("in_frame_del"),
                    isHotspot: false,
                    oncoKbOncogenic: "",
                    putativeDriver: true
                }]
            );
        });
    });

    describe("getOncoKbOncogenic", ()=>{
        it("should return Likely Oncogenic if thats the input", ()=>{
            assert.equal(getOncoKbOncogenic({oncogenic:"Likely Oncogenic"} as IndicatorQueryResp), "Likely Oncogenic");
        });
        it("should return Oncogenic if thats the input", ()=>{
            assert.equal(getOncoKbOncogenic({oncogenic:"Oncogenic"} as IndicatorQueryResp), "Oncogenic");
        });
        it("should return Predicted Oncogenic if thats the input", ()=>{
            assert.equal(getOncoKbOncogenic({oncogenic:"Predicted Oncogenic"} as IndicatorQueryResp), "Predicted Oncogenic");
        });
        it("should return empty string for any other case", ()=>{
            assert.equal(getOncoKbOncogenic({oncogenic:"Likely Neutral"} as IndicatorQueryResp), "");
            assert.equal(getOncoKbOncogenic({oncogenic:"Inconclusive"} as IndicatorQueryResp), "");
            assert.equal(getOncoKbOncogenic({oncogenic:"Unknown"} as IndicatorQueryResp), "");
            assert.equal(getOncoKbOncogenic({oncogenic:""} as IndicatorQueryResp), "");
            assert.equal(getOncoKbOncogenic({oncogenic:"asdfasdfasefawer"} as IndicatorQueryResp), "");
            assert.equal(getOncoKbOncogenic({oncogenic:undefined} as any), "");
        });
    });

    describe("annotateMolecularDatum", ()=>{
        it("annotates single element correctly in case of Likely Oncogenic", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Likely Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"Likely Oncogenic", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
        });
        it("annotates single element correctly in case of Predicted Oncogenic", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Predicted Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"Predicted Oncogenic", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
        });
        it("annotates single element correctly in case of Oncogenic", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"Oncogenic", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
        });
        it("annotates single element correctly in case of Likely Neutral, Inconclusive, Unknown, asdfasd, undefined, empty", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Likely Neutral"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Inconclusive"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Unknown"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"asdfasdf"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:undefined} as any),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:""} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
        });
        it("annotates non-copy number data with empty string", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"MUTATION_EXTENDED"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"MRNA_EXPRESSION"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"PROTEIN_LEVEL"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile", entrezGeneId:9} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"FUSION"} as MolecularProfile},
                    { 9: { hugoGeneSymbol:"genesymbol"} as Gene}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"", hugoGeneSymbol:"genesymbol", entrezGeneId:9}
            );
        });
    });



    describe('getDefaultSelectedStudiesForExpressionTab', () => {

        it('recognizes pub tcga study', () => {
            const studyId = "blca_tcga_pub";
            assert.isTrue(isTCGAPubStudy(studyId));
            assert.isFalse(isTCGAProvStudy(studyId));
            assert.isFalse(isPanCanStudy(studyId));
        });

        it('recognizes provisional tcga study', () => {
            const studyId = "blca_tcga";
            assert.isFalse(isTCGAPubStudy(studyId));
            assert.isTrue(isTCGAProvStudy(studyId));
            assert.isFalse(isPanCanStudy(studyId));
        });

        it('recognizes pan can tcga study', () => {
            const studyId = "blca_tcga_pan_can_atlas_2018";
            assert.isFalse(isTCGAPubStudy(studyId));
            assert.isFalse(isTCGAProvStudy(studyId));
            assert.isTrue(isPanCanStudy(studyId));
        });

    });


    describe("computeGenePanelInformation", ()=>{
        const genes:Gene[] = [];
        const samples:Sample[] = [];
        const patients:Patient[] = [];
        let genePanelDatum1:any, genePanelDatum2:any, wxsDatum1:any, nsDatum1:any, nsDatum2:any;
        let genePanels:any[] = [];
        before(()=>{

            genes.push({
                entrezGeneId:0,
                hugoGeneSymbol:"GENE1"
            } as Gene);
            genes.push({
                entrezGeneId:1,
                hugoGeneSymbol:"GENE2"
            } as Gene);
            genes.push({
                entrezGeneId:2,
                hugoGeneSymbol:"GENE3"
            } as Gene);

            genePanels.push({
                genePanelId:"GENEPANEL1",
                genes:[genes[0], genes[1]]
            });

            genePanels.push({
                genePanelId:"GENEPANEL2",
                genes:[genes[0], genes[1]]
            });

            samples.push({
                uniqueSampleKey:"PATIENT1 SAMPLE1"
            } as Sample);
            samples.push({
                uniqueSampleKey:"PATIENT1 SAMPLE2"
            } as Sample);
            samples.push({
                uniqueSampleKey:"PATIENT2 SAMPLE1"
            } as Sample);

            patients.push({
                uniquePatientKey:"PATIENT1"
            } as Patient);
            patients.push({
                uniquePatientKey:"PATIENT2"
            } as Patient);

            genePanelDatum1 = {
                uniqueSampleKey: "PATIENT1 SAMPLE1",
                uniquePatientKey: "PATIENT1",
                molecularProfileId: "PROFILE",
                genePanelId: "GENEPANEL1",
                profiled: true
            };

            genePanelDatum2 = {
                uniqueSampleKey: "PATIENT2 SAMPLE1",
                uniquePatientKey: "PATIENT2",
                molecularProfileId: "PROFILE",
                genePanelId: "GENEPANEL2",
                profiled: true
            };

            wxsDatum1 = {
                uniqueSampleKey:"PATIENT1 SAMPLE2",
                uniquePatientKey: "PATIENT1",
                molecularProfileId: "PROFILE",
                profiled: true
            };


            nsDatum1 = {
                entrezGeneId: 2,
                molecularProfileId: "PROFILE",
                uniqueSampleKey: "PATIENT1 SAMPLE1",
                uniquePatientKey: "PATIENT1",
                profiled: false
            };

            nsDatum2 = {
                entrezGeneId: 2,
                molecularProfileId: "PROFILE",
                uniqueSampleKey: "PATIENT2 SAMPLE1",
                uniquePatientKey: "PATIENT2",
                profiled: false
            };
        });
        it("computes the correct object with no input data", ()=>{
            assert.deepEqual(
                computeGenePanelInformation([], genePanels, samples, patients, genes),
                {
                    samples: {
                        "PATIENT1 SAMPLE1": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        },
                        "PATIENT1 SAMPLE2": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        },
                        "PATIENT2 SAMPLE1": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        }
                    },
                    patients: {
                        "PATIENT1": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        },
                        "PATIENT2": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        }
                    }
                }
            );
        });
        it("computes the correct object with gene panel data", ()=>{
            assert.deepEqual(
                computeGenePanelInformation([
                    genePanelDatum1, genePanelDatum2
                ] as GenePanelData[], genePanels, samples, patients, genes),
                {
                    samples: {
                        "PATIENT1 SAMPLE1": {
                            byGene:{"GENE1":[genePanelDatum1], "GENE2":[genePanelDatum1]},
                            allGenes:[],
                            notProfiledByGene:{"GENE3":[genePanelDatum1]},
                            notProfiledAllGenes:[]
                        },
                        "PATIENT1 SAMPLE2": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        },
                        "PATIENT2 SAMPLE1": {
                            byGene:{"GENE1":[genePanelDatum2], "GENE2":[genePanelDatum2]},
                            allGenes:[],
                            notProfiledByGene:{"GENE3":[genePanelDatum2]},
                            notProfiledAllGenes:[]
                        }
                    },
                    patients: {
                        "PATIENT1": {
                            byGene:{"GENE1":[genePanelDatum1], "GENE2":[genePanelDatum1]},
                            allGenes:[],
                            notProfiledByGene:{"GENE3":[genePanelDatum1]},
                            notProfiledAllGenes:[]
                        },
                        "PATIENT2": {
                            byGene:{"GENE1":[genePanelDatum2], "GENE2":[genePanelDatum2]},
                            allGenes:[],
                            notProfiledByGene:{"GENE3":[genePanelDatum2]},
                            notProfiledAllGenes:[]
                        }
                    }
                }
            );
        });
        it("computes the correct object with whole exome sequenced data", ()=>{
            assert.deepEqual(
                computeGenePanelInformation([
                    wxsDatum1
                ] as GenePanelData[], genePanels, samples, patients, genes),
                {
                    samples: {
                        "PATIENT1 SAMPLE1": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        },
                        "PATIENT1 SAMPLE2": {
                            byGene:{},
                            allGenes:[wxsDatum1],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        },
                        "PATIENT2 SAMPLE1": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        }
                    },
                    patients: {
                        "PATIENT1": {
                            byGene:{},
                            allGenes:[wxsDatum1],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        },
                        "PATIENT2": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        }
                    }
                }
            );
        });
        it("computes the correct object with not sequenced data", ()=>{
            assert.deepEqual(
                computeGenePanelInformation([
                    nsDatum1, nsDatum2
                ] as GenePanelData[], genePanels, samples, patients, genes),
                {
                    samples: {
                        "PATIENT1 SAMPLE1": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[nsDatum1]
                        },
                        "PATIENT1 SAMPLE2": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        },
                        "PATIENT2 SAMPLE1": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[nsDatum2]
                        }
                    },
                    patients: {
                        "PATIENT1": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[nsDatum1]
                        },
                        "PATIENT2": {
                            byGene:{},
                            allGenes:[],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[nsDatum2]
                        }
                    }
                }
            );
        });
        it("computes the correct object with gene panel data and whole exome sequenced data" /*and not sequenced data"*/, ()=>{
            assert.deepEqual(
                computeGenePanelInformation([
                    genePanelDatum1, genePanelDatum2,
                    wxsDatum1
                    ,nsDatum1, nsDatum2
                ] as GenePanelData[], genePanels, samples, patients, genes),
                {
                    samples: {
                        "PATIENT1 SAMPLE1": {
                            byGene:{"GENE1":[genePanelDatum1], "GENE2":[genePanelDatum1]},
                            allGenes:[],
                            notProfiledByGene:{"GENE3":[genePanelDatum1]},
                            notProfiledAllGenes:[nsDatum1]
                        },
                        "PATIENT1 SAMPLE2": {
                            byGene:{},
                            allGenes:[wxsDatum1],
                            notProfiledByGene:{},
                            notProfiledAllGenes:[]
                        },
                        "PATIENT2 SAMPLE1": {
                            byGene:{"GENE1":[genePanelDatum2], "GENE2":[genePanelDatum2]},
                            allGenes:[],
                            notProfiledByGene:{"GENE3":[genePanelDatum2]},
                            notProfiledAllGenes:[nsDatum2]
                        }
                    },
                    patients: {
                        "PATIENT1": {
                            byGene:{"GENE1":[genePanelDatum1], "GENE2":[genePanelDatum1]},
                            allGenes:[wxsDatum1],
                            notProfiledByGene:{"GENE3":[genePanelDatum1]},
                            notProfiledAllGenes:[nsDatum1]
                        },
                        "PATIENT2": {
                            byGene:{"GENE1":[genePanelDatum2], "GENE2":[genePanelDatum2]},
                            allGenes:[],
                            notProfiledByGene:{"GENE3":[genePanelDatum2]},
                            notProfiledAllGenes:[nsDatum2]
                        }
                    }
                }
            );
        });
    });

    describe('getRNASeqProfiles',()=>{

        it('properly recognizes expression profile based on patterns in id',()=>{
            assert.isFalse(isRNASeqProfile("",1), "blank is false");
            assert.isTrue(isRNASeqProfile("acc_tcga_rna_seq_v2_mrna",2),"matches seq v2 id");
            assert.isFalse(isRNASeqProfile("acc_tcga_rna_seq_v2_mrna",1),"fails if versions is wrong");
            assert.isTrue(isRNASeqProfile("chol_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median",2),'matches pan can v2');
            assert.isFalse(isRNASeqProfile("chol_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median",1),'matches pan can v2');
            assert.isFalse(isRNASeqProfile("laml_tcga_rna_seq_mrna",2));
            assert.isTrue(isRNASeqProfile("laml_tcga_rna_seq_mrna",1));
            assert.isFalse(isRNASeqProfile("chol_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median_Zscores",2), 'doesn\'t match zscores profils');
        });

    });

    describe("getQueriedStudies", ()=>{

        const virtualStudy: VirtualStudy = {
            "id": "shared_study",
            "data": {
                "name": "Shared Study",
                "description": "Shared Study",
                "studies": [
                    {
                        "id": "test_study",
                        "samples": [
                        "sample-01",
                        "sample-02",
                        "sample-03"
                        ]
                    }
                ],
            } as VirtualStudyData
        } as VirtualStudy;

        let physicalStudies: { [id: string]: CancerStudy } = {
            'physical_study_1': {
                studyId: 'physical_study_1',
            } as CancerStudy,
            'physical_study_2': {
                studyId: 'physical_study_2',
            } as CancerStudy
        };

        let virtualStudies: VirtualStudy[] = [
            $.extend({},virtualStudy,{"id": "virtual_study_1"}) as VirtualStudy,
            $.extend({},virtualStudy,{"id": "virtual_study_2"}) as VirtualStudy
        ];

        before(()=>{
            sinon.stub(sessionServiceClient, "getUserVirtualStudies").callsFake(function fakeFn(id:string) {
                return new Promise((resolve, reject) => {
                    resolve(virtualStudies);
                });
            });
            //
            sinon.stub(client, "fetchStudiesUsingPOST").callsFake(function fakeFn(parameters: {
                'studyIds': Array < string > ,
                'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META"
            }) {
                return new Promise((resolve, reject) => {
                    resolve(_.reduce(parameters.studyIds,(acc:CancerStudy[],next)=>{
                        let obj = physicalStudies[next]
                        if(!_.isUndefined(obj)){
                            acc.push(obj)
                        }
                        return acc
                    },[]))
                });
            });
        })
        after(() => {
            //(sessionServiceClient.getVirtualStudy as sinon.SinonStub).restore();
            //(client.fetchStudiesUsingPOST as sinon.SinonStub).restore();
        });

        it("when queried ids is empty", async ()=>{
            let test = await fetchQueriedStudies({},[]);
            assert.deepEqual(test,[]);
        });

        
        it("when only physical studies are present", async ()=>{
            let test = await fetchQueriedStudies(physicalStudies,['physical_study_1', 'physical_study_2']);
            assert.deepEqual(_.map(test,obj=>obj.studyId), ['physical_study_1', 'physical_study_2']);
        });

        it("when only virtual studies are present", async ()=>{
            let test = await fetchQueriedStudies({},['virtual_study_1', 'virtual_study_2']);
            assert.deepEqual(_.map(test,obj=>obj.studyId), ['virtual_study_1', 'virtual_study_2']);
        });

        it("when physical and virtual studies are present", async ()=>{
            let test = await fetchQueriedStudies(physicalStudies, ['physical_study_1', 'virtual_study_2']);
            assert.deepEqual(_.map(test,obj=>obj.studyId), ['physical_study_1', 'virtual_study_2']);
        });

        it("when there only a subset of studies in studySampleMap compared to queriedIds", async ()=>{
            let test = await fetchQueriedStudies({ 'physical_study_1': { studyId: 'physical_study_1'} as CancerStudy},['physical_study_1','physical_study_2']);
            assert.deepEqual(_.map(test,obj=>obj.studyId), ['physical_study_1', 'physical_study_2']);
        });

        //this case is not possible because id in these scenarios are first identified in QueryBuilder.java and
        //returned to query selector page
        it("when virtual study query having private study or unknow virtual study id", async ()=>{
            let test = await fetchQueriedStudies({},['shared_study1']);
            // assume no studies returned
            assert.equal(test.length, 0);
        });



    });

    describe('buildResultsViewPageTitle', ()=>{

        it('handles various numbers of studies and genes',()=>{

            let genes = ["KRAS","NRAS","BRAF"];
            let studies = [{ shortName:"Study Number One"} as CancerStudy];
            let ret = buildResultsViewPageTitle(genes, studies);
            let expectedResult = "cBioPortal for Cancer Genomics: KRAS, NRAS and 1 other gene in Study Number One";
            assert.equal(ret, expectedResult, "three genes, one study");

            genes = ["KRAS","NRAS","BRAF","KFED"];
            studies = [{ shortName:"Study Number One"} as CancerStudy];
            ret = buildResultsViewPageTitle(genes, studies);
            expectedResult = "cBioPortal for Cancer Genomics: KRAS, NRAS and 2 other genes in Study Number One";
            assert.equal(ret, expectedResult, "two genes, one study");

            genes = ["KRAS","NRAS"];
            studies = [{ shortName:"Study Number One"} as CancerStudy];
            ret = buildResultsViewPageTitle(genes, studies);
            expectedResult = "cBioPortal for Cancer Genomics: KRAS, NRAS in Study Number One";
            assert.equal(ret, expectedResult, "two genes, one study");

            genes = ["KRAS"];
            studies = [{ shortName:"Study Number One"} as CancerStudy];
            ret = buildResultsViewPageTitle(genes, studies);
            expectedResult = "cBioPortal for Cancer Genomics: KRAS in Study Number One";
            assert.equal(ret, expectedResult, "one gene, one study");

            genes = ["KRAS"];
            studies = [{ shortName:"Study Number One"} as CancerStudy, { shortName:"Study Number Two"} as CancerStudy];
            ret = buildResultsViewPageTitle(genes, studies);
            expectedResult = "cBioPortal for Cancer Genomics: KRAS in Study Number One and 1 other study";
            assert.equal(ret, expectedResult, "one gene two studies");

            genes = ["KRAS"];
            studies = [{ shortName:"Study Number One"} as CancerStudy, { shortName:"Study Number Two"} as CancerStudy,  { shortName:"Study Number Two"} as CancerStudy];
            ret = buildResultsViewPageTitle(genes, studies);
            expectedResult = "cBioPortal for Cancer Genomics: KRAS in Study Number One and 2 other studies";
            assert.equal(ret, expectedResult, "one gene, three studies");

        })

    });

});


describe('getSampleAlteredMap', () => {

    const arg0 = [
        {
            "cases": {
                "samples": {
                },
                "patients": {
                }
            },
            "oql": {
                "label": "RAS",
                "list": [
                    {
                        "gene": "KRAS",
                        "parsed_oql_line": {
                            "gene": "KRAS",
                            "alterations": [
                                {
                                    "alteration_type": "mut",
                                    "info": {}
                                },
                                {
                                    "alteration_type": "fusion"
                                }
                            ]
                        },
                        "oql_line": "KRAS: MUT FUSION;",
                        "data": [
                            {
                                "uniqueSampleKey": "QjA4NTpjaG9sX251c18yMDEy",
                            },
                            {
                                "uniqueSampleKey": "UjEwNDpjaG9sX251c18yMDEy",
                            },
                            {
                                "uniqueSampleKey": "VzAxMjpjaG9sX251c18yMDEy",
                            }
                        ]
                    },
                    {
                        "gene": "NRAS",
                        "parsed_oql_line": {
                            "gene": "NRAS",
                            "alterations": [
                                {
                                    "alteration_type": "mut",
                                    "info": {}
                                },
                                {
                                    "alteration_type": "fusion"
                                }
                            ]
                        },
                        "oql_line": "NRAS: MUT FUSION;",
                        "data": []
                    }
                ]
            },
            "mergedTrackOqlList": [
                {
                    "cases": {
                        "samples": {
                        },
                        "patients": {
                        }
                    },
                    "oql": {
                        "gene": "KRAS",
                        "parsed_oql_line": {
                            "gene": "KRAS",
                            "alterations": [
                                {
                                    "alteration_type": "mut",
                                    "info": {}
                                },
                                {
                                    "alteration_type": "fusion"
                                }
                            ]
                        },
                        "oql_line": "KRAS: MUT FUSION;",
                        "data": [
                            {
                                "uniqueSampleKey": "QjA4NTpjaG9sX251c18yMDEy",
                            },
                            {
                                "uniqueSampleKey": "UjEwNDpjaG9sX251c18yMDEy",
                            },
                            {
                                "uniqueSampleKey": "VzAxMjpjaG9sX251c18yMDEy",
                            }
                        ]
                    }
                },
                {
                    "cases": {
                        "samples": {
                        },
                        "patients": {
                        }
                    },
                    "oql": {
                        "gene": "NRAS",
                        "parsed_oql_line": {
                            "gene": "NRAS",
                            "alterations": [
                                {
                                    "alteration_type": "mut",
                                    "info": {}
                                },
                                {
                                    "alteration_type": "fusion"
                                }
                            ]
                        },
                        "oql_line": "NRAS: MUT FUSION;",
                        "data": []
                    }
                }
            ]
        },
        {
            "cases": {
                "samples": {
                },
                "patients": {
                }
            },
            "oql": {
                "list": [
                    {
                        "gene": "SMAD4",
                        "parsed_oql_line": {
                            "gene": "SMAD4",
                            "alterations": [
                                {
                                    "alteration_type": "mut",
                                    "info": {}
                                },
                                {
                                    "alteration_type": "fusion"
                                }
                            ]
                        },
                        "oql_line": "SMAD4: MUT FUSION;",
                        "data": [
                            {
                                "uniqueSampleKey": "QjA5OTpjaG9sX251c18yMDEy",
                            },
                            {
                                "uniqueSampleKey": "UjEwNDpjaG9sX251c18yMDEy",
                            },
                            {
                                "uniqueSampleKey": "VTA0NDpjaG9sX251c18yMDEy",
                            },
                            {
                                "uniqueSampleKey": "VzAxMjpjaG9sX251c18yMDEy",
                            }
                        ]
                    },
                    {
                        "gene": "RAN",
                        "parsed_oql_line": {
                            "gene": "RAN",
                            "alterations": [
                                {
                                    "alteration_type": "mut",
                                    "info": {}
                                },
                                {
                                    "alteration_type": "fusion"
                                }
                            ]
                        },
                        "oql_line": "RAN: MUT FUSION;",
                        "data": []
                    }
                ]
            },
            "mergedTrackOqlList": [
                {
                    "cases": {
                        "samples": {
                        },
                        "patients": {
                        }
                    },
                    "oql": {
                        "gene": "SMAD4",
                        "parsed_oql_line": {
                            "gene": "SMAD4",
                            "alterations": [
                                {
                                    "alteration_type": "mut",
                                    "info": {}
                                },
                                {
                                    "alteration_type": "fusion"
                                }
                            ]
                        },
                        "oql_line": "SMAD4: MUT FUSION;",
                        "data": [
                            {
                                "uniqueSampleKey": "QjA5OTpjaG9sX251c18yMDEy",
                            },
                            {
                                "uniqueSampleKey": "UjEwNDpjaG9sX251c18yMDEy",
                            },
                            {
                                "uniqueSampleKey": "VTA0NDpjaG9sX251c18yMDEy",
                            },
                            {
                                "uniqueSampleKey": "VzAxMjpjaG9sX251c18yMDEy",
                            }
                        ]
                    }
                },
                {
                    "cases": {
                        "samples": {
                        },
                        "patients": {
                        }
                    },
                    "oql": {
                        "gene": "RAN",
                        "parsed_oql_line": {
                            "gene": "RAN",
                            "alterations": [
                                {
                                    "alteration_type": "mut",
                                    "info": {}
                                },
                                {
                                    "alteration_type": "fusion"
                                }
                            ]
                        },
                        "oql_line": "RAN: MUT FUSION;",
                        "data": []
                    }
                }
            ]
        },
        {
            "cases": {
                "samples": {
                },
                "patients": {
                }
            },
            "oql": {
                "gene": "SMAD4",
                "parsed_oql_line": {
                    "gene": "SMAD4",
                    "alterations": [
                        {
                            "alteration_type": "mut",
                            "info": {}
                        }
                    ]
                },
                "oql_line": "SMAD4: MUT;",
                "data": [
                    {
                        "uniqueSampleKey": "QjA5OTpjaG9sX251c18yMDEy",
                    },
                    {
                        "uniqueSampleKey": "UjEwNDpjaG9sX251c18yMDEy",
                    },
                    {
                        "uniqueSampleKey": "VTA0NDpjaG9sX251c18yMDEy",
                    },
                    {
                        "uniqueSampleKey": "VzAxMjpjaG9sX251c18yMDEy",
                    }
                ]
            }
        },
        {
            "cases": {
                "samples": {
                }
            },
            "oql": {
                "gene": "KRAS",
                "parsed_oql_line": {
                    "gene": "KRAS",
                    "alterations": [
                        {
                            "alteration_type": "mut",
                            "info": {}
                        },
                        {
                            "alteration_type": "fusion"
                        }
                    ]
                },
                "oql_line": "KRAS: MUT FUSION;",
                "data": [
                    {
                        "uniqueSampleKey": "QjA4NTpjaG9sX251c18yMDEy",
                    },
                    {
                        "uniqueSampleKey": "UjEwNDpjaG9sX251c18yMDEy",
                    },
                    {
                        "uniqueSampleKey": "VzAxMjpjaG9sX251c18yMDEy",
                    }
                ]
            }
        }
    ] as IQueriedMergedTrackCaseData[];

    var arg1 = [
        {
            "uniqueSampleKey": "QjA4NTpjaG9sX251c18yMDEy",
            "uniquePatientKey": "QjA4NTpjaG9sX251c18yMDEy",
            "sampleType": "Primary Solid Tumor",
            "sequenced": true,
            "copyNumberSegmentPresent": false,
            "sampleId": "B085",
            "patientId": "B085",
            "studyId": "chol_nus_2012"
        },
        {
            "uniqueSampleKey": "QjA5OTpjaG9sX251c18yMDEy",
            "uniquePatientKey": "QjA5OTpjaG9sX251c18yMDEy",
            "sampleType": "Primary Solid Tumor",
            "sequenced": true,
            "copyNumberSegmentPresent": false,
            "sampleId": "B099",
            "patientId": "B099",
            "studyId": "chol_nus_2012"
        },
        {
            "uniqueSampleKey": "UjEwNDpjaG9sX251c18yMDEy",
            "uniquePatientKey": "UjEwNDpjaG9sX251c18yMDEy",
            "sampleType": "Primary Solid Tumor",
            "sequenced": true,
            "copyNumberSegmentPresent": false,
            "sampleId": "R104",
            "patientId": "R104",
            "studyId": "chol_nus_2012"
        },
        {
            "uniqueSampleKey": "VDAyNjpjaG9sX251c18yMDEy",
            "uniquePatientKey": "VDAyNjpjaG9sX251c18yMDEy",
            "sampleType": "Primary Solid Tumor",
            "sequenced": true,
            "copyNumberSegmentPresent": false,
            "sampleId": "T026",
            "patientId": "T026",
            "studyId": "chol_nus_2012"
        },
        {
            "uniqueSampleKey": "VTA0NDpjaG9sX251c18yMDEy",
            "uniquePatientKey": "VTA0NDpjaG9sX251c18yMDEy",
            "sampleType": "Primary Solid Tumor",
            "sequenced": true,
            "copyNumberSegmentPresent": false,
            "sampleId": "U044",
            "patientId": "U044",
            "studyId": "chol_nus_2012"
        },
        {
            "uniqueSampleKey": "VzAxMjpjaG9sX251c18yMDEy",
            "uniquePatientKey": "VzAxMjpjaG9sX251c18yMDEy",
            "sampleType": "Primary Solid Tumor",
            "sequenced": true,
            "copyNumberSegmentPresent": false,
            "sampleId": "W012",
            "patientId": "W012",
            "studyId": "chol_nus_2012"
        },
        {
            "uniqueSampleKey": "VzAzOTpjaG9sX251c18yMDEy",
            "uniquePatientKey": "VzAzOTpjaG9sX251c18yMDEy",
            "sampleType": "Primary Solid Tumor",
            "sequenced": true,
            "copyNumberSegmentPresent": false,
            "sampleId": "W039",
            "patientId": "W039",
            "studyId": "chol_nus_2012"
        },
        {
            "uniqueSampleKey": "VzA0MDpjaG9sX251c18yMDEy",
            "uniquePatientKey": "VzA0MDpjaG9sX251c18yMDEy",
            "sampleType": "Primary Solid Tumor",
            "sequenced": true,
            "copyNumberSegmentPresent": false,
            "sampleId": "W040",
            "patientId": "W040",
            "studyId": "chol_nus_2012"
        }
    ] as Sample[];

    const arg2 = "[\"RAS\" KRAS NRAS]\n[SMAD4 RAN]\nSMAD4: MUT\nKRAS";

    it('handles different type of gene tracks correctly', () => {
        
        const ret = getSampleAlteredMap(arg0, arg1, arg2);
        const expectedResult = {
            "RAS": [
                true,
                false,
                true,
                false,
                false,
                true,
                false,
                false
            ],
            "SMAD4 / RAN": [
                false,
                true,
                true,
                false,
                true,
                true,
                false,
                false
            ],
            "SMAD4: MUT": [
                false,
                true,
                true,
                false,
                true,
                true,
                false,
                false
            ],
            "KRAS": [
                true,
                false,
                true,
                false,
                false,
                true,
                false,
                false
            ]
        };
        assert.deepEqual(ret["KRAS"], expectedResult["KRAS"], "single gene track");
        assert.deepEqual(ret["SMAD4: MUT"], expectedResult["SMAD4: MUT"], "single gene track(with alteration)");
        assert.deepEqual(ret["SMAD4 / RAN"], expectedResult["SMAD4 / RAN"], "merged gene track");
        assert.deepEqual(ret["RAS"], expectedResult["RAS"], "merged gene track(with group name)");

    });
});

describe('getSingleGeneResultKey', () => {
    it('handles gene with alteration', () => {

        let arg0 = 2;
        let arg1 = "[\"RAS\" KRAS NRAS]\n[SMAD4 RAN]\nSMAD4: MUT\nKRAS";
        let arg2 = {
            "gene": "SMAD4",
            "parsed_oql_line": {
                "gene": "SMAD4",
                "alterations": []
            },
            "oql_line": "SMAD4: MUT;",
            "data": []
        } as OQLLineFilterOutput<AnnotatedExtendedAlteration>;
        const ret = getSingleGeneResultKey(arg0, arg1, arg2);
        const expectedResult = "SMAD4: MUT"

        assert.equal(ret, expectedResult, "get single gene result key(with alteration)");

    });

    it('handles gene without mutation', () => {

        let arg0 = 3;
        let arg1 = "[\"RAS\" KRAS NRAS]\n[SMAD4 RAN]\nSMAD4: MUT\nKRAS";
        let arg2 = {
            "gene": "KRAS",
            "parsed_oql_line": {
                "gene": "KRAS",
                "alterations": []
            },
            "oql_line": "KRAS: MUT FUSION;",
            "data": []
        } as OQLLineFilterOutput<AnnotatedExtendedAlteration>;
        const ret = getSingleGeneResultKey(arg0, arg1, arg2);
        const expectedResult = "KRAS"
        
        assert.equal(ret, expectedResult, "get single gene result key(without alteration)");

    });
});

describe('getMultipleGeneResultKey', () => {
    it('handles gene group with name', () => {

        let arg0 = {
            "label": "RAS",
            "list": [
                {
                    "gene": "KRAS",
                    "parsed_oql_line": {
                        "gene": "KRAS",
                        "alterations": []
                    },
                    "oql_line": "KRAS: MUT FUSION;",
                    "data": []
                },
                {
                    "gene": "NRAS",
                    "parsed_oql_line": {
                        "gene": "NRAS",
                        "alterations": []
                    },
                    "oql_line": "NRAS: MUT FUSION;",
                    "data": []
                }
            ]
        } as MergedTrackLineFilterOutput<AnnotatedExtendedAlteration>;
        const ret = getMultipleGeneResultKey(arg0);
        const expectedResult = "RAS"
        
        assert.equal(ret, expectedResult, "get gene group result key(with name)");

    });

    it('handles gene group without name', () => {

        let arg0 = {
            "list": [
                {
                    "gene": "SMAD4",
                    "parsed_oql_line": {
                        "gene": "SMAD4",
                        "alterations": []
                    },
                    "oql_line": "SMAD4: MUT FUSION;",
                    "data": []
                },
                {
                    "gene": "RAN",
                    "parsed_oql_line": {
                        "gene": "RAN",
                        "alterations": []
                    },
                    "oql_line": "RAN: MUT FUSION;",
                    "data": []
                }
            ]
        } as MergedTrackLineFilterOutput<AnnotatedExtendedAlteration>;
        const ret = getMultipleGeneResultKey(arg0);
        const expectedResult = "SMAD4 / RAN"
        
        assert.equal(ret, expectedResult, "get gene group result key(without name)");

    });
});
