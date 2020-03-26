import { IHotspotIndex } from 'react-mutation-mapper';
import {
    Mutation,
    Gene,
    ClinicalData,
    CancerStudy,
    MolecularProfile,
    SampleIdentifier,
} from 'shared/api/generated/CBioPortalAPI';
import { remoteData } from 'cbioportal-frontend-commons';
import { CancerGene } from 'oncokb-ts-api-client';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { labelMobxPromises, MobxPromise, cached } from 'mobxpromise';
import { IOncoKbData } from 'cbioportal-frontend-commons';
import { fetchCosmicData } from 'shared/lib/StoreUtils';
import MutationCountCache from 'shared/cache/MutationCountCache';
import DiscreteCNACache from 'shared/cache/DiscreteCNACache';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import GenomeNexusMyVariantInfoCache from 'shared/cache/GenomeNexusMyVariantInfoCache';
import { MutationTableDownloadDataFetcher } from 'shared/lib/MutationTableDownloadDataFetcher';
import MutationMapperStore, {
    IMutationMapperStoreConfig,
} from 'shared/components/mutationMapper/MutationMapperStore';
import { IServerConfig } from '../../../config/IAppConfig';

export default class ResultsViewMutationMapperStore extends MutationMapperStore {
    constructor(
        protected mutationMapperConfig: IServerConfig,
        protected mutationMapperStoreConfig: IMutationMapperStoreConfig,
        public gene: Gene,
        public samples: MobxPromise<SampleIdentifier[]>,
        public oncoKbCancerGenes: MobxPromise<CancerGene[] | Error>,
        // getMutationDataCache needs to be a getter for the following reason:
        // when the input parameters to the mutationDataCache change, the cache
        // is recomputed. Mobx needs to respond to this. But if we pass the mutationDataCache
        // in as a value, then when using it we don't access the observable property mutationDataCache,
        // so that when it changes we won't react. Thus we need to access it as store.mutationDataCache
        // (which will be done in the getter thats passed in here) so that the cache itself is observable
        // and we will react when it changes to a new object.
        getMutations: () => Mutation[],
        private getMutationCountCache: () => MutationCountCache,
        private getGenomeNexusCache: () => GenomeNexusCache,
        private getGenomeNexusMutationAssessorCache: () => GenomeNexusMutationAssessorCache,
        private getGenomeNexusMyVariantInfoCache: () => GenomeNexusMyVariantInfoCache,
        private getDiscreteCNACache: () => DiscreteCNACache,
        public studyToMolecularProfileDiscrete: {
            [studyId: string]: MolecularProfile;
        },
        public studyIdToStudy: MobxPromise<{ [studyId: string]: CancerStudy }>,
        public molecularProfileIdToMolecularProfile: MobxPromise<{
            [molecularProfileId: string]: MolecularProfile;
        }>,
        public clinicalDataForSamples: MobxPromise<ClinicalData[]>,
        public studiesForSamplesWithoutCancerTypeClinicalData: MobxPromise<
            CancerStudy[]
        >,
        public germlineConsentedSamples: MobxPromise<SampleIdentifier[]>,
        public indexedHotspotData: MobxPromise<IHotspotIndex | undefined>,
        public indexedVariantAnnotations: MobxPromise<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        public uniqueSampleKeyToTumorType: {
            [uniqueSampleKey: string]: string;
        }
    ) {
        super(
            mutationMapperConfig,
            mutationMapperStoreConfig,
            gene,
            getMutations,
            indexedHotspotData,
            indexedVariantAnnotations,
            oncoKbCancerGenes,
            uniqueSampleKeyToTumorType
        );

        labelMobxPromises(this);
    }

    readonly cosmicData = remoteData({
        await: () => [this.mutationData],
        invoke: () => fetchCosmicData(this.mutationData),
    });

    @cached get downloadDataFetcher(): MutationTableDownloadDataFetcher {
        return new MutationTableDownloadDataFetcher(
            this.mutationData,
            this.studyToMolecularProfileDiscrete,
            this.getGenomeNexusCache,
            this.getGenomeNexusMutationAssessorCache,
            this.getGenomeNexusMyVariantInfoCache,
            this.getMutationCountCache,
            this.getDiscreteCNACache
        );
    }
}
