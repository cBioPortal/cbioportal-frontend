import {
    ComparisonGroup,
    defaultGroupOrder,
    finalizeStudiesAttr,
    getOrdinals,
    getStudyIds,
} from './GroupComparisonUtils';
import { remoteData, stringListToIndexSet } from 'cbioportal-frontend-commons';
import {
    SampleFilter,
    CancerStudy,
    MutationMultipleStudyFilter,
    SampleMolecularIdentifier,
    GenePanelDataMultipleStudyFilter,
    Mutation,
    Gene,
    GenePanelData,
    Sample,
    MutationCountByPosition,
} from 'cbioportal-ts-api-client';
import { action, observable, makeObservable, computed } from 'mobx';
import client from '../../shared/api/cbioportalClientInstance';
import comparisonClient from '../../shared/api/comparisonGroupClientInstance';
import _ from 'lodash';
import autobind from 'autobind-decorator';
import { pickClinicalDataColors } from 'pages/studyView/StudyViewUtils';
import { AppStore } from '../../AppStore';
import { GACustomFieldsEnum, trackEvent } from 'shared/lib/tracking';
import ifNotDefined from '../../shared/lib/ifNotDefined';
import GroupComparisonURLWrapper from './GroupComparisonURLWrapper';
import ComparisonStore, {
    OverlapStrategy,
} from '../../shared/lib/comparison/ComparisonStore';
import sessionServiceClient from 'shared/api//sessionServiceInstance';
import { COLORS } from '../studyView/StudyViewUtils';
import {
    ComparisonSession,
    SessionGroupData,
    VirtualStudy,
} from 'shared/api/session-service/sessionServiceModels';
import ComplexKeySet from 'shared/lib/complexKeyDataStructures/ComplexKeySet';
import { REQUEST_ARG_ENUM } from 'shared/constants';
import { AxisScale, DataFilter } from 'react-mutation-mapper';
import {
    evaluateMutationPutativeDriverInfo,
    fetchGenes,
    fetchOncoKbCancerGenes,
    fetchOncoKbDataForOncoprint,
    filterAndAnnotateMutations,
    getAllGenes,
    getGenomeNexusUrl,
    makeGetOncoKbMutationAnnotationForOncoprint,
    makeIsHotspotForOncoprint,
    ONCOKB_DEFAULT,
} from 'shared/lib/StoreUtils';
import {
    CoverageInformation,
    getCoverageInformation,
} from 'shared/lib/GenePanelUtils';
import {
    compileMutations,
    fetchPatients,
} from 'pages/resultsView/ResultsViewPageStoreUtils';
import { isSampleProfiled } from 'shared/lib/isSampleProfiled';
import { getSampleMolecularIdentifiers } from 'pages/studyView/StudyViewComparisonUtils';
import { FeatureFlagEnum } from 'shared/featureFlags';
import { AnnotatedMutation } from 'pages/resultsView/ResultsViewPageStore';
import { CancerGene, IndicatorQueryResp } from 'oncokb-ts-api-client';
import {
    getProteinPositionFromProteinChange,
    IHotspotIndex,
    indexHotspotsData,
    IOncoKbData,
} from 'cbioportal-utils';
import { getServerConfig } from 'config/config';
import { fetchHotspotsData } from 'shared/lib/CancerHotspotsUtils';
import { GenomeNexusAPIInternal } from 'genome-nexus-ts-api-client';
import MobxPromise from 'mobxpromise';
import {
    countMutations,
    mutationCountByPositionKey,
} from 'pages/resultsView/mutationCountHelpers';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import ComplexKeyCounter from 'shared/lib/complexKeyDataStructures/ComplexKeyCounter';
import GeneCache from 'shared/cache/GeneCache';

export default class GroupComparisonStore extends ComparisonStore {
    @observable private sessionId: string;

    constructor(
        sessionId: string,
        appStore: AppStore,
        protected urlWrapper: GroupComparisonURLWrapper
    ) {
        super(appStore, urlWrapper);

        makeObservable(this);

        this.sessionId = sessionId;
    }

    @action public updateOverlapStrategy(strategy: OverlapStrategy) {
        this.urlWrapper.updateURL({ overlapStrategy: strategy });
    }

