import * as React from 'react';
import classnames from 'classnames';
import { IMutationLabelSpec } from './StructureVisualizer';
import styles from './structureViewer.module.scss';

export interface IMutationLabelDetailPanelProps {
    label: IMutationLabelSpec | null;
    onClose: () => void;
    // When true, only the label header is shown — the compact view doesn't
    // have room for the full detail list.
    compact?: boolean;
}

export default function MutationLabelDetailPanel(
    props: IMutationLabelDetailPanelProps
) {
    // The header is always clickable to toggle the detail list in place —
    // in either view, not just the compact one. The default per selection
    // still follows `compact` (collapsed in the small view, expanded in the
    // large one); a click overrides that until the residue or the view size
    // changes again.
    const [expanded, setExpanded] = React.useState(!props.compact);
    const structurePosition = props.label?.structurePosition;

    React.useEffect(() => {
        setExpanded(!props.compact);
    }, [structurePosition, props.compact]);

    if (!props.label) {
        return null;
    }

    const showList = expanded;

    return (
        <div
            className={classnames(styles['mutation-label-detail'], {
                [styles['mutation-label-detail--compact']]: !showList,
            })}
        >
            <div
                className={classnames(
                    styles['mutation-label-detail-header'],
                    styles['mutation-label-detail-header--clickable']
                )}
                onClick={() => setExpanded(!expanded)}
            >
                <strong>{props.label.labelText}</strong>
                <button
                    type="button"
                    className="close"
                    aria-label="Close"
                    onClick={event => {
                        event.stopPropagation();
                        props.onClose();
                    }}
                >
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            {showList && (
                <ul className={styles['mutation-label-detail-list']}>
                    {props.label.detailLines.map(line => (
                        <li key={line}>{line}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
