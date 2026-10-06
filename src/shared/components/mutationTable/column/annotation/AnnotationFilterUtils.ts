import { IAnnotation } from 'react-mutation-mapper';
import {
    isSomaticIndicator,
    normalizeOncogenicity,
} from 'oncokb-frontend-commons';
import { optionId } from 'shared/components/sectionedFilterMenu/SectionedFilterUtils';

/**
 * Annotation column filter options, grouped by annotation source, e.g.
 * "oncogenicity:oncogenic", "level:LEVEL_1", "hotspot:3d" or "civic:none"
 * (see SectionedFilterUtils).
 */
export enum AnnotationFilterSource {
    ONCOGENICITY = 'oncogenicity',
    LEVEL = 'level',
    HOTSPOT = 'hotspot',
    CIVIC = 'civic',
}

export enum OncogenicityOption {
    ONCOGENIC = 'oncogenic',
    NEUTRAL = 'neutral',
    INCONCLUSIVE = 'inconclusive',
    VUS = 'vus',
    UNKNOWN = 'unknown',
    PATHOGENIC = 'pathogenic',
}

export enum HotspotOption {
    RECURRENT = 'recurrent',
    CLUSTERED_3D = '3d',
    NONE = 'none',
}

export enum CivicOption {
    WITH_VARIANTS = 'variants',
    NO_VARIANTS = 'noVariants',
    NONE = 'none',
}

export function annotationOptionId(
    source: AnnotationFilterSource,
    value: string
) {
    return optionId(source, value);
}

// the oncogenicity group of the OncoKB icon shown for the mutation
export function getOncogenicityOption(
    annotation: IAnnotation
): OncogenicityOption | undefined {
    const indicator = annotation.oncoKbIndicator;
    if (!indicator) {
        return OncogenicityOption.UNKNOWN;
    }
    if (!isSomaticIndicator(indicator)) {
        const pathogenicity = normalizeOncogenicity(indicator.pathogenic);
        return pathogenicity === 'pathogenic' ||
            pathogenicity === 'likely-pathogenic'
            ? OncogenicityOption.PATHOGENIC
            : undefined;
    }
    switch (normalizeOncogenicity(indicator.oncogenic)) {
        case 'oncogenic':
        case 'likely-oncogenic':
        case 'resistance':
            return OncogenicityOption.ONCOGENIC;
        case 'neutral':
        case 'likely-neutral':
            return OncogenicityOption.NEUTRAL;
        case 'inconclusive':
            return OncogenicityOption.INCONCLUSIVE;
        default:
            return indicator.vus
                ? OncogenicityOption.VUS
                : OncogenicityOption.UNKNOWN;
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

export function getHotspotOption(annotation: IAnnotation): HotspotOption {
    if (annotation.isHotspot) {
        return HotspotOption.RECURRENT;
    } else if (annotation.is3dHotspot) {
        return HotspotOption.CLUSTERED_3D;
    }
    return HotspotOption.NONE;
}

export function getCivicOption(annotation: IAnnotation): CivicOption {
    if (!annotation.civicEntry) {
        return CivicOption.NONE;
    }
    return annotation.hasCivicVariants
        ? CivicOption.WITH_VARIANTS
        : CivicOption.NO_VARIANTS;
}

// all filter options that match the given annotation
export function getAnnotationOptionIds(annotation: IAnnotation): string[] {
    const ids = [
        annotationOptionId(
            AnnotationFilterSource.HOTSPOT,
            getHotspotOption(annotation)
        ),
        annotationOptionId(
            AnnotationFilterSource.CIVIC,
            getCivicOption(annotation)
        ),
        ...getHighestLevels(annotation).map(level =>
            annotationOptionId(AnnotationFilterSource.LEVEL, level)
        ),
    ];
    const oncogenicity = getOncogenicityOption(annotation);
    if (oncogenicity) {
        ids.push(
            annotationOptionId(
                AnnotationFilterSource.ONCOGENICITY,
                oncogenicity
            )
        );
    }
    return ids;
}
