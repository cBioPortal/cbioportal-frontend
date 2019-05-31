import * as React from "react";
import {observer} from "mobx-react";
import classNames from "classnames";
import styles from "../styles.module.scss";
import EllipsisTextTooltip from "../../../shared/components/ellipsisTextTooltip/EllipsisTextTooltip";
import {
    caseCountsInParens,
    ComparisonGroup, getPatientIdentifiers,
    getSampleIdentifiers,
    MissingSamplesMessage
} from "../GroupComparisonUtils";
import ErrorIcon from "../../../shared/components/ErrorIcon";
import ComplexKeyMap from "../../../shared/lib/complexKeyDataStructures/ComplexKeyMap";
import {Sample} from "../../../shared/api/generated/CBioPortalAPI";
import {SortableElement} from "react-sortable-hoc";
import {getTextColor} from "../OverlapUtils";

export interface IGroupSelectorButtonProps {
    onClick:(uid:string)=>void;
    isSelected:(uid:string)=>boolean;
    group:ComparisonGroup;
    sampleSet:ComplexKeyMap<Sample>;
}

@observer
class GroupSelectorButton extends React.Component<IGroupSelectorButtonProps, {}> {
    render() {
        const group = this.props.group;
        const selected = this.props.isSelected(group.uid);
        const sampleIdentifiers = getSampleIdentifiers([group]);
        const patientIdentifiers = getPatientIdentifiers(sampleIdentifiers, this.props.sampleSet);

        return (
            <button
                className={classNames('btn btn-xs', { [styles.buttonUnselected]:!selected})}
                onClick={()=>this.props.onClick(group.uid)}
                style={{
                    backgroundColor: group.color
                }}
            >
                <span style={{display:"flex", alignItems:"center"}}>
                    <EllipsisTextTooltip
                        style={{
                            display:"inline-block",
                            color:getTextColor(group.color)
                        }}
                        text={group.nameWithOrdinal}
                        shownWidth={100}
                    />
                    &nbsp;
                    <span style={{color:getTextColor(group.color)}}>
                        {caseCountsInParens(sampleIdentifiers, patientIdentifiers)}
                    </span>
                    {group.nonExistentSamples.length > 0 && <ErrorIcon style={{marginLeft:7}} tooltip={<MissingSamplesMessage samples={group.nonExistentSamples}/>}/>}
                </span>
            </button>
        );
    }
}

export default SortableElement(GroupSelectorButton);