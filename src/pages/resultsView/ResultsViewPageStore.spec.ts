import {assert} from 'chai';
import { buildDefaultOQLProfile, extendSamplesWithCancerType, ResultsViewPageStore } from './ResultsViewPageStore';
import {CancerStudy, ClinicalData, Sample} from "../../shared/api/generated/CBioPortalAPI";
import client from '../../shared/api/cbioportalClientInstance';
import sinon from 'sinon';

describe('buildDefaultOQLProfile', () => {

    it('produces correct default queryies based on alteration profiles and zscore/rppa', () => {
        assert.equal(buildDefaultOQLProfile(['COPY_NUMBER_ALTERATION'], 2, 2), 'AMP HOMDEL');
        assert.equal(buildDefaultOQLProfile(['MUTATION_EXTENDED'], 2, 2), 'MUT FUSION');
        assert.equal(buildDefaultOQLProfile(['MUTATION_EXTENDED', 'COPY_NUMBER_ALTERATION'], 2, 2), 'MUT FUSION AMP HOMDEL');
        assert.equal(buildDefaultOQLProfile(['MUTATION_EXTENDED', 'MRNA_EXPRESSION'], 2, 2), 'MUT FUSION EXP>=2 EXP<=-2');
        assert.equal(buildDefaultOQLProfile(['MUTATION_EXTENDED', 'PROTEIN_LEVEL'], 2, 2), 'MUT FUSION PROT>=2 PROT<=-2');
    });

});
describe('extendSamplesWithCancerType', () => {

    var arg2 = [{
        "name": "NCI-60 Cell Lines (NCI, Cancer Res. 2012)",
        "shortName": "NCI-60",
        "description": "NCI-60 cell line project; raw data at <A HREF=\"http://discover.nci.nih.gov/cellminer/loadDownload.do\">CellMiner</A>.",
        "publicStudy": true,
        "pmid": "22802077",
        "citation": "Reinhold et al., Cancer Res. 2012",
        "groups": "PUBLIC",
        "status": 0,
        "allSampleCount": 60,
        "sequencedSampleCount": 60,
        "cnaSampleCount": 60,
        "mrnaRnaSeqSampleCount": 0,
        "mrnaRnaSeqV2SampleCount": 0,
        "mrnaMicroarraySampleCount": 60,
        "miRnaSampleCount": 0,
        "methylationHm27SampleCount": 0,
        "rppaSampleCount": 0,
        "completeSampleCount": 0,
        "studyId": "cellline_nci60",
        "cancerTypeId": "mixed",
        "cancerType": {
            "name": "Mixed Cancer Types",
            "clinicalTrialKeywords": "mixed cancer types",
            "dedicatedColor": "Black",
            "shortName": "MIXED",
            "parent": "cup",
            "cancerTypeId": "mixed"
        }
    }] as CancerStudy[];

    var arg0: Sample[];
    beforeEach(()=>{
        arg0 = [{
            "uniqueSampleKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "uniquePatientKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "sampleType": "Primary Solid Tumor",
            "sampleId": "BT_549",
            "patientId": "BT_549",
            "cancerTypeId": "mixed",
            "studyId": "cellline_nci60"
        }] as Sample[];
    });



    it('when both CANCER_TYPE and CANCER_TYPE_DETAILED are present, should populated appropriately', () => {

        var arg1 = [{
            "uniqueSampleKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "uniquePatientKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "sampleId": "BT_549",
            "patientId": "BT_549",
            "studyId": "cellline_nci60",
            "clinicalAttributeId": "CANCER_TYPE",
            "value": "Breast Sarcoma"
        }, {
            "uniqueSampleKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "uniquePatientKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "sampleId": "BT_549",
            "patientId": "BT_549",
            "studyId": "cellline_nci60",
            "clinicalAttributeId": "CANCER_TYPE_DETAILED",
            "value": "Breast"
        }] as ClinicalData[];

        const ret = extendSamplesWithCancerType(arg0, arg1, arg2);

        const expectedResult = [{
            "uniqueSampleKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "uniquePatientKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "sampleType": "Primary Solid Tumor",
            "sampleId": "BT_549",
            "patientId": "BT_549",
            "cancerTypeId": "mixed",
            "studyId": "cellline_nci60",
            "cancerType": "Breast Sarcoma",
            "cancerTypeDetailed": "Breast"
        }];

        assert.deepEqual(ret, expectedResult);

    });

    it('when only CANCER_TYPE_DETAILED are present, cancerType should fall back to that of study', () => {

        var arg1 = [{
            "uniqueSampleKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "uniquePatientKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "sampleId": "BT_549",
            "patientId": "BT_549",
            "studyId": "cellline_nci60",
            "clinicalAttributeId": "CANCER_TYPE_DETAILED",
            "value": "Breast"
        }] as ClinicalData[];

        const ret = extendSamplesWithCancerType(arg0, arg1, arg2);

        const expectedResult = [{
            "uniqueSampleKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "uniquePatientKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "sampleType": "Primary Solid Tumor",
            "sampleId": "BT_549",
            "patientId": "BT_549",
            "cancerTypeId": "mixed",
            "studyId": "cellline_nci60",
            "cancerType": "Mixed Cancer Types",
            "cancerTypeDetailed": "Breast"
        }];

        assert.deepEqual(ret[0], expectedResult[0]);

    });

    it('when CANCER_TYPE_DETAILED missing, cancerTypeDetailed should be CANCER_TYPE', () => {

        var arg1 = [{
            "uniqueSampleKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "uniquePatientKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "sampleId": "BT_549",
            "patientId": "BT_549",
            "studyId": "cellline_nci60",
            "clinicalAttributeId": "CANCER_TYPE",
            "value": "Breast"
        }] as ClinicalData[];

        const ret = extendSamplesWithCancerType(arg0, arg1, arg2);

        const expectedResult = [{
            "uniqueSampleKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "uniquePatientKey": "QlRfNTQ5OmNlbGxsaW5lX25jaTYw",
            "sampleType": "Primary Solid Tumor",
            "sampleId": "BT_549",
            "patientId": "BT_549",
            "cancerTypeId": "mixed",
            "studyId": "cellline_nci60",
            "cancerType": "Breast",
            "cancerTypeDetailed": "Breast"
        }];

        assert.deepEqual(ret[0], expectedResult[0]);

    });

});

