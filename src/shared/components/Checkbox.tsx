import * as React from "react";
import {observer} from "mobx-react";
import DefaultTooltip from "./defaultTooltip/DefaultTooltip";

export interface ICheckboxProps {
    value?:string;
    checked:boolean;
    onClick:()=>void;
    label:any;
}

@observer
export default class Checkbox extends React.Component<ICheckboxProps, {}> {
    render() {
        return (
            <div className="checkbox" style={{display:"flex", alignItems:"center"}}><label>
                <input
                    type="checkbox"
                    value={this.props.value}
                    checked={this.props.checked}
                    onClick={this.props.onClick}
                />
                {typeof this.props.label === "function" ? this.props.label() : this.props.label}
            </label></div>
        );
    }
}