import {
    filterCBioPortalWebServiceDataByUnflattenedOQLLine,
    OQLLineFilterOutput,
    MergedTrackLineFilterOutput,
    filterCBioPortalWebServiceData,
    parseOQLQuery,
    unparseOQLQueryLine,
    doesQueryContainMutationOQL, doesQueryContainOQL
} from './oqlfilter';
import {NumericGeneMolecularData, MolecularProfile, Mutation} from '../../api/generated/CBioPortalAPI';
import AccessorsForOqlFilter from './AccessorsForOqlFilter';
import * as _ from 'lodash';
import {assert} from 'chai';
import sinon from 'sinon';
import {
    AlterationTypeConstants, AnnotatedMutation,
    AnnotatedNumericGeneMolecularData
} from "../../../pages/resultsView/ResultsViewPageStore";

// This file uses type assertions to force functions that use overly specific
// Swagger-generated types as parameters to accept mocked literals believed to
// be sufficient
// tslint:disable no-object-literal-type-assertion

// I believe DETAILED projection to have enough details for the filter function
const THREE_GENE_TWO_SAMPLE_CNA_DATA = [
    {__id: 4, oncoKbOncogenic: "", "sampleId": "TCGA-02-0001-01", "entrezGeneId": 672, "value": 1, "molecularProfileId": "gbm_tcga_gistic", "uniqueSampleKey": "VENHQS0wMi0wMDAxLTAxOmdibV90Y2dh", "uniquePatientKey": "VENHQS0wMi0wMDAxOmdibV90Y2dh", "patientId": "TCGA-02-0001", "studyId": "gbm_tcga", "gene": {"entrezGeneId": 672, "hugoGeneSymbol": "BRCA1", "type": "protein-coding", "cytoband": "17q21.31", "length": 8922}},
    {__id: 5, oncoKbOncogenic: "", "sampleId": "TCGA-02-0001-01", "entrezGeneId": 5728, "value": 0, "molecularProfileId": "gbm_tcga_gistic", "uniqueSampleKey": "VENHQS0wMi0wMDAxLTAxOmdibV90Y2dh", "uniquePatientKey": "VENHQS0wMi0wMDAxOmdibV90Y2dh", "patientId": "TCGA-02-0001", "studyId": "gbm_tcga", "gene": {"entrezGeneId": 5728, "hugoGeneSymbol": "PTEN", "type": "protein-coding", "cytoband": "10q23.31", "length": 11581}},
    {__id: 6, oncoKbOncogenic: "", "sampleId": "TCGA-02-0001-01", "entrezGeneId": 7157, "value": -1, "molecularProfileId": "gbm_tcga_gistic", "uniqueSampleKey": "VENHQS0wMi0wMDAxLTAxOmdibV90Y2dh", "uniquePatientKey": "VENHQS0wMi0wMDAxOmdibV90Y2dh", "patientId": "TCGA-02-0001", "studyId": "gbm_tcga", "gene": {"entrezGeneId": 7157, "hugoGeneSymbol": "TP53", "type": "protein-coding", "cytoband": "17p13.1", "length": 4576}},
    {__id: 7, oncoKbOncogenic: "oncogenic", "sampleId": "TCGA-02-0003-01", "entrezGeneId": 672, "value": 0, "molecularProfileId": "gbm_tcga_gistic", "uniqueSampleKey": "VENHQS0wMi0wMDAzLTAxOmdibV90Y2dh", "uniquePatientKey": "VENHQS0wMi0wMDAzOmdibV90Y2dh", "patientId": "TCGA-02-0003", "studyId": "gbm_tcga", "gene": {"entrezGeneId": 672, "hugoGeneSymbol": "BRCA1", "type": "protein-coding", "cytoband": "17q21.31", "length": 8922}},
    {__id: 8, oncoKbOncogenic: "predicted Oncogenic", "sampleId": "TCGA-02-0003-01", "entrezGeneId": 5728, "value": -1, "molecularProfileId": "gbm_tcga_gistic", "uniqueSampleKey": "VENHQS0wMi0wMDAzLTAxOmdibV90Y2dh", "uniquePatientKey": "VENHQS0wMi0wMDAzOmdibV90Y2dh", "patientId": "TCGA-02-0003", "studyId": "gbm_tcga", "gene": {"entrezGeneId": 5728, "hugoGeneSymbol": "PTEN", "type": "protein-coding", "cytoband": "10q23.31", "length": 11581}},
    {__id: 9, oncoKbOncogenic: "Likely Oncogenic", "sampleId": "TCGA-02-0003-01", "entrezGeneId": 7157, "value": 0, "molecularProfileId": "gbm_tcga_gistic", "uniqueSampleKey": "VENHQS0wMi0wMDAzLTAxOmdibV90Y2dh", "uniquePatientKey": "VENHQS0wMi0wMDAzOmdibV90Y2dh", "patientId": "TCGA-02-0003", "studyId": "gbm_tcga", "gene": {"entrezGeneId": 7157, "hugoGeneSymbol": "TP53", "type": "protein-coding", "cytoband": "17p13.1", "length": 4576}}
] as any as AnnotatedNumericGeneMolecularData[];
// I believe these metadata to be all `new AccessorsForOqlFilter()` needs
const DATA_PROFILE = {
    "molecularAlterationType": "COPY_NUMBER_ALTERATION",
    "datatype": "DISCRETE",
    "molecularProfileId": "gbm_tcga_gistic",
    "studyId": "gbm_tcga",
} as MolecularProfile;

