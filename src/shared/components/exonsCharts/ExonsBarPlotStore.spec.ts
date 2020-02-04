/*
 * Copyright (c) 2018. The Hyve and respective contributors
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 *
 * See the file LICENSE in the root of this repository.
 *
 */

/**
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

import ExonsBarPlotStore from './ExonsBarPlotStore';
import { assert } from 'chai';
import { EnsemblTranscriptExt } from '../../model/Fusion';
import {
    ExonRangeExt,
    PfamDomainRangeExt,
    StructuralVariantExt,
    UtrType,
} from '../../model/Fusion';

const exons: ExonRangeExt[] = [
    {
        exonId: 'ENSE00001881208',
        exonStart: 1000,
        exonEnd: 3000,
        width: 2000,
        rank: 1,
        strand: -1,
        version: 1,
        fillColor: '#084594',
        x: 0,
    },
    {
        exonId: 'ENSE00001881209',
        exonStart: 1000,
        exonEnd: 2000,
        width: 1000,
        rank: 2,
        strand: -1,
        version: 1,
        fillColor: '#084594',
        x: 2000,
    },
];
const exons2: ExonRangeExt[] = [
    {
        exonId: 'ENSE00001881209',
        exonStart: 1000,
        exonEnd: 2000,
        width: 4000,
        rank: 2,
        strand: -1,
        version: 1,
        fillColor: '#084594',
        x: 0,
    },
];

describe('ExonsBarPlotStore', () => {
    describe('computedExons', () => {
        const transcript: EnsemblTranscriptExt = {
            exons: exons,
            totalWidth: 3000,
            deltaX: 200,
            transcriptId: 'ENST00000332149',
            geneId: 'ENSG00000184012',
            hugoSymbols: ['TMPRSS2'],
            proteinId: 'ENSP00000330330',
            proteinLength: 492,
            refseqMrnaId: '',
            ccdsId: '',
            pfamDomains: <PfamDomainRangeExt[]>[
                {
                    pfamDomainId: 'PF03451',
                    pfamDomainStart: 223,
                    pfamDomainEnd: 298,
                    fillColor: 'orange',
                    width: 100,
                    x: 0,
                    name: 'PFAM01',
                    description: 'PFAM01-DESC',
                },
                {
                    pfamDomainId: 'PF00400',
                    pfamDomainStart: 826,
                    pfamDomainEnd: 863,
                    fillColor: 'orange',
                    width: 100,
                    x: 0,
                    name: 'PFAM01',
                    description: 'PFAM01-DESC',
                },
                {
                    pfamDomainId: 'PF00400',
                    pfamDomainStart: 588,
                    pfamDomainEnd: 620,
                    fillColor: 'orange',
                    width: 100,
                    x: 0,
                    name: 'PFAM01',
                    description: 'PFAM01-DESC',
                },
                {
                    pfamDomainId: 'PF00400',
                    pfamDomainStart: 717,
                    pfamDomainEnd: 749,
                    fillColor: 'orange',
                    width: 100,
                    x: 0,
                    name: 'PFAM01',
                    description: 'PFAM01-DESC',
                },
                {
                    pfamDomainId: 'PF00400',
                    pfamDomainStart: 303,
                    pfamDomainEnd: 327,
                    fillColor: 'orange',
                    width: 100,
                    x: 0,
                    name: 'PFAM01',
                    description: 'PFAM01-DESC',
                },
            ],
            isReferenceGene: true,
            fillColor: '#084594',
            isLeftAligned: false,
            fusions: [],
            utrs: [
                {
                    type: UtrType.ThreePrime,
                    start: 1017198,
                    end: 1018272,
                    strand: -1,
                },
                {
                    type: UtrType.FivePrime,
                    start: 1026924,
                    end: 1026945,
                    strand: -1,
                },
                {
                    type: UtrType.FivePrime,
                    start: 1027371,
                    end: 1027483,
                    strand: -1,
                },
                {
                    type: UtrType.FivePrime,
                    start: 1050402,
                    end: 1050455,
                    strand: -1,
                },
                {
                    type: UtrType.FivePrime,
                    start: 1051440,
                    end: 1051461,
                    strand: -1,
                },
            ],
            fivePrimeLength: 20.7,
        };

        const fusion: StructuralVariantExt = {
            exons: exons2,
            totalWidth: 4000,
            deltaX: 0,
            isLeftAligned: false,
            isReferenceGene: false,
            fillColor: '#000',
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
            label: '',
        };

        const emptyTranscript = {
            annotation: '',
            breakpointType: '',
            center: '',
            comments: '',
            connectionType: '',
            dnaSupport: '',
            driverFilter: '',
            driverFilterAnn: '',
            driverTiersFilter: '',
            driverTiersFilterAnn: '',
            eventInfo: '',
            externalAnnotation: '',
            length: 0,
            molecularProfileId: '',
            ncbiBuild: '',
            normalPairedEndReadCount: 0,
            normalReadCount: 0,
            normalSplitReadCount: 0,
            normalVariantCount: 0,
            patientId: '',
            rnaSupport: '',
            sampleId: '',
            sampleIdInternal: 0,
            site1Chromosome: '',
            site1Description: '',
            site1EnsemblTranscriptId: '',
            site1EntrezGeneId: 0,
            site1Exon: 0,
            site1HugoSymbol: '',
            site1Position: 0,
            site2Chromosome: '',
            site2Description: '',
            site2EffectOnFrame: '',
            site2EnsemblTranscriptId: '',
            site2EntrezGeneId: 0,
            site2Exon: 0,
            site2HugoSymbol: '',
            site2Position: 0,
            structuralVariantId: 0,
            studyId: '',
            tumorPairedEndReadCount: 0,
            tumorReadCount: 0,
            tumorSplitReadCount: 0,
            tumorVariantCount: 0,
            uniquePatientKey: '',
            uniqueSampleKey: '',
            variantClass: '',
        };

        let store: ExonsBarPlotStore;
        let fusionStore: ExonsBarPlotStore;
        let emptyStore: ExonsBarPlotStore;

        before(() => {
            store = new ExonsBarPlotStore(
                { label: 'GENEX', isReference: true },
                transcript
            );
            fusionStore = new ExonsBarPlotStore(
                { label: 'GENEA-GENEB', isReference: false },
                fusion,
                3000
            );
            emptyStore = new ExonsBarPlotStore(
                { label: 'EMPTY', isReference: false },
                emptyTranscript
            );
        });

        it('should result 0 when values are undefined', () => {
            assert.equal(emptyStore.computedTotalWidth, 0);
            assert.equal(emptyStore.computedTotalRefGeneWidth, 0);
            assert.equal(emptyStore.computedDeltaX, 0);
            assert.equal(emptyStore.deltaXPos, 0);
            assert.equal(emptyStore.computedPfams.length, 0);
            assert.equal(emptyStore.computedExons.length, 0);
        });

        it('should compute x positions for all exons when drawing ref gene transcript', () => {
            const expectedXPos = [20, 220];
            const expectedPfamXPos = transcript.pfamDomains.map(
                (p: PfamDomainRangeExt) => {
                    const fivePrimeLength = transcript.fivePrimeLength
                        ? transcript.fivePrimeLength
                        : 0;
                    const deltaX = transcript.deltaX ? transcript.deltaX : 0;
                    return (
                        p.pfamDomainStart * 3 * 0.1 +
                        fivePrimeLength * 0.1 +
                        deltaX * 0.1
                    );
                }
            );
            // should contain computed exons
            assert.equal(store.computedExons.length, 2);
            // should contain computed pfams
            assert.equal(store.computedPfams.length, 5);
            // shoud return total width * divider
            assert.equal(store.computedTotalWidth, 300);
            // since transcript is ref gene transcript, it should return its own total width * divider
            assert.equal(store.computedTotalRefGeneWidth, 300);
            // shoud return delta x * divider
            assert.equal(store.computedDeltaX, 20);
            // since it's a ref gene, delta x position should be
            assert.equal(store.deltaXPos, 20);
            // should return expected x axis positions for each exons
            store.computedExons.forEach((e: ExonRangeExt, idx: number) => {
                assert.equal(e.x, expectedXPos[idx]);
            });
            // should return expected x axis positions for each pfams
            store.computedPfams.forEach(
                (p: PfamDomainRangeExt, idx: number) => {
                    assert.equal(p.x, expectedPfamXPos[idx]);
                }
            );
        });

        it('should compute x positions for all exons when drawing fusion genes', () => {
            const expectedXPos = [0];
            assert.equal(fusionStore.computedExons.length, 1);
            // shoud return total width * divider
            assert.equal(fusionStore.computedTotalWidth, 400);
            // since transcript is ref gene transcript, it should return its own total width * divider
            assert.equal(fusionStore.computedTotalRefGeneWidth, 300);
            // shoud return delta x * divider
            assert.equal(fusionStore.computedDeltaX, 0);
            // since it's a ref gene, delta x position should be
            assert.equal(fusionStore.deltaXPos, 0);

            fusionStore.computedExons.forEach(
                (e: ExonRangeExt, idx: number) => {
                    assert.equal(e.x, expectedXPos[idx]);
                }
            );
        });
    });
});
