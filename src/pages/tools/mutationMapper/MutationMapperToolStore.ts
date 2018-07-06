import {action, computed, observable} from "mobx";
import * as _ from "lodash";
import {cached} from "mobxpromise";

import AppConfig from "appConfig";

import {remoteData} from "shared/api/remoteData";
import {ClinicalData, Gene, Mutation} from "shared/api/generated/CBioPortalAPI";
import {
    fetchGenes, fetchMyCancerGenomeData, fetchOncoKbAnnotatedGenes, fetchOncoKbData,
    ONCOKB_DEFAULT
} from "shared/lib/StoreUtils";
import {annotateMutations, resolveDefaultsForMissingValues} from "shared/lib/MutationAnnotator";
import {getClinicalData, getGeneList, mutationInputToMutation, MutationInput} from "shared/lib/MutationInputParser";
import {updateMissingGeneInfo} from "shared/lib/MutationUtils";
import {IOncoKbData} from "shared/model/OncoKB";
import {fetchHotspotsData, indexHotspotsData} from "shared/lib/CancerHotspotsUtils";
import {IHotspotIndex} from "shared/model/CancerHotspots";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import GenomeNexusEnrichmentCache from "shared/cache/GenomeNexusEnrichment";
import PdbHeaderCache from "shared/cache/PdbHeaderCache";
import MutationMapperStore from "shared/components/mutationMapper/MutationMapperStore";

export default class MutationMapperToolStore
{
    @observable mutationData: Partial<MutationInput>[]|undefined;
    @observable criticalErrors: Error[] = [];

    readonly genes = remoteData<Gene[]>({
        await: () => [
            this.hugoGeneSymbols
        ],
        invoke: () => fetchGenes(this.hugoGeneSymbols.result)
    }, []);

    readonly hugoGeneSymbols = remoteData({
        await: () => [
            this.annotatedMutations
        ],
        invoke: () => Promise.resolve(getGeneList(this.annotatedMutations.result))
    }, []);

    readonly oncoKbAnnotatedGenes = remoteData({
        invoke:()=>fetchOncoKbAnnotatedGenes(),
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, {});

    readonly oncoKbData = remoteData<IOncoKbData|Error>({
        await: () => [
            this.mutations,
            this.oncoKbAnnotatedGenes,
            this.uniqueSampleKeyToTumorType
        ],
        invoke: () => fetchOncoKbData(this.uniqueSampleKeyToTumorType.result!, this.oncoKbAnnotatedGenes.result!, this.mutations),
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, ONCOKB_DEFAULT);

    readonly uniqueSampleKeyToTumorType = remoteData<{[uniqueSampleKey: string]: string}>({
        await:()=>[
            this.mutations,
            this.clinicalDataForSamples
        ],
        invoke: () => {
            const map: {[uniqueSampleKey: string]: string} = {};

            if (this.mutations.result) {
                this.mutations.result.forEach(mutation => {
                    const cancerTypeClinicalData: ClinicalData|undefined = _.find(
                        this.clinicalDataByUniqueSampleKey[mutation.uniqueSampleKey],
                        {clinicalAttributeId: "CANCER_TYPE"});
                    map[mutation.uniqueSampleKey] = cancerTypeClinicalData ? cancerTypeClinicalData.value : "Unknown";
                });
            }

            return Promise.resolve(map);
        }
    });

    readonly clinicalDataForSamples = remoteData<ClinicalData[]>({
        await: () => [
            this.mutations
        ],
        invoke: () => Promise.resolve(getClinicalData(this.mutationData))
    }, []);

    readonly mutations = remoteData<Mutation[]>({
        await: () => [
            this.annotatedMutations,
            this.genes
        ],
        invoke: () => {
            let mutations: Mutation[] = [];

            if (this.annotatedMutations.result) {
                mutations =  this.annotatedMutations.result;
                resolveDefaultsForMissingValues(mutations);
                updateMissingGeneInfo(mutations, this.genesByHugoSymbol);
            }

            return Promise.resolve(mutations);
        }
    }, []);

    readonly annotatedMutations = remoteData<Mutation[]>({
        invoke: async () => await annotateMutations(this.rawMutations),
        onError: (err: Error) => {
            this.criticalErrors.push(err);
        }
    }, []);

    readonly hotspotData = remoteData({
        await:()=>[
            this.mutations
        ],
        invoke:() => {
            return fetchHotspotsData(this.mutations);
        }
    });

    readonly indexedHotspotData = remoteData<IHotspotIndex |undefined>({
        await:() => [
            this.hotspotData
        ],
        invoke:() => Promise.resolve(indexHotspotsData(this.hotspotData))
    });

    readonly mutationMapperStores = remoteData<{ [hugoGeneSymbol: string]: MutationMapperStore }>({
        await: () => [
            this.genes,
            this.mutations,
            this.uniqueSampleKeyToTumorType
        ],
        invoke: () => {
            if (this.genes.result) {
                // we have to use _.reduce, otherwise this.genes.result (Immutable, due to remoteData) will return
                //  an Immutable as the result of reduce, and MutationMapperStore when it is made immutable all the
                //  mobx machinery going on in the readonly remoteDatas and observables somehow gets messed up.
                return Promise.resolve(_.reduce(this.genes.result, (map: { [hugoGeneSymbol: string]: MutationMapperStore }, gene: Gene) => {
                    map[gene.hugoGeneSymbol] = new MutationMapperStore(AppConfig,
                        gene,
                        this.mutationsByGene[gene.hugoGeneSymbol],
                        this.indexedHotspotData,
                        this.oncoKbAnnotatedGenes.result || {},
                        this.oncoKbData,
                        this.uniqueSampleKeyToTumorType.result || {},
                        () => (this.genomeNexusEnrichmentCache),
                    );
                    return map;
                }, {}));
            } else {
                return Promise.resolve({});
            }
        }
    }, {});

    public getMutationMapperStore(hugoGeneSymbol: string): MutationMapperStore | undefined {
        return this.mutationMapperStores.result[hugoGeneSymbol];
    }

    @computed get rawMutations(): Mutation[]
    {
        return mutationInputToMutation(this.mutationData) as Mutation[] || [];
    }

    @computed get mutationsByGene(): {[hugoGeneSymbol:string]: Mutation[]} {
        return _.groupBy(this.mutations.result,(mutation: Mutation) => mutation.gene.hugoGeneSymbol);
    }

    @computed get genesByHugoSymbol(): {[hugoGeneSymbol:string]: Gene} {
        return _.keyBy(this.genes.result,(gene: Gene) => gene.hugoGeneSymbol);
    }

    @computed get clinicalDataByUniqueSampleKey(): {[uniqueSampleKey: string]: ClinicalData[]} {
        return _.groupBy(this.clinicalDataForSamples.result,(clinicalData: ClinicalData) => clinicalData.uniqueSampleKey);
    }

    @cached get oncoKbEvidenceCache() {
        return new OncoKbEvidenceCache();
    }

    @cached get pubMedCache() {
        return new PubMedCache();
    }

    @cached get genomeNexusEnrichmentCache() {
        return new GenomeNexusEnrichmentCache();
    }

    @cached get pdbHeaderCache() {
        return new PdbHeaderCache();
    }

    @computed get myCancerGenomeData() {
        return fetchMyCancerGenomeData();
    }

    @action public clearCriticalErrors() {
        this.criticalErrors = [];
    }
}