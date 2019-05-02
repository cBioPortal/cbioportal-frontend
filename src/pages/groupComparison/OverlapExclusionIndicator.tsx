import * as React from "react";
import {observer} from "mobx-react";
import GroupComparisonStore, {OverlapStrategy} from "./GroupComparisonStore";
import {caseCounts} from "./GroupComparisonUtils";

export interface IOverlapExclusionIndicatorProps {
    store:GroupComparisonStore;
}

@observer
export default class OverlapExclusionIndicator extends React.Component<IOverlapExclusionIndicatorProps, {}> {
    render() {
        if (!this.props.store._selectionInfo.isComplete) {
            return null;
        } else {
            const selectionInfo = this.props.store._selectionInfo.result!;
            if (selectionInfo.overlappingSamples.length === 0 && selectionInfo.overlappingPatients.length === 0) {
                return null;
            }

            let iconClass;
            let alertClass;
            let message;
            const caseCountsSummary = caseCounts(selectionInfo.overlappingSamples.length, selectionInfo.overlappingPatients.length, " and ");
            switch (this.props.store.overlapStrategy) {
                case OverlapStrategy.INCLUDE:
                    iconClass = "fa-exclamation-triangle";
                    alertClass = "alert-warning";
                    message = `Your selected groups overlap in ${caseCountsSummary}.`;
                    break;
                case OverlapStrategy.EXCLUDE:
                    iconClass = "fa-check";
                    alertClass = "alert-success";
                    message = `Overlapping ${caseCountsSummary} have been excluded from analysis.`;
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