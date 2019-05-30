import * as React from "react";
import {observer} from "mobx-react";
import GroupComparisonStore, {OverlapStrategy} from "./GroupComparisonStore";
import {caseCounts} from "./GroupComparisonUtils";

export interface IOverlapExclusionIndicatorProps {
    store:GroupComparisonStore;
    only?:"sample"|"patient"
}

@observer
export default class OverlapExclusionIndicator extends React.Component<IOverlapExclusionIndicatorProps, {}> {
    render() {
        if (!this.props.store._selectionInfo.isComplete) {
            return null;
        } else {
            const selectionInfo = this.props.store._selectionInfo.result!;
            if ((selectionInfo.overlappingPatients.length === 0 && selectionInfo.overlappingSamples.length === 0) ||
                (this.props.only === "sample" && selectionInfo.overlappingSamples.length === 0) ||
                (this.props.only === "patient" && selectionInfo.overlappingPatients.length === 0)) {
                return null;
            }

            let iconClass;
            let alertClass;
            let message;
            let caseCountsSummary = "";
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
                    caseCountsSummary = `${count} overlapping ${this.props.only}${plural ? "s" : ""}`;
                    break;
                default:
                    caseCountsSummary = caseCounts(selectionInfo.overlappingSamples.length, selectionInfo.overlappingPatients.length, " and ", " overlapping ");
                    break;
            }
            switch (this.props.store.overlapStrategy) {
                case OverlapStrategy.INCLUDE:
                    iconClass = "fa-exclamation-triangle";
                    alertClass = "alert-warning";
                    message = `The selected groups contain ${caseCountsSummary}.`;
                    break;
                case OverlapStrategy.EXCLUDE:
                    iconClass = "fa-check";
                    alertClass = "alert-success";
                    message = `${caseCountsSummary} are excluded from this analysis.`;
                    break;
            }

            return (
                <div className={`alert ${alertClass}`}>
                    <i
                        className={`fa fa-md ${iconClass}`}
                        style={{
                            color: "#000000",
                            marginRight:5
                        }}
                    />
                    {message}
                </div>
            );
        }
    }
}