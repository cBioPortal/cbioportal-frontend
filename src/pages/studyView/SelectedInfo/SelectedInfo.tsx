import * as React from 'react';
import * as _ from 'lodash';
import {computed} from "mobx";
import {observer} from "mobx-react";
import {Sample} from 'shared/api/generated/CBioPortalAPI';
import styles from './styles.module.scss';

export interface ISelectedInfoProps {
    selectedSamples: Sample[];
}

@observer
export default class SelectedInfo extends React.Component<ISelectedInfoProps, {}> {

    @computed
    get selectedPatientsCount() {
        return _.uniq(this.props.selectedSamples.map(sample => sample.uniquePatientKey)).length;
    }

    render() {
        return <div className={styles.main}>
            <span className={styles.title}>Selected:</span>
            <span className={styles.content}>
                {this.selectedPatientsCount.toLocaleString()} patients | {this.props.selectedSamples.length.toLocaleString()} samples
            </span>
        </div>
    }
}
