import * as React from 'react';
import { observer } from 'mobx-react';
import * as _ from 'lodash';
import FixedHeaderTable, { IFixedHeaderTableProps } from './FixedHeaderTable';
import { action, computed, observable } from 'mobx';
import autobind from 'autobind-decorator';
import {
    Column,
    SortDirection,
} from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import { StudyViewGenePanelModal } from './StudyViewGenePanelModal';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import { GenePanel } from 'cbioportal-ts-api-client';
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
import {
    getFreqColumnRender,
    getGeneColumnHeaderRender,
    getTooltip,
    FreqColumnTypeEnum,
    SelectionOperatorEnum,
} from 'pages/studyView/TableUtils';
import { GeneCell } from 'pages/studyView/table/GeneCell';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import styles from 'pages/studyView/table/tables.module.scss';
import MobxPromise from 'mobxpromise';
import {
    stringListToIndexSet,
    stringListToSet,
    EllipsisTextTooltip,
} from 'cbioportal-frontend-commons';
import ifNotDefined from 'shared/lib/ifNotDefined';

export type MultiSelectionTableRow = OncokbCancerGene & {
    label: string;
    matchingGenePanelIds: Array<string>;
    numberOfAlteredCases: number;
    numberOfProfiledCases: number;
    qValue: number;
    numberOfAlterations: number;
    alteration?: number;
    cytoband?: string;
    uniqueKey: string;
};

export enum MultiSelectionTableColumnKey {
    GENE = 'Gene',
    MOLECULAR_PROFILE = 'Molecular Profile',
    CASE_LIST = 'Name',
    NUMBER_FUSIONS = '# Fusion',
    NUMBER_MUTATIONS = '# Mut',
    CYTOBAND = 'Cytoband',
    CNA = 'CNA',
    NUMBER = '#',
    FREQ = 'Freq',
}

export type MultiSelectionTableColumn = {
    columnKey: MultiSelectionTableColumnKey;
    columnWidthRatio?: number;
};

export type MultiSelectionTableProps = {
    tableType: FreqColumnTypeEnum;
    promise: MobxPromise<MultiSelectionTableRow[]>;
    width: number;
    height: number;
    filters: string[][];
    onSubmitSelection: (value: string[][]) => void;
    onChangeSelectedRows: (rowsKeys: string[]) => void;
    extraButtons?: IFixedHeaderTableProps<
        MultiSelectionTableRow
    >['extraButtons'];
    selectedRowsKeys: string[];
    onGeneSelect: (hugoGeneSymbol: string) => void;
    selectedGenes: string[];
    cancerGeneFilterEnabled?: boolean;
    genePanelCache: MobxPromiseCache<{ genePanelId: string }, GenePanel>;
    filterByCancerGenes: boolean;
    onChangeCancerGeneFilter: (filtered: boolean) => void;
    defaultSortBy: MultiSelectionTableColumnKey;
    columns: MultiSelectionTableColumn[];
};

const DEFAULT_COLUMN_WIDTH_RATIO: {
    [key in MultiSelectionTableColumnKey]: number;
} = {
    [MultiSelectionTableColumnKey.GENE]: 0.35,
    [MultiSelectionTableColumnKey.MOLECULAR_PROFILE]: 0.6,
    [MultiSelectionTableColumnKey.CASE_LIST]: 0.6,
    [MultiSelectionTableColumnKey.NUMBER_MUTATIONS]: 0.25,
    [MultiSelectionTableColumnKey.NUMBER_FUSIONS]: 0.25,
    [MultiSelectionTableColumnKey.NUMBER]: 0.25,
    [MultiSelectionTableColumnKey.FREQ]: 0.15,
    [MultiSelectionTableColumnKey.CYTOBAND]: 0.25,
    [MultiSelectionTableColumnKey.CNA]: 0.14,
};

class MultiSelectionTableComponent extends FixedHeaderTable<
    MultiSelectionTableRow
> {}

@observer
export class MultiSelectionTable extends React.Component<
    MultiSelectionTableProps,
    {}
