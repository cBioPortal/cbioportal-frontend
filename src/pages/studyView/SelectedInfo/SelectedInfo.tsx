import * as React from 'react';
import * as _ from 'lodash';
import {computed} from "mobx";
import {observer} from "mobx-react";
import {Sample} from 'shared/api/generated/CBioPortalAPI';
import styles from './styles.module.scss';
import MobxPromise from 'mobxpromise';

export interface ISelectedInfoProps {
    promise: MobxPromise<Sample[]>;
}

@observer
export default class SelectedInfo extends React.Component<ISelectedInfoProps, {}> {

    @computed
    get selectedPatientsCount() {
        return _.uniq(this.props.promise.result!.map(sample => sample.uniquePatientKey)).length;
    }

    render() {
        return <div className={styles.main}>
            <span className={styles.title}>Selected:</span>
            <span className={styles.content}>
                {this.selectedPatientsCount} patients | {this.props.promise.result!.length} samples
            </span>
        </div>
    }
}
