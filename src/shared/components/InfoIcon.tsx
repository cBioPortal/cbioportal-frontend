import * as React from "react";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";

export interface IInfoIconProps {
    tooltip:JSX.Element;
    style?:any;
}

export default class InfoIcon extends React.Component<IInfoIconProps, {}> {
   render() {
       return (
           <DefaultTooltip
               overlay={this.props.tooltip}
           >
               <i
                   className="fa fa-md fa-info-circle"
                   style={Object.assign({}, {
                       color: "#0000ff",
                       cursor: "pointer",
                       marginTop:"0.1em"
                   }, this.props.style || {})}
               />
           </DefaultTooltip>
       );
   }
}