    @computed get overlapStrategy() {
        return this.urlWrapper.query.overlapStrategy || OverlapStrategy.EXCLUDE;
    }

    @computed
    public get usePatientLevelEnrichments() {
        return this.urlWrapper.query.patientEnrichments === 'true';
    }

    @action.bound
    public setUsePatientLevelEnrichments(e: boolean) {
        this.urlWrapper.updateURL({ patientEnrichments: e.toString() });
    }

    @computed get groupOrder() {
        const param = this.urlWrapper.query.groupOrder;
        if (param) {
            return JSON.parse(param);
        } else {
            return undefined;
        }
    }

    @action public updateGroupOrder(oldIndex: number, newIndex: number) {
        let groupOrder = this.groupOrder;
        if (!groupOrder) {
            groupOrder = this._originalGroups.result!.map(g => g.name);
        }
        groupOrder = groupOrder.slice();
        const poppedUid = groupOrder.splice(oldIndex, 1)[0];
        groupOrder.splice(newIndex, 0, poppedUid);

        this.urlWrapper.updateURL({ groupOrder: JSON.stringify(groupOrder) });
    }

    @action private updateUnselectedGroups(names: string[]) {
        this.urlWrapper.updateURL({ unselectedGroups: JSON.stringify(names) });
    }

    @computed get unselectedGroups() {
        const param = this.urlWrapper.query.unselectedGroups;
        if (param) {
            return JSON.parse(param);
        } else {
            return [];
        }
    }

    @action.bound
    public toggleGroupSelected(name: string) {
        const groups = this.unselectedGroups.slice();
        if (groups.includes(name)) {
            groups.splice(groups.indexOf(name), 1);
        } else {
            groups.push(name);
        }
        this.updateUnselectedGroups(groups);
    }

    @action.bound
    public selectAllGroups() {
        this.updateUnselectedGroups([]);
    }

    @action.bound
    public deselectAllGroups() {
        const groups = this._originalGroups.result!; // assumed complete
        this.updateUnselectedGroups(groups.map(g => g.name));
    }

    @autobind
    public isGroupSelected(name: string) {
        return !this.unselectedGroups.includes(name);
    }

    @action
    protected async saveAndGoToSession(newSession: ComparisonSession) {
        const { id } = await comparisonClient.addComparisonSession(newSession);
        this.urlWrapper.updateURL({ comparisonId: id });
    }

    get _session() {
        return this.__session;
    }

    private readonly __session = remoteData<ComparisonSession>({
        invoke: () => {
            return comparisonClient.getComparisonSession(this.sessionId);
        },
        onResult(data: ComparisonSession) {
            try {
                const studies = _.chain(data.groups)
                    .flatMap(group => group.studies)
                    .map(study => study.id)
                    .uniq()
                    .value();
                trackEvent({
                    category: 'groupComparison',
                    action: 'comparisonSessionViewed',
                    label: studies.join(',') + ',',
                    fieldsObject: {
                        [GACustomFieldsEnum.GroupCount]: data.groups.length,
                    },
                });
            } catch (ex) {
                throw 'Failure to track comparisonSessionViewed';
            }
        },
    });

    @computed get sessionClinicalAttributeName() {
        if (this._session.isComplete) {
            return this._session.result.clinicalAttributeName;
        } else {
            return undefined;
        }
    }

