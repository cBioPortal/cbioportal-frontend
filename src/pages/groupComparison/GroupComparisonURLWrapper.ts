import URLWrapper from '../../shared/lib/URLWrapper';
import ExtendedRouterStore from '../../shared/lib/ExtendedRouterStore';
import { computed } from 'mobx';
import { getTabId } from './GroupComparisonUtils';
import { GroupComparisonTab } from './GroupComparisonTabs';
import autobind from 'autobind-decorator';
import { OverlapStrategy } from '../../shared/lib/comparison/ComparisonStore';

export type GroupComparisonURLQuery = {
    sessionId: string;
    groupOrder?: string; // json stringified array of names
    unselectedGroups?: string; // json stringified array of names
    overlapStrategy?: OverlapStrategy;
    patientEnrichments?: string;
};

export default class GroupComparisonURLWrapper extends URLWrapper<
    GroupComparisonURLQuery
> {
    constructor(routing: ExtendedRouterStore) {
        super(routing, {
            sessionId: { isSessionProp: false },
            groupOrder: { isSessionProp: false },
            unselectedGroups: { isSessionProp: false },
            overlapStrategy: { isSessionProp: false },
            patientEnrichments: { isSessionProp: false },
        });
    }

    @computed public get tabId() {
        return getTabId(this.pathName) || GroupComparisonTab.OVERLAP;
    }

    @autobind
    public setTabId(tabId: GroupComparisonTab, replace?: boolean) {
        this.updateURL({}, `comparison/${tabId}`, false, replace);
    }
}
