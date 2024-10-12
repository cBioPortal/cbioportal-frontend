import {
    findFirstMostCommonElt,
    MobxPromise,
    remoteData,
    toPromise,
} from 'cbioportal-frontend-commons';
import ComparisonStore, {
    ClinicalEventDataWithKey,
    OverlapStrategy,
} from 'shared/lib/comparison/ComparisonStore';
import { PatientSurvival } from 'shared/model/PatientSurvival';

import {
    ClinicalAttribute,
    ClinicalData,
    ClinicalDataMultiStudyFilter,
    SurvivalRequest,
} from 'cbioportal-ts-api-client';
import client from 'shared/api/cbioportalClientInstance';
import _, { Dictionary } from 'lodash';
import {
    action,
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
    reaction,
    toJS,
} from 'mobx';
import {
    CustomSurvivalPlots,
    getSurvivalPlotDescription,
    getSurvivalPlotName,
} from 'shared/lib/comparison/ComparisonStoreUtils';
import { getPatientSurvivals } from 'pages/resultsView/SurvivalStoreHelper';
import {
    calculateNumberOfPatients,
    generateSurvivalPlotTitleFromDisplayName,
    generateSurvivalPlotYAxisLabelFromDisplayName,
    getMedian,
    getSurvivalStatusBoolean,
    getSurvivalSummaries,
    sortPatientSurvivals,
} from 'pages/resultsView/survival/SurvivalUtil';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import {
    SurvivalChartType,
    SurvivalPrefixTableStore,
} from 'pages/resultsView/survival/SurvivalPrefixTable';
import { ISurvivalDescription } from 'pages/resultsView/survival/SurvivalDescriptionTable';
import {
    getPatientIdentifiers,
    showQueryUpdatedToast,
} from 'pages/studyView/StudyViewUtils';
import { getSurvivalClinicalAttributesPrefix } from 'shared/lib/StoreUtils';
import { blendColors } from './OverlapUtils';
import { logRankTest } from 'pages/resultsView/survival/logRankTest';
import { calculateQValues } from 'shared/lib/calculation/BenjaminiHochbergFDRCalculator';

export default class SurvivalPageStore {
    public parentStore: ComparisonStore;
    public customSurvivalDataPromises: {
        [id: string]: MobxPromise<ClinicalData[]>;
    } = {};
    private reactionDisposers: IReactionDisposer[] = [];

    @computed get isSessionLoaded() {
        return this.parentStore._session.isComplete;
    }

    constructor(parentStore: ComparisonStore) {
        makeObservable(this);
        this.parentStore = parentStore;
        this.reactionDisposers.push(
            reaction(
                () => this.isSessionLoaded,
                isComplete => {
                    if (isComplete) {
                        this.loadCustomSurvivalCharts();
                    }
                },
                { fireImmediately: true }
            )
        );
    }

    public destroy(): void {
        for (const disposer of this.reactionDisposers) {
            disposer();
        }
    }

    @observable customSurvivalPlots: CustomSurvivalPlots = {};

    @observable.ref chartName: string;

    @observable public adjustForLeftTruncation = true;

    @observable selectedSurvivalPlotPrefix: string | undefined = undefined;

    @observable
    public startEventPosition: 'FIRST' | 'LAST' = 'FIRST';

    @observable
    public endEventPosition: 'FIRST' | 'LAST' = 'FIRST';

    @observable
    public censoredEventPosition: 'FIRST' | 'LAST' = 'LAST';

    @observable
    public _selectedStartClinicalEventType: string | undefined = undefined;

    @observable
    public selectedStartClinicalEventAttributes: ClinicalEventDataWithKey[] = [];

    @observable
    public _selectedEndClinicalEventType: string | undefined = undefined;

    @observable
    public selectedEndClinicalEventAttributes: ClinicalEventDataWithKey[] = [];

    @observable
    public _selectedCensoredClinicalEventType: string | undefined = 'any';

    @observable
    public selectedCensoredClinicalEventAttributes: ClinicalEventDataWithKey[] = [];

    @action.bound
    public setSurvivalPlotPrefix(prefix: string | undefined) {
        this.selectedSurvivalPlotPrefix = prefix;
    }

    @action.bound
    public onStartClinicalEventSelection(option: any) {
        if (option !== null) {
            this._selectedStartClinicalEventType = option.value;
            this.selectedStartClinicalEventAttributes = [];
        } else {
            this._selectedStartClinicalEventType = undefined;
        }
    }

