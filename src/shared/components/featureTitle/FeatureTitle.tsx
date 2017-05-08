import * as React from 'react';
import {ThreeBounce} from 'better-react-spinkit';
import { If, Else } from 'react-if';

export interface IFeatureTitleProps {
    isLoading:Boolean;
    title:string;
    className?:string;
    isHidden?:Boolean;
}

export default class FeatureTitle extends React.Component<IFeatureTitleProps, {}> {

    public render() {
       return (
            <If condition={this.props.isHidden}>

                <Else><h4 className={this.props.className || ''}>{this.props.title}
                    <If condition={this.props.isLoading}>
                        <ThreeBounce style={{ display:'inline-block', marginLeft:10 }} />
                    </If>
                </h4></Else>
            </If>
        );
    }
}
