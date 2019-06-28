import * as React from "react";
import {observer} from "mobx-react";
import MobxPromise from "mobxpromise";
import {ComparisonGroup} from "./GroupComparisonUtils";
import {renderGroupNameWithOrdinal} from "./OverlapUtils";

export type GroupContainmentRelation = {
    groupUid:string;
    containerUid:string;
    equal:boolean;
};
export interface IOverlapContainmentIndicatorProps {
    uidToGroup:MobxPromise<{[uid:string]:Pick<ComparisonGroup, "name"|"ordinal">}>,
    containments:MobxPromise<GroupContainmentRelation[]>;
}

@observer
export default class OverlapContainmentIndicator extends React.Component<IOverlapContainmentIndicatorProps, {}> {
    render() {
        if (this.props.containments.isComplete && this.props.containments.result!.length > 0 &&
            this.props.uidToGroup.isComplete) {
            const uidToGroup = this.props.uidToGroup.result!;
            return (
                <div className="alert alert-info">
                    {this.props.containments.result!.map(containment=>(
                        <div>
                            <img
                                src={require("../../rootImages/contains.svg")}
                                style={{marginRight:6, width:13, marginTop:-2, marginLeft:-1}}
                            />
                            {renderGroupNameWithOrdinal(uidToGroup[containment.groupUid])}
                            &nbsp;
                            {containment.equal ? "is equal to" : "is contained in"}
                            &nbsp;
                            {renderGroupNameWithOrdinal(uidToGroup[containment.containerUid])}
                        </div>
                    ))}
                </div>
            );
        } else {
            return null;
        }
    }
}