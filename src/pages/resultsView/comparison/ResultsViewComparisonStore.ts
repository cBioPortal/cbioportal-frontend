import { action, computed, observable } from 'mobx';
import { ResultsViewComparisonSubTab } from '../ResultsViewPageHelpers';
import ComparisonStore, {
    OverlapStrategy,
} from '../../../shared/lib/comparison/ComparisonStore';
import ResultsViewURLWrapper from '../ResultsViewURLWrapper';
import { AppStore } from '../../../AppStore';
import autobind from 'autobind-decorator';
import { remoteData, stringListToIndexSet } from 'cbioportal-frontend-commons';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { makeUniqueColorGetter } from '../../../shared/components/plots/PlotUtils';
import {
    ALTERED_COLOR,
    ALTERED_GROUP_NAME,
    getAlteredByOncoprintTrackGroups,
    getAlteredVsUnalteredGroups,
    completeSessionGroups,
    ResultsViewComparisonGroup,
    UNALTERED_COLOR,
    UNALTERED_GROUP_NAME,
} from './ResultsViewComparisonUtils';
import _ from 'lodash';
import ifNotDefined from '../../../shared/lib/ifNotDefined';
import {
    Session,
    SessionGroupData,
} from '../../../shared/api/ComparisonGroupClient';
import comparisonClient from '../../../shared/api/comparisonGroupClientInstance';

export default class ResultsViewComparisonStore extends ComparisonStore {
    @observable private _currentTabId:
        | ResultsViewComparisonSubTab
        | undefined = undefined;

    constructor(
        appStore: AppStore,
        private urlWrapper: ResultsViewURLWrapper,
        protected resultsViewStore: ResultsViewPageStore
    ) {
        super(appStore, resultsViewStore);
    }

    @action public updateOverlapStrategy(strategy: OverlapStrategy) {
        this.urlWrapper.updateURL({ comparison_overlapStrategy: strategy });
    }

    @computed get overlapStrategy() {
        return (
            (this.urlWrapper.query
                .comparison_overlapStrategy as OverlapStrategy) ||
            OverlapStrategy.EXCLUDE
        );
    }

    @computed
    public get usePatientLevelEnrichments() {
        return this.urlWrapper.query.patient_enrichments === 'true';
    }

    @autobind
    @action
    public setUsePatientLevelEnrichments(e: boolean) {
        this.urlWrapper.updateURL({ patient_enrichments: e.toString() });
    }

    readonly _session = remoteData<Session>({
        await: () => [
            this.resultsViewStore.studyIds,
            this.resultsViewStore.alteredSamples,
            this.resultsViewStore.unalteredSamples,
            this.resultsViewStore.alteredPatients,
            this.resultsViewStore.unalteredPatients,
            this.resultsViewStore.samples,
            this.resultsViewStore
                .oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
            this.resultsViewStore.defaultOQLQuery,
        ],
        invoke: () => {
            const sessionId = this.urlWrapper.query.comparison_sessionId;
            if (sessionId) {
                // if theres a session, load groups from there
                return comparisonClient.getComparisonSession(sessionId);
            } else {
                // otherwise, populate with all the types of groups
                let groups: SessionGroupData[] = [];
                groups.push(
                    ...getAlteredVsUnalteredGroups(
                        this.usePatientLevelEnrichments,
                        this.resultsViewStore.studyIds.result!,
                        this.resultsViewStore.alteredSamples.result!,
                        this.resultsViewStore.unalteredSamples.result!
                    )
                );
                groups.push(
                    ...getAlteredByOncoprintTrackGroups(
                        this.usePatientLevelEnrichments,
                        this.resultsViewStore.studyIds.result!,
                        this.resultsViewStore.samples.result!,
                        this.resultsViewStore
                            .oqlFilteredCaseAggregatedDataByUnflattenedOQLLine
                            .result!,
                        this.resultsViewStore.defaultOQLQuery.result!
                    )
                );
                return Promise.resolve({
                    id: '',
                    groups,
                    origin: this.resultsViewStore.studyIds.result!,
                });
            }
        },
    });

    readonly _originalGroups = remoteData<ResultsViewComparisonGroup[]>({
        await: () => [this._session, this.sampleSet],
        invoke: () => {
            const uniqueColorGetter = makeUniqueColorGetter([
                ALTERED_COLOR,
                UNALTERED_COLOR,
            ]);
            const defaultOrderGroups = completeSessionGroups(
                this.usePatientLevelEnrichments,
                this._session.result!.groups,
                this.sampleSet.result!,
                uniqueColorGetter
            );
            if (this.groupOrder) {
                const order = stringListToIndexSet(this.groupOrder);
                return Promise.resolve(
                    _.sortBy<ResultsViewComparisonGroup>(
                        defaultOrderGroups,
                        g =>
                            ifNotDefined<number>(
                                order[g.name],
                                Number.POSITIVE_INFINITY
                            )
                    )
                );
            } else {
                return Promise.resolve(defaultOrderGroups);
            }
        },
    });

    // <group selection>
    @computed get selectedGroups() {
        const param = this.urlWrapper.query.comparison_selectedGroups;
        if (param) {
            return JSON.parse(param);
        } else {
            return [ALTERED_GROUP_NAME, UNALTERED_GROUP_NAME]; // altered and unaltered selected by default
        }
    }

    @action private updateSelectedGroups(names: string[]) {
        this.urlWrapper.updateURL({
            comparison_selectedGroups: JSON.stringify(names),
        });
    }

    @autobind
    public isGroupSelected(name: string) {
        return this.selectedGroups.includes(name);
    }

    @autobind
    @action
    public toggleGroupSelected(name: string) {
        const groups = this.selectedGroups.slice();
        if (groups.includes(name)) {
            groups.splice(groups.indexOf(name), 1);
        } else {
            groups.push(name);
        }
        this.updateSelectedGroups(groups);
    }

    @autobind
    @action
    public selectAllGroups() {
        const groups = this._originalGroups.result!; // assumed complete
        this.updateSelectedGroups(groups.map(g => g.name));
    }

    @autobind
    @action
    public deselectAllGroups() {
        this.updateSelectedGroups([]);
    }
    // </group selection>

    // <group order>
    @computed get groupOrder() {
        const param = this.urlWrapper.query.comparison_groupOrder;
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

        this.urlWrapper.updateURL({
            comparison_groupOrder: JSON.stringify(groupOrder),
        });
    }
    // </group order>

    // <session>
    @action
    protected async saveAndGoToSession(newSession: Session) {
        const { id } = await comparisonClient.addComparisonSession(newSession);
        this.urlWrapper.updateURL({ comparison_sessionId: id });
    }
    //</session>

    public get samples() {
        return this.resultsViewStore.samples;
    }

    public get studies() {
        return this.resultsViewStore.studies;
    }
}
