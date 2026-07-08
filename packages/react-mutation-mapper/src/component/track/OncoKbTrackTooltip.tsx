import * as React from 'react';
import _ from 'lodash';

import {
    IndicatorQueryResp,
    Mutation,
    isSomaticIndicator,
} from 'cbioportal-utils';

import {
    OncoKbSummaryTable,
    OncoKbSummary,
    OncoKbLevelSummary,
    OncogenicIcon,
    LEVELS,
    getTumorTypeName,
} from 'oncokb-frontend-commons';
import {
    getGermlineCdnaChange,
    IndexedVariantAnnotations,
} from '../column/OncoKbAlterationHelper';
import styles from './oncoKbTrackTooltipSummary.module.scss';

type OncoKbTrackTooltipProps = {
    usingPublicOncoKbInstance: boolean;
    mutations: Mutation[];
    indicatorData?: IndicatorQueryResp[];
    hugoGeneSymbol?: string;
    indexedVariantAnnotations?: IndexedVariantAnnotations;
    // Maps a lowercased tumor type (as OncoKB echoes it back) to the study's
    // original clinical casing, so the displayed cancer type matches the
    // mutation table instead of OncoKB's lowercased value.
    originalTumorTypeCasing?: { [lowerCasedTumorType: string]: string };
};

export function oncoKbTooltip(
    usingPublicOncoKbInstance: boolean,
    indicatorData: IndicatorQueryResp[],
    mutations: Mutation[] = [],
    indexedVariantAnnotations?: IndexedVariantAnnotations,
    originalTumorTypeCasing: { [lowerCasedTumorType: string]: string } = {}
) {
    const sampleCount = indicatorData.length;

    // generate info

    const pluralSuffix = sampleCount > 1 ? 's' : undefined;
    // Break the total sample count down by clinical implication so the summary
    // shows how many samples fall into each category instead of a single
    // opaque total. Oncogenic and Pathogenic (somatic vs germline) share a
    // bucket, as do their "Likely" counterparts, since they carry the same
    // meaning and the same OncoKB icon.
    const implicationBuckets = summarizeImplications(indicatorData);

    // For germline mutations the OncoKB alteration is the (gene-less) HGVSc cDNA
    // change returned in query.alteration, so map that cDNA change back to its
    // protein change to show "HGVSc (protein change)".
    const proteinChangeByAlteration = _.chain(mutations)
        .keyBy(
            mutation =>
                getGermlineCdnaChange(mutation, indexedVariantAnnotations) ||
                mutation.proteinChange
        )
        .mapValues(mutation => mutation.proteinChange)
        .value();

    const groupedByAlteration = _.groupBy(indicatorData, d => d.query.alteration);
    const tableData = _.map(
        _.keys(groupedByAlteration),
        (alteration): OncoKbSummary => {
            const indicators = groupedByAlteration[alteration];
            const baseRow = {
                count: indicators.length,
                // Germline and somatic alterations use different alteration
                // keys (HGVSc vs protein change), so an alteration group is
                // homogeneous; label it Somatic only if every indicator is.
                setting: indicators.every(isSomaticIndicator)
                    ? ('Somatic' as const)
                    : ('Germline' as const),
                alteration: alteration,
                proteinChange: proteinChangeByAlteration[alteration],
                clinicalImplication: _.uniq(
                    indicators.map(indicator =>
                        isSomaticIndicator(indicator)
                            ? indicator.oncogenic || 'Unknown'
                            : indicator.pathogenic || 'Unknown'
                    )
                ),
            };

            // For the public OncoKB instance the level column is hidden and the
            // per cancer type breakdown is not shown, so keep a single row per
            // alteration with just the total occurrence count.
            if (usingPublicOncoKbInstance) {
                return { ...baseRow, cancerTypeCounts: [] };
            }

            // Collapse every sample for this alteration onto one row. The
            // Occurrence column breaks the total down by the study cancer type
            // (query.tumorType, from the study/sample rather than the OncoKB
            // level-associated cancer type), and the Highest Level column shows
            // the highest sensitive and resistance levels across all of them,
            // each with their associated (OncoKB level) cancer types.
            const groupedByStudyCancerType = _.groupBy(
                indicators,
                indicator => indicator.query.tumorType || ''
            );
            const cancerTypeCounts = _.keys(groupedByStudyCancerType).map(
                cancerType => ({
                    // Restore the study's original casing for the cancer type,
                    // falling back to OncoKB's echoed value. OncoKB does not
                    // echo the tumor type in a predictable case, so match on
                    // the lowercased form (the map is keyed the same way).
                    cancerType:
                        originalTumorTypeCasing[cancerType.toLowerCase()] ||
                        cancerType ||
                        'Unknown',
                    count: groupedByStudyCancerType[cancerType].length,
                })
            );

            const levelSummaries = collectLevelSummaries(indicators);

            return {
                ...baseRow,
                cancerTypeCounts,
                highestSensitiveLevel: levelSummaries.sensitive,
                highestResistanceLevel: levelSummaries.resistance,
            };
        }
    );

    // generate the tooltip

    return (
        <span>
            <div className={styles.summary}>
                <span className={styles.total}>
                    <b>{sampleCount}</b> sample{pluralSuffix}
                </span>
                {implicationBuckets.map(bucket => (
                    <span className={styles.chip} key={bucket.label}>
                        <OncogenicIcon oncogenicity={bucket.oncogenicity} />
                        <span className={styles.chipLabel}>{bucket.label}</span>
                        <span className={styles.chipCount}>{bucket.count}</span>
                    </span>
                ))}
            </div>
            <OncoKbSummaryTable
                usingPublicOncoKbInstance={usingPublicOncoKbInstance}
                data={tableData}
            />
        </span>
    );
}

