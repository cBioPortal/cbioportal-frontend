import * as React from 'react';
import * as _ from 'lodash';
import $ from 'jquery';
import {If, Then, Else} from 'react-if';
import URL from 'url';
import { inject, observer } from 'mobx-react';
import { computed, observable, reaction, runInAction } from 'mobx';
import { ResultsViewPageStore } from './ResultsViewPageStore';
import CancerSummaryContainer from 'pages/resultsView/cancerSummary/CancerSummaryContainer';
import Mutations from './mutation/Mutations';
import MutualExclusivityTab from './mutualExclusivity/MutualExclusivityTab';
import SurvivalTab from './survival/SurvivalTab';
import DownloadTab from './download/DownloadTab';
import AppConfig from 'appConfig';
import CNSegments from './cnSegments/CNSegments';
import './styles.scss';
import Network from './network/Network';
import PathwayMapper from "react-pathway-mapper";
import "react-pathway-mapper/dist/base.css";
import ResultsViewOncoprint from 'shared/components/oncoprint/ResultsViewOncoprint';
import QuerySummary from './querySummary/QuerySummary';
import ExpressionWrapper from './expression/ExpressionWrapper';
import EnrichmentsTab from 'pages/resultsView/enrichments/EnrichmentsTab';
import PlotsTab from './plots/PlotsTab';
import { MSKTab, MSKTabs } from '../../shared/components/MSKTabs/MSKTabs';
import { PageLayout } from '../../shared/components/PageLayout/PageLayout';
import autobind from 'autobind-decorator';
import { ITabConfiguration } from '../../shared/model/ITabConfiguration';
import getBrowserWindow from '../../public-lib/lib/getBrowserWindow';
import CoExpressionTab from './coExpression/CoExpressionTab';
import Helmet from 'react-helmet';
import { showCustomTab } from '../../shared/lib/customTabs';
import {
    getTabId,
    parseConfigDisabledTabs,
    parseSamplesSpecifications,
    ResultsViewTab,
} from './ResultsViewPageHelpers';
import {
    buildResultsViewPageTitle,
    doesQueryHaveCNSegmentData,
} from './ResultsViewPageStoreUtils';
import { AppStore } from '../../AppStore';
import { updateResultsViewQuery } from './ResultsViewQuery';
import { trackQuery } from '../../shared/lib/tracking';
import { onMobxPromise } from '../../shared/lib/onMobxPromise';
import QueryAndDownloadTabs from 'shared/components/query/QueryAndDownloadTabs';
import { createQueryStore } from 'pages/home/HomePage';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import { CancerStudyQueryUrlParams } from '../../shared/components/query/QueryStore';
import GeneSymbolValidationError from 'shared/components/query/GeneSymbolValidationError';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import { alterationInfoForOncoprintTrackData } from "shared/components/oncoprint/OncoprintUtils";
import { generateGeneAlterationData } from "./download/DownloadUtils";
import AddCheckedGenes from "./enrichments/AddCheckedGenes";
import LazyMobXTable, { Column } from "../../shared/components/lazyMobXTable/LazyMobXTable";
import { QueryParameter } from "shared/lib/ExtendedRouterStore";