    readonly _unsortedOriginalGroups = remoteData<ComparisonGroup[]>({
        await: () => [this._session, this.sampleMap],
        invoke: () => {
            // (1) ensure color
            // (2) filter out, and add list of, nonexistent samples
            // (3) add patients

            let ret: ComparisonGroup[] = [];
            const sampleSet = this.sampleMap.result!;

            // filter colors (remove those that were already selected by user for some groups)
            // and get the list of groups with no color
            let colors: string[] = COLORS;
            let filteredColors = colors;
            let groupsWithoutColor: SessionGroupData[] = [];
            this._session.result!.groups.forEach((group, i) => {
                if (group.color != undefined) {
                    filteredColors = filteredColors.filter(
                        color => color != group.color!.toUpperCase()
                    );
                } else {
                    groupsWithoutColor.push(group);
                }
            });

            // pick a color for groups without color
            let defaultGroupColors = pickClinicalDataColors(
                _.map(groupsWithoutColor, group => ({
                    value: group.name,
                })) as any,
                filteredColors
            );

            const finalizeGroup = (
                groupData: SessionGroupData,
                index: number
            ) => {
                // assign color to group if no color given
                let color =
                    groupData.color || defaultGroupColors[groupData.name];

                const { nonExistentSamples, studies } = finalizeStudiesAttr(
                    groupData,
                    sampleSet
                );

                return Object.assign({}, groupData, {
                    color,
                    studies,
                    nonExistentSamples,
                    uid: groupData.name,
                    nameWithOrdinal: '', // fill in later
                    ordinal: '', // fill in later
                });
            };

            this._session.result!.groups.forEach((groupData, index) => {
                ret.push(finalizeGroup(groupData, index));
            });
            return Promise.resolve(ret);
        },
    });

    readonly _originalGroups = remoteData<ComparisonGroup[]>({
        await: () => [this._session, this._unsortedOriginalGroups],
        invoke: () => {
            // sort and add ordinals
            let sorted: ComparisonGroup[];
            if (this.groupOrder) {
                const order = stringListToIndexSet(this.groupOrder);
                sorted = _.sortBy<ComparisonGroup>(
                    this._unsortedOriginalGroups.result!,
                    g =>
                        ifNotDefined<number>(
                            order[g.name],
                            Number.POSITIVE_INFINITY
                        )
                );
            } else if (this._session.result!.groupNameOrder) {
                const order = stringListToIndexSet(
                    this._session.result!.groupNameOrder!
                );
                sorted = _.sortBy<ComparisonGroup>(
                    this._unsortedOriginalGroups.result!,
                    g =>
                        ifNotDefined<number>(
                            order[g.name],
                            Number.POSITIVE_INFINITY
                        )
                );
            } else {
                sorted = defaultGroupOrder(
                    this._unsortedOriginalGroups.result!
                );
            }

            const ordinals = getOrdinals(sorted.length, 26);
            sorted.forEach((group, index) => {
                const ordinal = ordinals[index];
                group.nameWithOrdinal = `(${ordinal}) ${group.name}`;
                group.ordinal = ordinal;
            });
            return Promise.resolve(sorted);
        },
    });

    public get samples() {
        return this._samples;
    }
    private readonly _samples = remoteData({
        await: () => [this._session, this.allSamples],
        invoke: async () => {
            // filter to get samples in our groups
            const sampleSet = new ComplexKeySet();
            for (const groupData of this._session.result!.groups) {
                for (const studySpec of groupData.studies) {
                    const studyId = studySpec.id;
                    for (const sampleId of studySpec.samples) {
                        sampleSet.add({
                            studyId,
                            sampleId,
                        });
                    }
                }
            }

            return this.allSamples.result!.filter(sample => {
                return sampleSet.has({
                    studyId: sample.studyId,
                    sampleId: sample.sampleId,
                });
            });
        },
    });

    public readonly groupToProfiledPatients = remoteData({
        await: () => [
            this._originalGroups,
            this.sampleMap,
            this.mutationEnrichmentProfiles,
            this.coverageInformation,
        ],
        invoke: () => {
            const sampleSet = this.sampleMap.result!;
            const groups = this._originalGroups.result!;
            const ret: {
                [groupUid: string]: string[];
            } = {};
            for (const group of groups) {
                for (const studyObject of group.studies) {
                    const studyId = studyObject.id;
                    for (const sampleId of studyObject.samples) {
                        const sample = sampleSet.get({ sampleId, studyId });
                        if (
                            sample &&
                            this.mutationEnrichmentProfiles.result!.some(p =>
                                isSampleProfiled(
                                    sample.uniqueSampleKey,
                                    p.molecularProfileId,
                                    this.activeMutationMapperGene!
                                        .hugoGeneSymbol,
                                    this.coverageInformation.result!
                                )
                            )
                        ) {
                            ret[group.name] = ret[group.name] || [];
                            ret[group.name].push(sample.patientId);
                        }
                    }
                }
                ret[group.name] = _.uniq(ret[group.name]);
            }
            return Promise.resolve(ret);
        },
    });

