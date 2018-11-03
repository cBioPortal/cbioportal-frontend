import * as React from 'react';
import * as _ from 'lodash';
import {Sample} from 'shared/api/generated/CBioPortalAPIInternal';
import {observer} from "mobx-react";
import {action, computed, observable, reaction} from 'mobx';
import styles from "../styles.module.scss";
import {bind} from 'bind-decorator';
import {getSampleViewUrl} from 'shared/api/urls';
import {SingleGeneQuery} from 'shared/lib/oql/oql-parser';
import {Gene} from 'shared/api/generated/CBioPortalAPI';
import GeneSelectionBox, {GeneBoxType} from 'shared/components/GeneSelectionBox/GeneSelectionBox';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import VirtualStudy from 'pages/studyView/virtualStudy/VirtualStudy';
import fileDownload from 'react-file-download';
import {Else, If, Then} from 'react-if';
import {StudyViewPageStore, UniqueKey} from 'pages/studyView/StudyViewPageStore';
import classnames from "classnames";
import {formatFrequency, getFrequencyStr} from "../../StudyViewUtils";
import shareUIstyles from '../../../resultsView/querySummary/shareUI.module.scss';

const CheckedSelect = require("react-select-checked").CheckedSelect;

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

    @observable addChartClicked = false;

    // Only fetch the clinical attribute count when filter changes, otherwise use the cached data.
    @observable filterIsUpdated = false;

    // clinicalAttributesWithCount result
    // We cannot reference the promise in the compute directly since it will be dereferenced in the reaction.
    @observable cachedClinicalAttributesWithCount: any;

    @observable private showMoreDescription = false;

    private promiseReaction = reaction(() => this.clinicalAttributesWithCountPromise && this.clinicalAttributesWithCountPromise.status, () => {
        if (this.clinicalAttributesWithCountPromise !== undefined && this.clinicalAttributesWithCountPromise.isComplete) {
            this.cachedClinicalAttributesWithCount = _.reduce(this.clinicalAttributesWithCountPromise.result, (acc, next, key) => {
                acc[key] = next;
                return acc;
            }, {} as { [attrId: string]: number });
            this.addChartClicked = false;
            this.filterIsUpdated = false;
        }
    });

    private filterReaction = reaction(() => this.props.store.userSelections, () => {
        if (this.props.store.userSelections !== undefined) {
            this.filterIsUpdated = true;
        }
    }, {fireImmediately: true});

    componentWillUnmount() {
        // dispose all reactions
        this.filterReaction();
        this.promiseReaction();
    }

    @bind
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

    @bind
    private openCases() {
        if (!_.isEmpty(this.props.store.selectedSamples.result)) {
            const firstSample = this.props.store.selectedSamples.result[0];

            let navCaseIds = _.map(this.props.store.selectedSamples.result, sample => {
                return {patientId: sample.patientId, studyId: sample.studyId}
            })

            window.open(getSampleViewUrl(firstSample.studyId, firstSample.sampleId, navCaseIds));
        }
    }

    @bind
    @action
    private onSubmit(cases: Sample[]) {
        this.props.store.updateChartSampleIdentifierFilter(UniqueKey.SELECT_CASES_BY_IDS, _.map(cases, obj => {
            return {
                "sampleId": obj.sampleId,
                "studyId": obj.studyId
            }
        }));
        this.isCustomCaseBoxOpen = false;
    }

    @bind
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
        this._isQueryButtonDisabled = (status === 'pending') || !_.isUndefined(oql.error) || genes.suggestions.length !== 0;
        if (status === "complete") {
            this.props.store.updateSelectedGenes(oql.query, genes.found);
        }
    }

    @computed
    get fetchForDataAvailability() {
        if (this.addChartClicked && this.filterIsUpdated) {
            return true;
        }
        return false;
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

    @computed
    get clinicalAttributesWithCountPromise() {
        return this.fetchForDataAvailability ? this.props.store.clinicalAttributesWithCount : undefined;
    }

    @computed
    get checkedSelectPlaceHolder() {
        if (this.fetchForDataAvailability) {
            return 'Calculating data availability...';
        } else {
            return 'Add Chart'
        }
    }

    @computed
    get chartOptions() {
        let options = [];
        if (this.cachedClinicalAttributesWithCount !== undefined) {
            options = _.reduce(this.cachedClinicalAttributesWithCount, (options, sampleCount: number, key: string) => {
                let freq = 100 * sampleCount / this.props.store.selectedSamples.result.length;
                const newOption = {
                    label: `${this.props.store.chartMetaSet[key].displayName} (${getFrequencyStr(freq)})`,
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
        } else {
            options = _.reduce(Object.keys(this.props.store.chartMetaSet), (options, key: string) => {
                const newOption = {
                    label: this.props.store.chartMetaSet[key].displayName,
                    value: key,
                    disabled: false,
                    freq: 1
                };
                options.push(newOption);
                return options;
            }, [] as { label: string, value: string, freq: number, disabled?: boolean }[]);
        }
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
        this.props.store.updateChartsVisibility(options.map(option => option.value));
    }

    @bind
    @action
    private addChartIsClicked() {
        this.addChartClicked = true;
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