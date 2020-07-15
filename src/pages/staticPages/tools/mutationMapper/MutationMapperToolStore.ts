import { action, computed, observable } from 'mobx';
import * as _ from 'lodash';
import { cached } from 'mobxpromise';
import {
    annotateMutations,
    getMyVariantInfoAnnotationsFromIndexedVariantAnnotations,
    IHotspotIndex,
    indexHotspotsData,
    IMyVariantInfoIndex,
    resolveDefaultsForMissingValues,
} from 'cbioportal-utils';

import AppConfig from 'appConfig';

import { remoteData } from 'cbioportal-frontend-commons';
import {
    EnsemblTranscript,
    VariantAnnotation,
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
} from 'genome-nexus-ts-api-client';
import { CancerGene } from 'oncokb-ts-api-client';
import { ClinicalData, Gene, Mutation } from 'cbioportal-ts-api-client';

import {
    fetchGenes,
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
import PdbHeaderCache from 'shared/cache/PdbHeaderCache';
import MutationMapperStore from 'shared/components/mutationMapper/MutationMapperStore';
import { MutationTableDownloadDataFetcher } from 'shared/lib/MutationTableDownloadDataFetcher';
import {
    normalizeMutations,
    createVariantAnnotationsByMutationFetcher,
} from '../../../../shared/components/mutationMapper/MutationMapperUtils';
import defaultGenomeNexusClient from 'shared/api/genomeNexusClientInstance';
import defaultGenomeNexusInternalClient from 'shared/api/genomeNexusInternalClientInstance';
import autobind from 'autobind-decorator';
import { getGenomeNexusHgvsgUrl } from 'shared/api/urls';

export default class MutationMapperToolStore {
    @observable mutationData: Partial<MutationInput>[] | undefined;
    @observable criticalErrors: Error[] = [];
    // if we use grch37(default), grch38GenomeNexusUrl will be undefined
    @observable grch38GenomeNexusUrl: string | undefined = undefined;

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
                        this.isoformOverrideSource,
                        this.genomeNexusClient
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

    @computed get genomeNexusClient() {
        return this.grch38GenomeNexusUrl
            ? new GenomeNexusAPI(this.grch38GenomeNexusUrl)
            : defaultGenomeNexusClient;
    }

    @computed get genomeNexusInternalClient() {
        return this.grch38GenomeNexusUrl
            ? new GenomeNexusAPIInternal(this.grch38GenomeNexusUrl)
            : defaultGenomeNexusInternalClient;
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
                    AppConfig.serverConfig.isoformOverrideSource,
                    this.genomeNexusClient
                ),
            onError: (err: Error) => {
                this.criticalErrors.push(err);
            },
        },
        undefined
    );

    readonly indexedMyVariantInfoAnnotations = remoteData<
        IMyVariantInfoIndex | undefined
    >(
        {
            invoke: async () => {
                const indexedVariantAnnotations = await fetchVariantAnnotationsIndexedByGenomicLocation(
                    this.rawMutations,
                    ['my_variant_info'],
                    AppConfig.serverConfig.isoformOverrideSource,
                    this.genomeNexusClient
                );

                return getMyVariantInfoAnnotationsFromIndexedVariantAnnotations(
                    indexedVariantAnnotations
                );
            },
            onError: (err: Error) => {
                this.criticalErrors.push(err);
            },
        },
        undefined
    );

    readonly hotspotData = remoteData({
        await: () => [this.mutations],
        invoke: () => {
            return fetchHotspotsData(
                this.mutations,
                undefined,
                this.genomeNexusInternalClient
            );
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
                                    this.uniqueSampleKeyToTumorType.result ||
                                        {},
                                    this.genomeNexusClient,
                                    this.genomeNexusInternalClient
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

    public setGenomeNexusUrl(grch38GenomeNexusUrl: string | undefined) {
        this.grch38GenomeNexusUrl = grch38GenomeNexusUrl;
    }

    @autobind
    generateGenomeNexusHgvsgUrl(hgvsg: string) {
        return getGenomeNexusHgvsgUrl(hgvsg, this.grch38GenomeNexusUrl);
    }

    @cached get pubMedCache() {
        return new PubMedCache();
    }

    @cached get genomeNexusCache() {
        return new GenomeNexusCache(
            createVariantAnnotationsByMutationFetcher(
                ['annotation_summary'],
                this.genomeNexusClient
            )
        );
    }

    @cached get genomeNexusMutationAssessorCache() {
        return new GenomeNexusMutationAssessorCache(
            createVariantAnnotationsByMutationFetcher(
                ['annotation_summary', 'mutation_assessor'],
                this.genomeNexusClient
            )
        );
    }

    @cached get pdbHeaderCache() {
        return new PdbHeaderCache();
    }

    @cached get downloadDataFetcher() {
        return new MutationTableDownloadDataFetcher(
            this.mutations,
            undefined,
            () => this.genomeNexusCache,
            () => this.genomeNexusMutationAssessorCache
        );
    }

    @action public clearCriticalErrors() {
        this.criticalErrors = [];
    }
}
