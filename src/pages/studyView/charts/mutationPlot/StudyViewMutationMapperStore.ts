import { Mutation } from 'cbioportal-ts-api-client';
import { DefaultMutationMapperStoreConfig } from '../../../../../packages/react-mutation-mapper/dist/store/DefaultMutationMapperStore';
import {
    DefaultMutationMapperDataStore,
    DefaultMutationMapperStore,
} from 'react-mutation-mapper';
import { computed, makeObservable } from 'mobx';

type SampleData = {
    sampleId: string;
    patientId: string;
    studyId: string;
    value: string;
};

export default class StudyViewMutationMapperStore extends DefaultMutationMapperStore<
    Mutation
> {
    constructor(
        public gene: { hugoGeneSymbol: string },
        protected config: DefaultMutationMapperStoreConfig,
        protected getMutations: () => Mutation[]
    ) {
        super(gene, config, getMutations);

        makeObservable(this);
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
