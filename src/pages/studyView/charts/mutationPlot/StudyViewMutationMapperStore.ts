import { Mutation } from 'cbioportal-ts-api-client';
import {} from 'react-mutation-mapper';
import {
    DefaultMutationMapperDataStore,
    DefaultMutationMapperStore,
    DefaultMutationMapperStoreConfig,
} from 'react-mutation-mapper';
import { action, computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';

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
    get samplesByPosition(): SampleData[] {
        const dataStore = this.dataStore as DefaultMutationMapperDataStore;
        const selectedPositions = dataStore.selectedPositions;
        const mutationsGroupedBySelectedPostions = this.mutationsByPosition;

        const mutationData = Object.values(selectedPositions).map(
            key => mutationsGroupedBySelectedPostions[key.position]
        );

        return _.flatten(mutationData).map(m => ({
            patientId: m.patientId,
            studyId: m.studyId,
            sampleId: m.sampleId,
            value: m.keyword,
        }));
    }
}
