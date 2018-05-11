import * as React from "react";
import RightBar from "../rightbar/RightBar";
import {Component} from "react";

export class PageLayout extends React.Component<{ rightBar?:any },{}> {

    render(){
        return (
            <div className="contentWidth noMargin">
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