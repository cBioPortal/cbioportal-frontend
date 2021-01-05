import URLWrapper from '../../shared/lib/URLWrapper';
import { StudyViewPageTabKey, StudyViewURLQuery } from './StudyViewPageStore';
import { PagePath } from '../../shared/enums/PagePaths';
import { computed, makeObservable } from 'mobx';
import { PatientViewPageTabs } from '../patientView/PatientViewPageTabs';
import { StudyViewPageTabKeyEnum } from './StudyViewPageTabs';
import ExtendedRouterStore from '../../shared/lib/ExtendedRouterStore';

export default class StudyViewURLWrapper extends URLWrapper<
    Pick<StudyViewURLQuery, 'tab' | 'resourceUrl'>
> {
    constructor(routing: ExtendedRouterStore) {
        super(routing, {
            tab: { isSessionProp: false },
            resourceUrl: { isSessionProp: false },
        });
        makeObservable(this);
    }

    public setTab(tab: string): void {
        this.updateURL({}, `${PagePath.Study}/${tab}`);
    }

    @computed public get tabId(): StudyViewPageTabKey {
        const regex = new RegExp(`${PagePath.Study}\/(.+)`);
        const regexMatch = regex.exec(this.pathName);
        const tabInPath = regexMatch && regexMatch[1];
        return (
            (tabInPath as StudyViewPageTabKey | undefined) ||
            StudyViewPageTabKeyEnum.SUMMARY
        );
    }

    public setResourceUrl(resourceUrl: string) {
        this.updateURL({ resourceUrl });
    }
}
