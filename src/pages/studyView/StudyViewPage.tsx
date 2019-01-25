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
    private enableAddChartInTabs = [StudyViewPageTabKeyEnum.SUMMARY, StudyViewPageTabKeyEnum.CLINICAL_DATA];
    private queryReaction:IReactionDisposer;
    @observable showCustomSelectTooltip = false;
    private inCustomSelectTooltip = false;
    private studyViewQueryFilter:StudyViewURLQuery;

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
                const newStudyViewFilter:StudyViewURLQuery = _.pick(props.routing.location.query, ['id', 'studyId', 'cancer_study_id', 'filters', 'filterAttributeId', 'filterValues']);

                if (!_.isEqual(newStudyViewFilter, this.studyViewQueryFilter)) {
                    this.store.updateStoreFromURL(newStudyViewFilter);
                    this.studyViewQueryFilter = newStudyViewFilter;
                }
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
            <div className="studyView" onClick={this.showCustomSelectTooltip ? ()=>{
                if(!this.inCustomSelectTooltip) {
                    this.showCustomSelectTooltip = false;
                }
            } : undefined}>
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
                                    {(this.enableAddChartInTabs.includes(this.store.currentTab))
                                    && (
                                        <div style={{display: 'flex'}}>

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
                                                <button className='btn btn-primary btn-sm'
                                                        data-test='custom-selection-button'
                                                        onClick={() => {
                                                            this.showCustomSelectTooltip = true;
                                                        }}
                                                        style={{marginLeft: '10px'}}>Custom Selection
                                                </button>
                                            </DefaultTooltip>
                                            <AddChartButton
                                                buttonText={this.addChartButtonText}
                                                store={this.store}
                                                currentTab={this.store.currentTab}
                                                addChartOverlayClassName='studyViewAddChartOverlay'
                                                disableCustomTab={this.store.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA}
                                            />
                                        </div>
                                    )}
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