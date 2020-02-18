import * as React from 'react';
import { observer } from 'mobx-react';
import * as _ from 'lodash';
import FixedHeaderTable from './FixedHeaderTable';
import { action, computed, observable } from 'mobx';
import autobind from 'autobind-decorator';
import { Column, SortDirection } from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import { StudyViewGenePanelModal } from './StudyViewGenePanelModal';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import { GenePanel } from 'shared/api/generated/CBioPortalAPI';
import {
    correctColumnWidth,
    correctMargin,
    getCNAByAlteration,
    getCNAColorByAlteration,
    getFixedHeaderNumberCellMargin,
    getFixedHeaderTableMaxLengthStringPixel,
    getFrequencyStr,
} from 'pages/studyView/StudyViewUtils';
import { OncokbCancerGene } from 'pages/studyView/StudyViewPageStore';
import { getFreqColumnRender, getGeneColumnHeaderRender } from 'pages/studyView/TableUtils';
import { GeneCell } from 'pages/studyView/table/GeneCell';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import styles from 'pages/studyView/table/tables.module.scss';
import MobxPromise from 'mobxpromise';
import { stringListToIndexSet, stringListToSet } from 'cbioportal-frontend-commons';
import ifNotDefined from 'shared/lib/ifNotDefined';

export type GeneTableRow = OncokbCancerGene & {
    entrezGeneId: number;
    hugoGeneSymbol: string;
    matchingGenePanelIds: Array<string>;
    numberOfAlteredCases: number;
    numberOfProfiledCases: number;
    qValue: number;
    totalCount: number;
    alteration?: number;
    cytoband?: string;
    uniqueKey: string;
};

export enum GeneTableColumnKey {
    GENE = 'Gene',
    NUMBER_FUSIONS = '# Fusion',
    NUMBER_MUTATIONS = '# Mut',
    CYTOBAND = 'Cytoband',
    CNA = 'CNA',
    NUMBER = '#',
    FREQ = 'Freq',
}

export type GeneTableColumn = {
    columnKey: GeneTableColumnKey;
    columnWidthRatio?: number;
};

export type GeneTableProps = {
    tableType: 'mutation' | 'fusion' | 'cna';
    promise: MobxPromise<GeneTableRow[]>;
    width: number;
    height: number;
    filters: string[][];
    onUserSelection: (value: string[]) => void;
    numOfSelectedSamples: number;
    onGeneSelect: (hugoGeneSymbol: string) => void;
    selectedGenes: string[];
    cancerGeneFilterEnabled?: boolean;
    genePanelCache: MobxPromiseCache<{ genePanelId: string }, GenePanel>;
    filterByCancerGenes: boolean;
    onChangeCancerGeneFilter: (filtered: boolean) => void;
    defaultSortBy: GeneTableColumnKey;
    columns: GeneTableColumn[];
};

const DEFAULT_COLUMN_WIDTH_RATIO: { [key in GeneTableColumnKey]: number } = {
    [GeneTableColumnKey.GENE]: 0.35,
    [GeneTableColumnKey.NUMBER_MUTATIONS]: 0.25,
    [GeneTableColumnKey.NUMBER_FUSIONS]: 0.25,
    [GeneTableColumnKey.NUMBER]: 0.25,
    [GeneTableColumnKey.FREQ]: 0.15,
    [GeneTableColumnKey.CYTOBAND]: 0.25,
    [GeneTableColumnKey.CNA]: 0.14,
};

class GeneTableComponent extends FixedHeaderTable<GeneTableRow> {}

@observer
export class GeneTable extends React.Component<GeneTableProps, {}> {
    @observable protected selectedRowsKeys: string[] = [];
    @observable protected sortBy: GeneTableColumnKey;
    @observable private sortDirection: SortDirection;
    @observable private modalSettings: {
        modalOpen: boolean;
        modalPanelName: string;
    } = {
        modalOpen: false,
        modalPanelName: '',
    };

    public static defaultProps = {
        cancerGeneFilterEnabled: false,
    };

    constructor(props: GeneTableProps, context: any) {
        super(props, context);
        this.sortBy = this.props.defaultSortBy;
    }

