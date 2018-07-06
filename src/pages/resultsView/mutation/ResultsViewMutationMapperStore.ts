import {
    Mutation, Gene, ClinicalData, CancerStudy, MolecularProfile, SampleIdentifier
} from "shared/api/generated/CBioPortalAPI";
import {remoteData} from "shared/api/remoteData";
import {labelMobxPromises, MobxPromise, cached} from "mobxpromise";
import {IOncoKbDataWrapper} from "shared/model/OncoKB";
import {IHotspotIndex} from "shared/model/CancerHotspots";
import {ICivicGene, ICivicVariant} from "shared/model/Civic";
import {
    fetchCosmicData, fetchCivicGenes, fetchCivicVariants
} from "shared/lib/StoreUtils";
import {IMutationMapperConfig} from "shared/components/mutationMapper/MutationMapper";
import GenomeNexusEnrichmentCache from "shared/cache/GenomeNexusEnrichment";
import MutationCountCache from "shared/cache/MutationCountCache";
import {MutationTableDownloadDataFetcher} from "shared/lib/MutationTableDownloadDataFetcher";
import MutationMapperStore from "shared/components/mutationMapper/MutationMapperStore";

export default class ResultsViewMutationMapperStore extends MutationMapperStore
{
    constructor(protected config: IMutationMapperConfig,
                public gene:Gene,
                public samples:MobxPromise<SampleIdentifier[]>,
                public oncoKbAnnotatedGenes:{[entrezGeneId:number]:boolean},
                // getMutationDataCache needs to be a getter for the following reason:
                // when the input parameters to the mutationDataCache change, the cache
                // is recomputed. Mobx needs to respond to this. But if we pass the mutationDataCache
                // in as a value, then when using it we don't access the observable property mutationDataCache,
                // so that when it changes we won't react. Thus we need to access it as store.mutationDataCache
                // (which will be done in the getter thats passed in here) so that the cache itself is observable
                // and we will react when it changes to a new object.
                public mutations:Mutation[],
                protected genomeNexusEnrichmentCache: ()=>GenomeNexusEnrichmentCache,
                private getMutationCountCache: ()=>MutationCountCache,
                public studyIdToStudy:MobxPromise<{[studyId:string]:CancerStudy}>,
                public molecularProfileIdToMolecularProfile:MobxPromise<{[molecularProfileId:string]:MolecularProfile}>,
                public clinicalDataForSamples: MobxPromise<ClinicalData[]>,
                public studiesForSamplesWithoutCancerTypeClinicalData: MobxPromise<CancerStudy[]>,
                public germlineConsentedSamples:MobxPromise<SampleIdentifier[]>,
                public indexedHotspotData:MobxPromise<IHotspotIndex|undefined>,
                public uniqueSampleKeyToTumorType:{[uniqueSampleKey:string]:string},
                public oncoKbData:IOncoKbDataWrapper)
    {
        super(
            config,
            gene,
            mutations,
            indexedHotspotData,
            oncoKbAnnotatedGenes,
            oncoKbData,
            uniqueSampleKeyToTumorType,
            genomeNexusEnrichmentCache,
        );

        labelMobxPromises(this);
    }

    readonly cosmicData = remoteData({
        await: () => [
            this.mutationData
        ],
        invoke: () => fetchCosmicData(this.mutationData)
    });

    readonly civicGenes = remoteData<ICivicGene | undefined>({
        await: () => [
            this.mutationData,
            this.clinicalDataForSamples
        ],
        invoke: async() => this.config.showCivic ? fetchCivicGenes(this.mutationData) : {},
        onError: (err: Error) => {
            // fail silently
        }
    }, undefined);

    readonly civicVariants = remoteData<ICivicVariant | undefined>({
        await: () => [
            this.civicGenes,
            this.mutationData
        ],
        invoke: async() => {
            if (this.config.showCivic && this.civicGenes.result) {
                return fetchCivicVariants(this.civicGenes.result as ICivicGene, this.mutationData);
            }
            else {
                return {};
            }
        },
        onError: (err: Error) => {
            // fail silently
        }
    }, undefined);

    @cached get downloadDataFetcher(): MutationTableDownloadDataFetcher {
        return new MutationTableDownloadDataFetcher(this.mutationData, this.genomeNexusEnrichmentCache, this.getMutationCountCache);
    }
}
