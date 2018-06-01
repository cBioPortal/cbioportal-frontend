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
                   className="glyphicon glyphicon-info-sign"
                   style={Object.assign({}, {
                       color: "#000000",
                       cursor: "pointer",
                   }, this.props.style || {})}
               />
           </DefaultTooltip>
       );
   }
}