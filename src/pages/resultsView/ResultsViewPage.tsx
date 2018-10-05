import * as React from 'react';
import * as _ from 'lodash';
import $ from 'jquery';
import {observer, inject, Observer} from "mobx-react";
import {reaction, computed, observable, runInAction} from "mobx";
import {ResultsViewPageStore, SamplesSpecificationElement} from "./ResultsViewPageStore";
import CancerSummaryContainer from "pages/resultsView/cancerSummary/CancerSummaryContainer";
import Mutations from "./mutation/Mutations";
import MutualExclusivityTab from "./mutualExclusivity/MutualExclusivityTab";
import SurvivalTab from "./survival/SurvivalTab";
import DownloadTab from "./download/DownloadTab";
import AppConfig from 'appConfig';
import CNSegments from "./cnSegments/CNSegments";
import './styles.scss';
import {genes, parseOQLQuery} from "shared/lib/oql/oqlfilter.js";
import Network from "./network/Network";
import ResultsViewOncoprint from "shared/components/oncoprint/ResultsViewOncoprint";
import QuerySummary from "./querySummary/QuerySummary";
import {QueryStore} from "../../shared/components/query/QueryStore";
import Loader from "../../shared/components/loadingIndicator/LoadingIndicator";
import ExpressionWrapper from "./expression/ExpressionWrapper";
import EnrichmentsTab from 'pages/resultsView/enrichments/EnrichmentsTab';
import PlotsTab from "./plots/PlotsTab";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import autobind from "autobind-decorator";
import {ITabConfiguration} from "../../shared/model/ITabConfiguration";
import getBrowserWindow from "../../shared/lib/getBrowserWindow";
import CoExpressionTab from "./coExpression/CoExpressionTab";
import Helmet from "react-helmet";
import {createQueryStore} from "../home/HomePage";


function initStore() {

    const resultsViewPageStore = new ResultsViewPageStore();

    if (!getBrowserWindow().currentQueryStore) {
        getBrowserWindow().currentQueryStore = createQueryStore();
    }

    const reaction1 = reaction(
        () => {
            return getBrowserWindow().globalStores.routing.query
        },
        (query) => {


            if (!getBrowserWindow().globalStores.routing.location.pathname.includes("/results")) {
               return;
            }

            // normalize cancer_study_list this handles legacy sessions/urls where queries with single study had different param name
            const cancer_study_list = query.cancer_study_list || query.cancer_study_id;

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
            } else if (query.case_set_id !== "all") {
                // by definition if there is a case_set_id, there is only one study
                samplesSpecification = [
                    {
                        studyId:cancer_study_list,
                        sampleListId:query.case_set_id,
                        sampleId:undefined
                    }
                ]
            } else {
                samplesSpecification = cancer_study_list.split(",").map((studyId:string)=>{
                    return {
                        studyId,
                        sampleListId:`${studyId}_all`,
                        sampleId:undefined
                    }
                });
            }




            function getMolecularProfiles(query:any){
                //if there's only one study, we read profiles from query params and filter out undefined
                let molecularProfiles = [
                    query.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
                    query.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
                    query.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
                    query.genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION,
                ].filter((profile:string|undefined)=>!!profile);

                // append 'genetic_profile_ids' which is sometimes in use
                molecularProfiles = molecularProfiles.concat(query.genetic_profile_ids || []);

                // filter out duplicates
                molecularProfiles = _.uniq(molecularProfiles);

                return molecularProfiles;
            }

            runInAction(() => {

                if (!resultsViewPageStore.samplesSpecification || !_.isEqual(resultsViewPageStore.samplesSpecification.slice(), samplesSpecification)) {
                    resultsViewPageStore.samplesSpecification = samplesSpecification;
                }

                if (query.data_priority !== undefined && parseInt(query.data_priority,10) !== resultsViewPageStore.profileFilter) {
                    resultsViewPageStore.profileFilter = parseInt(query.data_priority,10);
                }

                // note that this could be zero length if we have multiple studies
                // in that case we derive default selected profiles
                const profiles = getMolecularProfiles(query);
                if (!resultsViewPageStore.selectedMolecularProfileIds || !_.isEqual(resultsViewPageStore.selectedMolecularProfileIds.slice(), profiles)) {
                    resultsViewPageStore.selectedMolecularProfileIds = profiles;
                }

                if (!_.isEqual(query.RPPA_SCORE_THRESHOLD, resultsViewPageStore.rppaScoreThreshold)) {
                    resultsViewPageStore.rppaScoreThreshold = parseFloat(query.RPPA_SCORE_THRESHOLD);
                }

                if (!_.isEqual(query.Z_SCORE_THRESHOLD, resultsViewPageStore.zScoreThreshold)) {
                    resultsViewPageStore.zScoreThreshold = parseFloat(query.Z_SCORE_THRESHOLD);
                }

                if (query.geneset_list) {
                    // we have to trim because for some reason we get a single space from submission
                    const parsedGeneSetList = query.geneset_list.trim().length ? (query.geneset_list.trim().split(/\s+/)) : [];
                    if (!_.isEqual(parsedGeneSetList, resultsViewPageStore.genesetIds)) {
                        resultsViewPageStore.genesetIds = parsedGeneSetList;
                    }
                }

                if (!resultsViewPageStore.cohortIdsList || !_.isEqual(resultsViewPageStore.cohortIdsList.slice(), cancer_study_list.split(","))) {
                    resultsViewPageStore.cohortIdsList = cancer_study_list.split(",");
                }

                if (resultsViewPageStore.oqlQuery !== oql) {
                    resultsViewPageStore.oqlQuery = oql;
                }

            });
        },
        {fireImmediately: true}
    );

    return resultsViewPageStore;
}


