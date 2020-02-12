import * as React from 'react';
import * as styles_any from './styles/styles.module.scss';
import { observer } from 'mobx-react';
import QueryContainer from './QueryContainer';
import { QueryStore } from './QueryStore';
import { observable, action } from 'mobx';
import { MSKTab, MSKTabs } from '../MSKTabs/MSKTabs';
import QuickSearch from './quickSearch/QuickSearch';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import { trackEvent } from 'shared/lib/tracking';
import { If } from 'react-if';
import AppConfig from 'appConfig';
import { ModifyQueryParams } from 'pages/resultsView/ResultsViewPageStore';

const styles = styles_any as {
    QueryAndDownloadTabs: string;
};

const DOWNLOAD = 'download';
const ADVANCED = 'advanced';
const QUICK_SEARCH_TAB_ID = 'quickSearch';
const QUICK_SEARCH_LS_KEY = 'defaultHomePageTab';

interface IQueryAndDownloadTabsProps {
    onSubmit?: () => void;
    showQuickSearchTab: boolean;
    showDownloadTab: boolean;
    getQueryStore: () => QueryStore;
    showAlerts?: boolean;
    forkedMode?: boolean;
    modifyQueryParams?: ModifyQueryParams | undefined;
}

@observer
export default class QueryAndDownloadTabs extends React.Component<
    IQueryAndDownloadTabsProps,
    {}
> {
    constructor(props: IQueryAndDownloadTabsProps) {
        super(props);

        if (
            props.showQuickSearchTab &&
            getBrowserWindow().localStorage.getItem(QUICK_SEARCH_LS_KEY) ===
                QUICK_SEARCH_TAB_ID
        ) {
            this.activeTabId = getBrowserWindow().localStorage.getItem(
                QUICK_SEARCH_LS_KEY
            );
        }

        // the query store models a single use of the query component and therefor a new one should
        // be made when the component is instantiated and it should be destroyed when the component unmounts
        // we use a callback because we want to create the query store at the moment the query form is instantiated/shown
        // because it needs the state of route at that moment (so that on the results page it reflects the current query)
        this.store = props.getQueryStore();
    }

    static defaultProps = {
        forkedMode: true,
    };

    @observable.ref store: QueryStore;

    @observable activeTabId: string;

    public get quickSearchDefaulted() {
        return (
            getBrowserWindow().localStorage.getItem(QUICK_SEARCH_LS_KEY) ===
            QUICK_SEARCH_TAB_ID
        );
    }

    @autobind
    setDefaultTab(tabId: string | undefined) {
        // right now we only care if quick search or NOT
        if (this.props.showQuickSearchTab) {
            getBrowserWindow().localStorage.defaultHomePageTab =
                tabId === QUICK_SEARCH_TAB_ID ? QUICK_SEARCH_TAB_ID : undefined;
        }
    }

    trackQuickSearch() {
        // track how many users are using this feature
        trackEvent({ category: 'quickSearch', action: 'quickSearchLoad' });
    }

    @autobind
    @action
    onSelectTab(tabId: string) {
        this.store.forDownloadTab = tabId === DOWNLOAD;
        this.activeTabId = tabId;
    }

    render() {
        return (
            <div className={styles.QueryAndDownloadTabs}>
                <If condition={AppConfig.serverConfig.skin_citation_rule_text}>
                    <div
                        className="citationRule"
                        dangerouslySetInnerHTML={{
                            __html: AppConfig.serverConfig
                                .skin_citation_rule_text!,
                        }}
                    ></div>
                </If>

                <MSKTabs
                    activeTabId={this.activeTabId}
                    onTabClick={this.onSelectTab}
                    className={'mainTabs'}
                >
                    <MSKTab
                        id={'advanced'}
                        linkText={'Query'}
                        onTabDidMount={() => this.setDefaultTab(undefined)}
                    >
                        <QueryContainer
                            forkedMode={this.props.forkedMode}
                            onSubmit={this.props.onSubmit}
                            store={this.store}
                            modifyQueryParams={this.props.modifyQueryParams}
                            showAlerts={this.props.showAlerts}
                        />
                    </MSKTab>
                    <MSKTab
                        id={QUICK_SEARCH_TAB_ID}
                        linkText={
                            <span>
                                Quick Search{' '}
                                <strong className={'beta-text'}>Beta!</strong>
                            </span>
                        }
                        hide={!this.props.showQuickSearchTab}
                        onTabDidMount={() => {
                            this.setDefaultTab(QUICK_SEARCH_TAB_ID);
                            this.trackQuickSearch();
                        }}
                    >
                        <div>
                            <QuickSearch />
                        </div>
                    </MSKTab>
                    <MSKTab
                        id={DOWNLOAD}
                        linkText={'Download'}
                        hide={!this.props.showDownloadTab}
                        onTabDidMount={() => this.setDefaultTab(undefined)}
                    >
                        {/*forked experience is always false for download tab*/}
                        <QueryContainer
                            forkedMode={false}
                            onSubmit={this.props.onSubmit}
                            store={this.store}
                            showAlerts={this.props.showAlerts}
                        />
                    </MSKTab>
                </MSKTabs>
            </div>
        );
    }
}
