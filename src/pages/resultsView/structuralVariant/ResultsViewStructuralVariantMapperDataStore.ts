import * as _ from 'lodash';
import { computed, makeObservable } from 'mobx';
import { SimpleLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { StructuralVariant } from 'cbioportal-ts-api-client';

export default class ResultsViewStructuralVariantMapperDataStore extends SimpleLazyMobXTableApplicationDataStore<
    StructuralVariant[]
> {
    constructor(data: StructuralVariant[][]) {
        super(data);
        makeObservable(this);
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
