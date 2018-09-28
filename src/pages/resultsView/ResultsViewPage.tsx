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
import ExpressionWrapper from "./expression/ExpressionWrapper";
import EnrichmentsTab from 'pages/resultsView/enrichments/EnrichmentsTab';
import {Bookmark} from "./bookmark/Bookmark";
import PlotsTab from "./plots/PlotsTab";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import {createQueryStore} from "./SPA";
import autobind from "autobind-decorator";
import {ITabConfiguration} from "../../shared/model/ITabConfiguration";
import getBrowserWindow from "../../shared/lib/getBrowserWindow";
import CoExpressionTab from "./coExpression/CoExpressionTab";

function initStore() {

    const resultsViewPageStore = new ResultsViewPageStore();

    if (!getBrowserWindow().currentQueryStore) {
        getBrowserWindow().currentQueryStore = createQueryStore();
    }

    const reaction1 = reaction(
        () => {
            return getBrowserWindow().globalStores.routing.query
        },
        query => {

            if (!getBrowserWindow().globalStores.routing.location.pathname.includes("/results")) {
               return;
            }

            console.log("running reaction for results");
            console.log("submitted query", query);

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
                        studyId:query.cancer_study_list,
                        sampleListId:query.case_set_id,
                        sampleId:undefined
                    }
                ]
            } else {
                samplesSpecification = query.cancer_study_list.split(",").map((studyId:string)=>{
                    return {
                        studyId,
                        sampleListId:`${studyId}_all`,
                        sampleId:undefined
                    }
                });
            }



            function getMolecularProfiles(query:any){
                //if there's only one study, we read profiles from query params and filter out udfine
                const molecularProfiles = [
                    query.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
                    query.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
                    query.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
                    query.genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION,
                ].filter((profile:string|undefined)=>!!profile);

                return molecularProfiles;
            }

            runInAction(() => {

                if (!resultsViewPageStore.samplesSpecification || !_.isEqual(resultsViewPageStore.samplesSpecification.slice(), samplesSpecification)) {
                    resultsViewPageStore.samplesSpecification = samplesSpecification;
                }

                if (query.data_priority && query.data_priority !== resultsViewPageStore.profileFilter) {
                    resultsViewPageStore.profileFilter = parseInt(query.data_priority,10);
                }

                const geneSymbols = parseOQLQuery(oql).map((o: any) => o.gene);
                if (!resultsViewPageStore.hugoGeneSymbols || !_.isEqual(resultsViewPageStore.hugoGeneSymbols.slice(), geneSymbols)) {
                    resultsViewPageStore.hugoGeneSymbols = geneSymbols;
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

                if (!resultsViewPageStore.cohortIdsList || !_.isEqual(resultsViewPageStore.cohortIdsList.slice(), query.cancer_study_list.split(","))) {
                    resultsViewPageStore.cohortIdsList = query.cancer_study_list.split(",");
                }




                //resultsViewPageStore.genesetIds = genesetIds;
                resultsViewPageStore.oqlQuery = oql;
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
                    return <MSKTab key={0} id="oncoprintTab" linkText="Oncoprint">
                        <ResultsViewOncoprint
                            divId={'oncoprintContainer'}
                            store={store}
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

                    const isComplete = store.samplesExtendedWithClinicalData.isComplete && store.alterationsByGeneBySampleKey.isComplete && store.studies.isComplete;

                    return (<MSKTab key={1} id="cancerTypesSummaryTab" loading={!isComplete} linkText="Cancer Types Summary">
                        <CancerSummaryContainer
                            genes={store.genes.result!}
                            samplesExtendedWithClinicalData={store.samplesExtendedWithClinicalData.result!}
                            alterationsByGeneBySampleKey={store.alterationsByGeneBySampleKey.result!}
                            studies={store.studies.result!}
                            studyMap={store.physicalStudySet}
                        />
                    </MSKTab>)
                }
            },

            {
                id:"mutual_exclusivity",
                getTab: () => {
                    return <MSKTab key={5} id="mutualExclusivityTab" loading={!store.isSampleAlteredMap.isComplete} linkText="Mutual Exclusivity">
                        <MutualExclusivityTab store={store}/>
                    </MSKTab>
                }
            },

            {
                id:"plots",
                hide:()=>{
                    return this.resultsViewPageStore.studies.result!.length > 1;
                },
                getTab: () => {
                    return <MSKTab key={12} id="plots" linkText={'Plots'}>
                        <PlotsTab store={store}/>
                    </MSKTab>
                }
            },

            {
                id:"mutations",
                getTab: () => {
                    return <MSKTab key={3} id="mutationsTab" loading={store.mutationMapperStores.isPending} linkText="Mutations">
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

                    const isLoading = store.molecularProfilesInStudies.isPending ||
                    store.genes.isPending ||
                    store.studyToDataQueryFilter.isPending ||
                    store.geneMolecularDataCache.isPending;

                    return <MSKTab key={7} id="coexpression" loading={isLoading} linkText={'Coexpression'}>
                        <CoExpressionTab
                            store={store}
                            molecularProfiles={store.molecularProfilesInStudies.result}
                            genes={store.genes.result!}
                            studyToDataQueryFilter={store.studyToDataQueryFilter.result}
                            numericGeneMolecularDataCache={store.numericGeneMolecularDataCache}
                            mutationCache={store.mutationCache}
                            molecularProfileIdToProfiledSampleCount={store.molecularProfileIdToProfiledSampleCount}
                            coverageInformation={store.coverageInformation}
                            studyToMutationMolecularProfile={store.studyToMutationMolecularProfile}
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

                    const isLoading = store.mutationEnrichmentProfiles.isPending ||
                        store.unalteredSampleKeys.isPending ||
                        store.mutationEnrichmentProfiles.isPending ||
                        store.copyNumberEnrichmentProfiles.isPending ||
                        store.mRNAEnrichmentProfiles.isPending ||
                        store.proteinEnrichmentProfiles.isPending

                    return <MSKTab key={10} id="enrichment" loading={isLoading} linkText={'Enrichment'}>
                        <EnrichmentsTab store={store}/>
                    </MSKTab>
                }
            },

            {
                id:"IGV",
                hide:()=>{
                    return this.resultsViewPageStore.studies.result!.length > 1;
                },
                getTab: () => {
                    return <MSKTab key={6} id="copyNumberSegmentsTab"
                                   linkText="CN Segments">
                        <CNSegments store={store}/>
                    </MSKTab>
                }
            },

            {
                id:"survival",
                hide:()=>{
                    return this.resultsViewPageStore.studies.result!.length > 1;
                },
                getTab: () => {
                    return <MSKTab key={4} id="survivalTab" linkText="Survival">
                        <SurvivalTab store={store}/>
                    </MSKTab>
                }
            },

            {
                id:"network",
                hide:()=>{
                    return this.resultsViewPageStore.studies.result!.length > 1;
                },
                getTab: () => {
                    return <MSKTab key={9} id="network"
                                   loading={store.studies.isPending || store.sampleLists.isPending}
                                   linkText={'Network'}
                    >
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
                    return <MSKTab key={8} id="expression"
                                   loading={(store.rnaSeqMolecularData.isPending || store.studyIdToStudy.isPending || store.mutations.isPending || store.genes.isPending || store.coverageInformation.isPending)}
                                   linkText={'Expression'}
                    >
                        {
                            (store.rnaSeqMolecularData.isComplete && store.studyIdToStudy.isComplete && store.mutations.isComplete && store.genes.isComplete && store.coverageInformation.isComplete) &&
                            (<ExpressionWrapper
                                store={store}
                                studyMap={store.studyIdToStudy.result}
                                genes={store.genes.result}
                                data={store.rnaSeqMolecularData.result}
                                mutations={store.mutations.result}
                                RNASeqVersion={store.expressionTabSeqVersion}
                                coverageInformation={store.coverageInformation.result}
                                onRNASeqVersionChange={(version: number) => store.expressionTabSeqVersion = version}
                            />)
                        }
                    </MSKTab>
                }
            },

            {
                id:"download",
                getTab: () => {
                    return <MSKTab key={11} id="download" linkText={'Download'}>
                        <DownloadTab store={store}/>
                    </MSKTab>
                }
            },

           {
                id:"bookmark",
                getTab: () => {
                    return <MSKTab key={12} id="bookmark" linkText={'Bookmark'}>
                        <Bookmark urlPromise={store.bookmarkLinks}/>
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

    public currentTab(pathname:string):string {
        return pathname.split('/')[2];
    }

    public render() {

        return (
            <PageLayout noMargin={true}>
                {
                    (this.currentQuery) && (<div>

                        <div style={{margin:"0 20px 10px 20px"}}>
                            <QuerySummary queryStore={getBrowserWindow().currentQueryStore} store={this.resultsViewPageStore}/>
                        </div>
                        {
                            (this.resultsViewPageStore.studies.isComplete) && (
                                <MSKTabs activeTabId={this.currentTab(this.props.routing.location.pathname)} unmountOnHide={true}
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
