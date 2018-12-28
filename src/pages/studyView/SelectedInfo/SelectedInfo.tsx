import * as React from 'react';
import {observer} from "mobx-react";
import styles from './styles.module.scss';

export interface ISelectedInfoProps {
    selectedPatientsCount: number;
    selectedSamplesCount: number;
}

@observer
export default class SelectedInfo extends React.Component<ISelectedInfoProps, {}> {
    render() {
        return <div className={styles.main} data-test="selected-info">
            <span>Selected:&nbsp;</span>
            <span>
                <span data-test="selected-patients">{this.props.selectedPatientsCount.toLocaleString()}</span> patients | <span data-test="selected-samples">{this.props.selectedSamplesCount.toLocaleString()}</span> samples
            </span>
        </div>
    }
}