    getDefaultColumnDefinition = (
        columnKey: GeneTableColumnKey,
        columnWidth: number,
        cellMargin: number
    ) => {
        const defaults: {
            [key in GeneTableColumnKey]: Column<GeneTableRow>;
        } = {
            [GeneTableColumnKey.GENE]: {
                name: columnKey,
                headerRender: () => {
                    return getGeneColumnHeaderRender(
                        cellMargin,
                        columnKey,
                        this.props.cancerGeneFilterEnabled!,
                        this.isFilteredByCancerGeneList,
                        this.toggleCancerGeneFilter
                    );
                },
                render: (data: GeneTableRow) => {
                    return (
                        <GeneCell
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
                    );
                },
                sortBy: (data: GeneTableRow) => data.hugoGeneSymbol,
                defaultSortDirection: 'asc' as 'asc',
                filter: (data: GeneTableRow, filterString: string, filterStringUpper: string) => {
                    return data.hugoGeneSymbol.toUpperCase().includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [GeneTableColumnKey.NUMBER]: {
                name: columnKey,
                tooltip: <span>Number of samples with one or more mutations</span>,
                headerRender: () => {
                    return <div style={{ marginLeft: cellMargin }}>#</div>;
                },
                render: (data: GeneTableRow) => (
                    <LabeledCheckbox
                        checked={this.isChecked(data.uniqueKey)}
                        disabled={this.isDisabled(data.uniqueKey)}
                        onChange={event => this.togglePreSelectRow(data.uniqueKey)}
                        labelProps={{
                            style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginLeft: cellMargin,
                                marginRight: cellMargin,
                            },
                        }}
                        inputProps={{
                            className: styles.autoMarginCheckbox,
                        }}
                    >
                        <span>{data.numberOfAlteredCases.toLocaleString()}</span>
                    </LabeledCheckbox>
                ),
                sortBy: (data: GeneTableRow) => data.numberOfAlteredCases,
                defaultSortDirection: 'desc' as 'desc',
                filter: (data: GeneTableRow, filterString: string) => {
                    return _.toString(data.numberOfAlteredCases).includes(filterString);
                },
                width: columnWidth,
            },
            [GeneTableColumnKey.FREQ]: {
                name: columnKey,
                tooltip: <span>Percentage of samples with one or more mutations</span>,
                headerRender: () => {
                    return <div style={{ marginLeft: cellMargin }}>Freq</div>;
                },
                render: (data: GeneTableRow) => {
                    return getFreqColumnRender(
                        this.props.tableType,
                        data.numberOfProfiledCases,
                        data.numberOfAlteredCases,
                        data.matchingGenePanelIds,
                        this.toggleModal,
                        { marginLeft: cellMargin }
                    );
                },
                sortBy: (data: GeneTableRow) =>
                    (data.numberOfAlteredCases / data.numberOfProfiledCases) * 100,
                defaultSortDirection: 'desc' as 'desc',
                filter: (data: GeneTableRow, filterString: string) => {
                    return _.toString(
                        getFrequencyStr(data.numberOfAlteredCases / data.numberOfProfiledCases)
                    ).includes(filterString);
                },
                width: columnWidth,
            },
            [GeneTableColumnKey.NUMBER_MUTATIONS]: {
                name: columnKey,
                tooltip: <span>Total number of mutations</span>,
                headerRender: () => {
                    return <div style={{ marginLeft: cellMargin }}># Mut</div>;
                },
                render: (data: GeneTableRow) => (
                    <span
                        style={{
                            flexDirection: 'row-reverse',
                            display: 'flex',
                            marginRight: cellMargin,
                        }}
                    >
                        {data.totalCount.toLocaleString()}
                    </span>
                ),
                sortBy: (data: GeneTableRow) => data.totalCount,
                defaultSortDirection: 'desc' as 'desc',
                filter: (data: GeneTableRow, filterString: string) => {
                    return _.toString(data.totalCount).includes(filterString);
                },
                width: columnWidth,
            },
            [GeneTableColumnKey.NUMBER_FUSIONS]: {
                name: GeneTableColumnKey.NUMBER_FUSIONS,
                tooltip: <span>Total number of mutations</span>,
                headerRender: () => {
                    return <span># Fusion</span>;
                },
                render: (data: GeneTableRow) => (
                    <span
                        style={{
                            flexDirection: 'row-reverse',
                            display: 'flex',
                            marginRight: cellMargin,
                        }}
                    >
                        {data.totalCount.toLocaleString()}
                    </span>
                ),
                sortBy: (data: GeneTableRow) => data.totalCount,
                defaultSortDirection: 'desc' as 'desc',
                filter: (data: GeneTableRow, filterString: string) => {
                    return _.toString(data.totalCount).includes(filterString);
                },
                width: columnWidth,
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
                            color: getCNAColorByAlteration(getCNAByAlteration(data.alteration!)),
                            fontWeight: 'bold',
                        }}
                    >
                        {getCNAByAlteration(data.alteration!)}
                    </span>
                ),
                sortBy: (data: GeneTableRow) => data.alteration!,
                defaultSortDirection: 'asc' as 'asc',
                filter: (data: GeneTableRow, filterString: string, filterStringUpper: string) => {
                    return getCNAByAlteration(data.alteration!).includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [GeneTableColumnKey.CYTOBAND]: {
                name: GeneTableColumnKey.CYTOBAND,
                tooltip: <span>Cytoband</span>,
                render: (data: GeneTableRow) => <span>{data.cytoband}</span>,
                sortBy: (data: GeneTableRow) => data.cytoband!,
                defaultSortDirection: 'asc' as 'asc',
                filter: (data: GeneTableRow, filterString: string, filterStringUpper: string) => {
                    return _.isUndefined(data.cytoband)
                        ? false
                        : data.cytoband.toUpperCase().includes(filterStringUpper);
                },
                width: columnWidth,
            },
        };
        return defaults[columnKey];
    };

