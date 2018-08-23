import * as React from "react";
import {MutatedGenesData} from "pages/studyView/StudyViewPageStore";
import {observer} from "mobx-react";
import styles from "./tables.module.scss";
import {MutationCountByGene} from "shared/api/generated/CBioPortalAPIInternal";
import LabeledCheckbox from "../../../shared/components/labeledCheckbox/LabeledCheckbox";
import MobxPromise from "mobxpromise";
import {If} from 'react-if';
import * as _ from 'lodash';
import classnames from 'classnames';
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import FixedHeaderTable from "./FixedHeaderTable";

export interface IMutatedGenesTablePros {
    promise: MobxPromise<MutatedGenesData>;
    filters: number[];
    onUserSelection: (value: number) => void;
    numOfSelectedSamples: number;
    onGeneSelect: (hugoGeneSymbol: string) => void;
    selectedGenes: string[]
}

class MutatedGenesTableComponent extends FixedHeaderTable<MutationCountByGene> {
}

@observer
export class MutatedGenesTable extends React.Component<IMutatedGenesTablePros, {}> {
    private _tableColumns = [
        {
            name: 'Gene',
            render: (data: MutationCountByGene) => {
                const addGeneOverlay = () =>
                    <span>{`Click ${data.hugoGeneSymbol} to ${_.includes(this.props.selectedGenes, data.hugoGeneSymbol) ? 'remove' : 'add'} from your query`}</span>;
                const qvalOverlay = () =>
                    <div><b>MutSig</b><br/><i>Q-value: </i><span>{data.qValue}</span></div>;
                return (
                    <div className={styles.ellipsisText}>
                        <DefaultTooltip
                            placement="left"
                            overlay={addGeneOverlay}
                            destroyTooltipOnHide={true}
                        >
                            <span
                                className={classnames(styles.geneSymbol, styles.ellipsisText, _.includes(this.props.selectedGenes, data.hugoGeneSymbol) ? styles.selected : undefined, _.isUndefined(data.qValue) ? undefined : styles.shortenText)}
                                onClick={() => this.props.onGeneSelect(data.hugoGeneSymbol)}>
                                {data.hugoGeneSymbol}
                            </span>
                        </DefaultTooltip>
                        <If condition={!_.isUndefined(data.qValue)}>
                            <DefaultTooltip
                                placement="right"
                                overlay={qvalOverlay}
                                destroyTooltipOnHide={true}
                            >
                                <img src={require("./images/mutsig.png")} className={styles.mutSig}></img>
                            </DefaultTooltip>
                        </If>
                    </div>
                )
            },
            sortBy: (data: MutationCountByGene) => data.hugoGeneSymbol,
            defaultSortDirection: 'asc' as 'asc',
            filter: (data: MutationCountByGene, filterString: string, filterStringUpper: string) => {
                return data.hugoGeneSymbol.indexOf(filterStringUpper) > -1;
            },
            width: 160
        },
        {
            name: '# Mut',
            render: (data: MutationCountByGene) => <span>{data.totalCount}</span>,
            sortBy: (data: MutationCountByGene) => data.totalCount,
            defaultSortDirection: 'desc' as 'desc',
            filter: (data: MutationCountByGene, filterString: string, filterStringUpper: string) => {
                return _.toString(data.totalCount).indexOf(filterStringUpper) > -1;
            },
            width: 80
        },
        {
            name: '#',
            render: (data: MutationCountByGene) =>
                <LabeledCheckbox
                    checked={this.props.filters.indexOf(data.entrezGeneId) !== -1}
                    onChange={event => this.props.onUserSelection(data.entrezGeneId)}
                >
                    {data.countByEntity}
                </LabeledCheckbox>,
            sortBy: (data: MutationCountByGene) => data.countByEntity,
            defaultSortDirection: 'desc' as 'desc',
            filter: (data: MutationCountByGene, filterString: string, filterStringUpper: string) => {
                return _.toString(data.countByEntity).indexOf(filterStringUpper) > -1;
            },
            width: 80
        },
        {
            name: 'Freq',
            render: (data: MutationCountByGene) => <span>{data.frequency + '%'}</span>,
            sortBy: (data: MutationCountByGene) => data.frequency,
            defaultSortDirection: 'desc' as 'desc',
            filter: (data: MutationCountByGene, filterString: string, filterStringUpper: string) => {
                return _.toString(data.frequency).indexOf(filterStringUpper) > -1;
            },
            width: 80
        }
    ];

    public render() {
        return (
            <MutatedGenesTableComponent
                data={this.props.promise.result || []}
                columns={this._tableColumns}
            />
        );
    }
}

