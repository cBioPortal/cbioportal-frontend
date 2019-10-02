import URLWrapper from "../../shared/lib/URLWrapper";
import ExtendedRouterStore from "../../shared/lib/ExtendedRouterStore";
import {computed} from "mobx";
import {getTabId, GroupComparisonTab} from "./GroupComparisonUtils";
import autobind from "autobind-decorator";
import {OverlapStrategy} from "./GroupComparisonStore";

export type GroupComparisonURLQuery = {
    sessionId: string;
    groupOrder?:string; // json stringified array of names
    unselectedGroups?:string; // json stringified array of names
    overlapStrategy?:OverlapStrategy;
    patientEnrichments?:string;
};

export default class GroupComparisonURLWrapper extends URLWrapper<GroupComparisonURLQuery> {
    constructor(routing:ExtendedRouterStore) {
        super(routing, [
            { name:"sessionId", isSessionProp: false },
            { name:"groupOrder", isSessionProp: false },
            { name:"unselectedGroups", isSessionProp: false },
            { name:"overlapStrategy", isSessionProp: false },
            { name:"patientEnrichments", isSessionProp: false }
        ]);
    }

    @computed public get tabId() {
        return getTabId(this.pathName) || GroupComparisonTab.OVERLAP;
    }

    @autobind
    public setTabId(tabId:GroupComparisonTab, replace?:boolean) {
        this.routing.updateRoute({}, `comparison/${tabId}`, false, replace);
    }
}