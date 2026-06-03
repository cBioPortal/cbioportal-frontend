import React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import autobind from 'autobind-decorator';
import {
    MobxPromise,
    stringListToIndexSet,
    stringListToSet,
} from 'cbioportal-frontend-commons';
import {
    Column,
    SortDirection,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import FixedHeaderTable, {
    IFixedHeaderTableProps,
} from 'pages/studyView/table/FixedHeaderTable';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import styles from 'pages/studyView/table/tables.module.scss';
import {
    correctMargin,
    GenericAssayFrequencyTableRow,
    getFixedHeaderNumberCellMargin,
    getFrequencyStr,
} from 'pages/studyView/StudyViewUtils';
import { TreatmentGenericColumnHeader } from 'pages/studyView/table/treatments/treatmentsTableUtil';
import {
    FreqColumnTypeEnum,
    SelectionOperatorEnum,
} from 'pages/studyView/TableUtils';
import ifNotDefined from 'shared/lib/ifNotDefined';

export enum GenericAssayFrequencyTableColumnKey {
    ENTITY = 'Entity',
    CATEGORY = 'Category',
    COUNT = '# Samples',
    FREQ = 'Freq',
}

export interface IGenericAssayFrequencyTableProps {
    promise: MobxPromise<GenericAssayFrequencyTableRow[]>;
    width: number;
    height: number;
    filters: string[][];
    selectedRowsKeys: string[];
    onChangeSelectedRows: (selectedRowsKeys: string[]) => void;
    onSubmitSelection: (selectedRowsKeys: string[][]) => void;
    extraButtons?: IFixedHeaderTableProps<GenericAssayFrequencyTableRow>['extraButtons'];
    setOperationsButtonText: string;
    showCategoryColumn: boolean;
}

const DEFAULT_COLUMN_WIDTH_RATIO = {
    [GenericAssayFrequencyTableColumnKey.ENTITY]: 0.4,
    [GenericAssayFrequencyTableColumnKey.CATEGORY]: 0.25,
    [GenericAssayFrequencyTableColumnKey.COUNT]: 0.2,
    [GenericAssayFrequencyTableColumnKey.FREQ]: 0.15,
};

class GenericAssayFrequencyTableComponent extends FixedHeaderTable<GenericAssayFrequencyTableRow> {}

@observer
export default class GenericAssayFrequencyTable extends React.Component<
    IGenericAssayFrequencyTableProps,
    {}
> {
    @observable protected sortBy: GenericAssayFrequencyTableColumnKey;
    @observable protected sortDirection: SortDirection = 'desc';
    @observable private _selectionType: SelectionOperatorEnum;

    constructor(props: IGenericAssayFrequencyTableProps) {
        super(props);
        makeObservable(this);
        this.sortBy = GenericAssayFrequencyTableColumnKey.FREQ;
    }

    @computed
    get tableData(): GenericAssayFrequencyTableRow[] {
        return this.props.promise.result || [];
    }

    @computed
    get flattenedFilters() {
        return _.flatMap(this.props.filters);
    }

    @computed
    get preSelectedRows(): GenericAssayFrequencyTableRow[] {
        if (this.flattenedFilters.length === 0) {
            return [];
        }

        const order = stringListToIndexSet(this.flattenedFilters);
        return this.tableData
            .filter(row => this.flattenedFilters.includes(row.uniqueKey))
            .sort((a, b) =>
                ifNotDefined(order[a.uniqueKey], Number.POSITIVE_INFINITY) -
                ifNotDefined(order[b.uniqueKey], Number.POSITIVE_INFINITY)
            );
    }

    @computed
    get preSelectedRowsKeys(): string[] {
        return this.preSelectedRows.map(row => row.uniqueKey);
    }

    @computed
    get selectableTableData(): GenericAssayFrequencyTableRow[] {
        if (this.flattenedFilters.length === 0) {
            return this.tableData;
        }

        return this.tableData.filter(
            row => !this.flattenedFilters.includes(row.uniqueKey)
        );
    }

    @computed
    get allSelectedRowsKeysSet() {
        return stringListToSet([
            ...this.props.selectedRowsKeys,
            ...this.preSelectedRowsKeys,
        ]);
    }

    @computed
    get filterKeyToIndexSet() {
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

    @computed
    get visibleColumns(): GenericAssayFrequencyTableColumnKey[] {
        return this.props.showCategoryColumn
            ? [
                  GenericAssayFrequencyTableColumnKey.ENTITY,
                  GenericAssayFrequencyTableColumnKey.CATEGORY,
                  GenericAssayFrequencyTableColumnKey.COUNT,
                  GenericAssayFrequencyTableColumnKey.FREQ,
              ]
            : [
                  GenericAssayFrequencyTableColumnKey.ENTITY,
                  GenericAssayFrequencyTableColumnKey.COUNT,
                  GenericAssayFrequencyTableColumnKey.FREQ,
              ];
    }

    @computed
    get columnsWidth() {
        const widthRatio = this.props.showCategoryColumn
            ? DEFAULT_COLUMN_WIDTH_RATIO
            : {
                  ...DEFAULT_COLUMN_WIDTH_RATIO,
                  [GenericAssayFrequencyTableColumnKey.ENTITY]: 0.65,
                  [GenericAssayFrequencyTableColumnKey.COUNT]: 0.2,
                  [GenericAssayFrequencyTableColumnKey.FREQ]: 0.15,
              };

        return _.mapValues(widthRatio, ratio => ratio * this.props.width);
    }

    @computed
    get cellMargin() {
        return {
            [GenericAssayFrequencyTableColumnKey.ENTITY]: 0,
            [GenericAssayFrequencyTableColumnKey.CATEGORY]: 0,
            [GenericAssayFrequencyTableColumnKey.COUNT]: 0,
            [GenericAssayFrequencyTableColumnKey.FREQ]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    this.columnsWidth[GenericAssayFrequencyTableColumnKey.FREQ],
                    getFrequencyStr(
                        _.max(
                            this.tableData.map(
                                item => this.getFrequency(item)
                            )
                        ) || 0
                    )
                )
            ),
        };
    }

    private getFrequency(row: GenericAssayFrequencyTableRow): number {
        return row.totalCount > 0 ? (row.count / row.totalCount) * 100 : -1;
    }

    getDefaultColumnDefinition(
        columnKey: GenericAssayFrequencyTableColumnKey,
        columnWidth: number,
        cellMargin: number
    ): Column<GenericAssayFrequencyTableRow> {
        const defaults: {
            [key in GenericAssayFrequencyTableColumnKey]: Column<GenericAssayFrequencyTableRow>;
        } = {
            [GenericAssayFrequencyTableColumnKey.ENTITY]: {
                name: columnKey,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={cellMargin}
                        headerName={columnKey}
                    />
                ),
                render: row => <div>{row.entityLabel}</div>,
                sortBy: row => row.entityLabel,
                defaultSortDirection: 'asc',
                filter: (row, filter) =>
                    row.entityLabel
                        .toUpperCase()
                        .includes(filter.toUpperCase()),
                width: columnWidth,
            },
            [GenericAssayFrequencyTableColumnKey.CATEGORY]: {
                name: columnKey,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={cellMargin}
                        headerName={columnKey}
                    />
                ),
                render: row => <div>{row.category}</div>,
                sortBy: row => row.category,
                defaultSortDirection: 'asc',
                filter: (row, filter) =>
                    row.category.toUpperCase().includes(filter.toUpperCase()),
                width: columnWidth,
            },
            [GenericAssayFrequencyTableColumnKey.COUNT]: {
                name: columnKey,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={cellMargin}
                        headerName={columnKey}
                    />
                ),
                render: row => (
                    <LabeledCheckbox
                        checked={this.isChecked(row.uniqueKey)}
                        onChange={_ => this.toggleSelectRow(row.uniqueKey)}
                        labelProps={{
                            style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginLeft: 0,
                                marginRight: cellMargin,
                            },
                        }}
                        inputProps={{
                            className: styles.autoMarginCheckbox,
                        }}
                    >
                        <span>{row.count.toLocaleString()}</span>
                    </LabeledCheckbox>
                ),
                sortBy: row => row.count,
                defaultSortDirection: 'desc',
                filter: (row, filter) =>
                    row.count.toLocaleString().includes(filter),
                width: columnWidth,
            },
            [GenericAssayFrequencyTableColumnKey.FREQ]: {
                name: columnKey,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={cellMargin}
                        headerName={columnKey}
                    />
                ),
                render: row => (
                    <div
                        className={styles.pullRight}
                        style={{ marginLeft: cellMargin }}
                    >
                        {getFrequencyStr(this.getFrequency(row))}
                    </div>
                ),
                sortBy: row => this.getFrequency(row),
                defaultSortDirection: 'desc',
                filter: (row, filter) =>
                    getFrequencyStr(this.getFrequency(row)).includes(filter),
                width: columnWidth,
            },
        };

        return defaults[columnKey];
    }

    @computed
    get tableColumns() {
        return this.visibleColumns.map(column =>
            this.getDefaultColumnDefinition(
                column,
                this.columnsWidth[column],
                this.cellMargin[column]
            )
        );
    }

    @action.bound
    afterSorting(
        sortBy: GenericAssayFrequencyTableColumnKey,
        sortDirection: SortDirection
    ) {
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    @autobind
    isChecked(uniqueKey: string) {
        return !!this.allSelectedRowsKeysSet[uniqueKey];
    }

    @autobind
    isDisabled(uniqueKey: string) {
        return this.preSelectedRowsKeys.includes(uniqueKey);
    }

    @action.bound
    toggleSelectRow(uniqueKey: string) {
        if (this.isDisabled(uniqueKey)) {
            return;
        }

        const record = _.find(
            this.props.selectedRowsKeys,
            key => key === uniqueKey
        );
        if (_.isUndefined(record)) {
            this.props.onChangeSelectedRows(
                this.props.selectedRowsKeys.concat(uniqueKey)
            );
        } else {
            this.props.onChangeSelectedRows(
                this.props.selectedRowsKeys.filter(key => key !== uniqueKey)
            );
        }
    }

    @action.bound
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

    @computed
    get selectionType() {
        if (this._selectionType) {
            return this._selectionType;
        }

        switch (
            (
                localStorage.getItem(FreqColumnTypeEnum.GENERIC_ASSAY) || ''
            ).toUpperCase()
        ) {
            case SelectionOperatorEnum.UNION.toUpperCase():
                return SelectionOperatorEnum.UNION;
            case SelectionOperatorEnum.INTERSECTION.toUpperCase():
            default:
                return SelectionOperatorEnum.INTERSECTION;
        }
    }

    @action.bound
    toggleSelectionOperator() {
        const selectionType = this._selectionType || this.selectionType;
        this._selectionType =
            selectionType === SelectionOperatorEnum.INTERSECTION
                ? SelectionOperatorEnum.UNION
                : SelectionOperatorEnum.INTERSECTION;
        localStorage.setItem(
            FreqColumnTypeEnum.GENERIC_ASSAY,
            this.selectionType
        );
    }

    @autobind
    isSelectedRow(row: GenericAssayFrequencyTableRow) {
        return this.isChecked(row.uniqueKey);
    }

    @autobind
    selectedRowClassName(row: GenericAssayFrequencyTableRow) {
        const index = this.filterKeyToIndexSet[row.uniqueKey];
        if (index === undefined) {
            return this.props.filters.length % 2 === 0
                ? styles.highlightedEvenRow
                : styles.highlightedOddRow;
        }

        return index % 2 === 0
            ? styles.highlightedEvenRow
            : styles.highlightedOddRow;
    }

    render() {
        return (
            <div data-test="generic-assay-frequency-table">
                {this.props.promise.isComplete && (
                    <GenericAssayFrequencyTableComponent
                        key={`generic-assay-frequency-table-${this.preSelectedRowsKeys.join(
                            ','
                        )}`}
                        width={this.props.width}
                        height={this.props.height}
                        data={this.selectableTableData}
                        columns={this.tableColumns}
                        sortBy={this.sortBy}
                        sortDirection={this.sortDirection}
                        afterSorting={this.afterSorting}
                        isSelectedRow={this.isSelectedRow}
                        highlightedRowClassName={this.selectedRowClassName}
                        numberOfSelectedRows={this.props.selectedRowsKeys.length}
                        fixedTopRowsData={this.preSelectedRows}
                        showSetOperationsButton={true}
                        setOperationsButtonText={
                            this.props.setOperationsButtonText
                        }
                        afterSelectingRows={this.afterSelectingRows}
                        toggleSelectionOperator={this.toggleSelectionOperator}
                        defaultSelectionOperator={this.selectionType}
                        extraButtons={this.props.extraButtons}
                    />
                )}
            </div>
        );
    }
}
