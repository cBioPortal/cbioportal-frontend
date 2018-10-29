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
        return <div>
            <span className={styles.title}>Selected:</span>
            <span className={styles.content}>
                {this.props.selectedSamples.length} samples / {this.selectedPatientsCount} patients
            </span>
        </div>
    }
}