const MUTATION_PROFILE = {
    "molecularAlterationType": AlterationTypeConstants.MUTATION_EXTENDED,
    "molecularProfileId": "gbm_tcga_mutations",
    "studyId": "gbm_tcga",
} as MolecularProfile;

const MUTATION_DATA = [
{
        gene: {
            hugoGeneSymbol:"BRCA1",
        },
        molecularProfileId: "gbm_tcga_mutations",
        mutationType:"fusion",
        mutationStatus:undefined,
        putativeDriver: true,
        __id: -1
},{
    gene: {
        hugoGeneSymbol:"BRCA1",
    },
    molecularProfileId: "gbm_tcga_mutations",
    mutationType:"Missense_Variant",
    mutationStatus: "germline",
    putativeDriver: true,
    __id: 0
},{
    gene: {
        hugoGeneSymbol:"BRCA1",
    },
    molecularProfileId: "gbm_tcga_mutations",
    mutationType:"Missense_Variant",
    mutationStatus:"aspdoifjpasoid",
    putativeDriver: true,
    __id: 1
},{
    gene: {
        hugoGeneSymbol:"BRCA1",
    },
    molecularProfileId: "gbm_tcga_mutations",
    mutationType:"Missense_Variant",
    mutationStatus:null,
    putativeDriver: false,
    __id: 2
},{
    gene: {
        hugoGeneSymbol:"BRCA1",
    },
    molecularProfileId: "gbm_tcga_mutations",
    mutationType:"in_frame_ins",
    mutationStatus:undefined,
    putativeDriver: true,
    __id: 3
}] as any as AnnotatedMutation[];

describe("doesQueryContainOQL", ()=>{
    it("returns correct result in various cases", ()=>{
        assert.equal(doesQueryContainOQL("TP53 BRCA1 BRCA2"), false);
        assert.equal(doesQueryContainOQL("TP53"), false);
        assert.equal(doesQueryContainOQL("TP53 BRCA1 BRCA2;"), false);
        assert.equal(doesQueryContainOQL("TP53;"), false);
        assert.equal(doesQueryContainOQL("TP53 BRCA1 BRCA2:MUT"), true);
        assert.equal(doesQueryContainOQL("TP53 BRCA1 BRCA2:AMP"), true);
        assert.equal(doesQueryContainOQL("TP53 BRCA1 BRCA2:HOMDEL"), true);
        assert.equal(doesQueryContainOQL("TP53 BRCA1 BRCA2:EXP>0"), true);
        assert.equal(doesQueryContainOQL("TP53 BRCA1 BRCA2:FUSION"), true);
        assert.equal(doesQueryContainOQL("TP53 BRCA1 BRCA2:DRIVER"), true);
    });
});