function addOnBecomeVisibleListener(callback:()=>void) {
    $('#oncoprint-result-tab').click(callback);
}

export interface IResultsViewPageProps {
    routing: any;
    params: any; // from react router
}

export enum ResultsViewTab {
    ONCOPRINT="oncoprintTab",
    CANCER_TYPES_SUMMARY="cancerTypesSummaryTab",
    MUTUAL_EXCLUSIVITY="mutualExclusivityTab",
    PLOTS="plots",
    MUTATIONS="mutationsTab",
    COEXPRESSION="coexpression",
    ENRICHMENT="enrichment",
    SURVIVAL="survivalTab",
    CN_SEGMENTS="copyNumberSegmentsTab",
    NETWORK="network",
    EXPRESSION="expression",
    DOWNLOAD="download"
}

@inject('routing')
@observer
export default class ResultsViewPage extends React.Component<IResultsViewPageProps, {}> {

    private showTwitter = AppConfig.showTwitter === true;
    private resultsViewPageStore: ResultsViewPageStore;

    constructor(props: IResultsViewPageProps) {
        super(props);

        this.resultsViewPageStore = initStore();

        getBrowserWindow().resultsViewPageStore = this.resultsViewPageStore;
    }

    // this needs to be replaced.  we shouldn't need queryStore reference
    // because queryStore and results store should only interact via url
    get queryStore(){
        return getBrowserWindow().currentQueryStore;
    }

