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

import { computed } from "mobx";
import { CancerStudy, Gene } from '../../api/generated/CBioPortalAPI';
import { PfamDomain } from '../../api/generated/GenomeNexusAPI';
import ResultViewFusionMapperDataStore from '../../../pages/resultsView/fusion/ResultViewFusionMapperDataStore';
import {
    EnsemblTranscriptExt, UtrType
} from '../../model/Fusion';
import { ExonRangeExt, PfamDomainRangeExt, StructuralVariantExt } from '../../model/Fusion';

export class ExonsChartStore {

    constructor(public gene: Gene,
                public fusionDataStore: ResultViewFusionMapperDataStore,
                public transcripts: EnsemblTranscriptExt[],
                public study: { [studyId: string]: CancerStudy },
                public pfamDomains: PfamDomain[],
                public isLoadingEnsemblTranscripts: boolean
    ) {}

    getExonsBySite(siteId: number, transcriptId: string, breakpoint: number): Array<ExonRangeExt> {
        let exons: Array<ExonRangeExt> = [];
        if (siteId === 1 || siteId === 2) {
            let _t = this.getTranscriptById(transcriptId)[0];
            let _sortedExons = <ExonRangeExt[]> _t.exons.sort(
                // sort exons by rank
                (exon1: ExonRangeExt, exon2: ExonRangeExt) => exon1.rank - exon2.rank
            );
            exons =
                siteId < 2
                    ? _sortedExons.filter(exon => exon.rank <= breakpoint)
                    : _sortedExons.filter(exon => exon.rank >= breakpoint);
        }
        return exons;
    }

    getTranscriptById(transcriptId: string): Array<EnsemblTranscriptExt> {
        return (this.transcripts || []).filter(d => {
            return d.transcriptId === transcriptId;
        });
    }

    @computed
    get computedFusions(): StructuralVariantExt[] {
        return (this.fusionDataStore || {tableData:[]}).tableData.map((f: StructuralVariantExt[]) => {
            let site1Exons = this.getExonsBySite(
                1,
                f[0].site1EnsemblTranscriptId,
                f[0].site1Exon
            );
            let site2Exons = this.getExonsBySite(
                2,
                f[0].site2EnsemblTranscriptId,
                f[0].site2Exon
            );
            f[0].isLeftAligned = f[0].site1HugoSymbol === this.gene.hugoGeneSymbol;
            f[0].exons = site1Exons.concat(site2Exons);
            f[0].totalWidth = this.getTotalWidth(f[0].exons);
            return f[0];
        });
    }

    getTotalWidth(exons: ExonRangeExt[]): number {
        return exons.reduce((accumulator, e) => {
            return accumulator + e.width;
        }, 0);
    }

    @computed
    get computedTranscripts(): EnsemblTranscriptExt[] {
        return (this.transcripts || []).map(t => {
            t.exons = <ExonRangeExt[]> t.exons
                .sort(
                    // sort exons by rank
                    (exon1, exon2) => exon1.rank - exon2.rank
                )
                .map((e: ExonRangeExt) => {
                    // add color
                    e.fillColor = e.fillColor ? e.fillColor : t.fillColor;
                    // calculate width of exon
                    e.width = e.exonEnd - e.exonStart;
                    return e;
                });
            t.totalWidth = this.getTotalWidth(<ExonRangeExt[]> t.exons);
            t.deltaX = 0; // initialise delta for the x axis
            return t;
        });
    }

    getPfamDomainDetails(pfamDomains: PfamDomainRangeExt[]): PfamDomainRangeExt[] {
        return (pfamDomains || [])
        // do not include empty objects
            .filter((pfam: PfamDomainRangeExt) => Object.keys(pfam).length > 0)
            // add fill color and calculate widths
            .map((pfam: PfamDomainRangeExt) => {
                // retrieve label and desc from pfamDomains
                const pfamDomain = this.pfamDomains.find(
                    domain => domain.pfamAccession === pfam.pfamDomainId);
                // add name and descriptions
                pfam.name = pfamDomain ? pfamDomain.name : '';
                pfam.description = pfamDomain ? pfamDomain.description : '';
                // add color
                pfam.fillColor = 'orange';
                // calculate width of pfam
                pfam.width = pfam.pfamDomainEnd - pfam.pfamDomainStart;
                return pfam;
            });
    }

