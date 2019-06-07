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
    StudyViewPageTabKeyEnum, StudyViewURLQuery
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
import ActionButtons from "./studyPageHeader/ActionButtons";
import onMobxPromise from "../../shared/lib/onMobxPromise";
import {GACustomFieldsEnum, isWebdriver, serializeEvent, trackEvent} from "../../shared/lib/tracking";
import ComparisonGroupManager from "../groupComparison/comparisonGroupManager/ComparisonGroupManager";
import classNames from "classnames";
import AppConfig from "appConfig";
import SocialAuthButton from "../../shared/components/SocialAuthButton";
import {ServerConfigHelpers} from "../../config/config";
import { getStudyViewTabId } from './StudyViewUtils';
import InfoBeacon from "shared/components/infoBeacon/InfoBeacon";
import {WrappedTour} from "shared/components/wrappedTour/WrappedTour";

export interface IStudyViewPageProps {
    routing: any;
    appStore: AppStore;
}

export class StudyResultsSummary extends React.Component<{ store:StudyViewPageStore, appStore:AppStore },{}> {

    render(){
        return (
            <div className={styles.studyFilterResult}>
                 <div className={styles.selectedInfo} data-test="selected-info">
                     <strong>Selected:&nbsp;</strong>
                     <strong data-test="selected-patients">{this.props.store.selectedPatients.length.toLocaleString()}</strong>&nbsp;<strong>patients</strong>&nbsp;|&nbsp;
                     <strong data-test="selected-samples">{this.props.store.selectedSamples.result.length.toLocaleString()}</strong>&nbsp;<strong>samples</strong>
                </div>
                <ActionButtons store={this.props.store} appStore={this.props.appStore}/>
            </div>
        )
    }

}

@inject('routing', 'appStore')
@observer
export default class StudyViewPage extends React.Component<IStudyViewPageProps, {}> {
    private store: StudyViewPageStore;
    private enableCustomSelectionInTabs = [StudyViewPageTabKeyEnum.SUMMARY, StudyViewPageTabKeyEnum.CLINICAL_DATA, StudyViewPageTabKeyEnum.CN_SEGMENTS];
    private enableAddChartInTabs = [StudyViewPageTabKeyEnum.SUMMARY, StudyViewPageTabKeyEnum.CLINICAL_DATA];
    private queryReaction:IReactionDisposer;
    @observable showCustomSelectTooltip = false;
    @observable showGroupsTooltip = false;
    private inCustomSelectTooltip = false;
    private studyViewQueryFilter:StudyViewURLQuery;

    constructor(props: IStudyViewPageProps) {
        super(props);
        this.store = new StudyViewPageStore();

        this.queryReaction = reaction(
            () => props.routing.location.query,
            query => {

                if (!getBrowserWindow().globalStores.routing.location.pathname.includes("/study")) {
                    return;
                }

                this.store.updateCurrentTab(getStudyViewTabId(getBrowserWindow().globalStores.routing.location.pathname));
                const newStudyViewFilter:StudyViewURLQuery = _.pick(props.routing.location.query, ['id', 'studyId', 'cancer_study_id', 'filters', 'filterAttributeId', 'filterValues']);

                if (!_.isEqual(newStudyViewFilter, this.studyViewQueryFilter)) {
                    this.store.updateStoreFromURL(newStudyViewFilter);
                    this.studyViewQueryFilter = newStudyViewFilter;
                }
            },
            {fireImmediately: true}
        );

        onMobxPromise(this.store.queriedPhysicalStudyIds, (strArr:string[])=>{
            trackEvent(
                {   category:"studyPage", action:"studyPageLoad",
                    label: strArr.join(",") + ",",
                    fieldsObject:{ [GACustomFieldsEnum.VirtualStudy]: (this.store.filteredVirtualStudies.result!.length > 0).toString()  }
                }
            );
        });

    }

    componentDidMount() {
        // make the route as the default tab value
        this.props.routing.updateRoute({},`study/${this.store.currentTab}`);
    }

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({},`study/${id}`);
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

