import * as React from "react";
import {observer} from "mobx-react";
import * as _ from "lodash";
import FixedHeaderTable from "./FixedHeaderTable";
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {Column, SortDirection} from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import {GenePanelModal} from "./GenePanelModal";
import MobxPromiseCache from "shared/lib/MobxPromiseCache";
import {GenePanel} from "shared/api/generated/CBioPortalAPI";
import {
    correctColumnWidth,
    correctMargin, getCNAByAlteration, getCNAColorByAlteration,
    getFixedHeaderNumberCellMargin,
    getFixedHeaderTableMaxLengthStringPixel, getFrequencyStr
} from "pages/studyView/StudyViewUtils";
import {
    OncokbCancerGene
} from "pages/studyView/StudyViewPageStore";
import {getFreqColumnRender, getGeneColumnHeaderRender, rowIsChecked, rowIsDisabled} from "pages/studyView/TableUtils";
import {GeneCell} from "pages/studyView/table/GeneCell";
import LabeledCheckbox from "shared/components/labeledCheckbox/LabeledCheckbox";
import styles from "pages/studyView/table/tables.module.scss";
import MobxPromise from "mobxpromise";

export type GeneTableUserSelectionWithIndex = {
    uniqueKey: string;
    rowIndex: number;
};

export type GeneTableRow = OncokbCancerGene & {
    entrezGeneId: number
    hugoGeneSymbol: string
    matchingGenePanelIds: Array<string>
    numberOfAlteredCases: number
    numberOfProfiledCases: number
    qValue: number
    totalCount: number
    alteration?: number
    cytoband?: string
    uniqueKey: string
}

export enum GeneTableColumnKey {
    GENE = "Gene",
    NUMBER_FUSIONS = "# Fusion",
    NUMBER_MUTATIONS = "# Mut",
    CYTOBAND = "Cytoband",
    CNA = "CNA",
    NUMBER = "#",
    FREQ = "Freq"
}

export type GeneTableColumn = {
    columnKey: GeneTableColumnKey,
    columnWidthRatio?: number
}

export type GeneTableProps = & {
    tableType: 'mutation' | 'fusion' | 'cna',
    promise: MobxPromise<GeneTableRow[]>;
    width: number;
    height: number;
    filters: string[];
    onUserSelection: (value: string[]) => void;
    numOfSelectedSamples: number;
    onGeneSelect: (hugoGeneSymbol: string) => void;
    selectedGenes: string[];
    cancerGeneFilterEnabled?: boolean;
    genePanelCache: MobxPromiseCache<{ genePanelId: string }, GenePanel>;
    filterByCancerGenes: boolean;
    onChangeCancerGeneFilter: (filtered: boolean) => void;
    defaultSortBy: GeneTableColumnKey;
    columns: GeneTableColumn[],
}

const DEFAULT_COLUMN_WIDTH_RATIO: { [key in GeneTableColumnKey]: number } = {
    [GeneTableColumnKey.GENE]: 0.35,
    [GeneTableColumnKey.NUMBER_MUTATIONS]: 0.25,
    [GeneTableColumnKey.NUMBER_FUSIONS]: 0.25,
    [GeneTableColumnKey.NUMBER]: 0.25,
    [GeneTableColumnKey.FREQ]: 0.15,
    [GeneTableColumnKey.CYTOBAND]: 0.25,
    [GeneTableColumnKey.CNA]: 0.14,
};

class GeneTableComponent extends FixedHeaderTable<GeneTableRow> {
}

@observer
export class GeneTable extends React.Component<GeneTableProps, {}> {
    @observable protected preSelectedRows: GeneTableUserSelectionWithIndex[] = [];
    @observable protected sortBy: GeneTableColumnKey;
    @observable private sortDirection: SortDirection;
    @observable private modalSettings: {
        modalOpen: boolean;
        modalPanelName: string;
    } = {
        modalOpen: false,
        modalPanelName: ""
    };

    public static defaultProps = {
        cancerGeneFilterEnabled: false
    };


    constructor(props: GeneTableProps, context: any) {
        super(props, context);
        this.sortBy = this.props.defaultSortBy;
    }

