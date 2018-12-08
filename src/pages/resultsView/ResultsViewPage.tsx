import * as React from "react";
import * as _ from "lodash";
import $ from "jquery";
import {inject, observer} from "mobx-react";
import {computed, reaction, runInAction} from "mobx";
import {ResultsViewPageStore, SamplesSpecificationElement} from "./ResultsViewPageStore";
import CancerSummaryContainer from "pages/resultsView/cancerSummary/CancerSummaryContainer";
import Mutations from "./mutation/Mutations";
import MutualExclusivityTab from "./mutualExclusivity/MutualExclusivityTab";
import SurvivalTab from "./survival/SurvivalTab";
import DownloadTab from "./download/DownloadTab";
import AppConfig from "appConfig";
import CNSegments from "./cnSegments/CNSegments";
import "./styles.scss";
import Network from "./network/Network";
import ResultsViewOncoprint from "shared/components/oncoprint/ResultsViewOncoprint";
import QuerySummary from "./querySummary/QuerySummary";
import ExpressionWrapper from "./expression/ExpressionWrapper";
import EnrichmentsTab from "pages/resultsView/enrichments/EnrichmentsTab";
import PlotsTab from "./plots/PlotsTab";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import autobind from "autobind-decorator";
import {ITabConfiguration} from "../../shared/model/ITabConfiguration";
import getBrowserWindow from "../../shared/lib/getBrowserWindow";
import CoExpressionTab from "./coExpression/CoExpressionTab";
import Helmet from "react-helmet";
import {showCustomTab} from "../../shared/lib/customTabs";
import {getTabId, parseConfigDisabledTabs, ResultsViewTab} from "./ResultsViewPageHelpers";
import {buildResultsViewPageTitle, doesQueryHaveCNSegmentData} from "./ResultsViewPageStoreUtils";
import {AppStore} from "../../AppStore";
import {bind} from "bind-decorator";
import {updateResultsViewQuery} from "./ResultsViewQuery";
import {trackQuery} from "../../shared/lib/tracking";
import {onMobxPromise} from "../../shared/lib/onMobxPromise";

