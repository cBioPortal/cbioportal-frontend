import * as React from 'react';
import * as _ from 'lodash';
import { Sample, StudyViewFilter } from 'shared/api/generated/CBioPortalAPIInternal';
import { observer } from "mobx-react";
import { computed, observable, action } from 'mobx';
import "./styles.scss";
import { bind } from 'bind-decorator';
import { buildCBioPortalUrl } from 'shared/api/urls';
import CustomCaseSelection from 'pages/studyView/customCaseSelection/CustomCaseSelection';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { Gene } from 'shared/api/generated/CBioPortalAPI';
import GeneSelectionBox, { GeneBoxType } from 'shared/components/GeneSelectionBox/GeneSelectionBox';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import VirtualStudy from 'pages/studyView/virtualStudy/VirtualStudy';
import fileDownload from 'react-file-download';
import { If, Then, Else } from 'react-if';
import { StudyWithSamples, ChartMeta } from 'pages/studyView/StudyViewPageStore';
import UserSelections from 'pages/studyView/UserSelections';

export interface ISummaryHeaderProps {
    geneQuery:string;
    selectedSamples: Sample[];
    updateCustomCasesFilter:(samples:Sample[]) => void;
    updateSelectedGenes: (query: SingleGeneQuery[], genesInQuery: Gene[]) => void;
    studyWithSamples:StudyWithSamples[];
    filter: StudyViewFilter;
    attributesMetaSet: {[id:string]:ChartMeta};
    user?: string;
    getClinicalData: () => Promise<string>;
    onSubmitQuery:() => void
    updateClinicalDataEqualityFilter: (chartMeta: ChartMeta, value: string[]) => void;
    clearGeneFilter: () => void;
    clearCNAGeneFilter: () => void;
    clearCustomCasesFilter: () => void;
    clearAllFilters:() => void;
}

export type GeneReplacement = {alias: string, genes: Gene[]};

@observer
export default class SummaryHeader extends React.Component<ISummaryHeaderProps, {}> {

    @observable private isCustomCaseBoxOpen = false;
    @observable private _isQueryButtonDisabled = false;

    @observable downloadingData = false;
    @observable showDownloadErrorMessage = false;

    @computed
    get selectedPatientsCount() {
        return _.uniq(this.props.selectedSamples.map(sample => sample.uniquePatientKey)).length;
    }

    @bind
    private handleDownload() {
        this.downloadingData = true;
        this.showDownloadErrorMessage = false;
        this.props.getClinicalData().then(text => {
            this.downloadingData = false;
            fileDownload(text, 'data.tsv');
        }).catch(() => {
            this.downloadingData = false;
            this.showDownloadErrorMessage = true;
        });
    }

    @bind
    private openCases() {
        if (!_.isEmpty(this.props.selectedSamples)) {
            const firstSample = this.props.selectedSamples[0];
            const groupedSamples = _.groupBy(this.props.selectedSamples, sample => sample.studyId);
            const includeStudyId: boolean = Object.keys(groupedSamples).length > 1;

            let navCaseIds = _.map(this.props.selectedSamples, sample => (includeStudyId ? sample.studyId : '') + sample.sampleId).join(',')

            window.open(buildCBioPortalUrl(
                'patient',
                {
                    sampleId: firstSample.sampleId,
                    studyId: firstSample.studyId
                },
                '&navCaseIds=' + navCaseIds)
            );
        }
    }

    @bind
    @action
    private onSubmit(cases:Sample[]) {
        this.props.updateCustomCasesFilter(cases);
        this.isCustomCaseBoxOpen = false;
    }

    @bind
    @action
    private updateSelectedGenes(
        oql: {
            query: SingleGeneQuery[],
            error?: { start: number, end: number, message: string }
        },
        genes: {
            found: Gene[];
            suggestions: GeneReplacement[];
        },
        queryStr: string,
        status: "pending" | "error" | "complete") {
        this._isQueryButtonDisabled = (status === 'pending') || !_.isUndefined(oql.error) || genes.suggestions.length !== 0;
        if (status === "complete") {
            this.props.updateSelectedGenes(oql.query, genes.found);
        }
    }