    @computed get selectedStartClinicalEventType() {
        if (this._selectedStartClinicalEventType !== undefined) {
            return this.parentStore.clinicalEventOptions.result[
                this._selectedStartClinicalEventType
            ];
        }
        return undefined;
    }

    @action.bound
    public onEndClinicalEventSelection(option: any) {
        if (option !== null) {
            this._selectedEndClinicalEventType = option.value;
            this.selectedEndClinicalEventAttributes = [];
        } else {
            this._selectedEndClinicalEventType = undefined;
        }
    }

    @computed get selectedEndClinicalEventType() {
        if (this._selectedEndClinicalEventType !== undefined) {
            return this.parentStore.clinicalEventOptions.result[
                this._selectedEndClinicalEventType
            ];
        }
        return undefined;
    }

    @action.bound
    public onCensoredClinicalEventSelection(option: any) {
        if (option !== null) {
            this._selectedCensoredClinicalEventType = option.value;
            this.selectedCensoredClinicalEventAttributes = [];
        } else {
            this._selectedCensoredClinicalEventType = 'any';
        }
    }

    @action.bound
    public onKMPlotNameChange(e: React.SyntheticEvent<HTMLInputElement>) {
        this.chartName = (e.target as HTMLInputElement).value;
    }

    @action.bound
    public resetSurvivalPlotSelection() {
        this.chartName = '';
        this._selectedStartClinicalEventType = undefined;
        this.startEventPosition = 'FIRST';
        this.selectedStartClinicalEventAttributes = [];
        this._selectedEndClinicalEventType = undefined;
        this.endEventPosition = 'FIRST';
        this.selectedEndClinicalEventAttributes = [];
        this._selectedCensoredClinicalEventType = 'any';
        this.censoredEventPosition = 'LAST';
        this.selectedCensoredClinicalEventAttributes = [];
    }

    @computed get selectedCensoredClinicalEventType() {
        if (this._selectedCensoredClinicalEventType !== undefined) {
            if (this._selectedCensoredClinicalEventType === 'any') {
                return {
                    label: 'any event',
                    value: 'any',
                    attributes: [],
                } as any;
            }
            return this.parentStore.clinicalEventOptions.result[
                this._selectedCensoredClinicalEventType
            ];
        }
        return undefined;
    }

    readonly survivalDescriptions = remoteData({
        await: () => [
            this.allSurvivalAttributes,
            this.parentStore.activeStudyIdToStudy,
            this.survivalClinicalAttributesPrefix,
        ],
        invoke: () => {
            const survivalDescriptions = _.reduce(
                this.survivalClinicalAttributesPrefix.result!,
                (acc, prefix) => {
                    const clinicalAttributeId = `${prefix}_STATUS`;
                    const clinicalAttributes = _.filter(
                        this.allSurvivalAttributes.result,
                        attr => attr.clinicalAttributeId === clinicalAttributeId
                    );
                    if (clinicalAttributes.length > 0) {
                        clinicalAttributes.map(attr => {
                            if (!acc[prefix]) {
                                acc[prefix] = [];
                            }
                            acc[prefix].push({
                                studyName: this.parentStore.activeStudyIdToStudy
                                    .result[attr.studyId].name,
                                description: attr.description,
                                displayName: attr.displayName,
                                chartType: _.keys(
                                    this.customSurvivalPlots
                                ).includes(prefix)
                                    ? SurvivalChartType.CUSTOM
                                    : SurvivalChartType.PREDEFINED,
                            } as ISurvivalDescription & { chartType: SurvivalChartType });
                        });
                    }
                    return acc;
                },
                {} as {
                    [prefix: string]: (ISurvivalDescription & {
                        chartType: SurvivalChartType;
                    })[];
                }
            );
            return Promise.resolve(survivalDescriptions);
        },
    });

    readonly survivalTitleByPrefix = remoteData(
        {
            await: () => [
                this.survivalClinicalAttributesPrefix,
                this.survivalDescriptions,
            ],
            invoke: () =>
                Promise.resolve(
                    this.survivalClinicalAttributesPrefix.result!.reduce(
                        (map, prefix) => {
                            // get survival plot titles
                            // use first display name as title
                            map[
                                prefix
                            ] = generateSurvivalPlotTitleFromDisplayName(
                                this.survivalDescriptions.result![prefix][0]
                                    .displayName
                            );
                            return map;
                        },
                        {} as { [prefix: string]: string }
                    )
                ),
        },
        {}
    );

