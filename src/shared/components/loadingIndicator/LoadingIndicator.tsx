import * as React from 'react';
import {ThreeBounce} from 'better-react-spinkit';
import { If, Else, Then } from 'react-if';
import Spinner from "react-spinkit";
import Portal from 'react-portal';
import classNames from 'classnames';

export interface ILoader {
    isLoading:boolean;
    style?:any;
    isGlobal?:boolean;
    small?:boolean;
}

export default class LoadingIndicator extends React.Component<ILoader, {}> {

    public render() {

        if (this.props.isGlobal) {
            return <GlobalLoader {...this.props} />
        } else {
            return (
                <If condition={this.props.isLoading}>
                    <Then>
                        <div style={{display:"inline-block"}}>
                            <Spinner fadeIn="none" className={classNames("spinnerColor", {spinnerSmall:this.props.small})}
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
            <Spinner className={"globalSpinner"} fadeIn="none" name="line-scale-pulse-out" color="steelblue"/>
        </Portal>
    }

}