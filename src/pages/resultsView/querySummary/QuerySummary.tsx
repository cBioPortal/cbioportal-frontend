import * as React from 'react';
import * as _ from 'lodash';
import {inject, observer} from "mobx-react";
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import {If, Then, Else} from 'react-if';
import {CancerStudy} from "../../../shared/api/generated/CBioPortalAPI";
import classNames from 'classnames';
import './styles.scss';
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";
import Loader, {default as LoadingIndicator} from "../../../shared/components/loadingIndicator/LoadingIndicator";
import {action, computed, observable} from "mobx";
import {QueryStore} from "../../../shared/components/query/QueryStore";
import QueryAndDownloadTabs from "../../../shared/components/query/QueryAndDownloadTabs";
import autobind from "autobind-decorator";
import ExtendedRouterStore from "../../../shared/lib/ExtendedRouterStore";
import {ShareUI} from "./ShareUI";
import {ServerConfigHelpers} from "../../../config/config";
import AppConfig from "appConfig";
import {StudyLink} from "../../../shared/components/StudyLink/StudyLink";
import {createQueryStore} from "../../home/HomePage";
import getBrowserWindow from "../../../shared/lib/getBrowserWindow";
import {remoteData} from "../../../shared/api/remoteData";
import {getAlterationSummary, getGeneSummary, getPatientSampleSummary} from "./QuerySummaryUtils";
import {MakeMobxView} from "../../../shared/components/MobxView";
import {getGAInstance} from "../../../shared/lib/tracking";

@observer
export default class QuerySummary extends React.Component<{ routingStore:ExtendedRouterStore, store: ResultsViewPageStore }, {}> {

    @observable.ref queryStore: QueryStore | undefined;

    constructor() {
        super();
    }

    @autobind
    private handleModifyQueryClick() {
        // this will have no functional impact after initial invocation of this method
        this.queryStore = (this.queryStore) ? undefined : createQueryStore(getBrowserWindow().routingStore.query);
    }

    @computed get queryFormVisible(){
        return !!this.queryStore;
    }

    readonly singleStudyUI = MakeMobxView({
        await:()=>[
            this.props.store.queriedStudies,
            this.props.store.sampleLists,
            this.props.store.samples,
            this.props.store.patients,
            this.props.store.genes
        ],
        render:()=>{
            const sampleListName = (this.props.store.sampleLists.result!.length > 0) ?
                (<span>{this.props.store.sampleLists.result![0].name}</span>) :
                (<span>User-defined Patient List</span>);

            const study = this.props.store.queriedStudies.result[0];

            return (
                <div>
                    <h3><StudyLink studyId={study.studyId}>{study.name}</StudyLink></h3>
                    {sampleListName}&nbsp;({getPatientSampleSummary(this.props.store.samples.result, this.props.store.patients.result)})
                    &nbsp;-&nbsp;
                    {getGeneSummary(this.props.store.hugoGeneSymbols)}
                </div>
            );
        }
    });

    @autobind
    @action
    closeQueryForm(){
        this.queryStore = undefined;
        $(document).scrollTop(0);
    }

    readonly multipleStudyUI = MakeMobxView({
        await:()=>[this.props.store.samples, this.props.store.patients, this.props.store.queriedStudies],
        render:()=>(
            <div>
                <h4>
                    <a
                        href={`study?id=${this.props.store.queriedStudies.result.map(study => study.studyId).join(',')}`}
                        target="_blank"
                    >
                        Combined Study ({this.props.store.samples.result.length} samples)
                    </a>
                </h4>
                <span>
                    Querying {getPatientSampleSummary(this.props.store.samples.result, this.props.store.patients.result)} in {this.props.store.queriedStudies.result.length} studies
                    &nbsp;-&nbsp;
                    {getGeneSummary(this.props.store.hugoGeneSymbols)}
                    &nbsp;
                    <DefaultTooltip
                        placement='bottom'
                        overlay={this.studyList}
                        destroyTooltipOnHide={true}
                    ><i className="fa fa-info-circle"/>
                    </DefaultTooltip>
                </span>
            </div>
        )
    });

    readonly cohortAndGeneSummary = MakeMobxView({
        await:()=>[this.singleStudyUI, this.multipleStudyUI, this.props.store.queriedStudies],
        render:()=>{
            if (this.props.store.queriedStudies.result.length === 1) {
                return this.singleStudyUI.component!;
            } else {
                return this.multipleStudyUI.component!;
            }
        }
    });

    readonly alterationSummary = MakeMobxView({
        await:()=>[this.props.store.samples, this.props.store.patients,
            this.props.store.alteredSampleKeys, this.props.store.alteredPatientKeys],
        render:()=>(getAlterationSummary(this.props.store.samples.result!.length, this.props.store.patients.result!.length,
            this.props.store.alteredSampleKeys.result!.length, this.props.store.alteredPatientKeys.result!.length, this.props.store.hugoGeneSymbols.length))
    });

    private get studyList(){

        return (<div className="cbioportal-frontend">
                <ul className="list-unstyled" style={{marginBottom:0}}>
                {
                    this.props.store.queriedStudies.result.map((study:CancerStudy)=>{
                        return <li><StudyLink studyId={study.studyId}>{study.name}</StudyLink></li>
                    })
                }
                </ul>
        </div>)
    }

    @autobind
    onSubmit(){
        this.closeQueryForm();
        getGAInstance()('send', 'event', 'resultsView', 'query modified');
    }

    render() {

        if (!this.cohortAndGeneSummary.isError && !this.alterationSummary.isError) {

            const loadingComplete = this.cohortAndGeneSummary.isComplete && this.alterationSummary.isComplete;

            return (
                <div>
                    <div className="query-summary">
                        <div className="query-summary__leftItems">
                            <div>
                                <button id="modifyQueryBtn" onClick={this.handleModifyQueryClick} className={classNames('btn btn-primary' , { disabled:!loadingComplete  })}>
                                    {(this.queryFormVisible) ? 'Cancel Modify Query' : 'Modify Query'}
                                </button>
                            </div>

                            <LoadingIndicator isLoading={!loadingComplete} small={true}/>
                            {
                                (loadingComplete) && this.cohortAndGeneSummary.component!
                            }
                        </div>

                        <div className="query-summary__rightItems">
                            <div className="query-summary__alterationData">
                            {
                                (loadingComplete) && <strong>{this.alterationSummary.component!}</strong>
                            }
                            </div>

                            <ShareUI sessionEnabled={ServerConfigHelpers.sessionServiceIsEnabled()}
                                     bitlyAccessToken={AppConfig.serverConfig.bitly_access_token}
                                     routingStore={this.props.routingStore}/>
                        </div>

                    </div>

                    {
                        (this.queryFormVisible) && (
                            <div style={{marginTop:10}}>
                                <QueryAndDownloadTabs onSubmit={this.onSubmit} showDownloadTab={false} store={this.queryStore!} />
                            </div>
                        )
                    }
                </div>
            )
        } else {
            return null;
        }
    }

}
