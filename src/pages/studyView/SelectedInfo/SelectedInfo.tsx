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
        return <div className={styles.main}>
            <span>Selected:&nbsp;</span>
            <span>
                {this.props.selectedPatientsCount.toLocaleString()} patients | {this.props.selectedSamplesCount.toLocaleString()} samples
            </span>
        </div>
    }
}
