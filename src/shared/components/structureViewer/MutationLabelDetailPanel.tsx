import * as React from 'react';
import classnames from 'classnames';
import { IMutationLabelSpec } from './StructureVisualizer';
import styles from './structureViewer.module.scss';

export interface IMutationLabelDetailPanelProps {
    // The full set of currently selected positions (shift-clicking several
    // lollipops/track items selects more than one at once); usually just
    // one entry.
    labels: IMutationLabelSpec[];
    // Which of `labels` is expanded/pinned in the 3D view right now.
    activeLabel: IMutationLabelSpec | null;
    onSelectLabel: (label: IMutationLabelSpec) => void;
    onClose: () => void;
    // When true, only the label header is shown — the compact view doesn't
    // have room for the full detail list.
    compact?: boolean;
}

export default function MutationLabelDetailPanel(
    props: IMutationLabelDetailPanelProps
) {
    // Clicking the active label/chip toggles the detail list in place —
    // blank header space does nothing, so it can't be mistaken for closing.
    // The list starts collapsed whenever a genuinely new selection lands
    // (e.g. a fresh shift-click from the lollipop plot), in both the compact
    // and expanded views. It does NOT reset just from switching the active
    // chip within an already-open roster — clicking a chip there both
    // selects it and opens its detail in one click (see the chip's onClick
    // below), so re-collapsing it out from under that click would make
    // browsing the roster feel like it always takes two clicks.
    const [expanded, setExpanded] = React.useState(false);
    const structurePosition = props.activeLabel?.structurePosition;
    const rosterKey = props.labels
        .map(label => label.structurePosition)
        .join(',');

    React.useEffect(() => {
        setExpanded(false);
    }, [rosterKey, props.compact]);

    if (!props.activeLabel) {
        return null;
    }

    const showList = expanded;

    return (
        <div
            className={classnames(styles['mutation-label-detail'], {
                [styles['mutation-label-detail--compact']]: !showList,
            })}
        >
            <div className={styles['mutation-label-detail-header']}>
                <div className={styles['mutation-label-roster']}>
                    {props.labels.map(label => {
                        const isActive =
                            label.structurePosition === structurePosition;
                        return (
                            <span
                                key={label.structurePosition}
                                className={classnames(
                                    styles['mutation-label-roster-chip'],
                                    {
                                        [styles[
                                            'mutation-label-roster-chip--active'
                                        ]]: isActive,
                                    }
                                )}
                                // Only clicking a chip itself acts. The
                                // active chip toggles the detail list;
                                // any other chip both selects it and
                                // opens its detail immediately — a
                                // second click on it (now active) is what
                                // collapses it again. Blank header space
                                // does nothing, so it can never be
                                // mistaken for closing. With a single
                                // selection there's only ever one (already
                                // active) chip, so this reduces to a plain
                                // expand/collapse toggle.
                                onClick={() => {
                                    if (isActive) {
                                        setExpanded(!expanded);
                                    } else {
                                        props.onSelectLabel(label);
                                        setExpanded(true);
                                    }
                                }}
                            >
                                {label.labelText}
                            </span>
                        );
                    })}
                </div>
                <button
                    type="button"
                    className="close"
                    aria-label="Close"
                    onClick={() => props.onClose()}
                >
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            {showList && (
                <ul className={styles['mutation-label-detail-list']}>
                    {props.activeLabel.detailLines.map(line => (
                        <li key={line}>{line}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
