import * as React from 'react';
import { observer } from 'mobx-react';
import * as _ from 'lodash';
import FixedHeaderTable from '../FixedHeaderTable';
import { action, computed, observable } from 'mobx';
import autobind from 'autobind-decorator';
import {
    Column,
    SortDirection,
} from '../../../../shared/components/lazyMobXTable/LazyMobXTable';
import { SampleTreatmentRow, PatientTreatmentRow } from 'cbioportal-ts-api-client';
import { correctColumnWidth } from 'pages/studyView/StudyViewUtils';
import { SelectionOperatorEnum } from 'pages/studyView/TableUtils';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import styles from 'pages/studyView/table/tables.module.scss';
import MobxPromise from 'mobxpromise';
import {
    stringListToIndexSet,
    stringListToSet,
} from 'cbioportal-frontend-commons';
import ifNotDefined from 'shared/lib/ifNotDefined';
import { sampleTreatmentUniqueKey, TreatmentTableType } from './treatmentsTableUtil';

export enum SampleTreatmentsTableColumnKey {
    TREATMENT = 'Treatment',
    TIME = 'Pre / Post',
    COUNT = '#',
}

export type SampleTreatmentsTableColumn = {
    columnKey: SampleTreatmentsTableColumnKey;
    columnWidthRatio?: number;
};

export type SampleTreatmentsTableProps = {
    tableType: TreatmentTableType;
    promise: MobxPromise<SampleTreatmentRow[]>;
    width: number;
    height: number;
    filters: string[][];
    onUserSelection: (value: string[][]) => void;
    selectedTreatments: string[];
    defaultSortBy: SampleTreatmentsTableColumnKey;
    columns: SampleTreatmentsTableColumn[];
};

const DEFAULT_COLUMN_WIDTH_RATIO: {
    [key in SampleTreatmentsTableColumnKey]: number;
} = {
    [SampleTreatmentsTableColumnKey.TREATMENT]: 0.6,
    [SampleTreatmentsTableColumnKey.TIME]: 0.3,
    [SampleTreatmentsTableColumnKey.COUNT]: 0.2,
};

class MultiSelectionTableComponent extends FixedHeaderTable<
    SampleTreatmentRow
> {}

@observer
export class SampleTreatmentsTable extends React.Component<SampleTreatmentsTableProps, {}> {
    @observable protected selectedRowsKeys: string[] = [];
    @observable protected sortBy: SampleTreatmentsTableColumnKey;
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

    constructor(props: SampleTreatmentsTableProps, context: any) {
        super(props, context);
        this.sortBy = this.props.defaultSortBy;
    }

    createGenericColumnHeader(margin: number, headerName: string): JSX.Element {
        return (
            <div style={{ marginLeft: margin }} className={styles.displayFlex}>
                {headerName}
            </div>
        );
    }

    createTreatmentColumnCell(row: SampleTreatmentRow): JSX.Element {
        return <div>{row.treatment}</div>;
    }

    createTemporalRelationColumnCell(row: SampleTreatmentRow): JSX.Element {
        return <div>{row.time}</div>;
    }

    createNubmerColumnCell(
        row: SampleTreatmentRow,
        cellMargin: number
    ): JSX.Element {
        return (
            <LabeledCheckbox
                checked={this.isChecked(sampleTreatmentUniqueKey(row))}
                disabled={this.isDisabled(sampleTreatmentUniqueKey(row))}
                onChange={_ => this.togglePreSelectRow(sampleTreatmentUniqueKey(row))}
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
        );
    }

    filterTreatmentCell(
        cell: SampleTreatmentRow,
        filterUpper: string
    ): boolean {
        return cell.treatment.toUpperCase().includes(filterUpper);
    }