    readonly mutations = remoteData({
        await: () => [this.samples, this.mutationEnrichmentProfiles],
        invoke: async () => {
            const sampleMolecularIdentifiers = getSampleMolecularIdentifiers(
                this.samples.result!,
                this.mutationEnrichmentProfiles.result!
            );
            const mutations = await client.fetchMutationsInMultipleMolecularProfilesUsingPOST(
                {
                    projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                    mutationMultipleStudyFilter: {
                        entrezGeneIds: [
                            this.activeMutationMapperGene!.entrezGeneId,
                        ],
                        sampleMolecularIdentifiers,
                    } as MutationMultipleStudyFilter,
                }
            );
            return mutations;
        },
    });

    readonly allSamples = remoteData({
        await: () => [this._session],
        invoke: async () => {
            const allStudies = _(this._session.result!.groups)
                .flatMapDeep(groupData => groupData.studies.map(s => s.id))
                .uniq()
                .value();
            // fetch all samples - faster backend processing time
            const allSamples = await client.fetchSamplesUsingPOST({
                sampleFilter: {
                    sampleListIds: allStudies.map(studyId => `${studyId}_all`),
                } as SampleFilter,
                projection: 'DETAILED',
            });

            return allSamples;
        },
    });

    readonly genePanelDataForMutationProfiles = remoteData({
        await: () => [this.samples, this.mutationEnrichmentProfiles],
        invoke: async () => {
            const sampleMolecularIdentifiers = getSampleMolecularIdentifiers(
                this.samples.result!,
                this.mutationEnrichmentProfiles.result!
            );
            const genePanelData = client.fetchGenePanelDataInMultipleMolecularProfilesUsingPOST(
                {
                    genePanelDataMultipleStudyFilter: {
                        sampleMolecularIdentifiers,
                    } as GenePanelDataMultipleStudyFilter,
                }
            );
            return genePanelData;
        },
    });

    readonly coverageInformation = remoteData<CoverageInformation | undefined>({
        await: () => [
            this.genePanelDataForMutationProfiles,
            this.sampleKeyToSample,
            this.patients,
        ],
        invoke: () => {
            return Promise.resolve(
                getCoverageInformation(
                    this.genePanelDataForMutationProfiles.result!,
                    this.sampleKeyToSample.result!,
                    this.patients.result!,
                    [this.activeMutationMapperGene!]
                )
            );
        },
    });

    readonly patients = remoteData({
        await: () => [this.samples],
        invoke: () => fetchPatients(this.samples.result!),
        default: [],
    });

    readonly availableGenes = remoteData<Gene[]>({
        invoke: async () => {
            const genes = await getAllGenes();
            return genes.sort((a, b) =>
                a.hugoGeneSymbol < b.hugoGeneSymbol ? -1 : 1
            );
        },
        onResult: (genes: Gene[]) => {
            this.geneCache.addData(genes);
        },
        onError: err => {
            // throwing this allows sentry to report it
            throw err;
        },
    });

    @computed get userSelectedMutationMapperGene() {
        return this.urlWrapper.query.selectedGene;
    }

    @computed get axisMode() {
        return this.urlWrapper.query.axisMode || AxisScale.PERCENT;
    }

    @computed get activeMutationMapperGene() {
        let gene =
            this.availableGenes.result!.find(
                g => g.hugoGeneSymbol === this.userSelectedMutationMapperGene
            ) ||
            this.availableGenes.result!.find(
                g =>
                    g.hugoGeneSymbol ===
                    this.genesWithMaxFrequency[0].hugoGeneSymbol
            );
        return gene;
    }

    @autobind
    public shouldApplySampleIdFilter(
        filter: DataFilter<string>,
        mutation: Mutation
    ): boolean {
        return this.mutationsByGroup.result![filter.values[0]].some(
            m => m.sampleId === mutation.sampleId
        );
    }

