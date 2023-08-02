import { Mutation } from 'cbioportal-ts-api-client';
import {} from 'react-mutation-mapper';
import {
    DefaultMutationMapperDataStore,
    DefaultMutationMapperStore,
} from 'react-mutation-mapper';
import { action, computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';

export type SampleData = {
    sampleId: string;
    patientId: string;
    studyId: string;
    value: string;
};

interface DefaultMutationMapperStoreConfig {
    annotationFields?: string[];
    isoformOverrideSource?: string;
    ptmSources?: string[];
    filterMutationsBySelectedTranscript?: boolean;
    genomeNexusUrl?: string;
    oncoKbUrl?: string;
    enableCivic?: boolean;
    enableOncoKb?: boolean;
    enableRevue?: boolean;
    cachePostMethodsOnClients?: boolean;
    apiCacheLimit?: number;
    getMutationCount?: (mutation: Partial<Mutation>) => number;
    getTumorType?: (mutation: Partial<Mutation>) => string;
    genomeBuild?: string;
}

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
