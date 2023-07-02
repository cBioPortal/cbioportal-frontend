import { Mutation } from 'cbioportal-ts-api-client';
import { DefaultMutationMapperStoreConfig } from '../../../../../packages/react-mutation-mapper/dist/store/DefaultMutationMapperStore';
import {
    DefaultMutationMapperDataStore,
    DefaultMutationMapperStore,
} from 'react-mutation-mapper';
import { action, computed, makeObservable, observable } from 'mobx';

export type SampleData = {
    sampleId: string;
    patientId: string;
    studyId: string;
    value: string;
};

export default class StudyViewMutationMapperStore extends DefaultMutationMapperStore<
    Mutation
> {
    @observable private xAxisOnTop: boolean = false;

    constructor(
        public gene: { hugoGeneSymbol: string },
        protected config: DefaultMutationMapperStoreConfig,
        protected getMutations: () => Mutation[]
    ) {
        super(gene, config, getMutations);
        makeObservable(this);
        this.xAxisOnTop = false;
    }

    @computed
    get isXAxisOnTopSelected(): boolean {
        return this.xAxisOnTop;
    }

    @action.bound
    toggleXAxisOnTop(): void {
        this.xAxisOnTop = this.xAxisOnTop === true ? false : true;
    }

    @computed
    get samplesViaSelectedCodons(): SampleData[] {
        const dataStore = this.dataStore as DefaultMutationMapperDataStore;
        const selectedPositions = dataStore.selectedPositions;
        const mutationsByPosition = this.mutationsByPosition;

        const mutationData = Object.values(selectedPositions).map(
            key => mutationsByPosition[key.position]
        );

        const samplesViaSelectedCodons: SampleData[] = [];

        mutationData.map(val => {
            val.map(m => {
                samplesViaSelectedCodons.push({
                    patientId: m.patientId,
                    studyId: m.studyId,
                    sampleId: m.sampleId,
                    value: m.keyword,
                });
            });
        });

        return samplesViaSelectedCodons;
    }
}
