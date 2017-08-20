import * as React from 'react';
import {observer} from "mobx-react";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";
import MolecularMatchCard from "./MolecularMatchCard";
import {Mutation} from "../../api/generated/CBioPortalAPI";

export interface IMolecularMatchTooltipProps {
    count?: number;
    trials?: any[];
    sampleIDtoTumorType?: { [sampleId: string]: string };
    mutationData: Mutation | undefined;
    onLoadComplete?: () => void;
}


@observer
export default class MolecularMatchTooltip extends React.Component<IMolecularMatchTooltipProps, {}> {

    public render() {
        let tooltipContent: JSX.Element = <span />;

        if (this.props.trials != null) {
            tooltipContent = (
                <MolecularMatchCard
                    count={this.props.count}
                    trials={this.props.trials}
                    sampleIDtoTumorType={this.props.sampleIDtoTumorType}
                    mutationData={this.props.mutationData}
                />
            );
        }
        else if (this.props.trials === undefined) {
            tooltipContent = <TableCellStatusIndicator status={TableCellStatus.LOADING}/>;
        }
        else if (this.props.trials === null) {
            tooltipContent = <TableCellStatusIndicator status={TableCellStatus.ERROR}/>;
        }

        return tooltipContent;
    }

    public componentDidUpdate() {
        if (this.props.count &&
            this.props.trials &&
            this.props.onLoadComplete) {
            this.props.onLoadComplete();
        }
    }
}
