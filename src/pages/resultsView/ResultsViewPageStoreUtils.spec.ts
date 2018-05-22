import {getSimplifiedMutationType} from "shared/lib/oql/accessors";
import {assert} from "chai";
import {
    Gene, NumericGeneMolecularData, GenePanelData, MolecularProfile, Mutation, Patient,
    Sample, CancerStudy
} from "../../shared/api/generated/CBioPortalAPI";
import {
    annotateMolecularDatum,
    annotateMutationPutativeDriver,
    computeCustomDriverAnnotationReport, computeGenePanelInformation, computePutativeDriverAnnotatedMutations,
    getOncoKbOncogenic,
    initializeCustomDriverAnnotationSettings,
    fetchQueriedStudies
} from "./ResultsViewPageStoreUtils";
import {observable} from "mobx";
import {IndicatorQueryResp} from "../../shared/api/generated/OncoKbAPI";
import {AnnotatedMutation} from "./ResultsViewPageStore";
import * as _ from 'lodash';
import sinon from 'sinon';
import sessionServiceClient from "shared/api//sessionServiceInstance";
import { VirtualStudy, VirtualStudyData } from "shared/model/VirtualStudy";
import client from "shared/api/cbioportalClientInstance";

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
            assert.deepEqual(computePutativeDriverAnnotatedMutations([], ()=>({}) as any, false), []);
        });
        it("annotates a single mutation", ()=>{
            assert.deepEqual(
                computePutativeDriverAnnotatedMutations(
                    [{mutationType:"missense"} as Mutation],
                    ()=>({oncoKb:"", hotspots:true, cbioportalCount:false, cosmicCount:true, customDriverBinary:false}),
                    true
                ) as Partial<AnnotatedMutation>[],
                [{
                    mutationType:"missense",
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
                    [{mutationType:"missense"} as Mutation, {mutationType:"in_frame_del"} as Mutation, {mutationType:"asdf"} as Mutation],
                    ()=>({oncoKb:"", hotspots:true, cbioportalCount:false, cosmicCount:true, customDriverBinary:false}),
                    true
                ) as Partial<AnnotatedMutation>[],
                [{
                    mutationType:"missense",
                    simplifiedMutationType: getSimplifiedMutationType("missense"),
                    isHotspot: true,
                    oncoKbOncogenic: "",
                    putativeDriver: true
                },{
                    mutationType:"in_frame_del",
                    simplifiedMutationType: getSimplifiedMutationType("in_frame_del"),
                    isHotspot: true,
                    oncoKbOncogenic: "",
                    putativeDriver: true
                },{
                    mutationType:"asdf",
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
                    [{mutationType:"missense"} as Mutation],
                    ()=>({oncoKb:"", hotspots:false, cbioportalCount:false, cosmicCount:false, customDriverBinary:false}),
                    true
                ),
                []
            );
        });
        it("excludes non-annotated mutations from a list of a few", ()=>{
            assert.deepEqual(
                computePutativeDriverAnnotatedMutations(
                    [{mutationType:"missense"} as Mutation, {mutationType:"in_frame_del"} as Mutation, {mutationType:"asdf"} as Mutation],
                    (m)=>(m.mutationType === "in_frame_del" ?
                        {oncoKb:"", hotspots:false, cbioportalCount:false, cosmicCount:false, customDriverBinary:true}:
                        {oncoKb:"", hotspots:false, cbioportalCount:false, cosmicCount:false, customDriverBinary:false}
                    ),
                    true
                ) as Partial<AnnotatedMutation>[],
                [{
                    mutationType:"in_frame_del",
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
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Likely Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"Likely Oncogenic"}
            );
        });
        it("annotates single element correctly in case of Predicted Oncogenic", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Predicted Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"Predicted Oncogenic"}
            );
        });
        it("annotates single element correctly in case of Oncogenic", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:"Oncogenic"}
            );
        });
        it("annotates single element correctly in case of Likely Neutral, Inconclusive, Unknown, asdfasd, undefined, empty", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Likely Neutral"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Inconclusive"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Unknown"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"asdfasdf"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:undefined} as any),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:""} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:""}
            );
        });
        it("annotates non-copy number data with empty string", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"MUTATION_EXTENDED"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"MRNA_EXPRESSION"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"PROTEIN_LEVEL"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:0, molecularProfileId:"profile"} as NumericGeneMolecularData,
                    (d:NumericGeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"FUSION"} as MolecularProfile}
                ),
                {value:0, molecularProfileId:"profile", oncoKbOncogenic:""}
            );
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

        let virtualStudies: { [id: string]: VirtualStudy } = {
            'virtual_study_1': $.extend({},virtualStudy,{"id": "virtual_study_1"}) as VirtualStudy,
            'virtual_study_2': $.extend({},virtualStudy,{"id": "virtual_study_2"}) as VirtualStudy
        };

        before(()=>{
            sinon.stub(sessionServiceClient, "getVirtualStudy").callsFake(function fakeFn(id:string) {
                return new Promise((resolve, reject) => {
                    let obj = virtualStudies[id]
                    if(_.isUndefined(obj)){
                        reject()
                    }
                    else{
                        resolve(obj);
                    }
                });
            });

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
            (sessionServiceClient.getVirtualStudy as sinon.SinonStub).restore();
            (client.fetchStudiesUsingPOST as sinon.SinonStub).restore();
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
        it("when virtual study query having private study or unknow virtual study id", (done)=>{
            fetchQueriedStudies({},['shared_study1']).catch((error)=>{
                done();
            });
        });
    });
});
