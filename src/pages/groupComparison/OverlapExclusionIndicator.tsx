import * as React from "react";
import {observer} from "mobx-react";
import GroupComparisonStore, {OverlapStrategy} from "./GroupComparisonStore";
import {caseCounts} from "./GroupComparisonUtils";
import _ from "lodash";
import {joinGroupNames} from "./OverlapUtils";

export interface IOverlapExclusionIndicatorProps {
    store:GroupComparisonStore;
    only?:"sample"|"patient"
}

@observer
export default class OverlapExclusionIndicator extends React.Component<IOverlapExclusionIndicatorProps, {}> {
    render() {
        if (!this.props.store.overlapComputations.isComplete) {
            return null;
        } else {
            const selectionInfo = this.props.store.overlapComputations.result!;
            if ((!selectionInfo.existOverlappingSamples && !selectionInfo.existOverlappingPatients) ||
                (this.props.only === "sample" && !selectionInfo.existOverlappingSamples) ||
                (this.props.only === "patient" && !selectionInfo.existOverlappingPatients)) {
                return null;
            }

            let caseCountsSummary:any = "";
            const includedGroups = selectionInfo.groups.filter(g=>!(g.uid in selectionInfo.excludedFromAnalysis));
            const groupsAreExcluded = includedGroups.length < selectionInfo.groups.length;

            switch (this.props.only) {
                case "sample":
                case "patient":
                    let count = 0;
                    if (this.props.only === "sample") {
                        count = selectionInfo.overlappingSamples.length;
                    } else {
                        count = selectionInfo.overlappingPatients.length;
                    }
                    const plural = (count !== 1);
                    caseCountsSummary = (
                        <span>
                            {`${count} overlapping ${this.props.only}${plural ? "s" : ""}`}
                            {groupsAreExcluded && [
                                ` between `,
                                joinGroupNames(includedGroups, "and"),
                                "."
                            ]}
                        </span>
                    );
                    break;
                default:
                    caseCountsSummary = (
                        <span>
                            {`${caseCounts(selectionInfo.overlappingSamples.length, selectionInfo.overlappingPatients.length, " and ", " overlapping ")}`}
                            {groupsAreExcluded && [
                                ` between `,
                                joinGroupNames(includedGroups, "and"),
                                "."
                            ]}
                        </span>
                    );
                    break;
            }

            let excludedGroupsSummary:any = "";
            const excludedGroups = selectionInfo.groups.filter(g=>(g.uid in selectionInfo.excludedFromAnalysis));
            let iconClass;
            let alertClass;
            let message:any = "";
            switch (this.props.store.overlapStrategy) {
                case OverlapStrategy.INCLUDE:
                    iconClass = "fa-exclamation-triangle";
                    alertClass = "alert-warning";

                    if (selectionInfo.overlappingSamples.length > 0 || selectionInfo.overlappingPatients.length > 0) {
                        message = (
                            <span>
                                {`There are `}
                                {caseCountsSummary}
                            </span>
                        );
                    }

                    if (excludedGroups.length > 0) {
                        excludedGroupsSummary = (
                            <span>
                                {joinGroupNames(excludedGroups, "and")} {excludedGroups.length === 1 ? "is" : "are"} completely overlapping with other selected groups.
                            </span>
                        );
                    }
                    break;
                case OverlapStrategy.EXCLUDE:
                    iconClass = "fa-info-circle";
                    alertClass = "alert-info";

                    if (selectionInfo.overlappingSamples.length > 0 || selectionInfo.overlappingPatients.length > 0) {
                        message = (
                            <span>
                                {caseCountsSummary}
                                {` are excluded from this analysis.`}
                            </span>
                        );
                    }

                    if (excludedGroups.length > 0) {
                        excludedGroupsSummary = (
                            <span>
                                {joinGroupNames(excludedGroups, "and")} {excludedGroups.length === 1 ? "is" : "are"} completely overlapping with other selected groups, so {excludedGroups.length === 1 ? "has" : "have"} been excluded from this analysis.
                            </span>
                        );
                    }
                    break;
            }

            return (
                <div className={`alert ${alertClass}`}>
                    {excludedGroupsSummary && [
                        <i
                            className={`fa fa-md ${iconClass}`}
                            style={{
                                color: "#000000",
                                marginRight:5
                            }}
                        />,
                        excludedGroupsSummary,
                        <br/>
                    ]}
                    {message && [
                        <i
                            className={`fa fa-md ${iconClass}`}
                            style={{
                                color: "#000000",
                                marginRight:5
                            }}
                        />,
                        message
                    ]}
                </div>
            );
        }
    }
}