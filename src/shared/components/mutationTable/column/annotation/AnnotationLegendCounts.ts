import { IAnnotation } from 'react-mutation-mapper';
import {
    isSomaticIndicator,
    normalizeOncogenicity,
} from 'oncokb-frontend-commons';

export enum OncokbOncogenicIconEnum {
    ONCOGENIC = 'oncogenic',
    NUETRAL = 'neutral',
    INCONCLUSIVE = 'inconclusive',
    VUS = 'vus',
    UNKNOWN = 'unknown',
}

export const ONCOKB_PATHOGENIC = 'pathogenic';

export enum HotspotGroup {
    RECURRENT = 'recurrent',
    CLUSTERED_3D = '3d',
    NONE = 'none',
}

export enum CivicGroup {
    WITH_VARIANTS = 'variants',
    NO_VARIANTS = 'noVariants',
    NONE = 'none',
}

/**
 * Keywords for the table search box that filter the annotation column. Each
 * one matches the mutations counted in the corresponding legend row.
 */
export const ANNOTATION_FILTER_KEYWORD = {
    oncogenicity: (group: string) => `ONCOKB:${group.toUpperCase()}`,
    // level as in the OncoKB API, e.g. LEVEL_1, LEVEL_R1, LEVEL_Dx1
    level: (level: string) => `ONCOKB:${level.toUpperCase()}`,
    hotspot: (group: HotspotGroup) =>
        group === HotspotGroup.RECURRENT
            ? 'HOTSPOT'
            : `HOTSPOT:${group.toUpperCase()}`,
    civic: (group: CivicGroup) =>
        group === CivicGroup.WITH_VARIANTS
            ? 'CIVIC'
            : `CIVIC:${group.toUpperCase()}`,
};

export function getOncogenicityGroup(
    annotation: IAnnotation
): string | undefined {
    const indicator = annotation.oncoKbIndicator;
    if (!indicator) {
        return OncokbOncogenicIconEnum.UNKNOWN;
    }
    if (!isSomaticIndicator(indicator)) {
        const pathogenicity = normalizeOncogenicity(indicator.pathogenic);
        return pathogenicity === 'pathogenic' ||
            pathogenicity === 'likely-pathogenic'
            ? ONCOKB_PATHOGENIC
            : undefined;
    }
    switch (normalizeOncogenicity(indicator.oncogenic)) {
        case 'oncogenic':
        case 'likely-oncogenic':
        case 'resistance':
            return OncokbOncogenicIconEnum.ONCOGENIC;
        case 'neutral':
        case 'likely-neutral':
            return OncokbOncogenicIconEnum.NUETRAL;
        case 'inconclusive':
            return OncokbOncogenicIconEnum.INCONCLUSIVE;
        default:
            return indicator.vus
                ? OncokbOncogenicIconEnum.VUS
                : OncokbOncogenicIconEnum.UNKNOWN;
    }
}

// highest OncoKB levels of the mutation, e.g. LEVEL_1, LEVEL_R1, LEVEL_Dx2
export function getHighestLevels(annotation: IAnnotation): string[] {
    const indicator = annotation.oncoKbIndicator;
    if (!indicator) {
        return [];
    }
    return [
        isSomaticIndicator(indicator)
            ? indicator.highestSensitiveLevel
            : undefined,
        indicator.highestResistanceLevel,
        indicator.highestDiagnosticImplicationLevel,
        indicator.highestPrognosticImplicationLevel,
    ].filter((level): level is NonNullable<typeof level> => !!level);
}

export function getHotspotGroup(annotation: IAnnotation): HotspotGroup {
    if (annotation.isHotspot) {
        return HotspotGroup.RECURRENT;
    } else if (annotation.is3dHotspot) {
        return HotspotGroup.CLUSTERED_3D;
    }
    return HotspotGroup.NONE;
}

export function getCivicGroup(annotation: IAnnotation): CivicGroup {
    if (!annotation.civicEntry) {
        return CivicGroup.NONE;
    }
    return annotation.hasCivicVariants
        ? CivicGroup.WITH_VARIANTS
        : CivicGroup.NO_VARIANTS;
}

/**
 * Filter keywords that match the given annotation, e.g. ONCOKB:ONCOGENIC,
 * ONCOKB:LEVEL_1 or HOTSPOT.
 */
export function getAnnotationFilterKeywords(annotation: IAnnotation): string[] {
    const keywords = [
        ANNOTATION_FILTER_KEYWORD.hotspot(getHotspotGroup(annotation)),
        ANNOTATION_FILTER_KEYWORD.civic(getCivicGroup(annotation)),
        ...getHighestLevels(annotation).map(ANNOTATION_FILTER_KEYWORD.level),
    ];
    const oncogenicity = getOncogenicityGroup(annotation);
    if (oncogenicity) {
        keywords.push(ANNOTATION_FILTER_KEYWORD.oncogenicity(oncogenicity));
    }
    return keywords;
}

// cheap check before computing the annotation of every row for a search
export function isAnnotationFilterKeyword(filterStringUpper: string) {
    return /^(ONCOKB:|HOTSPOT|CIVIC)/.test(filterStringUpper);
}

export function annotationMatchesFilter(
    annotation: IAnnotation,
    filterStringUpper: string
): boolean {
    return getAnnotationFilterKeywords(annotation).includes(filterStringUpper);
}

export type AnnotationCounts = {
    total: number;
    pending: boolean;
    // count per filter keyword
    byKeyword: { [keyword: string]: number };
};

export function countAnnotations(annotations: IAnnotation[]): AnnotationCounts {
    const byKeyword: { [keyword: string]: number } = {};
    let pending = false;
    for (const annotation of annotations) {
        if (
            annotation.oncoKbStatus === 'pending' ||
            annotation.hotspotStatus === 'pending' ||
            annotation.civicStatus === 'pending'
        ) {
            pending = true;
        }
        for (const keyword of getAnnotationFilterKeywords(annotation)) {
            byKeyword[keyword] = (byKeyword[keyword] || 0) + 1;
        }
    }
    return { total: annotations.length, pending, byKeyword };
}
