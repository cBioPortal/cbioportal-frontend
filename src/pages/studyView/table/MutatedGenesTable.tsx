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
import {action, computed, observable} from "mobx";
import {bind} from "bind-decorator";
import {getQValue} from "../StudyViewUtils";

export interface IMutatedGenesTablePros {
    promise: MobxPromise<MutatedGenesData>;
    width?: number;
    height?: number;
    filters: number[];
    onUserSelection: (value: number[]) => void;
    numOfSelectedSamples: number;
    onGeneSelect: (hugoGeneSymbol: string) => void;
    selectedGenes: string[];
}

type MutatedGenesTableUserSelectionWithIndex = {
    entrezGeneId: number;
    rowIndex: number;
}

class MutatedGenesTableComponent extends FixedHeaderTable<MutationCountByGene> {
}

@observer
export class MutatedGenesTable extends React.Component<IMutatedGenesTablePros, {}> {
    @observable private preSelectedRows: MutatedGenesTableUserSelectionWithIndex[] = [];

    constructor(props: IMutatedGenesTablePros) {
        super(props);
    }

    private _tableColumns = [
        {
            name: 'Gene',
            render: (data: MutationCountByGene) => {
                const addGeneOverlay = () =>
                    <span>{`Click ${data.hugoGeneSymbol} to ${_.includes(this.props.selectedGenes, data.hugoGeneSymbol) ? 'remove' : 'add'} from your query`}</span>;
                const qvalOverlay = () =>
                    <div><b>MutSig</b><br/><i>Q-value: </i><span>{getQValue(data.qValue)}</span></div>;
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
                    checked={this.isChecked(data.entrezGeneId)}
                    disabled={this.isDisabled(data.entrezGeneId)}
                    onChange={event => this.togglePreSelectRow(data.entrezGeneId)}
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

    @bind
    isChecked(entrezGeneId: number) {
        let record = _.find(this.preSelectedRows, (row: MutatedGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId);
        if (_.isUndefined(record)) {
            return this.selectedRows.length > 0 && !_.isUndefined(_.find(this.selectedRows, (row: MutatedGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId));
        } else {
            return true;
        }
    }

    @bind
    isDisabled(entrezGeneId: number) {
        return !_.isUndefined(_.find(this.selectedRows, (row: MutatedGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId));
    }

    @bind
    togglePreSelectRow(entrezGeneId: number) {
        let record: MutatedGenesTableUserSelectionWithIndex | undefined = _.find(this.preSelectedRows, (row: MutatedGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId);
        if (_.isUndefined(record)) {
            let dataIndex = -1;
            // definitely there is a match
            let datum: MutationCountByGene | undefined = _.find(this.props.promise.result, (row: MutationCountByGene, index: number) => {
                let exist = row.entrezGeneId === entrezGeneId;
                if (exist) {
                    dataIndex = index;
                }
                return exist;
            });

            if (!_.isUndefined(datum)) {
                this.preSelectedRows.push({
                    rowIndex: dataIndex,
                    entrezGeneId: datum.entrezGeneId
                })
            }
        } else {
            this.preSelectedRows = _.xorBy(this.preSelectedRows, [record], 'rowIndex');
        }
    }


    @bind
    @action
    afterSelectingRows() {
        this.props.onUserSelection(this.preSelectedRows.map(row => row.entrezGeneId));
        this.preSelectedRows = [];
    }

    @computed
    get selectedRows() {
        if (this.props.filters.length === 0) {
            return [];
        } else {
            return _.reduce(this.props.promise.result, (acc: MutatedGenesTableUserSelectionWithIndex[], row: MutationCountByGene, index: number) => {
                if (_.includes(this.props.filters, row.entrezGeneId)) {
                    acc.push({
                        rowIndex: index,
                        entrezGeneId: row.entrezGeneId
                    });
                }
                return acc;
            }, []);
        }
    }

    @bind
    isSelectedRow(data:MutationCountByGene) {
        return !_.isUndefined(_.find(_.union(this.selectedRows, this.preSelectedRows), function (row) {
            return row.entrezGeneId === data.entrezGeneId;
        }));
    }

    public render() {
        return (
            <MutatedGenesTableComponent
                data={this.props.promise.result || []}
                columns={this._tableColumns}
                selectedGenes={this.props.selectedGenes}
                selectedRows={_.map(_.union(this.selectedRows, this.preSelectedRows), row => row.rowIndex)}
                showSelectSamples={true && this.preSelectedRows.length > 0}
                isSelectedRow={this.isSelectedRow}
                afterSelectingRows={this.afterSelectingRows}
                sortBy='#'
            />
        );
    }
}

