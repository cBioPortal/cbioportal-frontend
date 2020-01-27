import URLWrapper from 'shared/lib/URLWrapper';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import { PagePath } from 'shared/enums/PagePaths';

export type PatientViewUrlQuery = {
    studyId: string;
    caseId?: string;
    sampleId?: string;
};

export default class PatientViewUrlWrapper extends URLWrapper<
    PatientViewUrlQuery
> {
    constructor(routing: ExtendedRouterStore) {
        super(routing, {
            studyId: { isSessionProp: false },
            caseId: { isSessionProp: false },
            sampleId: { isSessionProp: false },
        });
    }

    public setTab(tab: string): void {
        this.updateURL({}, `${PagePath.Patient}/${tab}`);
    }
}
