import {assert} from 'chai';
import {shallow, mount} from "enzyme";
import * as React from "react";
import * as _ from 'lodash';
import {countAlterationOccurences} from "./alterationCountHelpers";

describe('alterationCountHelpers', () => {

    describe('#countAlterationOccurences', () => {

        let groupedSamples:any, alterationsBySampleId:any;

        beforeEach(()=>{

            groupedSamples = {
                "Hepatobiliary Cancer": [{
                    "uniqueSampleKey": "QjA4NTpjaG9sX251c18yMDEy",
                    "uniquePatientKey": "QjA4NTpjaG9sX251c18yMDEy",
                    "sampleType": "Primary Solid Tumor",
                    "sampleId": "B085",
                    "patientId": "B085",
                    "cancerTypeId": "chol",
                    "studyId": "chol_nus_2012",
                    "cancerType": "Hepatobiliary Cancer",
                    "cancerTypeDetailed": "Cholangiocarcinoma"
                }, {
                    "uniqueSampleKey": "QjA5OTpjaG9sX251c18yMDEy",
                    "uniquePatientKey": "QjA5OTpjaG9sX251c18yMDEy",
                    "sampleType": "Primary Solid Tumor",
                    "sampleId": "B099",
                    "patientId": "B099",
                    "cancerTypeId": "chol",
                    "studyId": "chol_nus_2012",
                    "cancerType": "Hepatobiliary Cancer",
                    "cancerTypeDetailed": "Cholangiocarcinoma"
                }, {
                    "uniqueSampleKey": "UjEwNDpjaG9sX251c18yMDEy",
                    "uniquePatientKey": "UjEwNDpjaG9sX251c18yMDEy",
                    "sampleType": "Primary Solid Tumor",
                    "sampleId": "R104",
                    "patientId": "R104",
                    "cancerTypeId": "chol",
                    "studyId": "chol_nus_2012",
                    "cancerType": "Hepatobiliary Cancer",
                    "cancerTypeDetailed": "Cholangiocarcinoma"
                }, {
                    "uniqueSampleKey": "VDAyNjpjaG9sX251c18yMDEy",
                    "uniquePatientKey": "VDAyNjpjaG9sX251c18yMDEy",
                    "sampleType": "Primary Solid Tumor",
                    "sampleId": "T026",
                    "patientId": "T026",
                    "cancerTypeId": "chol",
                    "studyId": "chol_nus_2012",
                    "cancerType": "Hepatobiliary Cancer",
                    "cancerTypeDetailed": "Cholangiocarcinoma"
                }, {
                    "uniqueSampleKey": "VTA0NDpjaG9sX251c18yMDEy",
                    "uniquePatientKey": "VTA0NDpjaG9sX251c18yMDEy",
                    "sampleType": "Primary Solid Tumor",
                    "sampleId": "U044",
                    "patientId": "U044",
                    "cancerTypeId": "chol",
                    "studyId": "chol_nus_2012",
                    "cancerType": "Hepatobiliary Cancer",
                    "cancerTypeDetailed": "Cholangiocarcinoma"
                }, {
                    "uniqueSampleKey": "VzAxMjpjaG9sX251c18yMDEy",
                    "uniquePatientKey": "VzAxMjpjaG9sX251c18yMDEy",
                    "sampleType": "Primary Solid Tumor",
                    "sampleId": "W012",
                    "patientId": "W012",
                    "cancerTypeId": "chol",
                    "studyId": "chol_nus_2012",
                    "cancerType": "Hepatobiliary Cancer",
                    "cancerTypeDetailed": "Cholangiocarcinoma"
                }, {
                    "uniqueSampleKey": "VzAzOTpjaG9sX251c18yMDEy",
                    "uniquePatientKey": "VzAzOTpjaG9sX251c18yMDEy",
                    "sampleType": "Primary Solid Tumor",
                    "sampleId": "W039",
                    "patientId": "W039",
                    "cancerTypeId": "chol",
                    "studyId": "chol_nus_2012",
                    "cancerType": "Hepatobiliary Cancer",
                    "cancerTypeDetailed": "Cholangiocarcinoma"
                }, {
                    "uniqueSampleKey": "VzA0MDpjaG9sX251c18yMDEy",
                    "uniquePatientKey": "VzA0MDpjaG9sX251c18yMDEy",
                    "sampleType": "Primary Solid Tumor",
                    "sampleId": "W040",
                    "patientId": "W040",
                    "cancerTypeId": "chol",
                    "studyId": "chol_nus_2012",
                    "cancerType": "Hepatobiliary Cancer",
                    "cancerTypeDetailed": "Cholangiocarcinoma"
                }]
            };

            alterationsBySampleId = {
                "UjEwNDpjaG9sX251c18yMDEy": [{
                    "uniqueSampleKey": "UjEwNDpjaG9sX251c18yMDEy",
                    "uniquePatientKey": "UjEwNDpjaG9sX251c18yMDEy",
                    "molecularProfileId": "chol_nus_2012_mutations",
                    "sampleId": "R104",
                    "patientId": "R104",
                    "entrezGeneId": 3845,
                    "gene": {
                        "entrezGeneId": 3845,
                        "hugoGeneSymbol": "KRAS",
                        "type": "protein-coding",
                        "cytoband": "12p12.1",
                        "length": 47305,
                        "chromosome": "12"
                    },
                    "studyId": "chol_nus_2012",
                    "center": "NUS",
                    "mutationStatus": "NA",
                    "validationStatus": "NA",
                    "tumorAltCount": -1,
                    "tumorRefCount": -1,
                    "normalAltCount": -1,
                    "normalRefCount": -1,
                    "startPosition": 25398281,
                    "endPosition": 25398281,
                    "referenceAllele": "C",
                    "proteinChange": "G13D",
                    "mutationType": "Missense_Mutation",
                    "functionalImpactScore": "M",
                    "fisValue": 3.375,
                    "linkXvar": "getma.org/?cm=var&var=hg19,12,25398281,C,T&fts=all",
                    "linkPdb": "getma.org/pdb.php?prot=RASK_HUMAN&from=5&to=165&var=G13D",
                    "linkMsa": "getma.org/?cm=msa&ty=f&p=RASK_HUMAN&rb=5&re=165&var=G13D",
                    "ncbiBuild": "GRCh37",
                    "variantType": "SNP",
                    "keyword": "KRAS G13 missense",
                    "driverFilter": "",
                    "driverFilterAnnotation": "",
                    "driverTiersFilter": "",
                    "driverTiersFilterAnnotation": "",
                    "sequenced": true,
                    "wildType": false,
                    "variantAllele": "T",
                    "refseqMrnaId": "NM_033360.2",
                    "proteinPosStart": 13,
                    "proteinPosEnd": 13,
                    "molecularProfileAlterationType": "MUTATION_EXTENDED",
                    "alterationSubType": "missense",
                    "alterationType": "MUTATION_EXTENDED"
                }],
                "QjA4NTpjaG9sX251c18yMDEy": [{
                    "uniqueSampleKey": "QjA4NTpjaG9sX251c18yMDEy",
                    "uniquePatientKey": "QjA4NTpjaG9sX251c18yMDEy",
                    "molecularProfileId": "chol_nus_2012_mutations",
                    "sampleId": "B085",
                    "patientId": "B085",
                    "entrezGeneId": 3845,
                    "gene": {
                        "entrezGeneId": 3845,
                        "hugoGeneSymbol": "KRAS",
                        "type": "protein-coding",
                        "cytoband": "12p12.1",
                        "length": 47305,
                        "chromosome": "12"
                    },
                    "studyId": "chol_nus_2012",
                    "center": "NUS",
                    "mutationStatus": "NA",
                    "validationStatus": "NA",
                    "tumorAltCount": -1,
                    "tumorRefCount": -1,
                    "normalAltCount": -1,
                    "normalRefCount": -1,
                    "startPosition": 25398284,
                    "endPosition": 25398284,
                    "referenceAllele": "G",
                    "proteinChange": "MUTATED",
                    "mutationType": "Missense_Mutation",
                    "functionalImpactScore": "NA",
                    "fisValue": 1.4013e-45,
                    "linkXvar": "NA",
                    "linkPdb": "NA",
                    "linkMsa": "NA",
                    "ncbiBuild": "37",
                    "variantType": "SNP",
                    "driverFilter": "",
                    "driverFilterAnnotation": "",
                    "driverTiersFilter": "",
                    "driverTiersFilterAnnotation": "",
                    "sequenced": true,
                    "wildType": false,
                    "variantAllele": "C",
                    "refseqMrnaId": "NA",
                    "proteinPosStart": -1,
                    "proteinPosEnd": -1,
                    "molecularProfileAlterationType": "MUTATION_EXTENDED",
                    "alterationSubType": "missense",
                    "alterationType": "MUTATION_EXTENDED"
                },
                ]
            };

        });

        it('count total samples and alteration totals', () => {

            const ret = countAlterationOccurences(groupedSamples, alterationsBySampleId);

            const expectedResult = {
                "Hepatobiliary Cancer": {
                    "sampleTotal": 8,
                    "alterationTotal": 2,
                    "alterationTypeCounts": {
                        "mutated": 2,
                        "amp": 0,
                        "homdel": 0,
                        "hetloss": 0,
                        "gain": 0,
                        "fusion": 0,
                        "mrnaExpressionUp": 0,
                        "mrnaExpressionDown": 0,
                        "protExpressionUp": 0,
                        "protExpressionDown": 0,
                        "multiple": 0
                    },
                    "alteredSampleCount": 2,
                    "parentCancerType": "Hepatobiliary Cancer"
                }
            };

            assert.deepEqual(ret, expectedResult);

        });

        it('counts an added fusion alteration and CNA alterations, according to CNA sub types', () => {

            alterationsBySampleId["VTA0NDpjaG9sX251c18yMDEy"] = [
                {
                    "uniqueSampleKey": "VTA0NDpjaG9sX251c18yMDEy",
                    "molecularProfileAlterationType": "MUTATION_EXTENDED",
                    "alterationSubType": "missense",
                    "alterationType": "FUSION"
                },
            ];

            alterationsBySampleId["VzAxMjpjaG9sX251c18yMDEy"] = [
                {
                    "uniqueSampleKey": "VzAxMjpjaG9sX251c18yMDEy",
                    "alterationSubType": "amp",
                    "alterationType": "COPY_NUMBER_ALTERATION"
                }
            ];

            alterationsBySampleId["VzA0MDpjaG9sX251c18yMDEy"] = [
                {
                    "uniqueSampleKey": "VzA0MDpjaG9sX251c18yMDEy",
                    "alterationSubType": "homdel",
                    "alterationType": "COPY_NUMBER_ALTERATION"
                }
            ];

            const ret = countAlterationOccurences(groupedSamples, alterationsBySampleId);

            const expectedResult = {
                "Hepatobiliary Cancer": {
                    "sampleTotal": 8,
                    "alterationTotal": 5,
                    "alterationTypeCounts": {
                        "mutated": 2,
                        "amp": 1,
                        "homdel": 1,
                        "hetloss": 0,
                        "gain": 0,
                        "fusion": 1,
                        "mrnaExpressionUp": 0,
                        "mrnaExpressionDown": 0,
                        "protExpressionUp": 0,
                        "protExpressionDown": 0,
                        "multiple": 0
                    },
                    "alteredSampleCount": 5,
                    "parentCancerType": "Hepatobiliary Cancer"
                }
            };

            assert.deepEqual(ret, expectedResult);

        });

        it('samples with multiple mutations are only counted as "multiple"; alteration total reflects ALL alterations; does not double count multiple alterations to same sample in alteredSampleCount', () => {

            alterationsBySampleId["VTA0NDpjaG9sX251c18yMDEy"] = [{
                "uniqueSampleKey": "VTA0NDpjaG9sX251c18yMDEy",
                "alterationType": "FUSION"
            },
            {
                "uniqueSampleKey": "VTA0NDpjaG9sX251c18yMDEy",
                "alterationType": "MUTATION_EXTENDED"
            }
            ];

            const ret = countAlterationOccurences(groupedSamples, alterationsBySampleId);

            const expectedResult = {
                "Hepatobiliary Cancer": {
                    "sampleTotal": 8,
                    "alterationTotal": 4,
                    "alterationTypeCounts": {
                        "mutated": 2,
                        "amp": 0,
                        "homdel": 0,
                        "hetloss": 0,
                        "gain": 0,
                        "fusion": 0,
                        "mrnaExpressionUp": 0,
                        "mrnaExpressionDown": 0,
                        "protExpressionUp": 0,
                        "protExpressionDown": 0,
                        "multiple": 1
                    },
                    "alteredSampleCount": 3,
                    "parentCancerType": "Hepatobiliary Cancer"
                }
            };

            assert.deepEqual(ret, expectedResult);

        });

        it('uses alterationSubType to evaluate MRNA direction', () => {

            alterationsBySampleId["VTA0NDpjaG9sX251c18yMDEy"] = [
                {
                    "uniqueSampleKey": "VTA0NDpjaG9sX251c18yMDEy",
                    "molecularProfileAlterationType": "MUTATION_EXTENDED",
                    "alterationSubType": "down",
                    "alterationType": "MRNA_EXPRESSION"
                },
            ];

            alterationsBySampleId["VzAxMjpjaG9sX251c18yMDEy"] = [
                {
                    "uniqueSampleKey": "VzAxMjpjaG9sX251c18yMDEy",
                    "alterationSubType": "up",
                    "alterationType": "MRNA_EXPRESSION"
                }
            ];

            const ret = countAlterationOccurences(groupedSamples, alterationsBySampleId);

            assert.equal(ret["Hepatobiliary Cancer"].alterationTypeCounts.mrnaExpressionDown, 1);
            assert.equal(ret["Hepatobiliary Cancer"].alterationTypeCounts.mrnaExpressionUp, 1);

        });

        it('uses alterationSubType to evaluate PROT direction', () => {

            alterationsBySampleId["VTA0NDpjaG9sX251c18yMDEy"] = [
                {
                    "uniqueSampleKey": "VTA0NDpjaG9sX251c18yMDEy",
                    "molecularProfileAlterationType": "MUTATION_EXTENDED",
                    "alterationSubType": "down",
                    "alterationType": "PROTEIN_LEVEL"
                },
            ];

            alterationsBySampleId["VzAxMjpjaG9sX251c18yMDEy"] = [
                {
                    "uniqueSampleKey": "VzAxMjpjaG9sX251c18yMDEy",
                    "alterationSubType": "up",
                    "alterationType": "PROTEIN_LEVEL"
                }
            ];

            const ret = countAlterationOccurences(groupedSamples, alterationsBySampleId);

            assert.equal(ret["Hepatobiliary Cancer"].alterationTypeCounts.protExpressionDown, 1);
            assert.equal(ret["Hepatobiliary Cancer"].alterationTypeCounts.protExpressionUp, 1);

        });

    });


});