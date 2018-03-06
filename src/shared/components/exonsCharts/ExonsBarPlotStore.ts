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
import {
    EnsemblTranscriptExt} from '../../model/Fusion';
import { ExonRangeExt, PfamDomainRangeExt, StructuralVariantExt } from '../../model/Fusion';

export default class ExonsBarPlotStore {

    public divider: number;

    constructor(public leftLabel: { label: string, isReference: boolean },
                public transcript: EnsemblTranscriptExt | StructuralVariantExt,
                public referenceGeneWidth?: number) {
        this.divider = 0.1;
    }

    @computed
    get computedTotalWidth(): number {
        return this.transcript.totalWidth * this.divider;
    }

    @computed
    get computedTotalRefGeneWidth(): number {
        let tmpWidth = this.referenceGeneWidth ? this.referenceGeneWidth : this.transcript.totalWidth;
        return tmpWidth * this.divider;
    }

    @computed
    get computedDeltaX(): number {
        return this.transcript.deltaX * this.divider;
    }

    @computed
    get deltaXPos(): number {
        let refGeneWidth = this.referenceGeneWidth ? this.referenceGeneWidth : this.transcript.totalWidth;
        if (this.transcript.isLeftAligned) {
            return this.transcript.deltaX * this.divider;
        } else {
            return this.transcript.totalWidth > refGeneWidth ?
                this.computedDeltaX : this.computedDeltaX + (this.computedTotalRefGeneWidth - this.computedTotalWidth);
        }
    }

    @computed
    get computedPfams(): PfamDomainRangeExt[] {
        let pfamDomains: PfamDomainRangeExt[] = <PfamDomainRangeExt[]> this.transcript.pfamDomains;
        return (pfamDomains || []).map( pfam => {
            const start = (pfam.pfamDomainStart * 3 * this.divider);
            const fivePrimeLength = this.transcript.fivePrimeLength * this.divider;
            pfam.x = start + fivePrimeLength + this.deltaXPos;
            return pfam;
        });
    }

    @computed
    get computedExons(): ExonRangeExt[] {
        let prevExon: ExonRangeExt;
        return (this.transcript.exons || []).map( exon => {
            exon.x = prevExon ? prevExon.x + (prevExon.width * this.divider) : this.deltaXPos;
            prevExon = exon;
            return exon;
        });
    }
}
