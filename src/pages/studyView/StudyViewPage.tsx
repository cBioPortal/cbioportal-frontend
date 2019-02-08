import * as React from 'react';
import * as _ from 'lodash';
import {inject, Observer, observer} from "mobx-react";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {computed, IReactionDisposer, reaction, observable} from 'mobx';
import {
    NewChart,
    StudyViewPageStore,
    StudyViewPageTabDescriptions,
    StudyViewPageTabKey,
    StudyViewPageTabKeyEnum
} from 'pages/studyView/StudyViewPageStore';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {ClinicalDataTab} from "./tabs/ClinicalDataTab";
import getBrowserWindow from "../../shared/lib/getBrowserWindow";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import IFrameLoader from "../../shared/components/iframeLoader/IFrameLoader";
import {StudySummaryTab} from 'pages/studyView/tabs/SummaryTab';
import StudyPageHeader from "./studyPageHeader/StudyPageHeader";
import CNSegments from "./tabs/CNSegments";
import "./styles.scss";
import styles from './styles.module.scss';
import SelectedInfo from "./SelectedInfo/SelectedInfo";
import LabeledCheckbox from "../../shared/components/labeledCheckbox/LabeledCheckbox";
import {Alert} from 'react-bootstrap';
import AddChartButton from "./addChartButton/AddChartButton";
import {CSSTransition} from "react-transition-group";
import {sleep} from "../../shared/lib/TimeUtils";
import {remoteData} from "../../shared/api/remoteData";
import {Else, If, Then} from 'react-if';
import DefaultTooltip from "../../shared/components/defaultTooltip/DefaultTooltip";
import CustomCaseSelection from "./addChartButton/customCaseSelection/CustomCaseSelection";
import {AppStore} from "../../AppStore";
import {ComparisonSampleGroup, TEMP_localStorageGroupsKey} from "../groupComparison/GroupComparisonUtils";
import {addGroupToLocalStorage, getLocalStorageGroups} from "../groupComparison/GroupPersistenceUtils";
import {SampleIdentifier} from "../../shared/api/generated/CBioPortalAPI";
import ComparisonGroupManager from "../groupComparison/ComparisonGroupManager";
import classNames from "classnames";

export interface IStudyViewPageProps {
    routing: any;
    appStore: AppStore;
}

export class StudyResultsSummary extends React.Component<{ store:StudyViewPageStore },{}> {

    render(){
        return (
            <div className={"studyFilterResult"}>
                <SelectedInfo selectedSamplesCount={this.props.store.selectedSamples.result.length} selectedPatientsCount={this.props.store.selectedPatients.length}/>

                {this.props.store.mutationProfiles.result.length > 0 && (
                    <div data-test="with-mutation-data">
                        <LoadingIndicator
                            isLoading={this.props.store.molecularProfileSampleCounts.isPending}/>
                        {this.props.store.molecularProfileSampleCounts.isComplete && (
                            <LabeledCheckbox
                                inputProps={{className: styles.selectedInfoCheckbox}}
                                checked={!!this.props.store.filters.withMutationData}
                                onChange={this.props.store.toggleWithMutationDataFilter}
                                disabled={this.props.store.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples === undefined}
                            >
                                {this.props.store.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples === undefined ? '0' : this.props.store.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples.toLocaleString()} w/ mutation data
                            </LabeledCheckbox>
                        )}
                    </div>
                )}
                {this.props.store.cnaProfiles.result.length > 0 && (
                    <div data-test="with-cna-data">
                        <LoadingIndicator
                            isLoading={this.props.store.molecularProfileSampleCounts.isPending}/>
                        {this.props.store.molecularProfileSampleCounts.isComplete && (
                            <LabeledCheckbox
                                inputProps={{className: styles.selectedInfoCheckbox}}
                                checked={!!this.props.store.filters.withCNAData}
                                onChange={this.props.store.toggleWithCNADataFilter}
                                disabled={this.props.store.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples === undefined}
                            >
                                {this.props.store.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples === undefined ? '0' : this.props.store.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples.toLocaleString()} w/ CNA data
                            </LabeledCheckbox>
                        )}
                    </div>
                )}

            </div>
        )
    }

}



