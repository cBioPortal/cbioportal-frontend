import * as React from "react";
import {ResultsViewTab} from "./ResultsViewPageHelpers";
import {ITabConfiguration} from "../../shared/model/ITabConfiguration";
import {AppStore} from "../../AppStore";
import {ResultsViewPageStore} from "./ResultsViewPageStore";
import ExtendedRouterStore from "../../shared/lib/ExtendedRouterStore";
import {MSKTab} from "../../shared/components/MSKTabs/MSKTabs";
import ResultsViewOncoprint from "../../shared/components/oncoprint/ResultsViewOncoprint";
import CancerSummaryContainer from "./cancerSummary/CancerSummaryContainer";
import MutualExclusivityTab from "./mutualExclusivity/MutualExclusivityTab";
import Mutations from "./mutation/Mutations";
import PlotsTab from "./plots/PlotsTab";
import CoExpressionTab from "./coExpression/CoExpressionTab";
import EnrichmentsTab from "./enrichments/EnrichmentsTab";
import SurvivalTab from "./survival/SurvivalTab";
import {doesQueryHaveCNSegmentData} from "./ResultsViewPageStoreUtils";
import CNSegments from "./cnSegments/CNSegments";
import Network from "./network/Network";
import ExpressionWrapper from "./expression/ExpressionWrapper";
import DownloadTab from "./download/DownloadTab";

export function getResultsViewTabList(store:ResultsViewPageStore, appStore:AppStore, routingStore: ExtendedRouterStore){

    const tabList:ITabConfiguration[] = [

        {
            id:ResultsViewTab.ONCOPRINT,
            getTab: () => {
                return <MSKTab key={0} id={ResultsViewTab.ONCOPRINT} linkText="OncoPrint">
                    <ResultsViewOncoprint
                        divId={'oncoprintDiv'}
                    store={store}
                    key={store.hugoGeneSymbols.join(",")}
                    routing={routingStore}
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
                return store.hugoGeneSymbols.length < 2;
            }
        },

        {
            id:ResultsViewTab.PLOTS,
            hide:()=>{
                if (!store.studies.isComplete) {
                    return true;
                } else {
                    return store.studies.result!.length > 1;
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
                <Mutations store={store} appStore={ appStore } />
                </MSKTab>
            }
        },

        {
            id:ResultsViewTab.COEXPRESSION,
            hide:()=>{
                if (!store.isThereDataForCoExpressionTab.isComplete ||
                    !store.studies.isComplete) {
                    return true;
                } else {
                    const tooManyStudies = store.studies.result!.length > 1;
                    const noData = !store.isThereDataForCoExpressionTab.result;
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
                if (!store.studies.isComplete) {
                    return true;
                } else {
                    return store.studies.result!.length > 1;
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
                return !store.survivalClinicalDataExists.isComplete ||
                    !store.survivalClinicalDataExists.result!;
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
                if (!store.samples.isComplete ||
                    !store.studies.isComplete) {
                    return true;
                } else {
                    const tooManyStudies = store.studies.result!.length > 1;
                    const noData = !doesQueryHaveCNSegmentData(store.samples.result);
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
                if (!store.studies.isComplete) {
                    return true;
                } else {
                    return store.studies.result!.length > 1;
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
                if (!store.studies.isComplete) {
                    return true;
                } else {
                    return store.studies.result!.length === 1;
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

    return tabList;


}