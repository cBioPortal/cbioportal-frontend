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

export interface IStudyViewPageProps {
    routing: any;
}

export class StudyResultsSummary extends React.Component<{ store:StudyViewPageStore },{}> {

    render(){
        return (
            <div className={"studyFilterResult"}>
                <SelectedInfo selectedSamplesCount={this.props.store.selectedSamples.result.length} selectedPatientsCount={this.props.store.selectedPatients.length}/>

                {this.props.store.mutationProfiles.result.length > 0 && (
                    <div data-test="with-mutation-data">
                        <LabeledCheckbox
                            inputProps={{className: styles.selectedInfoCheckbox}}
                            checked={!!this.props.store.filters.withMutationData}
                            onChange={this.props.store.toggleWithMutationDataFilter}
                        >
                            <LoadingIndicator
                                isLoading={this.props.store.molecularProfileSampleCounts.isPending}/>
                            {this.props.store.molecularProfileSampleCounts.isComplete && (
                                `${this.props.store.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples.toLocaleString()} w/ mutation data`)}
                        </LabeledCheckbox>
                    </div>
                )}
                {this.props.store.cnaProfiles.result.length > 0 && (
                    <div data-test="with-cna-data">
                        <LabeledCheckbox
                            inputProps={{className: styles.selectedInfoCheckbox}}
                            checked={!!this.props.store.filters.withCNAData}
                            onChange={this.props.store.toggleWithCNADataFilter}
                        >
                            <LoadingIndicator
                                isLoading={this.props.store.molecularProfileSampleCounts.isPending}/>
                            {this.props.store.molecularProfileSampleCounts.isComplete && (
                                `${this.props.store.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples.toLocaleString()} w/ CNA data`)}
                        </LabeledCheckbox>
                    </div>
                )}

            </div>
        )
    }

}



@inject('routing')
@observer
export default class StudyViewPage extends React.Component<IStudyViewPageProps, {}> {
    private store: StudyViewPageStore;
    private enableAddChartInTabs = [StudyViewPageTabKeyEnum.SUMMARY, StudyViewPageTabKeyEnum.CLINICAL_DATA];
    private queryReaction:IReactionDisposer;
    @observable showCustomSelectTooltip = false;
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
            <div className="studyView" onClick={this.showCustomSelectTooltip ? ()=>{
                if(!this.inCustomSelectTooltip) {
                    this.showCustomSelectTooltip = false;
                }
            }: undefined}>
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
                                                <button className='btn btn-primary btn-xs'
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