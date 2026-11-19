/*
 * Copyright (c) 2018 The Hyve B.V.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
import { SimpleLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { StructuralVariant } from 'cbioportal-ts-api-client';

export default class ResultsViewStructuralVariantMapperDataStore extends SimpleLazyMobXTableApplicationDataStore<
    StructuralVariant[]
> {
    /** Restricts the table to this structural variant */
    @observable.ref selectedStructuralVariant: StructuralVariant | undefined;
    @observable.ref highlightedStructuralVariant: StructuralVariant | undefined;

    constructor(data: StructuralVariant[][]) {
        super(data);
        makeObservable(this);
    }

    @action.bound
    setSelectedStructuralVariant(sv: StructuralVariant | undefined) {
        this.selectedStructuralVariant = sv;
        this.dataSelector = sv ? row => row[0] === sv : () => false;
    }

    @action.bound
    setHighlightedStructuralVariant(sv: StructuralVariant | undefined) {
        this.highlightedStructuralVariant = sv;
        this.dataHighlighter = sv ? row => row[0] === sv : () => false;
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
