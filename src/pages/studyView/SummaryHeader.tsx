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
import { StudyWithSamples } from 'pages/studyView/StudyViewPageStore';

export interface ISummaryHeaderProps {
    geneQuery:string;
    selectedSamples: Sample[];
    updateCustomCasesFilter:(samples:Sample[]) => void;
    updateSelectedGenes: (query: SingleGeneQuery[], genesInQuery: Gene[]) => void;
    studyWithSamples:StudyWithSamples[];
    filter: StudyViewFilter;
    attributeNamesSet: {[id:string]:string};
    user?: string;
}

export type GeneReplacement = {alias: string, genes: Gene[]};

@observer
export default class SummaryHeader extends React.Component<ISummaryHeaderProps, {}> {

    @observable private isCustomCaseBoxOpen = false;
    @observable private isQueryButtonDisabled = false;

    @computed
    get selectedPatientsCount() {
        return _.uniq(this.props.selectedSamples.map(sample => sample.uniquePatientKey)).length;
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
        this.isQueryButtonDisabled = (status === 'pending') || !_.isUndefined(oql.error) || genes.suggestions.length === 0;
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
                                attributeNamesSet={this.props.attributeNamesSet}
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
                    <button className="btn" onClick={() => null}>
                        <i className="fa fa-download" aria-hidden="true" title="Download clinical data for selected cases"></i>
                    </button>
                    <GeneSelectionBox
                        inputGeneQuery={this.props.geneQuery}
                        callback={this.updateSelectedGenes}
                        location={GeneBoxType.STUDY_VIEW_PAGE}
                    />
                    {/* <span style={{ margin: "0px 5px" }}><i className="fa fa-arrow-right fa-lg" aria-hidden="true"></i></span>
                    <button disabled={this.isQueryButtonDisabled} className="btn" onClick={() => null}>
                        Query
                    </button> */}
                    <button
                        className="btn"
                        onClick={()=>this.isCustomCaseBoxOpen = true}
                    >
                        Select cases
                    </button>
                </div>
            </div>
        )
    }


}