    getDefaultColumnDefinition = (
        columnKey: SampleTreatmentsTableColumnKey,
        columnWidth: number,
        cellMargin: number
    ) => {
        const defaults: {
            [key in SampleTreatmentsTableColumnKey]: Column<SampleTreatmentRow>;
        } = {
            [SampleTreatmentsTableColumnKey.TREATMENT]: {
                name: columnKey,
                headerRender: () =>
                    this.createGenericColumnHeader(cellMargin, columnKey),
                render: this.createTreatmentColumnCell,
                sortBy: (data: SampleTreatmentRow) => data.treatment,
                defaultSortDirection: 'asc' as 'asc',
                filter: this.filterTreatmentCell,
                width: columnWidth,
            },
            [SampleTreatmentsTableColumnKey.TIME]: {
                name: columnKey,
                headerRender: () =>
                    this.createGenericColumnHeader(cellMargin, columnKey),
                render: this.createTemporalRelationColumnCell,
                sortBy: (data: SampleTreatmentRow) => data.time,
                defaultSortDirection: 'asc' as 'asc',
                filter: this.filterTreatmentCell,
                width: columnWidth,
            },
            [SampleTreatmentsTableColumnKey.COUNT]: {
                name: columnKey,
                headerRender: () =>
                    this.createGenericColumnHeader(cellMargin, columnKey),
                render: (data: SampleTreatmentRow) =>
                    this.createNubmerColumnCell(data, 28),
                sortBy: (data: SampleTreatmentRow) => data.count,
                defaultSortDirection: 'desc' as 'desc',
                filter: this.filterTreatmentCell,
                width: columnWidth,
            },
        };
        return defaults[columnKey];
    };

    getDefaultCellMargin = () => {
        return 0;
    };

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
            {} as { [key in SampleTreatmentsTableColumnKey]: number }
        );
    }

    @computed
    get cellMargin() {
        return _.reduce(
            this.props.columns,
            (acc, column) => {
                acc[column.columnKey] = this.getDefaultCellMargin();
                return acc;
            },
            {} as { [key in SampleTreatmentsTableColumnKey]: number }
        );
    }

    @computed get tableData(): SampleTreatmentRow[] {
        return this.props.promise.result || [];
    }

    @computed get flattenedFilters(): string[] {
        return _.flatMap(this.props.filters);
    }

    @computed get selectableTableData() {
        if (this.flattenedFilters.length === 0) {
            return this.tableData;
        }
        return _.filter(
            this.tableData,
            data => !this.flattenedFilters.includes(sampleTreatmentUniqueKey(data))
        );
    }

    @computed
    get preSelectedRows() {
        if (this.flattenedFilters.length === 0) {
            return [];
        }
        const order = stringListToIndexSet(this.flattenedFilters);
        return _.chain(this.tableData)
            .filter(data => this.flattenedFilters.includes(sampleTreatmentUniqueKey(data)))
            .sortBy<SampleTreatmentRow>(data =>
                ifNotDefined(
                    order[sampleTreatmentUniqueKey(data)],
                    Number.POSITIVE_INFINITY
                )
            )
            .value();
    }

    @computed
    get preSelectedRowsKeys() {
        return this.preSelectedRows.map(row => sampleTreatmentUniqueKey(row));
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

    @computed get allSelectedRowsKeysSet() {
        return stringListToSet([
            ...this.selectedRowsKeys,
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
    togglePreSelectRow(uniqueKey: string) {
        const record = _.find(this.selectedRowsKeys, key => key === uniqueKey);
        if (_.isUndefined(record)) {
            this.selectedRowsKeys.push(uniqueKey);
        } else {
            this.selectedRowsKeys = _.xorBy(this.selectedRowsKeys, [record]);
        }
    }
    @observable private _selectionType: SelectionOperatorEnum;

    @autobind
    @action
    afterSelectingRows() {
        if (this.selectionType === SelectionOperatorEnum.UNION) {
            this.props.onUserSelection([this.selectedRowsKeys]);
        } else {
            this.props.onUserSelection(
                this.selectedRowsKeys.map(selectedRowsKey => [selectedRowsKey])
            );
        }
        this.selectedRowsKeys = [];
    }

    @computed get selectionType(): SelectionOperatorEnum {
        if (this._selectionType) {
            return this._selectionType;
        }
        return (
            localStorage.getItem(this.props.tableType) ||
            SelectionOperatorEnum.UNION
        ).toUpperCase() as SelectionOperatorEnum;
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
    isSelectedRow(data: SampleTreatmentRow) {
        return this.isChecked(sampleTreatmentUniqueKey(data));
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
    selectedRowClassName(data: SampleTreatmentRow) {
        const index = this.filterKeyToIndexSet[sampleTreatmentUniqueKey(data)];
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
        sortBy: SampleTreatmentsTableColumnKey,
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
                        sortBy={this.sortBy}
                        sortDirection={this.sortDirection}
                        afterSorting={this.afterSorting}
                        fixedTopRowsData={this.preSelectedRows}
                        highlightedRowClassName={this.selectedRowClassName}
                        numberOfSelectedRows={this.selectedRowsKeys.length}
                    />
                )}
            </div>
        );
    }
}
