import {
    ClinicalDataEnrichmentWithQ,
    ComparisonGroup,
    EnrichmentAnalysisComparisonGroup,
    getGroupsDownloadData,
    getNumSamples,
    getOverlapComputations,
    getSampleIdentifiers,
    getStudyIds,
    IOverlapComputations,
    isGroupEmpty,
    partitionCasesByGroupMembership,
} from '../../../pages/groupComparison/GroupComparisonUtils';
import { GroupComparisonTab } from '../../../pages/groupComparison/GroupComparisonTabs';
import {
    findFirstMostCommonElt,
    remoteData,
} from 'cbioportal-frontend-commons';
import {
    AlterationEnrichment,
    CancerStudy,
    ClinicalAttribute,
    ClinicalData,
    ClinicalDataMultiStudyFilter,
    Group,
    MolecularProfile,
    MolecularProfileCasesGroupFilter,
    MolecularProfileFilter,
    ReferenceGenomeGene,
    Sample,
} from 'cbioportal-ts-api-client';
import {
    action,
    autorun,
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
} from 'mobx';
import client from '../../api/cbioportalClientInstance';
import comparisonClient from '../../api/comparisonGroupClientInstance';
import _ from 'lodash';
import {
    pickCopyNumberEnrichmentProfiles,
    pickGenericAssayEnrichmentProfiles,
    pickMethylationEnrichmentProfiles,
    pickMRNAEnrichmentProfiles,
    pickMutationEnrichmentProfiles,
    pickProteinEnrichmentProfiles,
} from '../../../pages/resultsView/enrichments/EnrichmentsUtil';
import {
    makeEnrichmentDataPromise,
    makeGenericAssayEnrichmentDataPromise,
} from '../../../pages/resultsView/ResultsViewPageStoreUtils';
import internalClient from '../../api/cbioportalInternalClientInstance';
import autobind from 'autobind-decorator';
import { PatientSurvival } from 'shared/model/PatientSurvival';
import {
    getClinicalDataOfPatientSurvivalStatus,
    getPatientSurvivals,
} from 'pages/resultsView/SurvivalStoreHelper';
import { getPatientIdentifiers } from 'pages/studyView/StudyViewUtils';
import { Session, SessionGroupData } from '../../api/ComparisonGroupClient';
import { calculateQValues } from 'shared/lib/calculation/BenjaminiHochbergFDRCalculator';
import ComplexKeyMap from '../complexKeyDataStructures/ComplexKeyMap';
import ComplexKeyGroupsMap from '../complexKeyDataStructures/ComplexKeyGroupsMap';
import { AppStore } from '../../../AppStore';
import { ISurvivalDescription } from 'pages/resultsView/survival/SurvivalDescriptionTable';
import {
    fetchAllReferenceGenomeGenes,
    fetchSurvivalDataExists,
    getSurvivalClinicalAttributesPrefix,
} from 'shared/lib/StoreUtils';
import MobxPromise from 'mobxpromise';
import { ResultsViewPageStore } from '../../../pages/resultsView/ResultsViewPageStore';
import { getSurvivalStatusBoolean } from 'pages/resultsView/survival/SurvivalUtil';
import onMobxPromise from '../onMobxPromise';
import {
    cnaEventTypeSelectInit,
    mutationEventTypeSelectInit,
} from 'shared/lib/comparison/ComparisonStoreUtils';

export enum OverlapStrategy {
    INCLUDE = 'Include',
    EXCLUDE = 'Exclude',
}

export default abstract class ComparisonStore {
    private tabHasBeenShown = observable.map<GroupComparisonTab, boolean>();

    private tabHasBeenShownReactionDisposer: IReactionDisposer;
    @observable public newSessionPending = false;
    @observable.ref
    public selectedCopyNumberEnrichmentEventTypes = cnaEventTypeSelectInit;
    @observable.ref
    public selectedMutationEnrichmentEventTypes = mutationEventTypeSelectInit();

    constructor(
        protected appStore: AppStore,
        protected resultsViewStore?: ResultsViewPageStore
    ) {
        makeObservable(this);

        setTimeout(() => {
            // When groups in the comparison are updated by the user
            // certain tabs that were visible before might no longer be
            // supported by the data and would be hidden. Disappearing
            // tabs without explanation is considered bad UX design.
            // The logic below keeps track of tabs that were shown before
            // and keeps them visible between group updates.
            this.tabHasBeenShownReactionDisposer = autorun(() => {
                this.tabHasBeenShown.set(
                    GroupComparisonTab.SURVIVAL,
                    !!this.tabHasBeenShown.get(GroupComparisonTab.SURVIVAL) ||
                        this.showSurvivalTab
                );
                this.tabHasBeenShown.set(
                    GroupComparisonTab.MRNA,
                    !!this.tabHasBeenShown.get(GroupComparisonTab.MRNA) ||
                        this.showMRNATab
                );
                this.tabHasBeenShown.set(
                    GroupComparisonTab.PROTEIN,
                    !!this.tabHasBeenShown.get(GroupComparisonTab.PROTEIN) ||
                        this.showProteinTab
                );
                this.tabHasBeenShown.set(
                    GroupComparisonTab.DNAMETHYLATION,
                    !!this.tabHasBeenShown.get(
                        GroupComparisonTab.DNAMETHYLATION
                    ) || this.showMethylationTab
                );
                this.tabHasBeenShown.set(
                    GroupComparisonTab.GENERIC_ASSAY_PREFIX,
                    !!this.tabHasBeenShown.get(
                        GroupComparisonTab.GENERIC_ASSAY_PREFIX
                    ) || this.showGenericAssayTab
                );
                this.tabHasBeenShown.set(
                    GroupComparisonTab.ALTERATIONS,
                    !!this.tabHasBeenShown.get(
                        GroupComparisonTab.ALTERATIONS
                    ) || this.showAlterationsTab
                );
            });
        }); // do this after timeout so that all subclasses have time to construct
    }

    public destroy() {
        this.tabHasBeenShownReactionDisposer &&
            this.tabHasBeenShownReactionDisposer();
    }

    // < To be implemented in subclasses: >
    public isGroupSelected(name: string): boolean {
        throw new Error('isGroupSelected must be implemented in subclass');
    }
    public setUsePatientLevelEnrichments(s: boolean) {
        throw new Error(
            'setUsePatientLevelEnrichments must be implemented in subclass'
        );
    }
    public toggleGroupSelected(groupName: string) {
        throw new Error(`toggleGroupSelected must be implemented in subclass`);
    }
    public updateGroupOrder(oldIndex: number, newIndex: number) {
        throw new Error(`updateGroupOrder must be implemented in subclass`);
    }
    public selectAllGroups() {
        throw new Error(`selectAllGroups must be implemented in subclass`);
    }
    public deselectAllGroups() {
        throw new Error(`deselectAllGroups must be implemented in subclass`);
    }
    protected async saveAndGoToSession(newSession: Session) {
        throw new Error(`saveAndGoToSession must be implemented in subclass`);
    }
    abstract get _session(): MobxPromise<Session>;
    abstract _originalGroups: MobxPromise<ComparisonGroup[]>;
    abstract get overlapStrategy(): OverlapStrategy;
    abstract get usePatientLevelEnrichments(): boolean;
    abstract get samples(): MobxPromise<Sample[]>;
    abstract get studies(): MobxPromise<CancerStudy[]>;
    // < / >

    public get isLoggedIn() {
        return this.appStore.isLoggedIn;
    }

