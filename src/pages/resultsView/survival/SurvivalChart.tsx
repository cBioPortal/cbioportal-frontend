import * as React from 'react';
import { observer } from 'mobx-react';
import { PatientSurvival } from '../../../shared/model/PatientSurvival';
import { action, computed, observable, runInAction } from 'mobx';
import Slider from 'react-rangeslider';
import { Popover, Table } from 'react-bootstrap';
import styles from './styles.module.scss';
import './styles.scss';
import { sleep } from '../../../shared/lib/TimeUtils';
import * as _ from 'lodash';
import {
    VictoryChart,
    VictoryContainer,
    VictoryLine,
    VictoryTooltip,
    VictoryAxis,
    VictoryLegend,
    VictoryLabel,
    VictoryScatter,
    VictoryTheme,
    VictoryZoomContainer,
} from 'victory';
import {
    getEstimates,
    getMedian,
    getLineData,
    getScatterData,
    getScatterDataWithOpacity,
    getStats,
    calculateLogRank,
    getDownloadContent,
    convertScatterDataToDownloadData,
    downSampling,
    GroupedScatterData,
    filterScatterData,
    SurvivalPlotFilters,
} from './SurvivalUtil';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { getPatientViewUrl } from '../../../shared/api/urls';
import { DefaultTooltip, DownloadControls } from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import { AnalysisGroup } from '../../studyView/StudyViewUtils';
import { AbstractChart } from '../../studyView/charts/ChartContainer';
import { toSvgDomNodeWithLegend } from '../../studyView/StudyViewUtils';
import classnames from 'classnames';
import { ClinicalAttribute } from 'cbioportal-ts-api-client';
import TruncatedTextWithTooltipSVG from '../../../shared/components/TruncatedTextWithTooltipSVG';
import {
    baseLabelStyles,
    CBIOPORTAL_VICTORY_THEME,
    EditableSpan,
    pluralize,
} from 'cbioportal-frontend-commons';

export enum LegendLocation {
    TOOLTIP = 'tooltip',
    CHART = 'chart',
}

export interface ISurvivalChartProps {
    patientSurvivals: ReadonlyArray<PatientSurvival>;
    patientToAnalysisGroups: { [uniquePatientKey: string]: string[] };
    analysisGroups: ReadonlyArray<AnalysisGroup>; // identified by `value`
    analysisClinicalAttribute?: ClinicalAttribute;
    naPatientsHiddenInSurvival?: boolean;
    toggleSurvivalHideNAPatients?: () => void;
    totalCasesHeader: string;
    statusCasesHeader: string;
    medianMonthsHeader: string;
    title: string;
    xAxisLabel: string;
    yAxisLabel: string;
    yLabelTooltip: string;
    xLabelWithEventTooltip: string;
    xLabelWithoutEventTooltip: string;
    fileName: string;
    showTable?: boolean;
    legendLocation?: LegendLocation;
    showNaPatientsHiddenToggle?: boolean;
    showLogRankPVal?: boolean;
    showDownloadButtons?: boolean;
    showSlider?: boolean;
    styleOpts?: any; // see victory styles, and styleOptsDefaultProps for examples
    className?: string;
    showCurveInTooltip?: boolean;
    legendLabelComponent?: any;
    yAxisTickCount?: number;
    xAxisTickCount?: number;
}

// Start to down sampling when there are more than 1000 dots in the plot.
const SURVIVAL_DOWN_SAMPLING_THRESHOLD = 1000;