    @computed
    get referenceTranscripts(): EnsemblTranscriptExt[] {
        return (this.computedTranscripts || [])
                .filter(t => t.isReferenceGene) // get only reference gene transcripts
                .map(t => {
                    // calculate five primes total length
                    t.fivePrimeLength = !t.utrs ? 0 : t.utrs.reduce((accumulator, utr) => {
                        // only calculate five prime
                        let fivePrimeWidth = utr.type === UtrType.FivePrime ? utr.end - utr.start : 0;
                        return accumulator + fivePrimeWidth;
                    }, 0);
                    // Add pfam domains data
                    t.pfamDomains = this.getPfamDomainDetails(t.pfamDomains);
                    return t;
                });
    }

    getFusionDetails(t: EnsemblTranscriptExt): StructuralVariantExt[] {
        let prevFusions: StructuralVariantExt[] = [];
        let site1LongestValue: number = 0;
        let site1LongestFusion: StructuralVariantExt[];
        let isCurrentFusionHasLongestSite1: boolean;
        return this.computedFusions
            // get only fusion data for the given transcript id
            .filter(fusion => {
                return (
                    fusion.site1EnsemblTranscriptId === t.transcriptId ||
                    fusion.site2EnsemblTranscriptId === t.transcriptId
                );
            })
            .map(fusion => {
                // get delta for the x position
                if (!prevFusions.length) {
                    isCurrentFusionHasLongestSite1 = (fusion.totalWidth > t.totalWidth) && !fusion.isLeftAligned;
                    t.deltaX = isCurrentFusionHasLongestSite1 ? fusion.totalWidth - t.totalWidth : t.deltaX;
                    fusion.deltaX = isCurrentFusionHasLongestSite1 ? 0 : t.deltaX;
                } else {
                    // get longest width of site 1
                    let site1Fusions = prevFusions.filter(fusion => !fusion.isLeftAligned);
                    site1LongestValue = Math.max.apply(Math, site1Fusions.map(f => f.totalWidth));
                    site1LongestFusion = site1Fusions.filter(f => f.totalWidth === site1LongestValue && !f.isLeftAligned);
                    // check if current one is the longest site1
                    isCurrentFusionHasLongestSite1 = (fusion.totalWidth > t.totalWidth) &&
                        (fusion.totalWidth > site1LongestValue) &&
                        !fusion.isLeftAligned;
                    // if it is
                    if (isCurrentFusionHasLongestSite1) {
                        // update ref transcript delta x
                        t.deltaX = fusion.totalWidth - t.totalWidth;
                        // update all previous fusions delta x and not any of them is the longetst anymore
                        prevFusions = prevFusions.map(prefFusion => {
                            if (!prefFusion.isLeftAligned && (prefFusion.totalWidth > t.totalWidth)) {
                                prefFusion.deltaX = t.deltaX - (prefFusion.totalWidth - t.totalWidth);
                            } else {
                                prefFusion.deltaX = t.deltaX;
                            }
                            return prefFusion
                        });
                        fusion.deltaX = 0;
                    } else {
                        if (!fusion.isLeftAligned && (fusion.totalWidth > t.totalWidth) && site1LongestFusion.length) {
                            fusion.deltaX = site1LongestFusion[0].totalWidth - fusion.totalWidth;
                        } else {
                            fusion.deltaX = t.deltaX;
                        }
                    }
                }
                prevFusions.push(fusion);
                return fusion;
            });
    }

    /**
     * Associate fusions with their reference gene transcipts
     * @returns {EnsemblTranscriptExt[]}
     */
    @computed
    get fusionsByReferences(): EnsemblTranscriptExt[] {
        return (this.referenceTranscripts || []).map(t => {
                // add fusions
                t.fusions = this.getFusionDetails(t);
                return t;
            });
    }
}