describe("doesQueryContainMutationOQL", ()=>{
    it("returns correct result in various cases", ()=>{
        assert.equal(doesQueryContainMutationOQL("TP53: AMP"), false);
        assert.equal(doesQueryContainMutationOQL("TP53: EXP>0"), false);
        assert.equal(doesQueryContainMutationOQL("TP53;"), false);
        assert.equal(doesQueryContainMutationOQL("TP53 BRCA1 BRCA2;"), false);
        assert.equal(doesQueryContainMutationOQL("TP53: MUT"), false);
        assert.equal(doesQueryContainMutationOQL("TP53: GERMLINE"), true);
        assert.equal(doesQueryContainMutationOQL("TP53: proteinchange"), true);
        assert.equal(doesQueryContainMutationOQL("TP53: proteinchange_GERMLINE"), true);
        assert.equal(doesQueryContainMutationOQL("TP53: DRIVER"), true);
    });
});

describe("unparseOQLQueryLine", ()=>{
    it("unparses query with no alterations", ()=>{
        const parsedLine = parseOQLQuery("TP53;")[0];
        assert.equal(unparseOQLQueryLine(parsedLine), "TP53;");
    });
    it("unparses query with MUT keyword", ()=>{
        const parsedLine = parseOQLQuery("TP53: MUT;")[0];
        assert.equal(unparseOQLQueryLine(parsedLine), "TP53: MUT;");
    });
    it("unparses query with complex mutation specifications", ()=>{
        const parsedLine = parseOQLQuery("TP53: MISSENSE proteinchange;")[0];
        assert.equal(unparseOQLQueryLine(parsedLine), "TP53: MUT=MISSENSE MUT=proteinchange;");
    });
    it("unparses query with EXP and PROT", ()=>{
        const parsedLine = parseOQLQuery("TP53: EXP > 0 PROT < -2")[0];
        assert.equal(unparseOQLQueryLine(parsedLine), "TP53: EXP>0 PROT<-2;");
    });
    it("unparses query with many alteration types", ()=>{
        const parsedLine = parseOQLQuery("TP53: MISSENSE proteinchange HOMDEL EXP<-4 PROT>1 FUSION;")[0];
        assert.equal(unparseOQLQueryLine(parsedLine), "TP53: MUT=MISSENSE MUT=proteinchange HOMDEL EXP<-4 PROT>1 FUSION;");
    });
    it("unparses queries with germline and somatic mutation modifiers", ()=>{
        const parsedLine = parseOQLQuery("TP53: GERMLINE SOMATIC_MISSENSE proteinchange_GERMLINE;")[0];
        assert.equal(unparseOQLQueryLine(parsedLine), "TP53: MUT_GERMLINE MUT=MISSENSE_SOMATIC MUT=proteinchange_GERMLINE;");
    });
    it("unparses queries with driver modifier", ()=>{
        const parsedLine = parseOQLQuery("TP53: DRIVER CNA_DRIVER DRIVER_CNA FUSION_DRIVER DRIVER_FUSION TRUNC_DRIVER DRIVER_TRUNC AMP_DRIVER DRIVER_HOMDEL GERMLINE SOMATIC_MISSENSE proteinchange_GERMLINE;")[0];
        assert.equal(unparseOQLQueryLine(parsedLine), "TP53: DRIVER CNA_DRIVER CNA_DRIVER FUSION_DRIVER FUSION_DRIVER MUT=TRUNC_DRIVER MUT=TRUNC_DRIVER AMP_DRIVER HOMDEL_DRIVER MUT_GERMLINE MUT=MISSENSE_SOMATIC MUT=proteinchange_GERMLINE;");
    });
});

