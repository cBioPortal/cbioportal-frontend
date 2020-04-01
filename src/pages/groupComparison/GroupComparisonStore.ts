import {
    ComparisonGroup,
    defaultGroupOrder,
    finalizeStudiesAttr,
    getOrdinals,
    getStudyIds,
} from './GroupComparisonUtils';
import { GroupComparisonTab } from './GroupComparisonTabs';
import { remoteData, stringListToIndexSet } from 'cbioportal-frontend-commons';
import { SampleFilter } from 'cbioportal-ts-api-client';
import { action, computed, observable } from 'mobx';
import client from '../../shared/api/cbioportalClientInstance';
import comparisonClient from '../../shared/api/comparisonGroupClientInstance';
import _ from 'lodash';
import autobind from 'autobind-decorator';
import { pickClinicalDataColors } from 'pages/studyView/StudyViewUtils';
import {
    Session,
    SessionGroupData,
} from '../../shared/api/ComparisonGroupClient';
import { AppStore } from '../../AppStore';
import { GACustomFieldsEnum, trackEvent } from 'shared/lib/tracking';
import ifNotDefined from '../../shared/lib/ifNotDefined';
import GroupComparisonURLWrapper from './GroupComparisonURLWrapper';
import ComparisonStore, {
    OverlapStrategy,
} from '../../shared/lib/comparison/ComparisonStore';

export default class GroupComparisonStore extends ComparisonStore {
    @observable private _currentTabId:
        | GroupComparisonTab
        | undefined = undefined;
    @observable private sessionId: string;

    constructor(
        sessionId: string,
        appStore: AppStore,
        private urlWrapper: GroupComparisonURLWrapper
    ) {
        super(appStore);

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

    @autobind
    @action
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

    @autobind
    @action
    public toggleGroupSelected(name: string) {
        const groups = this.unselectedGroups.slice();
        if (groups.includes(name)) {
            groups.splice(groups.indexOf(name), 1);
        } else {
            groups.push(name);
        }
        this.updateUnselectedGroups(groups);
    }

    @autobind
    @action
    public selectAllGroups() {
        this.updateUnselectedGroups([]);
    }

    @autobind
    @action
    public deselectAllGroups() {
        const groups = this._originalGroups.result!; // assumed complete
        this.updateUnselectedGroups(groups.map(g => g.name));
    }

    @autobind
    public isGroupSelected(name: string) {
        return !this.unselectedGroups.includes(name);
    }

    @action
    protected async saveAndGoToSession(newSession: Session) {
        const { id } = await comparisonClient.addComparisonSession(newSession);
        this.urlWrapper.updateURL({ sessionId: id });
    }

    readonly _session = remoteData<Session>({
        invoke: () => {
            return comparisonClient.getComparisonSession(this.sessionId);
        },
        onResult(data: Session) {
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
        await: () => [this._session, this.sampleSet],
        invoke: () => {
            // (1) ensure color
            // (2) filter out, and add list of, nonexistent samples
            // (3) add patients

            let ret: ComparisonGroup[] = [];
            const sampleSet = this.sampleSet.result!;

            let defaultGroupColors = pickClinicalDataColors(_.map(
                this._session.result!.groups,
                group => ({ value: group.name })
            ) as any);

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

    readonly samples = remoteData({
        await: () => [this._session],
        invoke: () => {
            const sampleIdentifiers = [];
            for (const groupData of this._session.result!.groups) {
                for (const studySpec of groupData.studies) {
                    const studyId = studySpec.id;
                    for (const sampleId of studySpec.samples) {
                        sampleIdentifiers.push({
                            studyId,
                            sampleId,
                        });
                    }
                }
            }
            return client.fetchSamplesUsingPOST({
                sampleFilter: {
                    sampleIdentifiers,
                } as SampleFilter,
                projection: 'DETAILED',
            });
        },
    });

    readonly studies = remoteData(
        {
            await: () => [this._session],
            invoke: () => {
                const studyIds = getStudyIds(this._session.result!.groups);
                return client.fetchStudiesUsingPOST({
                    studyIds,
                    projection: 'DETAILED',
                });
            },
        },
        []
    );
}
