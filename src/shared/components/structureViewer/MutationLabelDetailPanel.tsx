import * as React from 'react';
import { IMutationLabelSpec } from './StructureVisualizer';
import styles from './structureViewer.module.scss';

export interface IMutationLabelDetailPanelProps {
    label: IMutationLabelSpec | null;
    onClose: () => void;
}

export default function MutationLabelDetailPanel(
    props: IMutationLabelDetailPanelProps
) {
    if (!props.label) {
        return null;
    }

    return (
        <div className={styles['mutation-label-detail']}>
            <div className={styles['mutation-label-detail-header']}>
                <strong>{props.label.labelText}</strong>
                <button
                    type="button"
                    className="close"
                    aria-label="Close"
                    onClick={props.onClose}
                >
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <ul className={styles['mutation-label-detail-list']}>
                {props.label.detailLines.map(line => (
                    <li key={line}>{line}</li>
                ))}
            </ul>
        </div>
    );
}