    @observable currentQuery = true;

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({},`results/${id}`);
    }

    @autobind
    private customTabMountCallback(div:HTMLDivElement,tab:any){
        if (typeof getBrowserWindow()[tab.mountCallbackName] === 'function'){
            getBrowserWindow()[tab.mountCallbackName](div, this.props.routing.location, this.resultsViewPageStore, tab.customParameters || {});
        } else {
            alert(`Tab mount callback not implemented for ${tab.title}`)
        }
    }

    @computed
    private get tabs() {

        const store = this.resultsViewPageStore;

        const tabMap:ITabConfiguration[] = [

            {
                id:"oncoprint",
                getTab: () => {
                    return <MSKTab key={0} id={ResultsViewTab.ONCOPRINT} linkText="OncoPrint">
                        <ResultsViewOncoprint
                            divId={'oncoprintDiv'}
                            store={store}
                            key={store.hugoGeneSymbols.join(",")}
                            routing={this.props.routing}
                            isVirtualStudy={getBrowserWindow().currentQueryStore.isVirtualStudyQuery}
                            addOnBecomeVisibleListener={addOnBecomeVisibleListener}
                        />
                    </MSKTab>
                }
            },

            {
                id:"cancer_types_summary",
                getTab: () => {
                    return (<MSKTab key={1} id={ResultsViewTab.CANCER_TYPES_SUMMARY} linkText="Cancer Types Summary">
                        <CancerSummaryContainer
                            store={store}
                        />
                    </MSKTab>)
                }
            },

            {
                id:"mutual_exclusivity",
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
                id:"plots",
                hide:()=>{
                    return this.resultsViewPageStore.studies.result!.length > 1;
                },
                getTab: () => {
                    return <MSKTab key={12} id={ResultsViewTab.PLOTS} linkText={'Plots'}>
                        <PlotsTab store={store}/>
                    </MSKTab>
                }
            },

            {
                id:"mutations",
                getTab: () => {
                    return <MSKTab key={3} id={ResultsViewTab.MUTATIONS} linkText="Mutations">
                        <Mutations store={store}/>
                    </MSKTab>
                }
            },

            {
                id:"co_expression",
                hide:()=>{
                    return this.resultsViewPageStore.studies.result!.length > 1;
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
                id:"enrichments",
                hide:()=>{
                    return this.resultsViewPageStore.studies.result!.length > 1;
                },
                getTab: () => {
                    return <MSKTab key={10} id={ResultsViewTab.ENRICHMENT} linkText={'Enrichments'}>
                        <EnrichmentsTab store={store}/>
                    </MSKTab>
                }
            },

            {
                id:"survival",
                hide:()=>{
                    return this.resultsViewPageStore.studies.result!.length > 1;
                },
                getTab: () => {
                    return <MSKTab key={4} id={ResultsViewTab.SURVIVAL} linkText="Survival">
                        <SurvivalTab store={store}/>
                    </MSKTab>
                }
            },

            {
                id:"IGV",
                hide:()=>{
                    return this.resultsViewPageStore.studies.result!.length > 1;
                },
                getTab: () => {
                    return <MSKTab key={6} id={ResultsViewTab.CN_SEGMENTS}
                                   linkText="CN Segments">
                        <CNSegments store={store}/>
                    </MSKTab>
                }
            },

            {
                id:"network",
                hide:()=>{
                    return this.resultsViewPageStore.studies.result!.length > 1;
                },
                getTab: () => {
                    return <MSKTab key={9} id={ResultsViewTab.NETWORK} linkText={'Network'}>
                        {
                            (store.studies.isComplete && store.sampleLists.isComplete && store.samples.isComplete) &&
                            (<Network genes={store.genes.result!}
                                      profileIds={store.selectedMolecularProfileIds}
                                      cancerStudyId={store.studies.result[0].studyId}
                                      zScoreThreshold={store.zScoreThreshold}
                                      caseSetId={(store.sampleLists.result!.length > 0) ? store.sampleLists.result![0].sampleListId : "-1"}
                                      sampleIds={store.samples.result.map((sample)=>sample.sampleId)}
                                      caseIdsKey={""}
                            />)
                        }
                    </MSKTab>
                }
            },

            {
                id:"expression",
                hide:()=> {
                    return this.resultsViewPageStore.studies.result!.length === 1;
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
                id:"download",
                getTab: () => {
                    return <MSKTab key={11} id={ResultsViewTab.DOWNLOAD} linkText={'Download'}>
                        <DownloadTab store={store}/>
                    </MSKTab>
                }
            }

        ];

        let filteredTabs = tabMap.filter(this.evaluateTabInclusion).map((tab)=>tab.getTab());

        // now add custom tabs
        if (AppConfig.customTabs) {
            const customResultsTabs = AppConfig.customTabs.filter((tab: any) => tab.location === "RESULTS_PAGE").map((tab: any, i: number) => {
                return (<MSKTab key={100 + i} id={'customTab' + 1} unmountOnHide={(tab.unmountOnHide === true)}
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

    public evaluateTabInclusion(tab:ITabConfiguration){
        const excludedTabs = AppConfig.disabledTabs || [];
        const isExcludedInList = excludedTabs.includes(tab.id);
        const isExcluded = (tab.hide) ? tab.hide() : false;
        return !isExcludedInList && !isExcluded;
    }

    // if it's undefined, MSKTabs will default to first
    public currentTab(tabId:string|undefined):string | undefined {
        // if we have no tab defined (query submission, no tab click)
        // we need to evaluate which should be the default tab
        if (tabId === undefined) {
            if (this.resultsViewPageStore.studies.result!.length > 1 && this.resultsViewPageStore.hugoGeneSymbols.length === 1) {
                return "cancerTypesSummaryTab"; // cancer type study
            } else {
                return undefined; // this will resolve to first tab
            }
        } else {
            return tabId;
        }
    }

    public render() {
        return (
            <PageLayout noMargin={true}>

                <Helmet>
                    <title>{'cBioPortal for Cancer Genomics::Results'}</title>
                </Helmet>

                {
                    (this.currentQuery) && (<div>

                        <div style={{margin:"0 20px 10px 20px"}}>
                            <QuerySummary queryStore={getBrowserWindow().currentQueryStore} routingStore={this.props.routing} store={this.resultsViewPageStore}/>
                        </div>
                        {
                            (this.resultsViewPageStore.studies.isComplete) && (
                                <MSKTabs key={(window as any).routingStore.queryHash} activeTabId={this.currentTab(this.props.params.tab)} unmountOnHide={false}
                                         onTabClick={(id: string) => this.handleTabChange(id)} className="mainTabs">
                                    {
                                        this.tabs
                                    }
                                </MSKTabs>
                            )
                        }

                    </div>)
                }
            </PageLayout>
        )

    }


}