export type OncoKbImplicationBucket = {
    // Display label for the category, e.g. "Oncogenic/Pathogenic".
    label: string;
    // Value handed to the OncoKB oncogenicity icon for this bucket.
    oncogenicity: string;
    // Number of samples (indicators) that fall into the category.
    count: number;
};

// Oncogenic (somatic) and Pathogenic (germline) samples share one bucket so
// their counts combine, as do their "Likely" counterparts. The label, however,
// only reads "Oncogenic/Pathogenic" when both actually occur (see resolveBucket).
const ONCOGENIC_GROUP = 'oncogenic-pathogenic';
const LIKELY_GROUP = 'likely-oncogenic-pathogenic';

// Buckets are shown in descending clinical significance; anything OncoKB returns
// that isn't listed here (e.g. germline Benign/VUS values) is appended after
// these, ordered by sample count. Keys are the normalized (lowercased) group.
const IMPLICATION_ORDER = [
    ONCOGENIC_GROUP,
    LIKELY_GROUP,
    'resistance',
    'inconclusive',
    'likely neutral',
    'neutral',
    'unknown',
];

type RawImplicationBucket = {
    group: string;
    count: number;
    // Normalized raw terms seen in this group, so the label can reflect whether
    // both oncogenic and pathogenic samples are present.
    terms: Set<string>;
    // Original-cased value for groups that aren't merged (used as their label).
    fallbackLabel: string;
};

// Assign a raw OncoKB oncogenic/pathogenic string to its bucket group.
function toImplicationGroup(normalized: string): string {
    if (normalized === 'oncogenic' || normalized === 'pathogenic') {
        return ONCOGENIC_GROUP;
    }
    if (
        normalized === 'likely oncogenic' ||
        normalized === 'likely pathogenic'
    ) {
        return LIKELY_GROUP;
    }
    return normalized;
}

// Resolve a bucket's display label and icon value. For the merged groups the
// label only combines to "Oncogenic/Pathogenic" when both terms are present;
// otherwise it shows just the one that occurs.
function resolveBucket(bucket: RawImplicationBucket): OncoKbImplicationBucket {
    if (bucket.group === ONCOGENIC_GROUP || bucket.group === LIKELY_GROUP) {
        const prefix = bucket.group === LIKELY_GROUP ? 'Likely ' : '';
        const lowerPrefix = prefix.toLowerCase();
        const hasOncogenic = bucket.terms.has(`${lowerPrefix}oncogenic`);
        const hasPathogenic = bucket.terms.has(`${lowerPrefix}pathogenic`);

        const label =
            hasOncogenic && hasPathogenic
                ? `${prefix}Oncogenic/Pathogenic`
                : hasPathogenic
                ? `${prefix}Pathogenic`
                : `${prefix}Oncogenic`;

        // Oncogenic and Pathogenic share the same OncoKB icon glyph; pick a
        // clean single value so the icon tooltip reads sensibly.
        const oncogenicity = hasOncogenic
            ? `${prefix}Oncogenic`
            : `${prefix}Pathogenic`;

        return { label, oncogenicity, count: bucket.count };
    }
    return {
        label: bucket.fallbackLabel,
        oncogenicity: bucket.fallbackLabel,
        count: bucket.count,
    };
}

