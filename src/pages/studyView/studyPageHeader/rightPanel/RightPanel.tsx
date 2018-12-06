import * as React from 'react';
import * as _ from 'lodash';
import {observer} from "mobx-react";
import {action, computed, observable} from 'mobx';
import styles from "../styles.module.scss";
import autobind from "autobind-decorator";
import {getPatientViewUrl} from 'shared/api/urls';
import {SingleGeneQuery} from 'shared/lib/oql/oql-parser';
import {Gene} from 'shared/api/generated/CBioPortalAPI';
import GeneSelectionBox, {GeneBoxType} from 'shared/components/GeneSelectionBox/GeneSelectionBox';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import VirtualStudy from 'pages/studyView/virtualStudy/VirtualStudy';
import fileDownload from 'react-file-download';
import {Else, If, Then} from 'react-if';
import {StudyViewPageStore} from 'pages/studyView/StudyViewPageStore';
import classnames from "classnames";
import shareUIstyles from '../../../resultsView/querySummary/shareUI.module.scss';

export interface IRightPanelProps {
    store: StudyViewPageStore,
    user?: string
}

export type GeneReplacement = { alias: string, genes: Gene[] };

@observer
export default class RightPanel extends React.Component<IRightPanelProps, {}> {

    @observable private isCustomCaseBoxOpen = false;
    @observable private _isQueryButtonDisabled = false;

    @observable downloadingData = false;
    @observable showDownloadErrorMessage = false;

    @observable private showMoreDescription = false;

    @autobind
    private handleDownload() {
        this.downloadingData = true;
        this.showDownloadErrorMessage = false;
        this.props.store.getDownloadDataPromise().then(text => {
            this.downloadingData = false;
            fileDownload(text, 'data.tsv');
        }).catch(() => {
            this.downloadingData = false;
            this.showDownloadErrorMessage = true;
        });
    }

    @autobind
    private openCases() {
        if (!_.isEmpty(this.props.store.selectedPatients.result)) {
            const firstPatient = this.props.store.selectedPatients.result[0];

            let navCaseIds = _.map(this.props.store.selectedPatients.result, patient => {
                return {patientId: patient.patientId, studyId: patient.studyId}
            });

            window.open(getPatientViewUrl(firstPatient.studyId, firstPatient.patientId, navCaseIds));
        }
    }

    @autobind
    @action
    private updateSelectedGenes(oql: {
                                    query: SingleGeneQuery[],
                                    error?: { start: number, end: number, message: string }
                                },
                                genes: {
                                    found: Gene[];
                                    suggestions: GeneReplacement[];
                                },
                                queryStr: string,
                                status: "pending" | "error" | "complete") {
        this._isQueryButtonDisabled = queryStr==='' || (status === 'pending') || !_.isUndefined(oql.error) || genes.suggestions.length !== 0;
        if (status === "complete") {
            this.props.store.updateSelectedGenes(oql.query, genes.found);
        }
    }

    @computed
    get virtualStudyButtonTooltip() {
        //default value of userEmailAddress is anonymousUser. see my-index.ejs
        return (
            (_.isUndefined(this.props.user) ||
                _.isEmpty(this.props.user) ||
                _.isEqual(this.props.user.toLowerCase(), 'anonymoususer')
            ) ? '' : 'Save/') + 'Share Virtual Study';
    }

    @computed
    get downloadButtonTooltip() {
        if (this.showDownloadErrorMessage) {
            return "An error occurred while downloading the data. Please try again.";
        }
        return 'Download clinical data for the selected cases';
    }


    render() {
        return (
            <div className="studyViewSummaryHeader">
                <div className={styles.rightPanel}>
                    <GeneSelectionBox
                        inputGeneQuery={this.props.store.geneQueryStr}
                        callback={this.updateSelectedGenes}
                        location={GeneBoxType.STUDY_VIEW_PAGE}
                    />
                    <button disabled={this._isQueryButtonDisabled}
                            className={classnames('btn btn-primary btn-sm', styles.submitQuery)}
                            onClick={() => this.props.store.onSubmitQuery()}>
                        Query
                    </button>
                    <div className={classnames(shareUIstyles.shareModule, styles.iconGroup)}>
                        <DefaultTooltip
                            trigger={['click']}
                            destroyTooltipOnHide={true}
                            overlay={
                                <VirtualStudy
                                    user={this.props.user}
                                    studyWithSamples={this.props.store.studyWithSamples.result}
                                    selectedSamples={this.props.store.selectedSamples.result}
                                    filter={this.props.store.userSelections}
                                    attributesMetaSet={this.props.store.chartMetaSet}
                                />
                            }
                            placement="bottom"
                        >
                            <DefaultTooltip
                                placement={"top"}
                                trigger={['hover']}
                                overlay={<span>{this.virtualStudyButtonTooltip}</span>}
                            >
                                <a>
                                    <span className="fa-stack fa-4x">
                                        <i className="fa fa-circle fa-stack-2x"></i>
                                        <i className="fa fa-bookmark fa-stack-1x"></i>
                                    </span>
                                </a>
                            </DefaultTooltip>
                        </DefaultTooltip>

                        <DefaultTooltip
                            trigger={["hover"]}
                            placement={"top"}
                            overlay={<span>View selected cases</span>}
                        >
                            <a onClick={this.openCases}>
                                <span className="fa-stack fa-4x">
                                    <i className="fa fa-circle fa-stack-2x"></i>
                                    <i className="fa fa-user-circle-o fa-stack-1x"></i>
                                </span>
                            </a>
                        </DefaultTooltip>

                        <DefaultTooltip
                            trigger={["hover"]}
                            placement={"top"}
                            overlay={<span>{this.downloadButtonTooltip}</span>}
                        >
                            <a onClick={this.handleDownload}>
                                <span className="fa-stack fa-4x">
                                    <i className="fa fa-circle fa-stack-2x"></i>
                                    <If condition={this.downloadingData}>
                                        <Then>
                                            <i className="fa fa-spinner fa-spin fa-stack-1x"></i>
                                        </Then>
                                        <Else>
                                            <i className="fa fa-download fa-stack-1x"></i>
                                        </Else>
                                    </If>
                                </span>
                            </a>
                        </DefaultTooltip>

                        {/* Todo: share button*/}
                        {/*<a onClick={()=>{}}>*/}
                        {/*<span className="fa-stack fa-4x">*/}
                        {/*<i className="fa fa-circle fa-stack-2x"></i>*/}
                        {/*<i className="fa fa-link fa-stack-1x"></i>*/}
                        {/*</span>*/}
                        {/*</a>*/}
                    </div>
                </div>
            </div>
        )
    }
}