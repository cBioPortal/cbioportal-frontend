import * as React from "react";
import * as _ from "lodash";
import {CNAGenesData} from "pages/studyView/StudyViewPageStore";
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
import {bind} from "bind-decorator";
import {EXPONENTIAL_FRACTION_DIGITS, getCNAByAlteration} from "../StudyViewUtils";


export type  CNAGenesTableUserSelectionWithIndex = CopyNumberGeneFilterElement & {
    rowIndex: number;
}

export interface ICNAGenesTablePros {
    promise: MobxPromise<CNAGenesData>;
    filters: CopyNumberGeneFilterElement[];
    onUserSelection: (selection: CopyNumberGeneFilterElement[]) => void;
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
            render: (data: CopyNumberCountByGene) => {
                const addGeneOverlay = () =>
                    <span>{`Click ${data.hugoGeneSymbol} to ${_.includes(this.props.selectedGenes, data.hugoGeneSymbol) ? 'remove' : 'add'} from your query`}</span>;
                const qvalOverlay = () =>
                    <div><b>Gistic</b><br/><i>Q-value: </i><span>{data.qValue.toExponential(EXPONENTIAL_FRACTION_DIGITS)}</span></div>;
                return (
                    <div className={classnames(styles.noFlexShrink, styles.displayFlex)}>
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
                                <img src={require("./images/gistic.png")} className={styles.mutSig}></img>
                            </DefaultTooltip>
                        </If>
                    </div>
                )
            },
            sortBy: (data: CopyNumberCountByGene) => data.hugoGeneSymbol,
            defaultSortDirection: 'asc' as 'asc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return data.hugoGeneSymbol.indexOf(filterStringUpper) > -1;
            },
            width: 85
        },
        {
            name: 'Cytoband',
            render: (data: CopyNumberCountByGene) => <span>{data.cytoband}</span>,
            sortBy: (data: CopyNumberCountByGene) => data.cytoband,
            defaultSortDirection: 'asc' as 'asc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return _.isUndefined(data.cytoband) ? false : data.cytoband.indexOf(filterStringUpper) > -1;
            },
            width: 100
        },
        {
            name: 'CNA',
            render: (data: CopyNumberCountByGene) =>
                <span className={classnames(data.alteration === -2 ? styles.del : styles.amp)}>
                    {getCNAByAlteration(data.alteration)}
                </span>,
            sortBy: (data: CopyNumberCountByGene) => data.alteration,
            defaultSortDirection: 'asc' as 'asc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return getCNAByAlteration(data.alteration).indexOf(filterStringUpper) > -1;
            },
            width: 65
        },
        {
            name: '#',
            render: (data: CopyNumberCountByGene) =>
                <LabeledCheckbox
                    checked={this.isChecked(data.entrezGeneId, data.alteration)}
                    disabled={this.isDisabled(data.entrezGeneId, data.alteration)}
                    onChange={event => this.togglePreSelectRow(data.entrezGeneId, data.alteration)}
                >
                    {data.countByEntity}
                </LabeledCheckbox>,
            sortBy: (data: CopyNumberCountByGene) => data.countByEntity,
            defaultSortDirection: 'desc' as 'desc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return _.toString(data.countByEntity).indexOf(filterStringUpper) > -1;
            },
            width: 75
        },
        {
            name: 'Freq',
            render: (data: CopyNumberCountByGene) => <span>{data.frequency + '%'}</span>,
            sortBy: (data: CopyNumberCountByGene) => data.frequency,
            defaultSortDirection: 'desc' as 'desc',
            filter: (data: CopyNumberCountByGene, filterString: string, filterStringUpper: string) => {
                return _.toString(data.frequency).indexOf(filterStringUpper) > -1;
            },
            width: 75
        }
    ];

    @bind
    isChecked(entrezGeneId: number, alteration: number) {
        let record = _.find(this.preSelectedRows, (row: CNAGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId && row.alteration === alteration);
        if (_.isUndefined(record)) {
            return this.selectedRows.length > 0 && !_.isUndefined(_.find(this.selectedRows, (row: CNAGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId && row.alteration === alteration));
        } else {
            return true;
        }
    }

    @bind
    isDisabled(entrezGeneId: number, alteration: number) {
        return !_.isUndefined(_.find(this.selectedRows, (row: CNAGenesTableUserSelectionWithIndex) => row.entrezGeneId === entrezGeneId && row.alteration === alteration));
    }

    @bind
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
                    alteration: datum.alteration
                })
            }
        } else {
            this.preSelectedRows = _.xorBy(this.preSelectedRows, [record], 'rowIndex');
        }
    }

    @bind
    @action
    afterSelectingRows() {
        this.props.onUserSelection(this.preSelectedRows.map(row => {
            return {
                entrezGeneId: row.entrezGeneId,
                alteration: row.alteration
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
                        alteration: row.alteration
                    });
                }
                return acc;
            }, []);
        }
    }

    @bind
    isSelectedRow(data: CopyNumberCountByGene) {
        return !_.isUndefined(_.find(_.union(this.selectedRows, this.preSelectedRows), function (row) {
            return row.entrezGeneId === data.entrezGeneId && row.alteration === data.alteration;
        }));
    }

    public render() {
        return (
            <CNAGenesTableComponent
                data={this.props.promise.result || []}
                columns={this._columns}
                selectedGenes={this.props.selectedGenes}
                selectedRows={_.map(_.union(this.selectedRows, this.preSelectedRows), row => row.rowIndex)}
                showSelectSamples={true && this.preSelectedRows.length > 0}
                afterSelectingRows={this.afterSelectingRows}
                isSelectedRow={this.isSelectedRow}
                sortBy='#'
            />
        );
    }
}

