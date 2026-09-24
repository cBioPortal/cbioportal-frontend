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
    getSortedFilteredData,
    SimpleLazyMobXTableApplicationDataStore,
} from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import {
    matchesColumnFilter,
    structuralVariantColumnValue,
    StructuralVariantColumnFilter,
    StructuralVariantFilterContext,
} from './StructuralVariantFilters';
import { FusionTableColumnType } from 'shared/components/structuralVariantTable/StructuralVariantTable';

export default class ResultsViewStructuralVariantMapperDataStore extends SimpleLazyMobXTableApplicationDataStore<
    StructuralVariant[]
> {
    @observable.ref public columnFilters: Partial<
        Record<FusionTableColumnType, StructuralVariantColumnFilter>
    > = {};
    @observable.ref public filterContext: StructuralVariantFilterContext = {};

    constructor(data: StructuralVariant[][]) {
        super(data);
        makeObservable(this);
        this.getSortedFilteredData = () =>
            getSortedFilteredData(
                this.sortedData,
                this.filterString,
                this.getFilter()
            ).filter(row =>
                Object.entries(this.columnFilters).every(([column, filter]) =>
                    matchesColumnFilter(
                        structuralVariantColumnValue(
                            row,
                            column as FusionTableColumnType,
                            this.filterContext
                        ),
                        filter
                    )
                )
            );
    }

    @action.bound
    public setColumnFilter(
        column: FusionTableColumnType,
        filter?: StructuralVariantColumnFilter
    ) {
        const filters = { ...this.columnFilters };
        if (filter) filters[column] = filter;
        else delete filters[column];
        this.columnFilters = filters;
        this.page = 0;
    }

    @action.bound
    public setFilterContext(context: StructuralVariantFilterContext) {
        this.filterContext = context;
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