    @computed get virtualStudyButtonTooltip() {
        //default value of userEmailAddress is anonymousUser. see my-index.ejs
        return (
            (_.isUndefined(this.props.user) ||
                _.isEmpty(this.props.user) ||
                _.isEqual(this.props.user.toLowerCase(), 'anonymoususer')
            ) ? 'Save/' : '') + 'Share Virtual Study';
    }

    @computed get downloadButtonTooltip() {
        if(this.showDownloadErrorMessage){
            return "An error occurred while downloading the data. Please try again.";
        }
        return 'Download clinical data for the selected cases';
    }

    render() {
        return (
            <div className="studyViewSummaryHeader">
                {
                    (this.isCustomCaseBoxOpen) && (
                        <CustomCaseSelection
                            selectedSamples={this.props.selectedSamples}
                            onClose={()=>this.isCustomCaseBoxOpen = false}
                            onSubmit={this.onSubmit}/>
                    )
                }
                    
                <div style={{display: "flex"}}>
                    <span>Selected:</span>
                    <span className="content">{this.props.selectedSamples.length} samples / {this.selectedPatientsCount} patients</span>
                    <DefaultTooltip
                        trigger={['click']}
                        destroyTooltipOnHide={true}
                        overlay={
                            <VirtualStudy
                                user={this.props.user}
                                studyWithSamples={this.props.studyWithSamples}
                                selectedSamples={this.props.selectedSamples}
                                filter={this.props.filter}
                                attributesMetaSet={this.props.attributesMetaSet}
                            />
                        }
                        placement="bottom"
                    >
                        <span className="btn" title={this.virtualStudyButtonTooltip}>
                            <i className="fa fa-bookmark" aria-hidden="true" title="Virtual Study"/>
                        </span>
                    </DefaultTooltip>
                    
                    <button className="btn" onClick={() => this.openCases()}>
                        <i className="fa fa-user-circle-o" aria-hidden="true" title="View selected cases"></i>
                    </button>
                    <DefaultTooltip
                        trigger={["hover"]}
                        placement={"top"}
                        overlay={<span>{this.downloadButtonTooltip}</span>}
                    >
                        <button className="btn" onClick={() => this.handleDownload()}>
                            <If condition={this.downloadingData}>
                                <Then>
                                    <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
                                </Then>
                                <Else>
                                    <i className="fa fa-download" aria-hidden="true"></i>
                                </Else>
                            </If>
                        </button>
                    </DefaultTooltip>
                    
                    <GeneSelectionBox
                        inputGeneQuery={this.props.geneQuery}
                        callback={this.updateSelectedGenes}
                        location={GeneBoxType.STUDY_VIEW_PAGE}
                    />
                    <span style={{ margin: "0px 5px" }}><i className="fa fa-arrow-right fa-lg" aria-hidden="true"></i></span>
                    <button disabled={this._isQueryButtonDisabled} className="btn" onClick={() => this.props.onSubmitQuery()}>
                        Query
                    </button>
                    <button
                        className="btn"
                        onClick={()=>this.isCustomCaseBoxOpen = true}
                    >
                        Select cases
                    </button>
                </div>

                <UserSelections
                    filter={this.props.filter}
                    attributesMetaSet={this.props.attributesMetaSet}
                    updateClinicalDataEqualityFilter={this.props.updateClinicalDataEqualityFilter}
                    clearCNAGeneFilter={this.props.clearCNAGeneFilter}
                    clearGeneFilter={this.props.clearGeneFilter}
                    clearCustomCasesFilter={this.props.clearCustomCasesFilter}
                    clearAllFilters={this.props.clearAllFilters}
                />
            </div>
        )
    }


}