> {
    @observable protected sortBy: MultiSelectionTableColumnKey;
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

    constructor(props: MultiSelectionTableProps, context: any) {
        super(props, context);
        this.sortBy = this.props.defaultSortBy;
    }

    getDefaultColumnDefinition = (
        columnKey: MultiSelectionTableColumnKey,
        columnWidth: number,
        cellMargin: number
    ) => {
        const defaults: {
            [key in MultiSelectionTableColumnKey]: Column<
                MultiSelectionTableRow
            >;
        } = {
            [MultiSelectionTableColumnKey.GENE]: {
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
                render: (data: MultiSelectionTableRow) => {
                    return (
                        <GeneCell
                            tableType={this.props.tableType}
                            selectedGenes={this.props.selectedGenes}
                            hugoGeneSymbol={data.label}
                            qValue={data.qValue}
                            isCancerGene={data.isCancerGene}
                            oncokbAnnotated={data.oncokbAnnotated}
                            isOncogene={data.isOncokbOncogene}
                            isTumorSuppressorGene={
                                data.isOncokbTumorSuppressorGene
                            }
                            onGeneSelect={this.props.onGeneSelect}
                        />
                    );
                },
                sortBy: (data: MultiSelectionTableRow) => data.label,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.label.toUpperCase().includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.MOLECULAR_PROFILE]: {
                name: columnKey,
                headerRender: () => {
                    return (
                        <div
                            style={{ marginLeft: cellMargin }}
                            className={styles.displayFlex}
                            data-test="profile-column-header"
                        >
                            {columnKey}
                        </div>
                    );
                },
                render: (data: MultiSelectionTableRow) => {
                    return (
                        <div className={styles.labelContent}>
                            <EllipsisTextTooltip
                                text={data.label}
                            ></EllipsisTextTooltip>
                        </div>
                    );
                },
                sortBy: (data: MultiSelectionTableRow) => data.label,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.label.toUpperCase().includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.CASE_LIST]: {
                name: columnKey,
                headerRender: () => {
                    return (
                        <div
                            style={{ marginLeft: cellMargin }}
                            className={styles.displayFlex}
                            data-test="profile-column-header"
                        >
                            {columnKey}
                        </div>
                    );
                },
                render: (data: MultiSelectionTableRow) => {
                    return (
                        <div className={styles.labelContent}>
                            <EllipsisTextTooltip
                                text={data.label}
                            ></EllipsisTextTooltip>
                        </div>
                    );
                },
                sortBy: (data: MultiSelectionTableRow) => data.label,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.label.toUpperCase().includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.NUMBER]: {
                name: columnKey,
                tooltip: <span>{getTooltip(this.props.tableType, false)}</span>,
                headerRender: () => {
                    return <div style={{ marginLeft: cellMargin }}>#</div>;
                },
                render: (data: MultiSelectionTableRow) => (
                    <LabeledCheckbox
                        checked={this.isChecked(data.uniqueKey)}
                        disabled={this.isDisabled(data.uniqueKey)}
                        onChange={event => this.toggleSelectRow(data.uniqueKey)}
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
                        <span>
                            {data.numberOfAlteredCases.toLocaleString()}
                        </span>
                    </LabeledCheckbox>
                ),
                sortBy: (data: MultiSelectionTableRow) =>
                    data.numberOfAlteredCases,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string
                ) => {
                    return _.toString(data.numberOfAlteredCases).includes(
                        filterString
                    );
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.FREQ]: {
                name: columnKey,
                tooltip: <span>{getTooltip(this.props.tableType, true)}</span>,
                headerRender: () => {
                    return <div style={{ marginLeft: cellMargin }}>Freq</div>;
                },
                render: (data: MultiSelectionTableRow) => {
                    return getFreqColumnRender(
                        this.props.tableType,
                        data.numberOfProfiledCases,
                        data.numberOfAlteredCases,
                        data.matchingGenePanelIds || [],
                        this.toggleModal,
                        { marginLeft: cellMargin }
                    );
                },
                sortBy: (data: MultiSelectionTableRow) =>
                    (data.numberOfAlteredCases / data.numberOfProfiledCases) *
                    100,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string
                ) => {
                    return _.toString(
                        getFrequencyStr(
                            data.numberOfAlteredCases /
                                data.numberOfProfiledCases
                        )
                    ).includes(filterString);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.NUMBER_MUTATIONS]: {
                name: columnKey,
                tooltip: <span>Total number of mutations</span>,
                headerRender: () => {
                    return <div style={{ marginLeft: cellMargin }}># Mut</div>;
                },
                render: (data: MultiSelectionTableRow) => (
                    <span
                        style={{
                            flexDirection: 'row-reverse',
                            display: 'flex',
                            marginRight: cellMargin,
                        }}
                    >
                        {data.numberOfAlterations.toLocaleString()}
                    </span>
                ),
                sortBy: (data: MultiSelectionTableRow) =>
                    data.numberOfAlterations,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string
                ) => {
                    return _.toString(data.numberOfAlterations).includes(
                        filterString
                    );
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.NUMBER_FUSIONS]: {
                name: MultiSelectionTableColumnKey.NUMBER_FUSIONS,
                tooltip: <span>Total number of mutations</span>,
                headerRender: () => {
                    return <span># Fusion</span>;
                },
                render: (data: MultiSelectionTableRow) => (
                    <span
                        style={{
                            flexDirection: 'row-reverse',
                            display: 'flex',
                            marginRight: cellMargin,
                        }}
                    >
                        {data.numberOfAlterations.toLocaleString()}
                    </span>
                ),
                sortBy: (data: MultiSelectionTableRow) =>
                    data.numberOfAlterations,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string
                ) => {
                    return _.toString(data.numberOfAlterations).includes(
                        filterString
                    );
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.CNA]: {
                name: MultiSelectionTableColumnKey.CNA,
                tooltip: (
                    <span>
                        Copy number alteration, only amplifications and deep
                        deletions are shown
                    </span>
                ),
                render: (data: MultiSelectionTableRow) => (
                    <span
                        style={{
                            color: getCNAColorByAlteration(
                                getCNAByAlteration(data.alteration!)
                            ),
                            fontWeight: 'bold',
                        }}
                    >
                        {getCNAByAlteration(data.alteration!)}
                    </span>
                ),
                sortBy: (data: MultiSelectionTableRow) => data.alteration!,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return getCNAByAlteration(data.alteration!).includes(
                        filterStringUpper
                    );
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.CYTOBAND]: {
                name: MultiSelectionTableColumnKey.CYTOBAND,
                tooltip: <span>Cytoband</span>,
                render: (data: MultiSelectionTableRow) => (
                    <span>{data.cytoband}</span>
                ),
                sortBy: (data: MultiSelectionTableRow) => data.cytoband!,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return _.isUndefined(data.cytoband)
                        ? false
                        : data.cytoband
                              .toUpperCase()
                              .includes(filterStringUpper);
                },
                width: columnWidth,
            },
        };
        return defaults[columnKey];
    };

    getDefaultCellMargin = (
        columnKey: MultiSelectionTableColumnKey,
        columnWidth: number
    ) => {
        const defaults: { [key in MultiSelectionTableColumnKey]: number } = {
            [MultiSelectionTableColumnKey.GENE]: 0,
            [MultiSelectionTableColumnKey.MOLECULAR_PROFILE]: 0,
            [MultiSelectionTableColumnKey.CASE_LIST]: 0,
            [MultiSelectionTableColumnKey.NUMBER_MUTATIONS]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    columnWidth,
                    this.totalCountLocaleString
                )
            ),
            [MultiSelectionTableColumnKey.NUMBER_FUSIONS]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    columnWidth,
                    this.totalCountLocaleString
                )
            ),
            [MultiSelectionTableColumnKey.NUMBER]: correctMargin(
                (columnWidth -
                    10 -
                    (getFixedHeaderTableMaxLengthStringPixel(
                        this.alteredCasesLocaleString
                    ) +
                        20)) /
                    2
            ),
            [MultiSelectionTableColumnKey.FREQ]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    columnWidth,
                    getFrequencyStr(
                        _.max(
                            this.tableData.map(
                                item =>
                                    (item.numberOfAlteredCases! /
                                        item.numberOfProfiledCases!) *
                                    100
                            )
                        )!
                    )
                )
            ),
            [MultiSelectionTableColumnKey.CYTOBAND]: 0,
            [MultiSelectionTableColumnKey.CNA]: 0,
        };
        return defaults[columnKey];
    };

    @computed
    get maxNumberTotalCount() {
        return _.max(this.tableData.map(item => item.numberOfAlterations));
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
                        : DEFAULT_COLUMN_WIDTH_RATIO[column.columnKey]) *
                        this.props.width
                );
                return acc;
            },
            {} as { [key in MultiSelectionTableColumnKey]: number }
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
            {} as { [key in MultiSelectionTableColumnKey]: number }
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
        return _.filter(
            this.tableData,
            data => !this.flattenedFilters.includes(data.uniqueKey)
        );
    }

    @computed
    get preSelectedRows() {
        if (this.flattenedFilters.length === 0) {
            return [];
        }
        const order = stringListToIndexSet(this.flattenedFilters);
        return _.chain(this.tableData)
            .filter(data => this.flattenedFilters.includes(data.uniqueKey))
            .sortBy<MultiSelectionTableRow>(data =>
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
        return (
            !!this.props.cancerGeneFilterEnabled &&
            this.props.filterByCancerGenes
        );
    }

    @computed get allSelectedRowsKeysSet() {
        return stringListToSet([
            ...this.props.selectedRowsKeys,
            ...this.preSelectedRowsKeys,
        ]);
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
    @action
    toggleSelectRow(uniqueKey: string) {
        const record = _.find(
            this.props.selectedRowsKeys,
            key => key === uniqueKey
        );
        if (_.isUndefined(record)) {
            this.props.onChangeSelectedRows(
                this.props.selectedRowsKeys.concat([uniqueKey])
            );
        } else {
            this.props.onChangeSelectedRows(
                _.xorBy(this.props.selectedRowsKeys, [record])
            );
        }
    }
    @observable private _selectionType: SelectionOperatorEnum;

    @autobind
    @action
    afterSelectingRows() {
        if (this.selectionType === SelectionOperatorEnum.UNION) {
            this.props.onSubmitSelection([this.props.selectedRowsKeys]);
        } else {
            this.props.onSubmitSelection(
                this.props.selectedRowsKeys.map(selectedRowsKey => [
                    selectedRowsKey,
                ])
            );
        }
        this.props.onChangeSelectedRows([]);
    }

    @computed get selectionType() {
        if (this._selectionType) {
            return this._selectionType;
        }
        switch (
            (localStorage.getItem(this.props.tableType) || '').toUpperCase()
        ) {
            case SelectionOperatorEnum.INTERSECTION:
                return SelectionOperatorEnum.INTERSECTION;
            case SelectionOperatorEnum.UNION:
                return SelectionOperatorEnum.UNION;
            default:
                return this.props.tableType === FreqColumnTypeEnum.DATA
                    ? SelectionOperatorEnum.INTERSECTION
                    : SelectionOperatorEnum.UNION;
        }
    }

    @autobind
    @action
    toggleSelectionOperator() {
        const selectionType = this._selectionType || this.selectionType;
        if (selectionType === SelectionOperatorEnum.INTERSECTION) {
            this._selectionType = SelectionOperatorEnum.UNION;
        } else {
            this._selectionType = SelectionOperatorEnum.INTERSECTION;
        }
        localStorage.setItem(this.props.tableType, this.selectionType);
    }

    @autobind
    isSelectedRow(data: MultiSelectionTableRow) {
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
    selectedRowClassName(data: MultiSelectionTableRow) {
        const index = this.filterKeyToIndexSet[data.uniqueKey];
        if (index === undefined) {
            return this.props.filters.length % 2 === 0
                ? styles.highlightedEvenRow
                : styles.highlightedOddRow;
        }
        return index % 2 === 0
            ? styles.highlightedEvenRow
            : styles.highlightedOddRow;
    }

    @autobind
    @action
    afterSorting(
        sortBy: MultiSelectionTableColumnKey,
        sortDirection: SortDirection
    ) {
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    public render() {
        const tableId = `${this.props.tableType}-table`;
        return (
            <div data-test={tableId} key={tableId}>
                {this.props.promise.isComplete && (
                    <MultiSelectionTableComponent
                        width={this.props.width}
                        height={this.props.height}
                        data={this.selectableTableData}
                        columns={this.tableColumns}
                        isSelectedRow={this.isSelectedRow}
                        afterSelectingRows={this.afterSelectingRows}
                        defaultSelectionOperator={this.selectionType}
                        toggleSelectionOperator={this.toggleSelectionOperator}
                        extraButtons={this.props.extraButtons}
                        sortBy={this.sortBy}
                        sortDirection={this.sortDirection}
                        afterSorting={this.afterSorting}
                        fixedTopRowsData={this.preSelectedRows}
                        highlightedRowClassName={this.selectedRowClassName}
                        showSetOperationsButton={true}
                        numberOfSelectedRows={
                            this.props.selectedRowsKeys.length
                        }
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
