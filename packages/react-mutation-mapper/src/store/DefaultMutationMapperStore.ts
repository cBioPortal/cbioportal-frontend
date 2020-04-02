import autobind from 'autobind-decorator';
import { IOncoKbData, remoteData } from 'cbioportal-frontend-commons';
import { CancerGene, IndicatorQueryResp } from 'oncokb-ts-api-client';
import {
    EnsemblTranscript,
    MyVariantInfo,
    PfamDomain,
    PfamDomainRange,
    PostTranslationalModification,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import { computed, observable } from 'mobx';
import MobxPromise, { cached } from 'mobxpromise';

import {
    AggregatedHotspots,
    GenomicLocation,
    Hotspot,
    IHotspotIndex,
} from '../model/CancerHotspot';
import { ICivicGene, ICivicVariant } from '../model/Civic';
import { DataFilter, DataFilterType } from '../model/DataFilter';
import DataStore from '../model/DataStore';
import { ApplyFilterFn, FilterApplier } from '../model/FilterApplier';
import { Gene } from '../model/Gene';
import { Mutation } from '../model/Mutation';
import { MutationMapperDataFetcher } from '../model/MutationMapperDataFetcher';
import { MutationMapperStore } from '../model/MutationMapperStore';
import { IMyCancerGenomeData } from '../model/MyCancerGenome';
import {
    defaultHotspotFilter,
    groupCancerHotspotDataByPosition,
    groupHotspotsByMutations,
    indexHotspotsData,
} from '../util/CancerHotspotsUtils';
import { fetchCivicGenes, fetchCivicVariants } from '../util/CivicUtils';
import { ONCOKB_DEFAULT_DATA } from '../util/DataFetcherUtils';
import {
    applyDataFilters,
    groupDataByProteinImpactType,
} from '../util/FilterUtils';
import { getMutationsToTranscriptId } from '../util/MutationAnnotator';
import {
    genomicLocationString,
    groupMutationsByProteinStartPos,
    uniqueGenomicLocations,
} from '../util/MutationUtils';
import { getMyCancerGenomeData } from '../util/MyCancerGenomeUtils';
import {
    defaultOncoKbIndicatorFilter,
    groupOncoKbIndicatorDataByMutations,
} from '../util/OncoKbUtils';
import {
    groupPtmDataByPosition,
    groupPtmDataByTypeAndPosition,
} from '../util/PtmUtils';
import { DefaultMutationMapperDataStore } from './DefaultMutationMapperDataStore';
import { DefaultMutationMapperDataFetcher } from './DefaultMutationMapperDataFetcher';
import { DefaultMutationMapperFilterApplier } from './DefaultMutationMapperFilterApplier';

interface DefaultMutationMapperStoreConfig {
    annotationFields?: string[];
    isoformOverrideSource?: string;
    filterMutationsBySelectedTranscript?: boolean;
    genomeNexusUrl?: string;
    oncoKbUrl?: string;
    enableCivic?: boolean;
    enableOncoKb?: boolean;
    cachePostMethodsOnClients?: boolean;
    apiCacheLimit?: number;
    getMutationCount?: (mutation: Partial<Mutation>) => number;
    getTumorType?: (mutation: Partial<Mutation>) => string;
    filterApplier?: FilterApplier;
    filterAppliersOverride?: {
        [filterType: string]: ApplyFilterFn;
    };
    dataFetcher?: MutationMapperDataFetcher;
    dataFilters?: DataFilter[];
    selectionFilters?: DataFilter[];
    highlightFilters?: DataFilter[];
    groupFilters?: { group: string; filter: DataFilter }[];
}

class DefaultMutationMapperStore implements MutationMapperStore {
    @observable
    private _activeTranscript: string | undefined = undefined;

    constructor(
        public gene: Gene,
        protected config: DefaultMutationMapperStoreConfig,
        protected getMutations: () => Mutation[]
    ) {}

    @computed
    public get activeTranscript(): string | undefined {
        let activeTranscript;
        const canonicalTranscriptId =
            !this.canonicalTranscript.isPending &&
            this.canonicalTranscript.result
                ? this.canonicalTranscript.result.transcriptId
                : undefined;

        if (this._activeTranscript !== undefined) {
            activeTranscript = this._activeTranscript;
        } else if (this.config.filterMutationsBySelectedTranscript) {
            if (
                this.transcriptsWithAnnotations.result &&
                this.transcriptsWithAnnotations.result.length > 0 &&
                canonicalTranscriptId &&
                !this.transcriptsWithAnnotations.result.includes(
                    canonicalTranscriptId
                )
            ) {
                // if there are annotated transcripts and activeTranscript does
                // not have any, change the active transcript
                activeTranscript = this.transcriptsWithAnnotations.result[0];
            } else {
                activeTranscript = canonicalTranscriptId;
            }
        } else {
            activeTranscript = canonicalTranscriptId;
        }

        // TODO this.activeTranscript = activeTranscript?
        return activeTranscript;
    }

    public set activeTranscript(transcript: string | undefined) {
        this._activeTranscript = transcript;
    }

    @computed
    public get isoformOverrideSource(): string {
        return this.config.isoformOverrideSource || 'uniprot';
    }

    @computed
    public get annotationFields(): string[] {
        return _.uniq(
            ['annotation_summary', 'hotspots'].concat(
                this.config.annotationFields || []
            )
        );
    }

    @cached
    public get dataStore(): DataStore {
        return new DefaultMutationMapperDataStore(
            this.mutations,
            this.filterApplier,
            this.config.dataFilters,
            this.config.selectionFilters,
            this.config.highlightFilters,
            this.config.groupFilters
        );
    }

    public readonly myCancerGenomeData: IMyCancerGenomeData = getMyCancerGenomeData();

    @computed
    public get mutations(): Mutation[] {
        if (
            this.canonicalTranscript.isPending ||
            (this.config.filterMutationsBySelectedTranscript &&
                (this.transcriptsWithAnnotations.isPending ||
                    this.indexedVariantAnnotations.isPending))
        ) {
            return [];
        } else if (
            this.config.filterMutationsBySelectedTranscript &&
            this.activeTranscript &&
            this.indexedVariantAnnotations.result &&
            !_.isEmpty(this.indexedVariantAnnotations.result)
        ) {
            return getMutationsToTranscriptId(
                this.getMutations(),
                this.activeTranscript,
                this.indexedVariantAnnotations.result
            );
        } else {
            return this.getMutations();
        }
    }

    @computed
    public get filterApplier() {
        return (
            this.config.filterApplier ||
            new DefaultMutationMapperFilterApplier(
                this.indexedHotspotData,
                this.oncoKbData,
                this.getDefaultTumorType,
                this.getDefaultEntrezGeneId,
                this.config.filterAppliersOverride
            )
        );
    }

    @computed
    public get dataFetcher(): MutationMapperDataFetcher {
        return (
            this.config.dataFetcher ||
            new DefaultMutationMapperDataFetcher({
                genomeNexusUrl: this.config.genomeNexusUrl,
                oncoKbUrl: this.config.oncoKbUrl,
                cachePostMethodsOnClients: this.config
                    .cachePostMethodsOnClients,
                apiCacheLimit: this.config.apiCacheLimit,
            })
        );
    }

    @computed
    public get mutationsByPosition(): { [pos: number]: Mutation[] } {
        return groupMutationsByProteinStartPos(
            _.flatten(this.dataStore.sortedFilteredData)
        );
    }

    @computed
    public get groupedMutationsByPosition(): {
        group: string;
        mutations: { [pos: number]: Mutation[] };
    }[] {
        return this.dataStore.sortedFilteredGroupedData.map(groupedData => ({
            group: groupedData.group,
            mutations: groupMutationsByProteinStartPos(
                _.flatten(groupedData.data)
            ),
        }));
    }

    @computed
    protected get mutationsGroupedByProteinImpactType() {
        const filtersWithoutProteinImpactTypeFilter = this.dataStore.dataFilters.filter(
            f => f.type !== DataFilterType.PROTEIN_IMPACT_TYPE
        );

        // apply filters excluding the protein impact type filters
        // this prevents number of unchecked protein impact types from being counted as zero
        const sortedFilteredData = applyDataFilters(
            this.dataStore.allData,
            filtersWithoutProteinImpactTypeFilter,
            this.dataStore.applyFilter
        );

        return groupDataByProteinImpactType(sortedFilteredData);
    }

    @computed
    public get mutationCountsByProteinImpactType(): {
        [proteinImpactType: string]: number;
    } {
        const map: { [proteinImpactType: string]: number } = {};

        Object.keys(this.mutationsGroupedByProteinImpactType).forEach(
            proteinImpactType => {
                const g = this.mutationsGroupedByProteinImpactType[
                    proteinImpactType
                ];
                map[g.group] = g.data.length;
            }
        );

        return map;
    }

    @computed
    public get uniqueMutationCountsByPosition(): { [pos: number]: number } {
        return this.countUniqueMutationsByPosition(this.mutationsByPosition);
    }

    @computed
    public get uniqueGroupedMutationCountsByPosition(): {
        group: string;
        counts: { [pos: number]: number };
    }[] {
        return this.groupedMutationsByPosition.map(groupedMutations => ({
            group: groupedMutations.group,
            counts: this.countUniqueMutationsByPosition(
                groupedMutations.mutations
            ),
        }));
    }

    @computed
    public get transcriptsByTranscriptId(): {
        [transcriptId: string]: EnsemblTranscript;
    } {
        return _.keyBy(
            this.allTranscripts.result,
            (transcript: EnsemblTranscript) => transcript.transcriptId
        );
    }

    public countUniqueMutationsByPosition(mutationsByPosition: {
        [pos: number]: Mutation[];
    }): { [pos: number]: number } {
        const map: { [pos: number]: number } = {};

        Object.keys(mutationsByPosition).forEach(pos => {
            const position = parseInt(pos, 10);
            // for each position multiple mutations for the same patient is counted only once
            const mutations = mutationsByPosition[position];
            if (mutations) {
                map[position] = this.countUniqueMutations(mutations);
            }
        });

        return map;
    }

    public countUniqueMutations(mutations: Mutation[]): number {
        // assume by default all mutations are unique
        // child classes need to override this method to have a custom way of counting unique mutations
        return this.config.getMutationCount
            ? this.getMutationCount(mutations, this.config.getMutationCount)
            : mutations.length;
    }

    protected getMutationCount(
        mutations: Mutation[],
        getMutationCount: (mutation: Partial<Mutation>) => number
    ) {
        return mutations
            .map(m => getMutationCount(m))
            .reduce((sum, count) => sum + count);
    }

    readonly mutationData: MobxPromise<
        Partial<Mutation>[] | undefined
    > = remoteData(
        {
            await: () => {
                if (this.config.filterMutationsBySelectedTranscript) {
                    return [
                        this.canonicalTranscript,
                        this.indexedVariantAnnotations,
                    ];
                } else {
                    return [this.canonicalTranscript];
                }
            },
            invoke: async () => {
                return this.mutations;
            },
        },
        []
    );

    readonly swissProtId: MobxPromise<string> = remoteData(
        {
            invoke: async () => {
                // do not try fetching swissprot data for invalid entrez gene ids,
                // just return the default value
                if (!this.gene.entrezGeneId || this.gene.entrezGeneId < 1) {
                    return '';
                }

                const accession:
                    | string
                    | string[] = await this.dataFetcher.fetchSwissProtAccession(
                    this.gene.entrezGeneId
                );

                if (_.isArray(accession)) {
                    return accession[0];
                } else {
                    return accession;
                }
            },
            onError: () => {
                // fail silently
            },
        },
        ''
    );

    readonly uniprotId: MobxPromise<string | undefined> = remoteData(
        {
            await: () => [this.swissProtId],
            invoke: async () => {
                if (this.swissProtId.result) {
                    return this.dataFetcher.fetchUniprotId(
                        this.swissProtId.result
                    );
                } else {
                    return '';
                }
            },
            onError: () => {
                // fail silently
            },
        },
        ''
    );

    readonly mutationAlignerLinks: MobxPromise<
        { [pfamAccession: string]: string } | undefined
    > = remoteData(
        {
            await: () => [this.canonicalTranscript, this.allTranscripts],
            invoke: () =>
                new Promise<{ [pfamAccession: string]: string } | undefined>(
                    (resolve, reject) => {
                        const regions =
                            this.allTranscripts.result &&
                            this.activeTranscript &&
                            this.transcriptsByTranscriptId[
                                this.activeTranscript
                            ]
                                ? this.transcriptsByTranscriptId[
                                      this.activeTranscript
                                  ].pfamDomains
                                : undefined;

                        const responsePromises: Promise<Response>[] = [];
                        for (let i = 0; regions && i < regions.length; i++) {
                            // have to do a for loop because seamlessImmutable will make result of .map immutable,
                            // and that causes infinite loop here
                            // TODO fix `as any`
                            responsePromises.push(
                                this.dataFetcher.fetchMutationAlignerLink(
                                    regions[i].pfamDomainId
                                ) as any
                            );
                        }
                        const allResponses = Promise.all(responsePromises);
                        allResponses.then(responses => {
                            // TODO fix `as any`
                            const data = responses.map(r =>
                                JSON.parse(r.text as any)
                            );
                            const ret: { [pfamAccession: string]: string } = {};
                            let mutationAlignerData: any;
                            let pfamAccession: string | null;
                            for (let i = 0; i < data.length; i++) {
                                mutationAlignerData = data[i];
                                pfamAccession = regions
                                    ? regions[i].pfamDomainId
                                    : null;
                                if (
                                    pfamAccession &&
                                    mutationAlignerData.linkToMutationAligner
                                ) {
                                    ret[pfamAccession] =
                                        mutationAlignerData.linkToMutationAligner;
                                }
                            }
                            resolve(ret);
                        });
                        allResponses.catch(reject);
                    }
                ),
        },
        {}
    );

    readonly pfamDomainData: MobxPromise<PfamDomain[] | undefined> = remoteData(
        {
            await: () => [
                this.canonicalTranscript,
                this.transcriptsWithProteinLength,
            ],
            invoke: async () => {
                if (
                    this.canonicalTranscript.result &&
                    this.canonicalTranscript.result.pfamDomains &&
                    this.canonicalTranscript.result.pfamDomains.length > 0
                ) {
                    let domainRanges = this.canonicalTranscript.result
                        .pfamDomains;
                    if (
                        this.config.filterMutationsBySelectedTranscript &&
                        this.transcriptsWithProteinLength.result &&
                        this.transcriptsWithProteinLength.result.length > 0
                    ) {
                        // add domain ranges for all transcripts to this call
                        domainRanges = [].concat.apply(
                            [domainRanges],
                            _.compact(
                                this.transcriptsWithProteinLength.result.map(
                                    (transcriptId: string) =>
                                        this.transcriptsByTranscriptId[
                                            transcriptId
                                        ].pfamDomains
                                )
                            )
                        );
                    }
                    return this.dataFetcher.fetchPfamDomainData(
                        domainRanges.map((x: PfamDomainRange) => x.pfamDomainId)
                    );
                } else {
                    return undefined;
                }
            },
        },
        undefined
    );

    readonly canonicalTranscript: MobxPromise<
        EnsemblTranscript | undefined
    > = remoteData(
        {
            await: () => [this.transcriptsByHugoSymbol],
            invoke: async () => {
                if (this.gene) {
                    return this.dataFetcher.fetchCanonicalTranscriptWithFallback(
                        this.gene.hugoGeneSymbol,
                        this.isoformOverrideSource,
                        this.transcriptsByHugoSymbol.result
                    );
                } else {
                    return undefined;
                }
            },
            onError: () => {
                throw new Error('Failed to get canonical transcript');
            },
        },
        undefined
    );

    readonly allTranscripts: MobxPromise<
        EnsemblTranscript[] | undefined
    > = remoteData(
        {
            await: () => [
                this.transcriptsByHugoSymbol,
                this.canonicalTranscript,
            ],
            invoke: async () => {
                return _.compact(
                    _.unionBy(
                        this.transcriptsByHugoSymbol.result,
                        [this.canonicalTranscript.result],
                        t => t && t.transcriptId
                    )
                );
            },
            onError: () => {
                throw new Error('Failed to get all transcripts');
            },
        },
        undefined
    );

    readonly transcriptsByHugoSymbol: MobxPromise<
        EnsemblTranscript[] | undefined
    > = remoteData(
        {
            invoke: async () => {
                if (this.gene) {
                    return this.dataFetcher.fetchEnsemblTranscriptsByEnsemblFilter(
                        { hugoSymbols: [this.gene.hugoGeneSymbol] }
                    );
                } else {
                    return undefined;
                }
            },
            onError: () => {
                throw new Error('Failed to fetch all transcripts');
            },
        },
        undefined
    );

    readonly transcriptsWithProteinLength: MobxPromise<
        string[] | undefined
    > = remoteData(
        {
            await: () => [this.allTranscripts, this.canonicalTranscript],
            invoke: async () => {
                if (
                    this.allTranscripts.result &&
                    this.canonicalTranscript.result
                ) {
                    // ignore transcripts without protein length
                    // TODO: better solution is to hide lollipop plot for those transcripts
                    return _.compact(
                        this.allTranscripts.result.map(
                            (et: EnsemblTranscript) =>
                                et.proteinLength && et.transcriptId
                        )
                    );
                } else {
                    return [];
                }
            },
            onError: () => {
                throw new Error('Failed to get transcriptsWithProteinLength');
            },
        },
        undefined
    );

    readonly transcriptsWithAnnotations: MobxPromise<
        string[] | undefined
    > = remoteData(
        {
            await: () => [
                this.indexedVariantAnnotations,
                this.allTranscripts,
                this.transcriptsWithProteinLength,
            ],
            invoke: async () => {
                if (
                    this.indexedVariantAnnotations.result &&
                    this.allTranscripts.result &&
                    this.transcriptsWithProteinLength.result &&
                    this.transcriptsWithProteinLength.result.length > 0
                ) {
                    // ignore transcripts without protein length
                    // TODO: better solution is to show only mutations table, not lollipop plot for those transcripts
                    const transcripts: string[] = _.uniq(
                        [].concat.apply(
                            [],
                            uniqueGenomicLocations(this.getMutations()).map(
                                (gl: GenomicLocation) => {
                                    const variantAnnotation = this
                                        .indexedVariantAnnotations.result
                                        ? this.indexedVariantAnnotations.result[
                                              genomicLocationString(gl)
                                          ]
                                        : undefined;

                                    if (
                                        variantAnnotation &&
                                        !_.isEmpty(
                                            variantAnnotation.transcript_consequences
                                        )
                                    ) {
                                        return variantAnnotation.transcript_consequences
                                            .map(tc => tc.transcript_id)
                                            .filter((transcriptId: string) =>
                                                this.transcriptsWithProteinLength.result!.includes(
                                                    transcriptId
                                                )
                                            );
                                    } else {
                                        return [];
                                    }
                                }
                            )
                        )
                    );
                    // makes sure the annotations are actually of the form we are displaying (e.g. nonsynonymous)
                    return transcripts.filter(
                        (t: string) =>
                            getMutationsToTranscriptId(
                                this.getMutations(),
                                t,
                                this.indexedVariantAnnotations.result!
                            ).length > 0
                    );
                } else {
                    return [];
                }
            },
            onError: () => {
                throw new Error('Failed to get transcriptsWithAnnotations');
            },
        },
        undefined
    );

    readonly ptmData: MobxPromise<PostTranslationalModification[]> = remoteData(
        {
            await: () => [this.mutationData],
            invoke: async () => {
                if (this.activeTranscript) {
                    return this.dataFetcher.fetchPtmData(this.activeTranscript);
                } else {
                    return [];
                }
            },
            onError: () => {
                // fail silently
            },
        },
        []
    );

    readonly ptmDataByProteinPosStart: MobxPromise<
        { [pos: number]: PostTranslationalModification[] } | undefined
    > = remoteData(
        {
            await: () => [this.ptmData],
            invoke: async () =>
                this.ptmData.result
                    ? groupPtmDataByPosition(this.ptmData.result)
                    : {},
        },
        {}
    );

    readonly ptmDataByTypeAndProteinPosStart: MobxPromise<
        | {
              [type: string]: {
                  [position: number]: PostTranslationalModification[];
              };
          }
        | undefined
    > = remoteData(
        {
            await: () => [this.ptmData],
            invoke: async () =>
                this.ptmData.result
                    ? groupPtmDataByTypeAndPosition(this.ptmData.result)
                    : {},
        },
        {}
    );

    readonly cancerHotspotsData: MobxPromise<Hotspot[]> = remoteData(
        {
            await: () => [this.mutationData],
            invoke: async () => {
                if (this.activeTranscript) {
                    // TODO resolve protein start pos if missing
                    return this.dataFetcher.fetchCancerHotspotData(
                        this.activeTranscript
                    );
                } else {
                    return [];
                }
            },
            onError: () => {
                // fail silently
            },
        },
        []
    );

    readonly cancerHotspotsDataByProteinPosStart: MobxPromise<{
        [pos: number]: Hotspot[];
    }> = remoteData(
        {
            await: () => [this.cancerHotspotsData],
            invoke: async () =>
                this.ptmData.result
                    ? groupCancerHotspotDataByPosition(
                          this.cancerHotspotsData.result!
                      )
                    : {},
        },
        {}
    );

    // Hotspots
    readonly hotspotData: MobxPromise<AggregatedHotspots[]> = remoteData({
        await: () => [this.mutationData],
        invoke: () => {
            return this.dataFetcher.fetchAggregatedHotspotsData(this.mutations);
        },
    });

    readonly indexedHotspotData: MobxPromise<
        IHotspotIndex | undefined
    > = remoteData({
        await: () => [this.hotspotData],
        invoke: () => Promise.resolve(indexHotspotsData(this.hotspotData)),
    });

    @computed
    get hotspotsByPosition(): { [pos: number]: Hotspot[] } {
        if (this.indexedHotspotData.result) {
            return groupHotspotsByMutations(
                this.mutationsByPosition,
                this.indexedHotspotData.result,
                defaultHotspotFilter
            );
        } else {
            return {};
        }
    }

    readonly oncoKbCancerGenes: MobxPromise<CancerGene[] | Error> = remoteData(
        {
            invoke: () => this.dataFetcher.fetchOncoKbCancerGenes(),
        },
        []
    );

    readonly oncoKbAnnotatedGenes: MobxPromise<{
        [entrezGeneId: number]: boolean;
    }> = remoteData(
        {
            await: () => [this.oncoKbCancerGenes],
            invoke: () =>
                Promise.resolve(
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
                ),
        },
        {}
    );

    readonly oncoKbData: MobxPromise<IOncoKbData | Error> = remoteData(
        {
            await: () => [this.mutationData, this.oncoKbAnnotatedGenes],
            invoke: () =>
                this.config.enableOncoKb
                    ? this.dataFetcher.fetchOncoKbData(
                          this.mutations,
                          this.oncoKbAnnotatedGenes.result!,
                          this.getDefaultTumorType,
                          this.getDefaultEntrezGeneId
                      )
                    : Promise.resolve(ONCOKB_DEFAULT_DATA),
            onError: () => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT_DATA
    );

    @computed
    get oncoKbDataByPosition(): { [pos: number]: IndicatorQueryResp[] } {
        if (
            this.oncoKbData.result &&
            !(this.oncoKbData.result instanceof Error)
        ) {
            return groupOncoKbIndicatorDataByMutations(
                this.mutationsByPosition,
                this.oncoKbData.result,
                this.getDefaultTumorType,
                this.getDefaultEntrezGeneId,
                defaultOncoKbIndicatorFilter
            );
        } else {
            return {};
        }
    }

    readonly civicGenes: MobxPromise<ICivicGene | undefined> = remoteData({
        await: () => [this.mutationData],
        invoke: async () =>
            this.config.enableCivic
                ? fetchCivicGenes(
                      this.mutationData.result || [],
                      this.getDefaultEntrezGeneId
                  )
                : {},
        onError: () => {
            // fail silently
        },
    });

    readonly civicVariants = remoteData<ICivicVariant | undefined>({
        await: () => [this.civicGenes, this.mutationData],
        invoke: async () => {
            if (this.config.enableCivic && this.civicGenes.result) {
                return fetchCivicVariants(
                    this.civicGenes.result as ICivicGene,
                    this.mutationData.result || []
                );
            } else {
                return {};
            }
        },
        onError: () => {
            // fail silently
        },
    });

    readonly indexedVariantAnnotations: MobxPromise<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    > = remoteData({
        invoke: async () =>
            this.getMutations()
                ? await this.dataFetcher.fetchVariantAnnotationsIndexedByGenomicLocation(
                      this.getMutations(),
                      this.annotationFields,
                      this.isoformOverrideSource
                  )
                : undefined,
        onError: () => {
            // fail silently, leave the error handling responsibility to the data consumer
        },
    });

    readonly indexedMyVariantInfoAnnotations: MobxPromise<
        { [genomicLocation: string]: MyVariantInfo } | undefined
    > = remoteData({
        await: () => [this.mutationData],
        invoke: async () =>
            this.getMutations()
                ? await this.dataFetcher.fetchMyVariantInfoAnnotationsIndexedByGenomicLocation(
                      this.getMutations(),
                      this.isoformOverrideSource
                  )
                : undefined,
        onError: () => {
            // fail silently, leave the error handling responsibility to the data consumer
        },
    });

    @computed
    get mutationsByTranscriptId(): { [transcriptId: string]: Mutation[] } {
        if (
            this.indexedVariantAnnotations.result &&
            this.transcriptsWithAnnotations.result
        ) {
            return _.fromPairs(
                this.transcriptsWithAnnotations.result.map((t: string) => [
                    t,
                    getMutationsToTranscriptId(
                        this.getMutations(),
                        t,
                        this.indexedVariantAnnotations.result!!
                    ),
                ])
            );
        } else {
            return {};
        }
    }

    @autobind
    protected getDefaultTumorType(mutation: Mutation): string {
        return this.config.getTumorType
            ? this.config.getTumorType(mutation)
            : 'Unknown';
    }

    @autobind
    protected getDefaultEntrezGeneId(mutation: Mutation): number {
        // assuming all mutations in this store is for the same gene
        return (
            this.gene.entrezGeneId ||
            (mutation.gene && mutation.gene.entrezGeneId) ||
            0
        );
    }
}

export default DefaultMutationMapperStore;
