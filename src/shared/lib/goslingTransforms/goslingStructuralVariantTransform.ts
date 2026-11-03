/**
 * Converts cBioPortal structural variants into the BEDPE-like records used by
 * the Chromoscope (Gosling) visualization.
 */
import { CancerStudy, StructuralVariant } from 'cbioportal-ts-api-client';

export type ChromoscopeAssembly = 'hg19' | 'hg38';

export const SV_CLASS = {
    DELETION: 'Deletion',
    DUPLICATION: 'Duplication',
    INVERSION_TTT: 'Inversion (TtT)',
    INVERSION_HTH: 'Inversion (HtH)',
    TRANSLOCATION: 'Translocation',
    OTHER: 'Other',
} as const;

export type SvClass = typeof SV_CLASS[keyof typeof SV_CLASS];

export type Strand = '+' | '-' | '';

/** Which rule decided the SV class */
export type SvClassSource = 'class' | 'chromosomes' | 'connectionType' | 'none';

export interface GenomeVisualizationSV {
    chrom1: string;
    start1: number;
    end1: number;
    chrom2: string;
    start2: number;
    end2: number;
    /** Empty when the data has no Connection_Type */
    strand1: Strand;
    strand2: Strand;
    sv_id: string;
    svclass: SvClass;
    svclassSource: SvClassSource;
    sampleId: string;
    studyId: string;
    gene1: string;
    gene2: string;
    /** Class value as given in the data */
    originalClass: string;
    connectionType: string;
}

export interface ChromoscopeSVGroup {
    assembly: ChromoscopeAssembly;
    studyIds: string[];
    plotted: GenomeVisualizationSV[];
    /** Records of this assembly without coordinates for both breakpoints */
    missingCoordinatesCount: number;
}

export interface ChromoscopeSVGroups {
    groups: ChromoscopeSVGroup[];
    /** Records from studies whose reference genome cannot be drawn */
    unsupportedGenomeCount: number;
}

// The importer treats these as missing values
const MISSING_VALUES = new Set(['', 'NA', 'N/A', 'UNKNOWN', 'NONE', 'NULL']);

function isMissing(value: string | undefined | null): boolean {
    return (
        value === undefined ||
        value === null ||
        MISSING_VALUES.has(value.trim().toUpperCase())
    );
}

export function getChromoscopeAssembly(
    referenceGenome: string | undefined
): ChromoscopeAssembly | undefined {
    switch ((referenceGenome || '').trim().toLowerCase()) {
        case 'hg19':
        case 'grch37':
            return 'hg19';
        case 'hg38':
        case 'grch38':
            return 'hg38';
        default:
            return undefined;
    }
}

/**
 * Returns the chromosome as `chr1`..`chr22`, `chrX`, `chrY`, or undefined
 * when it cannot be placed on the ideogram.
 */
export function normalizeChromosome(
    chromosome: string | undefined | null
): string | undefined {
    if (isMissing(chromosome)) {
        return undefined;
    }
    const value = chromosome!.trim().replace(/^chr/i, '');
    if (/^\d+(\.0+)?$/.test(value)) {
        const n = parseInt(value, 10);
        if (n >= 1 && n <= 22) return `chr${n}`;
        if (n === 23) return 'chrX';
        if (n === 24) return 'chrY';
        return undefined;
    }
    const upper = value.toUpperCase();
    return upper === 'X' || upper === 'Y' ? `chr${upper}` : undefined;
}

function isValidPosition(position: number | undefined | null): boolean {
    return (
        typeof position === 'number' &&
        Number.isFinite(position) &&
        position > 0
    );
}

/**
 * Parses Connection_Type (Delly's CT convention) into breakpoint strands:
 * a 3' end is `+`, a 5' end is `-`.
 */
export function parseConnectionType(
    connectionType: string | undefined | null
): [Strand, Strand] | undefined {
    const match = /^([35])to([35])$/.exec(
        (connectionType || '').replace(/\s+/g, '').toLowerCase()
    );
    if (!match) {
        return undefined;
    }
    const toStrand = (end: string): Strand => (end === '3' ? '+' : '-');
    return [toStrand(match[1]), toStrand(match[2])];
}

type ClassCategory = 'DEL' | 'DUP' | 'INV' | 'TRA';

/** Maps the free-text Class column to a category, or undefined if unrecognized */
export function normalizeClass(
    variantClass: string | undefined | null
): ClassCategory | undefined {
    if (isMissing(variantClass)) {
        return undefined;
    }
    const value = variantClass!
        .trim()
        .toUpperCase()
        .replace(/[\s_-]+/g, ' ');
    if (/^(DEL|DELETION)$/.test(value)) return 'DEL';
    if (/^(DUP|DUPLICATION|TANDEM DUP|TANDEM DUPLICATION)$/.test(value))
        return 'DUP';
    if (/^(INV|INVERSION)\b/.test(value)) return 'INV';
    if (
        /^(TRA|TRANSLOCATION|INVERTED TRANSLOCATION|INTER ?CHR|INTER ?CHROMOSOMAL)\b/.test(
            value
        )
    )
        return 'TRA';
    return undefined;
}