@inject('routing', 'appStore')
@observer
export default class StudyViewPage extends React.Component<IStudyViewPageProps, {}> {
    private store: StudyViewPageStore;
    private enableAddChartInTabs = [StudyViewPageTabKeyEnum.SUMMARY, StudyViewPageTabKeyEnum.CLINICAL_DATA];
    private queryReaction:IReactionDisposer;
    @observable showCustomSelectTooltip = false;
    @observable showGroupsTooltip = false;
    private inCustomSelectTooltip = false;

    constructor(props: IStudyViewPageProps) {
        super();
        this.store = new StudyViewPageStore();

        this.queryReaction = reaction(
            () => props.routing.location.query,
            query => {

                if (!getBrowserWindow().globalStores.routing.location.pathname.includes("/study")) {
                    return;
                }

                this.store.updateCurrentTab(props.routing.location.query.tab);
                this.store.updateStoreFromURL(query);
            },
            {fireImmediately: true}
        );
    }

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({tab: id});
    }

    private chartDataPromises = remoteData({
        await:()=>{
           return [
               ..._.values(this.store.clinicalDataBinPromises),
               ..._.values(this.store.clinicalDataCountPromises),
               ..._.values(this.store.customChartsPromises),
               this.store.mutationProfiles,
               this.store.cnaProfiles,
               this.store.selectedSamples,
               this.store.molecularProfileSampleCounts,

            ]
        },
        invoke: async ()=>{
            // this gives time for charts to render
            // product requirement that the summary data show after charts have rendered
            // to call attention to the summary results
            return await sleep(10);
        }
    });

    @computed
    get addChartButtonText() {
        if (this.store.currentTab === StudyViewPageTabKeyEnum.SUMMARY) {
            return '+ Add Chart';
        } else if (this.store.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA) {
            return '+ Add Column'
        } else {
            return '';
        }
    }

    content() {

        return (
            <div className="studyView" onClick={()=>{
                if(this.showCustomSelectTooltip && !this.inCustomSelectTooltip) {
                    this.showCustomSelectTooltip = false;
                }
            }}>
                {this.store.unknownQueriedIds.isComplete &&
                this.store.unknownQueriedIds.result.length > 0 && (
                    <Alert bsStyle="danger">
                        <span>Unknown/Unauthorized studies {this.store.unknownQueriedIds.result.join(', ')}</span>
                    </Alert>
                )}
                <LoadingIndicator size={"big"}
                                  isLoading={(this.store.queriedSampleIdentifiers.isPending || this.store.invalidSampleIds.isPending)}
                                  center={true}/>
                {
                    this.store.queriedSampleIdentifiers.isComplete &&
                    this.store.invalidSampleIds.isComplete &&
                    this.store.unknownQueriedIds.isComplete &&
                    this.store.displayedStudies.isComplete && (
                        <div>
                            <StudyPageHeader
                                userEmail={this.props.appStore.userName}
                                store={this.store}
                            />

                            <div className={styles.mainTabs}>
                                <MSKTabs id="studyViewTabs" activeTabId={this.props.routing.location.query.tab}
                                         onTabClick={(id: string) => this.handleTabChange(id)}
                                         className="mainTabs"
                                         unmountOnHide={false}>

                                    <MSKTab key={0} id={StudyViewPageTabKeyEnum.SUMMARY} linkText={StudyViewPageTabDescriptions.SUMMARY}>
                                        <StudySummaryTab store={this.store}></StudySummaryTab>
                                    </MSKTab>
                                    <MSKTab key={1} id={StudyViewPageTabKeyEnum.CLINICAL_DATA} linkText={StudyViewPageTabDescriptions.CLINICAL_DATA}>
                                        <ClinicalDataTab store={this.store}/>
                                    </MSKTab>
                                    <MSKTab key={2} id={StudyViewPageTabKeyEnum.HEATMAPS} linkText={StudyViewPageTabDescriptions.HEATMAPS}
                                            hide={this.store.MDACCHeatmapStudyMeta.result.length === 0}>
                                        <IFrameLoader height={700}
                                                      url={`//bioinformatics.mdanderson.org/TCGA/NGCHMPortal/?${this.store.MDACCHeatmapStudyMeta.result[0]}`}/>
                                    </MSKTab>
                                    <MSKTab key={3} id={StudyViewPageTabKeyEnum.CN_SEGMENTS} linkText={StudyViewPageTabDescriptions.CN_SEGMENTS}>
                                       <CNSegments store={this.store} />
                                    </MSKTab>
                                </MSKTabs>


                                <div className={styles.absolutePanel}>
                                    <Observer>
                                        {
                                            () => {
                                                return (
                                                    <div className={styles.selectedInfo}>
                                                        <If condition={this.chartDataPromises.isComplete}>
                                                            <Then>
                                                                <CSSTransition classNames="studyFilterResult" in={true}
                                                                               appear timeout={{enter: 200}}>
                                                                    {() => <StudyResultsSummary store={this.store}/>
                                                                    }
                                                                </CSSTransition>
                                                            </Then>
                                                            <Else>
                                                                <LoadingIndicator isLoading={true} size={"small"} className={styles.selectedInfoLoadingIndicator}/>
                                                            </Else>
                                                        </If>
                                                    </div>)
                                            }
                                        }
                                    </Observer>
                                    <div id="comparisonGroupManagerContainer" style={{display: 'flex', position:"relative"}}>
                                        {(this.enableAddChartInTabs.includes(this.store.currentTab))
                                        && ([
                                        <DefaultTooltip
                                            visible={this.showCustomSelectTooltip}
                                            placement={"bottomLeft"}
                                            onVisibleChange={()=>{

                                            }}
                                            destroyTooltipOnHide={true}
                                            overlay={() => (
                                                <div style={{width: '300px'}}
                                                     onMouseEnter={()=>this.inCustomSelectTooltip=true}
                                                     onMouseLeave={()=>this.inCustomSelectTooltip=false}
                                                >
                                                    <CustomCaseSelection
                                                        allSamples={this.store.samples.result}
                                                        selectedSamples={this.store.selectedSamples.result}
                                                        submitButtonText={"Select"}
                                                        disableGrouping={true}
                                                        queriedStudies={this.store.queriedPhysicalStudyIds.result}
                                                        onSubmit={(chart: NewChart) => {
                                                            this.showCustomSelectTooltip = false;
                                                            this.store.updateCustomSelect(chart);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        >
                                            <button className='btn btn-primary btn-xs'
                                                    data-test='custom-selection-button'
                                                    onClick={(e)=>{
                                                        e.stopPropagation();
                                                        this.showCustomSelectTooltip = true;
                                                    }}
                                                    style={{marginLeft: '10px'}}>Custom Selection
                                            </button>
                                        </DefaultTooltip>,
                                        <AddChartButton
                                            buttonText={this.addChartButtonText}
                                            store={this.store}
                                            currentTab={this.store.currentTab}
                                            addChartOverlayClassName='studyViewAddChartOverlay'
                                            disableCustomTab={this.store.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA}
                                        />
                                        ])}
                                        <DefaultTooltip
                                            visible={this.showGroupsTooltip}
                                            placement="bottomLeft"
                                            destroyTooltipOnHide={true}
                                            onPopupAlign={(tooltipEl: any)=>{
                                                const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
                                                arrowEl.style.right = '10px';
                                            }}
                                            getTooltipContainer={()=>document.getElementById("comparisonGroupManagerContainer")!}
                                            overlay={()=>(
                                                <div style={{width: 300}}
                                                >
                                                    <ComparisonGroupManager
                                                        store={this.store}
                                                    />
                                                </div>
                                            )}
                                        >
                                            <button className={classNames('btn btn-primary btn-xs', {active:this.showGroupsTooltip})}
                                                    data-test="groups-button"
                                                    onClick={(e)=>{
                                                        e.stopPropagation();
                                                        this.showGroupsTooltip = !this.showGroupsTooltip;
                                                    }}
                                                    aria-pressed={this.showGroupsTooltip}
                                                    style={{marginLeft: '10px'}}
                                            >Groups {String.fromCharCode(9662)/*small solid down triangle*/}</button>
                                        </DefaultTooltip>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </div>)

    }

    componentWillUnmount(): void {
        this.queryReaction();
    }

    render() {
        return <PageLayout noMargin={true} hideFooter={true} className={"subhead-dark"}>
            {
                this.content()
            }
        </PageLayout>
    }
}