describe('filterCBioPortalWebServiceData', ()=>{
    it('filters properly using the GERMLINE and SOMATIC mutation modifiers', ()=>{
        const accessorsInstance = new AccessorsForOqlFilter([MUTATION_PROFILE]);
        let filteredData = filterCBioPortalWebServiceData(
            "BRCA1:GERMLINE",
            MUTATION_DATA,
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [0]);
        filteredData = filterCBioPortalWebServiceData(
            "BRCA1:SOMATIC",
            MUTATION_DATA,
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [1,2,3]);
        filteredData = filterCBioPortalWebServiceData(
            "BRCA1:MISSENSE_SOMATIC",
            MUTATION_DATA,
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [1,2]);
        filteredData = filterCBioPortalWebServiceData(
            "BRCA1:INFRAME_SOMATIC",
            MUTATION_DATA,
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [3]);
        filteredData = filterCBioPortalWebServiceData(
            "BRCA1:INFRAME_GERMLINE",
            MUTATION_DATA,
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), []);
        filteredData = filterCBioPortalWebServiceData(
            "BRCA1:MISSENSE_GERMLINE",
            MUTATION_DATA,
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [0]);
        filteredData = filterCBioPortalWebServiceData(
            "BRCA1:MISSENSE_GERMLINE INFRAME_SOMATIC",
            MUTATION_DATA,
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [0,3]);
    });
    it("filters properly using the DRIVER modifier", ()=>{
        const accessorsInstance = new AccessorsForOqlFilter([MUTATION_PROFILE, DATA_PROFILE]);
        let filteredData = filterCBioPortalWebServiceData(
            "BRCA1:DRIVER",
            [...MUTATION_DATA, ...THREE_GENE_TWO_SAMPLE_CNA_DATA] as any[],
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [-1, 0, 1, 3, 7]);

        filteredData = filterCBioPortalWebServiceData(
            "BRCA1:MISSENSE_DRIVER",
            [...MUTATION_DATA, ...THREE_GENE_TWO_SAMPLE_CNA_DATA] as any[],
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [0, 1]);

        filteredData = filterCBioPortalWebServiceData(
            "BRCA1:DRIVER_MISSENSE",
            [...MUTATION_DATA, ...THREE_GENE_TWO_SAMPLE_CNA_DATA] as any[],
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [0, 1]);

        filteredData = filterCBioPortalWebServiceData(
            "PTEN:DRIVER_HETLOSS",
            [...MUTATION_DATA, ...THREE_GENE_TWO_SAMPLE_CNA_DATA] as any[],
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [8]);

        filteredData = filterCBioPortalWebServiceData(
            "PTEN:CNA_DRIVER",
            [...MUTATION_DATA, ...THREE_GENE_TWO_SAMPLE_CNA_DATA] as any[],
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [8]);

        filteredData = filterCBioPortalWebServiceData(
            "BRCA1: DRIVER; PTEN:HETLOSS_DRIVER; TP53: DRIVER",
            [...MUTATION_DATA, ...THREE_GENE_TWO_SAMPLE_CNA_DATA] as any[],
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [-1, 0,1,3,7,8,9]);

        filteredData = filterCBioPortalWebServiceData(
            "BRCA1:FUSION_DRIVER",
            [...MUTATION_DATA, ...THREE_GENE_TWO_SAMPLE_CNA_DATA] as any[],
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [-1]);
        filteredData = filterCBioPortalWebServiceData(
            "BRCA1:DRIVER_FUSION",
            [...MUTATION_DATA, ...THREE_GENE_TWO_SAMPLE_CNA_DATA] as any[],
            accessorsInstance,
            ""
        );
        assert.deepEqual((filteredData as any).map((x:any)=>x.__id), [-1]);
    });
});