    @computed get doesChartNameAlreadyExists() {
        return (
            this.chartName !== undefined &&
            this.chartName.length >= 0 &&
            _.values(this.survivalTitleByPrefix.result || {}).some(
                prefix =>
                    prefix.toLowerCase().trim() ===
                    this.chartName.toLowerCase().trim()
            )
        );
    }

    readonly predefinedSurvivalClinicalData = remoteData<ClinicalData[]>(
        {
            await: () => [
                this.parentStore.activeSamplesNotOverlapRemoved,
                this.parentStore.predefinedSurvivalClinicalAttributesPrefix,
            ],
            invoke: () => {
                if (
                    this.parentStore.activeSamplesNotOverlapRemoved.result!
                        .length === 0
                ) {
                    return Promise.resolve([]);
                }

                const attributeNames: string[] = _.reduce(
                    this.parentStore.predefinedSurvivalClinicalAttributesPrefix
                        .result!,
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
                    identifiers: this.parentStore.activeSamplesNotOverlapRemoved.result!.map(
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

    readonly survivalClinicalData = remoteData<ClinicalData[]>(
        {
            await: () => [
                this.parentStore.activeSamplesNotOverlapRemoved,
                this.predefinedSurvivalClinicalData,
                ..._.values(this.customSurvivalDataPromises),
            ],
            invoke: async () => {
                if (
                    this.parentStore.activeSamplesNotOverlapRemoved.result!
                        .length === 0
                ) {
                    return Promise.resolve([]);
                }
                let response: ClinicalData[] = [];
                if (_.keys(this.customSurvivalPlots).length > 0) {
                    response = _.chain(this.customSurvivalDataPromises)
                        .values()
                        .flatMap(x => x.result || [])
                        .value();
                }
                return [
                    ...this.predefinedSurvivalClinicalData.result,
                    ...response,
                ];
            },
        },
        []
    );

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

    @computed get isGeniebpcStudy() {
        if (this.parentStore.studies.result) {
            const studyIds = this.parentStore.studies.result.map(
                s => s.studyId
            );
            return (
                studyIds.length === 1 &&
                studyIds[0] === 'heme_onc_nsclc_genie_bpc'
            );
        }
        return false;
    }

    readonly survivalEntryMonths = remoteData<
        { [uniquePatientKey: string]: number } | undefined
    >({
        await: () => [this.parentStore.studies],
        invoke: async () => {
            const studyIds = this.parentStore.studies.result!.map(
                s => s.studyId
            );
            // Please note:
            // The left truncation adjustment is only available for one study: heme_onc_nsclc_genie_bpc at this time
            // clinical attributeId still need to be decided in the future
            if (
                this.isGeniebpcStudy &&
                this.parentStore.isLeftTruncationFeatureFlagEnabled
            ) {
                const data = await client.getAllClinicalDataInStudyUsingGET({
                    attributeId: 'TT_CPT_REPORT_MOS',
                    clinicalDataType: 'PATIENT',
                    studyId: studyIds[0],
                });
                return data.reduce(
                    (map: { [patientKey: string]: number }, next) => {
                        map[next.uniquePatientKey] = parseFloat(next.value);
                        return map;
                    },
                    {}
                );
            } else {
                return undefined;
            }
        },
    });

    readonly patientSurvivals = remoteData<{
        [prefix: string]: PatientSurvival[];
    }>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.parentStore.activePatientKeysNotOverlapRemoved,
            this.survivalClinicalAttributesPrefix,
            this.survivalEntryMonths,
        ],
        invoke: () => {
            return Promise.resolve(
                _.reduce(
                    this.survivalClinicalAttributesPrefix.result!,
                    (acc, key) => {
                        acc[key] = getPatientSurvivals(
                            this.survivalClinicalDataGroupByUniquePatientKey
                                .result!,
                            this.parentStore.activePatientKeysNotOverlapRemoved
                                .result!,
                            `${key}_STATUS`,
                            `${key}_MONTHS`,
                            s => getSurvivalStatusBoolean(s, key),
                            // Currently, left truncation is only appliable for Overall Survival data
                            this.adjustForLeftTruncation && key === 'OS'
                                ? this.survivalEntryMonths.result
                                : undefined
                        );
                        return acc;
                    },
                    {} as { [prefix: string]: PatientSurvival[] }
                )
            );
        },
    });

    @action.bound
    public addSurvivalRequest(
        startClinicalEventType: string,
        startEventPosition: 'FIRST' | 'LAST',
        startClinicalEventAttributes: ClinicalEventDataWithKey[],
        endClinicalEventType: string,
        endEventPosition: 'FIRST' | 'LAST',
        endClinicalEventAttributes: ClinicalEventDataWithKey[],
        censoredClinicalEventType: string,
        censoredEventPosition: 'FIRST' | 'LAST',
        censoredClinicalEventAttributes: ClinicalEventDataWithKey[],
        name: string
    ) {
        this.customSurvivalPlots[name] = {
            name,
            endEventRequestIdentifier: {
                clinicalEventRequests: [
                    {
                        attributes: endClinicalEventAttributes.map(x => ({
                            key: x.key,
                            value: x.value,
                        })),
                        eventType: endClinicalEventType,
                    },
                ],
                position: endEventPosition,
            },
            startEventRequestIdentifier: {
                clinicalEventRequests: [
                    {
                        attributes: startClinicalEventAttributes.map(x => ({
                            key: x.key,
                            value: x.value,
                        })),
                        eventType: startClinicalEventType,
                    },
                ],
                position: startEventPosition,
            },
            censoredEventRequestIdentifier: {
                clinicalEventRequests: [
                    {
                        attributes: censoredClinicalEventAttributes.map(x => ({
                            key: x.key,
                            value: x.value,
                        })),
                        eventType: censoredClinicalEventType,
                    },
                ],
                position: censoredEventPosition,
            },
        };

        if (!this.customSurvivalDataPromises.hasOwnProperty(name)) {
            this.customSurvivalDataPromises[name] = remoteData<ClinicalData[]>({
                await: () => {
                    return [this.parentStore.activeSamplesNotOverlapRemoved];
                },
                invoke: async () => {
                    const attr = this.customSurvivalPlots[name];
                    let censoredEventRequestIdentifier = toJS(
                        attr.censoredEventRequestIdentifier!
                    );
                    censoredEventRequestIdentifier.clinicalEventRequests =
                        censoredClinicalEventType !== 'any'
                            ? censoredEventRequestIdentifier.clinicalEventRequests
                            : [];

                    const survivalRequest = {
                        attributeIdPrefix: name,
                        startEventRequestIdentifier: attr.startEventRequestIdentifier!,
                        endEventRequestIdentifier: attr.endEventRequestIdentifier!,
                        censoredEventRequestIdentifier: censoredEventRequestIdentifier,
                        patientIdentifiers: this.parentStore.activeSamplesNotOverlapRemoved.result!.map(
                            (s: any) => ({
                                patientId: s.patientId,
                                studyId: s.studyId,
                            })
                        ),
                    };
                    let result = await internalClient.fetchSurvivalDataUsingPOST(
                        {
                            survivalRequest,
                        }
                    );
                    return result;
                },
                onError: () => {},
                default: [],
            });
        }
    }

    @action.bound
    public async onAddSurvivalPlot() {
        let chartName =
            this.chartName !== undefined && this.chartName.length > 0
                ? this.chartName
                : getSurvivalPlotName(
                      this._selectedStartClinicalEventType!,
                      this.selectedStartClinicalEventAttributes || [],
                      this.startEventPosition,
                      this._selectedEndClinicalEventType!,
                      this.selectedEndClinicalEventAttributes || [],
                      this.endEventPosition,
                      this._selectedCensoredClinicalEventType!,
                      this.selectedCensoredClinicalEventAttributes || [],
                      _.values(this.survivalTitleByPrefix.result || {})
                  );

        this.addSurvivalRequest(
            this._selectedStartClinicalEventType!,
            this.startEventPosition,
            this.selectedStartClinicalEventAttributes,
            this._selectedEndClinicalEventType!,
            this.endEventPosition,
            this.selectedEndClinicalEventAttributes,
            this._selectedCensoredClinicalEventType!,
            this.censoredEventPosition,
            this.selectedCensoredClinicalEventAttributes,
            chartName
        );

        await toPromise(this.customSurvivalDataPromises[chartName]);
        showQueryUpdatedToast(`Successfully added survival plot: ${chartName}`);

        this.setSurvivalPlotPrefix(chartName);
        this.updateCustomSurvivalPlots(this.customSurvivalPlots);
        this.chartName = '';
    }

    @computed get isAddSurvivalPlotDisabled() {
        return (
            this._selectedStartClinicalEventType === undefined ||
            this._selectedEndClinicalEventType === undefined ||
            this.doesChartNameAlreadyExists ||
            this.patientSurvivals.isPending
        );
    }

    public async updateCustomSurvivalPlots(
        customSurvivalPlots: CustomSurvivalPlots
    ) {
        const newSession = toJS(this.parentStore._session.result!);
        newSession.customSurvivalPlots = _.values(customSurvivalPlots) as any;

        // Need this to prevent page for reloading
        localStorage.setItem('preventPageReload', 'true');

        await this.parentStore.saveAndGoToSession(newSession);
    }

    @action.bound
    public removeCustomSurvivalPlot(prefix: string) {
        if (!_.isEmpty(this.customSurvivalPlots)) {
            delete this.customSurvivalPlots[prefix];
            delete this.customSurvivalDataPromises[prefix];
            this.updateCustomSurvivalPlots(toJS(this.customSurvivalPlots));
        }
    }

    @action.bound
    public toggleLeftTruncationSelection() {
        this.adjustForLeftTruncation = !this.adjustForLeftTruncation;
    }

    readonly isLeftTruncationAvailable = remoteData<boolean>({
        await: () => [this.survivalEntryMonths],
        invoke: async () => {
            return !!this.survivalEntryMonths.result;
        },
    });

    // patientSurvivalsWithoutLeftTruncation is used to compare with patient survival data with left truncation adjustment
    // This is used for generating information about how many patients get excluded by enabling left truncation adjustment
    readonly patientSurvivalsWithoutLeftTruncation = remoteData<{
        [prefix: string]: PatientSurvival[];
    }>({
        await: () => [
            this.survivalClinicalDataGroupByUniquePatientKey,
            this.parentStore.activePatientKeysNotOverlapRemoved,
            this.survivalClinicalAttributesPrefix,
            this.survivalEntryMonths,
        ],
        invoke: () => {
            return Promise.resolve(
                _.reduce(
                    this.survivalClinicalAttributesPrefix.result!,
                    (acc, key) => {
                        acc[key] = getPatientSurvivals(
                            this.survivalClinicalDataGroupByUniquePatientKey
                                .result!,
                            this.parentStore.activePatientKeysNotOverlapRemoved
                                .result!,
                            `${key}_STATUS`,
                            `${key}_MONTHS`,
                            s => getSurvivalStatusBoolean(s, key),
                            undefined
                        );
                        return acc;
                    },
                    {} as { [prefix: string]: PatientSurvival[] }
                )
            );
        },
    });

    readonly survivalXAxisLabelGroupByPrefix = remoteData({
        await: () => [
            this.allSurvivalAttributes,
            this.survivalClinicalAttributesPrefix,
        ],
        invoke: () => {
            const survivalXAxisLabelGroupByPrefix = _.reduce(
                this.survivalClinicalAttributesPrefix.result!,
                (acc, prefix) => {
                    const clinicalAttributeId = `${prefix}_MONTHS`;
                    const clinicalAttributes = _.filter(
                        this.allSurvivalAttributes.result,
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

    readonly allSurvivalAttributes = remoteData<ClinicalAttribute[]>(
        {
            await: () => [
                this.parentStore.predefinedSurvivalAttributes,
                this.parentStore.activeStudyIds,
            ],
            invoke: () => {
                const customAttributes = _.chain(toJS(this.customSurvivalPlots))
                    .flatMap((x, y) => {
                        return _.chain(
                            this.parentStore.activeStudyIds.result || []
                        )
                            .flatMap(studyId => {
                                const description = getSurvivalPlotDescription(
                                    x
                                );

                                var months_attribute: ClinicalAttribute = {
                                    clinicalAttributeId: x.name + '_MONTHS',
                                    datatype: 'NUMBER',
                                    description: `Survival in months ${description}`,
                                    displayName: `Survival (Months) ${x.name}`,
                                    patientAttribute: true,
                                    priority: '1',
                                    studyId: studyId,
                                };
                                var status_attribute: ClinicalAttribute = {
                                    clinicalAttributeId: x.name + '_STATUS',
                                    datatype: 'STRING',
                                    description: `${description}`,
                                    displayName: `Survival status ${x.name}`,
                                    patientAttribute: true,
                                    priority: '1',
                                    studyId: studyId,
                                };
                                return [months_attribute, status_attribute];
                            })
                            .value();
                    })
                    .value();

                return Promise.resolve([
                    ...this.parentStore.predefinedSurvivalAttributes.result!,
                    ...customAttributes,
                ]);
            },
        },
        []
    );

    readonly survivalClinicalAttributesPrefix = remoteData({
        await: () => [this.allSurvivalAttributes],
        invoke: () => {
            return Promise.resolve(
                getSurvivalClinicalAttributesPrefix(
                    this.allSurvivalAttributes.result!
                )
            );
        },
    });

    @action.bound
    private loadCustomSurvivalCharts(): void {
        const customSurvivalPlots: (Partial<SurvivalRequest> & {
            name: string;
        })[] =
            toJS(this.parentStore._session.result!.customSurvivalPlots) || [];
        _.forEach(customSurvivalPlots, plot => {
            this.addSurvivalRequest(
                plot.startEventRequestIdentifier!.clinicalEventRequests[0]
                    .eventType,
                plot.startEventRequestIdentifier!.position,
                plot.startEventRequestIdentifier!.clinicalEventRequests[0]
                    .attributes as ClinicalEventDataWithKey[],
                plot.endEventRequestIdentifier!.clinicalEventRequests[0]
                    .eventType,
                plot.endEventRequestIdentifier!.position,
                plot.endEventRequestIdentifier!.clinicalEventRequests[0]
                    .attributes as ClinicalEventDataWithKey[],
                plot.censoredEventRequestIdentifier!.clinicalEventRequests[0]
                    .eventType,
                plot.censoredEventRequestIdentifier!.position,
                plot.censoredEventRequestIdentifier!.clinicalEventRequests[0]
                    .attributes as ClinicalEventDataWithKey[],
                plot.name || ''
            );
        });
    }

    public readonly analysisGroupsComputations = remoteData({
        await: () => [
            this.parentStore.activeGroups,
            this.parentStore.patientsVennPartition,
            this.parentStore.uidToGroup,
            this.parentStore.patientToSamplesSet,
        ],
        invoke: () => {
            const orderedActiveGroupUidSet = _.reduce(
                this.parentStore._activeGroupsNotOverlapRemoved.result!,
                (acc, next, index) => {
                    acc[next.uid] = index;
                    return acc;
                },
                {} as { [id: string]: number }
            );
            const partition = this.parentStore.patientsVennPartition.result!;

            // ascending sort partition bases on number of groups in each parition.
            // if they are equal then sort based on the give order of groups
            partition.sort((a, b) => {
                const aUids = Object.keys(a.key).filter(uid => a.key[uid]);
                const bUids = Object.keys(b.key).filter(uid => b.key[uid]);
                if (aUids.length !== bUids.length) {
                    return aUids.length - bUids.length;
                }
                const aCount = _.sumBy(
                    aUids,
                    uid => orderedActiveGroupUidSet[uid]
                );
                const bCount = _.sumBy(
                    bUids,
                    uid => orderedActiveGroupUidSet[uid]
                );
                return aCount - bCount;
            });
            const uidToGroup = this.parentStore.uidToGroup.result!;
            const analysisGroups = [];
            const patientToAnalysisGroups: {
                [patientKey: string]: string[];
            } = {};

            if (this.parentStore.overlapStrategy === OverlapStrategy.INCLUDE) {
                for (const entry of partition) {
                    const partitionGroupUids = Object.keys(entry.key).filter(
                        uid => entry.key[uid]
                    );
                    // sort by give order of groups
                    partitionGroupUids.sort(
                        (a, b) =>
                            orderedActiveGroupUidSet[a] -
                            orderedActiveGroupUidSet[b]
                    );
                    if (partitionGroupUids.length > 0) {
                        const name = `Only ${partitionGroupUids
                            .map(uid => uidToGroup[uid].nameWithOrdinal)
                            .join(', ')}`;
                        const value = partitionGroupUids.join(',');
                        for (const patientKey of entry.value) {
                            patientToAnalysisGroups[patientKey] = [value];
                        }
                        analysisGroups.push({
                            name,
                            color: blendColors(
                                partitionGroupUids.map(
                                    uid => uidToGroup[uid].color
                                )
                            ),
                            value,
                            legendText: JSON.stringify(partitionGroupUids),
                        });
                    }
                }
            } else {
                const patientToSamplesSet = this.parentStore.patientToSamplesSet
                    .result!;
                for (const group of this.parentStore.activeGroups.result!) {
                    const name = group.nameWithOrdinal;
                    analysisGroups.push({
                        name,
                        color: group.color,
                        value: group.uid,
                        legendText: group.uid,
                    });
                    const patientIdentifiers = getPatientIdentifiers([group]);
                    for (const identifier of patientIdentifiers) {
                        const samples = patientToSamplesSet.get({
                            studyId: identifier.studyId,
                            patientId: identifier.patientId,
                        });
                        if (samples && samples.length) {
                            patientToAnalysisGroups[
                                samples[0].uniquePatientKey
                            ] = [group.uid];
                        }
                    }
                }
            }
            return Promise.resolve({
                analysisGroups,
                patientToAnalysisGroups,
            });
        },
    });

    readonly sortedGroupedSurvivals = remoteData<{
        [prefix: string]: { [analysisGroup: string]: PatientSurvival[] };
    }>({
        await: () => [this.analysisGroupsComputations, this.patientSurvivals],
        invoke: () => {
            const patientToAnalysisGroups = this.analysisGroupsComputations
                .result!.patientToAnalysisGroups;
            const survivalsByPrefixByAnalysisGroup = _.mapValues(
                this.patientSurvivals.result!,
                survivals =>
                    _.reduce(
                        survivals,
                        (map, nextSurv) => {
                            if (
                                nextSurv.uniquePatientKey in
                                patientToAnalysisGroups
                            ) {
                                // only include this data if theres an analysis group (curve) to put it in
                                const groups =
                                    patientToAnalysisGroups[
                                        nextSurv.uniquePatientKey
                                    ];
                                groups.forEach(group => {
                                    map[group] = map[group] || [];
                                    map[group].push(nextSurv);
                                });
                            }
                            return map;
                        },
                        {} as { [groupValue: string]: PatientSurvival[] }
                    )
            );

            return Promise.resolve(
                _.mapValues(
                    survivalsByPrefixByAnalysisGroup,
                    survivalsByAnalysisGroup =>
                        _.mapValues(survivalsByAnalysisGroup, survivals =>
                            sortPatientSurvivals(survivals)
                        )
                )
            );
        },
    });

    readonly pValuesByPrefix = remoteData<{ [prefix: string]: number | null }>({
        await: () => [
            this.sortedGroupedSurvivals,
            this.analysisGroupsComputations,
        ],
        invoke: () => {
            const analysisGroups = this.analysisGroupsComputations.result!
                .analysisGroups;

            return Promise.resolve(
                _.mapValues(
                    this.sortedGroupedSurvivals.result!,
                    groupToSurvivals => {
                        let pVal = null;
                        if (analysisGroups.length > 1) {
                            pVal = logRankTest(
                                ...analysisGroups.map(
                                    group => groupToSurvivals[group.value] || []
                                )
                            );
                        }
                        return pVal;
                    }
                )
            );
        },
    });

    readonly qValuesByPrefix = remoteData<{ [prefix: string]: number | null }>({
        await: () => [this.pValuesByPrefix],
        invoke: () => {
            // Pair pValues with prefixes
            const zipped = _.map(
                this.pValuesByPrefix.result!,
                (pVal, prefix) => ({ pVal, prefix })
            );

            // Filter out null pvalues and sort in ascending order
            const sorted = _.sortBy(
                zipped.filter(x => x.pVal !== null),
                x => x.pVal
            );

            // Calculate q values, in same order as `sorted`
            const qValues = calculateQValues(sorted.map(x => x.pVal!));

            // make a copy - null pValues become null qValues
            const ret = _.clone(this.pValuesByPrefix.result!);
            sorted.forEach((x, index) => {
                ret[x.prefix] = qValues[index];
            });
            return Promise.resolve(ret);
        },
    });

    readonly survivalPrefixes = remoteData(
        {
            await: () => [
                this.survivalTitleByPrefix,
                this.survivalChartTypeByPrefix,
                this.patientSurvivals,
                this.pValuesByPrefix,
                this.qValuesByPrefix,
                this.analysisGroupsComputations,
            ],
            invoke: () => {
                const patientSurvivals = this.patientSurvivals.result!;
                const analysisGroups = this.analysisGroupsComputations.result!
                    .analysisGroups;
                const uidToAnalysisGroup = _.keyBy(
                    analysisGroups,
                    g => g.value
                );
                const patientToAnalysisGroups = this.analysisGroupsComputations
                    .result!.patientToAnalysisGroups;
                const pValues = this.pValuesByPrefix.result!;
                const qValues = this.qValuesByPrefix.result!;

                const survivalPrefixes = _.map(
                    this.survivalTitleByPrefix.result! as Dictionary<string>,
                    (displayText, prefix) => {
                        const patientSurvivalsPerGroup = _.mapValues(
                            _.keyBy(analysisGroups, group => group.name),
                            () => [] as PatientSurvival[] // initialize empty arrays
                        );

                        for (const s of patientSurvivals[prefix]) {
                            // collect patient survivals by which groups the patient is in
                            const groupUids =
                                patientToAnalysisGroups[s.uniquePatientKey] ||
                                [];
                            for (const uid of groupUids) {
                                patientSurvivalsPerGroup[
                                    uidToAnalysisGroup[uid].name
                                ].push(s);
                            }
                        }

                        const chartType = this.survivalChartTypeByPrefix
                            .result![prefix];

                        return {
                            prefix,
                            displayText,
                            chartType,
                            numPatients: calculateNumberOfPatients(
                                patientSurvivals[prefix],
                                patientToAnalysisGroups
                            ),
                            numPatientsPerGroup: _.mapValues(
                                patientSurvivalsPerGroup,
                                survivals => survivals.length
                            ),
                            medianPerGroup: _.mapValues(
                                patientSurvivalsPerGroup,
                                survivals => {
                                    const sorted = _.sortBy(
                                        survivals,
                                        s => s.months
                                    );
                                    return getMedian(
                                        sorted,
                                        getSurvivalSummaries(sorted)
                                    );
                                }
                            ),
                            pValue: pValues[prefix],
                            qValue: qValues[prefix],
                        };
                    }
                );

                survivalPrefixes.sort((a, b) => {
                    if (a.pValue !== null && b.pValue !== null) {
                        return a.pValue - b.pValue;
                    }
                    if (a.pValue !== null) {
                        return -1;
                    }
                    if (b.pValue !== null) {
                        return 1;
                    }
                    return 0;
                });

                return Promise.resolve(survivalPrefixes);
            },
        },
        []
    );

    readonly survivalPrefixTableDataStore = remoteData({
        await: () => [this.survivalPrefixes],
        invoke: () => {
            return Promise.resolve(
                new SurvivalPrefixTableStore(
                    () => this.survivalPrefixes.result!,
                    () => this.selectedSurvivalPlotPrefix
                )
            );
        },
    });

    readonly survivalChartTypeByPrefix = remoteData(
        {
            await: () => [
                this.survivalClinicalAttributesPrefix,
                this.survivalDescriptions,
            ],
            invoke: () =>
                Promise.resolve(
                    this.survivalClinicalAttributesPrefix.result!.reduce(
                        (map, prefix) => {
                            map[prefix] = this.survivalDescriptions.result![
                                prefix
                            ][0].chartType;
                            return map;
                        },
                        {} as { [prefix: string]: SurvivalChartType }
                    )
                ),
        },
        {}
    );

    readonly survivalYLabel = remoteData({
        await: () => [
            this.survivalClinicalAttributesPrefix,
            this.survivalDescriptions,
        ],
        invoke: () =>
            Promise.resolve(
                this.survivalClinicalAttributesPrefix.result!.reduce(
                    (map, prefix) => {
                        // get survival plot titles
                        // use first display name as title
                        map[
                            prefix
                        ] = generateSurvivalPlotYAxisLabelFromDisplayName(
                            this.survivalDescriptions.result![prefix][0]
                                .displayName
                        );
                        return map;
                    },
                    {} as { [prefix: string]: string }
                )
            ),
    });
}
