import * as React from 'react';
import {ThreeBounce} from 'better-react-spinkit';
import { If, Else, Then } from 'react-if';
import Spinner from "react-spinkit";
import Portal from 'react-portal';

export interface ILoader {
    isLoading:boolean;
    style?:any;
    isGlobal?:boolean;
}

export default class LoadingIndicator extends React.Component<ILoader, {}> {

    public render() {

        if (this.props.isGlobal) {
            return <GlobalLoader {...this.props} />
        } else {
            return (
                <If condition={this.props.isLoading}>
                    <Then>
                        <div>
                            <Spinner fadeIn="none" className={"spinnerColor"}
                                     style={this.props.style || {display: 'inline-block', marginLeft: 10}}
                                     name="line-scale-pulse-out" color="steelblue"/>
                            {
                                this.props.children
                            }
                        </div>
                    </Then>
                </If>
            );
        }
    }
}


export class GlobalLoader extends React.Component<ILoader,{}> {

    public render(){
        return <Portal isOpened={this.props.isLoading}>
            <Spinner className={"globalSpinner"} fadeIn="quarter" name="line-scale-pulse-out" color="steelblue"/>
        </Portal>
    }

}