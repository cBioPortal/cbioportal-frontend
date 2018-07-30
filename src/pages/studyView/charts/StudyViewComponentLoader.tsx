import * as React from "react";
import {If} from 'react-if';
import MobxPromise from "mobxpromise";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator"
import styles from "../styles.module.scss";

export interface StudyViewComponentLoaderProps {
    promise: MobxPromise<any>
}

export class StudyViewComponentLoader extends React.Component<StudyViewComponentLoaderProps> {
    public render() {
        return (
            <div className={this.props.promise.isPending ? styles.studyViewAutoMargin : null}>
                <If condition={this.props.promise.isPending}>
                    <LoadingIndicator
                        isLoading={!!this.props.promise.isPending}
                        style={{position: "absolute", top: "50%", left: "50%", marginLeft: -10}}
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