    public async addGroup(group: SessionGroupData, saveToUser: boolean) {
        this.newSessionPending = true;
        if (saveToUser && this.isLoggedIn) {
            await comparisonClient.addGroup(group);
        }
        const newSession = _.cloneDeep(this._session.result!);
        newSession.groups.push(group);

        this.saveAndGoToSession(newSession);
    }

    public async deleteGroup(name: string) {
        this.newSessionPending = true;
        const newSession = _.cloneDeep(this._session.result!);
        newSession.groups = newSession.groups.filter(g => g.name !== name);

        this.saveAndGoToSession(newSession);
    }

    readonly origin = remoteData({
        // the studies that the comparison groups come from
        await: () => [this._session],
        invoke: () => Promise.resolve(this._session.result!.origin),
    });

    readonly existingGroupNames = remoteData({
        await: () => [this._originalGroups, this.origin],
        invoke: async () => {
            const ret = {
                session: this._originalGroups.result!.map(g => g.name),
                user: [] as string[],
            };
            if (this.isLoggedIn) {
                // need to add all groups belonging to this user for this origin
                ret.user = (
                    await comparisonClient.getGroupsForStudies(
                        this.origin.result!
                    )
                ).map(g => g.data.name);
            }
            return ret;
        },
    });

    readonly overlapComputations = remoteData<
        IOverlapComputations<ComparisonGroup>
    >({
        await: () => [this._originalGroups],
        invoke: () => {
            return Promise.resolve(
                getOverlapComputations(
                    this._originalGroups.result!,
                    this.isGroupSelected
                )
            );
        },
    });

    readonly availableGroups = remoteData<ComparisonGroup[]>({
        await: () => [this._originalGroups, this._originalGroupsOverlapRemoved],
        invoke: () => {
            let ret: ComparisonGroup[];
            switch (this.overlapStrategy) {
                case OverlapStrategy.INCLUDE:
                    ret = this._originalGroups.result!;
                    break;
                case OverlapStrategy.EXCLUDE:
                default:
                    ret = this._originalGroupsOverlapRemoved.result!;
                    break;
            }
            return Promise.resolve(ret);
        },
    });

    readonly activeGroups = remoteData<ComparisonGroup[]>({
        await: () => [this.availableGroups],
        invoke: () =>
            Promise.resolve(
                this.availableGroups.result!.filter(
                    group =>
                        this.isGroupSelected(group.name) && !isGroupEmpty(group)
                )
            ),
    });

    readonly enrichmentAnalysisGroups = remoteData({
        await: () => [this.activeGroups, this.sampleMap],
        invoke: () => {
            const sampleSet =
                this.sampleMap.result || new ComplexKeyMap<Sample>();
            const groups = this.activeGroups.result!.map(group => {
                const samples: Sample[] = [];
                group.studies.forEach(studyEntry => {
                    const studyId = studyEntry.id;
                    studyEntry.samples.forEach(sampleId => {
                        if (sampleSet.has({ studyId: studyId, sampleId })) {
                            const sample = sampleSet.get({
                                studyId: studyId,
                                sampleId,
                            })!;
                            samples.push(sample);
                        }
                    });
                });
                return {
                    name: group.nameWithOrdinal,
                    description: '',
                    count: getNumSamples(group),
                    color: group.color,
                    samples,
                    nameOfEnrichmentDirection: group.nameOfEnrichmentDirection,
                };
            });
            return Promise.resolve(groups);
        },
    });

    readonly _originalGroupsOverlapRemoved = remoteData<ComparisonGroup[]>({
        await: () => [this.overlapComputations, this._originalGroups],
        invoke: () => Promise.resolve(this.overlapComputations.result!.groups),
    });

    readonly _activeGroupsOverlapRemoved = remoteData<ComparisonGroup[]>({
        await: () => [this._originalGroupsOverlapRemoved],
        invoke: () =>
            Promise.resolve(
                this._originalGroupsOverlapRemoved.result!.filter(
                    group =>
                        this.isGroupSelected(group.name) && !isGroupEmpty(group)
                )
            ),
    });

    readonly _activeGroupsNotOverlapRemoved = remoteData({
        await: () => [this._originalGroups, this.overlapComputations],
        invoke: () => {
            let excludedGroups = this.overlapComputations.result!
                .excludedFromAnalysis;
            if (this.overlapStrategy === OverlapStrategy.INCLUDE) {
                excludedGroups = {};
            }
            return Promise.resolve(
                this._originalGroups.result!.filter(
                    group =>
                        this.isGroupSelected(group.name) &&
                        !(group.uid in excludedGroups)
                )
            );
        },
    });

    readonly _selectedGroups = remoteData({
        await: () => [this._originalGroups],
        invoke: () =>
            Promise.resolve(
                this._originalGroups.result!.filter(group =>
                    this.isGroupSelected(group.name)
                )
            ),
    });

    readonly activeSamplesNotOverlapRemoved = remoteData({
        await: () => [this.sampleMap, this._activeGroupsNotOverlapRemoved],
        invoke: () => {
            const activeSampleIdentifiers = getSampleIdentifiers(
                this._activeGroupsNotOverlapRemoved.result!
            );
            const sampleSet = this.sampleMap.result!;
            return Promise.resolve(
                activeSampleIdentifiers.map(
                    sampleIdentifier => sampleSet.get(sampleIdentifier)!
                )
            );
        },
    });

    readonly activePatientKeysNotOverlapRemoved = remoteData({
        await: () => [this.activeSamplesNotOverlapRemoved],
        invoke: () =>
            Promise.resolve(
                _.uniq(
                    this.activeSamplesNotOverlapRemoved.result!.map(
                        s => s.uniquePatientKey
                    )
                )
            ),
    });

    readonly activeStudyIds = remoteData({
        await: () => [this.activeGroups],
        invoke: () => Promise.resolve(getStudyIds(this.activeGroups.result!)),
    });

    readonly molecularProfilesInActiveStudies = remoteData<MolecularProfile[]>(
        {
            await: () => [this.activeStudyIds],
            invoke: async () => {
                if (this.activeStudyIds.result!.length > 0) {
                    return client.fetchMolecularProfilesUsingPOST({
                        molecularProfileFilter: {
                            studyIds: this.activeStudyIds.result!,
                        } as MolecularProfileFilter,
                    });
                } else {
                    return Promise.resolve([]);
                }
            },
        },
        []
    );