    getDefaultColumnDefinition = (columnKey: GeneTableColumnKey, columnWidth: number, cellMargin: number) => {
        const defaults: { [key in GeneTableColumnKey]: Column<GeneTableRow> } = {
            [GeneTableColumnKey.GENE]: {
                name: columnKey,
                headerRender: () => {
                    return getGeneColumnHeaderRender(cellMargin, columnKey, this.props.cancerGeneFilterEnabled!, this.isFilteredByCancerGeneList, this.toggleCancerGeneFilter);
                },
                render: (data: GeneTableRow) => {
                    return <GeneCell
                        tableType={this.props.tableType}
                        selectedGenes={this.props.selectedGenes}
                        hugoGeneSymbol={data.hugoGeneSymbol}
                        qValue={data.qValue}
                        isCancerGene={data.isCancerGene}
                        oncokbAnnotated={data.oncokbAnnotated}
                        isOncogene={data.isOncokbOncogene}
                        isTumorSuppressorGene={data.isOncokbTumorSuppressorGene}
                        onGeneSelect={this.props.onGeneSelect}
                    />
                },
                sortBy: (data: GeneTableRow) => data.hugoGeneSymbol,
                defaultSortDirection: "asc" as "asc",
                filter: (
                    data: GeneTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.hugoGeneSymbol.toUpperCase().includes(filterStringUpper);
                },
                width: columnWidth
            },
            [GeneTableColumnKey.NUMBER]: {
                name: columnKey,
                tooltip: <span>Number of samples with one or more mutations</span>,
                headerRender: () => {
                    return <div style={{marginLeft: cellMargin}}>#</div>;
                },
                render: (data: GeneTableRow) => (
                    <LabeledCheckbox
                        checked={this.isChecked(data.uniqueKey)}
                        disabled={this.isDisabled(data.uniqueKey)}
                        onChange={event => this.togglePreSelectRow(data.uniqueKey)}
                        labelProps={{
                            style: {
                                display: "flex",
                                justifyContent: "space-between",
                                marginLeft: cellMargin,
                                marginRight: cellMargin
                            }
                        }}
                        inputProps={{
                            className: styles.autoMarginCheckbox
                        }}
                    >
                        <span>{data.numberOfAlteredCases.toLocaleString()}</span>
                    </LabeledCheckbox>
                ),
                sortBy: (data: GeneTableRow) => data.numberOfAlteredCases,
                defaultSortDirection: "desc" as "desc",
                filter: (data: GeneTableRow, filterString: string) => {
                    return _.toString(data.numberOfAlteredCases).includes(filterString);
                },
                width: columnWidth
            },
            [GeneTableColumnKey.FREQ]: {
                name: columnKey,
                tooltip: <span>Percentage of samples with one or more mutations</span>,
                headerRender: () => {
                    return <div style={{marginLeft: cellMargin}}>Freq</div>;
                },
                render: (data: GeneTableRow) => {
                    return getFreqColumnRender(this.props.tableType, data.numberOfProfiledCases, data.numberOfAlteredCases, data.matchingGenePanelIds, this.toggleModal, {marginLeft: cellMargin});
                },
                sortBy: (data: GeneTableRow) =>
                    (data.numberOfAlteredCases / data.numberOfProfiledCases) * 100,
                defaultSortDirection: "desc" as "desc",
                filter: (data: GeneTableRow, filterString: string) => {
                    return _.toString(
                        getFrequencyStr(data.numberOfAlteredCases / data.numberOfProfiledCases)
                    ).includes(filterString);
                },
                width: columnWidth
            },
            [GeneTableColumnKey.NUMBER_MUTATIONS]: {
                name: columnKey,
                tooltip: <span>Total number of mutations</span>,
                headerRender: () => {
                    return (
                        <div style={{marginLeft: cellMargin}}>
                            # Mut
                        </div>
                    );
                },
                render: (data: GeneTableRow) => (
                    <span
                        style={{
                            flexDirection: "row-reverse",
                            display: "flex",
                            marginRight: cellMargin
                        }}
                    >
                        {data.totalCount.toLocaleString()}
                    </span>
                ),
                sortBy: (data: GeneTableRow) => data.totalCount,
                defaultSortDirection: "desc" as "desc",
                filter: (data: GeneTableRow, filterString: string) => {
                    return _.toString(data.totalCount).includes(filterString);
                },
                width: columnWidth
            },
            [GeneTableColumnKey.NUMBER_FUSIONS]: {
                name: GeneTableColumnKey.NUMBER_FUSIONS,
                tooltip: <span>Total number of mutations</span>,
                headerRender: () => {
                    return (
                        <span># Fusion</span>
                    );
                },
                render: (data: GeneTableRow) => (
                    <span
                        style={{
                            flexDirection: "row-reverse",
                            display: "flex",
                            marginRight: cellMargin
                        }}
                    >
                        {data.totalCount.toLocaleString()}
                    </span>
                ),
                sortBy: (data: GeneTableRow) => data.totalCount,
                defaultSortDirection: "desc" as "desc",
                filter: (data: GeneTableRow, filterString: string) => {
                    return _.toString(data.totalCount).includes(filterString);
                },
                width: columnWidth
            },
            [GeneTableColumnKey.CNA]: {
                name: GeneTableColumnKey.CNA,
                tooltip: (
                    <span>
                        Copy number alteration, only amplifications and deep deletions are shown
                    </span>
                ),
                render: (data: GeneTableRow) => (
                    <span
                        style={{
                            color: getCNAColorByAlteration(data.alteration!),
                            fontWeight: "bold"
                        }}
                    >
                        {getCNAByAlteration(data.alteration!)}
                    </span>
                ),
                sortBy: (data: GeneTableRow) => data.alteration!,
                defaultSortDirection: "asc" as "asc",
                filter: (
                    data: GeneTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return getCNAByAlteration(data.alteration!).includes(filterStringUpper);
                },
                width: columnWidth
            },
            [GeneTableColumnKey.CYTOBAND]: {
                name: GeneTableColumnKey.CYTOBAND,
                tooltip: <span>Cytoband</span>,
                render: (data: GeneTableRow) => <span>{data.cytoband}</span>,
                sortBy: (data: GeneTableRow) => data.cytoband!,
                defaultSortDirection: "asc" as "asc",
                filter: (
                    data: GeneTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return _.isUndefined(data.cytoband)
                        ? false
                        : data.cytoband.toUpperCase().includes(filterStringUpper);
                },
                width: columnWidth
            },
        }
        return defaults[columnKey];
    }

