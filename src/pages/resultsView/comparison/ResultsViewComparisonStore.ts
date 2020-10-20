import { action, computed, observable, makeObservable } from 'mobx';
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
import {
    ComparisonGroup,
    filterStudiesAttr,
} from '../../groupComparison/GroupComparisonUtils';

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
        makeObservable<
            ResultsViewComparisonStore,
            '_currentTabId' | 'updateSelectedGroups' | 'saveAndGoToSession'
        >(this);
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
        return this.resultsViewStore.usePatientLevelEnrichments;
    }

    @autobind
    @action
    public setUsePatientLevelEnrichments(e: boolean) {
        this.resultsViewStore.setUsePatientLevelEnrichments(e);
    }

    @computed get _session() {
        return this.resultsViewStore.comparisonTabComparisonSession;
    }

    readonly _originalGroups = remoteData<ResultsViewComparisonGroup[]>({
        await: () => [this.resultsViewStore.comparisonTabGroups],
        invoke: () => {
            const defaultOrderGroups = this.resultsViewStore.comparisonTabGroups
                .result!;
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

    @autobind
    public isGroupDeletable(group: ComparisonGroup) {
        // a group can be deleted if its user-created
        if (this.nameToUserCreatedGroup.isComplete) {
            return group.name in this.nameToUserCreatedGroup.result!;
        } else {
            return false;
        }
    }

    readonly nameToUserCreatedGroup = remoteData({
        await: () => [this._session],
        invoke: () => {
            return Promise.resolve(
                _.keyBy(this._session.result!.groups, g => g.name)
            );
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
        this.urlWrapper.updateURL({ comparison_createdGroupsSessionId: id });
    }
    //</session>

    public get samples() {
        return this.resultsViewStore.samples;
    }

    public get studies() {
        return this.resultsViewStore.studies;
    }
}
