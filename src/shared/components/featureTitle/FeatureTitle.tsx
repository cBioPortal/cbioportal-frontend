import * as React from 'react';
import Spinner from "react-spinkit";
import { If } from 'react-if';

export interface IFeatureTitleProps {
    isLoading:Boolean;
    title:String;
}

export default class FeatureTitle extends React.Component<IFeatureTitleProps, {}> {

    public render() {
        return (
            <h4>{this.props.title}
                <If condition={this.props.isLoading}>
                    <Spinner spinnerName="three-bounce" style={{ display:'inline-block', marginLeft:10 }} noFadeIn={true}  />
                </If>
            </h4>
        );
    }
}
