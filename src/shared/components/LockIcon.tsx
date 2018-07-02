import * as React from "react";
import classNames from "classnames";

export default class LockIcon extends React.Component<{locked:boolean, size?:string, onClick?:()=>void, className?:string}, {}> {
    private get icon() {
        let iconName = "fa-lock";
        if (!this.props.locked) {
            iconName = "fa-unlock";
        }
        return (
            <i
                className={classNames("fa", this.props.size || "fa-lg", iconName, this.props.className)}
                style={{cursor:this.props.onClick? "pointer" : "auto", paddingTop:"0.2em"}}
            />
        );
    }

    render() {
        return (
            <div
                onClick={this.props.onClick}
            >
                {this.icon}
            </div>
        );
    }
}