describe('fusionByGene', () => {
    let dummyFusions = {
        result : [
            {
                "uniqueSampleKey": "VENHQS1BMi1BMDRQLTAxOnN0dWR5X2VzXzA",
                "uniquePatientKey": "VENHQS1BMi1BMDRQOnN0dWR5X2VzXzA",
                "molecularProfileId": "study_es_0_structural_variants",
                "structuralVariantId": 51,
                "sampleIdInternal": 13054,
                "sampleId": "TCGA-A2-A04P-01",
                "patientId": "TCGA-A2-A04P",
                "studyId": "study_es_0",
                "site1EntrezGeneId": 238,
                "site1HugoSymbol": "ALK",
                "site1EnsemblTranscriptId": "ENST00000389048",
                "site1Exon": 11,
                "site1Chromosome": "2",
                "site1Position": 29497964,
                "site1Description": "ALK-PTPN3.A11P3_1",
                "site2EntrezGeneId": 5774,
                "site2HugoSymbol": "PTPN3",
                "site2EnsemblTranscriptId": "ENST00000374541",
                "site2Exon": 3,
                "site2Chromosome": "9",
                "site2Position": 112219680,
                "site2Description": "ALK-PTPN3.A11P3_2",
                "site2EffectOnFrame": "NA",
                "ncbiBuild": "GRCh37",
                "dnaSupport": "no",
                "rnaSupport": "yes",
                "normalReadCount": -1,
                "tumorReadCount": 1005,
                "normalVariantCount": -1,
                "tumorVariantCount": 400,
                "normalPairedEndReadCount": -1,
                "tumorPairedEndReadCount": -1,
                "normalSplitReadCount": -1,
                "tumorSplitReadCount": -1,
                "annotation": "ALK-PTPN3.A11P3",
                "breakpointType": "NA",
                "center": "NA",
                "connectionType": "NA",
                "eventInfo": "Fusion",
                "variantClass": "NA",
                "length": -1,
                "comments": "NA",
                "externalAnnotation": "NA",
                "driverFilter": "NA",
                "driverFilterAnn": "NA",
                "driverTiersFilter": "NA",
                "driverTiersFilterAnn": "NA"
            },
            {
                "uniqueSampleKey": "VENHQS1BMi1BMDRQLTAxOnN0dWR5X2VzXzA",
                "uniquePatientKey": "VENHQS1BMi1BMDRQOnN0dWR5X2VzXzA",
                "molecularProfileId": "study_es_0_structural_variants",
                "structuralVariantId": 48,
                "sampleIdInternal": 13054,
                "sampleId": "TCGA-A2-A04P-01",
                "patientId": "TCGA-A2-A04P",
                "studyId": "study_es_0",
                "site1EntrezGeneId": 27436,
                "site1HugoSymbol": "EML4",
                "site1EnsemblTranscriptId": "ENST00000318522",
                "site1Exon": 6,
                "site1Chromosome": "2",
                "site1Position": 42492092,
                "site1Description": "EML4-ALK.E6bA20.AB374362_1",
                "site2EntrezGeneId": 238,
                "site2HugoSymbol": "ALK",
                "site2EnsemblTranscriptId": "ENST00000389048",
                "site2Exon": 20,
                "site2Chromosome": "2",
                "site2Position": 29446394,
                "site2Description": "EML4-ALK.E6bA20.AB374362_2",
                "site2EffectOnFrame": "NA",
                "ncbiBuild": "GRCh37",
                "dnaSupport": "no",
                "rnaSupport": "yes",
                "normalReadCount": -1,
                "tumorReadCount": 1002,
                "normalVariantCount": -1,
                "tumorVariantCount": 700,
                "normalPairedEndReadCount": -1,
                "tumorPairedEndReadCount": -1,
                "normalSplitReadCount": -1,
                "tumorSplitReadCount": -1,
                "annotation": "EML4-ALK.E6bA20.AB374362",
                "breakpointType": "NA",
                "center": "NA",
                "connectionType": "NA",
                "eventInfo": "Fusion",
                "variantClass": "NA",
                "length": -1,
                "comments": "Gain-of-Function",
                "externalAnnotation": "GENBANK:AB374362",
                "driverFilter": "NA",
                "driverFilterAnn": "NA",
                "driverTiersFilter": "NA",
                "driverTiersFilterAnn": "NA"
            }
        ]
    };
    let dummyGenes = {
        result : [
            {
                "entrezGeneId": 238,
                "hugoGeneSymbol": "ALK",
                "type": "protein-coding",
                "cytoband": "2p23",
                "length": 6932,
                "chromosome": "2"
            }
        ]
    };
    let store:ResultsViewPageStore;

    before(() => {
        store = new ResultsViewPageStore();
        sinon.stub(store, 'fusions').callsFake(function fakeFn() {
            return dummyFusions;
        });
        sinon.stub(store, 'genes').callsFake(function fakeFn() {
            return dummyGenes;
        });
    });

    it('should grouped fusions by queried gene');

});
