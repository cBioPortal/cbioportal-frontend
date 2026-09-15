import * as React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import FixedHeaderTable, { IFixedHeaderTableProps } from './FixedHeaderTable';
import { action, computed, makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import {
    Column,
    SortDirection,
} from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import { StudyViewGenePanelModal } from './StudyViewGenePanelModal';
import {
    correctColumnWidth,
    correctMargin,
    getFixedHeaderNumberCellMargin,
    getFixedHeaderTableMaxLengthStringPixel,
    getFrequencyStr,
} from 'pages/studyView/StudyViewUtils';
import { OncokbCancerStructVar } from 'pages/studyView/StudyViewPageStore';
import {
    FreqColumnTypeEnum,
    getFreqColumnRender,
    getTooltip,
    SelectionOperatorEnum,
} from 'pages/studyView/TableUtils';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import styles from 'pages/studyView/table/tables.module.scss';
import {
    MobxPromise,
    stringListToIndexSet,
    stringListToSet,
} from 'cbioportal-frontend-commons';
import ifNotDefined from 'shared/lib/ifNotDefined';
import { TableHeaderCellFilterIcon } from 'pages/studyView/table/TableHeaderCellFilterIcon';
import { StructVarCell } from 'pages/studyView/table/StructVarCell';
import { BaseMultiSelectionTableProps } from 'pages/studyView/table/MultiSelectionTable';
import { StructVarGenePair } from 'pages/studyView/StructVarUtils';
import {
    GeneFilterDropdown,
    IGeneFilterDropdownOption,
} from 'pages/studyView/table/GeneFilterDropdown';
import { getOncoKBCancerGeneListLinkout } from 'pages/studyView/oncokb/OncoKBUtils';
import { getOncoTree2GenesLinkout } from 'shared/oncotree2genes/OncoTree2GenesUtils';
import { OncoKbCancerGeneIcon } from 'pages/studyView/oncokb/OncoKbCancerGeneIcon';
import { OncoTree2GenesIcon } from 'shared/oncotree2genes/OncoTree2GenesIcon';
import {
    STRUCTVARAnyGeneStr,
    STRUCTVARNullGeneStr,
} from 'shared/lib/oql/oqlfilter';

export type StructVarMultiSelectionTableRow = OncokbCancerStructVar & {
    label1: string;
    label2: string;
    matchingGenePanelIds: Array<string>;
    numberOfAlteredCases: number;
    numberOfProfiledCases: number;
    totalCount: number;
    alteration?: number;
    cytoband?: string;
    uniqueKey: string;
};

export enum StructVarMultiSelectionTableColumnKey {
    STRUCTVAR_SELECT = 'StructVarSelect',
    GENE1 = 'Gene 1',
    GENE2 = 'Gene 2',
    NUMBER_STRUCTURAL_VARIANTS = '# SV',
    NUMBER = '#',
    FREQ = 'Freq',
}

export type StructVarMultiSelectionTableColumn = {
    columnKey: StructVarMultiSelectionTableColumnKey;
    columnWidthRatio?: number;
    columnTooltip?: JSX.Element;
};

export type StructVarMultiSelectionTableProps = BaseMultiSelectionTableProps & {
    onStructuralVariantSelect: (
        gene1HugoGeneSymbol: string | undefined,
        gene2HugoGeneSymbol: string | undefined
    ) => void;
    selectedStructVars: StructVarGenePair[];
    defaultSortBy: StructVarMultiSelectionTableColumnKey;
    extraButtons?: IFixedHeaderTableProps<
        StructVarMultiSelectionTableRow
    >['extraButtons'];
    columns: StructVarMultiSelectionTableColumn[];
    promise: MobxPromise<StructVarMultiSelectionTableRow[]>;
};

const DEFAULT_COLUMN_WIDTH_RATIO: {
    [key in StructVarMultiSelectionTableColumnKey]: number;
} = {
    [StructVarMultiSelectionTableColumnKey.STRUCTVAR_SELECT]: 0.07,
    [StructVarMultiSelectionTableColumnKey.GENE1]: 0.3,
    [StructVarMultiSelectionTableColumnKey.GENE2]: 0.3,
    [StructVarMultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS]: 0.08,
    [StructVarMultiSelectionTableColumnKey.NUMBER]: 0.2,
    [StructVarMultiSelectionTableColumnKey.FREQ]: 0.3,
};

class MultiSelectionTableComponent extends FixedHeaderTable<
    StructVarMultiSelectionTableRow
> {}

@observer
export class StructuralVariantMultiSelectionTable extends React.Component<
    StructVarMultiSelectionTableProps,
    {}
> {
    @observable protected sortBy: StructVarMultiSelectionTableColumnKey;
    @observable private sortDirection: SortDirection;
    @observable private modalSettings: {
        modalOpen: boolean;
        modalPanelName: string;
    } = {
        modalOpen: false,
        modalPanelName: '',
    };

    @observable private hoveredStructVarTableRowId:
        | string
        | undefined = undefined;

    public static defaultProps = {
        cancerGeneFilterEnabled: false,
    };

    constructor(props: StructVarMultiSelectionTableProps, context: any) {
        super(props, context);
        makeObservable(this);
        this.sortBy = this.props.defaultSortBy;
    }

    getDefaultColumnDefinition = (
        columnKey: StructVarMultiSelectionTableColumnKey,
        columnWidth: number,
        cellMargin: number,
        hoveredStructVarTableRowId: string | undefined
    ) => {
        const defaults: {
            [key in StructVarMultiSelectionTableColumnKey]: Column<
                StructVarMultiSelectionTableRow
            >;
        } = {
            [StructVarMultiSelectionTableColumnKey.STRUCTVAR_SELECT]: {
                name: columnKey,
                headerRender: () => {
                    return (
                        <GeneFilterDropdown
                            cellMargin={cellMargin}
                            dataTest="structvar-column-header"
                            options={this.geneFilterDropdownOptions}
                            combineOperator={this.geneFilterOperator}
                            onToggleCombineOperator={
                                this.toggleGeneFilterOperator
                            }
                        >
                            <span />
                        </GeneFilterDropdown>
                    );
                },
                render: (data: StructVarMultiSelectionTableRow) => {
                    return (
                        <StructVarCell
                            tableType={this.props.tableType}
                            uniqueRowId={data.uniqueKey}
                            selectedStructVars={this.props.selectedStructVars}
                            gene1SymbolOrOql={
                                data.label1 || STRUCTVARNullGeneStr
                            }
                            gene2SymbolOrOql={
                                data.label2 || STRUCTVARNullGeneStr
                            }
                            isCancerGene={false}
                            oncokbAnnotated={false}
                            isOncogene={false}
                            isTumorSuppressorGene={false}
                            onStructVarSelect={
                                this.props.onStructuralVariantSelect
                            }
                            onGeneHovered={this.onStructVarHover}
                            hoveredStructVarRowId={hoveredStructVarTableRowId}
                        />
                    );
                },
                sortBy: (data: StructVarMultiSelectionTableRow) => data.label1,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: StructVarMultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.uniqueKey
                        .toUpperCase()
                        .includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [StructVarMultiSelectionTableColumnKey.GENE1]: {
                name: columnKey,
                headerRender: () => {
                    return <span>{columnKey}</span>;
                },
                render: (data: StructVarMultiSelectionTableRow) => {
                    return (
                        <StructVarCell
                            tableType={this.props.tableType}
                            uniqueRowId={data.uniqueKey}
                            selectedStructVars={this.props.selectedStructVars}
                            label={data.label1}
                            gene1SymbolOrOql={
                                data.label1 || STRUCTVARNullGeneStr
                            }
                            gene2SymbolOrOql={STRUCTVARAnyGeneStr}
                            isCancerGene={data.gene1IsCancerGene}
                            oncokbAnnotated={data.gene1OncokbAnnotated}
                            isOncogene={data.gene1IsOncokbOncogene}
                            isTumorSuppressorGene={
                                data.gene1IsOncokbTumorSuppressorGene
                            }
                            onStructVarSelect={
                                this.props.onStructuralVariantSelect
                            }
                            onGeneHovered={this.onStructVarHover}
                            hoveredStructVarRowId={hoveredStructVarTableRowId}
                            hideCheckbox={!data.label1}
                        />
                    );
                },
                sortBy: (data: StructVarMultiSelectionTableRow) => data.label1,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: StructVarMultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.label1
                        ?.toUpperCase()
                        .includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [StructVarMultiSelectionTableColumnKey.GENE2]: {
                name: columnKey,
                headerRender: () => {
                    return <span>{columnKey}</span>;
                },
                render: (data: StructVarMultiSelectionTableRow) => {
                    return (
                        <StructVarCell
                            tableType={this.props.tableType}
                            uniqueRowId={data.uniqueKey}
                            selectedStructVars={this.props.selectedStructVars}
                            label={data.label2}
                            gene1SymbolOrOql={STRUCTVARAnyGeneStr}
                            gene2SymbolOrOql={
                                data.label2 || STRUCTVARNullGeneStr
                            }
                            isCancerGene={data.gene2IsCancerGene}
                            oncokbAnnotated={data.gene2OncokbAnnotated}
                            isOncogene={data.gene2IsOncokbOncogene}
                            isTumorSuppressorGene={
                                data.gene2IsOncokbTumorSuppressorGene
                            }
                            onStructVarSelect={
                                this.props.onStructuralVariantSelect
                            }
                            onGeneHovered={this.onStructVarHover}
                            hoveredStructVarRowId={hoveredStructVarTableRowId}
                            hideCheckbox={!data.label2}
                        />
                    );
                },
                sortBy: (data: StructVarMultiSelectionTableRow) => data.label2,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: StructVarMultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.label2
                        ?.toUpperCase()
                        .includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [StructVarMultiSelectionTableColumnKey.NUMBER]: {
                name: columnKey,
                tooltip: <span>{getTooltip(this.props.tableType, false)}</span>,
                headerRender: () => {
                    return (
                        <TableHeaderCellFilterIcon
                            cellMargin={cellMargin}
                            dataTest="number-column-header"
                            className={styles.displayFlex}
                            showFilter={!!this.props.alterationFilterEnabled}
                            isFiltered={!!this.props.filterAlterations}
                        >
                            <span>{columnKey}</span>
                        </TableHeaderCellFilterIcon>
                    );
                },
                render: (data: StructVarMultiSelectionTableRow) => (
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
                        <span data-test={'numberOfAlteredCasesText'}>
                            {data.numberOfAlteredCases.toLocaleString()}
                        </span>
                    </LabeledCheckbox>
                ),
                sortBy: (data: StructVarMultiSelectionTableRow) =>
                    data.numberOfAlteredCases,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: StructVarMultiSelectionTableRow,
                    filterString: string
                ) => {
                    return _.toString(data.numberOfAlteredCases).includes(
                        filterString
                    );
                },
                width: columnWidth,
            },
            [StructVarMultiSelectionTableColumnKey.FREQ]: {
                name: columnKey,
                tooltip: <span>{getTooltip(this.props.tableType, true)}</span>,
                headerRender: () => {
                    return <div style={{ marginLeft: cellMargin }}>Freq</div>;
                },
                render: (data: StructVarMultiSelectionTableRow) => {
                    return getFreqColumnRender(
                        this.props.tableType,
                        data.numberOfProfiledCases,
                        data.numberOfAlteredCases,
                        data.matchingGenePanelIds || [],
                        this.toggleModal,
                        { marginLeft: cellMargin }
                    );
                },
                sortBy: (data: StructVarMultiSelectionTableRow) =>
                    (data.numberOfAlteredCases / data.numberOfProfiledCases) *
                    100,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: StructVarMultiSelectionTableRow,
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
            [StructVarMultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS]: {
                name: columnKey,
                tooltip: <span>Total number of mutations</span>,
                headerRender: () => {
                    return (
                        <div style={{ marginLeft: cellMargin }}>
                            {
                                StructVarMultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS
                            }
                        </div>
                    );
                },
                render: (data: StructVarMultiSelectionTableRow) => (
                    <span
                        data-test={'numberOfAlterations'}
                        style={{
                            flexDirection: 'row-reverse',
                            display: 'flex',
                            marginRight: cellMargin,
                        }}
                    >
                        {data.totalCount.toLocaleString()}
                    </span>
                ),
                sortBy: (data: StructVarMultiSelectionTableRow) =>
                    data.totalCount,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: StructVarMultiSelectionTableRow,
                    filterString: string
                ) => {
                    return _.toString(data.totalCount).includes(filterString);
                },
                width: columnWidth,
            },
            [StructVarMultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS]: {
                name: columnKey,
                tooltip: <span>Total number of structural variants</span>,
                headerRender: () => {
                    return (
                        <div
                            style={{
                                marginLeft: cellMargin - 18,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {
                                StructVarMultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS
                            }
                        </div>
                    );
                },
                render: (data: StructVarMultiSelectionTableRow) => (
                    <span
                        data-test={'numberOfAlterations'}
                        style={{
                            flexDirection: 'row-reverse',
                            display: 'flex',
                            marginRight: cellMargin,
                        }}
                    >
                        {data.totalCount.toLocaleString()}
                    </span>
                ),
                sortBy: (data: StructVarMultiSelectionTableRow) =>
                    data.totalCount,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: StructVarMultiSelectionTableRow,
                    filterString: string
                ) => {
                    return _.toString(data.totalCount).includes(filterString);
                },
                width: columnWidth,
            },
        };
        return defaults[columnKey];
    };

    getDefaultCellMargin = (
        columnKey: StructVarMultiSelectionTableColumnKey,
        columnWidth: number
    ) => {
        const defaults: {
            [key in StructVarMultiSelectionTableColumnKey]: number;
        } = {
            [StructVarMultiSelectionTableColumnKey.GENE1]: 0,
            [StructVarMultiSelectionTableColumnKey.GENE2]: 0,
            [StructVarMultiSelectionTableColumnKey.STRUCTVAR_SELECT]: 0,
            [StructVarMultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    columnWidth,
                    this.totalCountLocaleString
                )
            ),
            [StructVarMultiSelectionTableColumnKey.NUMBER]: correctMargin(
                (columnWidth -
                    10 -
                    (getFixedHeaderTableMaxLengthStringPixel(
                        this.alteredCasesLocaleString
                    ) +
                        30)) /
                    2
            ),
            [StructVarMultiSelectionTableColumnKey.FREQ]: correctMargin(
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
        };
        return defaults[columnKey];
    };

    @computed
    get maxNumberTotalCount() {
        return _.maxBy(this.tableData!, item => item.totalCount);
    }

    @computed
    get maxNumberAlteredCasesColumn() {
        return _.maxBy(this.tableData!, item => item.numberOfAlteredCases);
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
            {} as { [key in StructVarMultiSelectionTableColumnKey]: number }
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
            {} as { [key in StructVarMultiSelectionTableColumnKey]: number }
        );
    }

    @computed get tableData() {
        const data = this.props.promise.result || [];
        const activeFilters: Array<(
            row: StructVarMultiSelectionTableRow
        ) => boolean> = [];
        if (this.isFilteredByCancerGeneList) {
            activeFilters.push(
                row => row.gene1IsCancerGene || row.gene2IsCancerGene
            );
        }
        if (this.isFilteredByO2gl) {
            activeFilters.push(
                row =>
                    this.o2glGeneSet.has(row.label1) ||
                    this.o2glGeneSet.has(row.label2)
            );
        }
        if (activeFilters.length === 0) {
            return data;
        }
        // union: a gene pair is kept if it matches ANY checked filter;
        // intersection: it must match ALL of them
        return this.geneFilterOperator === SelectionOperatorEnum.INTERSECTION
            ? _.filter(data, row => activeFilters.every(f => f(row)))
            : _.filter(data, row => activeFilters.some(f => f(row)));
    }

    private geneFilterOperatorStorageKey() {
        return `${this.props.tableType}_geneFilterOperator`;
    }

    @observable private _geneFilterOperator: SelectionOperatorEnum;

    @computed get geneFilterOperator(): SelectionOperatorEnum {
        if (this._geneFilterOperator) {
            return this._geneFilterOperator;
        }
        return (localStorage.getItem(
            this.geneFilterOperatorStorageKey()
        ) as SelectionOperatorEnum) === SelectionOperatorEnum.INTERSECTION
            ? SelectionOperatorEnum.INTERSECTION
            : SelectionOperatorEnum.UNION;
    }

    @action.bound
    toggleGeneFilterOperator() {
        this._geneFilterOperator =
            this.geneFilterOperator === SelectionOperatorEnum.INTERSECTION
                ? SelectionOperatorEnum.UNION
                : SelectionOperatorEnum.INTERSECTION;
        localStorage.setItem(
            this.geneFilterOperatorStorageKey(),
            this._geneFilterOperator
        );
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
            .sortBy<StructVarMultiSelectionTableRow>(data =>
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
        return this.props.columns.map(column => {
            const columnDefinition = this.getDefaultColumnDefinition(
                column.columnKey,
                this.columnsWidth[column.columnKey],
                this.cellMargin[column.columnKey],
                this.hoveredStructVarTableRowId
            );
            if (column.columnTooltip) {
                columnDefinition.tooltip = column.columnTooltip;
            }
            return columnDefinition;
        });
    }

    @action.bound
    toggleModal(panelName: string) {
        this.modalSettings.modalOpen = !this.modalSettings.modalOpen;
        if (!this.modalSettings.modalOpen) {
            return;
        }
        this.modalSettings.modalPanelName = panelName;
    }

    @action.bound
    closeModal() {
        this.modalSettings.modalOpen = !this.modalSettings.modalOpen;
    }

    @computed get isFilteredByCancerGeneList() {
        return (
            !!this.props.cancerGeneFilterEnabled &&
            !!this.props.filterByCancerGenes
        );
    }

    @computed get isFilteredByO2gl() {
        return !!this.props.o2glFilterEnabled && !!this.props.filterByO2gl;
    }

    @computed get o2glGeneSet(): Set<string> {
        return new Set(this.props.o2glGenes || []);
    }

    @computed get geneFilterDropdownOptions(): IGeneFilterDropdownOption[] {
        const options: IGeneFilterDropdownOption[] = [];
        if (this.props.cancerGeneFilterEnabled) {
            options.push({
                label: (
                    <span
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                        <span
                            style={{ display: 'inline-flex', marginRight: 5 }}
                        >
                            <OncoKbCancerGeneIcon />
                        </span>
                        {getOncoKBCancerGeneListLinkout()}
                    </span>
                ),
                checked: this.isFilteredByCancerGeneList,
                onToggle: checked =>
                    this.props.onChangeCancerGeneFilter(checked),
                dataTest: 'gene-filter-option-oncokb',
            });
        }
        if (this.props.o2glFilterEnabled) {
            const codeCount = (this.props.o2glOncotreeCodes || []).length;
            const geneCount = this.o2glGeneSet.size;
            options.push({
                label: (
                    <span
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                        <span
                            style={{ display: 'inline-flex', marginRight: 5 }}
                        >
                            <OncoTree2GenesIcon />
                        </span>
                        <span>
                            {getOncoTree2GenesLinkout()}{' '}
                            <span className={styles.geneFilterDropdownCount}>
                                ({codeCount} oncotree{' '}
                                {codeCount === 1 ? 'code' : 'codes'},{' '}
                                {geneCount} {geneCount === 1 ? 'gene' : 'genes'}
                                )
                            </span>
                        </span>
                    </span>
                ),
                checked: this.isFilteredByO2gl,
                onToggle: checked =>
                    this.props.onChangeO2glFilter &&
                    this.props.onChangeO2glFilter(checked),
                dataTest: 'gene-filter-option-o2gl',
            });
        }
        return options;
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

    @action.bound
    onStructVarHover(rowId: string, isHovered: boolean) {
        this.hoveredStructVarTableRowId = isHovered ? rowId : undefined;
    }

    @action.bound
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

    @action.bound
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
    isSelectedRow(data: StructVarMultiSelectionTableRow) {
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
    selectedRowClassName(data: StructVarMultiSelectionTableRow) {
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

    @action.bound
    afterSorting(
        sortBy: StructVarMultiSelectionTableColumnKey,
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
