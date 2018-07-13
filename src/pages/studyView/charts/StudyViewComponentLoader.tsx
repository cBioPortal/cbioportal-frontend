import * as React from "react";
import {If} from 'react-if';
import {ThreeBounce} from 'better-react-spinkit';
import MobxPromise from "mobxpromise";

export interface StudyViewComponentLoaderProps {
    promise: MobxPromise<any>
}

export class StudyViewComponentLoader extends React.Component<StudyViewComponentLoaderProps> {
    public render() {
        return (
            <div>
                <If condition={this.props.promise.isPending}>
                    <ThreeBounce className="center-block text-center"/>
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
