import * as React from "react";
import {If} from 'react-if';
import MobxPromise from "mobxpromise";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator"
import styles from "../styles.module.scss";
import classNames from 'classnames';
import {observer} from "mobx-react";
import {computed} from "mobx";
import _ from "lodash";

export interface StudyViewComponentLoaderProps {
    promises: MobxPromise<any> | (MobxPromise<any>[])
}

@observer
export class StudyViewComponentLoader extends React.Component<StudyViewComponentLoaderProps> {
    @computed get status():"error"|"complete"|"pending" {
        let promises:MobxPromise<any>[];
        if (!Array.isArray(this.props.promises)) {
            promises = [this.props.promises];
        } else {
            promises = this.props.promises;
        }
        if (_.some(promises, p=>p.isError)) {
            return "error";
        } else if (_.every(promises, p=>p.isComplete)) {
            return "complete";
        } else {
            return "pending";
        }
    }

    public render() {
        return (
            <div className={classNames(this.status === "pending" ? styles.studyViewAutoMargin : null, styles.studyViewLoadingIndicator)}>
                <If condition={this.status === "pending"}>
                    <LoadingIndicator
                        isLoading={true}
                    />
                </If>
                <If condition={this.status === "error"}>
                    <div>Error when loading data.</div>
                </If>
                <If condition={this.status === "complete"}>
                    {this.props.children}
                </If>
            </div>
        );
    }
}
