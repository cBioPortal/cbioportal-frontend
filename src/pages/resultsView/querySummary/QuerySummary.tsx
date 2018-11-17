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

    private get singleStudyUI() {
        return <div>
            <h4 style={{fontSize:14}}><StudyLink studyId={this.props.store.queriedStudies.result[0].studyId}/></h4>
            {(this.props.store.sampleLists.result!.length > 0) && (<span>
                        {this.props.store.sampleLists.result![0].name}&nbsp;
                (<strong>{this.props.store.sampleLists.result![0].sampleCount}</strong> samples)
                        / <strong data-test='QuerySummaryGeneCount'>{this.props.store.hugoGeneSymbols.length}</strong> { (this.props.store.hugoGeneSymbols.length === 1) ? "Gene" : "Genes"  }
                    </span>)
            }
            {
                (this.props.store.sampleLists.result!.length === 0) && (
                    <span>User-defined Patient List&nbsp;
                        ({this.props.store.samples.result!.length} samples)&nbsp;/&nbsp;
                        {this.props.store.genes.result!.length} { (this.props.store.hugoGeneSymbols.length === 1) ? "Gene" : "Genes"  }
                    </span>)
            }
        </div>
    }

    @autobind
    @action
    closeQueryForm(){
        this.queryStore = undefined;
        $(document).scrollTop(0);
    }

    private get multipleStudyUI() {
        return <div>
            <h4>
                <StudyLink studyId={this.props.store.queriedStudies.result.map(study => study.studyId).join(',')}>
                    {`Combined Study (${this.props.store.samples.result.length} samples)`}
                </StudyLink>
            </h4>
            <span>
                Querying {this.props.store.samples.result.length} samples in {this.props.store.queriedStudies.result.length} studies
                 &nbsp;
                 <DefaultTooltip
                     placement='bottom'
                     overlay={this.studyList}
                     destroyTooltipOnHide={true}
                 ><i className="fa fa-info-circle"/>
                </DefaultTooltip>
            </span>
        </div>
    }

    private get studyList(){

        return (<div className="cbioportal-frontend">
                <ul className="list-unstyled" style={{marginBottom:0}}>
                {
                    this.props.store.queriedStudies.result.map((study:CancerStudy)=>{
                        return <li><StudyLink studyId={study.studyId}/></li>
                    })
                }
                </ul>
        </div>)
    }

    render() {

        if (!this.props.store.totalAlterationStats.isError && !this.props.store.queriedStudies.isError) {

            const loadingComplete = this.props.store.totalAlterationStats.isComplete && this.props.store.queriedStudies.isComplete && this.props.store.samples.isComplete;

            let alterationPercentage = (loadingComplete) ?
                (this.props.store.totalAlterationStats.result!.alteredSampleCount / this.props.store.totalAlterationStats.result!.sampleCount * 100) : 0;

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
                                (loadingComplete) && ((this.props.store.queriedStudies.result.length === 1) ? this.singleStudyUI : this.multipleStudyUI)
                            }
                        </div>

                        <div className="query-summary__rightItems">

                            {
                                (loadingComplete) && (
                                    <div className="query-summary__alterationData">
                                        <strong>Gene Set / Pathway is altered
                                            in {this.props.store.totalAlterationStats.result!.alteredSampleCount} ({_.round(alterationPercentage, 1)}%) of queried samples</strong>
                                    </div>
                                )
                            }

                            <ShareUI sessionEnabled={ServerConfigHelpers.sessionServiceIsEnabled()}
                                     bitlyAccessToken={AppConfig.serverConfig.bitly_access_token}
                                     routingStore={this.props.routingStore}/>
                        </div>

                    </div>

                    {
                        (this.queryFormVisible) && (
                            <div style={{marginTop:10}}>
                                <QueryAndDownloadTabs onSubmit={this.closeQueryForm} showDownloadTab={false} store={this.queryStore!} />
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
