import {getSimplifiedMutationType} from "shared/lib/oql/accessors";
import {assert} from "chai";
import {
    Gene, GeneMolecularData, GenePanelData, MolecularProfile, Mutation, Patient,
    Sample
} from "../../shared/api/generated/CBioPortalAPI";
import {
    annotateMolecularDatum,
    annotateMutationPutativeDriver,
    computeCustomDriverAnnotationReport, computeGenePanelInformation, computePutativeDriverAnnotatedMutations,
    getOncoKbOncogenic,
    initializeCustomDriverAnnotationSettings
} from "./ResultsViewPageStoreUtils";
import {observable} from "mobx";
import {IndicatorQueryResp} from "../../shared/api/generated/OncoKbAPI";
import {AnnotatedMutation} from "./ResultsViewPageStore";

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
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:"Likely Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:"Likely Oncogenic"}
            );
        });
        it("annotates single element correctly in case of Predicted Oncogenic", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:"Predicted Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:"Predicted Oncogenic"}
            );
        });
        it("annotates single element correctly in case of Oncogenic", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:"Oncogenic"}
            );
        });
        it("annotates single element correctly in case of Likely Neutral, Inconclusive, Unknown, asdfasd, undefined, empty", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:"Likely Neutral"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:"Inconclusive"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:"Unknown"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:"asdfasdf"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:undefined} as any),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:""} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"COPY_NUMBER_ALTERATION"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:""}
            );
        });
        it("annotates non-copy number data with empty string", ()=>{
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"MUTATION_EXTENDED"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"MRNA_EXPRESSION"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"PROTEIN_LEVEL"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:""}
            );
            assert.deepEqual(
                annotateMolecularDatum(
                    {value:"0", molecularProfileId:"profile"} as GeneMolecularData,
                    (d:GeneMolecularData)=>({oncogenic:"Oncogenic"} as IndicatorQueryResp),
                    {"profile":{molecularAlterationType:"FUSION"} as MolecularProfile}
                ),
                {value:"0", molecularProfileId:"profile", oncoKbOncogenic:""}
            );
        });
    });

    describe("computeGenePanelInformation", ()=>{
        const genes:Gene[] = [];
        const samples:Sample[] = [];
        const patients:Patient[] = [];
        let genePanelDatum1:any, genePanelDatum2:any, genePanelDatum3:any, genePanelDatum4:any, wxsDatum1:any, wxsDatum2:any, wxsDatum3:any, nsDatum1:any, nsDatum2:any;
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
                entrezGeneId: 0,
                uniqueSampleKey: "PATIENT1 SAMPLE1",
                uniquePatientKey: "PATIENT1",
                sequenced: true,
                genePanelId: "GENEPANEL1"
            };

            genePanelDatum2 = {
                entrezGeneId: 1,
                uniqueSampleKey: "PATIENT1 SAMPLE1",
                uniquePatientKey: "PATIENT1",
                sequenced: true,
                genePanelId: "GENEPANEL2"
            };

            genePanelDatum3 = {
                entrezGeneId: 0,
                uniqueSampleKey: "PATIENT2 SAMPLE1",
                uniquePatientKey: "PATIENT2",
                sequenced: true,
                genePanelId: "GENEPANEL2"
            };

            genePanelDatum4 = {
                entrezGeneId: 1,
                uniqueSampleKey: "PATIENT2 SAMPLE1",
                uniquePatientKey: "PATIENT2",
                sequenced: true,
                genePanelId: "GENEPANEL2"
            };

            wxsDatum1 = {
                entrezGeneId: 0,
                uniqueSampleKey:"PATIENT1 SAMPLE2",
                uniquePatientKey: "PATIENT1",
                sequenced: true,
                wholeExomeSequenced: true
            };

            wxsDatum2 = {
                entrezGeneId: 1,
                uniqueSampleKey:"PATIENT1 SAMPLE2",
                uniquePatientKey: "PATIENT1",
                sequenced: true,
                wholeExomeSequenced: true
            };

            wxsDatum3 = {
                entrezGeneId: 2,
                uniqueSampleKey: "PATIENT1 SAMPLE2",
                uniquePatientKey: "PATIENT1",
                sequenced: true,
                wholeExomeSequenced: true
            };

            nsDatum1 = {
                entrezGeneId: 2,
                uniqueSampleKey: "PATIENT1 SAMPLE1",
                uniquePatientKey: "PATIENT1",
                sequenced: false
            };

            nsDatum2 = {
                entrezGeneId: 2,
                uniqueSampleKey: "PATIENT2 SAMPLE1",
                uniquePatientKey: "PATIENT2",
                sequenced: false
            };
        });
        it("computes the correct object with no input data", ()=>{
            assert.deepEqual(
                computeGenePanelInformation([], samples, patients, genes),
                {
                    samples: {
                        "PATIENT1 SAMPLE1": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        },
                        "PATIENT1 SAMPLE2": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        },
                        "PATIENT2 SAMPLE1": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        }
                    },
                    patients: {
                        "PATIENT1": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        },
                        "PATIENT2": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        }
                    }
                }
            );
        });
        it("computes the correct object with gene panel data", ()=>{
            assert.deepEqual(
                computeGenePanelInformation([
                    genePanelDatum1, genePanelDatum2, genePanelDatum3, genePanelDatum4
                ] as GenePanelData[], samples, patients, genes),
                {
                    samples: {
                        "PATIENT1 SAMPLE1": {
                            sequencedGenes:{"GENE1":[genePanelDatum1], "GENE2":[genePanelDatum2]},
                            wholeExomeSequenced:false
                        },
                        "PATIENT1 SAMPLE2": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        },
                        "PATIENT2 SAMPLE1": {
                            sequencedGenes:{"GENE1":[genePanelDatum3], "GENE2":[genePanelDatum4]},
                            wholeExomeSequenced:false
                        }
                    },
                    patients: {
                        "PATIENT1": {
                            sequencedGenes:{"GENE1":[genePanelDatum1], "GENE2":[genePanelDatum2]},
                            wholeExomeSequenced:false
                        },
                        "PATIENT2": {
                            sequencedGenes:{"GENE1":[genePanelDatum3], "GENE2":[genePanelDatum4]},
                            wholeExomeSequenced:false
                        }
                    }
                }
            );
        });
        it("computes the correct object with whole exome sequenced data", ()=>{
            assert.deepEqual(
                computeGenePanelInformation([
                    wxsDatum1, wxsDatum2, wxsDatum3
                ] as GenePanelData[], samples, patients, genes),
                {
                    samples: {
                        "PATIENT1 SAMPLE1": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        },
                        "PATIENT1 SAMPLE2": {
                            sequencedGenes:{},
                            wholeExomeSequenced:true
                        },
                        "PATIENT2 SAMPLE1": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        }
                    },
                    patients: {
                        "PATIENT1": {
                            sequencedGenes:{},
                            wholeExomeSequenced:true
                        },
                        "PATIENT2": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        }
                    }
                }
            );
        });
        it("computes the correct object with not sequenced data", ()=>{
            assert.deepEqual(
                computeGenePanelInformation([
                    nsDatum1, nsDatum2
                ] as GenePanelData[], samples, patients, genes),
                {
                    samples: {
                        "PATIENT1 SAMPLE1": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        },
                        "PATIENT1 SAMPLE2": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        },
                        "PATIENT2 SAMPLE1": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        }
                    },
                    patients: {
                        "PATIENT1": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        },
                        "PATIENT2": {
                            sequencedGenes:{},
                            wholeExomeSequenced:false
                        }
                    }
                }
            );
        });
        it("computes the correct object with gene panel data and whole exome sequenced data and not sequenced data", ()=>{
            assert.deepEqual(
                computeGenePanelInformation([
                    genePanelDatum1, genePanelDatum2, genePanelDatum3, genePanelDatum4,
                    wxsDatum1, wxsDatum2,
                    nsDatum1, nsDatum2
                ] as GenePanelData[], samples, patients, genes),
                {
                    samples: {
                        "PATIENT1 SAMPLE1": {
                            sequencedGenes:{"GENE1":[genePanelDatum1], "GENE2":[genePanelDatum2]},
                            wholeExomeSequenced:false
                        },
                        "PATIENT1 SAMPLE2": {
                            sequencedGenes:{},
                            wholeExomeSequenced:true
                        },
                        "PATIENT2 SAMPLE1": {
                            sequencedGenes:{"GENE1":[genePanelDatum3], "GENE2":[genePanelDatum4]},
                            wholeExomeSequenced:false
                        }
                    },
                    patients: {
                        "PATIENT1": {
                            sequencedGenes:{"GENE1":[genePanelDatum1], "GENE2":[genePanelDatum2]},
                            wholeExomeSequenced:true
                        },
                        "PATIENT2": {
                            sequencedGenes:{"GENE1":[genePanelDatum3], "GENE2":[genePanelDatum4]},
                            wholeExomeSequenced:false
                        }
                    }
                }
            );
        });
    });
});