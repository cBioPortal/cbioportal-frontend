import * as React from "react";
import {observer} from "mobx-react";
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";
import EllipsisTextTooltip from "../../../shared/components/ellipsisTextTooltip/EllipsisTextTooltip";
import {
    caseCountsInParens,
    ComparisonGroup,
    getPatientIdentifiers,
    getSampleIdentifiers
} from "../GroupComparisonUtils";
import autobind from "autobind-decorator";
import {getTextColor} from "../OverlapUtils";
import ComplexKeyMap from "../../../shared/lib/complexKeyDataStructures/ComplexKeyMap";
import {Sample} from "../../../shared/api/generated/CBioPortalAPI";
import FlexAlignedCheckbox from "../../../shared/components/FlexAlignedCheckbox";

export interface IWorkspaceGroupCheckboxProps {
    group:ComparisonGroup
    checked:boolean;
    onClick:(uid:string)=>void;
    sampleSet:ComplexKeyMap<Sample>;
}

@observer
export default class WorkspaceGroupCheckbox extends React.Component<IWorkspaceGroupCheckboxProps, {}> {

    @autobind
    private onClick() {
        this.props.onClick(this.props.group.uid);
    }

    render() {
        const sampleIdentifiers = getSampleIdentifiers([this.props.group]);
        const patientIdentifiers = getPatientIdentifiers(sampleIdentifiers, this.props.sampleSet);
        return (
            <FlexAlignedCheckbox
                checked={this.props.checked}
                label={[
                    <EllipsisTextTooltip
                        style={{
                            display:"inline-block"
                        }}
                        text={this.props.group.name}
                        shownWidth={200}
                    />,
                    <span>&nbsp;</span>,
                    <span style={{display:"inline-block"}}>
                        {caseCountsInParens(sampleIdentifiers, patientIdentifiers)}
                    </span>
                ]}
                style={{marginTop:3, marginBottom:3}}
                onClick={this.onClick}
            />
        );
    }
}