function svClassFromStrands(strand1: Strand, strand2: Strand): SvClass {
    switch (`${strand1}${strand2}`) {
        case '+-':
            return SV_CLASS.DELETION;
        case '-+':
            return SV_CLASS.DUPLICATION;
        case '++':
            return SV_CLASS.INVERSION_HTH;
        case '--':
            return SV_CLASS.INVERSION_TTT;
        default:
            return SV_CLASS.OTHER;
    }
}

/**
 * Infers the SV class in order: the Class column; different chromosomes
 * (translocation); strands from Connection_Type. Breakpoints must already be
 * ordered by genomic position.
 */
export function inferSvClass(
    classCategory: ClassCategory | undefined,
    chrom1: string,
    chrom2: string,
    strands: [Strand, Strand] | undefined
): { svclass: SvClass; source: SvClassSource } {
    const fromClass = (svclass: SvClass) => ({
        svclass,
        source: 'class' as const,
    });
    switch (classCategory) {
        case 'DEL':
            return fromClass(SV_CLASS.DELETION);
        case 'DUP':
            return fromClass(SV_CLASS.DUPLICATION);
        case 'TRA':
            return fromClass(SV_CLASS.TRANSLOCATION);
        case 'INV': {
            const inferred = strands && svClassFromStrands(...strands);
            return fromClass(
                inferred === SV_CLASS.INVERSION_HTH ||
                    inferred === SV_CLASS.INVERSION_TTT
                    ? inferred
                    : SV_CLASS.OTHER
            );
        }
    }
    if (chrom1 !== chrom2) {
        return { svclass: SV_CLASS.TRANSLOCATION, source: 'chromosomes' };
    }
    return strands
        ? { svclass: svClassFromStrands(...strands), source: 'connectionType' }
        : { svclass: SV_CLASS.OTHER, source: 'none' };
}

function chromosomeOrder(chromosome: string): number {
    const value = chromosome.replace('chr', '');
    if (value === 'X') return 23;
    if (value === 'Y') return 24;
    return parseInt(value, 10);
}

/**
 * Converts one structural variant, or returns undefined when either
 * breakpoint lacks a chromosome or position.
 */
export function toGenomeVisualizationSV(
    sv: StructuralVariant,
    index: number
): GenomeVisualizationSV | undefined {
    const chromA = normalizeChromosome(sv.site1Chromosome);
    const chromB = normalizeChromosome(sv.site2Chromosome);
    if (
        !chromA ||
        !chromB ||
        !isValidPosition(sv.site1Position) ||
        !isValidPosition(sv.site2Position)
    ) {
        return undefined;
    }

    const strands = parseConnectionType(sv.connectionType);
    let site1 = {
        chrom: chromA,
        pos: sv.site1Position,
        strand: strands ? strands[0] : ('' as Strand),
        gene: sv.site1HugoSymbol || '',
    };
    let site2 = {
        chrom: chromB,
        pos: sv.site2Position,
        strand: strands ? strands[1] : ('' as Strand),
        gene: sv.site2HugoSymbol || '',
    };
    const orderA = chromosomeOrder(site1.chrom);
    const orderB = chromosomeOrder(site2.chrom);
    if (orderA > orderB || (orderA === orderB && site1.pos > site2.pos)) {
        [site1, site2] = [site2, site1];
    }

    const { svclass, source } = inferSvClass(
        normalizeClass(sv.variantClass),
        site1.chrom,
        site2.chrom,
        strands ? [site1.strand, site2.strand] : undefined
    );

    return {
        chrom1: site1.chrom,
        start1: site1.pos,
        end1: site1.pos + 1,
        chrom2: site2.chrom,
        start2: site2.pos,
        end2: site2.pos + 1,
        strand1: site1.strand,
        strand2: site2.strand,
        sv_id: `${sv.uniqueSampleKey}_${index}`,
        svclass,
        svclassSource: source,
        sampleId: sv.sampleId,
        studyId: sv.studyId,
        gene1: site1.gene,
        gene2: site2.gene,
        originalClass: sv.variantClass || '',
        connectionType: sv.connectionType || '',
    };
}

/**
 * Splits structural variants by the reference genome of their study. Records
 * from different reference genomes are never combined.
 */
export function groupStructuralVariantsByAssembly(
    structuralVariants: StructuralVariant[],
    studyIdToStudy: { [studyId: string]: CancerStudy }
): ChromoscopeSVGroups {
    const groups = new Map<ChromoscopeAssembly, ChromoscopeSVGroup>();
    let unsupportedGenomeCount = 0;

    structuralVariants.forEach((sv, index) => {
        const study = studyIdToStudy[sv.studyId];
        const assembly = getChromoscopeAssembly(study?.referenceGenome);
        if (!assembly) {
            unsupportedGenomeCount++;
            return;
        }
        if (!groups.has(assembly)) {
            groups.set(assembly, {
                assembly,
                studyIds: [],
                plotted: [],
                missingCoordinatesCount: 0,
            });
        }
        const group = groups.get(assembly)!;
        if (!group.studyIds.includes(sv.studyId)) {
            group.studyIds.push(sv.studyId);
        }
        const record = toGenomeVisualizationSV(sv, index);
        if (record) {
            group.plotted.push(record);
        } else {
            group.missingCoordinatesCount++;
        }
    });

    return {
        groups: Array.from(groups.values()),
        unsupportedGenomeCount,
    };
}