function initStore(appStore: AppStore, isSecond: boolean) {
    const resultsViewPageStore = new ResultsViewPageStore(
        appStore,
        getBrowserWindow().globalStores.routing
    );

    resultsViewPageStore.tabId = getTabId(
        getBrowserWindow().globalStores.routing.location.pathname
    );

    let lastQuery: any;
    let lastPathname: string;

    const queryReactionDisposer = reaction(
        () => {

            console.log("What is it");
            console.log([getBrowserWindow().globalStores.routing.query, getBrowserWindow().globalStores.routing.location.pathname]);
            return [
                getBrowserWindow().globalStores.routing.query,
                getBrowserWindow().globalStores.routing.location.pathname,
            ];
        },
        (x: any) => {
            const query = (isSecond) ? _.cloneDeep(x[0]) : x[0] as CancerStudyQueryUrlParams;
            const pathname = x[1];


            // escape from this if queryies are deeply equal
            // TODO: see if we can figure out why query is getting changed and
            // if there's any way to do shallow equality check to avoid this expensive operation
            const queryChanged = !_.isEqual(lastQuery, query);
            const pathnameChanged = pathname !== lastPathname;
            if (!queryChanged && !pathnameChanged) {
                return;
            } else {
                if (
                    !getBrowserWindow().globalStores.routing.location.pathname.includes(
                        '/results'
                    )
                ) {
                    return;
                }
                runInAction(() => {
                    // set query and pathname separately according to which changed, to avoid unnecessary
                    //  recomputation by updating the query if only the pathname changed
                    if (queryChanged) {
                        // update query
                        // normalize cancer_study_list this handles legacy sessions/urls where queries with single study had different param name
                        const cancer_study_list =
                            query.cancer_study_list || query.cancer_study_id;

                        const cancerStudyIds: string[] = cancer_study_list.split(
                            ','
                        );

                        const cancerStudyIds: string[] = cancer_study_list.split(",");

                        if(isSecond){
                            query.gene_list = " CDK4 RB1 CDKN2A TP53 MDM2 CCNE1 CTNNB1 MEN1 APC ZNRF3 KDM1A KDM6B KDM4B KDM1B KDM4A KDM5B KDM6A KDM5A ERBB2 NRAS TSC2 PIK3CA PTEN FGFR3" + " HRAS STK11 INPP4B MTOR EGFR TSC1 ERBB3 NF1 E2F3 CCND1 FBXW7 ATM CDKN1A BRCA2 BRCA1 PIK3R1 MAP3K1 IKBKB AKT1 MAP2K4 AKT3 PAK1 IGF1R MDM4 CHEK2 IRS2 KRAS IGF2 BRAF ACVR2A TGFBR2 SMAD2 SMAD4 MYC TGFBR1 ACVR1B SMAD3 DKK3 TCF7L2 TCF7 DKK4 DKK1 AXIN2" + " ARID1A FZD10 LRP5 DKK2 SOX9 CDK6 MET FGFR1 FGFR2 PTCH1 CCND2 CDKN2B CDKN2C PDGFRA TRAF3 FADD LTBR BIRC2 CASP8 E2F1 TP63 FAT1 AJUBA NFE2L2 KEAP1 CUL3 RHEB HIF1A GRB10 SQSTM1 VHL SETD2 ARID1B ARID2 SMARCA4 MAP2K1 ALK ROS1 RIT1 RET NOTCH1 FOXP1 NOTCH2 SOX2 ASCL4 AKT2 RASA1 MXD1 MXD4 MXI1 MGA MYCL MLXIPL MAX MXD3 MLXIP MLX MYCN MNT NRARP CUL1 CREBBP NCOR2 SPEN NOTCH3 CNTN6 KAT2B DNER NCOR1 JAG2 PSEN2 EP300 ARRDC1 NOTCH4 MAML3 JAG1 MAML1 MAML2 RPTOR" + " PIK3R2 PPP2R1A PIK3R3 RICTOR KIT PTPN11 CBL FLT3 NTRK2 ERRFI1 ARAF RAF1 RAC1 ERBB4 MAPK1 FGFR4 SOS1 MAP2K2 NTRK1 AURKA PPP6C IDH1 JAK2 ACVR2B BCL2 BAD RPS6KA3 SOX17 GSK3B TLE1 TLE4 SFRP1 TCF7L1 WIF1 TLE2 AXIN1 SFRP2 TLE3 RNF43 LRP6 SFRP5 AMER1 SFRP4";
                        }
                        const oql = decodeURIComponent(query.gene_list);

                        let samplesSpecification = parseSamplesSpecifications(
                            query,
                            cancerStudyIds
                        );

                        const changes = updateResultsViewQuery(
                            resultsViewPageStore.rvQuery,
                            query,
                            samplesSpecification,
                            cancerStudyIds,
                            oql
                        );
                        if (changes.cohortIdsList) {
                            resultsViewPageStore.initDriverAnnotationSettings();
                        }

                        onMobxPromise(resultsViewPageStore.studyIds, () => {
                            try {
                                trackQuery(
                                    resultsViewPageStore.studyIds.result!,
                                    oql,
                                    resultsViewPageStore.hugoGeneSymbols,
                                    resultsViewPageStore.queriedVirtualStudies
                                        .result!.length > 0
                                );
                            } catch {}
                        });

                        lastQuery = query;
                    }
                    if (pathnameChanged) {
                        // need to set tab like this instead of with injected via params.tab because we need to set the tab
                        //  at the same time as we set the query parameters, otherwise we get race conditions where the tab
                        //  we're on at the time we update the query doesnt get unmounted because we change the query, causing
                        //  MSKTabs unmounting, THEN change the tab.
                        const tabId = getTabId(pathname);
                        if (resultsViewPageStore.tabId !== tabId) {
                            resultsViewPageStore.tabId = tabId;
                        }
                        lastPathname = pathname;
                    }
                });
            }
        },
        { fireImmediately: true }
    );

    resultsViewPageStore.queryReactionDisposer = queryReactionDisposer;

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
    private resultsViewPageStore2: ResultsViewPageStore;

    @observable showTabs = true;

    constructor(props: IResultsViewPageProps) {
        super(props);

        this.resultsViewPageStore = initStore(props.appStore, false);
        this.resultsViewPageStore2 = initStore(props.appStore, true);

        getBrowserWindow().resultsViewPageStore = this.resultsViewPageStore;
    }

    private handleTabChange(id: string, replace?: boolean) {
        this.props.routing.updateRoute({}, `results/${id}`, false, replace);
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
        this.resultsViewPageStore.queryReactionDisposer();
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
                                key={store.hugoGeneSymbols.join(',')}
                                routing={this.props.routing}
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
                            <PlotsTab store={store} />
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
                id: ResultsViewTab.ENRICHMENTS,
                hide: () => {
                    return !this.resultsViewPageStore.studies.isComplete;
                },
                getTab: () => {
                    return (
                        <MSKTab
                            key={10}
                            id={ResultsViewTab.ENRICHMENTS}
                            linkText={'Enrichments'}
                        >
                            <EnrichmentsTab store={store} />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.SURVIVAL,
                hide: () => {
                    return (
                        !this.resultsViewPageStore.survivalClinicalDataExists
                            .isComplete ||
                        !this.resultsViewPageStore.survivalClinicalDataExists
                            .result!
                    );
                },
                getTab: () => {
                    return (
                        <MSKTab
                            key={4}
                            id={ResultsViewTab.SURVIVAL}
                            linkText="Survival"
                        >
                            <SurvivalTab store={store} />
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
                            <div className="alert alert-info">The Network tab has been retired. For similar
                                functionality, please visit <a href="http://www.pathwaycommons.org/pcviz/"
                                                               target="_blank">http://www.pathwaycommons.org/pcviz/</a>
                            </div>
                        </MSKTab>
                    );
                },
            },
            {
                id:ResultsViewTab.PATHWAY_MAPPER,
                hide:()=>{
                    if (!this.resultsViewPageStore.studies.isComplete) {
                        return true;
                    } else {
                        return false;
                    }
                },
                getTab: () => {

                    const canShowPM = ( this.resultsViewPageStore2.sequencedSampleKeysByGene.isComplete &&
                        this.resultsViewPageStore2.oqlFilteredCaseAggregatedDataByOQLLine.isComplete &&
                        store.genes.isComplete);
                    let data;
                    if(canShowPM){
                        data = generateGeneAlterationData(
                            this.resultsViewPageStore2.oqlFilteredCaseAggregatedDataByOQLLine.result!,
                            this.resultsViewPageStore2.sequencedSampleKeysByGene.result!);
                    }
                    return <MSKTab key={13} id={ResultsViewTab.PATHWAY_MAPPER} linkText={'PathwayMapper'}>
                        {
                                canShowPM &&
                            <PathwayMapper isCBioPortal={true} isCollaborative={false}
                                            genes={store.genes.result as any}
                                            cBioAlterationData={data}
                                            queryParameter={QueryParameter.GENE_LIST}
                                            oncoPrintTab={ResultsViewTab.ONCOPRINT}/>
                        }
                        {
                                !canShowPM &&
                                (<LoadingIndicator isLoading={true} size={"big"} center={true}>
                                </LoadingIndicator>)
                        }
                    </MSKTab>;
                }
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

    public currentTab(tabId: string | undefined): string {
        // if we have no tab defined (query submission, no tab click)
        // we need to evaluate which should be the default tab
        // this can only be determined by know the count of physical studies in the query
        // (for virtual studies we need to fetch data determine constituent physical studies)
        if (tabId === undefined) {
            if (
                this.resultsViewPageStore.studies.result!.length > 1 &&
                this.resultsViewPageStore.hugoGeneSymbols.length === 1
            ) {
                return ResultsViewTab.CANCER_TYPES_SUMMARY; // cancer type study
            } else {
                return ResultsViewTab.ONCOPRINT; // this will resolve to first tab
            }
        } else {
            return tabId;
        }
    }

    @autobind
    private getTabHref(tabId: string) {
        return URL.format({
            pathname: tabId,
            query: this.props.routing.location.query,
            hash: this.props.routing.location.hash,
        });
    }

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
                            createQueryStore(this.props.routing.query)
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
                    {this.resultsViewPageStore.studies.isComplete && (
                        <Helmet>
                            <title>
                                {buildResultsViewPageTitle(
                                    this.resultsViewPageStore.hugoGeneSymbols,
                                    this.resultsViewPageStore.studies.result
                                )}
                            </title>
                        </Helmet>
                    )}
                    {this.resultsViewPageStore.studies.isComplete && (
                        <div>
                            <div className={'headBlock'}>
                                <QuerySummary
                                    routingStore={this.props.routing}
                                    store={this.resultsViewPageStore}
                                    onToggleQueryFormVisiblity={visible => {
                                        this.showTabs = visible;
                                    }}
                                />
                            </div>

                            {// we don't show the result tabs if we don't have valid query
                            this.showTabs &&
                                !this.resultsViewPageStore.genesInvalid &&
                                !this.resultsViewPageStore.isQueryInvalid && (
                                    <MSKTabs
                                        key={
                                            this.resultsViewPageStore.rvQuery
                                                .hash
                                        }
                                        activeTabId={this.currentTab(
                                            this.resultsViewPageStore.tabId
                                        )}
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
                    )}
                </>
            );
        }
    }

    public render() {
        if (
            this.resultsViewPageStore.studies.isComplete &&
            !this.resultsViewPageStore.tabId
        ) {
            setTimeout(() => {
                this.handleTabChange(
                    this.currentTab(this.resultsViewPageStore.tabId),
                    true
                );
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