// Bucket every indicator by clinical implication, count samples per bucket, and
// order the buckets by clinical significance (then by sample count for ties).
export function summarizeImplications(
    indicatorData: IndicatorQueryResp[]
): OncoKbImplicationBucket[] {
    const buckets: { [group: string]: RawImplicationBucket } = {};

    indicatorData.forEach(indicator => {
        const value = (
            (isSomaticIndicator(indicator)
                ? indicator.oncogenic
                : indicator.pathogenic) || 'Unknown'
        ).trim();
        const normalized = value.toLowerCase();
        const group = toImplicationGroup(normalized);

        if (!buckets[group]) {
            buckets[group] = {
                group,
                count: 0,
                terms: new Set(),
                fallbackLabel: value,
            };
        }
        buckets[group].count += 1;
        buckets[group].terms.add(normalized);
    });

    const ordered = _.orderBy(
        _.values(buckets),
        [
            bucket => {
                const index = IMPLICATION_ORDER.indexOf(bucket.group);
                return index === -1 ? IMPLICATION_ORDER.length : index;
            },
            bucket => bucket.count,
        ],
        ['asc', 'desc']
    );

    return ordered.map(resolveBucket);
}

// Across a set of indicators (samples), find the highest sensitive level and
// the highest resistance level, each paired with every distinct cancer type
// associated with that level.
//
// OncoKB can return a level-associated tumor type that has no code/subtype but
// does carry a mainType (e.g. category terms like "All Solid Tumors"), so the
// display name is resolved with getTumorTypeName, which falls back to
// mainType.name instead of dropping the cancer type entirely.
export function collectLevelSummaries(
    indicatorData: IndicatorQueryResp[]
): { sensitive?: OncoKbLevelSummary; resistance?: OncoKbLevelSummary } {
    // Distinct cancer type names per parsed level (e.g. "1", "R1").
    const cancerTypesByLevel: { [level: string]: Set<string> } = {};

    indicatorData.forEach(indicator => {
        indicator.treatments.forEach(treatment => {
            const parts = treatment.level.split('_');
            const level = parts.length === 2 ? parts[1] : treatment.level;
            const cancerType = getTumorTypeName(
                treatment.levelAssociatedCancerType
            );

            if (!cancerTypesByLevel[level]) {
                cancerTypesByLevel[level] = new Set();
            }
            if (cancerType) {
                cancerTypesByLevel[level].add(cancerType);
            }
        });
    });

    // Among the candidate levels that actually occur, pick the highest (larger
    // LEVELS.all index = higher level) and return its aggregated cancer types.
    const pickHighest = (
        candidateLevels: string[]
    ): OncoKbLevelSummary | undefined => {
        const present = candidateLevels.filter(
            level => cancerTypesByLevel[level]
        );
        if (present.length === 0) {
            return undefined;
        }
        const level = _.maxBy(present, l => LEVELS.all.indexOf(l))!;
        return {
            level,
            cancerTypes: _.orderBy(Array.from(cancerTypesByLevel[level])),
        };
    };

    return {
        sensitive: pickHighest(LEVELS.sensitivity),
        resistance: pickHighest(LEVELS.resistance),
    };
}

export const OncoKbTrackTooltip: React.FunctionComponent<OncoKbTrackTooltipProps> = props => {
    return props.indicatorData
        ? oncoKbTooltip(
              props.usingPublicOncoKbInstance,
              props.indicatorData,
              props.mutations,
              props.indexedVariantAnnotations,
              props.originalTumorTypeCasing
          )
        : null;
};