    @computed
    get groupsButton() {
        return (
            <>
                <If condition={!isWebdriver()}>
                    <InfoBeacon
                        top={-15}
                        right={45}
                        interaction={'mouseover'}
                        color={'green'}
                        id={'groupComparison1'}
                    >
                        <WrappedTour/>
                    </InfoBeacon>
                </If>
                <DefaultTooltip
                    visible={this.showGroupsTooltip}
                    trigger={["click"]}
                    placement="bottomLeft"
                    destroyTooltipOnHide={true}
                    onPopupAlign={(tooltipEl: any)=>{
                        const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
                        arrowEl.style.right = '10px';
                    }}
                    onVisibleChange={visible=>{ this.showGroupsTooltip = !!visible; }}
                    getTooltipContainer={()=>document.getElementById("comparisonGroupManagerContainer")!}
                    overlay={
                        <div style={{width: 350}}>
                            {this.props.appStore.isLoggedIn ?
                                <ComparisonGroupManager store={this.store} /> :
                                (<span>
                                    Please log in to use the custom groups feature to save and compare sub-cohorts.
                                    <If condition={AppConfig.serverConfig.authenticationMethod === "social_auth"}>
                                        <div className={"text-center"} style={{padding:20}}>
                                            <SocialAuthButton appStore={this.props.appStore}/>
                                        </div>
                                    </If>
                                </span>)
                            }
                        </div>
                    }
                >
                    <button className={classNames('btn btn-primary btn-xs', {active:this.showGroupsTooltip})}
                            id={"groupManagementButton"}
                            data-test="groups-button"
                            aria-pressed={this.showGroupsTooltip}
                            style={{marginLeft: '10px'}}
                            data-event={serializeEvent({action:'openGroupManagement',label:'', category:'groupComparison' })}
                    >Groups {String.fromCharCode(9662)/*small solid down triangle*/}</button>
                </DefaultTooltip>
            </>
        );
    }

    content() {

        return (
            <div className="studyView" onClick={()=>{
                if(this.showCustomSelectTooltip && !this.inCustomSelectTooltip) {
                    this.showCustomSelectTooltip = false;
                }
            }}>
                {this.store.comparisonConfirmationModal}
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
                                store={this.store}
                            />

                            <div className={styles.mainTabs}>
                                <MSKTabs id="studyViewTabs" activeTabId={this.store.currentTab}
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
                                        <IFrameLoader className="mdacc-heatmap-iframe"
                                                      url={`https://bioinformatics.mdanderson.org/TCGA/NGCHMPortal/?${this.store.MDACCHeatmapStudyMeta.result[0]}`}/>
                                    </MSKTab>
                                    <MSKTab
                                        key={3}
                                        id={StudyViewPageTabKeyEnum.CN_SEGMENTS}
                                        linkText={StudyViewPageTabDescriptions.CN_SEGMENTS}
                                        hide={
                                            !this.store.initialMolecularProfileSampleCounts.result ||
                                            !(this.store.initialMolecularProfileSampleCounts.result.numberOfCNSegmentSamples > 0)
                                        }
                                    >
                                       <CNSegments store={this.store} />
                                    </MSKTab>
                                </MSKTabs>


                                <div className={styles.absolutePanel}>
                                    <Observer>
                                        {
                                            () => {
                                                return (
                                                        <If condition={this.chartDataPromises.isComplete}>
                                                            <Then>
                                                                <CSSTransition classNames="studyFilterResult" in={true}
                                                                               appear timeout={{enter: 200}}>
                                                                    {() => <StudyResultsSummary store={this.store} appStore={this.props.appStore}/>
                                                                    }
                                                                </CSSTransition>
                                                            </Then>
                                                            <Else>
                                                                <LoadingIndicator isLoading={true} size={"small"} className={styles.selectedInfoLoadingIndicator}/>
                                                            </Else>
                                                        </If>
                                                )
                                            }
                                        }
                                    </Observer>
                                    <div id="comparisonGroupManagerContainer" style={{display: 'flex', position:"relative"}}>
                                        {(this.enableCustomSelectionInTabs.includes(this.store.currentTab))
                                        && (<>
                                                <DefaultTooltip
                                                    visible={this.showCustomSelectTooltip}
                                                    placement={"bottomLeft"}
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
                                                    <button className={classNames('btn btn-primary btn-sm', {"active":this.showCustomSelectTooltip})}
                                                            data-test='custom-selection-button'
                                                            onClick={(evt:any) => {
                                                                evt.stopPropagation();
                                                                this.showCustomSelectTooltip = !this.showCustomSelectTooltip;
                                                            }}
                                                            style={{marginLeft: '10px'}}>Custom Selection
                                                    </button>
                                                </DefaultTooltip>
                                            </>
                                        )}
                                        {(this.enableAddChartInTabs.includes(this.store.currentTab))
                                        && (
                                                <AddChartButton
                                                    buttonText={this.addChartButtonText}
                                                    store={this.store}
                                                    currentTab={this.store.currentTab}
                                                    addChartOverlayClassName='studyViewAddChartOverlay'
                                                    disableCustomTab={this.store.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA}
                                                />
                                        )}
                                        {ServerConfigHelpers.sessionServiceIsEnabled() && this.groupsButton}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </div>)

    }

    componentWillUnmount(): void {
        this.queryReaction();
        this.store.destroy();
    }

    render() {
        return <PageLayout noMargin={true} hideFooter={true} className={"subhead-dark"}>
            {
                this.content()
            }
        </PageLayout>
    }
}



