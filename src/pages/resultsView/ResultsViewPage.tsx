import * as React from 'react';
import * as _ from 'lodash';
import $ from 'jquery';
import URL from 'url';
import { inject, observer } from 'mobx-react';
import { action, computed, observable, reaction, runInAction } from 'mobx';
import { ResultsViewPageStore } from './ResultsViewPageStore';
import CancerSummaryContainer from 'pages/resultsView/cancerSummary/CancerSummaryContainer';
import Mutations from './mutation/Mutations';
import MutualExclusivityTab from './mutualExclusivity/MutualExclusivityTab';
import DownloadTab from './download/DownloadTab';
import AppConfig from 'appConfig';
import CNSegments from './cnSegments/CNSegments';
import './styles.scss';
import ResultsViewPathwayMapper from './pathwayMapper/ResultsViewPathwayMapper';
import ResultsViewOncoprint from 'shared/components/oncoprint/ResultsViewOncoprint';
import QuerySummary from './querySummary/QuerySummary';
import ExpressionWrapper from './expression/ExpressionWrapper';
import PlotsTab from './plots/PlotsTab';
import { MSKTab, MSKTabs } from '../../shared/components/MSKTabs/MSKTabs';
import { PageLayout } from '../../shared/components/PageLayout/PageLayout';
import autobind from 'autobind-decorator';
import { ITabConfiguration } from '../../shared/model/ITabConfiguration';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import CoExpressionTab from './coExpression/CoExpressionTab';
import Helmet from 'react-helmet';
import { showCustomTab } from '../../shared/lib/customTabs';
import {
    parseConfigDisabledTabs,
    ResultsViewTab,
} from './ResultsViewPageHelpers';
import {
    buildResultsViewPageTitle,
    doesQueryHaveCNSegmentData,
} from './ResultsViewPageStoreUtils';
import { AppStore } from '../../AppStore';
import { trackQuery } from '../../shared/lib/tracking';
import QueryAndDownloadTabs from 'shared/components/query/QueryAndDownloadTabs';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import GeneSymbolValidationError from 'shared/components/query/GeneSymbolValidationError';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';
import setWindowVariable from 'shared/lib/setWindowVariable';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import onMobxPromise from 'shared/lib/onMobxPromise';
import { createQueryStore } from 'shared/lib/createQueryStore';
import {
    handleLegacySubmission,
    handlePostedSubmission,
} from 'shared/lib/redirectHelpers';
import ComparisonTab from './comparison/ComparisonTab';
import OQLTextArea, {
    GeneBoxType,
} from 'shared/components/GeneSelectionBox/OQLTextArea';
import browser from 'bowser';

export function initStore(
    appStore: AppStore,
    urlWrapper: ResultsViewURLWrapper
) {
    const resultsViewPageStore = new ResultsViewPageStore(appStore, urlWrapper);

    setWindowVariable('resultsViewPageStore', resultsViewPageStore);

    reaction(
        () => [resultsViewPageStore.studyIds, resultsViewPageStore.oqlText],
        () => {
            if (
                resultsViewPageStore.studyIds.isComplete &&
                resultsViewPageStore.oqlText
            ) {
                trackQuery(
                    resultsViewPageStore.studyIds.result!,
                    resultsViewPageStore.oqlText,
                    resultsViewPageStore.hugoGeneSymbols,
                    resultsViewPageStore.queriedVirtualStudies.result!.length >
                        0
                );
            }
        }
    );

    return resultsViewPageStore;
}

function addOnBecomeVisibleListener(callback: () => void) {
    $('#oncoprint-result-tab').click(callback);
}

export interface IResultsViewPageProps {
    routing: ExtendedRouterStore;
    appStore: AppStore;
    params: any; // from react router
}

@inject('appStore', 'routing')
@observer
export default class ResultsViewPage extends React.Component<
    IResultsViewPageProps,
    {}
