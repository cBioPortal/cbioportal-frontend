import { Mutation } from 'cbioportal-ts-api-client';
import {
    ApplyFilterFn,
    DataFilterType,
    DefaultMutationMapperDataStore,
    DefaultMutationMapperStore,
    FilterApplier,
    groupDataByGroupFilters,
} from 'react-mutation-mapper';
import { computed, makeObservable } from 'mobx';
import _ from 'lodash';
import {
    createAnnotatedProteinImpactTypeFilter,
    isPutativeDriver,
} from 'shared/lib/MutationUtils';
import { ProteinImpactType } from 'cbioportal-frontend-commons';

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
    filterAppliersOverride?: { [filterType: string]: ApplyFilterFn };
    oncoKbUrl?: string;
    enableCivic?: boolean;
    enableOncoKb?: boolean;
    enableRevue?: boolean;
    cachePostMethodsOnClients?: boolean;
    apiCacheLimit?: number;
    getMutationCount?: (mutation: Partial<Mutation>) => number;
    getTumorType?: (mutation: Partial<Mutation>) => string;
    genomeBuild?: string;
    filterApplier?: FilterApplier;
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
    get tooltipDriverAnnotationImpactTypeBadgeValues(): any {
        const dataStore = this.dataStore as DefaultMutationMapperDataStore;
        const filters = Object.values(ProteinImpactType).map(value => ({
            group: value,
            filter: {
                type: DataFilterType.PROTEIN_IMPACT_TYPE,
                values: [value],
            },
        }));

        // Use customized filter for putative driver annotation
        const groupedData = groupDataByGroupFilters(
            filters,
            dataStore.allData,
            createAnnotatedProteinImpactTypeFilter(isPutativeDriver)
        );

        return _.keyBy(groupedData, d => d.group);
    }

    @computed
    public get tooltipDriverAnnotationImpactTypeBadgeCounts():
        | {
              [proteinImpactType: string]: number;
          }
        | undefined {
        const map: { [proteinImpactType: string]: number } = {};

        Object.keys(this.tooltipDriverAnnotationImpactTypeBadgeValues).forEach(
            proteinImpactType => {
                const g = this.tooltipDriverAnnotationImpactTypeBadgeValues[
                    proteinImpactType
                ];
                map[g.group] = g.data.length;
            }
        );

        return map;
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
