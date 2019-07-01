import * as React from "react";
import TruncatedTextWithTooltipSVG from "../../../shared/components/TruncatedTextWithTooltipSVG";
import {ComparisonGroup} from "../GroupComparisonUtils";
import {renderGroupNameWithOrdinal} from "../OverlapUtils";

export interface IGroupTickLabelComponentProps {
    categoryCoordToGroup:(coord:number)=>ComparisonGroup;
    maxLabelWidth: number;
    text?:number; // always there, has to be optional so we dont get typeerrors when passing it as prop eg
                    // tickLabelComponent={<GroupTickLabelComponent categoryCoordToGroup={this.categoryCoordToGroup} maxLabelWidth={MAX_LABEL_WIDTH}/>}
    dy?:string;
    dx?:string;
    // unused victory props
    datum?:any;
}

export const GroupTickLabelComponent:React.FunctionComponent<IGroupTickLabelComponentProps> = (props:IGroupTickLabelComponentProps)=>{
    const {categoryCoordToGroup, dx, dy, datum, text, ...rest} = props;
    const group = categoryCoordToGroup(props.text!);
    return (
        <TruncatedTextWithTooltipSVG
            text={group!.name}
            prefixTspans={[
                <tspan>(</tspan>,
                <tspan style={{fontWeight:"bold"}}>{group!.ordinal}</tspan>,
                <tspan>) </tspan>
            ]}
            datum={group}
            tooltip={(group:ComparisonGroup)=>{
                return (
                    <div>
                        {renderGroupNameWithOrdinal(group)}
                    </div>
                );
            }}
            maxWidth={props.maxLabelWidth}
            dy={dy}
            dx={dx}
            {...rest}
        />
    );
};