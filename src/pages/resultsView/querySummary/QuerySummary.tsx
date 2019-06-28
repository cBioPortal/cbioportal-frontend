import * as React from 'react';
import { observer} from "mobx-react";
import {ResultsViewPageStore} from "../ResultsViewPageStore";

import {CancerStudy} from "../../../shared/api/generated/CBioPortalAPI";
import classNames from 'classnames';
import './styles.scss';
import DefaultTooltip from "../../../public-lib/components/defaultTooltip/DefaultTooltip";
import Loader, {default as LoadingIndicator} from "../../../shared/components/loadingIndicator/LoadingIndicator";
import {action, computed, observable} from "mobx";
import QueryAndDownloadTabs from "../../../shared/components/query/QueryAndDownloadTabs";
import autobind from "autobind-decorator";
import ExtendedRouterStore from "../../../shared/lib/ExtendedRouterStore";
import {ShareUI} from "./ShareUI";
import {ServerConfigHelpers} from "../../../config/config";
import AppConfig from "appConfig";
import {StudyLink} from "../../../shared/components/StudyLink/StudyLink";
import {createQueryStore} from "../../home/HomePage";
import getBrowserWindow from "../../../shared/lib/getBrowserWindow";
import {getAlterationSummary, getGeneSummary, getPatientSampleSummary} from "./QuerySummaryUtils";
import {MakeMobxView} from "../../../shared/components/MobxView";
import {getGAInstance} from "../../../shared/lib/tracking";
import {buildCBioPortalPageUrl} from "../../../shared/api/urls";

@observer
export default class QuerySummary extends React.Component<{ routingStore:ExtendedRouterStore, store: ResultsViewPageStore, onToggleQueryFormVisiblity:(visible:boolean)=>void }, {}> {

    @autobind
    private toggleQueryFormVisibility() {
        this.props.onToggleQueryFormVisiblity(this._queryFormVisible);
        this._queryFormVisible = !this._queryFormVisible;
    }

    @observable _queryFormVisible: boolean = false;

    @computed get queryFormVisible(){
        return this._queryFormVisible || this.isQueryOrGeneInvalid;
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
        this.toggleQueryFormVisibility();
        $(document).scrollTop(0);
    }

    readonly multipleStudyUI = MakeMobxView({
        await:()=>[this.props.store.samples, this.props.store.patients, this.props.store.queriedStudies],
        render:()=>(
            <div>
                <h3>
                    <a
                        href={buildCBioPortalPageUrl(`study`, { id:this.props.store.queriedStudies.result.map(study => study.studyId).join(',')})}
                        target="_blank"
                    >
                        Combined Study ({this.props.store.samples.result.length} samples)
                    </a>
                </h3>
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

    @computed get queryForm(){
        return <div style={{margin:"10px -20px 0 -20px"}}>
            <QueryAndDownloadTabs onSubmit={this.onSubmit}
                                  showQuickSearchTab={false}
                                  showDownloadTab={false}
                                  showAlerts={true}
                                  getQueryStore={()=>createQueryStore(getBrowserWindow().routingStore.query)}
            />
        </div>
    }

    @computed get isQueryOrGeneInvalid() {
        return this.props.store.genesInvalid || this.props.store.isQueryInvalid;
    }

    render() {

        if (!this.cohortAndGeneSummary.isError && !this.alterationSummary.isError) {

            const loadingComplete = this.cohortAndGeneSummary.isComplete && this.alterationSummary.isComplete;

            return (
                <div>
                    <div className="query-summary">
                        <div className="query-summary__leftItems">
                            {
                                (!this.isQueryOrGeneInvalid) && (
                                    <div>
                                        <button id="modifyQueryBtn" onClick={this.toggleQueryFormVisibility} className={classNames('btn btn-primary' , { disabled:!loadingComplete  })}>
                                            {(this.queryFormVisible) ? 'Cancel Modify Query' : 'Modify Query'}
                                        </button>
                                    </div>
                                )
                            }

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
                        (this.queryFormVisible) && this.queryForm
                    }
                </div>
            )
        } else if (this.isQueryOrGeneInvalid) {
            return this.queryForm;
        } else {
            return null;
        }
    }

}
