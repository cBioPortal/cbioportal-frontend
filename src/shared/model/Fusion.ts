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

import {
    EnsemblTranscript,
    Exon,
    PfamDomain,
    PfamDomainRange,
} from 'genome-nexus-ts-api-client/src';
import { StructuralVariant } from 'cbioportal-ts-api-client/src';
import { SampleMolecularIdentifier } from 'cbioportal-ts-api-client';

export type ExonRangeExt = Exon & {
    fillColor?: string;
    width?: number;
    x?: number;
};

export enum UtrType {
    FivePrime = 'five_prime_UTR',
    ThreePrime = 'three_prime_UTR',
}

export type PfamDomainRangeExt = PfamDomainRange & {
    fillColor?: string;
    width?: number;
    x?: number;
    name?: string;
    description?: string;
};
export type StructuralVariantExt = StructuralVariant & {
    [index: string]: any;
    isLeftAligned?: boolean;
    isReferenceGene?: boolean;
    fillColor?: string;
    totalWidth?: number;
    deltaX?: number;
    exons?: ExonRangeExt[];
    label?: string;
    //added AARON  (these are requested by code)
};

export type EnsemblTranscriptExt = EnsemblTranscript & {
    [index: string]: any;
    isLeftAligned?: boolean;
    isReferenceGene?: boolean;
    fillColor?: string;
    fusions?: StructuralVariantExt[];
    totalWidth?: number;
    deltaX?: number;
    exons?: ExonRangeExt[];
    fivePrimeLength?: number;
    pfamDomains?: PfamDomainRangeExt[];
};

export type StructuralVariantFilterExt = {
    entrezGeneIds: number[];
    molecularProfileIds?: string[] | undefined;
    sampleMolecularIdentifiers?: SampleMolecularIdentifier[] | undefined;
};