> {
    private resultsViewPageStore: ResultsViewPageStore;

    private urlWrapper: ResultsViewURLWrapper;

    @observable showOQLEditor = false;

    @observable showTabs = true;

    constructor(props: IResultsViewPageProps) {
        super(props);

        this.urlWrapper = new ResultsViewURLWrapper(props.routing);

        handleLegacySubmission(this.urlWrapper);

        handlePostedSubmission(this.urlWrapper);

        setWindowVariable('urlWrapper', this.urlWrapper);

        if (this.urlWrapper.hasSessionId) {
            onMobxPromise(this.urlWrapper.remoteSessionData, () => {
                this.resultsViewPageStore = initStore(
                    props.appStore,
                    this.urlWrapper
                );
            });
        } else {
            this.resultsViewPageStore = initStore(
                props.appStore,
                this.urlWrapper
            );
        }
    }

    private handleTabChange(id: string, replace?: boolean) {
        this.urlWrapper.updateURL({}, `results/${id}`, false, replace);
    }

    @autobind
    private customTabCallback(
        div: HTMLDivElement,
        tab: any,
        isUnmount = false
    ) {
        showCustomTab(
            div,
            tab,
            getBrowserWindow().location.href,
            this.resultsViewPageStore,
            isUnmount
        );
    }

    componentWillUnmount() {
        this.resultsViewPageStore.destroy();
        this.urlWrapper.destroy();
    }

    @computed
    private get tabs() {
        const store = this.resultsViewPageStore;

        const tabMap: ITabConfiguration[] = [
            {
                id: ResultsViewTab.ONCOPRINT,
                getTab: () => {
                    return (
                        <MSKTab
                            key={0}
                            id={ResultsViewTab.ONCOPRINT}
                            linkText="OncoPrint"
                        >
                            <ResultsViewOncoprint
                                divId={'oncoprintDiv'}
                                store={store}
                                urlWrapper={store.urlWrapper}
                                key={store.hugoGeneSymbols.join(',')}
                                addOnBecomeVisibleListener={
                                    addOnBecomeVisibleListener
                                }
                            />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.CANCER_TYPES_SUMMARY,
                getTab: () => {
                    return (
                        <MSKTab
                            key={1}
                            id={ResultsViewTab.CANCER_TYPES_SUMMARY}
                            linkText="Cancer Types Summary"
                        >
                            <CancerSummaryContainer store={store} />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.MUTUAL_EXCLUSIVITY,
                getTab: () => {
                    return (
                        <MSKTab
                            key={5}
                            id={ResultsViewTab.MUTUAL_EXCLUSIVITY}
                            linkText="Mutual Exclusivity"
                        >
                            <MutualExclusivityTab
                                store={store}
                                isSampleAlteredMap={store.isSampleAlteredMap}
                            />
                        </MSKTab>
                    );
                },
                hide: () => {
                    // we are using the size of isSampleAlteredMap as a proxy for the number of things we have to compare
                    return (
                        !this.resultsViewPageStore.isSampleAlteredMap
                            .isComplete ||
                        _.size(
                            this.resultsViewPageStore.isSampleAlteredMap.result
                        ) < 2
                    );
                },
            },

            {
                id: ResultsViewTab.PLOTS,
                hide: () => {
                    if (!this.resultsViewPageStore.studies.isComplete) {
                        return true;
                    } else {
                        return (
                            this.resultsViewPageStore.studies.result!.length > 1
                        );
                    }
                },
                getTab: () => {
                    return (
                        <MSKTab
                            key={12}
                            id={ResultsViewTab.PLOTS}
                            linkText={'Plots'}
                        >
                            <PlotsTab
                                store={store}
                                urlWrapper={this.urlWrapper}
                            />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.MUTATIONS,
                getTab: () => {
                    return (
                        <MSKTab
                            key={3}
                            id={ResultsViewTab.MUTATIONS}
                            linkText="Mutations"
                        >
                            <Mutations
                                store={store}
                                appStore={this.props.appStore}
                            />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.COEXPRESSION,
                hide: () => {
                    if (
                        !this.resultsViewPageStore.isThereDataForCoExpressionTab
                            .isComplete ||
                        !this.resultsViewPageStore.studies.isComplete
                    ) {
                        return true;
                    } else {
                        const tooManyStudies =
                            this.resultsViewPageStore.studies.result!.length >
                            1;
                        const noData = !this.resultsViewPageStore
                            .isThereDataForCoExpressionTab.result;
                        return tooManyStudies || noData;
                    }
                },
                getTab: () => {
                    return (
                        <MSKTab
                            key={7}
                            id={ResultsViewTab.COEXPRESSION}
                            linkText={'Co-expression'}
                        >
                            <CoExpressionTab store={store} />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.COMPARISON,
                hide: () => {
                    return !this.resultsViewPageStore.studies.isComplete;
                },
                getTab: () => {
                    return (
                        <MSKTab
                            key={10}
                            id={ResultsViewTab.COMPARISON}
                            linkText={'Comparison'}
                        >
                            <ComparisonTab
                                urlWrapper={this.urlWrapper}
                                appStore={this.props.appStore}
                                store={this.resultsViewPageStore}
                            />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.CN_SEGMENTS,
                hide: () => {
                    return (
                        !this.resultsViewPageStore.studies.isComplete ||
                        !this.resultsViewPageStore.genes.isComplete ||
                        !this.resultsViewPageStore.referenceGenes.isComplete ||
                        !doesQueryHaveCNSegmentData(
                            this.resultsViewPageStore.samples.result
                        )
                    );
                },
                getTab: () => {
                    return (
                        <MSKTab
                            key={6}
                            id={ResultsViewTab.CN_SEGMENTS}
                            linkText="CN Segments"
                        >
                            <CNSegments store={store} />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.NETWORK,
                hide: () => {
                    return true;
                },
                getTab: () => {
                    return (
                        <MSKTab
                            key={9}
                            id={ResultsViewTab.NETWORK}
                            linkText={'Network'}
                        >
                            <div className="alert alert-info">
                                The Network tab has been retired. For similar
                                functionality, please visit{' '}
                                <a
                                    href="http://www.pathwaycommons.org/pcviz/"
                                    target="_blank"
                                >
                                    http://www.pathwaycommons.org/pcviz/
                                </a>
                            </div>
                        </MSKTab>
                    );
                },
            },
            {
                id: ResultsViewTab.PATHWAY_MAPPER,
                hide: () =>
                    browser.name === 'Internet Explorer' ||
                    !AppConfig.serverConfig.show_pathway_mapper ||
                    !this.resultsViewPageStore.studies.isComplete,
                getTab: () => {
                    const showPM =
                        store.sequencedSampleKeysByGene.isComplete &&
                        store.oqlFilteredCaseAggregatedDataByOQLLine
                            .isComplete &&
                        store.genes.isComplete &&
                        store.samples.isComplete &&
                        store.patients.isComplete &&
                        store.coverageInformation.isComplete &&
                        store.sequencedSampleKeysByGene.isComplete &&
                        store.sequencedPatientKeysByGene.isComplete &&
                        store.selectedMolecularProfiles.isComplete &&
                        store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine
                            .isComplete;

                    return (
                        <MSKTab
                            key={13}
                            id={ResultsViewTab.PATHWAY_MAPPER}
                            linkText={'Pathways'}
                        >
                            {showPM ? (
                                <ResultsViewPathwayMapper
                                    store={store}
                                    appStore={this.props.appStore}
                                    urlWrapper={this.urlWrapper}
                                />
                            ) : (
                                <LoadingIndicator
                                    isLoading={true}
                                    size={'big'}
                                    center={true}
                                />
                            )}
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.EXPRESSION,
                hide: () => {
                    return (
                        this.resultsViewPageStore.expressionProfiles.result
                            .length === 0 ||
                        this.resultsViewPageStore.studies.result.length < 2
                    );
                },
                getTab: () => {
                    return (
                        <MSKTab
                            key={8}
                            id={ResultsViewTab.EXPRESSION}
                            linkText={'Expression'}
                        >
                            {store.studyIdToStudy.isComplete &&
                                store.filteredAndAnnotatedMutations
                                    .isComplete &&
                                store.genes.isComplete &&
                                store.coverageInformation.isComplete && (
                                    <ExpressionWrapper
                                        store={store}
                                        studyMap={store.studyIdToStudy.result}
                                        genes={store.genes.result}
                                        expressionProfiles={
                                            store.expressionProfiles
                                        }
                                        numericGeneMolecularDataCache={
                                            store.numericGeneMolecularDataCache
                                        }
                                        mutations={
                                            store.filteredAndAnnotatedMutations
                                                .result!
                                        }
                                        coverageInformation={
                                            store.coverageInformation.result
                                        }
                                    />
                                )}
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.DOWNLOAD,
                getTab: () => {
                    return (
                        <MSKTab
                            key={11}
                            id={ResultsViewTab.DOWNLOAD}
                            linkText={'Download'}
                        >
                            <DownloadTab store={store} />
                        </MSKTab>
                    );
                },
            },
        ];

        let filteredTabs = tabMap
            .filter(this.evaluateTabInclusion)
            .map(tab => tab.getTab());

        // now add custom tabs
        if (AppConfig.serverConfig.custom_tabs) {
            const customResultsTabs = AppConfig.serverConfig.custom_tabs
                .filter((tab: any) => tab.location === 'RESULTS_PAGE')
                .map((tab: any, i: number) => {
                    return (
                        <MSKTab
                            key={100 + i}
                            id={'customTab' + i}
                            unmountOnHide={tab.unmountOnHide === true}
                            onTabDidMount={div => {
                                this.customTabCallback(div, tab);
                            }}
                            onTabUnmount={div => {
                                this.customTabCallback(div, tab, true);
                            }}
                            linkText={tab.title}
                        />
                    );
                });
            filteredTabs = filteredTabs.concat(customResultsTabs);
        }

        return filteredTabs;
    }

    @autobind
    public evaluateTabInclusion(tab: ITabConfiguration) {
        const excludedTabs = AppConfig.serverConfig.disabled_tabs || '';
        const isExcludedInList = parseConfigDisabledTabs(excludedTabs).includes(
            tab.id
        );
        const isRoutedTo = this.resultsViewPageStore.tabId === tab.id;
        const isExcluded = tab.hide ? tab.hide() : false;

        // we show no matter what if its routed to
        return isRoutedTo || (!isExcludedInList && !isExcluded);
    }

    @computed get quickOQLSubmitButtion() {
        return (
            <>
                <button
                    className={'btn btn-primary btn-sm'}
                    style={{ marginLeft: 10 }}
                    onClick={this.handleQuickOQLSubmission}
                >
                    Submit Query
                </button>
                &nbsp;
                <button
                    className={'btn btn-link btn-sm'}
                    onClick={this.toggleOQLEditor}
                >
                    Cancel
                </button>
            </>
        );
    }

    @autobind
    @action
    handleQuickOQLSubmission() {
        this.showOQLEditor = false;
        this.urlWrapper.updateURL({
            gene_list: this.oqlSubmission,
        });
    }

    @autobind
    @action
    toggleOQLEditor() {
        this.showOQLEditor = !this.showOQLEditor;
    }

    @autobind
    private getTabHref(tabId: string) {
        return URL.format({
            pathname: tabId,
            query: this.props.routing.location.query,
            hash: this.props.routing.location.hash,
        });
    }

    @observable oqlSubmission = '';

    @computed get pageContent() {
        if (this.resultsViewPageStore.invalidStudyIds.result.length > 0) {
            return (
                <div>
                    <div className={'headBlock'}></div>
                    <QueryAndDownloadTabs
                        forkedMode={false}
                        showQuickSearchTab={false}
                        showDownloadTab={false}
                        showAlerts={true}
                        getQueryStore={() =>
                            createQueryStore(
                                this.urlWrapper.query,
                                this.urlWrapper
                            )
                        }
                    />
                </div>
            );
        } else {
            return (
                <>
                    {// if query invalid(we only check gene count * sample count < 1,000,000 for now), return error page
                    this.resultsViewPageStore.isQueryInvalid && (
                        <div
                            className="alert alert-danger queryInvalid"
                            style={{ marginBottom: '40px' }}
                            role="alert"
                        >
                            <GeneSymbolValidationError
                                sampleCount={
                                    this.resultsViewPageStore.samples.result
                                        .length
                                }
                                queryProductLimit={
                                    AppConfig.serverConfig.query_product_limit
                                }
                                email={
                                    AppConfig.serverConfig.skin_email_contact
                                }
                            />
                        </div>
                    )}
                    {this.resultsViewPageStore.studies.isPending && (
                        <LoadingIndicator
                            isLoading={true}
                            center={true}
                            size={'big'}
                        ></LoadingIndicator>
                    )}
                    {this.resultsViewPageStore.studies.isComplete && (
                        <>
                            <Helmet>
                                <title>
                                    {buildResultsViewPageTitle(
                                        this.resultsViewPageStore
                                            .hugoGeneSymbols,
                                        this.resultsViewPageStore.studies.result
                                    )}
                                </title>
                            </Helmet>
                            <div>
                                <div className={'headBlock'}>
                                    <QuerySummary
                                        routingStore={this.props.routing}
                                        store={this.resultsViewPageStore}
                                        onToggleQueryFormVisibility={visible => {
                                            runInAction(() => {
                                                this.showTabs = visible;
                                                this.showOQLEditor = false;
                                            });
                                        }}
                                        onToggleOQLEditUIVisibility={
                                            this.toggleOQLEditor
                                        }
                                    />

                                    {this.showOQLEditor && (
                                        <div className={'quick_oql_edit'}>
                                            <OQLTextArea
                                                inputGeneQuery={
                                                    this.resultsViewPageStore
                                                        .oqlText
                                                }
                                                validateInputGeneQuery={true}
                                                callback={(...args) => {
                                                    this.oqlSubmission =
                                                        args[2];
                                                }}
                                                location={GeneBoxType.DEFAULT}
                                                submitButton={
                                                    this.quickOQLSubmitButtion
                                                }
                                            />
                                        </div>
                                    )}
                                </div>

                                {// we don't show the result tabs if we don't have valid query
                                this.showTabs &&
                                    !this.resultsViewPageStore.genesInvalid &&
                                    !this.resultsViewPageStore
                                        .isQueryInvalid && (
                                        <MSKTabs
                                            key={this.urlWrapper.hash}
                                            activeTabId={
                                                this.resultsViewPageStore.tabId
                                            }
                                            unmountOnHide={false}
                                            onTabClick={(id: string) =>
                                                this.handleTabChange(id)
                                            }
                                            className="mainTabs"
                                            getTabHref={this.getTabHref}
                                        >
                                            {this.tabs}
                                        </MSKTabs>
                                    )}
                            </div>
                        </>
                    )}
                </>
            );
        }
    }

    public render() {
        if (
            this.urlWrapper.isPendingSession ||
            this.urlWrapper.isLoadingSession
        ) {
            return (
                <LoadingIndicator isLoading={true} center={true} size={'big'} />
            );
        }

        if (
            this.resultsViewPageStore.studies.isComplete &&
            !this.resultsViewPageStore.tabId
        ) {
            setTimeout(() => {
                this.handleTabChange(this.resultsViewPageStore.tabId, true);
            });
            return null;
        } else {
            return (
                <PageLayout
                    noMargin={true}
                    hideFooter={true}
                    className={'subhead-dark'}
                >
                    {this.pageContent}
                </PageLayout>
            );
        }
    }
}
