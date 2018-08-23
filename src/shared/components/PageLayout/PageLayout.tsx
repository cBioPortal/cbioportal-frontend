import * as React from "react";
import RightBar from "../rightbar/RightBar";
import {Component} from "react";
import classNames from 'classnames';

export class PageLayout extends React.Component<{ rightBar?:any, className?:string, noMargin?:boolean },{}> {

    render(){

        const noMargin = this.props.noMargin ? "noMargin" : "";

        return (
            <div className={classNames('contentWidth',this.props.className, noMargin) }>
                <div id="mainColumn">
                    <div>
                        {this.props.children}
                    </div>
                </div>
                {(this.props.rightBar) &&
                (<div id="rightColumn">
                    {
                        this.props.rightBar
                    }
                </div>)
                }
            </div>
        )
    }

}