    readonly mutationsByGroup = remoteData({
        await: () => [this.mutations, this.activeGroups],
        invoke: async () => {
            const mutationsBySampleId = _.keyBy(
                this.mutations.result!,
                m => m.sampleId
            );

            const ret = this.activeGroups.result!.reduce(
                (aggr: { [groupId: string]: Mutation[] }, group) => {
                    const samplesInGroup = _(group.studies)
                        .map(g => g.samples)
                        .flatten()
                        .value();

                    const mutations = _(samplesInGroup)
                        .map(s => {
                            return mutationsBySampleId[s];
                        })
                        .flatten()
                        .compact()
                        .value();

                    aggr[group.uid] = mutations;
                    return aggr;
                },
                {}
            );
            return ret;
        },
    });

    readonly allStudies = remoteData(
        {
            invoke: async () =>
                await client.getAllStudiesUsingGET({
                    projection: 'SUMMARY',
                }),
        },
        []
    );

    readonly allStudyIdToStudy = remoteData({
        await: () => [this.allStudies],
        invoke: () =>
            Promise.resolve(_.keyBy(this.allStudies.result!, s => s.studyId)),
    });

    // contains queried physical studies
    private readonly queriedPhysicalStudies = remoteData({
        await: () => [this._session],
        invoke: async () => {
            const originStudies = this._session.result!.origin;
            const everyStudyIdToStudy = this.allStudyIdToStudy.result!;
            return _.reduce(
                originStudies,
                (acc: CancerStudy[], next) => {
                    if (everyStudyIdToStudy[next]) {
                        acc.push(everyStudyIdToStudy[next]);
                    }
                    return acc;
                },
                []
            );
        },
        default: [],
    });

    // virtual studies in session
    private readonly queriedVirtualStudies = remoteData({
        await: () => [this.queriedPhysicalStudies, this._session],
        invoke: async () => {
            const originStudies = this._session.result!.origin;
            if (
                this.queriedPhysicalStudies.result.length ===
                originStudies.length
            ) {
                return [];
            }
            let filteredVirtualStudies: VirtualStudy[] = [];
            let validFilteredPhysicalStudyIds = this.queriedPhysicalStudies.result.map(
                study => study.studyId
            );

            let virtualStudyIds = originStudies.filter(
                id => !validFilteredPhysicalStudyIds.includes(id)
            );

            await Promise.all(
                virtualStudyIds.map(id =>
                    sessionServiceClient
                        .getVirtualStudy(id)
                        .then(res => {
                            filteredVirtualStudies.push(res);
                        })
                        .catch(error => {
                            /*do nothing*/
                        })
                )
            );
            return filteredVirtualStudies;
        },
        default: [],
    });

    // all queried studies, includes both physcial and virtual studies
    // this is used in page header name
    readonly displayedStudies = remoteData({
        await: () => [this.queriedVirtualStudies, this.queriedPhysicalStudies],
        invoke: async () => {
            return [
                ...this.queriedPhysicalStudies.result,
                ...this.queriedVirtualStudies.result.map(virtualStudy => {
                    return {
                        name: virtualStudy.data.name,
                        description: virtualStudy.data.description,
                        studyId: virtualStudy.id,
                    } as CancerStudy;
                }),
            ];
        },
        default: [],
    });

    public get studies() {
        return this._studies;
    }
    private readonly _studies = remoteData(
        {
            await: () => [this._session, this.allStudyIdToStudy],
            invoke: () => {
                const studyIds = getStudyIds(this._session.result!.groups);
                return Promise.resolve(
                    studyIds.map(
                        studyId => this.allStudyIdToStudy.result![studyId]
                    )
                );
            },
        },
        []
    );

    @computed get hasCustomDriverAnnotations() {
        return (
            this.customDriverAnnotationReport.isComplete &&
            (!!this.customDriverAnnotationReport.result!.hasBinary ||
                this.customDriverAnnotationReport.result!.tiers.length > 0)
        );
    }

    // override parent method
    protected get isLeftTruncationFeatureFlagEnabled() {
        return this.appStore.featureFlagStore.has(
            FeatureFlagEnum.LEFT_TRUNCATION_ADJUSTMENT
        );
    }

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
        await: () => [this.availableGenes],
        invoke: () =>
            Promise.resolve(
                _.keyBy(this.availableGenes.result!, gene => gene.entrezGeneId)
            ),
    });

    readonly geneCache = new GeneCache();
}
