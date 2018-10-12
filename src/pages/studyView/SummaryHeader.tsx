import * as React from 'react';
import * as _ from 'lodash';
import {
    Sample,
    ClinicalDataIntervalFilterValue,
    SampleIdentifier,
    CopyNumberGeneFilterElement
} from 'shared/api/generated/CBioPortalAPIInternal';
import { observer } from "mobx-react";
import { computed, observable, action } from 'mobx';
import styles from "./styles.module.scss";
import studyViewStyles from "pages/studyView/styles.module.scss";
import "./styles.scss";
import { bind } from 'bind-decorator';
import {getSampleViewUrl} from 'shared/api/urls';
import CustomCaseSelection from 'pages/studyView/customCaseSelection/CustomCaseSelection';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { Gene } from 'shared/api/generated/CBioPortalAPI';
import GeneSelectionBox, { GeneBoxType } from 'shared/components/GeneSelectionBox/GeneSelectionBox';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import VirtualStudy from 'pages/studyView/virtualStudy/VirtualStudy';
import fileDownload from 'react-file-download';
import { If, Then, Else } from 'react-if';
import { StudyWithSamples, ChartMeta, StudyViewFilterWithSampleIdentifierFilters } from 'pages/studyView/StudyViewPageStore';
import UserSelections from 'pages/studyView/UserSelections';
import SelectedInfo from "./SelectedInfo/SelectedInfo";
import classnames from "classnames";
import MobxPromise from 'mobxpromise';
import {formatFrequency, getFrequencyStr} from "./StudyViewUtils";
const CheckedSelect = require("react-select-checked").CheckedSelect;

export interface ISummaryHeaderProps {
    geneQuery:string;
    selectedSamples: Sample[];
    updateCustomCasesFilter:(samples:SampleIdentifier[]) => void;
    updateSelectedGenes: (query: SingleGeneQuery[], genesInQuery: Gene[]) => void;
    studyWithSamples:StudyWithSamples[];
    filter: StudyViewFilterWithSampleIdentifierFilters;
    attributesMetaSet: {[id:string]:ChartMeta};
    user?: string;
    getClinicalData: () => Promise<string>;
    onSubmitQuery:() => void
    updateClinicalDataEqualityFilter: (chartMeta: ChartMeta, value: string[]) => void;
    updateClinicalDataIntervalFilter: (chartMeta: ChartMeta, values: ClinicalDataIntervalFilterValue[]) => void;
    removeGeneFilter: (entrezGeneId: number) => void;
    removeCNAGeneFilter: (filter: CopyNumberGeneFilterElement) => void;
    clearGeneFilter: () => void;
    clearCNAGeneFilter: () => void;
    clearChartSampleIdentifierFilter: (chartMeta: ChartMeta) => void;
    clearAllFilters:() => void;
    clinicalAttributesWithCountPromise: MobxPromise<{ [clinicalAttributeId: string]: number }>;
    visibleAttributeIds: ChartMeta[];
    onChangeChartsVisibility: (visibleChartIds: string[]) => void;
}

export type GeneReplacement = {alias: string, genes: Gene[]};

@observer
export default class SummaryHeader extends React.Component<ISummaryHeaderProps, {}> {

    @observable private isCustomCaseBoxOpen = false;
    @observable private _isQueryButtonDisabled = false;

    @observable downloadingData = false;
    @observable showDownloadErrorMessage = false;

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

            let navCaseIds = _.map(this.props.selectedSamples, sample => {
                return {patientId:sample.patientId, studyId:sample.studyId}
            })

