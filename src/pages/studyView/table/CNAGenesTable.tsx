import * as React from "react";
import * as _ from "lodash";
import {CNAGenesData, CopyNumberAlterationIdentifier} from "pages/studyView/StudyViewPageStore";
import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import styles from "./tables.module.scss";
import {CopyNumberCountByGene, CopyNumberGeneFilterElement} from "shared/api/generated/CBioPortalAPIInternal";
import MobxPromise from "mobxpromise";
import {If} from 'react-if';
import classnames from 'classnames';
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import LabeledCheckbox from "shared/components/labeledCheckbox/LabeledCheckbox";
import FixedHeaderTable from "./FixedHeaderTable";
import autobind from 'autobind-decorator';
import {getCNAByAlteration, getCNAColorByAlteration, getFrequencyStr, getQValue} from "../StudyViewUtils";


export type  CNAGenesTableUserSelectionWithIndex = CopyNumberAlterationIdentifier & {
    rowIndex: number;
}

export interface ICNAGenesTablePros {
    promise: MobxPromise<CNAGenesData>;
    width: number;
    height: number;
    filters: CopyNumberGeneFilterElement[];
    onUserSelection: (selection: CopyNumberAlterationIdentifier[]) => void;
    numOfSelectedSamples: number;
    onGeneSelect: (hugoGeneSymbol: string) => void;
    selectedGenes: string[]
}

class CNAGenesTableComponent extends FixedHeaderTable<CopyNumberCountByGene> {
}

@observer
export class CNAGenesTable extends React.Component<ICNAGenesTablePros, {}> {
    @observable private preSelectedRows: CNAGenesTableUserSelectionWithIndex[] = [];

    constructor(props: ICNAGenesTablePros) {
        super(props);
    }

