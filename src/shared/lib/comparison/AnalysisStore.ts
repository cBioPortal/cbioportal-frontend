import { remoteData } from 'cbioportal-frontend-commons';
import {
    CancerStudy,
    Gene,
    Mutation,
    MutationCountByPosition,
    Sample,
} from 'cbioportal-ts-api-client';
import { computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import { compileMutations } from '../../../pages/resultsView/ResultsViewPageStoreUtils';
import internalClient from '../../api/cbioportalInternalClientInstance';
import { AppStore } from '../../../AppStore';
import {
    evaluateMutationPutativeDriverInfo,
    fetchOncoKbCancerGenes,
    fetchOncoKbDataForOncoprint,
    filterAndAnnotateMutations,
    getGenomeNexusUrl,
    makeGetOncoKbMutationAnnotationForOncoprint,
    makeIsHotspotForOncoprint,
    ONCOKB_DEFAULT,
} from 'shared/lib/StoreUtils';
import MobxPromise, { MobxPromiseUnionTypeWithDefault } from 'mobxpromise';
import { AnnotatedMutation } from '../../../pages/resultsView/ResultsViewPageStore';
import { DriverAnnotationSettings } from 'shared/alterationFiltering/AnnotationFilteringSettings';
import { getServerConfig } from 'config/config';
import { CoverageInformation } from '../GenePanelUtils';
import { CancerGene, IndicatorQueryResp } from 'oncokb-ts-api-client';
import {
    getProteinPositionFromProteinChange,
    IHotspotIndex,
    indexHotspotsData,
    IOncoKbData,
} from 'cbioportal-utils';
import { fetchHotspotsData } from '../CancerHotspotsUtils';
import { GenomeNexusAPIInternal } from 'genome-nexus-ts-api-client';
import {
    countMutations,
    mutationCountByPositionKey,
} from 'pages/resultsView/mutationCountHelpers';
import ComplexKeyCounter from '../complexKeyDataStructures/ComplexKeyCounter';
import GeneCache from 'shared/cache/GeneCache';

export default abstract class AnalysisStore {
    @observable driverAnnotationSettings: DriverAnnotationSettings;
    constructor() {}

    abstract mutations: MobxPromise<Mutation[]>;
    abstract sampleKeyToSample: MobxPromise<{
        [uniqueSampleKey: string]: Sample;
    }>;
    abstract get includeGermlineMutations(): boolean;
    abstract get studies(): MobxPromiseUnionTypeWithDefault<CancerStudy[]>;
    abstract genes: MobxPromise<Gene[]>;
    abstract coverageInformation: MobxPromise<CoverageInformation>;

    // everything below taken from the results view page store in order to get the annotated mutations
    readonly filteredAndAnnotatedMutations = remoteData<AnnotatedMutation[]>({
        await: () => [
            this._filteredAndAnnotatedMutationsReport,
            this.sampleKeyToSample,
        ],
        invoke: () => {
            const filteredMutations = compileMutations(
                this._filteredAndAnnotatedMutationsReport.result!,
                !this.driverAnnotationSettings.includeVUS,
                !this.includeGermlineMutations
            );
            const filteredSampleKeyToSample = this.sampleKeyToSample.result!;
            return Promise.resolve(
                filteredMutations.filter(
                    m => m.uniqueSampleKey in filteredSampleKeyToSample
                )
            );
        },
    });

    readonly _filteredAndAnnotatedMutationsReport = remoteData({
        await: () => [
            this.mutations,
            this.getMutationPutativeDriverInfo,
            this.entrezGeneIdToGene,
        ],
        invoke: () => {
            return Promise.resolve(
                filterAndAnnotateMutations(
                    this.mutations.result!,
                    this.getMutationPutativeDriverInfo.result!,
                    this.entrezGeneIdToGene.result!
                )
            );
        },
    });

    readonly getMutationPutativeDriverInfo = remoteData({
        await: () => {
            const toAwait = [];
            if (this.driverAnnotationSettings.oncoKb) {
                toAwait.push(this.oncoKbMutationAnnotationForOncoprint);
            }
            if (this.driverAnnotationSettings.hotspots) {
                toAwait.push(this.isHotspotForOncoprint);
            }
            if (this.driverAnnotationSettings.cbioportalCount) {
                toAwait.push(this.getCBioportalCount);
            }
            if (this.driverAnnotationSettings.cosmicCount) {
                toAwait.push(this.getCosmicCount);
            }
            return toAwait;
        },
        invoke: () => {
            return Promise.resolve((mutation: Mutation): {
                oncoKb: string;
                hotspots: boolean;
                cbioportalCount: boolean;
                cosmicCount: boolean;
                customDriverBinary: boolean;
                customDriverTier?: string;
            } => {
                const getOncoKbMutationAnnotationForOncoprint = this
                    .oncoKbMutationAnnotationForOncoprint.result!;
                const oncoKbDatum:
                    | IndicatorQueryResp
                    | undefined
                    | null
                    | false =
                    this.driverAnnotationSettings.oncoKb &&
                    getOncoKbMutationAnnotationForOncoprint &&
                    !(
                        getOncoKbMutationAnnotationForOncoprint instanceof Error
                    ) &&
                    getOncoKbMutationAnnotationForOncoprint(mutation);

                const isHotspotDriver =
                    this.driverAnnotationSettings.hotspots &&
                    !(this.isHotspotForOncoprint.result instanceof Error) &&
                    this.isHotspotForOncoprint.result!(mutation);
                const cbioportalCountExceeded =
                    this.driverAnnotationSettings.cbioportalCount &&
                    this.getCBioportalCount.isComplete &&
                    this.getCBioportalCount.result!(mutation) >=
                        this.driverAnnotationSettings.cbioportalCountThreshold;
                const cosmicCountExceeded =
                    this.driverAnnotationSettings.cosmicCount &&
                    this.getCosmicCount.isComplete &&
                    this.getCosmicCount.result!(mutation) >=
                        this.driverAnnotationSettings.cosmicCountThreshold;

                // Note: custom driver annotations are part of the incoming datum
                return evaluateMutationPutativeDriverInfo(
                    mutation,
                    oncoKbDatum,
                    this.driverAnnotationSettings.hotspots,
                    isHotspotDriver,
                    this.driverAnnotationSettings.cbioportalCount,
                    cbioportalCountExceeded,
                    this.driverAnnotationSettings.cosmicCount,
                    cosmicCountExceeded,
                    this.driverAnnotationSettings.customBinary,
                    this.driverAnnotationSettings.driverTiers
                );
            });
        },
    });

    readonly oncoKbMutationAnnotationForOncoprint = remoteData<
        Error | ((mutation: Mutation) => IndicatorQueryResp | undefined)
    >({
        await: () => [this.oncoKbDataForOncoprint],
        invoke: () =>
            makeGetOncoKbMutationAnnotationForOncoprint(
                this.oncoKbDataForOncoprint
            ),
    });

    //we need seperate oncokb data because oncoprint requires onkb queries across cancertype
    //mutations tab the opposite
    readonly oncoKbDataForOncoprint = remoteData<IOncoKbData | Error>(
        {
            await: () => [this.mutations, this.oncoKbAnnotatedGenes],
            invoke: async () =>
                fetchOncoKbDataForOncoprint(
                    this.oncoKbAnnotatedGenes,
                    this.mutations
                ),
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT
    );

    readonly oncoKbAnnotatedGenes = remoteData(
        {
            await: () => [this.oncoKbCancerGenes],
            invoke: () => {
                if (getServerConfig().show_oncokb) {
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

    readonly oncoKbCancerGenes = remoteData(
        {
            invoke: () => {
                if (getServerConfig().show_oncokb) {
                    return fetchOncoKbCancerGenes();
                } else {
                    return Promise.resolve([]);
                }
            },
        },
        []
    );

    public readonly isHotspotForOncoprint = remoteData<
        ((m: Mutation) => boolean) | Error
    >({
        invoke: () => makeIsHotspotForOncoprint(this.indexedHotspotData),
    });

    readonly indexedHotspotData = remoteData<IHotspotIndex | undefined>({
        await: () => [this.hotspotData],
        invoke: () => Promise.resolve(indexHotspotsData(this.hotspotData)),
    });

    // Hotspots
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

    @computed get genomeNexusInternalClient() {
        return new GenomeNexusAPIInternal(this.referenceGenomeBuild);
    }

    @computed get referenceGenomeBuild() {
        if (!this.studies.isComplete) {
            throw new Error('Failed to get studies');
        }
        return getGenomeNexusUrl(this.studies.result);
    }

    readonly getCBioportalCount: MobxPromise<
        (mutation: Mutation) => number
    > = remoteData({
        await: () => [this.cbioportalMutationCountData],
        invoke: () => {
            return Promise.resolve((mutation: Mutation): number => {
                const key = mutationCountByPositionKey(mutation);
                return this.cbioportalMutationCountData.result![key] || -1;
            });
        },
    });

    readonly cbioportalMutationCountData = remoteData<{
        [mutationCountByPositionKey: string]: number;
    }>({
        await: () => [this.mutations],
        invoke: async () => {
            const mutationPositionIdentifiers = _.values(
                countMutations(this.mutations.result!)
            );

            if (mutationPositionIdentifiers.length > 0) {
                const data = await internalClient.fetchMutationCountsByPositionUsingPOST(
                    {
                        mutationPositionIdentifiers,
                    }
                );
                return _.mapValues(
                    _.groupBy(data, mutationCountByPositionKey),
                    (counts: MutationCountByPosition[]) =>
                        _.sumBy(counts, c => c.count)
                );
            } else {
                return {};
            }
        },
    });

    readonly getCosmicCount: MobxPromise<
        (mutation: Mutation) => number
    > = remoteData({
        await: () => [this.cosmicCountsByKeywordAndStart],
        invoke: () => {
            return Promise.resolve((mutation: Mutation): number => {
                const targetPosObj = getProteinPositionFromProteinChange(
                    mutation.proteinChange
                );
                if (targetPosObj) {
                    const keyword = mutation.keyword;
                    const cosmicCount = this.cosmicCountsByKeywordAndStart.result!.get(
                        {
                            keyword,
                            start: targetPosObj.start,
                        }
                    );
                    return cosmicCount;
                } else {
                    return -1;
                }
            });
        },
    });

    //COSMIC count
    readonly cosmicCountsByKeywordAndStart = remoteData<ComplexKeyCounter>({
        await: () => [this.mutations],
        invoke: async () => {
            const keywords = _.uniq(
                this.mutations
                    .result!.filter((m: Mutation) => {
                        // keyword is what we use to query COSMIC count with, so we need
                        //  the unique list of mutation keywords to query. If a mutation has
                        //  no keyword, it cannot be queried for.
                        return !!m.keyword;
                    })
                    .map((m: Mutation) => m.keyword)
            );

            if (keywords.length > 0) {
                const data = await internalClient.fetchCosmicCountsUsingPOST({
                    keywords,
                });
                const map = new ComplexKeyCounter();
                for (const d of data) {
                    const position = getProteinPositionFromProteinChange(
                        d.proteinChange
                    );
                    if (position) {
                        map.add(
                            {
                                keyword: d.keyword,
                                start: position.start,
                            },
                            d.count
                        );
                    }
                }
                return map;
            } else {
                return new ComplexKeyCounter();
            }
        },
    });

    readonly entrezGeneIdToGene = remoteData<{ [entrezGeneId: number]: Gene }>({
        await: () => [this.genes],
        invoke: () =>
            Promise.resolve(
                _.keyBy(this.genes.result!, gene => gene.entrezGeneId)
            ),
    });

    readonly geneCache = new GeneCache();
}
