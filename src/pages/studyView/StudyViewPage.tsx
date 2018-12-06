import * as React from 'react';
import {inject, observer} from "mobx-react";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {reaction} from 'mobx';
import {StudyViewPageStore} from 'pages/studyView/StudyViewPageStore';
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

export interface IStudyViewPageProps {
    routing: any;
}

@inject('routing')
@observer
export default class StudyViewPage extends React.Component<IStudyViewPageProps, {}> {
    private store: StudyViewPageStore;

    constructor(props: IStudyViewPageProps) {
        super();
        this.store = new StudyViewPageStore();

        reaction(
            () => props.routing.location.query,
            query => {

                if (!getBrowserWindow().globalStores.routing.location.pathname.includes("/study")) {
                    return;
                }

                this.store.updateStoreFromURL(query);
            },
            {fireImmediately: true}
        );
    }

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({tab: id});
    }

    content() {
        return (
            <div className="studyView">
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

                                    <MSKTab key={0} id="summary" linkText="Summary">
                                        <StudySummaryTab store={this.store}></StudySummaryTab>
                                    </MSKTab>
                                    <MSKTab key={1} id={"clinicalData"} linkText={"Clinical Data"}>
                                        <ClinicalDataTab store={this.store}/>
                                    </MSKTab>
                                    <MSKTab key={2} id={"heatmaps"} linkText={"Heatmaps"}
                                            hide={this.store.MDACCHeatmapStudyMeta.result.length === 0}>
                                        <IFrameLoader height={700}
                                                      url={`//bioinformatics.mdanderson.org/TCGA/NGCHMPortal/?${this.store.MDACCHeatmapStudyMeta.result[0]}`}/>
                                    </MSKTab>
                                </MSKTabs>

                                {(this.props.routing.location.query.tab === undefined || this.props.routing.location.query.tab === 'summary') &&
                                <AddChartButton store={this.store}/>}

                                <div className={styles.selectedInfo}>
                                    <SelectedInfo selectedSamples={this.store.selectedSamples.result}/>
                                    <div className={"btn-group"} role={"group"}>
                                        {this.store.mutationProfiles.result.length > 0 && (
                                            <button className="btn btn-default btn-sm">
                                                <LabeledCheckbox
                                                    inputProps={{className: styles.selectedInfoCheckbox}}
                                                    checked={!!this.store.filters.withMutationData}
                                                    onChange={this.store.toggleWithMutationDataFilter}
                                                >
                                                    <LoadingIndicator
                                                        isLoading={this.store.molecularProfileSampleCounts.isPending}/>
                                                    {this.store.molecularProfileSampleCounts.isComplete && (
                                                        `${this.store.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples.toLocaleString()} with mutation data`)}
                                                </LabeledCheckbox>
                                            </button>
                                        )}
                                        {this.store.cnaProfiles.result.length > 0 && (
                                            <button className="btn btn-default btn-sm">
                                                <LabeledCheckbox
                                                    inputProps={{className: styles.selectedInfoCheckbox}}
                                                    checked={!!this.store.filters.withCNAData}
                                                    onChange={this.store.toggleWithCNADataFilter}
                                                >
                                                    <LoadingIndicator
                                                        isLoading={this.store.molecularProfileSampleCounts.isPending}/>
                                                    {this.store.molecularProfileSampleCounts.isComplete && (
                                                        `${this.store.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples.toLocaleString()} with CNA data`)}
                                                </LabeledCheckbox>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </div>)

    }

    render() {
        return <PageLayout noMargin={true}>
            {
                this.content()
            }
        </PageLayout>
    }
}