/**
 * Copyright (c) 2018. The Hyve and respective contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * See the file LICENSE in the root of this repository.
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import { ExonsChartStore } from './ExonsChartStore';
import { assert } from 'chai';
import { CancerStudy, Gene, StructuralVariant } from '../../api/generated/CBioPortalAPI';
import FusionMapperDataStore from '../../../pages/resultsView/fusion/ResultViewFusionMapperDataStore';
import {
    EnsemblTranscriptExt} from '../../model/Fusion';
import { PfamDomainRangeExt, StructuralVariantExt } from '../../model/Fusion';

const _sv = [
    [{
        uniqueSampleKey: "VENHQS1BMi1BMDRQLTAxOnN0dWR5X2VzXzBfZHVw",
        uniquePatientKey: "VENHQS1BMi1BMDRQOnN0dWR5X2VzXzBfZHVw",
        molecularProfileId: "study_es_0_dup_structural_variants",
        structuralVariantId: 11,
        sampleIdInternal: 5858,
        sampleId: "TCGA-A2-A04P-01",
        patientId: "TCGA-A2-A04P",
        studyId: "study_es_0_dup",
        site1EntrezGeneId: 7113,
        site1HugoSymbol: "TMPRSS2",
        site1EnsemblTranscriptId: "ENST00000332149",
        site1Exon: 1,
        site1Chromosome: "21",
        site1Position: 42880008,
        site1Description: "TMPRSS2-ERG.T1E2.COSF23.1_1",
        site2EntrezGeneId: 2078,
        site2HugoSymbol: "ERG",
        site2EnsemblTranscriptId: "ENST00000442448",
        site2Exon: 2,
        site2Chromosome: "21",
        site2Position: 39956868,
        site2Description: "TMPRSS2-ERG.T1E2.COSF23.1_2",
        site2EffectOnFrame: "NA",
        ncbiBuild: "GRCh37",
        dnaSupport: "no",
        rnaSupport: "yes",
        normalReadCount: -1,
        tumorReadCount: 100003,
        normalVariantCount: -1,
        tumorVariantCount: 60000,
        normalPairedEndReadCount: -1,
        tumorPairedEndReadCount: -1,
        normalSplitReadCount: -1,
        tumorSplitReadCount: -1,
        annotation: "TMPRSS2-ERG.T1E2.COSF23.1",
        breakpointType: "NA",
        center: "NA",
        connectionType: "NA",
        eventInfo: "Fusion",
        variantClass: "NA",
        length: -1,
        comments: "Gain-of-Function",
        externalAnnotation: "COSMIC:COSF23",
        driverFilter: "NA",
        driverFilterAnn: "NA",
        driverTiersFilter: "NA",
        driverTiersFilterAnn: "NA"
    }],
    [{
        uniqueSampleKey: "VENHQS1BMi1BMDRQLTAxOnN0dWR5X2VzXzBfZHVw",
        uniquePatientKey: "VENHQS1BMi1BMDRQOnN0dWR5X2VzXzBfZHVw",
        molecularProfileId: "study_es_0_dup_structural_variants",
        structuralVariantId: 12,
        sampleIdInternal: 5858,
        sampleId: "TCGA-A2-A04P-01",
        patientId: "TCGA-A2-A04P",
        studyId: "study_es_0_dup",
        site1EntrezGeneId: 7113,
        site1HugoSymbol: "TMPRSS2",
        site1EnsemblTranscriptId: "ENST00000424093",
        site1Exon: 3,
        site1Chromosome: "21",
        site1Position: 52150004,
        site1Description: "TMPRSS2-KRAS.TEST1_1",
        site2EntrezGeneId: 3845,
        site2HugoSymbol: "KRAS",
        site2EnsemblTranscriptId: "ENST00000557334",
        site2Exon: 1,
        site2Chromosome: "12",
        site2Position: 25684764,
        site2Description: "TMPRSS2-KRAS.TEST1_2",
        site2EffectOnFrame: "NA",
        ncbiBuild: "GRCh37",
        dnaSupport: "no",
        rnaSupport: "yes",
        normalReadCount: -1,
        tumorReadCount: 100004,
        normalVariantCount: -1,
        tumorVariantCount: 50000,
        normalPairedEndReadCount: -1,
        tumorPairedEndReadCount: -1,
        normalSplitReadCount: -1,
        tumorSplitReadCount: -1,
        annotation: "TMPRSS2-KRAS.TEST1",
        breakpointType: "NA",
        center: "NA",
        connectionType: "NA",
        eventInfo: "Fusion",
        variantClass: "NA",
        length: -1,
        comments: "Lost-of-Function",
        externalAnnotation: "NA",
        driverFilter: "NA",
        driverFilterAnn: "NA",
        driverTiersFilter: "NA",
        driverTiersFilterAnn: "NA"
    }]
];
let _transcripts = [
    {
        transcriptId: "ENST00000332149",
        geneId: "ENSG00000184012",
        hugoSymbols: ["TMPRSS2"],
        proteinId: "ENSP00000330330",
        proteinLength: 492,
        pfamDomains: <PfamDomainRangeExt[]> [
            {
                pfamDomainId: "PF00089",
                pfamDomainStart: 256,
                pfamDomainEnd: 484,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM01',
                description: 'PFAM01-DESC'
            },
            {
                pfamDomainId: "PF15494",
                pfamDomainStart: 153,
                pfamDomainEnd: 246,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM02',
                description: 'PFAM02-DESC'
            }
        ],
        exons: [
            {
                exonId: "ENSE00001919654",
                exonStart: 42836478,
                exonEnd: 42838080,
                rank: 14,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003654781",
                exonStart: 42839661,
                exonEnd: 42839813,
                rank: 13,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001324661",
                exonStart: 42840323,
                exonEnd: 42840465,
                rank: 12,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001309041",
                exonStart: 42842575,
                exonEnd: 42842670,
                rank: 11,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001310536",
                exonStart: 42843733,
                exonEnd: 42843908,
                rank: 10,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001291248",
                exonStart: 42845252,
                exonEnd: 42845423,
                rank: 9,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001319118",
                exonStart: 42848504,
                exonEnd: 42848547,
                rank: 8,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001296879",
                exonStart: 42851099,
                exonEnd: 42851209,
                rank: 7,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001328752",
                exonStart: 42852403,
                exonEnd: 42852529,
                rank: 6,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001308618",
                exonStart: 42860321,
                exonEnd: 42860440,
                rank: 5,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003500399",
                exonStart: 42861434,
                exonEnd: 42861520,
                rank: 4,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003637691",
                exonStart: 42866283,
                exonEnd: 42866505,
                rank: 3,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003502036",
                exonStart: 42870046,
                exonEnd: 42870116,
                rank: 2,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001881208",
                exonStart: 42880008,
                exonEnd: 42880086,
                rank: 1,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            }
        ],
        isReferenceGene: true,
        fillColor: "#084594",
        isLeftAligned: false,
        fusions: [],
        utrs:[],
        fivePrimeLength:0,
        totalWidth: 1000,
        deltaX: 100
    },
    {
        transcriptId: "ENST00000424093",
        geneId: "ENSG00000184012",
        hugoSymbols: ["TMPRSS2"],
        proteinId: "ENSP00000397846",
        proteinLength: 219,
        pfamDomains: [
            {
                pfamDomainId: "PF15494",
                pfamDomainStart: 113,
                pfamDomainEnd: 206,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM01',
                description: 'PFAM01-DESC'
            }
        ],
        exons: [
            {
                exonId: "ENSE00001919654",
                exonStart: 42836478,
                exonEnd: 42838080,
                rank: 14,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003654781",
                exonStart: 42839661,
                exonEnd: 42839813,
                rank: 13,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001324661",
                exonStart: 42840323,
                exonEnd: 42840465,
                rank: 12,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001309041",
                exonStart: 42842575,
                exonEnd: 42842670,
                rank: 11,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001310536",
                exonStart: 42843733,
                exonEnd: 42843908,
                rank: 10,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001291248",
                exonStart: 42845252,
                exonEnd: 42845423,
                rank: 9,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001319118",
                exonStart: 42848504,
                exonEnd: 42848547,
                rank: 8,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001296879",
                exonStart: 42851099,
                exonEnd: 42851209,
                rank: 7,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001328752",
                exonStart: 42852403,
                exonEnd: 42852529,
                rank: 6,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001308618",
                exonStart: 42860321,
                exonEnd: 42860440,
                rank: 5,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003500399",
                exonStart: 42861434,
                exonEnd: 42861520,
                rank: 4,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003637691",
                exonStart: 42866283,
                exonEnd: 42866505,
                rank: 3,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003502036",
                exonStart: 42870046,
                exonEnd: 42870116,
                rank: 2,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001881208",
                exonStart: 42880008,
                exonEnd: 42880086,
                rank: 1,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            }
        ],
        isReferenceGene: true,
        fillColor: "#2171b5",
        isLeftAligned: false,
        fusions: [],
        utrs:[],
        totalWidth: 1000,
        deltaX: 100,
        fivePrimeLength: 0
    },
    {
        transcriptId: "ENST00000442448",
        geneId: "ENSG00000157554",
        hugoSymbols: ["ERG"],
        proteinId: "ENSP00000394694",
        proteinLength: 462,
        pfamDomains: [
            {
                pfamDomainId: "PF00178",
                pfamDomainStart: 293,
                pfamDomainEnd: 375,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM01',
                description: 'PFAM01-DESC'
            },
            {
                pfamDomainId: "PF02198",
                pfamDomainStart: 123,
                pfamDomainEnd: 204,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM02',
                description: 'PFAM02-DESC'
            }
        ],
        exons: [
            {
                exonId: "ENSE00001919654",
                exonStart: 42836478,
                exonEnd: 42838080,
                rank: 14,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003654781",
                exonStart: 42839661,
                exonEnd: 42839813,
                rank: 13,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001324661",
                exonStart: 42840323,
                exonEnd: 42840465,
                rank: 12,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001309041",
                exonStart: 42842575,
                exonEnd: 42842670,
                rank: 11,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001310536",
                exonStart: 42843733,
                exonEnd: 42843908,
                rank: 10,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001291248",
                exonStart: 42845252,
                exonEnd: 42845423,
                rank: 9,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001319118",
                exonStart: 42848504,
                exonEnd: 42848547,
                rank: 8,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001296879",
                exonStart: 42851099,
                exonEnd: 42851209,
                rank: 7,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001328752",
                exonStart: 42852403,
                exonEnd: 42852529,
                rank: 6,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001308618",
                exonStart: 42860321,
                exonEnd: 42860440,
                rank: 5,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003500399",
                exonStart: 42861434,
                exonEnd: 42861520,
                rank: 4,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003637691",
                exonStart: 42866283,
                exonEnd: 42866505,
                rank: 3,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003502036",
                exonStart: 42870046,
                exonEnd: 42870116,
                rank: 2,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001881208",
                exonStart: 42880008,
                exonEnd: 42880086,
                rank: 1,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            }
        ],
        isReferenceGene: false,
        fillColor: "#8c2d04",
        isLeftAligned: false,
        fusions: [],
        utrs:[],
        totalWidth: 1000,
        deltaX: 100,
        fivePrimeLength: 0
    },
    {
        transcriptId: "ENST00000557334",
        geneId: "ENSG00000133703",
        hugoSymbols: ["KRAS"],
        proteinId: "ENSP00000452512",
        proteinLength: 75,
        pfamDomains: [
            {
                pfamDomainId: "PF00071",
                pfamDomainStart: 5,
                pfamDomainEnd: 44,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM01',
                description: 'PFAM01-DESC'
            }
        ],
        exons: [
            {
                exonId: "ENSE00001919654",
                exonStart: 42836478,
                exonEnd: 42838080,
                rank: 14,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003654781",
                exonStart: 42839661,
                exonEnd: 42839813,
                rank: 13,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001324661",
                exonStart: 42840323,
                exonEnd: 42840465,
                rank: 12,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001309041",
                exonStart: 42842575,
                exonEnd: 42842670,
                rank: 11,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001310536",
                exonStart: 42843733,
                exonEnd: 42843908,
                rank: 10,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001291248",
                exonStart: 42845252,
                exonEnd: 42845423,
                rank: 9,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001319118",
                exonStart: 42848504,
                exonEnd: 42848547,
                rank: 8,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001296879",
                exonStart: 42851099,
                exonEnd: 42851209,
                rank: 7,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001328752",
                exonStart: 42852403,
                exonEnd: 42852529,
                rank: 6,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001308618",
                exonStart: 42860321,
                exonEnd: 42860440,
                rank: 5,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003500399",
                exonStart: 42861434,
                exonEnd: 42861520,
                rank: 4,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003637691",
                exonStart: 42866283,
                exonEnd: 42866505,
                rank: 3,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00003502036",
                exonStart: 42870046,
                exonEnd: 42870116,
                rank: 2,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            },
            {
                exonId: "ENSE00001881208",
                exonStart: 42880008,
                exonEnd: 42880086,
                rank: 1,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0
            }
        ],
        isReferenceGene: false,
        fillColor: "#cc4c02",
        isLeftAligned: false,
        fusions: [],
        utrs:[],
        totalWidth: 1000,
        deltaX: 100,
        fivePrimeLength: 0
    }
];

const studyIdToStudy = <{[studyId: string]: CancerStudy}>{
    'study_es_0_dup': <CancerStudy> {name: "Breast Ductal Carcinoma"},
    'study_es_1_dup': <CancerStudy> {name: "Adrenocortical Carcinoma"}
};

const _store = new ExonsChartStore(<Gene>{hugoGeneSymbol: 'TMPRSS2', chromosome: ''}, new FusionMapperDataStore(_sv),
    _transcripts, studyIdToStudy, [], true);

describe("ExonsChartStore", () => {
    describe("referenceTranscripts", () => {
        it("should return reference transcripts only", () => {
            let _isAllReferenceTranscripts = _store.referenceTranscripts.length ?
                _store.referenceTranscripts.reduce(
                    (accumulator:boolean, curr:EnsemblTranscriptExt) =>
                        curr.hugoSymbols[0] === "TMPRSS2" && accumulator, true) : false;
            assert.isTrue(_isAllReferenceTranscripts);
        });
    });

    describe("getTranscriptById", () => {
        it("should return correct result when get transcript by id", () => {
            let _transcriptById = _store.getTranscriptById("ENST00000332149");
            assert.equal(_transcriptById[0].transcriptId, "ENST00000332149")
        });
    });

    describe("getExonsBySite", () => {
        it("should return exons from 1 until breakpoint for site 1", () => {
            let _exons = _store.getExonsBySite(1, "ENST00000332149", 4); // site1, ENST00000332149 length is 14, and breakpoint 4
            assert.equal(_exons.length, 4);
            assert.equal(_exons[0].rank, 1);
            assert.equal(_exons[_exons.length - 1].rank, 4);
        });

        it("should return exons from breakpoint until last exon for site 2", () => {
            let _exons = _store.getExonsBySite(2, "ENST00000332149", 4); // site1, ENST00000332149 length is 14 and breakpoint 4
            assert.equal(_exons.length, 11);
            assert.equal(_exons[0].rank, 4);
            assert.equal(_exons[_exons.length - 1].rank, 14);
        });
    });

    describe("computedFusions", () => {
        it("should return fusions with exons", () => {
            _store.computedFusions.forEach((f:StructuralVariantExt) => {
                assert.isDefined(f.exons)
            });
        });
    });

    describe("fusionsByReferences", () => {
        it("should return reference transcripts with related fusions on each transcript", () => {
            _store.fusionsByReferences.forEach((t: EnsemblTranscriptExt) => {
                // expect to be defined
                assert.isDefined(t.fusions);
                // expect to contain related transcript id
                t.fusions.forEach((fusion: StructuralVariantExt) => {
                    let hasTranscript =
                        fusion.site1EnsemblTranscriptId === t.transcriptId ||
                        fusion.site2EnsemblTranscriptId === t.transcriptId;
                    assert.isTrue(hasTranscript);
                });
            });
        });
    });
});



