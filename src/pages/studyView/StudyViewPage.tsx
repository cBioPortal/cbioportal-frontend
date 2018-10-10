import * as React from 'react';
import {inject, observer} from "mobx-react";
import styles from "./styles.module.scss";
import { MSKTab, MSKTabs } from "../../shared/components/MSKTabs/MSKTabs";
import { reaction, observable, computed } from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import {CancerStudy} from 'shared/api/generated/CBioPortalAPI';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {ClinicalDataTab} from "./tabs/ClinicalDataTab";
import setWindowVariable from "../../shared/lib/setWindowVariable";
import * as _ from 'lodash';
import ErrorBox from 'shared/components/errorBox/ErrorBox';
import getBrowserWindow from "../../shared/lib/getBrowserWindow";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {stringListToSet} from "../../shared/lib/StringUtils";
import classnames from 'classnames';
import {buildCBioPortalPageUrl} from 'shared/api/urls';
import MobxPromise from 'mobxpromise';
import { StudySummaryRecord } from 'pages/studyView/virtualStudy/VirtualStudy';
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import IFrameLoader from "../../shared/components/iframeLoader/IFrameLoader";
import { StudySummaryTab } from 'pages/studyView/tabs/SummaryTab';
import {StudyViewFilter} from "../../shared/api/generated/CBioPortalAPIInternal";

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

        //setWindowVariable("studyViewPageStore", this.store);
        
        reaction(
            () => props.routing.location.query,
            query => {

                if (!getBrowserWindow().globalStores.routing.location.pathname.includes("/newstudy")) {
                    return;
                }

                this.store.updateStoreFromURL(query);
            },
            { fireImmediately: true }
        );

    }

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({ tab: id });
    }

    content(){

        if (
            this.store.queriedSampleIdentifiers.isComplete &&
            this.store.invalidSampleIds.isComplete &&
            this.store.unknownQueriedIds.isComplete &&
            this.store.displayedStudies.isComplete &&
            _.isEmpty(this.store.unknownQueriedIds.result)
        ) {
            return (
                <div className="studyView">
                    <LoadingIndicator size={"big"}
                                      isLoading={(this.store.queriedSampleIdentifiers.isPending ||this.store.invalidSampleIds.isPending)}
                                      center={true}/>
                    <StudySummary
                        studies={this.store.displayedStudies.result}
                        originStudies={this.store.originStudies}
                        showOriginStudiesInSummaryDescription={this.store.showOriginStudiesInSummaryDescription}
                    />

                    <MSKTabs id="studyViewTabs" activeTabId={this.props.routing.location.query.tab}
                        onTabClick={(id: string) => this.handleTabChange(id)}
                        className="mainTabs">

                        <MSKTab key={0} id="summary" linkText="Summary">
                            <StudySummaryTab store={this.store} ></StudySummaryTab>
                        </MSKTab>
                        <MSKTab key={1} id={"clinicalData"} linkText={"Clinical Data"}>
                            <ClinicalDataTab store={this.store} />
                        </MSKTab>
                        <MSKTab key={2} id={"heatmaps"} linkText={"Heatmaps"}
                                hide={this.store.MDACCHeatmapStudyMeta.result.length === 0}>
                            <IFrameLoader height={700}
                                          url={`//bioinformatics.mdanderson.org/TCGA/NGCHMPortal/?${this.store.MDACCHeatmapStudyMeta.result[0]}`}/>
                        </MSKTab>
                    </MSKTabs>
                </div>
            )
        } else {
            <LoadingIndicator isLoading={this.store.filteredVirtualStudies.isPending} size={"big"} center={true}/>
            if (this.store.filteredVirtualStudies.isComplete &&
                this.store.unknownQueriedIds.isComplete &&
                !_.isEmpty(this.store.unknownQueriedIds.result)) {
                return (
                    <div style={{ margin: "0px auto", maxWidth: "50%", fontSize: "16px" }}>
                        <ErrorBox error={Error(`Unknown/Unauthorized studies ${this.store.unknownQueriedIds.result.join(', ')}`)} />
                    </div>
                )
            } else {
                return <LoadingIndicator isLoading={true} size={"big"} center={true}/>
            }
        }

    }

    render() {
        return <PageLayout noMargin={true}>
            {
                this.content()
            }
        </PageLayout>
    }
}

interface IStudySummaryProps {
    studies: CancerStudy[],
    originStudies: MobxPromise<CancerStudy[]>,
    showOriginStudiesInSummaryDescription: boolean
}

@observer
class StudySummary extends React.Component<IStudySummaryProps, {}> {

    @observable private showMoreDescription = false;

    @computed get name() {
        return this.props.studies.length === 1 ? this.props.studies[0].name : 'Combined Study';
    }

    @computed get descriptionFirstLine() {
        let line: string = `This combined study contains samples from ${this.props.studies.length} ${this.props.studies.length>1?'studies':'study'}`;
        if (this.props.studies.length === 1) {
            line = this.props.studies[0].description.split(/\n+/g)[0];
        }
        return <span dangerouslySetInnerHTML={{ __html: line }} />;
    }

    @computed get hasMoreDescription() {
        return this.props.showOriginStudiesInSummaryDescription ||
            this.props.studies.length > 1 ||
            this.props.studies[0].description.split(/\n/g).length > 1;
    }

    @computed get descriptionRemainingLines() {
        if (this.props.studies.length === 1) {
            const lines = this.props.studies[0].description.split(/\n/g);
            if (lines.length > 1) {
                //slice fist line as its already shown
                return [<span style={{ whiteSpace: 'pre' }} dangerouslySetInnerHTML={{ __html: lines.slice(1).join('\n') }} />]
            }
        } else {
            return _.map(this.props.studies, study => {
                return (
                    <span>
                        <a
                            href={buildCBioPortalPageUrl({ pathname: 'newstudy', query: { id: study.studyId } })}
                            target="_blank">
                            {study.name}
                        </a>
                    </span>
                )
            })
        }
        return [];
    }

    render() {
        return (
            <div className={classnames("topBanner", styles.summary)}>
                <h3>{this.name}</h3>
                <div className={styles.description}>
                    <div>
                        {this.descriptionFirstLine}
                        {this.hasMoreDescription && <i
                            className={`fa fa-${this.showMoreDescription ? 'minus' : 'plus'}-circle`}
                            onClick={() => this.showMoreDescription = !this.showMoreDescription}
                            style={{ marginLeft: '5px', cursor: 'pointer' }}
                        />}
                    </div>

                    {this.showMoreDescription &&
                        <div>
                            <p style={{ display: 'inline-grid', width: '100%' }}>{this.descriptionRemainingLines}</p>
                            {
                                this.props.showOriginStudiesInSummaryDescription &&
                                (<div>
                                    {
                                        this.props.originStudies.isComplete &&
                                        this.props.originStudies.result!.length > 0 &&
                                        (<div>
                                            <span style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                                                This virtual study was derived from:
                                            </span>
                                            {this.props.originStudies.result!.map(study => <StudySummaryRecord {...study} />)}
                                        </div>)
                                    }
                                    <LoadingIndicator
                                        isLoading={this.props.originStudies.isPending}
                                        center={true}
                                        size={"big"}
                                    />
                                </div>)
                            }
                        </div>
                    }
                </div>
            </div>
        )
    }
}