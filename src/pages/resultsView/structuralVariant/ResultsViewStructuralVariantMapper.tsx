/**
 * Copyright (c) 2018 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
 * version 3, or (at your option) any later version.
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import * as React from 'react';
import ResultsViewStructuralVariantTable from './ResultsViewStructuralVariantTable';
import { observer } from 'mobx-react';
import { ResultsViewStructuralVariantMapperStore } from './ResultsViewStructuralVariantMapperStore';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import { action, computed, makeObservable, observable } from 'mobx';
import {
    getOncoKbIconStyleFromLocalStorage,
    saveOncoKbIconStyleToLocalStorage,
} from 'shared/lib/AnnotationColumnUtils';
import { MakeMobxView } from 'shared/components/MobxView';
import ErrorMessage from 'shared/components/ErrorMessage';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';
import FilterIconModal from 'shared/components/filterIconModal/FilterIconModal';
import DoubleHandleSlider from 'shared/components/doubleHandleSlider/DoubleHandleSlider';
import CategoricalFilterMenu from 'shared/components/categoricalFilterMenu/CategoricalFilterMenu';
import { FusionTableColumnType } from 'shared/components/structuralVariantTable/StructuralVariantTable';
import { StructuralVariant } from 'cbioportal-ts-api-client';

type ColumnMinMax = {
    min: string;
    max: string;
    minNumber: number;
    maxNumber: number;
    hasEmptyValues: boolean;
};

type NumericalFilterState = {
    lowerBound: number;
    upperBound: number;
    hideEmptyValues: boolean;
};

type CategoricalFilterCondition =
    | 'contains'
    | 'doesNotContain'
    | 'equals'
    | 'doesNotEqual'
    | 'beginsWith'
    | 'doesNotBeginWith'
    | 'endsWith'
    | 'doesNotEndWith'
    | 'regex';

type CategoricalFilterState = {
    filterCondition: CategoricalFilterCondition;
    filterString: string;
    selections: Set<string>;
};

export interface IFusionMapperProps {
    store: ResultsViewStructuralVariantMapperStore;
}

@observer
export default class ResultsViewStructuralVariantMapper extends React.Component<
    IFusionMapperProps,
    {}
> {
    @observable mergeFusionTableOncoKbIcons;
    @observable private minMaxColumns: Set<
        Column<StructuralVariant[]>
    > = new Set();
    @observable private allUniqDataColumns: Set<
        Column<StructuralVariant[]>
    > = new Set();

    private readonly numericalFilterColumnIds = new Set<string>([
        FusionTableColumnType.SITE1_POSITION,
        FusionTableColumnType.SITE2_POSITION,
        FusionTableColumnType.LENGTH,
        FusionTableColumnType.DNA_SUPPORT,
        FusionTableColumnType.RNA_SUPPORT,
        FusionTableColumnType.NORMAL_READ_COUNT,
        FusionTableColumnType.TUMOR_READ_COUNT,
        FusionTableColumnType.NORMAL_VARIANT_COUNT,
        FusionTableColumnType.TUMOR_VARIANT_COUNT,
        FusionTableColumnType.NORMAL_PAIRED_END_READ_COUNT,
        FusionTableColumnType.TUMOR_PAIRED_END_READ_COUNT,
        FusionTableColumnType.NORMAL_SPLIT_READ_COUNT,
        FusionTableColumnType.TUMOR_SPLIT_READ_COUNT,
    ]);

    private categoricalFilterColumnIds: Set<string> = new Set();

    constructor(props: IFusionMapperProps) {
        super(props);
        makeObservable(this);

        this.mergeFusionTableOncoKbIcons = getOncoKbIconStyleFromLocalStorage().mergeIcons;

        this.categoricalFilterColumnIds = new Set<string>(
            (Object.values(FusionTableColumnType) as string[]).filter(
                columnType => !this.numericalFilterColumnIds.has(columnType)
            )
        );
    }

    @action.bound
    handleOncoKbIconToggle(mergeIcons: boolean) {
        this.mergeFusionTableOncoKbIcons = mergeIcons;
        saveOncoKbIconStyleToLocalStorage({ mergeIcons });
    }

    @computed get itemsLabelPlural(): string {
        const count = this.props.store.dataStore
            .duplicateStructuralVariantCountInMultipleSamples;
        const structuralVariantsLabel =
            count === 1 ? 'structural variant' : 'structural variants';

        const multipleStructuralVariantInfo =
            count > 0
                ? `: includes ${count} duplicate ${structuralVariantsLabel} in patients with multiple samples`
                : '';

        return `Structural Variants${multipleStructuralVariantInfo}`;
    }

    private getColumnId = (column: Column<StructuralVariant[]>) => column.name;

    private resolveDownloadedValue = (
        row: StructuralVariant[],
        column: Column<StructuralVariant[]>
    ): string => {
        const download = column.download;
        if (!download) return '(Blanks)';

        try {
            const raw = download(row) as any;
            const val = Array.isArray(raw) ? raw[0] : raw;
            if (val === null || val === undefined) return '(Blanks)';
            const str = String(val);
            return str.length ? str : '(Blanks)';
        } catch (e) {
            console.debug(
                '[ResultsViewStructuralVariantMapper] Failed resolving downloaded value',
                e
            );
            return '(Blanks)';
        }
    };

    private resolveDownloadedNumber = (
        row: StructuralVariant[],
        column: Column<StructuralVariant[]>
    ): number | null => {
        const download = column.download;
        if (!download) return null;

        try {
            const raw = download(row) as any;
            const val = Array.isArray(raw) ? raw[0] : raw;
            if (
                val === null ||
                val === undefined ||
                val === '' ||
                val === 'NA'
            ) {
                return null;
            }

            const n = typeof val === 'number' ? val : +String(val);
            return Number.isFinite(n) ? n : null;
        } catch (e) {
            console.debug(
                '[ResultsViewStructuralVariantMapper] Failed resolving downloaded number',
                e
            );
            return null;
        }
    };

    protected deactivateColumnFilter = (columnId: string) => {
        this.props.store.dataStore.deactivateColumnFilter(columnId);
    };

    protected setupColumnFilter = (column: Column<StructuralVariant[]>) => {
        const columnId = this.getColumnId(column);
        const dataStore = this.props.store.dataStore;

        if (this.numericalFilterColumnIds.has(columnId)) {
            if (!column.download) return;
            dataStore.registerNumericalColumnValueGetter(
                columnId,
                (row: StructuralVariant[]) =>
                    this.resolveDownloadedNumber(row, column)
            );
            this.minMaxColumns.add(column);
        } else if (this.categoricalFilterColumnIds.has(columnId)) {
            if (!column.download) return;
            dataStore.registerCategoricalColumnValueGetter(
                columnId,
                (row: StructuralVariant[]) =>
                    this.resolveDownloadedValue(row, column)
            );
            this.allUniqDataColumns.add(column);
        }
    };

    private isEffectivelySameNumber(a: number, b: number) {
        return Math.abs(a - b) < 1e-9;
    }

    private readonly validCategoricalFilterConditions = new Set<
        CategoricalFilterState['filterCondition']
    >([
        'contains',
        'doesNotContain',
        'equals',
        'doesNotEqual',
        'beginsWith',
        'doesNotBeginWith',
        'endsWith',
        'doesNotEndWith',
        'regex',
    ]);

    private toCategoricalFilterCondition(
        maybeCondition: string
    ): CategoricalFilterState['filterCondition'] {
        if (
            this.validCategoricalFilterConditions.has(
                maybeCondition as CategoricalFilterState['filterCondition']
            )
        ) {
            return maybeCondition as CategoricalFilterState['filterCondition'];
        }

        console.debug(
            '[ResultsViewStructuralVariantMapper] Invalid categorical filter condition received:',
            maybeCondition
        );
        return 'contains';
    }

    @computed get columnMinMax(): Record<string, ColumnMinMax> {
        const ret: Record<string, ColumnMinMax> = {};
        const dataStore = this.props.store.dataStore;

        for (const column of this.minMaxColumns) {
            const columnId = column.name;
            let min = Infinity;
            let max = -Infinity;
            let hasEmptyValues = false;

            for (const row of dataStore.allData) {
                const value = this.resolveDownloadedNumber(row, column);
                if (value === null) {
                    hasEmptyValues = true;
                    continue;
                }
                min = Math.min(min, value);
                max = Math.max(max, value);
            }

            if (!Number.isFinite(min) || !Number.isFinite(max)) {
                min = 0;
                max = 0;
            }

            ret[columnId] = {
                min: `${min}`,
                max: `${max}`,
                minNumber: min,
                maxNumber: max,
                hasEmptyValues,
            };
        }

        return ret;
    }

    @computed get allUniqColumnData(): Record<string, Set<string>> {
        const ret: Record<string, Set<string>> = {};
        const dataStore = this.props.store.dataStore;

        for (const column of this.allUniqDataColumns) {
            const columnId = column.name;
            const download = column.download;
            const values = new Set<string>();

            if (!download) {
                ret[columnId] = values;
                continue;
            }

            for (const row of dataStore.allData) {
                values.add(this.resolveDownloadedValue(row, column));
            }

            ret[columnId] = values;
        }

        return ret;
    }

    protected isDefaultNumericalFilter(columnId: string) {
        const dataStore = this.props.store.dataStore;
        const filter = dataStore.getNumericalFilter(columnId);
        if (!filter) return false;
        const minMax = this.columnMinMax[columnId];
        if (!minMax) return false;
        return (
            this.isEffectivelySameNumber(filter.lowerBound, minMax.minNumber) &&
            this.isEffectivelySameNumber(filter.upperBound, minMax.maxNumber) &&
            filter.hideEmptyValues === false
        );
    }

    protected isDefaultCategoricalFilter(columnId: string) {
        const dataStore = this.props.store.dataStore;
        const filter = dataStore.getCategoricalFilter(columnId);
        if (!filter) return false;
        const allValues = this.allUniqColumnData[columnId];
        if (!allValues) return false;
        const isSetEqual =
            filter.selections.size === allValues.size &&
            Array.from(allValues).every(v => filter.selections.has(v));

        return (
            filter.filterCondition === 'contains' &&
            filter.filterString === '' &&
            isSetEqual
        );
    }

    protected activateNumericalFilter = (
        columnId: string,
        lowerBound?: number,
        upperBound?: number,
        hideEmptyValues?: boolean
    ) => {
        const dataStore = this.props.store.dataStore;
        const minMax = this.columnMinMax[columnId];
        if (!minMax) return;

        const nextState: NumericalFilterState = {
            lowerBound:
                lowerBound === undefined ? minMax.minNumber : lowerBound,
            upperBound:
                upperBound === undefined ? minMax.maxNumber : upperBound,
            hideEmptyValues: hideEmptyValues ?? false,
        };

        if (
            this.isEffectivelySameNumber(
                nextState.lowerBound,
                minMax.minNumber
            ) &&
            this.isEffectivelySameNumber(
                nextState.upperBound,
                minMax.maxNumber
            ) &&
            nextState.hideEmptyValues === false
        ) {
            this.deactivateColumnFilter(columnId);
            return;
        }

        dataStore.activateNumericalFilter(columnId, nextState);
    };

    protected activateCategoricalFilter = (
        columnId: string,
        filterCondition?: CategoricalFilterState['filterCondition'],
        filterString?: string,
        selections?: Set<string>
    ) => {
        const dataStore = this.props.store.dataStore;
        const allValues = this.allUniqColumnData[columnId];
        if (!allValues) return;

        const nextState: CategoricalFilterState = {
            filterCondition: filterCondition || 'contains',
            filterString: filterString || '',
            selections: selections ? new Set(selections) : new Set(allValues),
        };

        const isDefault =
            nextState.filterCondition === 'contains' &&
            nextState.filterString === '' &&
            nextState.selections.size === allValues.size &&
            Array.from(allValues).every(v => nextState.selections.has(v));

        if (isDefault) {
            this.deactivateColumnFilter(columnId);
            return;
        }

        dataStore.activateCategoricalFilter(columnId, nextState);
    };

    @computed get numericalFilterComponents(): Record<string, JSX.Element> {
        const components: Record<string, JSX.Element> = {};
        for (const column of this.minMaxColumns) {
            const columnId = column.name;
            const minMax = this.columnMinMax[columnId];
            if (!minMax) continue;
            const filter = this.props.store.dataStore.getNumericalFilter(
                columnId
            );

            components[columnId] = (
                <div>
                    <DoubleHandleSlider
                        id={columnId}
                        min={minMax.min}
                        max={minMax.max}
                        lowerValue={filter?.lowerBound}
                        upperValue={filter?.upperBound}
                        callbackLowerValue={newLowerValue => {
                            this.activateNumericalFilter(
                                columnId,
                                newLowerValue,
                                filter?.upperBound,
                                filter?.hideEmptyValues
                            );
                        }}
                        callbackUpperValue={newUpperValue => {
                            this.activateNumericalFilter(
                                columnId,
                                filter?.lowerBound,
                                newUpperValue,
                                filter?.hideEmptyValues
                            );
                        }}
                    />

                    {minMax.hasEmptyValues && (
                        <label style={{ fontWeight: 100 }}>
                            <input
                                type="checkbox"
                                style={{
                                    marginTop: '10px',
                                    marginLeft: '5px',
                                    marginRight: '4px',
                                }}
                                checked={
                                    filter ? filter.hideEmptyValues : false
                                }
                                onChange={() => {
                                    if (filter) {
                                        const nextHide = !filter.hideEmptyValues;
                                        if (
                                            this.isEffectivelySameNumber(
                                                filter.lowerBound,
                                                minMax.minNumber
                                            ) &&
                                            this.isEffectivelySameNumber(
                                                filter.upperBound,
                                                minMax.maxNumber
                                            ) &&
                                            nextHide === false
                                        ) {
                                            this.deactivateColumnFilter(
                                                columnId
                                            );
                                        } else {
                                            this.activateNumericalFilter(
                                                columnId,
                                                filter.lowerBound,
                                                filter.upperBound,
                                                nextHide
                                            );
                                        }
                                    } else {
                                        this.activateNumericalFilter(
                                            columnId,
                                            undefined,
                                            undefined,
                                            true
                                        );
                                    }
                                }}
                                data-test="structural-variant-numerical-filter-hide-empty"
                            />
                            {'Hide empty values'}
                        </label>
                    )}
                </div>
            );
        }
        return components;
    }

    @computed get categoricalFilterComponents(): Record<string, JSX.Element> {
        const components: Record<string, JSX.Element> = {};
        for (const column of this.allUniqDataColumns) {
            const columnId = column.name;
            const dataStore = this.props.store.dataStore;
            const filter = dataStore.getCategoricalFilter(columnId);
            const allSelections = this.allUniqColumnData[columnId] || new Set();
            const currSelections = filter ? filter.selections : allSelections;

            components[columnId] = (
                <CategoricalFilterMenu
                    id={columnId}
                    emptyFilterString={!filter}
                    currSelections={currSelections}
                    allSelections={allSelections}
                    updateFilterCondition={newFilterCondition => {
                        if (filter) {
                            const nextState: CategoricalFilterState = {
                                ...filter,
                                filterCondition: this.toCategoricalFilterCondition(
                                    newFilterCondition
                                ),
                            };
                            if (this.isDefaultCategoricalFilter(columnId)) {
                                this.deactivateColumnFilter(columnId);
                            } else {
                                this.activateCategoricalFilter(
                                    columnId,
                                    nextState.filterCondition,
                                    nextState.filterString,
                                    nextState.selections
                                );
                            }
                        } else {
                            this.activateCategoricalFilter(
                                columnId,
                                this.toCategoricalFilterCondition(
                                    newFilterCondition
                                ),
                                '',
                                allSelections
                            );
                        }
                    }}
                    updateFilterString={newFilterString => {
                        if (filter) {
                            const nextState: CategoricalFilterState = {
                                ...filter,
                                filterString: newFilterString,
                            };
                            if (this.isDefaultCategoricalFilter(columnId)) {
                                this.deactivateColumnFilter(columnId);
                            } else {
                                this.activateCategoricalFilter(
                                    columnId,
                                    nextState.filterCondition,
                                    nextState.filterString,
                                    nextState.selections
                                );
                            }
                        } else {
                            this.activateCategoricalFilter(
                                columnId,
                                'contains',
                                newFilterString,
                                allSelections
                            );
                        }
                    }}
                    toggleSelections={toggledSelections => {
                        if (filter) {
                            const nextSelections = new Set<string>(
                                Array.from(filter.selections)
                            );
                            toggledSelections.forEach(selection => {
                                if (nextSelections.has(selection)) {
                                    nextSelections.delete(selection);
                                } else {
                                    nextSelections.add(selection);
                                }
                            });

                            if (this.isDefaultCategoricalFilter(columnId)) {
                                this.deactivateColumnFilter(columnId);
                            } else {
                                this.activateCategoricalFilter(
                                    columnId,
                                    filter.filterCondition,
                                    filter.filterString,
                                    nextSelections
                                );
                            }
                        } else {
                            const nextSelections = new Set<string>(
                                Array.from(allSelections)
                            );
                            toggledSelections.forEach(selection => {
                                nextSelections.delete(selection);
                            });
                            this.activateCategoricalFilter(
                                columnId,
                                undefined,
                                undefined,
                                nextSelections
                            );
                        }
                    }}
                />
            );
        }
        return components;
    }

    protected columnToHeaderFilterIconModal = (
        column: Column<StructuralVariant[]>
    ) => {
        const columnId = this.getColumnId(column);
        const dataStore = this.props.store.dataStore;

        const isNumericalFilterColumn =
            this.numericalFilterColumnIds.has(columnId) && !!column.download;
        const isCategoricalFilterColumn =
            this.categoricalFilterColumnIds.has(columnId) && !!column.download;

        if (!isNumericalFilterColumn && !isCategoricalFilterColumn) {
            return undefined;
        }

        let menuComponent: JSX.Element | undefined;
        if (isNumericalFilterColumn && this.minMaxColumns.has(column)) {
            menuComponent = this.numericalFilterComponents[columnId];
        } else if (
            isCategoricalFilterColumn &&
            this.allUniqDataColumns.has(column)
        ) {
            menuComponent = this.categoricalFilterComponents[columnId];
        }

        return (
            <FilterIconModal
                id={columnId}
                filterIsActive={dataStore.isColumnFilterActive(columnId)}
                deactivateFilter={() => this.deactivateColumnFilter(columnId)}
                setupFilter={() => this.setupColumnFilter(column)}
                menuComponent={menuComponent}
            />
        );
    };

    tableUI = MakeMobxView({
        await: () => [
            this.props.store.studyIdToStudy,
            this.props.store.molecularProfileIdToMolecularProfile,
        ],

        render: () => {
            return (
                <>
                    <ResultsViewStructuralVariantTable
                        dataStore={this.props.store.dataStore}
                        itemsLabelPlural={this.itemsLabelPlural}
                        studyIdToStudy={this.props.store.studyIdToStudy.result}
                        molecularProfileIdToMolecularProfile={
                            this.props.store
                                .molecularProfileIdToMolecularProfile.result
                        }
                        transcriptToExons={this.props.store.transcriptToExons}
                        uniqueSampleKeyToTumorType={
                            this.props.store.uniqueSampleKeyToTumorType
                        }
                        structuralVariantOncoKbData={
                            this.props.store.structuralVariantOncoKbData
                        }
                        oncoKbCancerGenes={this.props.store.oncoKbCancerGenes}
                        usingPublicOncoKbInstance={
                            this.props.store.usingPublicOncoKbInstance
                        }
                        mergeOncoKbIcons={this.mergeFusionTableOncoKbIcons}
                        onOncoKbIconToggle={this.handleOncoKbIconToggle}
                        columnToHeaderFilterIconModal={
                            this.columnToHeaderFilterIconModal
                        }
                        deactivateColumnFilter={this.deactivateColumnFilter}
                    />
                </>
            );
        },

        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return this.tableUI.component;
    }
}
