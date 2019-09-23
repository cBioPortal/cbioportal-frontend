import URLWrapper from "../../shared/lib/URLWrapper";
import {QueryParams} from "url";
import ExtendedRouterStore from "../../shared/lib/ExtendedRouterStore";
import {GroupComparisonTab} from "../groupComparison/GroupComparisonUtils";
import {computed} from "mobx";
import autobind from "autobind-decorator";

export interface PatientViewUrlParams {
    studyId:string;
    caseId?:string;
    sampleId?:string;
    sampleIdOrder?:string;
}

function getTabId(pathname:string) {
    const match = pathname.match(/patient\/([^\/]+)/);
    if (match) {
        return match[1];
    } else {
        return undefined;
    }
}

export default class PatientViewURLWrapper extends URLWrapper<PatientViewUrlParams> {
    constructor(routing:ExtendedRouterStore) {
        super(routing, [
            { name:"studyId", isSessionProp:false },
            { name:"caseId", isSessionProp:false },
            { name:"sampleId", isSessionProp:false },
            { name:"sampleIdOrder", isSessionProp:false }
        ]);
    }

    pathContext = "/patient";

    @computed public get tabId() {
        return getTabId(this.pathName) || "summary";
    }

    @autobind
    public setTabId(tabId:string, replace?:boolean) {
        this.routing.updateRoute({}, `patient/${tabId}`, false, replace);
    }
}