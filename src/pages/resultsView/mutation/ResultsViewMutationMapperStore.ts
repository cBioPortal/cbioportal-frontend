import {IHotspotIndex} from "react-mutation-mapper";
import {
    Mutation, Gene, ClinicalData, CancerStudy, MolecularProfile, SampleIdentifier
} from "shared/api/generated/CBioPortalAPI";
import {remoteData} from "public-lib/api/remoteData";
import {labelMobxPromises, MobxPromise, cached} from "mobxpromise";
import {IOncoKbData} from "shared/model/OncoKB";
import {CancerGene} from "public-lib/api/generated/OncoKbAPI";
import {ICivicGene, ICivicVariant} from "shared/model/Civic";
import {
    fetchCosmicData, fetchCivicGenes, fetchCivicVariants
} from "shared/lib/StoreUtils";
import MutationCountCache from "shared/cache/MutationCountCache";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import GenomeNexusCache from "shared/cache/GenomeNexusCache";
import GenomeNexusMyVariantInfoCache from "shared/cache/GenomeNexusMyVariantInfoCache";
import {MutationTableDownloadDataFetcher} from "shared/lib/MutationTableDownloadDataFetcher";
import MutationMapperStore, {IMutationMapperStoreConfig} from "shared/components/mutationMapper/MutationMapperStore";
import { VariantAnnotation } from "public-lib/api/generated/GenomeNexusAPI";
import {IServerConfig} from "../../../config/IAppConfig";


export default class ResultsViewMutationMapperStore extends MutationMapperStore
{
    constructor(protected mutationMapperConfig: IServerConfig,
                protected mutationMapperStoreConfig: IMutationMapperStoreConfig,
                public gene:Gene,
                public samples:MobxPromise<SampleIdentifier[]>,
                public oncoKbCancerGenes:MobxPromise<CancerGene[] | Error>,
                // getMutationDataCache needs to be a getter for the following reason:
                // when the input parameters to the mutationDataCache change, the cache
                // is recomputed. Mobx needs to respond to this. But if we pass the mutationDataCache
                // in as a value, then when using it we don't access the observable property mutationDataCache,
                // so that when it changes we won't react. Thus we need to access it as store.mutationDataCache
                // (which will be done in the getter thats passed in here) so that the cache itself is observable
                // and we will react when it changes to a new object.
                getMutations:()=>Mutation[],
                private getMutationCountCache: ()=>MutationCountCache,
                private getGenomeNexusCache: ()=>GenomeNexusCache,
                private getGenomeNexusMyVariantInfoCache: ()=>GenomeNexusMyVariantInfoCache,
                private getDiscreteCNACache: ()=>DiscreteCNACache,
                public studyToMolecularProfileDiscrete: {[studyId:string]:MolecularProfile},
                public studyIdToStudy:MobxPromise<{[studyId:string]:CancerStudy}>,
                public molecularProfileIdToMolecularProfile:MobxPromise<{[molecularProfileId:string]:MolecularProfile}>,
                public clinicalDataForSamples: MobxPromise<ClinicalData[]>,
                public studiesForSamplesWithoutCancerTypeClinicalData: MobxPromise<CancerStudy[]>,
                public germlineConsentedSamples:MobxPromise<SampleIdentifier[]>,
                public indexedHotspotData:MobxPromise<IHotspotIndex|undefined>,
                public indexedVariantAnnotations:MobxPromise<{[genomicLocation: string]: VariantAnnotation}|undefined>,
                public uniqueSampleKeyToTumorType:{[uniqueSampleKey:string]:string},
                public oncoKbData:MobxPromise<IOncoKbData | Error>)
    {
        super(
            mutationMapperConfig,
            mutationMapperStoreConfig,
            gene,
            getMutations,
            indexedHotspotData,
            indexedVariantAnnotations,
            oncoKbCancerGenes,
            oncoKbData,
            uniqueSampleKeyToTumorType
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
        invoke: async() => this.mutationMapperConfig.show_civic ? fetchCivicGenes(this.mutationData) : {},
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
            if (this.mutationMapperConfig.show_civic && this.civicGenes.result) {
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
        return new MutationTableDownloadDataFetcher(this.mutationData, this.studyToMolecularProfileDiscrete, this.getGenomeNexusCache, this.getGenomeNexusMyVariantInfoCache, this.getMutationCountCache, this.getDiscreteCNACache);
    }

    
}
