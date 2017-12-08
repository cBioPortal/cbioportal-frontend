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
import formSubmit from '../../../shared/lib/formSubmit';
import Loader from "../../../shared/components/loadingIndicator/LoadingIndicator";
import {observable} from "mobx";
import {QueryStore} from "../../../shared/components/query/QueryStore";
import QueryAndDownloadTabs from "../../../shared/components/query/QueryAndDownloadTabs";

class StudyLink extends React.Component<{ study: CancerStudy, onClick?: () => void, href?:string }, {}> {
    render() {
        return (<a href={this.props.href || 'javascript:void(0)'} target="_blank" style={{cursor:'pointer'}} onClick={this.props.onClick || (()=>{})}>{this.props.study.name}</a>);
    }
}

@observer
export default class QuerySummary extends React.Component<{ queryStore:QueryStore, store: ResultsViewPageStore }, {}> {

    @observable private queryFormVisible = false;
    @observable private queryStoreInitialized = false;

    constructor() {
        super();
        this.handleModifyQueryClick = this.handleModifyQueryClick.bind(this);
        this.goToStudySummary = this.goToStudySummary.bind(this);
    }

    private handleModifyQueryClick() {

        // this will have no functional impact after initial invocation of this method
        this.queryStoreInitialized = true;

        // toggle visibility
        this.queryFormVisible = !this.queryFormVisible;

    }

    private get cohortsList():string[]{
        console.log("AARON MAKE THIS RIGHT");
        return (window as any).cohortIdsList;
    }

    private get singleStudyUI() {
        return <div>
            <h4><StudyLink study={this.props.store.studies.result[0]}/></h4>
            <span>
                {(window as any).serverVars.caseSetProperties.case_set_name}
                (<strong>{this.props.store.studies.result[0].allSampleCount}</strong> samples)
                 / <strong>{this.props.store.hugoGeneSymbols.length}</strong> Genes
            </span>
        </div>
    }

    private goToStudySummary(){
        // try to use formSubmit, it exists if the new frontend code has been loaded
        // if not, just navigate in the standard way
        var cohortsParam = this.cohortsList.join(",");
        formSubmit("study", {id:cohortsParam}, "_blank", (cohortsParam.length > 1800 ? "post" : "get"));
    }

    private get multipleStudyUI() {
        return <div>
            <h4><a onClick={this.goToStudySummary}>Combined Study</a></h4>
            <span>
                This combined study contains samples from {this.props.store.studies.result.length} studies
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
                    this.props.store.studies.result.map((study:CancerStudy)=>{
                        return <li><StudyLink href={`study?id=${study.studyId}`} study={study} /></li>
                    })
                }
                </ul>
        </div>)
    }

    render() {

        if (!this.props.store.totalAlterationStats.isError && !this.props.store.studies.isError) {


            const loadingComplete = this.props.store.totalAlterationStats.isComplete && this.props.store.studies.isComplete;

            let alterationPercentage = (loadingComplete) ?
                (this.props.store.totalAlterationStats.result!.alteredSampleCount / this.props.store.totalAlterationStats.result!.sampleCount * 100) : 0;

            return (
                <div>
                    <div className="query-summary">
                        <div className="query-summary__leftItems">
                            <div>
                                <button onClick={this.handleModifyQueryClick} className={classNames('btn btn-primary' , { disabled:!loadingComplete  })}>
                                    {(this.queryFormVisible) ? 'Cancel Modify Query' : 'Modify Query'}
                                </button>
                            </div>


                            <Loader isLoading={loadingComplete === false}/>


                            {
                                (loadingComplete) && ((this.props.store.studies.result.length === 1) ? this.singleStudyUI : this.multipleStudyUI)
                            }
                        </div>
                        {
                            (loadingComplete) && (<div className="query-summary__alterationData">
                                <h4>Gene Set / Pathway is altered
                                in {_.round(alterationPercentage, 2)}% of queried samples</h4>
                            </div>)
                        }
                    </div>

                    {
                        (this.queryStoreInitialized) && (
                            <div style={{marginTop:10}} className={classNames({ hidden:!this.queryFormVisible })}>
                                <QueryAndDownloadTabs showDownloadTab={false} store={this.props.queryStore} />
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