            window.open(getSampleViewUrl(firstSample.studyId, firstSample.sampleId, navCaseIds));
        }
    }

    @bind
    @action
    private onSubmit(cases:Sample[]) {
        this.props.updateCustomCasesFilter(_.map(cases, obj => {
            return {
                "sampleId": obj.sampleId,
                "studyId": obj.studyId
            }
        }));
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
            ) ? '' : 'Save/') + 'Share Virtual Study';
    }

    @computed get downloadButtonTooltip() {
        if(this.showDownloadErrorMessage){
            return "An error occurred while downloading the data. Please try again.";
        }
        return 'Download clinical data for the selected cases';
    }

    @computed get chartOptions() {
        let options = _.reduce(this.props.clinicalAttributesWithCountPromise.result || {}, (options, sampleCount: number, key: string) => {
            let freq = 100* sampleCount / this.props.selectedSamples.length;
            const newOption = {
                label: `${this.props.attributesMetaSet[key].displayName} (${getFrequencyStr(freq)})`,
                value: key,
                disabled: false,
                freq: formatFrequency(freq)
            };
            if (sampleCount === 0) {
                newOption.disabled = true;
            }
            options.push(newOption);
            return options;
        }, [] as { label: string, value: string, freq: number, disabled?: boolean }[]);
        return options.sort((a, b) => {
            if (a.freq === b.freq) {
                //sort alphabetically
                if (a.label < b.label) return -1;
                if (a.label > b.label) return 1;
                return 0;
            }
            return b.freq - a.freq;
        });
    }

    @bind
    @action
    private onChangeSelectedCharts(options: { label: string, value: string }[]) {
        this.props.onChangeChartsVisibility(options.map(option => option.value));
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

                <div className={styles.summaryHeader}>

                    <div className="form-group form-group-custom">
                        <SelectedInfo selectedSamples={this.props.selectedSamples}/>


                        <div className="btn-group" role="group">
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
                            <DefaultTooltip
                                placement={"top"}
                                trigger={['hover']}
                                overlay={<span>{this.virtualStudyButtonTooltip}</span>}
                            >
                                <button
                                    className={classnames('btn btn-default btn-sm')}
                                    title={this.virtualStudyButtonTooltip}>
                                    <i className="fa fa-bookmark fa-lg" aria-hidden="true" title="Virtual Study"/>
                                </button>
                            </DefaultTooltip>
                        </DefaultTooltip>

                        <DefaultTooltip
                            trigger={["hover"]}
                            placement={"top"}
                            overlay={<span>View selected cases</span>}
                        >
                            <button
                                className={classnames('btn btn-default btn-sm')}
                                onClick={() => this.openCases()}>
                                <i className="fa fa-user-circle-o fa-lg" aria-hidden="true" title="View selected cases"></i>
                            </button>
                        </DefaultTooltip>

                        <DefaultTooltip
                            trigger={["hover"]}
                            placement={"top"}
                            overlay={<span>{this.downloadButtonTooltip}</span>}
                        >
                            <button className={classnames('btn btn-default btn-sm')} onClick={() => this.handleDownload()}>
                                <If condition={this.downloadingData}>
                                    <Then>
                                        <i className="fa fa-spinner fa-spin fa-lg" aria-hidden="true"></i>
                                    </Then>
                                    <Else>
                                        <i className="fa fa-download fa-lg" aria-hidden="true"></i>
                                    </Else>
                                </If>
                            </button>
                        </DefaultTooltip>
                        </div>
                    </div>
                    <div className="form-group form-group-custom">
                        <GeneSelectionBox
                            inputGeneQuery={this.props.geneQuery}
                            callback={this.updateSelectedGenes}
                            location={GeneBoxType.STUDY_VIEW_PAGE}
                        />

                        <button disabled={this._isQueryButtonDisabled} className={classnames(styles.summaryHeaderBtn, studyViewStyles.studyViewBtn, 'btn btn-primary btn-sm', styles.summaryHeaderItem)} onClick={() => this.props.onSubmitQuery()}>
                            Submit Query
                        </button>

                        <button
                            className={classnames('btn btn-default btn-sm', styles.summaryHeaderBtn, styles.summaryHeaderItem)}
                            onClick={() => this.isCustomCaseBoxOpen = true}
                        >
                            Select cases
                        </button>



                    </div>

                    <div className="form-group form-group-custom">
                        <div className={classnames(styles.summaryHeaderItem)}>
                            <CheckedSelect
                                disabled={this.props.clinicalAttributesWithCountPromise.isPending}
                                placeholder={"Add Chart"}
                                onChange={this.onChangeSelectedCharts}
                                options={this.chartOptions}
                                value={(this.props.visibleAttributeIds || []).map(chartMeta => ({value: chartMeta.uniqueKey}))}
                                labelKey="label"
                            />
                        </div>
                    </div>


                </div>

                <UserSelections
                    filter={this.props.filter}
                    attributesMetaSet={this.props.attributesMetaSet}
                    updateClinicalDataEqualityFilter={this.props.updateClinicalDataEqualityFilter}
                    updateClinicalDataIntervalFilter={this.props.updateClinicalDataIntervalFilter}
                    removeGeneFilter={this.props.removeGeneFilter}
                    removeCNAGeneFilter={this.props.removeCNAGeneFilter}
                    clearCNAGeneFilter={this.props.clearCNAGeneFilter}
                    clearGeneFilter={this.props.clearGeneFilter}
                    clearChartSampleIdentifierFilter={this.props.clearChartSampleIdentifierFilter}
                    clearAllFilters={this.props.clearAllFilters}
                />
            </div>
        )
    }


}