    private _columns = [
        {
            name: 'Gene',
            tooltip:(<span>Gene</span>),
            render: (data: CopyNumberCountByGene) => {
                const addGeneOverlay = () =>
                    <span>{`Click ${data.hugoGeneSymbol} to ${_.includes(this.props.selectedGenes, data.hugoGeneSymbol) ? 'remove from' : 'add to'} your query`}</span>;
                const qvalOverlay = () =>
                    <div><b>Gistic</b><br/><i>Q-value: </i><span>{getQValue(data.qValue)}</span></div>;
                return (
                    <div className={classnames(styles.displayFlex)}>
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
                                <span><img src={require("./images/gistic.png")} className={styles.gistic}></img></span>
                            </DefaultTooltip>
                        </If>
                    </div>
                )
            },
            sortBy: (data: CopyNumberCountByGene) => data.hugoGeneSymbol,
            defaultSortDirection: 'asc' as 'asc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return data.hugoGeneSymbol.toUpperCase().includes(filterStringUpper);
            },
            width: 90
        },
        {
            name: 'Cytoband',
            tooltip:(<span>Cytoband</span>),
            render: (data: CopyNumberCountByGene) => <span>{data.cytoband}</span>,
            sortBy: (data: CopyNumberCountByGene) => data.cytoband,
            defaultSortDirection: 'asc' as 'asc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return _.isUndefined(data.cytoband) ? false : data.cytoband.toUpperCase().includes(filterStringUpper);
            },
            width: 105
        },
        {
            name: 'CNA',
            tooltip:(<span>Copy number alteration, only amplifications and deep deletions are shown</span>),
            render: (data: CopyNumberCountByGene) =>
                <span style={{color: getCNAColorByAlteration(data.alteration), fontWeight: 'bold'}}>
                    {getCNAByAlteration(data.alteration)}
                </span>,
            sortBy: (data: CopyNumberCountByGene) => data.alteration,
            defaultSortDirection: 'asc' as 'asc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return getCNAByAlteration(data.alteration).includes(filterStringUpper);
            },
            width: 50
        },
        {
            name: '#',
            tooltip:(<span>Number of samples with the listed copy number alteration</span>),
            render: (data: CopyNumberCountByGene) =>
                <LabeledCheckbox
                    checked={this.isChecked(data.entrezGeneId, data.alteration)}
                    disabled={this.isDisabled(data.entrezGeneId, data.alteration)}
                    onChange={event => this.togglePreSelectRow(data.entrezGeneId, data.alteration)}
                >
                    {data.countByEntity.toLocaleString()}
                </LabeledCheckbox>,
            sortBy: (data: CopyNumberCountByGene) => data.countByEntity,
            defaultSortDirection: 'desc' as 'desc',
            filter: (data: CopyNumberCountByGene, filterString: string) => {
                return _.toString(data.countByEntity).includes(filterString);
            },
            width: 85
        },
        {
            name: 'Freq',
            tooltip:(<span>Percentage of samples with the listed copy number alteration</span>),
            render: (data: CopyNumberCountByGene) => <span>{getFrequencyStr(data.frequency)}</span>,
            sortBy: (data: CopyNumberCountByGene) => data.frequency,
            defaultSortDirection: 'desc' as 'desc',
            filter: (data: CopyNumberCountByGene, filterString: string) => {
                return _.toString(getFrequencyStr(data.frequency)).includes(filterString);
            },
            width: 70
        }
    ];

    @autobind
    isChecked(entrezGeneId: number, alteration: number) {
        let record = _.find(this.preSelectedRows, (row: CNAGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId && row.alteration === alteration);
        if (_.isUndefined(record)) {
            return this.selectedRows.length > 0 && !_.isUndefined(_.find(this.selectedRows, (row: CNAGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId && row.alteration === alteration));
        } else {
            return true;
        }
    }

    @autobind
    isDisabled(entrezGeneId: number, alteration: number) {
        return !_.isUndefined(_.find(this.selectedRows, (row: CNAGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId && row.alteration === alteration));
    }

    @autobind
    @action
    togglePreSelectRow(entrezGeneId: number, alteration: number) {
        let record: CNAGenesTableUserSelectionWithIndex | undefined = _.find(this.preSelectedRows, (row: CNAGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId && row.alteration === alteration);
        if (_.isUndefined(record)) {
            let dataIndex = -1;
            // definitely there is a match
            let datum: CopyNumberCountByGene | undefined = _.find(this.props.promise.result, (row: CopyNumberCountByGene, index: number) => {
                let exist = row.entrezGeneId === entrezGeneId && row.alteration === alteration;
                if (exist) {
                    dataIndex = index;
                }
                return exist;
            });

            if (!_.isUndefined(datum)) {
                this.preSelectedRows.push({
                    rowIndex: dataIndex,
                    entrezGeneId: datum.entrezGeneId,
                    alteration: datum.alteration,
                    hugoGeneSymbol: datum.hugoGeneSymbol
                })
            }
        } else {
            this.preSelectedRows = _.xorBy(this.preSelectedRows, [record], 'rowIndex');
        }
    }

    @autobind
    @action
    afterSelectingRows() {
        this.props.onUserSelection(this.preSelectedRows.map(row => {
            return {
                entrezGeneId: row.entrezGeneId,
                alteration: row.alteration,
                hugoGeneSymbol: row.hugoGeneSymbol
            };
        }));
        this.preSelectedRows = [];
    }

    @computed
    get selectedRows() {
        if (this.props.filters.length === 0) {
            return [];
        } else {
            return _.reduce(this.props.promise.result, (acc: CNAGenesTableUserSelectionWithIndex[], row: CopyNumberCountByGene, index: number) => {
                if (_.some(this.props.filters, {entrezGeneId: row.entrezGeneId, alteration: row.alteration})) {
                    acc.push({
                        rowIndex: index,
                        entrezGeneId: row.entrezGeneId,
                        alteration: row.alteration,
                        hugoGeneSymbol: row.hugoGeneSymbol
                    });
                }
                return acc;
            }, []);
        }
    }

    @autobind
    isSelectedRow(data: CopyNumberCountByGene) {
        return !_.isUndefined(_.find(_.union(this.selectedRows, this.preSelectedRows), function (row) {
            return row.entrezGeneId === data.entrezGeneId && row.alteration === data.alteration;
        }));
    }

    public render() {
        return (
            <CNAGenesTableComponent
                width={this.props.width}
                height={this.props.height}
                data={this.props.promise.result || []}
                columns={this._columns}
                showSelectSamples={true && this.preSelectedRows.length > 0}
                afterSelectingRows={this.afterSelectingRows}
                isSelectedRow={this.isSelectedRow}
                sortBy='#'
            />
        );
    }
}

