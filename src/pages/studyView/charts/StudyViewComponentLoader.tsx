import * as React from "react";
import {If} from 'react-if';
import MobxPromise from "mobxpromise";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator"


export interface StudyViewComponentLoaderProps {
    promise: MobxPromise<any>
}

export class StudyViewComponentLoader extends React.Component<StudyViewComponentLoaderProps> {
    public render() {
        return (
            <div style={{margin: 'auto'}}>
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