    getDefaultCellMargin = (columnKey: GeneTableColumnKey, columnWidth: number) => {
        const defaults: { [key in GeneTableColumnKey]: number } = {
            [GeneTableColumnKey.GENE]: 0,
            [GeneTableColumnKey.NUMBER_MUTATIONS]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    columnWidth,
                    this.totalCountLocaleString
                )
            ),
            [GeneTableColumnKey.NUMBER_FUSIONS]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    columnWidth,
                    this.totalCountLocaleString
                )
            ),
            [GeneTableColumnKey.NUMBER]: correctMargin(
                (columnWidth - 10 - (
                        getFixedHeaderTableMaxLengthStringPixel(this.alteredCasesLocaleString) + 20)
                ) / 2),
            [GeneTableColumnKey.FREQ]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    columnWidth,
                    getFrequencyStr(_.max(this.tableData.map(item => (item.numberOfAlteredCases! / item.numberOfProfiledCases!) * 100))!)
                )
            ),
            [GeneTableColumnKey.CYTOBAND]: 0,
            [GeneTableColumnKey.CNA]: 0,
        };
        return defaults[columnKey];
    };

    @computed
    get maxNumberTotalCount() {
        return _.max(this.tableData.map(item => item.totalCount));
    }

    @computed
    get maxNumberAlteredCasesColumn() {
        return _.max(this.tableData!.map(item => item.numberOfAlteredCases));
    }

    @computed
    get totalCountLocaleString() {
        return this.maxNumberTotalCount === undefined ? '' : this.maxNumberTotalCount.toLocaleString();
    }

    @computed
    get alteredCasesLocaleString() {
        return this.maxNumberAlteredCasesColumn === undefined ? '' : this.maxNumberAlteredCasesColumn.toLocaleString();
    }

    @computed
    get columnsWidth() {
        return _.reduce(this.props.columns, (acc, column) => {
            acc[column.columnKey] = correctColumnWidth((column.columnWidthRatio ? column.columnWidthRatio : DEFAULT_COLUMN_WIDTH_RATIO[column.columnKey]) * this.props.width);
            return acc;
        }, {} as { [key in GeneTableColumnKey]: number });
    }

    @computed
    get cellMargin() {
        return _.reduce(this.props.columns, (acc, column) => {
            acc[column.columnKey] = this.getDefaultCellMargin(column.columnKey, this.columnsWidth[column.columnKey]);
            return acc;
        }, {} as { [key in GeneTableColumnKey]: number });
    }

    @computed get tableData() {
        return this.isFilteredByCancerGeneList ? _.filter(this.props.promise.result, data => data.isCancerGene) : (this.props.promise.result || []);
    }

    @computed
    get tableColumns() {
        return this.props.columns.map(column => this.getDefaultColumnDefinition(column.columnKey, this.columnsWidth[column.columnKey], this.cellMargin[column.columnKey]));
    }


    @autobind
    @action
    toggleModal(panelName: string) {
        this.modalSettings.modalOpen = !this.modalSettings.modalOpen;
        if (!this.modalSettings.modalOpen) {
            return;
        }
        this.modalSettings.modalPanelName = panelName;
    }

    @autobind
    @action
    closeModal() {
        this.modalSettings.modalOpen = !this.modalSettings.modalOpen;
    }

    @autobind
    toggleCancerGeneFilter(event: any) {
        event.stopPropagation();
        this.props.onChangeCancerGeneFilter(!this.props.filterByCancerGenes)
    }

    @computed get isFilteredByCancerGeneList() {
        return !!this.props.cancerGeneFilterEnabled && this.props.filterByCancerGenes;
    }

    @autobind
    isChecked(uniqueKey: string) {
        return rowIsChecked(uniqueKey, this.preSelectedRows, this.selectedRows);
    }

    @autobind
    isDisabled(uniqueKey: string) {
        return rowIsDisabled(uniqueKey, this.selectedRows);
    }

    @autobind
    togglePreSelectRow(uniqueKey: string) {
        const record: GeneTableUserSelectionWithIndex | undefined = _.find(
            this.preSelectedRows,
            (row: GeneTableUserSelectionWithIndex) => row.uniqueKey === uniqueKey
        );
        if (_.isUndefined(record)) {
            let dataIndex = -1;
            // definitely there is a match
            const datum = _.find(
                this.tableData,
                (row, index: number) => {
                    const exist = row.uniqueKey! === uniqueKey;
                    if (exist) {
                        dataIndex = index;
                    }
                    return exist;
                }
            );

            if (!_.isUndefined(datum)) {
                this.preSelectedRows.push({
                    rowIndex: dataIndex,
                    uniqueKey: datum.uniqueKey!,
                });
            }
        } else {
            this.preSelectedRows = _.xorBy(this.preSelectedRows, [record], "rowIndex");
        }
    }

    @autobind
    @action
    afterSelectingRows() {
        this.props.onUserSelection(
            this.preSelectedRows.map(row => row.uniqueKey)
        );
        this.preSelectedRows = [];
    }

    @computed
    get selectedRows() {
        if (this.props.filters.length === 0) {
            return [];
        } else {
            return _.reduce(
                this.tableData,
                (
                    acc: GeneTableUserSelectionWithIndex[],
                    row,
                    index: number
                ) => {
                    if (_.includes(this.props.filters, row.uniqueKey)) {
                        acc.push({
                            rowIndex: index,
                            uniqueKey: row.uniqueKey
                        });
                    }
                    return acc;
                },
                []
            );
        }
    }

    @autobind
    isSelectedRow(data: GeneTableRow) {
        return !_.isUndefined(
            _.find(_.union(this.selectedRows, this.preSelectedRows), function (row) {
                return row.uniqueKey === data.uniqueKey;
            })
        );
    }

    @autobind
    @action
    afterSorting(sortBy: GeneTableColumnKey, sortDirection: SortDirection) {
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    public render() {
        const tableId= `${this.props.tableType}-genes-table`
        return (
            <div data-test={tableId} key={tableId}>
                {this.props.promise.isComplete && (
                    <GeneTableComponent
                        width={this.props.width}
                        height={this.props.height}
                        data={this.tableData}
                        columns={this.tableColumns}
                        showSelectSamples={true && this.preSelectedRows.length > 0}
                        isSelectedRow={this.isSelectedRow}
                        afterSelectingRows={this.afterSelectingRows}
                        sortBy={this.sortBy}
                        sortDirection={this.sortDirection}
                        afterSorting={this.afterSorting}
                    />
                )}
                {this.props.genePanelCache ? (
                    <GenePanelModal
                        show={this.modalSettings.modalOpen}
                        genePanelCache={this.props.genePanelCache}
                        panelName={this.modalSettings.modalPanelName}
                        hide={this.closeModal}
                    />
                ) : null}
            </div>
        );
    }
}
