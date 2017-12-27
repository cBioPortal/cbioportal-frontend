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
import sinon from 'sinon';
import { Gene, StructuralVariant } from '../../api/generated/CBioPortalAPI';
import { EnsemblTranscriptExt, StructuralVariantExt } from '../../model/Fusion';
import { PfamDomainRangeExt } from '../../model/Fusion';
import MobxPromise from 'mobxpromise/dist/src/MobxPromise';
import { PfamDomain } from 'cbioportal-frontend-commons';
import ResultViewFusionMapperDataStore from '../../../pages/resultsView/fusion/ResultViewFusionMapperDataStore';

const fusionList = [
    {
        uniqueSampleKey: 'VENHQS1BMi1BMDRQLTAxOnN0dWR5X2VzXzBfZHVx',
        uniquePatientKey: 'VENHQS1BMi1BMDRQOnN0dWR5X2VzXzBfZHVw',
        molecularProfileId: 'study_es_0_dup_structural_variants',
        structuralVariantId: 11,
        sampleIdInternal: 5858,
        sampleId: 'TCGA-A2-A04P-01',
        patientId: 'TCGA-A2-A04P',
        studyId: 'study_es_0_dup',
        site1EntrezGeneId: 7113,
        site1HugoSymbol: 'TMPRSS2',
        site1EnsemblTranscriptId: 'ENST00000332149',
        site1Exon: 1,
        site1Chromosome: '21',
        site1Position: 42880008,
        site1Description: 'TMPRSS2-ERG.T1E2.COSF23.1_1',
        site2EntrezGeneId: 2078,
        site2HugoSymbol: 'ERG',
        site2EnsemblTranscriptId: 'ENST00000442448',
        site2Exon: 2,
        site2Chromosome: '21',
        site2Position: 39956868,
        site2Description: 'TMPRSS2-ERG.T1E2.COSF23.1_2',
        site2EffectOnFrame: 'NA',
        ncbiBuild: 'GRCh37',
        dnaSupport: 'no',
        rnaSupport: 'yes',
        normalReadCount: -1,
        tumorReadCount: 100003,
        normalVariantCount: -1,
        tumorVariantCount: 60000,
        normalPairedEndReadCount: -1,
        tumorPairedEndReadCount: -1,
        normalSplitReadCount: -1,
        tumorSplitReadCount: -1,
        annotation: 'TMPRSS2-ERG.T1E2.COSF23.1',
        breakpointType: 'NA',
        center: 'NA',
        connectionType: 'NA',
        eventInfo: 'Fusion',
        variantClass: 'NA',
        length: -1,
        comments: 'Gain-of-Function',
        externalAnnotation: 'COSMIC:COSF23',
        driverFilter: 'NA',
        driverFilterAnn: 'NA',
        driverTiersFilter: 'NA',
        driverTiersFilterAnn: 'NA',
        isLeftAligned: true,
        totalWidth: 100,
    },
    {
        uniqueSampleKey: 'VENHQS1BMi1BMDRQLTAxOnN0dWR5X2VzXzBfZHVw',
        uniquePatientKey: 'VENHQS1BMi1BMDRQOnN0dWR5X2VzXzBfZHVw',
        molecularProfileId: 'study_es_0_dup_structural_variants',
        structuralVariantId: 12,
        sampleIdInternal: 5858,
        sampleId: 'TCGA-A2-A04P-01',
        patientId: 'TCGA-A2-A04P',
        studyId: 'study_es_0_dup',
        site1EntrezGeneId: 7113,
        site1HugoSymbol: 'TMPRSS2',
        site1EnsemblTranscriptId: 'ENST00000424093',
        site1Exon: 3,
        site1Chromosome: '21',
        site1Position: 52150004,
        site1Description: 'TMPRSS2-KRAS.TEST1_1',
        site2EntrezGeneId: 3845,
        site2HugoSymbol: 'KRAS',
        site2EnsemblTranscriptId: 'ENST00000557334',
        site2Exon: 1,
        site2Chromosome: '12',
        site2Position: 25684764,
        site2Description: 'TMPRSS2-KRAS.TEST1_2',
        site2EffectOnFrame: 'NA',
        ncbiBuild: 'GRCh37',
        dnaSupport: 'no',
        rnaSupport: 'yes',
        normalReadCount: -1,
        tumorReadCount: 100004,
        normalVariantCount: -1,
        tumorVariantCount: 50000,
        normalPairedEndReadCount: -1,
        tumorPairedEndReadCount: -1,
        normalSplitReadCount: -1,
        tumorSplitReadCount: -1,
        annotation: 'TMPRSS2-KRAS.TEST1',
        breakpointType: 'NA',
        center: 'NA',
        connectionType: 'NA',
        eventInfo: 'Fusion',
        variantClass: 'NA',
        length: -1,
        comments: 'Lost-of-Function',
        externalAnnotation: 'NA',
        driverFilter: 'NA',
        driverFilterAnn: 'NA',
        driverTiersFilter: 'NA',
        driverTiersFilterAnn: 'NA',
        isLeftAligned: true,
        totalWidth: 200,
    },
    {
        uniqueSampleKey: 'VENHQS1BMi1BMDRQLTAxOnN0dWR5X2VzXzBfZHVp',
        uniquePatientKey: 'VENHQS1BMi1BMDRQOnN0dWR5X2VzXzBfZHVw',
        molecularProfileId: 'study_es_0_dup_structural_variants',
        structuralVariantId: 12,
        sampleIdInternal: 5858,
        sampleId: 'TCGA-A2-A04P-01',
        patientId: 'TCGA-A2-A04P',
        studyId: 'study_es_0_dup',
        site1EntrezGeneId: 7113,
        site1HugoSymbol: 'TMPRSS2',
        site1EnsemblTranscriptId: 'ENST00000424093',
        site1Exon: 3,
        site1Chromosome: '21',
        site1Position: 52150004,
        site1Description: 'TMPRSS2-KRAS.TEST1_1',
        site2EntrezGeneId: 3845,
        site2HugoSymbol: 'KRAS',
        site2EnsemblTranscriptId: 'ENST00000557334',
        site2Exon: 1,
        site2Chromosome: '12',
        site2Position: 25684764,
        site2Description: 'TMPRSS2-KRAS.TEST1_2',
        site2EffectOnFrame: 'NA',
        ncbiBuild: 'GRCh37',
        dnaSupport: 'no',
        rnaSupport: 'yes',
        normalReadCount: -1,
        tumorReadCount: 100004,
        normalVariantCount: -1,
        tumorVariantCount: 50000,
        normalPairedEndReadCount: -1,
        tumorPairedEndReadCount: -1,
        normalSplitReadCount: -1,
        tumorSplitReadCount: -1,
        annotation: 'TMPRSS2-KRAS.TEST1',
        breakpointType: 'NA',
        center: 'NA',
        connectionType: 'NA',
        eventInfo: 'Fusion',
        variantClass: 'NA',
        length: -1,
        comments: 'Lost-of-Function',
        externalAnnotation: 'NA',
        driverFilter: 'NA',
        driverFilterAnn: 'NA',
        driverTiersFilter: 'NA',
        driverTiersFilterAnn: 'NA',
        isLeftAligned: false,
        totalWidth: 3000,
    },
];
const transcriptWithRawExons: EnsemblTranscriptExt = {
    transcriptId: 'ENST00000557335',
    geneId: 'ENSG00000133703',
    hugoSymbols: ['KRAS'],
    proteinId: 'ENSP00000452512',
    proteinLength: 75,
    refseqMrnaId: '',
    ccdsId: '',
    pfamDomains: [
        {
            pfamDomainId: 'PF00041',
            pfamDomainStart: 5,
            pfamDomainEnd: 44,
        },
    ],
    exons: [
        {
            exonId: 'ENSE00001919654',
            exonStart: 42836478,
            exonEnd: 42838080,
            rank: 14,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00003654781',
            exonStart: 42839661,
            exonEnd: 42839813,
            rank: 13,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00001324661',
            exonStart: 42840323,
            exonEnd: 42840465,
            rank: 12,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00001309041',
            exonStart: 42842575,
            exonEnd: 42842670,
            rank: 11,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00001310536',
            exonStart: 42843733,
            exonEnd: 42843908,
            rank: 10,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00001291248',
            exonStart: 42845252,
            exonEnd: 42845423,
            rank: 9,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00001319118',
            exonStart: 42848504,
            exonEnd: 42848547,
            rank: 8,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00001296879',
            exonStart: 42851099,
            exonEnd: 42851209,
            rank: 7,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00001328752',
            exonStart: 42852403,
            exonEnd: 42852529,
            rank: 6,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00001308618',
            exonStart: 42860321,
            exonEnd: 42860440,
            rank: 5,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00003500399',
            exonStart: 42861434,
            exonEnd: 42861520,
            rank: 4,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00003637691',
            exonStart: 42866283,
            exonEnd: 42866505,
            rank: 3,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00003502036',
            exonStart: 42870046,
            exonEnd: 42870116,
            rank: 2,
            strand: -1,
            version: 1,
        },
        {
            exonId: 'ENSE00001881208',
            exonStart: 42880008,
            exonEnd: 42880086,
            rank: 1,
            strand: -1,
            version: 1,
        },
    ],
    isReferenceGene: false,
    fillColor: '#cc4c02',
    isLeftAligned: false,
    fusions: [],
    deltaX: 10,
    utrs: [],
    totalWidth: 0,
    fivePrimeLength: 0,
};
const allTranscriptsRaw = [
    {
        transcriptId: 'ENST00000332149',
        geneId: 'ENSG00000184012',
        hugoSymbols: ['TMPRSS2'],
        proteinId: 'ENSP00000330330',
        proteinLength: 492,
        refseqMrnaId: '',
        ccdsId: '',
        pfamDomains: <PfamDomainRangeExt[]>[
            {
                pfamDomainId: 'PF00089',
                pfamDomainStart: 256,
                pfamDomainEnd: 484,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM01',
                description: 'PFAM01-DESC',
            },
            {
                pfamDomainId: 'PF15494',
                pfamDomainStart: 153,
                pfamDomainEnd: 246,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM02',
                description: 'PFAM02-DESC',
            },
        ],
        exons: [
            {
                exonId: 'ENSE00001919654',
                exonStart: 42836478,
                exonEnd: 42838080,
                rank: 14,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003654781',
                exonStart: 42839661,
                exonEnd: 42839813,
                rank: 13,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001324661',
                exonStart: 42840323,
                exonEnd: 42840465,
                rank: 12,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001309041',
                exonStart: 42842575,
                exonEnd: 42842670,
                rank: 11,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001310536',
                exonStart: 42843733,
                exonEnd: 42843908,
                rank: 10,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001291248',
                exonStart: 42845252,
                exonEnd: 42845423,
                rank: 9,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001319118',
                exonStart: 42848504,
                exonEnd: 42848547,
                rank: 8,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001296879',
                exonStart: 42851099,
                exonEnd: 42851209,
                rank: 7,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001328752',
                exonStart: 42852403,
                exonEnd: 42852529,
                rank: 6,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001308618',
                exonStart: 42860321,
                exonEnd: 42860440,
                rank: 5,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003500399',
                exonStart: 42861434,
                exonEnd: 42861520,
                rank: 4,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003637691',
                exonStart: 42866283,
                exonEnd: 42866505,
                rank: 3,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003502036',
                exonStart: 42870046,
                exonEnd: 42870116,
                rank: 2,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001881208',
                exonStart: 42880008,
                exonEnd: 42880086,
                rank: 1,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
        ],
        isReferenceGene: true,
        fillColor: '#084594',
        isLeftAligned: false,
        fusions: [],
        utrs: [
            {
                type: 'three_prime_UTR',
                start: 42836478,
                end: 42838068,
                strand: -1,
            },
            {
                type: 'five_prime_UTR',
                start: 42870061,
                end: 42870116,
                strand: -1,
            },
            {
                type: 'five_prime_UTR',
                start: 42880008,
                end: 42880086,
                strand: -1,
            },
        ],
        fivePrimeLength: 0,
        totalWidth: 1000,
        deltaX: 100,
    },
    {
        transcriptId: 'ENST00000424093',
        geneId: 'ENSG00000184012',
        hugoSymbols: ['TMPRSS2'],
        proteinId: 'ENSP00000397846',
        proteinLength: 219,
        refseqMrnaId: '',
        ccdsId: '',
        pfamDomains: [
            {
                pfamDomainId: 'PF15494',
                pfamDomainStart: 113,
                pfamDomainEnd: 206,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM01',
                description: 'PFAM01-DESC',
            },
        ],
        exons: [
            {
                exonId: 'ENSE00001919654',
                exonStart: 42836478,
                exonEnd: 42838080,
                rank: 14,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003654781',
                exonStart: 42839661,
                exonEnd: 42839813,
                rank: 13,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001324661',
                exonStart: 42840323,
                exonEnd: 42840465,
                rank: 12,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001309041',
                exonStart: 42842575,
                exonEnd: 42842670,
                rank: 11,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001310536',
                exonStart: 42843733,
                exonEnd: 42843908,
                rank: 10,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001291248',
                exonStart: 42845252,
                exonEnd: 42845423,
                rank: 9,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001319118',
                exonStart: 42848504,
                exonEnd: 42848547,
                rank: 8,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001296879',
                exonStart: 42851099,
                exonEnd: 42851209,
                rank: 7,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001328752',
                exonStart: 42852403,
                exonEnd: 42852529,
                rank: 6,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001308618',
                exonStart: 42860321,
                exonEnd: 42860440,
                rank: 5,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003500399',
                exonStart: 42861434,
                exonEnd: 42861520,
                rank: 4,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003637691',
                exonStart: 42866283,
                exonEnd: 42866505,
                rank: 3,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003502036',
                exonStart: 42870046,
                exonEnd: 42870116,
                rank: 2,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001881208',
                exonStart: 42880008,
                exonEnd: 42880086,
                rank: 1,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
        ],
        isReferenceGene: true,
        fillColor: '#2171b5',
        isLeftAligned: false,
        fusions: [],
        utrs: [],
        totalWidth: 1000,
        deltaX: 100,
        fivePrimeLength: 0,
    },
    {
        transcriptId: 'ENST00000442448',
        geneId: 'ENSG00000157554',
        hugoSymbols: ['ERG'],
        proteinId: 'ENSP00000394694',
        proteinLength: 462,
        refseqMrnaId: '',
        ccdsId: '',
        pfamDomains: [
            {
                pfamDomainId: 'PF00178',
                pfamDomainStart: 293,
                pfamDomainEnd: 375,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM01',
                description: 'PFAM01-DESC',
            },
            {
                pfamDomainId: 'PF02198',
                pfamDomainStart: 123,
                pfamDomainEnd: 204,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM02',
                description: 'PFAM02-DESC',
            },
        ],
        exons: [
            {
                exonId: 'ENSE00001919654',
                exonStart: 42836478,
                exonEnd: 42838080,
                rank: 14,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003654781',
                exonStart: 42839661,
                exonEnd: 42839813,
                rank: 13,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001324661',
                exonStart: 42840323,
                exonEnd: 42840465,
                rank: 12,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001309041',
                exonStart: 42842575,
                exonEnd: 42842670,
                rank: 11,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001310536',
                exonStart: 42843733,
                exonEnd: 42843908,
                rank: 10,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001291248',
                exonStart: 42845252,
                exonEnd: 42845423,
                rank: 9,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001319118',
                exonStart: 42848504,
                exonEnd: 42848547,
                rank: 8,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001296879',
                exonStart: 42851099,
                exonEnd: 42851209,
                rank: 7,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001328752',
                exonStart: 42852403,
                exonEnd: 42852529,
                rank: 6,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001308618',
                exonStart: 42860321,
                exonEnd: 42860440,
                rank: 5,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003500399',
                exonStart: 42861434,
                exonEnd: 42861520,
                rank: 4,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003637691',
                exonStart: 42866283,
                exonEnd: 42866505,
                rank: 3,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003502036',
                exonStart: 42870046,
                exonEnd: 42870116,
                rank: 2,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001881208',
                exonStart: 42880008,
                exonEnd: 42880086,
                rank: 1,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
        ],
        isReferenceGene: false,
        fillColor: '#8c2d04',
        isLeftAligned: false,
        fusions: [],
        utrs: [],
        totalWidth: 1000,
        deltaX: 100,
        fivePrimeLength: 0,
    },
    {
        transcriptId: 'ENST00000557334',
        geneId: 'ENSG00000133703',
        hugoSymbols: ['KRAS'],
        proteinId: 'ENSP00000452512',
        proteinLength: 75,
        refseqMrnaId: '',
        ccdsId: '',
        pfamDomains: [
            {
                pfamDomainId: 'PF00041',
                pfamDomainStart: 5,
                pfamDomainEnd: 44,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM01',
                description: 'PFAM01-DESC',
            },
        ],
        exons: [
            {
                exonId: 'ENSE00001919654',
                exonStart: 42836478,
                exonEnd: 42838080,
                rank: 14,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003654781',
                exonStart: 42839661,
                exonEnd: 42839813,
                rank: 13,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001324661',
                exonStart: 42840323,
                exonEnd: 42840465,
                rank: 12,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001309041',
                exonStart: 42842575,
                exonEnd: 42842670,
                rank: 11,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001310536',
                exonStart: 42843733,
                exonEnd: 42843908,
                rank: 10,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001291248',
                exonStart: 42845252,
                exonEnd: 42845423,
                rank: 9,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001319118',
                exonStart: 42848504,
                exonEnd: 42848547,
                rank: 8,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001296879',
                exonStart: 42851099,
                exonEnd: 42851209,
                rank: 7,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001328752',
                exonStart: 42852403,
                exonEnd: 42852529,
                rank: 6,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001308618',
                exonStart: 42860321,
                exonEnd: 42860440,
                rank: 5,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003500399',
                exonStart: 42861434,
                exonEnd: 42861520,
                rank: 4,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003637691',
                exonStart: 42866283,
                exonEnd: 42866505,
                rank: 3,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003502036',
                exonStart: 42870046,
                exonEnd: 42870116,
                rank: 2,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001881208',
                exonStart: 42880008,
                exonEnd: 42880086,
                rank: 1,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
        ],
        isReferenceGene: false,
        fillColor: '#cc4c02',
        isLeftAligned: false,
        fusions: [],
        utrs: [],
        totalWidth: 1000,
        deltaX: 100,
        fivePrimeLength: 0,
    },
    {
        transcriptId: 'ENST00000557335',
        geneId: 'ENSG00000133703',
        hugoSymbols: ['KRAS'],
        proteinId: 'ENSP00000452512',
        proteinLength: 75,
        refseqMrnaId: '',
        ccdsId: '',
        pfamDomains: [
            {
                pfamDomainId: 'PF00041',
                pfamDomainStart: 5,
                pfamDomainEnd: 44,
                fillColor: 'orange',
                width: 100,
                x: 0,
                name: 'PFAM01',
                description: 'PFAM01-DESC',
            },
        ],
        exons: [
            {
                exonId: 'ENSE00001919654',
                exonStart: 42836478,
                exonEnd: 42838080,
                rank: 14,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003654781',
                exonStart: 42839661,
                exonEnd: 42839813,
                rank: 13,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001324661',
                exonStart: 42840323,
                exonEnd: 42840465,
                rank: 12,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001309041',
                exonStart: 42842575,
                exonEnd: 42842670,
                rank: 11,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001310536',
                exonStart: 42843733,
                exonEnd: 42843908,
                rank: 10,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001291248',
                exonStart: 42845252,
                exonEnd: 42845423,
                rank: 9,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001319118',
                exonStart: 42848504,
                exonEnd: 42848547,
                rank: 8,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001296879',
                exonStart: 42851099,
                exonEnd: 42851209,
                rank: 7,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001328752',
                exonStart: 42852403,
                exonEnd: 42852529,
                rank: 6,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001308618',
                exonStart: 42860321,
                exonEnd: 42860440,
                rank: 5,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003500399',
                exonStart: 42861434,
                exonEnd: 42861520,
                rank: 4,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003637691',
                exonStart: 42866283,
                exonEnd: 42866505,
                rank: 3,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00003502036',
                exonStart: 42870046,
                exonEnd: 42870116,
                rank: 2,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
            {
                exonId: 'ENSE00001881208',
                exonStart: 42880008,
                exonEnd: 42880086,
                rank: 1,
                strand: -1,
                version: 1,
                fillColor: '#000',
                width: 100,
                x: 0,
            },
        ],
        isReferenceGene: false,
        fillColor: '#cc4c02',
        isLeftAligned: false,
        fusions: [],
        utrs: [],
        totalWidth: 1000,
        deltaX: 100,
        fivePrimeLength: 0,
    },
];
const allTranscriptsById = {
    ENST00000332149: [allTranscriptsRaw[0]],
    ENST00000424093: [allTranscriptsRaw[1]],
    ENST00000442448: [allTranscriptsRaw[2]],
    ENST00000557334: [allTranscriptsRaw[3]],
    ENST00000557335: [allTranscriptsRaw[4]],
};
const allTranscripts: MobxPromise<EnsemblTranscriptExt[]> = {
    result: allTranscriptsRaw,
    status: 'complete' as 'complete',
    peekStatus: 'complete',
    isPending: false,
    isError: false,
    isComplete: true,
    error: undefined,
};
const allTranscriptsEmpty: MobxPromise<EnsemblTranscriptExt[]> = {
    result: [],
    status: 'complete' as 'complete',
    peekStatus: 'complete',
    isPending: false,
    isError: false,
    isComplete: true,
    error: undefined,
};
const tmprss2Gene: Gene = {
    hugoGeneSymbol: 'TMPRSS2',
    entrezGeneId: 999,
    type: '',
    geneticEntityId: 888,
};
const pfamsDetailsRaw = [
    {
        pfamAccession: 'PF00041',
        name: 'fn3',
        description: 'Fibronectin type III domain',
    },
    {
        pfamAccession: 'PF00069',
        name: 'Pkinase',
        description: 'Protein kinase domain',
    },
    {
        pfamAccession: 'PF00102',
        name: 'Y_phosphatase',
        description: 'Protein-tyrosine phosphatase',
    },
    {
        pfamAccession: 'PF00373',
        name: 'FERM_M',
        description: 'FERM central domain',
    },
];
const pfamsDetails: MobxPromise<PfamDomain[]> = {
    result: pfamsDetailsRaw,
    status: 'complete' as 'complete',
    peekStatus: 'complete',
    isPending: false,
    isError: false,
    isComplete: true,
    error: undefined,
};
const pfamsDetailsEmpty: MobxPromise<PfamDomain[]> = {
    result: [],
    status: 'complete' as 'complete',
    peekStatus: 'complete',
    isPending: false,
    isError: false,
    isComplete: true,
    error: undefined,
};
const fusionData = (fusionList || []).map((fusion: StructuralVariant) => [
    fusion,
]);
const exonsChartStore = new ExonsChartStore(
    tmprss2Gene,
    allTranscripts,
    pfamsDetails,
    new ResultViewFusionMapperDataStore(fusionData)
);
const emptyStore = new ExonsChartStore(
    tmprss2Gene,
    allTranscriptsEmpty,
    pfamsDetailsEmpty,
    new ResultViewFusionMapperDataStore([])
);

describe('ExonsChartStore', () => {
    describe('getExonsBySite', () => {
        it('should return exons from 1 until breakpoint for site 1', () => {
            sinon.stub(exonsChartStore, 'transcriptsById').get(() => ({
                result: allTranscriptsById,
            }));

            const _exons = exonsChartStore.getExonsBySite(
                1,
                'ENST00000332149',
                4
            );
            // site1, ENST00000332149 length is 14, and breakpoint 4
            assert.equal(_exons.length, 4);
            assert.equal(_exons[0].rank, 1);
            assert.equal(_exons[_exons.length - 1].rank, 4);
        });

        it('should return exons from breakpoint until last exon for site 2', () => {
            const _exons = exonsChartStore.getExonsBySite(
                2,
                'ENST00000332149',
                4
            );
            // site1, ENST00000332149 length is 14 and breakpoint 4
            assert.equal(_exons.length, 11);
            assert.equal(_exons[0].rank, 4);
            assert.equal(_exons[_exons.length - 1].rank, 14);
        });
    });

    describe('updateDeltaX', () => {
        it('should update deltaX', () => {
            const res = ExonsChartStore.updateDeltaX(fusionList[0], 1000, 2000);
            const expected = {
                totalWidth: 100,
                deltaX: 1000,
            };
            assert.equal(res.totalWidth, expected.totalWidth);
            assert.equal(res.deltaX, expected.deltaX);
        });
        it('should update deltaX', () => {
            const res = ExonsChartStore.updateDeltaX(fusionList[2], 4000, 2000);
            const expected = {
                totalWidth: 3000,
                deltaX: 3000,
            };
            assert.equal(res.totalWidth, expected.totalWidth);
            assert.equal(res.deltaX, expected.deltaX);
        });
    });

    describe('addExonRangeProps', () => {
        it('should sort and add properties to the exon ranges', () => {
            const exonsRanges = [
                {
                    exonId: 'ENSE00001919654',
                    exonStart: 1300,
                    exonEnd: 1400,
                    rank: 14,
                    strand: -1,
                    version: 1,
                    x: 0,
                },
                {
                    exonId: 'ENSE00003654781',
                    exonStart: 1200,
                    exonEnd: 1300,
                    rank: 13,
                    strand: -1,
                    version: 1,
                    x: 0,
                },
            ];
            const res = ExonsChartStore.addExonRangeProps(
                exonsRanges,
                '#999999'
            );
            assert.deepEqual(res[0], {
                exonId: 'ENSE00003654781',
                exonStart: 1200,
                exonEnd: 1300,
                rank: 13,
                strand: -1,
                version: 1,
                x: 0,
                fillColor: '#999999',
                width: 100,
            });
        });
    });

    describe('addExonProps', () => {
        it('should add exons props, totalWidth to the transcript', () => {
            const res = ExonsChartStore.addExonProps(transcriptWithRawExons);
            assert.equal(res.deltaX, 10);
            assert.equal(res.totalWidth, 3191);
        });
    });

    describe('getTotalWidth', () => {
        it('should return total width of exons', () => {
            const total = ExonsChartStore.getTotalWidth(
                allTranscriptsRaw[0].exons
            );
            assert.equal(total, 1400);
        });
    });

    describe('getSite1LongestFusion', () => {
        it('should return undefined when try to get from an empty array', () => {
            assert.equal(ExonsChartStore.getSite1LongestFusion([]), undefined);
        });
        it('should return undefined if fusions are left aligned', () => {
            const fusions = [fusionList[0], fusionList[1]];
            assert.equal(
                ExonsChartStore.getSite1LongestFusion(fusions),
                undefined
            );
        });
        it('should return longest site1 fusion', () => {
            const fusions = [fusionList[0], fusionList[1], fusionList[2]];
            const site1Longest = ExonsChartStore.getSite1LongestFusion(fusions);
            if (site1Longest) {
                assert.equal(site1Longest.totalWidth, 3000);
            }
        });
    });

    describe('hasLongestSite1', () => {
        it('should return false when ensembl transcript has longer width', () => {
            assert.equal(
                ExonsChartStore.hasLongestSite1(
                    fusionList[0],
                    allTranscriptsRaw[0],
                    undefined
                ),
                false
            );
        });
        it('should return true when fusion has longer width and right aligned', () => {
            assert.equal(
                ExonsChartStore.hasLongestSite1(
                    fusionList[2],
                    allTranscriptsRaw[0],
                    fusionList[0]
                ),
                true
            );
        });
    });

    describe('getDeltaX', () => {
        it('should update delta-x and width', () => {
            const prevFusions: StructuralVariantExt[] = [];
            const res = ExonsChartStore.addDeltaX(
                fusionList[0],
                transcriptWithRawExons,
                prevFusions
            );
            assert.equal(prevFusions.length, 1);
            assert.equal(transcriptWithRawExons.deltaX, 10);
            assert.equal(res.deltaX, 10);
            assert.equal(res.totalWidth, 100);
        });

        it('should update transcipt deltax when fusion has longest site1', () => {
            const prevFusions: StructuralVariantExt[] = [];
            const res = ExonsChartStore.addDeltaX(
                fusionList[2],
                transcriptWithRawExons,
                prevFusions
            );
            assert.equal(prevFusions.length, 1);
            assert.equal(transcriptWithRawExons.deltaX, 3000);
            assert.equal(res.deltaX, 0);
            assert.equal(res.totalWidth, 3000);
        });

        it('should update transcipt deltax when fusion has longest site1', () => {
            const prevFusions: StructuralVariantExt[] = [];
            const res = ExonsChartStore.addDeltaX(
                fusionList[2],
                transcriptWithRawExons,
                prevFusions
            );
            assert.equal(prevFusions.length, 1);
            assert.equal(transcriptWithRawExons.deltaX, 3000);
            assert.equal(res.deltaX, 0);
            assert.equal(res.totalWidth, 3000);
        });

        it('should update transcipt deltax when fusion has longest site1', () => {
            const prevFusions: StructuralVariantExt[] = [fusionList[2]];
            const res = ExonsChartStore.addDeltaX(
                fusionList[0],
                transcriptWithRawExons,
                prevFusions
            );
            assert.equal(prevFusions.length, 2);
            assert.equal(transcriptWithRawExons.deltaX, 3000);
            assert.equal(res.deltaX, 3000);
            assert.equal(res.totalWidth, 100);
        });
    });

    describe('getPfamDomainDetails', () => {
        it('should return an empty array if pfam domain is empty', () => {
            assert.equal(emptyStore.getPfamDomainDetails([]).length, 0);
        });

        it('should return pfam with more detailed information', () => {
            sinon.stub(exonsChartStore, 'pfamDomainsById').get(() => ({
                result: {
                    PF00041: [
                        {
                            pfamAccession: 'PF00041',
                            name: 'fn3',
                            description: 'Fibronectin type III domain',
                        },
                    ],
                    PF00069: [
                        {
                            pfamAccession: 'PF00069',
                            name: 'Pkinase',
                            description: 'Protein kinase domain',
                        },
                    ],
                },
            }));

            const asserts = [
                {
                    name: 'fn3',
                    fillColor: 'orange',
                    description: 'Fibronectin type III domain',
                    width: 50,
                },
                {
                    name: 'Pkinase',
                    fillColor: 'orange',
                    description: 'Protein kinase domain',
                    width: 100,
                },
            ];
            let pfamRanges = [
                {
                    pfamDomainId: 'PF00041',
                    pfamDomainStart: 150,
                    pfamDomainEnd: 200,
                    x: 0,
                },
                {
                    pfamDomainId: 'PF00069',
                    pfamDomainStart: 250,
                    pfamDomainEnd: 350,
                    x: 0,
                },
            ];
            const result = exonsChartStore.getPfamDomainDetails(pfamRanges);
            result.forEach((pfamRange: PfamDomainRangeExt, idx: number) => {
                assert.equal(pfamRange.name, asserts[idx].name);
                assert.equal(pfamRange.fillColor, asserts[idx].fillColor);
                assert.equal(pfamRange.width, asserts[idx].width);
            });
        });
    });

    describe('addExtraFusionProps', () => {
        it('should add extra fusion properties', () => {
            assert.equal(fusionList[0].hasOwnProperty('exons'), false);
            assert.equal(fusionList[0].totalWidth, 100);
            const res = exonsChartStore.addExtraFusionProps(fusionList[0]);
            assert.equal(res.hasOwnProperty('exons'), true);
            assert.equal(res.totalWidth, 1400);
            assert.equal(res.isLeftAligned, true);
        });
    });

    describe('getFivePrimeLength', () => {
        it('should calculate 5 prime length', () => {
            const res = ExonsChartStore.getFivePrimeLength(
                allTranscriptsRaw[0]
            );
            assert.equal(res, 133);
        });
    });

    describe('addExtraTranscriptProps', () => {
        it('should add extra transcript props', () => {
            assert.equal(transcriptWithRawExons.fusions!.length, 0);
            const res = exonsChartStore.addExtraTranscriptProps(
                transcriptWithRawExons
            );
            assert.equal(res.fusions.length, 0);
            assert.equal(res.transcript.deltaX, 3000);
            assert.equal(res.transcript.totalWidth, 0);
        });
    });
});
