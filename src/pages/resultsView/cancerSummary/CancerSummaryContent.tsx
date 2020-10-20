import * as React from 'react';
import * as _ from 'lodash';
import { Checkbox, ButtonGroup, Radio } from 'react-bootstrap';
import { computed, observable, action, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import Slider from 'react-rangeslider';
import { ControlLabel, FormControl } from 'react-bootstrap';
import { If, Then, Else } from 'react-if';
import classnames from 'classnames';

import 'react-select1/dist/react-select.css';
import 'react-rangeslider/lib/index.css';

import { CancerSummaryChart } from './CancerSummaryChart';
import { WindowWidthBox } from '../../../shared/components/WindowWidthBox/WindowWidthBox';

export const OrderedAlterationLabelMap: Record<
    keyof IAlterationCountMap,
    string
> = {
    multiple: 'Multiple Alterations',
    protExpressionLow: 'Protein Low',
    protExpressionHigh: 'Protein High',
    mrnaExpressionLow: 'mRNA Low',
    mrnaExpressionHigh: 'mRNA High',
    hetloss: 'Shallow Deletion',
    homdel: 'Deep Deletion',
    gain: 'Gain',
    amp: 'Amplification',
    fusion: 'Fusion',
    mutated: 'Mutation',
};

export const AlterationTypeToDataTypeLabel: { [id: string]: string } = {
    protein: 'Protein data',
    expression: 'mRNA data',
    cna: 'CNA data',
    mutation: 'Mutation data',
};

const alterationToColor: Record<keyof IAlterationCountMap, string> = {
    mutated: '#008000',
    amp: '#ff0000',
    homdel: '#0000ff', //"#8fd8d8" "rgb(0,0,255)",
    hetloss: '#8fd8d8',
    gain: 'rgb(255,182,193)',
    fusion: '#8B00C9',
    mrnaExpressionHigh: '#FF989A',
    mrnaExpressionLow: '#529AC8',
    protExpressionHigh: '#FF989A',
    protExpressionLow: '#E0FFFF',
    multiple: '#666',
};

export interface IAlterationCountMap {
    mutated: number;
    amp: number;
    homdel: number;
    hetloss: number;
    gain: number;
    fusion: number;
    mrnaExpressionHigh: number;
    mrnaExpressionLow: number;
    protExpressionHigh: number;
    protExpressionLow: number;
    multiple: number;
}

export interface IAlterationData {
    alterationTotal: number;
    profiledSampleTotal: number;
    alterationTypeCounts: IAlterationCountMap;
    alteredSampleCount: number;
    parentCancerType: string;
    profiledSamplesCounts: {
        mutation: number;
        cna: number;
        expression: number;
        protein: number;
    };
    notProfiledSamplesCounts: {
        mutation: number;
        cna: number;
        expression: number;
        protein: number;
    };
}

export interface ICancerSummaryChartData {
    representedAlterations: { [alterationType: string]: boolean };
    data: {
        x: string;
        y: number;
        alterationType: string;
    }[][];
    alterationTypeDataCounts: {
        x: string;
        y: string;
        profiledCount: number;
        notProfiledCount: number;
    }[];
    labels: string[];
    maxPercentage: number;
    maxAbsoluteCount: number;
    maxSampleCount: number;
}

export interface ICancerSummaryContentProps {
    labelTransformer?: (key: string) => string;
    groupedAlterationData: {
        [groupType: string]: IAlterationData;
    };
    groupAlterationsBy: string;
    gene: string;
    width: number;
    handlePivotChange: (e: any) => void;
    handleStudyLinkout?: (studyId: string, hugoGeneSymbol?: string) => void;
}

const GroupByOptions = [
    { value: 'studyId', label: 'Cancer Study' },
    { value: 'cancerType', label: 'Cancer Type' },
    { value: 'cancerTypeDetailed', label: 'Cancer Type Detailed' },
];

export function calculatePercentage(part: number, whole: number) {
    return (part / whole) * 100;
}

@observer
export class CancerSummaryContent extends React.Component<
    ICancerSummaryContentProps,
    {}
> {
    private inputYAxisEl: any;
    private inputXAxisEl: any;
    private totalCasesMinDefaultValue = 10;
    @observable private tempAltCasesInputValue = 0;
    @observable private tempTotalCasesInputValue = this.totalCasesMin;
    @observable private pngAnchor = '';
    @observable private pdf: {
        anchor: string;
        width: number;
        height: number;
    } = { anchor: '', width: 0, height: 0 };
    @observable private showControls = true; // 9/2018 we will always show controls
    @observable private hideGenomicAlterations = false;
    @observable public yAxis: 'alt-freq' | 'abs-count' = 'alt-freq';
    @observable private xAxis: 'y-axis' | 'x-axis' = 'y-axis';
    @observable public altCasesValue = 0;
    @observable public totalCasesValue = this.totalCasesMin;
    @observable public tempTotalCasesValue = this.totalCasesMin;
    @observable public tempAltCasesValue = 0;
    @observable private viewCountsByCancerSubType = false;

    constructor(props: ICancerSummaryContentProps) {
        super(props);
        makeObservable<
            CancerSummaryContent,
            | 'tempAltCasesInputValue'
            | 'tempTotalCasesInputValue'
            | 'pngAnchor'
            | 'pdf'
            | 'showControls'
            | 'hideGenomicAlterations'
            | 'xAxis'
            | 'viewCountsByCancerSubType'
            | 'totalCasesMax'
            | 'totalCasesMin'
            | 'hasAlterations'
            | 'totalCaseChanged'
            | 'altCaseChanged'
            | 'showStudyTooltipLinks'
            | 'handleTotalInputKeyPress'
            | 'initializeSliderValue'
        >(this);
        this.handleYAxisChange = this.handleYAxisChange.bind(this);
        this.handleXAxisChange = this.handleXAxisChange.bind(this);
        this.handleGenomicCheckboxChange = this.handleGenomicCheckboxChange.bind(
            this
        );
        this.handleCancerTypeCheckboxChange = this.handleCancerTypeCheckboxChange.bind(
            this
        );
        this.handleAltSliderChange = this.handleAltSliderChange.bind(this);
        this.handleTotalSliderChange = this.handleTotalSliderChange.bind(this);
        this.handleAltSliderChangeComplete = this.handleAltSliderChangeComplete.bind(
            this
        );
        this.handleTotalSliderChangeComplete = this.handleTotalSliderChangeComplete.bind(
            this
        );
        this.handleAltInputChange = this.handleAltInputChange.bind(this);
        this.handleAltInputKeyPress = this.handleAltInputKeyPress.bind(this);
        this.handleTotalInputChange = this.handleTotalInputChange.bind(this);
        this.handleTotalInputKeyPress = this.handleTotalInputKeyPress.bind(
            this
        );
        //this.toggleShowControls = this.toggleShowControls.bind(this);
        this.setPngAnchor = this.setPngAnchor.bind(this);
    }

    componentDidMount() {
        // initialize the slider value after min and max computed
        this.initializeSliderValue();
    }

    private chartComponent: any;

    get countsData() {
        return this.props.groupedAlterationData;
    }

    get groupKeysSorted() {
        const { dir, sorter } = this.determineSorterAndDirection();

        const groupKeysSorted = _.chain(this.countsData)
            .keys()
            .orderBy(sorter, [dir])
            .value();
        return groupKeysSorted;
    }

    public getYValue(count: number, total: number) {
        return this.yAxis === 'abs-count' ? count : (count / total) * 100;
    }

    determineSorterAndDirection(): {
        sorter: (item: any) => number | string;
        dir: 'asc' | 'desc';
    } {
        const sortByPercentage = (key: string) => {
            const alterationCountsData: IAlterationData = this.countsData[key];
            return (
                alterationCountsData.alteredSampleCount /
                alterationCountsData.profiledSampleTotal
            );
        };
        const sortByAbsoluteCount = (key: string) => {
            const alterationCountsData: IAlterationData = this.countsData[key];
            return alterationCountsData.alteredSampleCount;
        };
        const sortByLabel = (key: string) => {
            return key;
        };
        let sorter;
        let dir: 'asc' | 'desc';
        if (this.xAxis === 'x-axis') {
            sorter = sortByLabel;
            dir = 'asc' as 'asc';
        } else {
            sorter =
                this.yAxis === 'abs-count'
                    ? sortByAbsoluteCount
                    : sortByPercentage;
            dir = 'desc' as 'desc';
        }
        return { sorter, dir };
    }

    @computed get alterationTypeDataCounts() {
        const scatterPlotData: {
            x: string;
            y: string;
            profiledCount: number;
            notProfiledCount: number;
        }[] = [];
        _.forEach(this.groupKeysSorted, groupKey => {
            const alterationData = this.countsData[groupKey];
            const totalProfiledSamplesCount = _.chain(
                alterationData.profiledSamplesCounts as any
            )
                .values()
                .sum()
                .value();
            const alterationPercentage = calculatePercentage(
                alterationData.alteredSampleCount,
                alterationData.profiledSampleTotal
            );

            let meetsAlterationThreshold;
            if (this.yAxis === 'abs-count') {
                meetsAlterationThreshold =
                    alterationData.alteredSampleCount >= this.tempAltCasesValue;
            } else {
                meetsAlterationThreshold =
                    alterationPercentage >= this.tempAltCasesValue;
            }

            const meetsSampleTotalThreshold =
                alterationData.profiledSampleTotal >= this.totalCasesValue;

            // if we don't meet the threshold set by the user in the custom controls, don't put data in (default 0)
            //hide scatter point if there are no profiled samples in the group
            if (
                totalProfiledSamplesCount > 0 &&
                meetsAlterationThreshold &&
                meetsSampleTotalThreshold
            ) {
                _.forEach(
                    _.keys(AlterationTypeToDataTypeLabel),
                    alterationType => {
                        const profiledCount = (alterationData.profiledSamplesCounts as any)[
                            alterationType
                        ];
                        const notProfiledCount = (alterationData.notProfiledSamplesCounts as any)[
                            alterationType
                        ];
                        if (profiledCount + notProfiledCount > 0) {
                            scatterPlotData.push({
                                x: this.props.labelTransformer
                                    ? this.props.labelTransformer(groupKey)
                                    : groupKey,
                                y:
                                    AlterationTypeToDataTypeLabel[
                                        alterationType
                                    ],
                                profiledCount,
                                notProfiledCount,
                            });
                        }
                    }
                );
            }
        });
        return scatterPlotData;
    }

    @computed
    get chartData(): ICancerSummaryChartData {
        const representedAlterations: {
            [alterationType: string]: boolean;
        } = {};

        let maxPercentage = 0;
        let maxAbsoluteCount = 0;
        let maxSampleCount = 0;

        const labels: string[] = [];

        // for each alteration type stack, we need the collection of different group types
        const retData = _.map(
            OrderedAlterationLabelMap,
            (alterationLabel, alterationKey) => {
                return _.reduce(
                    this.groupKeysSorted,
                    (memo, groupKey) => {
                        // each of these represents a bucket along x-axis (e.g. cancer type or cancer study)
                        const alterationData = this.countsData[groupKey];
                        const totalProfiledSamplesCount = _.chain(
                            alterationData.profiledSamplesCounts as any
                        )
                            .values()
                            .sum()
                            .value();

                        const alterationPercentage = calculatePercentage(
                            alterationData.alteredSampleCount,
                            alterationData.profiledSampleTotal
                        );

                        let meetsAlterationThreshold;

                        if (this.yAxis === 'abs-count') {
                            meetsAlterationThreshold =
                                alterationData.alteredSampleCount >=
                                this.tempAltCasesValue;
                        } else {
                            meetsAlterationThreshold =
                                alterationPercentage >= this.tempAltCasesValue;
                        }

                        const meetsSampleTotalThreshold =
                            alterationData.profiledSampleTotal >=
                            this.totalCasesValue;

                        //hide bar if there are no profiled samples in the group
                        if (
                            totalProfiledSamplesCount > 0 &&
                            meetsAlterationThreshold &&
                            meetsSampleTotalThreshold
                        ) {
                            // if we don't meet the threshold set by the user in the custom controls, don't put data in (default 0)
                            // now we push label into collection
                            const label = this.props.labelTransformer
                                ? this.props.labelTransformer(groupKey)
                                : groupKey;
                            labels.push(label);

                            // update maxes if item exceeds memoized
                            maxPercentage =
                                alterationPercentage > maxPercentage
                                    ? alterationPercentage
                                    : maxPercentage;
                            maxAbsoluteCount =
                                alterationData.alteredSampleCount >
                                maxAbsoluteCount
                                    ? alterationData.alteredSampleCount
                                    : maxAbsoluteCount;
                            maxSampleCount =
                                alterationData.profiledSampleTotal >
                                maxSampleCount
                                    ? alterationData.profiledSampleTotal
                                    : maxSampleCount;

                            const alterationCount = (alterationData.alterationTypeCounts as any)[
                                alterationKey
                            ];

                            // we want to keep track of what alterationTypes are actually
                            // present in this dataset
                            if (alterationCount > 0) {
                                representedAlterations[alterationKey] = true;
                            }

                            memo.push({
                                alterationType: alterationKey,
                                x: label,
                                xKey: groupKey,
                                y: this.getYValue(
                                    alterationCount,
                                    alterationData.profiledSampleTotal
                                ),
                            });
                        }

                        return memo;
                    },
                    [] as {
                        x: string;
                        y: number;
                        xKey: string;
                        alterationType: string;
                    }[]
                );
            }
        );

        return {
            labels: _.uniq(labels),
            data: retData,
            alterationTypeDataCounts: this.alterationTypeDataCounts,
            representedAlterations,
            maxPercentage,
            maxAbsoluteCount,
            maxSampleCount,
        };
    }

    @computed
    public get altCasesMax() {
        return this.yAxis === 'abs-count'
            ? this.chartData.maxAbsoluteCount
            : this.chartData.maxPercentage;
    }

    @computed
    private get totalCasesMax() {
        return this.chartData.maxSampleCount;
    }

    @computed
    private get totalCasesMin() {
        if (this.totalCasesMax > 10) {
            return this.totalCasesMinDefaultValue;
        } else {
            return 0;
        }
    }

    @computed
    private get hasAlterations() {
        return (
            _.reduce(
                this.countsData,
                (count, alterationData: IAlterationData) => {
                    return count + alterationData.alterationTotal;
                },
                0
            ) > 0
        );
    }

    @computed
    private get totalCaseChanged() {
        return this.totalCasesValue > 0;
    }

    @computed
    private get altCaseChanged() {
        return this.altCasesValue > 0;
    }

    /**
     * Only show the links in the tool tip of the plot if:
     * 1. The plot is displaying studies
     * 2. The plot is displaying more than 1 study
     */
    @computed
    private get showStudyTooltipLinks(): boolean {
        return (
            this.props.groupAlterationsBy === 'studyId' &&
            this.chartData.labels.length > 1
        );
    }

    private transformLabel(str: string) {
        if (this.props.labelTransformer) {
            return this.props.labelTransformer(str);
        } else {
            return str;
        }
    }

    public handleYAxisChange(e: any) {
        this.yAxis = e.target.value;
        this.altCasesValue = 0;
        this.handleAltSliderChange(0);
    }

    public handleXAxisChange(e: any) {
        this.xAxis = e.target.value;
    }

    private handleCancerTypeCheckboxChange() {
        this.viewCountsByCancerSubType =
            this.viewCountsByCancerSubType === false;
    }

    private handleGenomicCheckboxChange() {
        this.hideGenomicAlterations = !this.hideGenomicAlterations;
    }

    private handleAltSliderChange(value: number) {
        this.tempAltCasesValue = value;
        this.tempAltCasesInputValue = value;
    }

    private handleTotalSliderChange(value: number) {
        this.tempTotalCasesValue = value;
        this.tempTotalCasesInputValue = value;
    }

    private handleAltInputKeyPress(target: any) {
        if (target.charCode === 13) {
            if (isNaN(this.tempAltCasesInputValue)) {
                this.tempAltCasesInputValue = 0;
                return;
            }
            //removes leading 0s
            this.tempAltCasesInputValue = Number(this.tempAltCasesInputValue);
            this.tempAltCasesValue = this.tempAltCasesInputValue;
            this.handleAltSliderChangeComplete();
        }
    }

    @action
    private handleTotalInputKeyPress(target: any) {
        if (target.charCode === 13) {
            if (isNaN(this.tempTotalCasesInputValue)) {
                this.tempTotalCasesInputValue = this.totalCasesMin;
            } else if (this.tempTotalCasesInputValue > this.totalCasesMax) {
                this.tempTotalCasesInputValue = this.totalCasesMax;
                this.tempTotalCasesValue = this.totalCasesMax;
            } else {
                //removes leading 0s
                this.tempTotalCasesInputValue = Number(
                    this.tempTotalCasesInputValue
                );
                this.tempTotalCasesValue = this.tempTotalCasesInputValue;
            }
            this.handleTotalSliderChangeComplete();
        }
    }

    private handleAltInputChange(e: any) {
        this.tempAltCasesInputValue = e.target.value.replace(/[^0-9\.]/g, '');
    }

    private handleTotalInputChange(e: any) {
        this.tempTotalCasesInputValue = e.target.value.replace(/[^0-9\.]/g, '');
    }

    private handleAltSliderChangeComplete() {
        this.altCasesValue = this.tempAltCasesValue;
    }

    private handleTotalSliderChangeComplete() {
        this.totalCasesValue = this.tempTotalCasesValue;
    }

    @action
    private initializeSliderValue() {
        this.tempAltCasesValue = 0;
        this.tempAltCasesInputValue = 0;
        this.altCasesValue = 0;
        this.tempTotalCasesValue = this.totalCasesMin;
        this.tempTotalCasesInputValue = this.totalCasesMin;
        this.totalCasesValue = this.totalCasesMin;
    }

    public setPngAnchor(href: string) {
        this.pngAnchor = href;
    }

    @computed public get controls() {
        const symbol = this.yAxis === 'alt-freq' ? '%' : '';

        return (
            <div className="cancer-summary--form-controls">
                <table>
                    <tr>
                        <td>
                            <ControlLabel>Y-Axis Value:</ControlLabel>
                        </td>
                        <td className="dashed-border-right">
                            <FormControl
                                componentClass="select"
                                data-test="cancerSummaryYAxisSelect"
                                onChange={this.handleYAxisChange}
                                ref={(el: any) => (this.inputYAxisEl = el)}
                            >
                                <option value="alt-freq">
                                    Alteration Frequency
                                </option>
                                <option value="abs-count">
                                    Absolute Counts
                                </option>
                            </FormControl>
                        </td>
                        <td>
                            <ControlLabel>Min. # Total Cases:</ControlLabel>
                        </td>
                        <td>
                            <div className="slider-holder">
                                <div className="slider custom-labels">
                                    <Slider
                                        min={0}
                                        max={this.totalCasesMax}
                                        value={this.tempTotalCasesValue}
                                        labels={{
                                            0: 0,
                                            [this.totalCasesMax]: this
                                                .totalCasesMax,
                                        }}
                                        onChange={this.handleTotalSliderChange}
                                        onChangeComplete={
                                            this.handleTotalSliderChangeComplete
                                        }
                                    />
                                </div>
                            </div>
                        </td>
                        <td
                            className={classnames(
                                this.totalCaseChanged ? 'highlightInput' : '',
                                'dashed-border-right',
                                'slider-input'
                            )}
                        >
                            <FormControl
                                type="text"
                                value={this.tempTotalCasesInputValue}
                                data-test="sampleTotalThresholdInput"
                                onChange={this.handleTotalInputChange}
                                onKeyPress={this.handleTotalInputKeyPress}
                            />
                        </td>
                        <td>
                            <Checkbox
                                checked={!this.hideGenomicAlterations}
                                onChange={this.handleGenomicCheckboxChange}
                            >
                                Show Genomic Alteration Types
                            </Checkbox>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <ControlLabel>Sort X-Axis By:</ControlLabel>
                        </td>
                        <td className="dashed-border-right">
                            <FormControl
                                componentClass="select"
                                data-test="cancerSummaryXAxisSelect"
                                onChange={this.handleXAxisChange}
                                ref={(el: any) => (this.inputXAxisEl = el)}
                            >
                                <option value="y-axis">Y-Axis Values</option>
                                <option value="x-axis">Alphabetically</option>
                            </FormControl>
                        </td>
                        <td>
                            <ControlLabel>{`Min. ${
                                this.yAxis === 'alt-freq' ? '%' : '#'
                            } Altered Cases:`}</ControlLabel>
                        </td>
                        <td>
                            <div className="slider-holder">
                                <div className="slider custom-labels">
                                    <Slider
                                        min={0}
                                        max={this.altCasesMax}
                                        value={this.tempAltCasesValue}
                                        labels={{
                                            0: 0 + symbol,
                                            [this.altCasesMax]:
                                                Math.ceil(this.altCasesMax) +
                                                symbol,
                                        }}
                                        format={(val: string) => val + symbol}
                                        onChange={this.handleAltSliderChange}
                                        onChangeComplete={
                                            this.handleAltSliderChangeComplete
                                        }
                                    />
                                </div>
                            </div>
                        </td>
                        <td
                            className={classnames(
                                this.altCaseChanged ? 'highlightInput' : '',
                                'dashed-border-right',
                                'slider-input'
                            )}
                        >
                            <FormControl
                                type="text"
                                value={this.tempAltCasesInputValue + symbol}
                                onChange={this.handleAltInputChange}
                                data-test="alterationThresholdInput"
                                onKeyPress={this.handleAltInputKeyPress}
                            />
                        </td>
                    </tr>
                </table>
            </div>
        );
    }

    public render() {
        return (
            <WindowWidthBox offset={60}>
                <If condition={this.hasAlterations}>
                    <Then>
                        <div data-test="cancerTypesSummaryDiv">
                            <div className={'cancer-summary--main-options'}>
                                <ButtonGroup>
                                    {GroupByOptions.map((option, i) => {
                                        return (
                                            <Radio
                                                checked={
                                                    option.value ===
                                                    this.props
                                                        .groupAlterationsBy
                                                }
                                                onChange={e => {
                                                    this.initializeSliderValue();
                                                    this.props.handlePivotChange(
                                                        $(e.target).attr(
                                                            'data-value'
                                                        )
                                                    );
                                                }}
                                                inline
                                                data-value={option.value}
                                            >
                                                {option.label}
                                            </Radio>
                                        );
                                    })}
                                </ButtonGroup>
                            </div>

                            <div
                                className={classnames(
                                    'inlineBlock',
                                    { hidden: !this.showControls },
                                    'cancer-summary-secondary-options'
                                )}
                            >
                                {/*<button type="button" onClick={this.toggleShowControls} className="close">×</button>*/}
                                {this.controls}
                            </div>

                            <div
                                className={classnames(
                                    'alert',
                                    'alert-success',
                                    {
                                        hidden:
                                            !this.totalCaseChanged &&
                                            !this.altCaseChanged,
                                    }
                                )}
                            >
                                <span style={{ verticalAlign: 'middle' }}>
                                    {`${this.chartData.labels.length} of ${
                                        this.groupKeysSorted.length
                                    } categories (${
                                        _.keyBy(GroupByOptions, 'value')[
                                            this.props.groupAlterationsBy
                                        ].label
                                    }) are shown based on filtering.`}
                                </span>
                            </div>
                            <CancerSummaryChart
                                gene={this.props.gene}
                                key={Date.now()}
                                data={this.chartData.data}
                                alterationTypeDataCounts={
                                    this.chartData.alterationTypeDataCounts
                                }
                                ref={(el: any) => (this.chartComponent = el)}
                                countsByGroup={this.countsData}
                                representedAlterations={
                                    this.chartData.representedAlterations
                                }
                                alterationTypes={OrderedAlterationLabelMap}
                                isPercentage={this.yAxis === 'alt-freq'}
                                showLinks={this.showStudyTooltipLinks}
                                colors={alterationToColor}
                                hideGenomicAlterations={
                                    this.hideGenomicAlterations
                                }
                                xLabels={this.chartData.labels}
                                xAxisString={
                                    (
                                        GroupByOptions.find(
                                            o =>
                                                o.value ==
                                                this.props.groupAlterationsBy
                                        ) || {}
                                    ).label || 'Cancer'
                                }
                                handleStudyLinkout={
                                    this.props.handleStudyLinkout!
                                }
                            />
                        </div>
                    </Then>
                    <Else>
                        <div className="alert alert-info">
                            There are no alterations in this gene.
                        </div>
                    </Else>
                </If>
            </WindowWidthBox>
        );
    }
}
