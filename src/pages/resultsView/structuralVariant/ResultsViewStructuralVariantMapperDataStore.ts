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

import * as _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
import {
    DataFilterFunction,
    SimpleLazyMobXTableApplicationDataStore,
} from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { StructuralVariant } from 'cbioportal-ts-api-client';

export type NumericalFilterState = {
    lowerBound: number;
    upperBound: number;
    hideEmptyValues: boolean;
};

export type CategoricalFilterState = {
    filterCondition:
        | 'contains'
        | 'doesNotContain'
        | 'equals'
        | 'doesNotEqual'
        | 'beginsWith'
        | 'doesNotBeginWith'
        | 'endsWith'
        | 'doesNotEndWith'
        | 'regex';
    filterString: string;
    selections: Set<string>;
};

type NumericalValueGetter = (row: StructuralVariant[]) => number | null;

type CategoricalValueGetter = (row: StructuralVariant[]) => string | null;

export default class ResultsViewStructuralVariantMapperDataStore extends SimpleLazyMobXTableApplicationDataStore<
    StructuralVariant[]
> {
    @observable.ref
    private globalDataFilterFn: DataFilterFunction<StructuralVariant[]> = () =>
        true;

    @observable
    private numericalFilters: Record<string, NumericalFilterState> = {};

    @observable
    private categoricalFilters: Record<string, CategoricalFilterState> = {};

    private numericalValueGetters: Record<string, NumericalValueGetter> = {};
    private categoricalValueGetters: Record<
        string,
        CategoricalValueGetter
    > = {};

    constructor(data: StructuralVariant[][]) {
        super(data);
        makeObservable(this);
        this.dataFilter = (
            row,
            filterString,
            filterStringUpper,
            filterStringLower
        ) =>
            this.globalDataFilterFn(
                row,
                filterString,
                filterStringUpper,
                filterStringLower
            ) && this.matchesActiveColumnFilters(row);
    }

    @action public setFilter(fn: DataFilterFunction<StructuralVariant[]>) {
        this.globalDataFilterFn = fn;
    }

    @action public resetFilter() {
        this.globalDataFilterFn = () => true;
        this.filterString = '';
    }

    private matchesActiveColumnFilters(row: StructuralVariant[]) {
        for (const [columnId, state] of Object.entries(this.numericalFilters)) {
            const valueGetter = this.numericalValueGetters[columnId];
            if (!valueGetter) {
                console.debug(
                    '[ResultsViewStructuralVariantMapperDataStore] Missing numerical value getter for',
                    columnId
                );
                return false;
            }

            const value = valueGetter(row);

            const isEmpty = value === null || Number.isNaN(value);
            if (isEmpty) {
                if (state.hideEmptyValues) return false;
                continue;
            }

            if (value < state.lowerBound || value > state.upperBound) {
                return false;
            }
        }

        for (const [columnId, state] of Object.entries(
            this.categoricalFilters
        )) {
            const valueGetter = this.categoricalValueGetters[columnId];
            if (!valueGetter) {
                console.debug(
                    '[ResultsViewStructuralVariantMapperDataStore] Missing categorical value getter for',
                    columnId
                );
                return false;
            }

            const rawValue = valueGetter(row);
            const value = (rawValue && rawValue.length > 0
                ? rawValue
                : '(Blanks)') as string;

            if (
                !this.matchesCategoricalFilterSearch(
                    value,
                    state.filterCondition,
                    state.filterString
                )
            ) {
                return false;
            }

            if (!state.selections.has(value)) {
                return false;
            }
        }

        return true;
    }

    private matchesCategoricalFilterSearch(
        value: string,
        filterCondition: CategoricalFilterState['filterCondition'],
        filterString: string
    ) {
        if (filterString === '') {
            return true;
        }

        const valueUpper = value.toUpperCase();
        const filterStringUpper = filterString.toUpperCase();

        switch (filterCondition) {
            case 'contains':
                return valueUpper.includes(filterStringUpper);
            case 'doesNotContain':
                return !valueUpper.includes(filterStringUpper);
            case 'equals':
                return valueUpper === filterStringUpper;
            case 'doesNotEqual':
                return valueUpper !== filterStringUpper;
            case 'beginsWith':
                return valueUpper.startsWith(filterStringUpper);
            case 'doesNotBeginWith':
                return !valueUpper.startsWith(filterStringUpper);
            case 'endsWith':
                return valueUpper.endsWith(filterStringUpper);
            case 'doesNotEndWith':
                return !valueUpper.endsWith(filterStringUpper);
            case 'regex':
                try {
                    const regex = new RegExp(filterString);
                    return regex.test(value);
                } catch (e) {
                    return false;
                }
            default:
                return false;
        }
    }

    public registerNumericalColumnValueGetter(
        columnId: string,
        getter: NumericalValueGetter
    ) {
        this.numericalValueGetters[columnId] = getter;
    }

    public registerCategoricalColumnValueGetter(
        columnId: string,
        getter: CategoricalValueGetter
    ) {
        this.categoricalValueGetters[columnId] = getter;
    }

    public getNumericalFilter(
        columnId: string
    ): NumericalFilterState | undefined {
        return this.numericalFilters[columnId];
    }

    public getCategoricalFilter(
        columnId: string
    ): CategoricalFilterState | undefined {
        return this.categoricalFilters[columnId];
    }

    public isColumnFilterActive(columnId: string): boolean {
        return (
            columnId in this.numericalFilters ||
            columnId in this.categoricalFilters
        );
    }

    @action
    public activateNumericalFilter(
        columnId: string,
        filter: NumericalFilterState
    ) {
        this.numericalFilters = {
            ...this.numericalFilters,
            [columnId]: filter,
        };

        if (columnId in this.categoricalFilters) {
            const { [columnId]: _, ...rest } = this.categoricalFilters;
            this.categoricalFilters = rest;
        }
    }

    @action
    public deactivateNumericalFilter(columnId: string) {
        if (!(columnId in this.numericalFilters)) return;
        const { [columnId]: _, ...rest } = this.numericalFilters;
        this.numericalFilters = rest;
    }

    @action
    public activateCategoricalFilter(
        columnId: string,
        filter: CategoricalFilterState
    ) {
        this.categoricalFilters = {
            ...this.categoricalFilters,
            [columnId]: filter,
        };
        if (columnId in this.numericalFilters) {
            const { [columnId]: _, ...rest } = this.numericalFilters;
            this.numericalFilters = rest;
        }
    }

    @action
    public deactivateCategoricalFilter(columnId: string) {
        if (!(columnId in this.categoricalFilters)) return;
        const { [columnId]: _, ...rest } = this.categoricalFilters;
        this.categoricalFilters = rest;
    }

    @action
    public deactivateColumnFilter(columnId: string) {
        this.deactivateNumericalFilter(columnId);
        this.deactivateCategoricalFilter(columnId);
    }

    @computed
    get duplicateStructuralVariantCountInMultipleSamples(): number {
        const countMapper = (structuralVariants: StructuralVariant[]) =>
            structuralVariants.length > 0 ? structuralVariants.length - 1 : 0;

        const sumReducer = (acc: number, current: number) => acc + current;

        return _.chain(this.tableData)
            .flatten()
            .groupBy(structuralVariant => {
                // key = <patient>_<gene1chromosome>_<gene1position>_<gene2chromosome>_<gene2position>
                return `${structuralVariant.patientId}_${structuralVariant.site1Chromosome}_${structuralVariant.site1Position}_${structuralVariant.site2Chromosome}_${structuralVariant.site2Position}`;
            })
            .map(countMapper)
            .reduce(sumReducer, 0)
            .value();
    }
}
