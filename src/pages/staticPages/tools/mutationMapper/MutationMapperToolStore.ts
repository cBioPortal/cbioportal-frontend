import { action, computed, observable } from 'mobx';
import * as _ from 'lodash';
import { cached } from 'mobxpromise';
import {
    annotateMutations,
    IHotspotIndex,
    indexHotspotsData,
    resolveDefaultsForMissingValues,
} from 'react-mutation-mapper';

import AppConfig from 'appConfig';

import { CancerGene, remoteData } from 'cbioportal-frontend-commons';
import {
    EnsemblTranscript,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';
import {
    ClinicalData,
    Gene,
    Mutation,
} from 'shared/api/generated/CBioPortalAPI';
import {
    fetchGenes,
    fetchOncoKbData,
    ONCOKB_DEFAULT,
    getCanonicalTranscriptsByHugoSymbol,
    fetchOncoKbCancerGenes,
    fetchVariantAnnotationsIndexedByGenomicLocation,
} from 'shared/lib/StoreUtils';
import {
    getClinicalData,
    getGeneList,
    mutationInputToMutation,
    MutationInput,
} from 'shared/lib/MutationInputParser';
import { updateMissingGeneInfo } from 'shared/lib/MutationUtils';
import { fetchHotspotsData } from 'shared/lib/CancerHotspotsUtils';
import PubMedCache from 'shared/cache/PubMedCache';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import GenomeNexusMyVariantInfoCache from 'shared/cache/GenomeNexusMyVariantInfoCache';
import PdbHeaderCache from 'shared/cache/PdbHeaderCache';
import MutationMapperStore from 'shared/components/mutationMapper/MutationMapperStore';
import { MutationTableDownloadDataFetcher } from 'shared/lib/MutationTableDownloadDataFetcher';
import { normalizeMutations } from '../../../../shared/components/mutationMapper/MutationMapperUtils';
import { IOncoKbData } from 'cbioportal-frontend-commons';

export default class MutationMapperToolStore {
    @observable mutationData: Partial<MutationInput>[] | undefined;
    @observable criticalErrors: Error[] = [];

    readonly genes = remoteData<Gene[]>(
        {
            await: () => [this.hugoGeneSymbols],
            invoke: () => fetchGenes(this.hugoGeneSymbols.result),
        },
        []
    );

    readonly canonicalTranscriptsByHugoSymbol = remoteData<
        { [hugoGeneSymbol: string]: EnsemblTranscript } | undefined
    >(
        {
            await: () => [this.hugoGeneSymbols],
            invoke: async () => {
                if (this.hugoGeneSymbols.result) {
                    return getCanonicalTranscriptsByHugoSymbol(
                        this.hugoGeneSymbols.result,
                        this.isoformOverrideSource
                    );
                } else {
                    return undefined;
                }
            },
            onError: (err: Error) => {
                throw new Error('Failed to get canonical transcript');
            },
        },
        undefined
    );

    @computed get isoformOverrideSource(): string {
        return AppConfig.serverConfig.isoformOverrideSource;
    }

    readonly hugoGeneSymbols = remoteData(
        {
            await: () => [this.indexedVariantAnnotations],
            invoke: () => Promise.resolve(getGeneList(this.annotatedMutations)),
        },
        []
    );

    readonly oncoKbCancerGenes = remoteData(
        {
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return fetchOncoKbCancerGenes();
                } else {
                    return Promise.resolve([]);
                }
            },
        },
        []
    );

    readonly oncoKbAnnotatedGenes = remoteData(
        {
            await: () => [this.oncoKbCancerGenes],
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return Promise.resolve(
                        _.reduce(
                            this.oncoKbCancerGenes.result,
                            (
                                map: { [entrezGeneId: number]: boolean },
                                next: CancerGene
                            ) => {
                                if (next.oncokbAnnotated) {
                                    map[next.entrezGeneId] = true;
                                }
                                return map;
                            },
                            {}
                        )
                    );
                } else {
                    return Promise.resolve({});
                }
            },
        },
        {}
    );

    readonly uniqueSampleKeyToTumorType = remoteData<{
        [uniqueSampleKey: string]: string;
    }>({
        await: () => [this.mutations, this.clinicalDataForSamples],
        invoke: () => {
            const map: { [uniqueSampleKey: string]: string } = {};

            if (this.mutations.result) {
                this.mutations.result.forEach(mutation => {
                    const cancerTypeClinicalData:
                        | ClinicalData
                        | undefined = _.find(
                        this.clinicalDataByUniqueSampleKey[
                            mutation.uniqueSampleKey
                        ],
                        { clinicalAttributeId: 'CANCER_TYPE' }
                    );
                    map[mutation.uniqueSampleKey] = cancerTypeClinicalData
                        ? cancerTypeClinicalData.value
                        : 'Unknown';
                });
            }

            return Promise.resolve(map);
        },
    });

    readonly clinicalDataForSamples = remoteData<ClinicalData[]>(
        {
            await: () => [this.mutations],
            invoke: () => Promise.resolve(getClinicalData(this.mutationData)),
        },
        []
    );

    readonly mutations = remoteData<Mutation[]>(
        {
            await: () => [this.indexedVariantAnnotations, this.genes],
            invoke: () => {
                let mutations: Partial<Mutation>[] = [];

                if (this.annotatedMutations) {
                    mutations = normalizeMutations(this
                        .annotatedMutations as Pick<
                        Mutation,
                        'chr'
                    >[]) as Partial<Mutation>[];
                    resolveDefaultsForMissingValues(mutations);
                    updateMissingGeneInfo(mutations, this.genesByHugoSymbol);
                }

                return Promise.resolve(mutations as Mutation[]);
            },
        },
        []
    );

    readonly indexedVariantAnnotations = remoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >(
        {
            invoke: async () =>
                await fetchVariantAnnotationsIndexedByGenomicLocation(
                    this.rawMutations,
                    ['annotation_summary', 'hotspots'],
                    AppConfig.serverConfig.isoformOverrideSource
                ),
            onError: (err: Error) => {
                this.criticalErrors.push(err);
            },
        },
        undefined
    );

    readonly hotspotData = remoteData({
        await: () => [this.mutations],
        invoke: () => {
            return fetchHotspotsData(this.mutations);
        },
    });

    readonly indexedHotspotData = remoteData<IHotspotIndex | undefined>({
        await: () => [this.hotspotData],
        invoke: () => Promise.resolve(indexHotspotsData(this.hotspotData)),
    });

    readonly mutationMapperStores = remoteData<{
        [hugoGeneSymbol: string]: MutationMapperStore;
    }>(
        {
            await: () => [
                this.genes,
                this.mutations,
                this.uniqueSampleKeyToTumorType,
                this.indexedVariantAnnotations,
                this.canonicalTranscriptsByHugoSymbol,
            ],
            invoke: () => {
                if (this.genes.result) {
                    // we have to use _.reduce, otherwise this.genes.result (Immutable, due to remoteData) will return
                    //  an Immutable as the result of reduce, and MutationMapperStore when it is made immutable all the
                    //  mobx machinery going on in the readonly remoteDatas and observables somehow gets messed up.
                    return Promise.resolve(
                        _.reduce(
                            this.genes.result,
                            (
                                map: {
                                    [hugoGeneSymbol: string]: MutationMapperStore;
                                },
                                gene: Gene
                            ) => {
                                const getMutations = () => {
                                    return this.mutationsByGene[
                                        gene.hugoGeneSymbol
                                    ];
                                };
                                map[
                                    gene.hugoGeneSymbol
                                ] = new MutationMapperStore(
                                    AppConfig.serverConfig,
                                    {
                                        filterMutationsBySelectedTranscript: !this
                                            .hasInputWithProteinChanges,
                                    },
                                    gene,
                                    getMutations,
                                    this.indexedHotspotData,
                                    this.indexedVariantAnnotations,
                                    this.oncoKbCancerGenes,
                                    this.uniqueSampleKeyToTumorType.result || {}
                                );
                                return map;
                            },
                            {}
                        )
                    );
                } else {
                    return Promise.resolve({});
                }
            },
        },
        {}
    );

    public getMutationMapperStore(
        hugoGeneSymbol: string
    ): MutationMapperStore | undefined {
        return this.mutationMapperStores.result[hugoGeneSymbol];
    }

    @computed get hasInputWithProteinChanges(): boolean {
        return _.some(
            this.mutationData,
            m => m.proteinChange && m.proteinChange.length > 0
        );
    }

    @computed get rawMutations(): Mutation[] {
        return (mutationInputToMutation(this.mutationData) as Mutation[]) || [];
    }

    @computed get annotatedMutations(): Partial<Mutation>[] {
        return this.indexedVariantAnnotations.result
            ? (annotateMutations(
                  normalizeMutations(this.rawMutations),
                  this.indexedVariantAnnotations.result
              ) as Partial<Mutation>[])
            : [];
    }
    @computed get mutationsNotAnnotated(): {
        lineNumber: number;
        mutationInput: Partial<MutationInput>;
    }[] {
        return _.compact(
            this.mutations.result.map((mutation: Mutation, index: number) => {
                if (
                    !mutation ||
                    !mutation.gene ||
                    !mutation.gene.hugoGeneSymbol
                ) {
                    return (
                        this.mutationData && {
                            lineNumber: index + 2,
                            mutationInput: this.mutationData[index],
                        }
                    );
                } else {
                    return null;
                }
            })
        );
    }
    @computed get mutationsByGene(): { [hugoGeneSymbol: string]: Mutation[] } {
        return _.groupBy(
            this.mutations.result,
            (mutation: Mutation) => mutation.gene.hugoGeneSymbol
        );
    }

    @computed get genesByHugoSymbol(): { [hugoGeneSymbol: string]: Gene } {
        return _.keyBy(this.genes.result, (gene: Gene) => gene.hugoGeneSymbol);
    }

    @computed get clinicalDataByUniqueSampleKey(): {
        [uniqueSampleKey: string]: ClinicalData[];
    } {
        return _.groupBy(
            this.clinicalDataForSamples.result,
            (clinicalData: ClinicalData) => clinicalData.uniqueSampleKey
        );
    }

    @cached get pubMedCache() {
        return new PubMedCache();
    }

    @cached get genomeNexusCache() {
        return new GenomeNexusCache();
    }

    @cached get genomeNexusMutationAssessorCache() {
        return new GenomeNexusMutationAssessorCache();
    }

    @cached get genomeNexusMyVariantInfoCache() {
        return new GenomeNexusMyVariantInfoCache();
    }

    @cached get pdbHeaderCache() {
        return new PdbHeaderCache();
    }

    @cached get downloadDataFetcher() {
        return new MutationTableDownloadDataFetcher(
            this.mutations,
            undefined,
            () => this.genomeNexusCache,
            () => this.genomeNexusMutationAssessorCache,
            () => this.genomeNexusMyVariantInfoCache
        );
    }

    @action public clearCriticalErrors() {
        this.criticalErrors = [];
    }
}
