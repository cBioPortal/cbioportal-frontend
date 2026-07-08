import * as React from 'react';
import LevelIcon from './icon/LevelIcon';
import styles from './occurrenceList.module.scss';

// A single OncoKB therapeutic level (e.g. "1", "R1") together with every
// distinct cancer type associated with that level for an alteration.
export type OncoKbLevelSummary = {
    level: string;
    cancerTypes: string[];
};

// Number of cancer types to show before collapsing the rest behind a
// "+ N more" control, mirroring the Occurrence column.
export const DEFAULT_VISIBLE_CANCER_TYPES = 3;

export const OncoKbLevelSummaryRow: React.FunctionComponent<{
    summary: OncoKbLevelSummary;
    initialVisibleCount?: number;
}> = ({ summary, initialVisibleCount = DEFAULT_VISIBLE_CANCER_TYPES }) => {
    const [expanded, setExpanded] = React.useState(false);
    const { level, cancerTypes } = summary;

    const hasOverflow = cancerTypes.length > initialVisibleCount;
    const visible =
        expanded || !hasOverflow
            ? cancerTypes
            : cancerTypes.slice(0, initialVisibleCount);
    const hiddenCount = cancerTypes.length - initialVisibleCount;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: 2,
            }}
        >
            <LevelIcon level={level} showDescription />
            {cancerTypes.length > 0 && (
                <span style={{ wordBreak: 'break-word' }}>
                    &nbsp;({visible.join(', ')}
                    {hasOverflow && (
                        <>
                            {!expanded && ' '}
                            <button
                                type="button"
                                className={styles.toggle}
                                aria-expanded={expanded}
                                onClick={() => setExpanded(prev => !prev)}
                            >
                                {expanded ? 'show less' : `+${hiddenCount} more`}
                            </button>
                        </>
                    )}
                    )
                </span>
            )}
        </div>
    );
};

// Renders the highest sensitive level and (if present) the highest resistance
// level for an alteration, each with its associated cancer types collapsed
// behind a "+ N more" control once there are more than three.
export const OncoKbLevelSummaryList: React.FunctionComponent<{
    highestSensitiveLevel?: OncoKbLevelSummary;
    highestResistanceLevel?: OncoKbLevelSummary;
}> = ({ highestSensitiveLevel, highestResistanceLevel }) => {
    if (!highestSensitiveLevel && !highestResistanceLevel) {
        return <span />;
    }
    return (
        <div>
            {highestSensitiveLevel && (
                <OncoKbLevelSummaryRow summary={highestSensitiveLevel} />
            )}
            {highestResistanceLevel && (
                <OncoKbLevelSummaryRow summary={highestResistanceLevel} />
            )}
        </div>
    );
};

export default OncoKbLevelSummaryList;