function initStore() {

    const resultsViewPageStore = new ResultsViewPageStore();

    resultsViewPageStore.tabId = getTabId(getBrowserWindow().globalStores.routing.location.pathname);

    let lastQuery:any;
    let lastPathname:string;

    const queryReactionDisposer = reaction(
        () => {
            return [getBrowserWindow().globalStores.routing.query, getBrowserWindow().globalStores.routing.location.pathname];
        },
        (x:any) => {

            const query = x[0];
            const pathname = x[1];

            // escape from this if queryies are deeply equal
            // TODO: see if we can figure out why query is getting changed and
            // if there's any way to do shallow equality check to avoid this expensive operation
            const queryChanged = !_.isEqual(lastQuery, query);
            const pathnameChanged = (pathname !== lastPathname);
            if (!queryChanged && !pathnameChanged) {
                return;
            } else {

                if (!getBrowserWindow().globalStores.routing.location.pathname.includes("/results")) {
                   return;
                }
                runInAction(()=>{
                    // set query and pathname separately according to which changed, to avoid unnecessary
                    //  recomputation by updating the query if only the pathname changed
                    if (queryChanged) {
                        // update query
                        // normalize cancer_study_list this handles legacy sessions/urls where queries with single study had different param name
                        const cancer_study_list = query.cancer_study_list || query.cancer_study_id;

                        const cancerStudyIds: string[] = cancer_study_list.split(",");

                        const oql = decodeURIComponent(query.gene_list);

                        let samplesSpecification: SamplesSpecificationElement[];

                        if (query.case_ids && query.case_ids.length > 0) {
                            const case_ids = query.case_ids.split("+");
                            samplesSpecification = case_ids.map((item:string)=>{
                                const split = item.split(":");
                                return {
                                   studyId:split[0],
                                   sampleId:split[1]
                                }
                            });
                        } else if (query.sample_list_ids) {
                            samplesSpecification = query.sample_list_ids.split(",").map((studyListPair:string)=>{
                                const pair = studyListPair.split(":");
                                return {
                                    studyId:pair[0],
                                    sampleListId:pair[1],
                                    sampleId: undefined
                                }
                            });
                        } else if (query.case_set_id !== "all") {
                                // by definition if there is a case_set_id, there is only one study
                                samplesSpecification = cancerStudyIds.map((studyId:string)=>{
                                    return {
                                        studyId: studyId,
                                        sampleListId: query.case_set_id,
                                        sampleId: undefined
                                    };
                                });
                        } else if (query.case_set_id === "all") { // case_set_id IS equal to all
                            samplesSpecification = cancerStudyIds.map((studyId:string)=>{
                                return {
                                    studyId,
                                    sampleListId:`${studyId}_all`,
                                    sampleId:undefined
                                }
                            });
                        } else {
                            throw("INVALID QUERY");
                        }

                        const changes = updateResultsViewQuery(resultsViewPageStore.rvQuery, query, samplesSpecification, cancerStudyIds, oql);
                        if (changes.cohortIdsList) {
                            resultsViewPageStore.initMutationAnnotationSettings();
                        }

                        onMobxPromise(resultsViewPageStore.studyIds, ()=>{
                            try {
                                trackQuery(resultsViewPageStore.studyIds.result!, oql, resultsViewPageStore.hugoGeneSymbols, resultsViewPageStore.virtualStudies.result!.length > 0);
                            } catch {};
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
        {fireImmediately: true}
    );

    resultsViewPageStore.queryReactionDisposer = queryReactionDisposer;

    return resultsViewPageStore;
}


function addOnBecomeVisibleListener(callback:()=>void) {
    $('#oncoprint-result-tab').click(callback);
}

export interface IResultsViewPageProps {
    routing: any;
    appStore: AppStore;
    params: any; // from react router
}

@inject('appStore','routing')
@observer
export default class ResultsViewPage extends React.Component<IResultsViewPageProps, {}> {

    private resultsViewPageStore: ResultsViewPageStore;

    constructor(props: IResultsViewPageProps) {
        super(props);

        this.resultsViewPageStore = initStore();

        getBrowserWindow().resultsViewPageStore = this.resultsViewPageStore;
    }

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({},`results/${id}`);
    }

    @autobind
    private customTabMountCallback(div:HTMLDivElement,tab:any){
        showCustomTab(div, tab, this.props.routing.location, this.resultsViewPageStore);
    }

    componentWillUnmount(){
        this.resultsViewPageStore.queryReactionDisposer();
    }

    @computed
    private get tabs() {

        const store = this.resultsViewPageStore;

        const tabMap:ITabConfiguration[] = [

            {
                id:ResultsViewTab.ONCOPRINT,
                getTab: () => {
                    return <MSKTab key={0} id={ResultsViewTab.ONCOPRINT} linkText="OncoPrint">
                        <ResultsViewOncoprint
                            divId={'oncoprintDiv'}
                            store={store}
                            key={store.hugoGeneSymbols.join(",")}
                            routing={this.props.routing}
                            addOnBecomeVisibleListener={addOnBecomeVisibleListener}
                        />
                    </MSKTab>
                }
            },

            {
                id:ResultsViewTab.CANCER_TYPES_SUMMARY,
                getTab: () => {
                    return (<MSKTab key={1} id={ResultsViewTab.CANCER_TYPES_SUMMARY} linkText="Cancer Types Summary">
                        <CancerSummaryContainer
                            store={store}
                        />
                    </MSKTab>)
                }
            },

            {
                id:ResultsViewTab.MUTUAL_EXCLUSIVITY,
                getTab: () => {
                    return <MSKTab key={5} id={ResultsViewTab.MUTUAL_EXCLUSIVITY} linkText="Mutual Exclusivity">
                        <MutualExclusivityTab store={store}/>
                    </MSKTab>
                },
                hide:()=>{
                    return this.resultsViewPageStore.hugoGeneSymbols.length < 2;
                }
            },

            {
                id:ResultsViewTab.PLOTS,
                hide:()=>{
                    if (!this.resultsViewPageStore.studies.isComplete) {
                        return true;
                    } else {
                        return this.resultsViewPageStore.studies.result!.length > 1;
                    }
                },
                getTab: () => {
                    return <MSKTab key={12} id={ResultsViewTab.PLOTS} linkText={'Plots'}>
                        <PlotsTab store={store}/>
                    </MSKTab>
                }
            },

            {
                id:ResultsViewTab.MUTATIONS,
                getTab: () => {
                    return <MSKTab key={3} id={ResultsViewTab.MUTATIONS} linkText="Mutations">
                        <Mutations store={store} appStore={ this.props.appStore } />
                    </MSKTab>
                }
            },

            {
                id:ResultsViewTab.COEXPRESSION,
                hide:()=>{
                    if (!this.resultsViewPageStore.isThereDataForCoExpressionTab.isComplete ||
                        !this.resultsViewPageStore.studies.isComplete) {
                        return true;
                    } else {
                        const tooManyStudies = this.resultsViewPageStore.studies.result!.length > 1;
                        const noData = !this.resultsViewPageStore.isThereDataForCoExpressionTab.result;
                        return tooManyStudies || noData;
                    }
                },
                getTab: () => {
                    return <MSKTab key={7} id={ResultsViewTab.COEXPRESSION} linkText={'Co-expression'}>
                        <CoExpressionTab
                            store={store}
                        />
                    </MSKTab>
                }
            },

            {
                id:ResultsViewTab.ENRICHMENTS,
                hide:()=>{
                    if (!this.resultsViewPageStore.studies.isComplete) {
                        return true;
                    } else {
                        return this.resultsViewPageStore.studies.result!.length > 1;
                    }
                },
                getTab: () => {
                    return <MSKTab key={10} id={ResultsViewTab.ENRICHMENTS} linkText={'Enrichments'}>
                        <EnrichmentsTab store={store}/>
                    </MSKTab>
                }
            },

            {
                id:ResultsViewTab.SURVIVAL,
                hide:()=>{
                    return !this.resultsViewPageStore.survivalClinicalDataExists.isComplete ||
                        !this.resultsViewPageStore.survivalClinicalDataExists.result!;
                },
                getTab: () => {
                    return <MSKTab key={4} id={ResultsViewTab.SURVIVAL} linkText="Survival">
                        <SurvivalTab store={store}/>
                    </MSKTab>
                }
            },

            {
                id:ResultsViewTab.CN_SEGMENTS,
                hide:()=>{
                    if (!this.resultsViewPageStore.studies.isComplete || !this.resultsViewPageStore.genes.isComplete) {
                        return true;
                    } else {
                        const tooManyStudies = this.resultsViewPageStore.studies.result!.length > 1;
                        const noData = !doesQueryHaveCNSegmentData(this.resultsViewPageStore.samples.result);
                        return tooManyStudies || noData;
                    }
                },
                getTab: () => {
                    return <MSKTab key={6} id={ResultsViewTab.CN_SEGMENTS}
                                   linkText="CN Segments">
                        <CNSegments store={store}/>
                    </MSKTab>
                }
            },

            {
                id:ResultsViewTab.NETWORK,
                hide:()=>{
                    if (!this.resultsViewPageStore.studies.isComplete) {
                        return true;
                    } else {
                        return this.resultsViewPageStore.studies.result!.length > 1;
                    }
                },
                getTab: () => {
                    return <MSKTab key={9} id={ResultsViewTab.NETWORK} linkText={'Network'}>
                        {
                            (store.studies.isComplete && store.sampleLists.isComplete && store.samples.isComplete) &&
                            (<Network genes={store.genes.result!}
                                      profileIds={store.rvQuery.selectedMolecularProfileIds}
                                      cancerStudyId={store.studies.result[0].studyId}
                                      zScoreThreshold={store.rvQuery.zScoreThreshold}
                                      caseSetId={(store.sampleLists.result!.length > 0) ? store.sampleLists.result![0].sampleListId : "-1"}
                                      sampleIds={store.samples.result.map((sample)=>sample.sampleId)}
                                      caseIdsKey={""}
                            />)
                        }
                    </MSKTab>
                }
            },

            {
                id:ResultsViewTab.EXPRESSION,
                hide:()=> {
                    if (!this.resultsViewPageStore.studies.isComplete) {
                        return true;
                    } else {
                        return this.resultsViewPageStore.studies.result!.length === 1;
                    }
                },
                getTab: () => {

                    return <MSKTab key={8} id={ResultsViewTab.EXPRESSION}

                                   linkText={'Expression'}
                    >
                        {
                            (store.studyIdToStudy.isComplete
                                && store.putativeDriverAnnotatedMutations.isComplete
                                && store.genes.isComplete
                                && store.coverageInformation.isComplete) &&
                            (<ExpressionWrapper store={store}
                                studyMap={store.studyIdToStudy.result}
                                genes={store.genes.result}
                                expressionProfiles={store.expressionProfiles}
                                numericGeneMolecularDataCache={store.numericGeneMolecularDataCache}
                                mutations={store.putativeDriverAnnotatedMutations.result!}
                                RNASeqVersion={store.expressionTabSeqVersion}
                                coverageInformation={store.coverageInformation.result}
                                onRNASeqVersionChange={(version:number)=>store.expressionTabSeqVersion=version}
                            />)
                        }
                    </MSKTab>
                }
            },

            {
                id:ResultsViewTab.DOWNLOAD,
                getTab: () => {
                    return <MSKTab key={11} id={ResultsViewTab.DOWNLOAD} linkText={'Download'}>
                        <DownloadTab store={store}/>
                    </MSKTab>
                }
            }

        ];

        let filteredTabs = tabMap.filter(this.evaluateTabInclusion).map((tab)=>tab.getTab());

        // now add custom tabs
        if (AppConfig.serverConfig.custom_tabs) {
            const customResultsTabs = AppConfig.serverConfig.custom_tabs.filter((tab: any) => tab.location === "RESULTS_PAGE").map((tab: any, i: number) => {
                return (<MSKTab key={100 + i} id={'customTab' + i} unmountOnHide={(tab.unmountOnHide === true)}
                                onTabDidMount={(div) => {
                                    this.customTabMountCallback(div, tab)
                                }}
                                linkText={tab.title}
                    />
                )
            });
            filteredTabs = filteredTabs.concat(customResultsTabs);
        }

        return filteredTabs;

    }

    @autobind
    public evaluateTabInclusion(tab:ITabConfiguration){
        const excludedTabs = AppConfig.serverConfig.disabled_tabs || "";
        const isExcludedInList = parseConfigDisabledTabs(excludedTabs).includes(tab.id);
        const isRoutedTo = (this.resultsViewPageStore.tabId === tab.id);
        const isExcluded = (tab.hide) ? tab.hide() : false;

        // we show no matter what if its routed to
        return isRoutedTo || (!isExcludedInList && !isExcluded);
    }

    public currentTab(tabId:string|undefined):string {
        // if we have no tab defined (query submission, no tab click)
        // we need to evaluate which should be the default tab
        // this can only be determined by know the count of physical studies in the query
        // (for virtual studies we need to fetch data determine constituent physical studies)
        if (tabId === undefined) {
            if (this.resultsViewPageStore.studies.result!.length > 1 && this.resultsViewPageStore.hugoGeneSymbols.length === 1) {
                return ResultsViewTab.CANCER_TYPES_SUMMARY; // cancer type study
            } else {
                return ResultsViewTab.ONCOPRINT; // this will resolve to first tab
            }
        } else {
            return tabId;
        }
    }

    @computed get pageContent(){

        // if studies are complete but we don't have a tab id in route, we need to derive default
        return (<div>
            {
                (this.resultsViewPageStore.studies.isComplete) && (
                    <Helmet>
                        <title>{buildResultsViewPageTitle(this.resultsViewPageStore.hugoGeneSymbols, this.resultsViewPageStore.studies.result)}</title>
                    </Helmet>
                )
            }
            {(this.resultsViewPageStore.studies.isComplete) && (
                    <div>
                        <div style={{margin:"0 20px 10px 20px"}}>
                            <QuerySummary routingStore={this.props.routing} store={this.resultsViewPageStore}/>
                        </div>

                        <MSKTabs key={this.resultsViewPageStore.rvQuery.hash} activeTabId={this.currentTab(this.resultsViewPageStore.tabId)} unmountOnHide={false}
                                 onTabClick={(id: string) => this.handleTabChange(id)} className="mainTabs">
                            {
                                this.tabs
                            }
                        </MSKTabs>

                    </div>
                )
            }
        </div>)
    }

    public render() {

        if (this.resultsViewPageStore.studies.isComplete && !this.resultsViewPageStore.tabId) {
            setTimeout(()=>{
                this.handleTabChange(this.currentTab(this.resultsViewPageStore.tabId));
            });
            return null;
        } else {
            return (
                <PageLayout noMargin={true}>
                    {
                        this.pageContent
                    }
                </PageLayout>
            )
        }

    }


}

