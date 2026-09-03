import * as React from 'react';
import styles from './occurrenceList.module.scss';

export type OncoKbCancerTypeCount = {
    cancerType: string;
    count: number;
};

export type OncoKbOccurrenceListProps = {
    // Total sample count across all cancer types (the column's overall
    // occurrence). Kept separate from the per cancer type counts so callers can
    // reuse the existing OncoKbSummary data model as-is.
    total: number;
    cancerTypeCounts: OncoKbCancerTypeCount[];
    // Number of cancer types to show before collapsing the rest behind a
    // "+ N more" control.
    initialVisibleCount?: number;
};

export const DEFAULT_VISIBLE_COUNT = 2;

// Sort by count descending, then alphabetically by cancer type for ties.
export function sortCancerTypeCounts(
    cancerTypeCounts: OncoKbCancerTypeCount[]
): OncoKbCancerTypeCount[] {
    return [...cancerTypeCounts].sort((a, b) =>
        a.count !== b.count
            ? b.count - a.count
            : a.cancerType.localeCompare(b.cancerType)
    );
}

export const OncoKbOccurrenceList: React.FunctionComponent<OncoKbOccurrenceListProps> = ({
    total,
    cancerTypeCounts,
    initialVisibleCount = DEFAULT_VISIBLE_COUNT,
}) => {
    const [expanded, setExpanded] = React.useState(false);

    const sorted = React.useMemo(() => sortCancerTypeCounts(cancerTypeCounts), [
        cancerTypeCounts,
    ]);

    const hasOverflow = sorted.length > initialVisibleCount;
    const visible =
        expanded || !hasOverflow
            ? sorted
            : sorted.slice(0, initialVisibleCount);
    const hiddenCount = sorted.length - initialVisibleCount;

    const sampleLabel = total === 1 ? 'sample' : 'samples';
    const cancerTypeLabel =
        sorted.length === 1 ? 'cancer type' : 'cancer types';

    return (
        <div className={styles.occurrence}>
            <div className={styles.summary}>
                {sorted.length} {cancerTypeLabel} &middot; {total} {sampleLabel}
            </div>
            <div className={styles.list}>
                {visible.map(ct => (
                    <React.Fragment key={ct.cancerType}>
                        <span
                            className={styles.cancerType}
                            title={ct.cancerType}
                        >
                            {ct.cancerType}
                        </span>
                        <span className={styles.count}>{ct.count}</span>
                    </React.Fragment>
                ))}
                {hasOverflow && (
                    <button
                        type="button"
                        className={styles.toggle}
                        aria-expanded={expanded}
                        onClick={() => setExpanded(prev => !prev)}
                    >
                        {expanded ? 'Show less' : `+ ${hiddenCount} more`}
                    </button>
                )}
            </div>
        </div>
    );
};

export default OncoKbOccurrenceList;
