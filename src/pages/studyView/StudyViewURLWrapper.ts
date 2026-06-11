import URLWrapper from '../../shared/lib/URLWrapper';
import { StudyViewPageTabKey, StudyViewURLQuery } from './StudyViewPageStore';
import { PagePath } from '../../shared/enums/PagePaths';
import { computed, makeObservable } from 'mobx';
import { StudyViewPageTabKeyEnum } from './StudyViewPageTabs';
import ExtendedRouterStore from '../../shared/lib/ExtendedRouterStore';
import { PLOTS_TAB_URL_PARAMS } from 'shared/components/plots/PlotsTabUrlParameters';

export default class StudyViewURLWrapper extends URLWrapper<
    Pick<
        StudyViewURLQuery,
        | 'tab'
        | 'resourceUrl'
        | 'plots_horz_selection'
        | 'plots_vert_selection'
        | 'plots_coloring_selection'
        | 'geneset_list'
        | 'generic_assay_groups'
    >
> {
    constructor(routing: ExtendedRouterStore) {
        super(routing, {
            tab: { isSessionProp: false },
            resourceUrl: { isSessionProp: false },
            ...PLOTS_TAB_URL_PARAMS,
            geneset_list: { isSessionProp: true },
            generic_assay_groups: { isSessionProp: false },
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
