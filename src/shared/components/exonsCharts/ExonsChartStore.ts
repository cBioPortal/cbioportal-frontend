/*
 * Copyright (c) 2018. The Hyve and respective contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * See the file LICENSE in the root of this repository.
 *
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

import { Gene } from '../../api/generated/CBioPortalAPI';
import { PfamDomain } from '../../../public-lib/api/generated/GenomeNexusAPI';
import {
    EnsemblTranscriptExt,
    ExonRangeExt,
    PfamDomainRangeExt,
    StructuralVariantExt,
    UtrType
} from '../../model/Fusion';
import ResultViewFusionMapperDataStore from '../../../pages/resultsView/fusion/ResultViewFusionMapperDataStore';
import MobxPromise from 'mobxpromise';
import { remoteData } from '../../../public-lib';
import * as _ from 'lodash';

export class ExonsChartStore {

    constructor(public gene: Gene,
                public transcripts: MobxPromise<EnsemblTranscriptExt[]>,
                public pfamDomains: MobxPromise<PfamDomain[]>,
                public fusionMapperDataStore: ResultViewFusionMapperDataStore
    ) {}

    readonly transcriptsById = remoteData({
        await: () => [this.transcripts],
        invoke: () => {
            const withExons = (this.transcripts.result || []).map(ExonsChartStore.addExonProps);
            return Promise.resolve(_.groupBy(withExons, t => t.transcriptId))
        }
    });

    get fusions(): StructuralVariantExt[] {
        return (this.fusionMapperDataStore || {tableData: []})
            .tableData.map((f: StructuralVariantExt[]) => f[0]);
    }

    readonly pfamDomainsById = remoteData({
        await: () => [this.pfamDomains],
        invoke: () => Promise.resolve(_.groupBy(this.pfamDomains.result!, p => p.pfamAccession))
    });

    getExonsBySite(siteId: number, transcriptId: string, breakpoint: number): Array<ExonRangeExt> {
        let exons: Array<ExonRangeExt> = [];
        if (siteId === 1 || siteId === 2) {
            const {result} = this.transcriptsById;
            if (result !== undefined && result[transcriptId] !== undefined) {
                const sortedExons = <ExonRangeExt[]> result[transcriptId][0].exons.sort(
                    // sort exons by rank
                    (exon1: ExonRangeExt, exon2: ExonRangeExt) => exon1.rank - exon2.rank
                );
                exons = sortedExons.filter(exon => {
                    if (siteId === 1) {
                        return exon.rank <= breakpoint;
                    } else if (siteId === 2) {
                        return exon.rank >= breakpoint;
                    }
                });
            }
        }
        return exons;
    }

    static getTotalWidth(exons: ExonRangeExt[]): number {
        return exons.reduce((accumulator, e) => {
            e.width = e.width || 0;
            return accumulator + e.width;
        }, 0);
    }

    addExtraFusionProps (fusion: StructuralVariantExt): StructuralVariantExt {
        const site1Exons = this.getExonsBySite(1, fusion.site1EnsemblTranscriptId, fusion.site1Exon);
        const site2Exons = this.getExonsBySite(2, fusion.site2EnsemblTranscriptId, fusion.site2Exon);
        const exons = site1Exons.concat(site2Exons);
        const totalWidth = ExonsChartStore.getTotalWidth(site1Exons.concat(site2Exons) || []);
        return Object.assign({}, fusion, {
            isLeftAligned: (fusion.site1HugoSymbol === this.gene.hugoGeneSymbol),
            exons,
            totalWidth
        });
    };

    static updateDeltaX(fusion: StructuralVariantExt, tDeltaX: number, tTotalWidth: number){
        const {totalWidth, isLeftAligned} = fusion;
        const refTotalWidth = totalWidth || 0;
        const isRightAlignedAndLongest = !isLeftAligned && (refTotalWidth > tTotalWidth);
        const newDeltaX = isRightAlignedAndLongest ? tDeltaX - (refTotalWidth - tTotalWidth) : tDeltaX;
        return Object.assign({totalWidth}, fusion, {
            deltaX: newDeltaX
        });
    }

    static getSite1LongestFusion(previousFusions: StructuralVariantExt[]): StructuralVariantExt | undefined {
        const maxTotalWidth = Math.max.apply(Math, previousFusions
            .filter(fusion => !fusion.isLeftAligned)
            .map(fusion => fusion.totalWidth));
        return previousFusions.find(({totalWidth, isLeftAligned}) => {
            return totalWidth === maxTotalWidth && !isLeftAligned;
        })
    }

    static hasLongestSite1(fusion: StructuralVariantExt,
                           t: EnsemblTranscriptExt,
                           prevLongest: StructuralVariantExt | undefined): boolean {
        let longerThanPreviousLongest = true;
        const fusionTotalWidth = fusion.totalWidth || 0;
        const referenceTotalWidth = t.totalWidth ||  0;
        if (prevLongest) {
            prevLongest.totalWidth = prevLongest.totalWidth || 0;
            longerThanPreviousLongest = prevLongest ? fusionTotalWidth > prevLongest.totalWidth : true;
        }
        // Only when it's right aligned
        return (fusionTotalWidth > referenceTotalWidth) && !fusion.isLeftAligned && longerThanPreviousLongest;
    }

    static addDeltaX(
        fusion: StructuralVariantExt,
        transcript: EnsemblTranscriptExt,
        prevFusions: StructuralVariantExt[],
    ) {
        let prevSite1LongestVal = 0;
        const newFusion = Object.assign({totalWidth: 0, deltaX: 0}, fusion);
        const prevSite1Longest = ExonsChartStore.getSite1LongestFusion(prevFusions);
        const isFusionHasLongestSite1 = ExonsChartStore.hasLongestSite1(newFusion, transcript, prevSite1Longest);

        const refTotalWidth = transcript.totalWidth || 0;

        if (isFusionHasLongestSite1) {
            transcript.deltaX = newFusion.totalWidth - refTotalWidth;
        } else {
            if (prevSite1Longest) {
                prevSite1LongestVal =
                    prevSite1Longest.totalWidth ? prevSite1Longest.totalWidth : prevSite1LongestVal;
            }
            if (!newFusion.isLeftAligned && (newFusion.totalWidth > refTotalWidth) && (prevSite1LongestVal > 0)) {
                newFusion.deltaX = prevSite1LongestVal - newFusion.totalWidth;
            } else {
                newFusion.deltaX = transcript.deltaX || 0;
            }
        }
        prevFusions.push(newFusion);
        return newFusion;
    }

    addExtraTranscriptProps(transcript: EnsemblTranscriptExt): { fusions: StructuralVariantExt[], transcript: EnsemblTranscriptExt } {
        const prevFusions: StructuralVariantExt[] = [];
        const newTranscript = Object.assign({totalWidth: 0, deltaX: 0}, transcript);
        const newFusions = this.fusions
            .map(fusion => this.addExtraFusionProps(fusion))
            .filter(fusion => {
                // get only fusion data for the given transcript id
                return (
                    fusion.site1EnsemblTranscriptId === newTranscript.transcriptId ||
                    fusion.site2EnsemblTranscriptId === newTranscript.transcriptId
                );
            })
            .map(fusion => ExonsChartStore.addDeltaX(fusion, newTranscript, prevFusions))
            .map(fusion => ExonsChartStore.updateDeltaX(
                fusion,
                newTranscript.deltaX,
                newTranscript.totalWidth)
            );
        return {
            fusions: newFusions,
            transcript: newTranscript
        }
    }

    static addExonRangeProps(exonRanges: ExonRangeExt[], transcriptColor: string | undefined) {
        return exonRanges
            .sort((exon1: ExonRangeExt, exon2: ExonRangeExt) => exon1.rank - exon2.rank) // sort by rank
            .map((exonRange: ExonRangeExt) => {
                return Object.assign({}, exonRange, {
                    fillColor: exonRange.fillColor ? exonRange.fillColor : transcriptColor,
                    width: exonRange.exonEnd - exonRange.exonStart
                })
            })
    }

    static addExonProps(transcript: EnsemblTranscriptExt): EnsemblTranscriptExt {
        const {exons, fillColor} = transcript;
        const newExons = ExonsChartStore.addExonRangeProps(exons, fillColor);
        const totalWidth = ExonsChartStore.getTotalWidth(<ExonRangeExt[]> newExons);
        return Object.assign({deltaX: 0}, transcript, {
            exons: newExons,
            totalWidth: totalWidth,
        })
    }

    static getFivePrimeLength(transcript: EnsemblTranscriptExt): number {
        return !transcript.utrs ? 0 : transcript.utrs.reduce((accumulator, utr) => {
            // only calculate five prime
            let fivePrimeWidth = utr.type === UtrType.FivePrime ? utr.end - utr.start : 0;
            return accumulator + fivePrimeWidth;
        }, 0)
    }

    readonly computedTranscripts = remoteData({
        await: () => [this.transcripts],
        invoke: () => {
            const {result} = this.transcripts;
            const transcripts = (result || [])
                .map(ExonsChartStore.addExonProps)
                .filter(t => t.isReferenceGene) // get only reference gene transcripts
                .map(transcript => {
                    const pfams = this.getPfamDomainDetails(transcript.pfamDomains);
                    const res = this.addExtraTranscriptProps(transcript);
                    return Object.assign({}, res.transcript, {
                        // calculate five primes total length
                        fivePrimeLength: ExonsChartStore.getFivePrimeLength(transcript),
                        // // Add pfam domains data
                        pfamDomains: pfams,
                        // // Associate fusions with their reference gene transcipts
                        fusions: res.fusions
                    })
                });
            return Promise.resolve(transcripts)
        }
    });

    getPfamDomainDetails(pfamDomainRangeExts: PfamDomainRangeExt[]): PfamDomainRangeExt[] {
        return (pfamDomainRangeExts || [])
        // do not include empty objects
        .filter((pfam: PfamDomainRangeExt) => Object.keys(pfam).length > 0)
        // add fill color and calculate widths
        .map((pfam: PfamDomainRangeExt) => {
            const {result} = this.pfamDomainsById;
            const newPfam: any = Object.assign({}, pfam, {
                name: '',
                description: '',
                fillColor: 'orange',
                width: pfam.pfamDomainEnd - pfam.pfamDomainStart
            });
            // retrieve label and desc from pfamDomains
            if (result) {
                const pfamDomain = result[pfam.pfamDomainId][0];
                // add name and descriptions
                newPfam.name = pfamDomain.name;
                newPfam.description =pfamDomain.description;
            }
            return newPfam;
        });
    }
}
