import * as React from "react";
import {observer} from "mobx-react";
import GroupComparisonStore, {OverlapStrategy} from "./GroupComparisonStore";
import {caseCounts} from "./GroupComparisonUtils";
import _ from "lodash";
import {joinGroupNames} from "./OverlapUtils";

export interface IOverlapExclusionIndicatorProps {
    store:GroupComparisonStore;
    only?:"sample"|"patient"
    overlapTabMode?:boolean;
    survivalTabMode?:boolean;
}

@observer
export default class OverlapExclusionIndicator extends React.Component<IOverlapExclusionIndicatorProps, {}> {
    render() {
        if (!this.props.store.overlapComputations.isComplete) {
            return null;
        } else {
            const selectionInfo = this.props.store.overlapComputations.result!;
            if ((!selectionInfo.totalSampleOverlap && !selectionInfo.totalPatientOverlap) ||
                (this.props.only === "sample" && !selectionInfo.totalSampleOverlap) ||
                (this.props.only === "patient" && !selectionInfo.totalPatientOverlap)) {
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
                                joinGroupNames(includedGroups, "and")
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
                                joinGroupNames(includedGroups, "and")
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

            const existOverlapping =
                (!this.props.only && (selectionInfo.overlappingSamples.length > 0 || selectionInfo.overlappingPatients.length > 0)) ||
                (this.props.only === "sample" && selectionInfo.overlappingSamples.length > 0) ||
                (this.props.only === "patient" && selectionInfo.overlappingPatients.length > 0);

            switch (this.props.store.overlapStrategy) {
                case OverlapStrategy.INCLUDE:
                    if (this.props.survivalTabMode) {
                        iconClass = "fa-info-circle";
                        alertClass = "alert-info";

                        if (selectionInfo.totalPatientOverlap > 0) {
                            message = (
                                <span>
                                    Overlapping patients (n={selectionInfo.totalPatientOverlap}) are plotted as distinct groups below.
                                </span>
                            );
                        }
                    } else {
                        iconClass = "fa-exclamation-triangle";
                        alertClass = "alert-warning";

                        if (existOverlapping) {
                            message = (
                                <span>
                                    {groupsAreExcluded ? `There are ` : `The selected groups contain `}
                                    {caseCountsSummary}.
                                </span>
                            );
                        }
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

                    if (existOverlapping) {
                        const singular = (
                            (this.props.only === "sample" && selectionInfo.overlappingSamples.length === 1) ||
                            (this.props.only === "patient" && selectionInfo.overlappingPatients.length === 1)
                        );
                        message = (
                            <span>
                                {caseCountsSummary}
                                {` ${singular ? "is" : "are"} excluded from `}
                                {!this.props.overlapTabMode ? `this analysis.` : `analysis in other tabs.`}
                            </span>
                        );
                    }

                    if (excludedGroups.length > 0) {
                        excludedGroupsSummary = (
                            <span>
                                {joinGroupNames(excludedGroups, "and")}&nbsp;{excludedGroups.length === 1 ? "is" : "are"}
                                {` completely overlapping with other selected groups, so `}
                                {this.props.overlapTabMode ?
                                    `${excludedGroups.length === 1 ? "is" : "are"} excluded from analysis in other tabs.` :
                                    `${excludedGroups.length === 1 ? "has" : "have"} been excluded from this analysis.`
                                }
                            </span>
                        );
                    }
                    break;
            }

            return (
                <div className={`alert ${alertClass}`}>
                    {this.props.overlapTabMode &&
                    (this.props.store.overlapStrategy === OverlapStrategy.INCLUDE) && (
                        <div style={{marginBottom:15}}>
                            <i
                                className={`fa fa-md fa-exclamation-triangle`}
                                style={{
                                    color: "#000000",
                                    marginRight:5
                                }}
                            />
                            <span>Overlapping samples and patients are included for analyses in all tabs.</span>
                        </div>
                    )}
                    {excludedGroupsSummary && (
                        <div>
                            <i
                                className={`fa fa-md ${iconClass}`}
                                style={{
                                    color: "#000000",
                                    marginRight:5
                                }}
                            />
                            {excludedGroupsSummary}
                        </div>
                    )}
                    {message && (
                        <div>
                            <i
                                className={`fa fa-md ${iconClass}`}
                                style={{
                                    color: "#000000",
                                    marginRight:5
                                }}
                            />
                            {message}
                        </div>
                    )}
                </div>
            );
        }
    }
}