    readonly referenceGenes = remoteData<ReferenceGenomeGene[]>({
        await: () => [this.studies],
        invoke: () => {
            if (this.studies.result!.length > 0) {
                return fetchAllReferenceGenomeGenes(
                    this.studies.result![0].referenceGenome
                );
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly hugoGeneSymbolToReferenceGene = remoteData<{
        [hugoSymbol: string]: ReferenceGenomeGene;
    }>({
        await: () => [this.referenceGenes],
        invoke: () => {
            // build reference gene map
            return Promise.resolve(
                _.keyBy(this.referenceGenes.result!, g => g.hugoGeneSymbol)
            );
        },
    });

    public readonly mutationEnrichmentProfiles = remoteData({
        await: () => [this.molecularProfilesInActiveStudies],
        invoke: () =>
            Promise.resolve(
                pickMutationEnrichmentProfiles(
                    this.molecularProfilesInActiveStudies.result!
                )
            ),
    });

    public readonly copyNumberEnrichmentProfiles = remoteData({
        await: () => [this.molecularProfilesInActiveStudies],
        invoke: () =>
            Promise.resolve(
                pickCopyNumberEnrichmentProfiles(
                    this.molecularProfilesInActiveStudies.result!
                )
            ),
    });

    public readonly mRNAEnrichmentProfiles = remoteData({
        await: () => [this.molecularProfilesInActiveStudies],
        invoke: () =>
            Promise.resolve(
                pickMRNAEnrichmentProfiles(
                    this.molecularProfilesInActiveStudies.result!
                )
            ),
    });

    public readonly proteinEnrichmentProfiles = remoteData({
        await: () => [this.molecularProfilesInActiveStudies],
        invoke: () =>
            Promise.resolve(
                pickProteinEnrichmentProfiles(
                    this.molecularProfilesInActiveStudies.result!
                )
            ),
    });

    public readonly methylationEnrichmentProfiles = remoteData({
        await: () => [this.molecularProfilesInActiveStudies],
        invoke: () =>
            Promise.resolve(
                pickMethylationEnrichmentProfiles(
                    this.molecularProfilesInActiveStudies.result!
                )
            ),
    });

    public readonly genericAssayEnrichmentProfilesGroupedByGenericAssayType = remoteData(
        {
            await: () => [this.molecularProfilesInActiveStudies],
            invoke: () =>
                Promise.resolve(
                    _.groupBy(
                        pickGenericAssayEnrichmentProfiles(
                            this.molecularProfilesInActiveStudies.result!
                        ),
                        profile => profile.genericAssayType
                    )
                ),
        }
    );

    @observable.ref private _mutationEnrichmentProfileMap: {
        [studyId: string]: MolecularProfile;
    } = {};
    @observable.ref private _copyNumberEnrichmentProfileMap: {
        [studyId: string]: MolecularProfile;
    } = {};
    @observable.ref private _mRNAEnrichmentProfileMap: {
        [studyId: string]: MolecularProfile;
    } = {};
    @observable.ref private _proteinEnrichmentProfileMap: {
        [studyId: string]: MolecularProfile;
    } = {};
    @observable.ref private _methylationEnrichmentProfileMap: {
        [studyId: string]: MolecularProfile;
    } = {};
    @observable.ref
    private _genericAssayEnrichmentProfileMapGroupedByGenericAssayType: {
        [geneircAssayType: string]: {
            [studyId: string]: MolecularProfile;
        };
    } = {};

    readonly selectedStudyMutationEnrichmentProfileMap = remoteData({
        await: () => [this.mutationEnrichmentProfiles],
        invoke: () => {
            //Only return Mutation profile if any mutation type is selected, otherwise return {}
            if (
                _(this.selectedMutationEnrichmentEventTypes)
                    .values()
                    .some()
            ) {
                // set default enrichmentProfileMap if not selected yet
                if (_.isEmpty(this._mutationEnrichmentProfileMap)) {
                    const molecularProfilesbyStudyId = _.groupBy(
                        this.mutationEnrichmentProfiles.result!,
                        profile => profile.studyId
                    );
                    // Select only one molecular profile for each study
                    return Promise.resolve(
                        _.mapValues(
                            molecularProfilesbyStudyId,
                            molecularProfiles => molecularProfiles[0]
                        )
                    );
                } else {
                    return Promise.resolve(this._mutationEnrichmentProfileMap);
                }
            } else {
                return Promise.resolve({});
            }
        },
    });

    readonly selectedStudyCopyNumberEnrichmentProfileMap = remoteData({
        await: () => [this.copyNumberEnrichmentProfiles],
        invoke: () => {
            //Only return Copy Number profile if any copy number type is selected, otherwise return {}
            if (
                _(this.selectedCopyNumberEnrichmentEventTypes)
                    .values()
                    .some()
            ) {
                // set default enrichmentProfileMap if not selected yet
                if (_.isEmpty(this._copyNumberEnrichmentProfileMap)) {
                    const molecularProfilesbyStudyId = _.groupBy(
                        this.copyNumberEnrichmentProfiles.result!,
                        profile => profile.studyId
                    );
                    // Select only one molecular profile for each study
                    return Promise.resolve(
                        _.mapValues(
                            molecularProfilesbyStudyId,
                            molecularProfiles => molecularProfiles[0]
                        )
                    );
                } else {
                    return Promise.resolve(
                        this._copyNumberEnrichmentProfileMap
                    );
                }
            } else {
                return Promise.resolve({});
            }
        },
    });

    readonly selectedmRNAEnrichmentProfileMap = remoteData({
        await: () => [this.mRNAEnrichmentProfiles],
        invoke: () => {
            // set default enrichmentProfileMap if not selected yet
            if (_.isEmpty(this._mRNAEnrichmentProfileMap)) {
                const molecularProfilesbyStudyId = _.groupBy(
                    this.mRNAEnrichmentProfiles.result!,
                    profile => profile.studyId
                );
                // Select only one molecular profile for each study
                return Promise.resolve(
                    _.mapValues(
                        molecularProfilesbyStudyId,
                        molecularProfiles => molecularProfiles[0]
                    )
                );
            } else {
                return Promise.resolve(this._mRNAEnrichmentProfileMap);
            }
        },
    });

    readonly selectedProteinEnrichmentProfileMap = remoteData({
        await: () => [this.proteinEnrichmentProfiles],
        invoke: () => {
            // set default enrichmentProfileMap if not selected yet
            if (_.isEmpty(this._proteinEnrichmentProfileMap)) {
                const molecularProfilesbyStudyId = _.groupBy(
                    this.proteinEnrichmentProfiles.result!,
                    profile => profile.studyId
                );
                // Select only one molecular profile for each study
                return Promise.resolve(
                    _.mapValues(
                        molecularProfilesbyStudyId,
                        molecularProfiles => molecularProfiles[0]
                    )
                );
            } else {
                return Promise.resolve(this._proteinEnrichmentProfileMap);
            }
        },
    });

    readonly selectedMethylationEnrichmentProfileMap = remoteData({
        await: () => [this.methylationEnrichmentProfiles],
        invoke: () => {
            // set default enrichmentProfileMap if not selected yet
            if (_.isEmpty(this._methylationEnrichmentProfileMap)) {
                const molecularProfilesbyStudyId = _.groupBy(
                    this.methylationEnrichmentProfiles.result!,
                    profile => profile.studyId
                );
                // Select only one molecular profile for each study
                return Promise.resolve(
                    _.mapValues(
                        molecularProfilesbyStudyId,
                        molecularProfiles => molecularProfiles[0]
                    )
                );
            } else {
                return Promise.resolve(this._methylationEnrichmentProfileMap);
            }
        },
    });

    readonly selectedGenericAssayEnrichmentProfileMapGroupedByGenericAssayType = remoteData(
        {
            await: () => [
                this.genericAssayEnrichmentProfilesGroupedByGenericAssayType,
            ],
            invoke: () => {
                if (
                    _.isEmpty(
                        this
                            ._genericAssayEnrichmentProfileMapGroupedByGenericAssayType
                    )
                ) {
                    return Promise.resolve(
                        _.mapValues(
                            this
                                .genericAssayEnrichmentProfilesGroupedByGenericAssayType
                                .result!,
                            genericAssayEnrichmentProfiles => {
                                const molecularProfilesbyStudyId = _.groupBy(
                                    genericAssayEnrichmentProfiles,
                                    profile => profile.studyId
                                );
                                // Select only one molecular profile for each study
                                return _.mapValues(
                                    molecularProfilesbyStudyId,
                                    molecularProfiles => molecularProfiles[0]
                                );
                            }
                        )
                    );
                } else {
                    return Promise.resolve(
                        this
                            ._genericAssayEnrichmentProfileMapGroupedByGenericAssayType
                    );
                }
            },
        }
    );

    @action
    public setMutationEnrichmentProfileMap(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this._mutationEnrichmentProfileMap = profileMap;
    }

    @action
    public setCopyNumberEnrichmentProfileMap(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this._copyNumberEnrichmentProfileMap = profileMap;
    }

    @action
    public setMRNAEnrichmentProfileMap(profiles: {
        [studyId: string]: MolecularProfile;
    }) {
        this._mRNAEnrichmentProfileMap = profiles;
    }

    @action
    public setProteinEnrichmentProfileMap(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this._proteinEnrichmentProfileMap = profileMap;
    }

    @action
    public setMethylationEnrichmentProfileMap(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this._methylationEnrichmentProfileMap = profileMap;
    }

    @action
    public setGenericAssayEnrichmentProfileMap(
        profileMap: {
            [studyId: string]: MolecularProfile;
        },
        genericAssayType: string
    ) {
        this._genericAssayEnrichmentProfileMapGroupedByGenericAssayType[
            genericAssayType
        ] = profileMap;
        // trigger the function to recompute
        const clonedMap = _.clone(
            this._genericAssayEnrichmentProfileMapGroupedByGenericAssayType
        );
        this._genericAssayEnrichmentProfileMapGroupedByGenericAssayType = clonedMap;
    }

    readonly alterationsEnrichmentAnalysisGroups = remoteData({
        await: () => [
            this.enrichmentAnalysisGroups,
            this.selectedStudyMutationEnrichmentProfileMap,
            this.selectedStudyCopyNumberEnrichmentProfileMap,
        ],
        invoke: () => {
            return Promise.resolve(
                this.enrichmentAnalysisGroups.result!.reduce(
                    (acc: EnrichmentAnalysisComparisonGroup[], group) => {
                        let filteredSamples: Sample[] = [];
                        // filter samples having mutation profile
                        if (
                            !_.isEmpty(
                                this.selectedStudyMutationEnrichmentProfileMap
                                    .result
                            )
                        ) {
                            filteredSamples = filteredSamples.concat(
                                group.samples.filter(
                                    sample =>
                                        this
                                            .selectedStudyMutationEnrichmentProfileMap
                                            .result![sample.studyId] !==
                                        undefined
                                )
                            );
                        }
                        // filter samples having copy number profile and append it to filteredSamples
                        if (
                            !_.isEmpty(
                                this.selectedStudyCopyNumberEnrichmentProfileMap
                                    .result
                            )
                        ) {
                            filteredSamples = filteredSamples.concat(
                                group.samples.filter(
                                    sample =>
                                        this
                                            .selectedStudyCopyNumberEnrichmentProfileMap
                                            .result![sample.studyId] !==
                                        undefined
                                )
                            );
                        }
                        if (filteredSamples.length > 0) {
                            acc.push({
                                ...group,
                                count: filteredSamples.length,
                                samples: filteredSamples,
                                description: `Number (percentage) of ${
                                    this.usePatientLevelEnrichments
                                        ? 'patients'
                                        : 'samples'
                                } in ${
                                    group.name
                                } that have a mutation in the listed gene.`,
                            });
                        }
                        return acc;
                    },
                    []
                )
            );
        },
    });

    readonly alterationsEnrichmentDataRequestGroups = remoteData({
        await: () => [
            this.alterationsEnrichmentAnalysisGroups,
            this.selectedStudyMutationEnrichmentProfileMap,
            this.selectedStudyCopyNumberEnrichmentProfileMap,
        ],
        invoke: () => {
            return Promise.resolve(
                this.alterationsEnrichmentAnalysisGroups.result!.map(group => {
                    let molecularProfileCaseIdentifiers: {
                        caseId: string;
                        molecularProfileId: string;
                    }[] = [];
                    if (
                        !_.isEmpty(
                            this.selectedStudyMutationEnrichmentProfileMap
                                .result
                        )
                    ) {
                        molecularProfileCaseIdentifiers = molecularProfileCaseIdentifiers.concat(
                            group.samples.map(sample => ({
                                caseId: this.usePatientLevelEnrichments
                                    ? sample.patientId
                                    : sample.sampleId,
                                molecularProfileId: this
                                    .selectedStudyMutationEnrichmentProfileMap
                                    .result![sample.studyId].molecularProfileId,
                            }))
                        );
                    }
                    if (
                        !_.isEmpty(
                            this.selectedStudyCopyNumberEnrichmentProfileMap
                                .result
                        )
                    ) {
                        molecularProfileCaseIdentifiers = molecularProfileCaseIdentifiers.concat(
                            group.samples.map(sample => ({
                                caseId: this.usePatientLevelEnrichments
                                    ? sample.patientId
                                    : sample.sampleId,
                                molecularProfileId: this
                                    .selectedStudyCopyNumberEnrichmentProfileMap
                                    .result![sample.studyId].molecularProfileId,
                            }))
                        );
                    }
                    return {
                        name: group.name,
                        molecularProfileCaseIdentifiers,
                    };
                })
            );
        },
    });

    public readonly alterationsEnrichmentData = makeEnrichmentDataPromise({
        await: () => [this.alterationsEnrichmentDataRequestGroups],
        resultsViewPageStore: this.resultsViewStore,
        getSelectedProfileMaps: () => [
            this.selectedStudyMutationEnrichmentProfileMap.result!,
            this.selectedStudyCopyNumberEnrichmentProfileMap.result!,
        ],
        referenceGenesPromise: this.hugoGeneSymbolToReferenceGene,
        fetchData: () => {
            if (
                this.alterationsEnrichmentDataRequestGroups.result &&
                this.alterationsEnrichmentDataRequestGroups.result.length > 1 &&
                (_(this.selectedMutationEnrichmentEventTypes)
                    .values()
                    .some() ||
                    _(this.selectedCopyNumberEnrichmentEventTypes)
                        .values()
                        .some())
            ) {
                return internalClient.fetchAlterationEnrichmentsUsingPOST({
                    enrichmentType: this.usePatientLevelEnrichments
                        ? 'PATIENT'
                        : 'SAMPLE',
                    groupsAndAlterationTypes: {
                        molecularProfileCasesGroupFilter: this
                            .alterationsEnrichmentDataRequestGroups.result!,
                        alterationEventTypes: {
                            copyNumberAlterationEventTypes: this
                                .selectedCopyNumberEnrichmentEventTypes,
                            mutationEventTypes: this
                                .selectedMutationEnrichmentEventTypes,
                        },
                    },
                });
            } else {
                return Promise.resolve([]);
            }
        },
    });

    private getCopyNumberEnrichmentData(
        groups: MolecularProfileCasesGroupFilter[],
        copyNumberEventType: 'HOMDEL' | 'AMP'
    ): Promise<AlterationEnrichment[]> {
        return internalClient.fetchCopyNumberEnrichmentsUsingPOST({
            copyNumberEventType: copyNumberEventType,
            enrichmentType: this.usePatientLevelEnrichments
                ? 'PATIENT'
                : 'SAMPLE',
            groups,
        });
    }

    readonly mrnaEnrichmentAnalysisGroups = remoteData({
        await: () => [
            this.selectedmRNAEnrichmentProfileMap,
            this.enrichmentAnalysisGroups,
        ],
        invoke: () => {
            let studyIds = Object.keys(
                this.selectedmRNAEnrichmentProfileMap.result!
            );
            // assumes single study for now
            if (studyIds.length === 1) {
                return Promise.resolve(
                    this.enrichmentAnalysisGroups.result!.reduce(
                        (acc: EnrichmentAnalysisComparisonGroup[], group) => {
                            // filter samples having mutation profile
                            const filteredSamples = group.samples.filter(
                                sample =>
                                    this.selectedmRNAEnrichmentProfileMap
                                        .result![sample.studyId] !== undefined
                            );
                            if (filteredSamples.length > 0) {
                                acc.push({
                                    ...group,
                                    count: filteredSamples.length,
                                    samples: filteredSamples,
                                    description: `samples in ${group.name}`,
                                });
                            }
                            return acc;
                        },
                        []
                    )
                );
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly mrnaEnrichmentDataRequestGroups = remoteData({
        await: () => [
            this.mrnaEnrichmentAnalysisGroups,
            this.selectedmRNAEnrichmentProfileMap,
        ],
        invoke: () => {
            return Promise.resolve(
                this.mrnaEnrichmentAnalysisGroups.result!.map(group => {
                    const molecularProfileCaseIdentifiers = group.samples.map(
                        sample => ({
                            caseId: sample.sampleId,
                            molecularProfileId: this
                                .selectedmRNAEnrichmentProfileMap.result![
                                sample.studyId
                            ].molecularProfileId,
                        })
                    );
                    return {
                        name: group.name,
                        molecularProfileCaseIdentifiers,
                    };
                })
            );
        },
    });

    readonly mRNAEnrichmentData = makeEnrichmentDataPromise({
        await: () => [this.mrnaEnrichmentDataRequestGroups],
        getSelectedProfileMaps: () => [
            // returns an empty array if the selected study doesn't have any mRNA profiles
            this.selectedmRNAEnrichmentProfileMap.result!,
        ],
        referenceGenesPromise: this.hugoGeneSymbolToReferenceGene,
        fetchData: () => {
            if (
                this.mrnaEnrichmentDataRequestGroups.result &&
                this.mrnaEnrichmentDataRequestGroups.result.length > 1
            ) {
                return internalClient.fetchGenomicEnrichmentsUsingPOST({
                    enrichmentType: 'SAMPLE',
                    groups: this.mrnaEnrichmentDataRequestGroups.result!,
                });
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly proteinEnrichmentAnalysisGroups = remoteData({
        await: () => [
            this.selectedProteinEnrichmentProfileMap,
            this.enrichmentAnalysisGroups,
        ],
        invoke: () => {
            let studyIds = Object.keys(
                this.selectedProteinEnrichmentProfileMap.result!
            );
            // assumes single study for now
            if (studyIds.length === 1) {
                return Promise.resolve(
                    this.enrichmentAnalysisGroups.result!.reduce(
                        (acc: EnrichmentAnalysisComparisonGroup[], group) => {
                            // filter samples having mutation profile
                            const filteredSamples = group.samples.filter(
                                sample =>
                                    this.selectedProteinEnrichmentProfileMap
                                        .result![sample.studyId] !== undefined
                            );
                            if (filteredSamples.length > 0) {
                                acc.push({
                                    ...group,
                                    count: filteredSamples.length,
                                    samples: filteredSamples,
                                    description: `samples in ${group.name}`,
                                });
                            }
                            return acc;
                        },
                        []
                    )
                );
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly proteinEnrichmentDataRequestGroups = remoteData({
        await: () => [
            this.proteinEnrichmentAnalysisGroups,
            this.selectedProteinEnrichmentProfileMap,
        ],
        invoke: () => {
            return Promise.resolve(
                this.proteinEnrichmentAnalysisGroups.result!.map(group => {
                    const molecularProfileCaseIdentifiers = group.samples.map(
                        sample => ({
                            caseId: sample.sampleId,
                            molecularProfileId: this
                                .selectedProteinEnrichmentProfileMap.result![
                                sample.studyId
                            ].molecularProfileId,
                        })
                    );
                    return {
                        name: group.name,
                        molecularProfileCaseIdentifiers,
                    };
                })
            );
        },
    });

    readonly proteinEnrichmentData = makeEnrichmentDataPromise({
        await: () => [this.proteinEnrichmentDataRequestGroups],
        referenceGenesPromise: this.hugoGeneSymbolToReferenceGene,
        getSelectedProfileMaps: () => [
            // returns an empty array if the selected study doesn't have any protein profiles
            this.selectedProteinEnrichmentProfileMap.result!,
        ],
        fetchData: () => {
            if (
                this.proteinEnrichmentDataRequestGroups.result &&
                this.proteinEnrichmentDataRequestGroups.result.length > 1
            ) {
                return internalClient.fetchGenomicEnrichmentsUsingPOST({
                    enrichmentType: 'SAMPLE',
                    groups: this.proteinEnrichmentDataRequestGroups.result!,
                });
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly methylationEnrichmentAnalysisGroups = remoteData({
        await: () => [
            this.selectedMethylationEnrichmentProfileMap,
            this.enrichmentAnalysisGroups,
        ],
        invoke: () => {
            let studyIds = Object.keys(
                this.selectedMethylationEnrichmentProfileMap.result!
            );
            // assumes single study for now
            if (studyIds.length === 1) {
                return Promise.resolve(
                    this.enrichmentAnalysisGroups.result!.reduce(
                        (acc: EnrichmentAnalysisComparisonGroup[], group) => {
                            // filter samples having mutation profile
                            const filteredSamples = group.samples.filter(
                                sample =>
                                    this.selectedMethylationEnrichmentProfileMap
                                        .result![sample.studyId] !== undefined
                            );
                            if (filteredSamples.length > 0) {
                                acc.push({
                                    ...group,
                                    count: filteredSamples.length,
                                    samples: filteredSamples,
                                    description: `samples in ${group.name}`,
                                });
                            }
                            return acc;
                        },
                        []
                    )
                );
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly methylationEnrichmentDataRequestGroups = remoteData({
        await: () => [
            this.methylationEnrichmentAnalysisGroups,
            this.selectedMethylationEnrichmentProfileMap,
        ],
        invoke: () => {
            return Promise.resolve(
                this.methylationEnrichmentAnalysisGroups.result!.map(group => {
                    const molecularProfileCaseIdentifiers = group.samples.map(
                        sample => ({
                            caseId: sample.sampleId,
                            molecularProfileId: this
                                .selectedMethylationEnrichmentProfileMap
                                .result![sample.studyId].molecularProfileId,
                        })
                    );
                    return {
                        name: group.name,
                        molecularProfileCaseIdentifiers,
                    };
                })
            );
        },
    });

    readonly methylationEnrichmentData = makeEnrichmentDataPromise({
        await: () => [this.methylationEnrichmentDataRequestGroups],
        referenceGenesPromise: this.hugoGeneSymbolToReferenceGene,
        getSelectedProfileMaps: () => [
            // returns an empty array if the selected study doesn't have any methylation profiles
            this.selectedMethylationEnrichmentProfileMap.result!,
        ],
        fetchData: () => {
            if (
                this.methylationEnrichmentDataRequestGroups.result &&
                this.methylationEnrichmentDataRequestGroups.result.length > 1
            ) {
                return internalClient.fetchGenomicEnrichmentsUsingPOST({
                    enrichmentType: 'SAMPLE',
                    groups: this.methylationEnrichmentDataRequestGroups.result!,
                });
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly gaEnrichmentGroupsByAssayType = remoteData({
        await: () => [
            this
                .selectedGenericAssayEnrichmentProfileMapGroupedByGenericAssayType,
            this.enrichmentAnalysisGroups,
        ],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    this
                        .selectedGenericAssayEnrichmentProfileMapGroupedByGenericAssayType
                        .result!,
                    selectedGenericAssayEnrichmentProfileMap => {
                        let studyIds = Object.keys(
                            selectedGenericAssayEnrichmentProfileMap
                        );
                        // assumes single study for now
                        if (studyIds.length === 1) {
                            return this.enrichmentAnalysisGroups.result!.reduce(
                                (
                                    acc: EnrichmentAnalysisComparisonGroup[],
                                    group
                                ) => {
                                    // filter samples having mutation profile
                                    const filteredSamples = group.samples.filter(
                                        sample =>
                                            selectedGenericAssayEnrichmentProfileMap[
                                                sample.studyId
                                            ] !== undefined
                                    );
                                    if (filteredSamples.length > 0) {
                                        acc.push({
                                            ...group,
                                            count: filteredSamples.length,
                                            samples: filteredSamples,
                                            description: `samples in ${group.name}`,
                                        });
                                    }
                                    return acc;
                                },
                                []
                            );
                        } else {
                            return [];
                        }
                    }
                )
            );
        },
    });

    readonly gaEnrichmentDataQueryByAssayType = remoteData({
        await: () => [
            this.gaEnrichmentGroupsByAssayType,
            this
                .selectedGenericAssayEnrichmentProfileMapGroupedByGenericAssayType,
        ],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    this.gaEnrichmentGroupsByAssayType.result!,
                    (
                        genericAssayEnrichmentAnalysisGroups,
                        genericAssayType
                    ) => {
                        return genericAssayEnrichmentAnalysisGroups.map(
                            group => {
                                const molecularProfileCaseIdentifiers = group.samples.map(
                                    sample => ({
                                        caseId: sample.sampleId,
                                        molecularProfileId: this
                                            .selectedGenericAssayEnrichmentProfileMapGroupedByGenericAssayType
                                            .result![genericAssayType][
                                            sample.studyId
                                        ].molecularProfileId,
                                    })
                                );
                                return {
                                    name: group.name,
                                    molecularProfileCaseIdentifiers,
                                };
                            }
                        );
                    }
                )
            );
        },
    });

    readonly gaEnrichmentDataByAssayType = remoteData({
        await: () => [this.gaEnrichmentDataQueryByAssayType],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    this.gaEnrichmentDataQueryByAssayType.result!,
                    (
                        genericAssayEnrichmentDataRequestGroups,
                        genericAssayType
                    ) => {
                        return makeGenericAssayEnrichmentDataPromise({
                            await: () => [],
                            getSelectedProfileMap: () =>
                                this
                                    .selectedGenericAssayEnrichmentProfileMapGroupedByGenericAssayType
                                    .result![genericAssayType], // returns an empty array if the selected study doesn't have any generic assay profiles
                            fetchData: () => {
                                if (
                                    genericAssayEnrichmentDataRequestGroups &&
                                    genericAssayEnrichmentDataRequestGroups.length >
                                        1
                                ) {
                                    return internalClient.fetchGenericAssayEnrichmentsUsingPOST(
                                        {
                                            enrichmentType: 'SAMPLE',
                                            groups: genericAssayEnrichmentDataRequestGroups,
                                        }
                                    );
                                } else {
                                    return Promise.resolve([]);
                                }
                            },
                        });
                    }
                )
            );
        },
    });

    @computed get survivalTabShowable() {
        return (
            this.survivalClinicalDataExists.isComplete &&
            this.survivalClinicalDataExists.result
        );
    }

    @computed get showSurvivalTab() {
        return !!(
            this.survivalTabShowable ||
            (this.activeGroups.isComplete &&
                this.activeGroups.result!.length === 0 &&
                this.tabHasBeenShown.get(GroupComparisonTab.SURVIVAL))
        );
    }

    @computed get survivalTabUnavailable() {
        // grey out if more than 10 active groups
        return (
            (this.activeGroups.isComplete &&
                this.activeGroups.result.length > 10) ||
            !this.survivalTabShowable
        );
    }

    @computed get clinicalTabUnavailable() {
        // grey out if active groups is less than 2
        return (
            this.activeGroups.isComplete && this.activeGroups.result.length < 2
        );
    }

    @computed get mRNATabShowable() {
        return (
            this.mRNAEnrichmentProfiles.isComplete &&
            this.mRNAEnrichmentProfiles.result!.length > 0
        );
    }

    @computed get showMRNATab() {
        return !!(
            this.mRNATabShowable ||
            (this.activeGroups.isComplete &&
                this.activeGroups.result!.length === 0 &&
                this.tabHasBeenShown.get(GroupComparisonTab.MRNA))
        );
    }

    @computed get mRNATabUnavailable() {
        return (
            (this.activeGroups.isComplete &&
                this.activeGroups.result.length < 2) || //less than two active groups
            (this.activeStudyIds.isComplete &&
                this.activeStudyIds.result.length > 1) || //more than one active study
            !this.mRNATabShowable
        );
    }

    @computed get proteinTabShowable() {
        return (
            this.proteinEnrichmentProfiles.isComplete &&
            this.proteinEnrichmentProfiles.result!.length > 0
        );
    }

    @computed get showProteinTab() {
        return !!(
            this.proteinTabShowable ||
            (this.activeGroups.isComplete &&
                this.activeGroups.result!.length === 0 &&
                this.tabHasBeenShown.get(GroupComparisonTab.PROTEIN))
        );
    }

    @computed get proteinTabUnavailable() {
        return (
            (this.activeGroups.isComplete &&
                this.activeGroups.result.length < 2) || //less than two active groups
            (this.activeStudyIds.isComplete &&
                this.activeStudyIds.result.length > 1) || //more than one active study
            !this.proteinTabShowable
        );
    }

    @computed get methylationTabShowable() {
        return (
            this.methylationEnrichmentProfiles.isComplete &&
            this.methylationEnrichmentProfiles.result!.length > 0
        );
    }

    @computed get showMethylationTab() {
        return !!(
            this.methylationTabShowable ||
            (this.activeGroups.isComplete &&
                this.activeGroups.result!.length === 0 &&
                this.tabHasBeenShown.get(GroupComparisonTab.DNAMETHYLATION))
        );
    }

    @computed get methylationTabUnavailable() {
        return (
            (this.activeGroups.isComplete &&
                this.activeGroups.result.length < 2) || //less than two active groups
            (this.activeStudyIds.isComplete &&
                this.activeStudyIds.result.length > 1) || //more than one active study
            !this.methylationTabShowable
        );
    }

    @computed get alterationsTabShowable() {
        return (
            this.mutationEnrichmentProfiles.isComplete &&
            this.copyNumberEnrichmentProfiles.isComplete &&
            (this.mutationEnrichmentProfiles.result!.length > 0 ||
                this.copyNumberEnrichmentProfiles.result!.length > 0)
        );
    }

    @computed get showAlterationsTab() {
        return !!(
            this.alterationsTabShowable ||
            (this.activeGroups.isComplete &&
                this.activeGroups.result!.length === 0 &&
                this.tabHasBeenShown.get(GroupComparisonTab.ALTERATIONS))
        );
    }

    @computed get alterationsTabUnavailable() {
        return (
            (this.activeGroups.isComplete &&
                this.activeGroups.result.length < 2) || //less than two active groups
            (this.activeStudyIds.isComplete &&
                this.activeStudyIds.result.length > 1) || //more than one active study
            !this.alterationsTabShowable
        );
    }

    @computed get genericAssayTabShowable() {
        return (
            this.genericAssayEnrichmentProfilesGroupedByGenericAssayType
                .isComplete &&
            _.size(
                this.genericAssayEnrichmentProfilesGroupedByGenericAssayType
                    .result!
            ) > 0
        );
    }

    @computed get showGenericAssayTab() {
        return !!(
            this.genericAssayTabShowable ||
            (this.activeGroups.isComplete &&
                this.activeGroups.result!.length === 0 &&
                this.tabHasBeenShown.get(
                    GroupComparisonTab.GENERIC_ASSAY_PREFIX
                ))
        );
    }

    @computed get genericAssayTabUnavailable() {
        return (
            (this.activeGroups.isComplete &&
                this.activeGroups.result.length < 2) || //less than two active groups
            (this.activeStudyIds.isComplete &&
                this.activeStudyIds.result.length > 1) || //more than one active study
            !this.genericAssayTabShowable
        );
    }

    public readonly sampleMap = remoteData({
        await: () => [this.samples],
        invoke: () => {
            const sampleSet = new ComplexKeyMap<Sample>();
            for (const sample of this.samples.result!) {
                sampleSet.set(
                    { studyId: sample.studyId, sampleId: sample.sampleId },
                    sample
                );
            }
            return Promise.resolve(sampleSet);
        },
    });

    readonly patientKeys = remoteData({
        await: () => [this.samples],
        invoke: () => {
            return Promise.resolve(
                _.uniq(this.samples.result!.map(s => s.uniquePatientKey))
            );
        },
    });

    public readonly patientToSamplesSet = remoteData({
        await: () => [this.samples],
        invoke: () => {
            const ret = new ComplexKeyGroupsMap<Sample>();
            for (const sample of this.samples.result!) {
                ret.add(
                    { studyId: sample.studyId, patientId: sample.patientId },
                    sample
                );
            }
            return Promise.resolve(ret);
        },
    });

    public readonly patientKeyToSamples = remoteData({
        await: () => [this.samples],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(
                    this.samples.result!,
                    sample => sample.uniquePatientKey
                )
            );
        },
    });

    public readonly sampleKeyToSample = remoteData({
        await: () => [this.samples],
        invoke: () => {
            let sampleSet = _.reduce(
                this.samples.result!,
                (acc, sample) => {
                    acc[sample.uniqueSampleKey] = sample;
                    return acc;
                },
                {} as { [uniqueSampleKey: string]: Sample }
            );
            return Promise.resolve(sampleSet);
        },
    });

    public readonly sampleKeyToGroups = remoteData({
        await: () => [this._originalGroups, this.sampleMap],
        invoke: () => {
            const sampleSet = this.sampleMap.result!;
            const groups = this._originalGroups.result!;
            const ret: {
                [uniqueSampleKey: string]: { [groupUid: string]: boolean };
            } = {};
            for (const group of groups) {
                for (const studyObject of group.studies) {
                    const studyId = studyObject.id;
                    for (const sampleId of studyObject.samples) {
                        const sample = sampleSet.get({ sampleId, studyId });
                        if (sample) {
                            ret[sample.uniqueSampleKey] =
                                ret[sample.uniqueSampleKey] || {};
                            ret[sample.uniqueSampleKey][group.uid] = true;
                        }
                    }
                }
            }
            return Promise.resolve(ret);
        },
    });

    public readonly patientsVennPartition = remoteData({
        await: () => [
            this._activeGroupsNotOverlapRemoved,
            this.patientToSamplesSet,
            this.activePatientKeysNotOverlapRemoved,
        ],
        invoke: () => {
            const patientToSamplesSet = this.patientToSamplesSet.result!;
            return Promise.resolve(
                partitionCasesByGroupMembership(
                    this._activeGroupsNotOverlapRemoved.result!,
                    group => getPatientIdentifiers([group]),
                    patientIdentifier =>
                        patientToSamplesSet.get({
                            studyId: patientIdentifier.studyId,
                            patientId: patientIdentifier.patientId,
                        })![0].uniquePatientKey,
                    this.activePatientKeysNotOverlapRemoved.result!
                ) as { key: { [uid: string]: boolean }; value: string[] }[]
            );
        },
    });

    readonly survivalClinicalDataExists = remoteData<boolean>({
        await: () => [
            this.activeSamplesNotOverlapRemoved,
            this.survivalClinicalAttributesPrefix,
        ],
        invoke: () =>
            fetchSurvivalDataExists(
                this.activeSamplesNotOverlapRemoved.result!,
                this.survivalClinicalAttributesPrefix.result!
            ),
    });

    readonly survivalClinicalData = remoteData<ClinicalData[]>(
        {
            await: () => [
                this.activeSamplesNotOverlapRemoved,
                this.survivalClinicalAttributesPrefix,
            ],
            invoke: () => {
                if (this.activeSamplesNotOverlapRemoved.result!.length === 0) {
                    return Promise.resolve([]);
                }
                const attributeNames: string[] = _.reduce(
                    this.survivalClinicalAttributesPrefix.result!,
                    (attributeNames, prefix: string) => {
                        attributeNames.push(prefix + '_STATUS');
                        attributeNames.push(prefix + '_MONTHS');
                        return attributeNames;
                    },
                    [] as string[]
                );

                if (attributeNames.length === 0) {
                    return Promise.resolve([]);
                }
                const filter: ClinicalDataMultiStudyFilter = {
                    attributeIds: attributeNames,
                    identifiers: this.activeSamplesNotOverlapRemoved.result!.map(
                        (s: any) => ({
                            entityId: s.patientId,
                            studyId: s.studyId,
                        })
                    ),
                };
                return client.fetchClinicalDataUsingPOST({
                    clinicalDataType: 'PATIENT',
                    clinicalDataMultiStudyFilter: filter,
                });
            },
        },
        []
    );

    readonly activeStudiesClinicalAttributes = remoteData<ClinicalAttribute[]>(
        {
            await: () => [this.activeStudyIds],
            invoke: () => {
                if (this.activeStudyIds.result!.length === 0) {
                    return Promise.resolve([]);
                }
                return client.fetchClinicalAttributesUsingPOST({
                    studyIds: this.activeStudyIds.result!,
                });
            },
        },
        []
    );

    readonly survivalClinicalAttributesPrefix = remoteData({
        await: () => [this.activeStudiesClinicalAttributes],
        invoke: () => {
            return Promise.resolve(
                getSurvivalClinicalAttributesPrefix(
                    this.activeStudiesClinicalAttributes.result!
                )
            );
        },
    });

    readonly survivalClinicalDataGroupByUniquePatientKey = remoteData<{
        [key: string]: ClinicalData[];
    }>({
        await: () => [this.survivalClinicalData],
        invoke: async () => {
            return _.groupBy(
                this.survivalClinicalData.result,
                'uniquePatientKey'
            );
        },
    });

    readonly patientSurvivals = remoteData<{
        [prefix: string]: PatientSurvival[];
    }>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.activePatientKeysNotOverlapRemoved,
            this.survivalClinicalAttributesPrefix,
        ],
        invoke: () => {
            return Promise.resolve(
                _.reduce(
                    this.survivalClinicalAttributesPrefix.result!,
                    (acc, key) => {
                        acc[key] = getPatientSurvivals(
                            this.survivalClinicalDataGroupByUniquePatientKey
                                .result!,
                            this.activePatientKeysNotOverlapRemoved.result!,
                            `${key}_STATUS`,
                            `${key}_MONTHS`,
                            s => getSurvivalStatusBoolean(s, key)
                        );
                        return acc;
                    },
                    {} as { [prefix: string]: PatientSurvival[] }
                )
            );
        },
    });

    readonly patientSurvivalUniqueStatusText = remoteData<{
        [prefix: string]: string[];
    }>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.activePatientKeysNotOverlapRemoved,
            this.survivalClinicalAttributesPrefix,
        ],
        invoke: () => {
            return Promise.resolve(
                _.reduce(
                    this.survivalClinicalAttributesPrefix.result!,
                    (acc, key) => {
                        const clinicalDataOfPatientSurvivalStatus = getClinicalDataOfPatientSurvivalStatus(
                            this.survivalClinicalDataGroupByUniquePatientKey
                                .result!,
                            this.activePatientKeysNotOverlapRemoved.result!,
                            `${key}_STATUS`,
                            `${key}_MONTHS`
                        );
                        acc[key] = _.chain(clinicalDataOfPatientSurvivalStatus)
                            .map(clinicalData => clinicalData.value)
                            .uniq()
                            .value();
                        return acc;
                    },
                    {} as { [prefix: string]: string[] }
                )
            );
        },
    });

    readonly uidToGroup = remoteData({
        await: () => [this._originalGroups],
        invoke: () => {
            return Promise.resolve(
                _.keyBy(this._originalGroups.result!, group => group.uid)
            );
        },
    });

    public readonly clinicalDataEnrichments = remoteData(
        {
            await: () => [this.activeGroups],
            invoke: () => {
                if (this.clinicalTabUnavailable) {
                    return Promise.resolve([]);
                }
                let groups: Group[] = _.map(this.activeGroups.result, group => {
                    const sampleIdentifiers = [];
                    for (const studySpec of group.studies) {
                        const studyId = studySpec.id;
                        for (const sampleId of studySpec.samples) {
                            sampleIdentifiers.push({
                                studyId,
                                sampleId,
                            });
                        }
                    }
                    return {
                        name: group.nameWithOrdinal || group.uid,
                        sampleIdentifiers: sampleIdentifiers,
                    };
                });
                if (groups.length > 1) {
                    return internalClient.fetchClinicalEnrichmentsUsingPOST({
                        groupFilter: {
                            groups: groups,
                        },
                    });
                } else {
                    return Promise.resolve([]);
                }
            },
            onError: () => {
                // suppress failsafe error handler
            },
        },
        []
    );

    readonly clinicalDataEnrichmentsWithQValues = remoteData<
        ClinicalDataEnrichmentWithQ[]
    >(
        {
            await: () => [this.clinicalDataEnrichments],
            invoke: () => {
                const clinicalDataEnrichments = this.clinicalDataEnrichments
                    .result!;
                const sortedByPvalue = _.sortBy(
                    clinicalDataEnrichments,
                    c => c.pValue
                );
                const qValues = calculateQValues(
                    sortedByPvalue.map(c => c.pValue)
                );
                qValues.forEach((qValue, index) => {
                    (sortedByPvalue[
                        index
                    ] as ClinicalDataEnrichmentWithQ).qValue = qValue;
                });
                return Promise.resolve(
                    sortedByPvalue as ClinicalDataEnrichmentWithQ[]
                );
            },
            onError: () => {
                // suppress failsafe error handler
            },
        },
        []
    );

    readonly activeStudyIdToStudy = remoteData(
        {
            await: () => [this.studies, this.activeStudyIds],
            invoke: () =>
                Promise.resolve(
                    _.keyBy(
                        _.filter(this.studies.result, study =>
                            this.activeStudyIds.result!.includes(study.studyId)
                        ),
                        x => x.studyId
                    )
                ),
        },
        {}
    );

    readonly survivalXAxisLabelGroupByPrefix = remoteData({
        await: () => [
            this.activeStudiesClinicalAttributes,
            this.survivalClinicalAttributesPrefix,
        ],
        invoke: () => {
            const survivalXAxisLabelGroupByPrefix = _.reduce(
                this.survivalClinicalAttributesPrefix.result!,
                (acc, prefix) => {
                    const clinicalAttributeId = `${prefix}_MONTHS`;
                    const clinicalAttributes = _.filter(
                        this.activeStudiesClinicalAttributes.result,
                        attr => attr.clinicalAttributeId === clinicalAttributeId
                    );
                    if (clinicalAttributes.length > 0) {
                        const xLabels = clinicalAttributes.map(
                            attr => attr.displayName
                        );
                        // find the most common text as the label
                        // findFirstMostCommonElt require a sorted array as the input
                        acc[prefix] = findFirstMostCommonElt(xLabels.sort())!;
                    }
                    return acc;
                },
                {} as { [prefix: string]: string }
            );
            return Promise.resolve(survivalXAxisLabelGroupByPrefix);
        },
    });

    readonly survivalDescriptions = remoteData({
        await: () => [
            this.activeStudiesClinicalAttributes,
            this.activeStudyIdToStudy,
            this.survivalClinicalAttributesPrefix,
        ],
        invoke: () => {
            const survivalDescriptions = _.reduce(
                this.survivalClinicalAttributesPrefix.result!,
                (acc, prefix) => {
                    const clinicalAttributeId = `${prefix}_STATUS`;
                    const clinicalAttributes = _.filter(
                        this.activeStudiesClinicalAttributes.result,
                        attr => attr.clinicalAttributeId === clinicalAttributeId
                    );
                    if (clinicalAttributes.length > 0) {
                        clinicalAttributes.map(attr => {
                            if (!acc[prefix]) {
                                acc[prefix] = [];
                            }
                            acc[prefix].push({
                                studyName: this.activeStudyIdToStudy.result[
                                    attr.studyId
                                ].name,
                                description: attr.description,
                                displayName: attr.displayName,
                            } as ISurvivalDescription);
                        });
                    }
                    return acc;
                },
                {} as { [prefix: string]: ISurvivalDescription[] }
            );
            return Promise.resolve(survivalDescriptions);
        },
    });

    @autobind
    public getGroupsDownloadDataPromise() {
        return new Promise<string>(resolve => {
            onMobxPromise<any>(
                [this._originalGroups, this.samples, this.sampleKeyToGroups],
                (
                    groups: ComparisonGroup[],
                    samples: Sample[],
                    sampleKeyToGroups: {
                        [uniqueSampleKey: string]: {
                            [groupUid: string]: boolean;
                        };
                    }
                ) => {
                    resolve(
                        getGroupsDownloadData(
                            samples,
                            groups,
                            sampleKeyToGroups
                        )
                    );
                }
            );
        });
    }

    @computed get hasMutationEnrichmentData(): boolean {
        return (
            this.mutationEnrichmentProfiles.isComplete &&
            this.mutationEnrichmentProfiles.result!.length > 0
        );
    }

    @computed get hasCnaEnrichmentData(): boolean {
        return (
            this.copyNumberEnrichmentProfiles.isComplete &&
            this.copyNumberEnrichmentProfiles.result!.length > 0
        );
    }

    // TODO refactor when fusions have been reworked in cBioPortal backend
    @computed get hasFusionEnrichmentData(): boolean {
        return this.hasMutationEnrichmentData;
    }
}
