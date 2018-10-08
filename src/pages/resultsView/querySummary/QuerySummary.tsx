import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import {inject, observer} from "mobx-react";
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import {If, Then, Else} from 'react-if';
import {CancerStudy} from "../../../shared/api/generated/CBioPortalAPI";
import classNames from 'classnames';
import './styles.scss';
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";
import Loader, {default as LoadingIndicator} from "../../../shared/components/loadingIndicator/LoadingIndicator";
import {action, observable} from "mobx";
import {QueryStore} from "../../../shared/components/query/QueryStore";
import QueryAndDownloadTabs from "../../../shared/components/query/QueryAndDownloadTabs";
import autobind from "autobind-decorator";
import {BookmarkModal} from "../bookmark/BookmarkModal";
import ExtendedRouterStore from "../../../shared/lib/ExtendedRouterStore";


class StudyLink extends React.Component<{ study: CancerStudy, onClick?: () => void, href?:string }, {}> {
    render() {
        return (<a href={this.props.href || `newstudy?id=${this.props.study.studyId}`} target="_blank" style={{cursor:'pointer'}} onClick={this.props.onClick || (()=>{})}>{this.props.study.name}</a>);
    }
}

@observer
export default class QuerySummary extends React.Component<{ queryStore:QueryStore, routingStore:ExtendedRouterStore, store: ResultsViewPageStore }, {}> {

    @observable private queryFormVisible = false;
    @observable private queryStoreInitialized = false;
    @observable private showBookmarkDialog = false;

    constructor() {
        super();
        this.handleModifyQueryClick = this.handleModifyQueryClick.bind(this);
    }

    private handleModifyQueryClick() {

        // this will have no functional impact after initial invocation of this method
        this.queryStoreInitialized = true;

        // toggle visibility
        this.queryFormVisible = !this.queryFormVisible;

    }

    private get singleStudyUI() {
        return <div>
            <h4 style={{fontSize:14}}><StudyLink study={this.props.store.queriedStudies.result[0]}/></h4>
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
        this.queryFormVisible=false;
        $(document).scrollTop(0);
    }

    @autobind
    @action
    toggleBookmarkDialog(){
        this.showBookmarkDialog = !this.showBookmarkDialog;
    }

    private get multipleStudyUI() {
        return <div>
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
                        return <li><StudyLink href={`study?id=${study.studyId}`} study={study} /></li>
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

                    {
                        (this.showBookmarkDialog) && (
                            <BookmarkModal routingStore={this.props.routingStore} onHide={this.toggleBookmarkDialog}  />
                        )
                    }

                    <div className="query-summary">
                        <div className="query-summary__leftItems">
                            <div>
                                <button id="modifyQueryBtn" onClick={this.handleModifyQueryClick} className={classNames('btn btn-primary' , { disabled:!loadingComplete  })}>
                                    {(this.queryFormVisible) ? 'Cancel Modify Query' : 'Modify Query'}
                                </button>

                                <DefaultTooltip overlay={<div>Bookmark query</div>}>
                                    <button className="btn btn-default" onClick={this.toggleBookmarkDialog} style={{marginLeft:10}}><i className="fa fa-bookmark fa-lg text-primary"></i></button>
                                </DefaultTooltip>

                            </div>

                            <LoadingIndicator isLoading={!loadingComplete} small={true}/>


                            {
                                (loadingComplete) && ((this.props.store.queriedStudies.result.length === 1) ? this.singleStudyUI : this.multipleStudyUI)
                            }
                        </div>
                        {
                            (loadingComplete) && (<div className="query-summary__alterationData">
                                <h4 style={{fontSize:14}}>Gene Set / Pathway is altered
                                in {this.props.store.totalAlterationStats.result!.alteredSampleCount} ({_.round(alterationPercentage, 1)}%) of queried samples</h4>
                            </div>)
                        }
                    </div>

                    {
                        (this.queryStoreInitialized) && (
                            <div style={{marginTop:10}} className={classNames({ hidden:!this.queryFormVisible })}>
                                <QueryAndDownloadTabs onSubmit={this.closeQueryForm} showDownloadTab={false} store={this.props.queryStore} />
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