describe('filterCBioPortalWebServiceDataByUnflattenedOQLLine', () => {
    it('returns a single .data object for a single-gene query', () => {
        // given CNA data for 3 genes in 2 samples and an AccessorsForOqlFilter instance
        // aware of their profile
        const dataArray: NumericGeneMolecularData[] = THREE_GENE_TWO_SAMPLE_CNA_DATA;
        const accessorsInstance: AccessorsForOqlFilter = new AccessorsForOqlFilter([DATA_PROFILE]);
        // when calling the function with an OQL query asking data for 1 gene
        const filteredData = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
            'BRCA1',
            dataArray,
            accessorsInstance,
            ''
        );
        // then it returns a single data object with data for the 3 samples
        assert.lengthOf(filteredData, 1);
        assert.property(filteredData[0], 'data');
    });

    it('returns a .list with single .data object for a single-gene merged query', () => {
        // given CNA data for 3 genes in 2 samples and an AccessorsForOqlFilter instance
        // aware of their profile
        const dataArray: NumericGeneMolecularData[] = THREE_GENE_TWO_SAMPLE_CNA_DATA;
        const accessorsInstance: AccessorsForOqlFilter = new AccessorsForOqlFilter([DATA_PROFILE]);
        // when calling the function with an OQL query asking data for a
        // 1-gene list
        const filteredData = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
            '[BRCA1]',
            dataArray,
            accessorsInstance,
            ''
        );
        // then it returns a single list object containing a single data object
        assert.lengthOf(filteredData, 1);
        assert.property(filteredData[0], 'list');
        assert.lengthOf((filteredData[0] as MergedTrackLineFilterOutput<object>).list, 1);
        assert.property((filteredData[0] as MergedTrackLineFilterOutput<object>).list[0], 'data');
    });

    it('returns a .list with two .data objects for a two-gene merged query', () => {
        // given CNA data for 3 genes in 2 samples and an AccessorsForOqlFilter instance
        // aware of their profile
        const dataArray: NumericGeneMolecularData[] = THREE_GENE_TWO_SAMPLE_CNA_DATA;
        const accessorsInstance: AccessorsForOqlFilter = new AccessorsForOqlFilter([DATA_PROFILE]);
        // when calling the function with an OQL query asking data for a
        // 2-gene list
        const filteredData = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
            '[BRCA1 PTEN]',
            dataArray,
            accessorsInstance,
            ''
        );
        // then it returns a single list object containing 2 data objects
        assert.lengthOf(filteredData, 1);
        assert.property(filteredData[0], 'list');
        assert.lengthOf((filteredData[0] as MergedTrackLineFilterOutput<object>).list, 2);
        (filteredData[0] as MergedTrackLineFilterOutput<object>).list.forEach(
            subline => assert.property(subline, 'data')
        );
    });

    it('returns both a two-element .list and a .data if a merged-gene line precedes a single-gene one', () => {
        // given CNA data for 3 genes in 2 samples and an AccessorsForOqlFilter instance
        // aware of their profile
        const dataArray: NumericGeneMolecularData[] = THREE_GENE_TWO_SAMPLE_CNA_DATA;
        const accessorsInstance: AccessorsForOqlFilter = new AccessorsForOqlFilter([DATA_PROFILE]);
        // when calling the function with an OQL query asking data for 1 gene
        const filteredData = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
            '[BRCA1 PTEN] TP53',
            dataArray,
            accessorsInstance,
            ''
        );
        // then it returns both a two-element .list and a .data
        assert.lengthOf(filteredData, 2);
        assert.property(filteredData[0], 'list');
        assert.lengthOf((filteredData[0] as MergedTrackLineFilterOutput<object>).list, 2);
        assert.property(filteredData[1], 'data');
    });

    it('returns both a .data and a two-element .list if a single-gene line precedes a merged-gene one', () => {
        // given CNA data for 3 genes in 2 samples and an AccessorsForOqlFilter instance
        // aware of their profile
        const dataArray: NumericGeneMolecularData[] = THREE_GENE_TWO_SAMPLE_CNA_DATA;
        const accessorsInstance: AccessorsForOqlFilter = new AccessorsForOqlFilter([DATA_PROFILE]);
        // when calling the function with an OQL query asking data for 1 gene
        const filteredData = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
            'PTEN [BRCA1 TP53]',
            dataArray,
            accessorsInstance,
            ''
        );
        // then it returns both a .data and two-element .list
        assert.lengthOf(filteredData, 2);
        assert.property(filteredData[0], 'data');
        assert.property(filteredData[1], 'list');
        assert.lengthOf((filteredData[1] as MergedTrackLineFilterOutput<object>).list, 2);
    });

});