@observer
export default class SurvivalChart
    extends React.Component<ISurvivalChartProps, {}>
    implements AbstractChart {
    @observable.ref tooltipModel: any;
    @observable scatterFilter: SurvivalPlotFilters;
    @observable highlightedCurve = '';
    @observable public sliderValue = this.maximumDataMonthValue;
    // The denominator should be determined based on the plot width and height.
    private isTooltipHovered: boolean = false;
    private tooltipCounter: number = 0;
    private svgContainer: any;
    private styleOptsDefaultProps: any = {
        width: 900,
        height: 500,
        padding: { top: 20, bottom: 50, left: 60, right: 20 },
        tooltipXOffset: 20,
        tooltipYOffset: -47,
        axis: {
            x: {
                axisLabel: {
                    padding: 35,
                },
                grid: { opacity: 0 },
            },
            y: {
                axisLabel: {
                    padding: 45,
                    fill: 'black',
                },
                grid: { opacity: 0 },
            },
        },
        pValue: {
            x: 610,
            y: 30,
            textAnchor: 'start',
        },
        legend: {
            x: 600,
            y: 50,
        },
    };

    private events = [
        {
            target: 'data',
            eventHandlers: {
                onMouseOver: () => {
                    return [
                        {
                            target: 'data',
                            mutation: (props: any) => {
                                this.tooltipModel = props;
                                this.tooltipCounter++;
                                return { active: true };
                            },
                        },
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: 'data',
                            mutation: async () => {
                                await sleep(100);
                                if (
                                    !this.isTooltipHovered &&
                                    this.tooltipCounter === 1
                                ) {
                                    this.tooltipModel = null;
                                }
                                this.tooltipCounter--;
                                return { active: false };
                            },
                        },
                    ];
                },
            },
        },
    ];

    public toSVGDOMNode(): SVGElement {
        return toSvgDomNodeWithLegend(this.svgContainer.firstChild, {
            legendGroupSelector: '.survivalChartDownloadLegend',
            selectorToHide: '.survivalChartLegendHideForDownload',
        });
    }

    @computed
    get styleOpts() {
        let configurableOpts: any = _.merge(
            {},
            this.styleOptsDefaultProps,
            this.props.styleOpts
        );
        configurableOpts.padding.right =
            this.props.legendLocation === LegendLocation.CHART
                ? 300
                : configurableOpts.padding.right;
        if (
            !this.props.styleOpts ||
            !this.props.styleOpts.legend ||
            this.props.styleOpts.legend.x === undefined
        ) {
            // only set legend x if its not passed in
            configurableOpts.legend.x =
                configurableOpts.width - configurableOpts.padding.right;
        }
        return configurableOpts;
    }

    @computed
    get downSamplingDenominators() {
        return {
            x:
                this.styleOpts.width -
                this.styleOpts.padding.left -
                this.styleOpts.padding.right,
            y:
                this.styleOpts.height -
                this.styleOpts.padding.top -
                this.styleOpts.padding.bottom,
        };
    }

    @computed get sortedGroupedSurvivals(): {
        [groupValue: string]: PatientSurvival[];
    } {
        const patientToAnalysisGroups = this.props.patientToAnalysisGroups;
        const survivalsByAnalysisGroup = _.reduce(
            this.props.patientSurvivals,
            (map, nextSurv) => {
                if (nextSurv.uniquePatientKey in patientToAnalysisGroups) {
                    // only include this data if theres an analysis group (curve) to put it in
                    const groups =
                        patientToAnalysisGroups[nextSurv.uniquePatientKey];
                    groups.forEach(group => {
                        map[group] = map[group] || [];
                        map[group].push(nextSurv);
                    });
                }
                return map;
            },
            {} as { [groupValue: string]: PatientSurvival[] }
        );

        return _.mapValues(survivalsByAnalysisGroup, survivals =>
            survivals.sort((a, b) => a.months - b.months)
        );
    }

    @computed get estimates(): { [groupValue: string]: number[] } {
        return _.mapValues(this.sortedGroupedSurvivals, survivals =>
            getEstimates(survivals)
        );
    }

    @computed
    get unfilteredScatterData(): GroupedScatterData {
        // map through groups and generate plot data for each
        return _.mapValues(this.sortedGroupedSurvivals, (survivals, group) => {
            const estimates = this.estimates[group];
            const groupName = this.analysisGroupsMap[group].name;
            return {
                numOfCases: survivals.length,
                line: getLineData(survivals, estimates),
                scatterWithOpacity: getScatterDataWithOpacity(
                    survivals,
                    estimates,
                    groupName
                ),
                scatter: getScatterData(survivals, estimates, groupName),
            };
        });
    }

    // Only recalculate the scatter data based on the plot filter.
    // The filter is only available when user zooms in the plot.
    @computed
    get scatterData(): GroupedScatterData {
        return filterScatterData(
            this.unfilteredScatterData,
            this.scatterFilter,
            {
                xDenominator: this.downSamplingDenominators.x,
                yDenominator: this.downSamplingDenominators.y,
                threshold: SURVIVAL_DOWN_SAMPLING_THRESHOLD,
            }
        );
    }

    public static defaultProps: Partial<ISurvivalChartProps> = {
        showTable: true,
        showSlider: true,
        legendLocation: LegendLocation.CHART,
        showLogRankPVal: true,
        showNaPatientsHiddenToggle: false,
        showDownloadButtons: true,
        yAxisTickCount: 11,
    };

    constructor(props: ISurvivalChartProps) {
        super(props);
        this.tooltipMouseEnter = this.tooltipMouseEnter.bind(this);
        this.tooltipMouseLeave = this.tooltipMouseLeave.bind(this);
    }

    @computed get analysisGroupsMap() {
        return _.keyBy(this.props.analysisGroups, g => g.value);
    }

    @computed get logRankTestPVal(): number | null {
        if (this.analysisGroupsWithData.length === 2) {
            // log rank test only makes sense with two groups
            return calculateLogRank(
                this.sortedGroupedSurvivals[
                    this.analysisGroupsWithData[0].value
                ],
                this.sortedGroupedSurvivals[
                    this.analysisGroupsWithData[1].value
                ]
            );
        } else {
            return null;
        }
    }

    @computed get victoryLegendData() {
        const data: any = [];
        if (this.props.legendLocation === LegendLocation.CHART) {
            for (const grp of this.analysisGroupsWithData) {
                data.push({
                    name: grp.legendText || grp.name || grp.value,
                    symbol: {
                        fill: grp.color,
                        strokeOpacity: 0,
                        type: 'square',
                        size: 6,
                    },
                });
            }
        }
        return data;
    }

    private get pValueText() {
        if (this.props.showLogRankPVal && this.logRankTestPVal !== null) {
            return (
                <VictoryLabel
                    x={this.styleOpts.pValue.x}
                    y={this.styleOpts.pValue.y}
                    style={baseLabelStyles}
                    textAnchor={this.styleOpts.pValue.textAnchor}
                    text={`Logrank Test P-Value: ${toConditionalPrecision(
                        this.logRankTestPVal,
                        3,
                        0.01
                    )}`}
                />
            );
        } else {
            return null;
        }
    }

    @computed get legendDataForDownload() {
        const data: any = this.analysisGroupsWithData.map(grp => ({
            name: !!grp.name ? grp.name : grp.value,
            symbol: {
                fill: grp.color,
                strokeOpacity: 0,
                type: 'square',
                size: 6,
            },
        }));

        // add an indicator in case NA is excluded
        if (this.props.naPatientsHiddenInSurvival) {
            data.push({
                name:
                    '* Patients with NA for any of the selected attributes are excluded',
                symbol: { opacity: 0 },
            });
        }

        return data;
    }

    private tooltipMouseEnter(): void {
        this.isTooltipHovered = true;
    }

    private tooltipMouseLeave(): void {
        this.isTooltipHovered = false;
        this.tooltipModel = null;
    }

    @autobind
    private getSvg() {
        return this.toSVGDOMNode();
    }

    @autobind
    private getData() {
        const data = [];
        for (const group of this.analysisGroupsWithData) {
            data.push({
                scatterData: getScatterData(
                    this.sortedGroupedSurvivals[group.value],
                    this.estimates[group.value],
                    group.value
                ),
                title: group.name !== undefined ? group.name : group.value,
            });
        }
        return getDownloadContent(data, this.props.title);
    }

    @autobind
    private hoverCircleFillOpacity(datum: any, active: any) {
        if (
            active ||
            (this.isTooltipHovered &&
                this.tooltipModel &&
                this.tooltipModel.datum.studyId === datum.studyId &&
                this.tooltipModel.datum.patientId === datum.patientId)
        ) {
            return 0.3;
        } else {
            return 0;
        }
    }

    @computed get analysisGroupsWithData() {
        let analysisGroups = this.props.analysisGroups;
        // filter out groups with no data
        analysisGroups = analysisGroups.filter(
            grp =>
                grp.value in this.scatterData &&
                this.scatterData[grp.value].numOfCases > 0
        );
        return analysisGroups;
    }

    @computed get scattersAndLines() {
        // sort highlighted group to the end to show its elements on top
        let analysisGroupsWithData = this.analysisGroupsWithData;
        analysisGroupsWithData = _.sortBy(analysisGroupsWithData, grp =>
            this.highlightedCurve === grp.value ? 1 : 0
        );

        const lineElements = analysisGroupsWithData.map(grp => (
            <VictoryLine
                key={grp.value}
                interpolation="stepAfter"
                data={this.scatterData[grp.value].line}
                style={{
                    data: {
                        stroke: grp.color,
                        strokeWidth:
                            this.highlightedCurve === grp.value ? 4 : 1,
                        fill: '#000000',
                        fillOpacity: 0,
                    },
                }}
            />
        ));
        const scatterWithOpacityElements = analysisGroupsWithData.map(grp => (
            <VictoryScatter
                key={grp.value}
                data={this.scatterData[grp.value].scatterWithOpacity}
                symbol="plus"
                style={{
                    data: { fill: grp.color, opacity: (d: any) => d.opacity },
                }}
                size={3}
            />
        ));
        const scatterElements = analysisGroupsWithData.map(grp => (
            <VictoryScatter
                key={grp.value}
                data={this.scatterData[grp.value].scatter}
                symbol="circle"
                style={{
                    data: {
                        fill: grp.color,
                        fillOpacity: this.hoverCircleFillOpacity,
                    },
                }}
                size={10}
                events={this.events}
            />
        ));
        return lineElements
            .concat(scatterWithOpacityElements)
            .concat(scatterElements);
    }

    @computed get legendForDownload() {
        // override the legend style without mutating the actual theme object
        const theme = _.cloneDeep(CBIOPORTAL_VICTORY_THEME);
        theme.legend.style.data = {
            type: 'square',
            size: 5,
            strokeWidth: 0,
            stroke: 'black',
        };

        return (
            <VictoryLegend
                x={0}
                y={this.styleOpts.height + 1}
                style={{
                    ...theme.legend.style,
                    title: { fontWeight: 'bold' },
                }}
                title={this.props.title}
                rowGutter={-10}
                data={this.legendDataForDownload}
                groupComponent={<g className="survivalChartDownloadLegend" />}
            />
        );
    }

    @computed
    get xAxisTickCount() {
        return (
            this.props.xAxisTickCount ||
            this.getAxisTickCount(
                this.showLegend ? this.styleOpts.legend.x : this.styleOpts.width
            )
        );
    }

    getAxisTickCount(size: number) {
        return Math.ceil(size / 200) * 5;
    }

    @computed
    get showLegend() {
        return this.victoryLegendData.length > 0;
    }

    @computed get maximumDataMonthValue() {
        return _.chain(this.sortedGroupedSurvivals)
            .map(survivals => survivals[survivals.length - 1].months)
            .max()
            .ceil()
            .value();
    }

    @autobind
    @action
    onSliderChange(value: number) {
        this.sliderValue = value;
    }

    @autobind
    @action
    onSliderTextChange(text: string) {
        this.sliderValue = Number.parseFloat(text);
    }

    @computed
    get chart() {
        return (
            <div className={this.props.className} data-test={'SurvivalChart'}>
                {this.props.showDownloadButtons && (
                    <DownloadControls
                        dontFade={true}
                        filename={this.props.fileName}
                        buttons={['SVG', 'PNG', 'PDF', 'Data']}
                        getSvg={this.getSvg}
                        getData={this.getData}
                        style={{ position: 'absolute', zIndex: 10, right: 10 }}
                        type="button"
                    />
                )}

                {this.props.showSlider && (
                    <div
                        className="small"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: 60,
                        }}
                    >
                        <span>X-Axis Max:</span>
                        <div
                            className={'RangeSliderContainer'}
                            style={{
                                width: 300,
                                marginLeft: 10,
                                marginRight: 10,
                            }}
                        >
                            <Slider
                                min={0}
                                max={this.maximumDataMonthValue}
                                value={this.sliderValue}
                                onChange={this.onSliderChange}
                                tooltip={false}
                                step={1}
                            />
                        </div>
                        <EditableSpan
                            className={styles['XmaxNumberInput']}
                            value={this.sliderValue.toString()}
                            setValue={this.onSliderTextChange}
                            numericOnly={true}
                        />
                        <span>
                            {pluralize('Month', this.sliderValue)} Survival
                        </span>
                    </div>
                )}

                <VictoryChart
                    containerComponent={
                        <VictoryZoomContainer
                            responsive={false}
                            disable={true}
                            zoomDomain={
                                this.props.showSlider
                                    ? { x: [0, this.sliderValue] }
                                    : undefined
                            }
                            onZoomDomainChange={_.debounce((domain: any) => {
                                this.scatterFilter = domain as SurvivalPlotFilters;
                            }, 1000)}
                            containerRef={(ref: any) =>
                                (this.svgContainer = ref)
                            }
                        />
                    }
                    height={this.styleOpts.height}
                    width={this.styleOpts.width}
                    padding={this.styleOpts.padding}
                    theme={CBIOPORTAL_VICTORY_THEME}
                    domainPadding={{ x: [10, 50], y: [20, 20] }}
                >
                    <VictoryAxis
                        style={this.styleOpts.axis.x}
                        crossAxis={false}
                        tickCount={this.xAxisTickCount}
                        label={this.props.xAxisLabel}
                    />
                    <VictoryAxis
                        label={this.props.yAxisLabel}
                        dependentAxis={true}
                        tickFormat={(t: any) => `${t}%`}
                        tickCount={this.props.yAxisTickCount}
                        style={this.styleOpts.axis.y}
                        domain={[0, 100]}
                        crossAxis={false}
                    />
                    {this.scattersAndLines}
                    {this.showLegend && (
                        <VictoryLegend
                            x={this.styleOpts.legend.x}
                            y={this.styleOpts.legend.y}
                            data={this.victoryLegendData}
                            labelComponent={
                                this.props.legendLabelComponent || (
                                    <TruncatedTextWithTooltipSVG
                                        dy="0.3em"
                                        maxWidth={256}
                                    />
                                )
                            }
                            groupComponent={
                                <g className="survivalChartLegendHideForDownload" />
                            }
                        />
                    )}
                    {this.legendForDownload}
                    {this.pValueText}
                </VictoryChart>
            </div>
        );
    }

    @computed get chartTooltip() {
        return (
            <div style={{ maxWidth: 250 }}>
                {this.analysisGroupsWithData.map(group => (
                    <span
                        key={group.value}
                        style={{
                            display: 'inline-block',
                            marginRight: 12,
                            fontWeight:
                                this.highlightedCurve === group.value
                                    ? 'bold'
                                    : 'initial',
                            cursor: 'pointer',
                        }}
                        onClick={() => {
                            this.highlightedCurve =
                                this.highlightedCurve === group.value
                                    ? ''
                                    : group.value;
                        }}
                    >
                        <div
                            style={{
                                width: 10,
                                height: 10,
                                display: 'inline-block',
                                backgroundColor: group.color,
                                marginRight: 5,
                            }}
                        />
                        {!!group.name ? group.name : group.value}
                    </span>
                ))}
                {this.props.showNaPatientsHiddenToggle && (
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={this.props.naPatientsHiddenInSurvival}
                                onClick={
                                    this.props.toggleSurvivalHideNAPatients
                                }
                            />{' '}
                            Exclude patients with NA for any of the selected
                            attributes.
                        </label>
                    </div>
                )}
            </div>
        );
    }

    @computed get tableRows() {
        return this.props.analysisGroups.map(grp => (
            <tr>
                <td>{!!grp.name ? grp.name : grp.value}</td>
                {getStats(
                    this.sortedGroupedSurvivals[grp.value],
                    this.estimates[grp.value]
                ).map(stat => (
                    <td>
                        <b>{stat}</b>
                    </td>
                ))}
            </tr>
        ));
    }

    public render() {
        if (this.props.patientSurvivals.length === 0) {
            return <div className={'alert alert-info'}>No data to plot.</div>;
        } else {
            return (
                <div style={{ position: 'relative' }}>
                    {this.props.legendLocation === LegendLocation.TOOLTIP ? (
                        <DefaultTooltip
                            mouseLeaveDelay={0.2}
                            placement="rightBottom"
                            overlay={this.chartTooltip}
                        >
                            {this.chart}
                        </DefaultTooltip>
                    ) : (
                        this.chart
                    )}
                    {this.tooltipModel && (
                        <Popover
                            arrowOffsetTop={56}
                            className={classnames(
                                'cbioportal-frontend',
                                'cbioTooltip',
                                styles.Tooltip
                            )}
                            positionLeft={
                                this.tooltipModel.x +
                                this.styleOpts.tooltipXOffset
                            }
                            {...{ container: this }}
                            positionTop={
                                this.tooltipModel.y +
                                this.styleOpts.tooltipYOffset
                            }
                            onMouseEnter={this.tooltipMouseEnter}
                            onMouseLeave={this.tooltipMouseLeave}
                        >
                            <div>
                                Patient ID:{' '}
                                <a
                                    href={getPatientViewUrl(
                                        this.tooltipModel.datum.studyId,
                                        this.tooltipModel.datum.patientId
                                    )}
                                    target="_blank"
                                >
                                    {this.tooltipModel.datum.patientId}
                                </a>
                                <br />
                                {!!this.props.showCurveInTooltip && [
                                    `Curve: ${this.tooltipModel.datum.group}`,
                                    <br />,
                                ]}
                                {this.props.yLabelTooltip}:{' '}
                                {this.tooltipModel.datum.y.toFixed(2)}%<br />
                                {this.tooltipModel.datum.status
                                    ? this.props.xLabelWithEventTooltip
                                    : this.props.xLabelWithoutEventTooltip}
                                : {this.tooltipModel.datum.x.toFixed(2)} months{' '}
                                {this.tooltipModel.datum.status
                                    ? ''
                                    : '(censored)'}
                                <br />
                                {this.props.analysisClinicalAttribute && (
                                    <span>
                                        {
                                            this.props.analysisClinicalAttribute
                                                .displayName
                                        }
                                        :{' '}
                                        {
                                            this.props.patientToAnalysisGroups[
                                                this.tooltipModel.datum
                                                    .uniquePatientKey
                                            ]
                                        }
                                    </span>
                                )}
                            </div>
                        </Popover>
                    )}
                    {this.props.showTable && (
                        <table
                            className="table table-striped"
                            style={{ marginTop: 20, width: '100%' }}
                        >
                            <tbody>
                                <tr>
                                    <td />
                                    <td>{this.props.totalCasesHeader}</td>
                                    <td>{this.props.statusCasesHeader}</td>
                                    <td>{this.props.medianMonthsHeader}</td>
                                </tr>
                                {this.tableRows}
                            </tbody>
                        </table>
                    )}
                </div>
            );
        }
    }
}
