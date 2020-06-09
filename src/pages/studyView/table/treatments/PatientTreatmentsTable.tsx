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
import { PatientTreatmentRow } from 'cbioportal-ts-api-client';
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
import { patientTreatmentUniqueKey, TreatmentTableType } from './treatmentsTableUtil';

export enum PatientTreatmentsTableColumnKey {
    TREATMENT = 'Treatment',
    COUNT = '#',
}

export type PatientTreatmentsTableColumn = {
    columnKey: PatientTreatmentsTableColumnKey;
    columnWidthRatio?: number;
};

export type PatientTreatmentsTableProps = {
    tableType: TreatmentTableType;
    promise: MobxPromise<PatientTreatmentRow[]>;
    width: number;
    height: number;
    filters: string[][];
    onUserSelection: (value: string[][]) => void;
    selectedTreatments: string[];
    defaultSortBy: PatientTreatmentsTableColumnKey;
    columns: PatientTreatmentsTableColumn[];
};

const DEFAULT_COLUMN_WIDTH_RATIO: {
    [key in PatientTreatmentsTableColumnKey]: number;
} = {
    [PatientTreatmentsTableColumnKey.TREATMENT]: 0.8,
    [PatientTreatmentsTableColumnKey.COUNT]: 0.2,
};

class MultiSelectionTableComponent extends FixedHeaderTable<
    PatientTreatmentRow
> {}

@observer
export class PatientTreatmentsTable extends React.Component<PatientTreatmentsTableProps, {}> {
    @observable protected selectedRowsKeys: string[] = [];
    @observable protected sortBy: PatientTreatmentsTableColumnKey;
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

    constructor(props: PatientTreatmentsTableProps, context: any) {
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

    createTreatmentColumnCell(row: PatientTreatmentRow): JSX.Element {
        return <div>{row.treatment}</div>;
    }

    createRecievedColumnCell(row: PatientTreatmentRow): JSX.Element {
        return <div>{row.received ? "True" : "False"}</div>;
    }

    createNubmerColumnCell(
        row: PatientTreatmentRow,
        cellMargin: number
    ): JSX.Element {
        return (
            <LabeledCheckbox
                checked={this.isChecked(patientTreatmentUniqueKey(row))}
                disabled={this.isDisabled(patientTreatmentUniqueKey(row))}
                onChange={_ => this.togglePreSelectRow(patientTreatmentUniqueKey(row))}
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
        cell: PatientTreatmentRow,
        filter: string
    ): boolean {
        return cell.treatment.toUpperCase().includes(filter.toUpperCase());
    }

    getDefaultColumnDefinition = (
        columnKey: PatientTreatmentsTableColumnKey,
        columnWidth: number,
        cellMargin: number
    ) => {
        const defaults: {
            [key in PatientTreatmentsTableColumnKey]: Column<PatientTreatmentRow>;
        } = {
            [PatientTreatmentsTableColumnKey.TREATMENT]: {
                name: columnKey,
                headerRender: () =>
                    this.createGenericColumnHeader(cellMargin, columnKey),
                render: this.createTreatmentColumnCell,
                sortBy: (data: PatientTreatmentRow) => data.treatment,
                defaultSortDirection: 'asc' as 'asc',
                filter: this.filterTreatmentCell,
                width: columnWidth,
            },
            [PatientTreatmentsTableColumnKey.COUNT]: {
                name: columnKey,
                headerRender: () =>
                    this.createGenericColumnHeader(cellMargin, columnKey),
                render: (data: PatientTreatmentRow) =>
                    this.createNubmerColumnCell(data, 28),
                sortBy: (data: PatientTreatmentRow) => data.count,
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
            {} as { [key in PatientTreatmentsTableColumnKey]: number }
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
            {} as { [key in PatientTreatmentsTableColumnKey]: number }
        );
    }

    @computed get tableData(): PatientTreatmentRow[] {
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
            data => !this.flattenedFilters.includes(patientTreatmentUniqueKey(data))
        );
    }

    @computed
    get preSelectedRows() {
        if (this.flattenedFilters.length === 0) {
            return [];
        }
        const order = stringListToIndexSet(this.flattenedFilters);
        return _.chain(this.tableData)
            .filter(data => this.flattenedFilters.includes(patientTreatmentUniqueKey(data)))
            .sortBy<PatientTreatmentRow>(data =>
                ifNotDefined(
                    order[patientTreatmentUniqueKey(data)],
                    Number.POSITIVE_INFINITY
                )
            )
            .value();
    }

    @computed
    get preSelectedRowsKeys() {
        return this.preSelectedRows.map(row => patientTreatmentUniqueKey(row));
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
    isSelectedRow(data: PatientTreatmentRow) {
        return this.isChecked(patientTreatmentUniqueKey(data));
    }

    @computed get filterKeyToIndexSet() {
        const keyIndexSet: {[id:string]: number} = {};
        return _.reduce(
            this.props.filters,
            (acc, next, index) => {
                next.forEach(key => {
                    acc[key] = index;
                });
                return acc;
            },
            keyIndexSet,
        );
    }

    @autobind
    selectedRowClassName(data: PatientTreatmentRow) {
        const index = this.filterKeyToIndexSet[patientTreatmentUniqueKey(data)];
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
        sortBy: PatientTreatmentsTableColumnKey,
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