    getDefaultCellMargin = (columnKey: GeneTableColumnKey, columnWidth: number) => {
        const defaults: { [key in GeneTableColumnKey]: number } = {
            [GeneTableColumnKey.GENE]: 0,
            [GeneTableColumnKey.NUMBER_MUTATIONS]: correctMargin(
                getFixedHeaderNumberCellMargin(columnWidth, this.totalCountLocaleString)
            ),
            [GeneTableColumnKey.NUMBER_FUSIONS]: correctMargin(
                getFixedHeaderNumberCellMargin(columnWidth, this.totalCountLocaleString)
            ),
            [GeneTableColumnKey.NUMBER]: correctMargin(
                (columnWidth -
                    10 -
                    (getFixedHeaderTableMaxLengthStringPixel(this.alteredCasesLocaleString) + 20)) /
                    2
            ),
            [GeneTableColumnKey.FREQ]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    columnWidth,
                    getFrequencyStr(
                        _.max(
                            this.tableData.map(
                                item =>
                                    (item.numberOfAlteredCases! / item.numberOfProfiledCases!) * 100
                            )
                        )!
                    )
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
        return this.maxNumberTotalCount === undefined
            ? ''
            : this.maxNumberTotalCount.toLocaleString();
    }

    @computed
    get alteredCasesLocaleString() {
        return this.maxNumberAlteredCasesColumn === undefined
            ? ''
            : this.maxNumberAlteredCasesColumn.toLocaleString();
    }

    @computed
    get columnsWidth() {
        return _.reduce(
            this.props.columns,
            (acc, column) => {
                acc[column.columnKey] = correctColumnWidth(
                    (column.columnWidthRatio
                        ? column.columnWidthRatio
                        : DEFAULT_COLUMN_WIDTH_RATIO[column.columnKey]) * this.props.width
                );
                return acc;
            },
            {} as { [key in GeneTableColumnKey]: number }
        );
    }

    @computed
    get cellMargin() {
        return _.reduce(
            this.props.columns,
            (acc, column) => {
                acc[column.columnKey] = this.getDefaultCellMargin(
                    column.columnKey,
                    this.columnsWidth[column.columnKey]
                );
                return acc;
            },
            {} as { [key in GeneTableColumnKey]: number }
        );
    }

    @computed get tableData() {
        return this.isFilteredByCancerGeneList
            ? _.filter(this.props.promise.result, data => data.isCancerGene)
            : this.props.promise.result || [];
    }

    @computed get flattenedFilters() {
        return _.flatMap(this.props.filters);
    }

    @computed get selectableTableData() {
        if (this.flattenedFilters.length === 0) {
            return this.tableData;
        }
        return _.filter(this.tableData, data => !this.flattenedFilters.includes(data.uniqueKey));
    }

    @computed
    get preSelectedRows() {
        if (this.flattenedFilters.length === 0) {
            return [];
        }
        const order = stringListToIndexSet(this.flattenedFilters);
        return _.chain(this.tableData)
            .filter(data => this.flattenedFilters.includes(data.uniqueKey))
            .sortBy<GeneTableRow>(data =>
                ifNotDefined(order[data.uniqueKey], Number.POSITIVE_INFINITY)
            )
            .value();
    }

    @computed
    get preSelectedRowsKeys() {
        return this.preSelectedRows.map(row => row.uniqueKey);
    }

    @computed
    get tableColumns() {
        return this.props.columns.map(column =>
            this.getDefaultColumnDefinition(
                column.columnKey,
                this.columnsWidth[column.columnKey],
                this.cellMargin[column.columnKey]
            )
        );
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
        this.props.onChangeCancerGeneFilter(!this.props.filterByCancerGenes);
    }

    @computed get isFilteredByCancerGeneList() {
        return !!this.props.cancerGeneFilterEnabled && this.props.filterByCancerGenes;
    }

    @computed get allSelectedRowsKeysSet() {
        return stringListToSet([...this.selectedRowsKeys, ...this.preSelectedRowsKeys]);
    }

    @autobind
    isChecked(uniqueKey: string) {
        return !!this.allSelectedRowsKeysSet[uniqueKey];
    }

    @autobind
    isDisabled(uniqueKey: string) {
        return _.some(this.preSelectedRowsKeys, key => key === uniqueKey);
    }

    @autobind
    togglePreSelectRow(uniqueKey: string) {
        const record = _.find(this.selectedRowsKeys, key => key === uniqueKey);
        if (_.isUndefined(record)) {
            this.selectedRowsKeys.push(uniqueKey);
        } else {
            this.selectedRowsKeys = _.xorBy(this.selectedRowsKeys, [record]);
        }
    }

    @autobind
    @action
    afterSelectingRows() {
        this.props.onUserSelection(this.selectedRowsKeys);
        this.selectedRowsKeys = [];
    }

    @autobind
    isSelectedRow(data: GeneTableRow) {
        return this.isChecked(data.uniqueKey);
    }

    @computed get filterKeyToIndexSet() {
        return _.reduce(
            this.props.filters,
            (acc, next, index) => {
                next.forEach(key => {
                    acc[key] = index;
                });
                return acc;
            },
            {} as { [id: string]: number }
        );
    }

    @autobind
    selectedRowClassName(data: GeneTableRow) {
        const index = this.filterKeyToIndexSet[data.uniqueKey];
        if (index === undefined) {
            return this.props.filters.length % 2 === 0
                ? styles.highlightedEvenRow
                : styles.highlightedOddRow;
        }
        return index % 2 === 0 ? styles.highlightedEvenRow : styles.highlightedOddRow;
    }

    @autobind
    @action
    afterSorting(sortBy: GeneTableColumnKey, sortDirection: SortDirection) {
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    public render() {
        const tableId = `${this.props.tableType}-genes-table`;
        return (
            <div data-test={tableId} key={tableId}>
                {this.props.promise.isComplete && (
                    <GeneTableComponent
                        width={this.props.width}
                        height={this.props.height}
                        data={this.selectableTableData}
                        columns={this.tableColumns}
                        showSelectSamples={true && this.selectedRowsKeys.length > 0}
                        isSelectedRow={this.isSelectedRow}
                        afterSelectingRows={this.afterSelectingRows}
                        sortBy={this.sortBy}
                        sortDirection={this.sortDirection}
                        afterSorting={this.afterSorting}
                        fixedTopRowsData={this.preSelectedRows}
                        highlightedRowClassName={this.selectedRowClassName}
                    />
                )}
                {this.props.genePanelCache ? (
                    <StudyViewGenePanelModal
                        show={this.modalSettings.modalOpen}
                        genePanelCache={this.props.genePanelCache}
                        panelName={this.modalSettings.modalPanelName}
                        onHide={this.closeModal}
                    />
                ) : null}
            </div>
        );
    }
}
