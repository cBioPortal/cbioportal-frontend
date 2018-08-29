import * as React from "react";
import {If} from 'react-if';
import MobxPromise from "mobxpromise";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator"
import styles from "../styles.module.scss";
import classNames from 'classnames';

export interface StudyViewComponentLoaderProps {
    promise: MobxPromise<any>
}

export class StudyViewComponentLoader extends React.Component<StudyViewComponentLoaderProps> {
    public render() {
        return (
            <div className={classNames(this.props.promise.isPending ? styles.studyViewAutoMargin : null, styles.studyViewLoadingIndicator)}>
                <If condition={this.props.promise.isPending}>
                    <LoadingIndicator
                        isLoading={!!this.props.promise.isPending}
                    />
                </If>
                <If condition={this.props.promise.isError}>
                    <div>Error when loading data.</div>
                </If>
                <If condition={this.props.promise.isComplete}>
                    {this.props.children}
                </If>
            </div>
        );
    }
}
