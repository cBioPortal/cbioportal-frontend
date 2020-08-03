import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { action, autorun, computed, IReactionDisposer, observable } from 'mobx';
import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import ClinicalDataEnrichmentsTable from './ClinicalDataEnrichmentsTable';
import _ from 'lodash';
import { DownloadControls, remoteData } from 'cbioportal-frontend-commons';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import client from 'shared/api/cbioportalClientInstance';
import {
    basicAppearance,
    boxPlotTooltip,
    IAxisData,
    IAxisLogScaleParams,
    IBoxScatterPlotPoint,
    INumberAxisData,
    isNumberData,
    isStringData,
    IStringAxisData,
    makeBoxScatterPlotData,
} from 'pages/resultsView/plots/PlotsTabUtils';
import ScrollBar from 'shared/components/Scrollbar/ScrollBar';
import BoxScatterPlot, {
    IBoxScatterPlotData,
} from 'shared/components/plots/BoxScatterPlot';
import { scatterPlotSize } from 'shared/components/plots/PlotUtils';
import {
    CLINICAL_TAB_NOT_ENOUGH_GROUPS_MSG,
    ClinicalDataEnrichmentWithQ,
} from './GroupComparisonUtils';
import MultipleCategoryBarPlot from '../../shared/components/plots/MultipleCategoryBarPlot';
import ReactSelect from 'react-select1';
import { MakeMobxView } from 'shared/components/MobxView';
import OverlapExclusionIndicator from './OverlapExclusionIndicator';
import { RESERVED_CLINICAL_VALUE_COLORS } from '../../shared/lib/Colors';
import ErrorMessage from '../../shared/components/ErrorMessage';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { Sample } from 'cbioportal-ts-api-client';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';

export interface IClinicalDataProps {
    store: ComparisonStore;
}

const SVG_ID = 'clinical-plot-svg';

class PlotsTabBoxPlot extends BoxScatterPlot<IBoxScatterPlotPoint> {}

export class ClinicalDataEnrichmentStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    ClinicalDataEnrichmentWithQ
> {
    private reactionDisposer: IReactionDisposer;

    constructor(
        getData: () => ClinicalDataEnrichmentWithQ[],
        getHighlighted: () => ClinicalDataEnrichmentWithQ | undefined,
        public setHighlighted: (c: ClinicalDataEnrichmentWithQ) => void
    ) {
        super(getData);
        this.dataHighlighter = (d: ClinicalDataEnrichmentWithQ) => {
            const highlighted = getHighlighted();
            return !!(
                highlighted &&
                d.clinicalAttribute.clinicalAttributeId ===
                    highlighted.clinicalAttribute.clinicalAttributeId
            );
        };

        this.reactionDisposer = autorun(() => {
            if (
                this.sortMetric &&
                this.sortedFilteredData.length > 0 &&
                !getHighlighted()
            ) {
                this.setHighlighted(this.sortedFilteredData[0]);
            }
        });
    }

    public destroy() {
        this.reactionDisposer();
    }
}

export enum PlotType {
    Bar = 'Bar',
    StackedBar = 'StackedBar',
    PercentageStackedBar = 'PercentageStackedBar',
}

export const plotTypeOptions = [
    { value: PlotType.Bar, label: 'Bar chart' },
    { value: PlotType.StackedBar, label: 'Stacked bar chart' },
    { value: PlotType.PercentageStackedBar, label: '100% stacked bar chart' },
];

@observer
export default class ClinicalData extends React.Component<
    IClinicalDataProps,
    {}
> {
    @observable.ref highlightedRow: ClinicalDataEnrichmentWithQ | undefined;

    private scrollPane: HTMLDivElement;

    readonly tabUI = MakeMobxView({
        await: () => {
            const ret: any[] = [this.props.store.activeGroups];
            if (
                this.props.store.activeGroups.isComplete &&
                this.props.store.activeGroups.result.length < 2
            ) {
                // dont bother loading data for and computing clinical tab if not enough groups for it
            } else {
                ret.push(this.overlapUI);
            }
            return ret;
        },
        render: () => {
            let content: any = [];
            if (this.props.store.activeGroups.result!.length < 2) {
                content.push(
                    <span>
                        {CLINICAL_TAB_NOT_ENOUGH_GROUPS_MSG(
                            this.props.store._activeGroupsNotOverlapRemoved
                                .result!.length
                        )}
                    </span>
                );
            } else {
                content.push(
                    <OverlapExclusionIndicator store={this.props.store} />
                );
                content.push(this.overlapUI.component);
            }
            return (
                <div data-test="ComparisonPageClinicalTabDiv">{content}</div>
            );
        },
        renderPending: () => (
            <LoadingIndicator isLoading={true} center={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    readonly overlapUI = MakeMobxView({
        await: () => [this.props.store.clinicalDataEnrichmentsWithQValues],
        render: () => {
            return (
                <div className="clearfix" style={{ display: 'flex' }}>
                    <div style={{ width: '600px' }}>
                        <ClinicalDataEnrichmentsTable
                            dataStore={this.tableDataStore}
                        />
                    </div>
                    <div style={{ marginLeft: '10px' }}>
                        {this.getUtilitiesMenu}
                        {this.plot}
                    </div>
                </div>
            );
        },
        renderPending: () => (
            <LoadingIndicator
                isLoading={true}
                centerRelativeToContainer={true}
                size="big"
            />
        ),
        renderError: () => <ErrorMessage />,
    });

    @autobind
    private getScrollPane() {
        return this.scrollPane;
    }

    private tableDataStore = new ClinicalDataEnrichmentStore(
        () => {
            return this.props.store.clinicalDataEnrichmentsWithQValues.result;
        },
        () => {
            return this.highlightedRow;
        },
        (c: ClinicalDataEnrichmentWithQ) => {
            this.highlightedRow = c;
            this.swapAxes = false;
            this.logScale = false;
        }
    );

    @computed get showLogScaleControls() {
        return (
            this.highlightedRow!.clinicalAttribute.datatype.toLowerCase() ===
            'number'
        );
    }

    @observable private logScale = false;
    @observable logScaleFunction: IAxisLogScaleParams | undefined;
    @observable swapAxes = false;
    @observable horizontalBars = false;

    @autobind
    @action
    private onClickLogScale() {
        this.logScale = !this.logScale;
        if (this.logScale) {
            const MIN_LOG_ARGUMENT = 0.01;
            this.logScaleFunction = {
                label: 'log2',
                fLogScale: (x: number, offset: number) =>
                    Math.log2(Math.max(x, MIN_LOG_ARGUMENT)),
                fInvLogScale: (x: number) => Math.pow(2, x),
            };
        } else {
            this.logScaleFunction = undefined;
        }
    }

    @autobind
    @action
    private onClickSwapAxes() {
        this.swapAxes = !this.swapAxes;
    }

    @autobind
    @action
    private onClickhorizontalBars() {
        this.horizontalBars = !this.horizontalBars;
    }

    private readonly clinicalDataPromise = remoteData({
        await: () => [
            this.props.store.patientKeyToSamples,
            this.props.store.activeGroups,
        ],
        invoke: async () => {
            const axisData: IAxisData = { data: [], datatype: 'string' };
            if (this.highlightedRow) {
                let attribute = this.highlightedRow!.clinicalAttribute;
                let patientKeyToSamples = this.props.store.patientKeyToSamples
                    .result!;

                let sampleIdentifiers = _.flatMap(
                    this.props.store.activeGroups.result,
                    group =>
                        _.flatMap(group.studies, study => {
                            return study.samples.map(sample => ({
                                studyId: study.id,
                                entityId: sample,
                            }));
                        })
                );

                let patientidentifiers = _.flatMap(
                    this.props.store.activeGroups.result,
                    group =>
                        _.flatMap(group.studies, study => {
                            return study.patients.map(patient => ({
                                studyId: study.id,
                                entityId: patient,
                            }));
                        })
                );

                let clinicalData = await client.fetchClinicalDataUsingPOST({
                    clinicalDataType: attribute.patientAttribute
                        ? 'PATIENT'
                        : 'SAMPLE',
                    clinicalDataMultiStudyFilter: {
                        attributeIds: [attribute.clinicalAttributeId],
                        identifiers: attribute.patientAttribute
                            ? patientidentifiers
                            : sampleIdentifiers,
                    },
                });

                let normalizedCategory: { [id: string]: string } = {};
                for (const d of clinicalData) {
                    const lowerCaseValue = d.value.toLowerCase();
                    if (normalizedCategory[lowerCaseValue] === undefined) {
                        //consider first value as category value
                        normalizedCategory[lowerCaseValue] = d.value;
                    }
                }

                axisData.datatype = attribute.datatype.toLowerCase();
                const axisData_Data = axisData.data;
                if (attribute.patientAttribute) {
                    // produce sample data from patient clinical data
                    for (const d of clinicalData) {
                        const samples = patientKeyToSamples[d.uniquePatientKey];
                        for (const sample of samples) {
                            axisData_Data.push({
                                uniqueSampleKey: sample.uniqueSampleKey,
                                value:
                                    normalizedCategory[d.value.toLowerCase()],
                            });
                        }
                    }
                } else {
                    // produce sample data from sample clinical data
                    for (const d of clinicalData) {
                        axisData_Data.push({
                            uniqueSampleKey: d.uniqueSampleKey,
                            value: normalizedCategory[d.value.toLowerCase()],
                        });
                    }
                }
                if (attribute.datatype.toLowerCase() === 'number') {
                    for (const d of axisData_Data) {
                        d.value = parseFloat(d.value as string); // we know its a string bc all clinical data comes back as string
                    }
                }
            }
            return Promise.resolve(axisData);
        },
    });

    private readonly groupMembershipAxisData = remoteData({
        await: () => [
            this.props.store.sampleMap,
            this.props.store.activeGroups,
        ],
        invoke: async () => {
            const categoryOrder = _.map(
                this.props.store.activeGroups.result!,
                group => group.nameWithOrdinal
            );
            const axisData = {
                data: [],
                datatype: 'string',
                categoryOrder,
            } as IStringAxisData;
            const sampleSet =
                this.props.store.sampleMap.result ||
                new ComplexKeyMap<Sample>();

            const sampleKeyToGroupSampleData = _.reduce(
                this.props.store.activeGroups.result,
                (acc, group) => {
                    group.studies.forEach(studyEntry => {
                        studyEntry.samples.forEach(sampleId => {
                            if (
                                sampleSet.has({
                                    studyId: studyEntry.id,
                                    sampleId,
                                })
                            ) {
                                const uniqueSampleKey = sampleSet.get({
                                    studyId: studyEntry.id,
                                    sampleId,
                                })!.uniqueSampleKey;
                                if (acc[uniqueSampleKey] === undefined) {
                                    acc[uniqueSampleKey] = {
                                        uniqueSampleKey,
                                        value: [],
                                    };
                                }
                                acc[uniqueSampleKey].value.push(
                                    group.nameWithOrdinal
                                );
                            }
                        });
                    });
                    return acc;
                },
                {} as {
                    [uniqueSampleKey: string]: {
                        uniqueSampleKey: string;
                        value: string[];
                    };
                }
            );

            axisData.data = _.values(sampleKeyToGroupSampleData);
            return Promise.resolve(axisData);
        },
    });

    @computed get vertAxisDataPromise() {
        return this.swapAxes
            ? this.groupMembershipAxisData
            : this.clinicalDataPromise;
    }

    @computed get horzAxisDataPromise() {
        return this.swapAxes
            ? this.clinicalDataPromise
            : this.groupMembershipAxisData;
    }

    @computed get horzLabel() {
        return this.swapAxes
            ? `${this.highlightedRow!.clinicalAttribute.displayName}${
                  this.logScale ? ' (log2)' : ''
              }`
            : `Group`;
    }

    @computed get vertLabel() {
        return this.swapAxes
            ? 'Group'
            : `${this.highlightedRow!.clinicalAttribute.displayName}${
                  this.logScale ? ' (log2)' : ''
              }`;
    }

    @autobind
    private getSvg() {
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    @autobind
    private assignScrollPaneRef(el: HTMLDivElement) {
        this.scrollPane = el;
    }

    private readonly boxPlotData = remoteData<{
        horizontal: boolean;
        data: IBoxScatterPlotData<IBoxScatterPlotPoint>[];
    }>({
        await: () => [
            this.horzAxisDataPromise,
            this.vertAxisDataPromise,
            this.props.store.sampleKeyToSample,
        ],
        invoke: () => {
            const horzAxisData = this.horzAxisDataPromise.result;
            const vertAxisData = this.vertAxisDataPromise.result;
            if (!horzAxisData || !vertAxisData) {
                return new Promise<any>(() => 0); // dont resolve
            } else {
                let categoryData: IStringAxisData;
                let numberData: INumberAxisData;
                let horizontal: boolean;
                if (isNumberData(horzAxisData) && isStringData(vertAxisData)) {
                    categoryData = vertAxisData;
                    numberData = horzAxisData;
                    horizontal = true;
                } else if (
                    isStringData(horzAxisData) &&
                    isNumberData(vertAxisData)
                ) {
                    categoryData = horzAxisData;
                    numberData = vertAxisData;
                    horizontal = false;
                } else {
                    return Promise.resolve({ horizontal: false, data: [] });
                }
                return Promise.resolve({
                    horizontal,
                    data: makeBoxScatterPlotData(
                        categoryData,
                        numberData,
                        this.props.store.sampleKeyToSample.result!,
                        {},
                        undefined,
                        undefined
                    ),
                });
            }
        },
    });

    @computed get scatterPlotTooltip() {
        return (d: IBoxScatterPlotPoint) => {
            let content = <span></span>;
            if (this.boxPlotData.isComplete) {
                content = boxPlotTooltip(
                    d,
                    this.props.store.activeStudyIdToStudy.result!,
                    this.boxPlotData.result.horizontal
                );
            }
            return content;
        };
    }

    @computed get boxPlotTooltip() {
        return (d: any) => {
            return (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th colSpan={2}>
                                {
                                    this.boxPlotData.result!.data[d.eventKey]
                                        .label
                                }
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Maximum</td>
                            <td>{d.max}</td>
                        </tr>
                        <tr>
                            <td>75% (q3)</td>
                            <td>{d.q3}</td>
                        </tr>
                        <tr>
                            <td>Median</td>
                            <td>{d.median}</td>
                        </tr>
                        <tr>
                            <td>25% (q1)</td>
                            <td>{d.q1}</td>
                        </tr>
                        <tr>
                            <td>Minimum</td>
                            <td>{d.min}</td>
                        </tr>
                    </tbody>
                </table>
            );
        };
    }

    @computed get categoryToColor() {
        //add group colors and reserved category colors
        return _.reduce(
            this.props.store.uidToGroup.result!,
            (acc, next) => {
                acc[next.nameWithOrdinal] = next.color;
                return acc;
            },
            RESERVED_CLINICAL_VALUE_COLORS
        );
    }

    @observable plotType: PlotType = PlotType.PercentageStackedBar;

    @autobind
    @action
    private onPlotTypeSelect(option: any) {
        this.plotType = option.value;
    }

    @computed private get getUtilitiesMenu() {
        if (!this.highlightedRow) {
            return <span></span>;
        }
        return (
            <div style={{ marginBottom: '10px' }}>
                {!this.showLogScaleControls && (
                    <div
                        className="form-group"
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <label>Plot Type</label>
                        <div
                            style={{ width: 240, marginLeft: 5 }}
                            data-test="plotTypeSelector"
                        >
                            <ReactSelect
                                name="discrete-vs-discrete-plot-type"
                                value={this.plotType}
                                onChange={this.onPlotTypeSelect}
                                options={plotTypeOptions}
                                clearable={false}
                                searchable={true}
                            />
                        </div>
                    </div>
                )}
                <div>
                    <label className="checkbox-inline">
                        <input
                            type="checkbox"
                            checked={this.swapAxes}
                            onClick={this.onClickSwapAxes}
                            data-test="SwapAxes"
                        />
                        Swap Axes
                    </label>
                    {!this.showLogScaleControls && (
                        <label className="checkbox-inline">
                            <input
                                type="checkbox"
                                name="horizontalBars"
                                checked={this.horizontalBars}
                                onClick={this.onClickhorizontalBars}
                                data-test="HorizontalBars"
                            />
                            Horizontal Bars
                        </label>
                    )}
                    {this.showLogScaleControls && (
                        <label className="checkbox-inline">
                            <input
                                type="checkbox"
                                checked={this.logScale}
                                onClick={this.onClickLogScale}
                                data-test="logScale"
                            />
                            Log Scale
                        </label>
                    )}
                </div>
            </div>
        );
    }

    @computed get plot() {
        if (this.tableDataStore.allData.length === 0 || !this.highlightedRow) {
            return <span></span>;
        }
        const promises = [this.horzAxisDataPromise, this.vertAxisDataPromise];
        const groupStatus = getRemoteDataGroupStatus(...promises);
        const isPercentage = this.plotType === PlotType.PercentageStackedBar;
        const isStacked = isPercentage || this.plotType === PlotType.StackedBar;
        switch (groupStatus) {
            case 'pending':
                return (
                    <LoadingIndicator
                        center={true}
                        isLoading={true}
                        size={'big'}
                    />
                );
            case 'error':
                return <span>Error loading plot data.</span>;
            default: {
                if (
                    !this.horzAxisDataPromise.result ||
                    !this.vertAxisDataPromise.result
                ) {
                    return <span>Error loading plot data.</span>;
                }

                let plotElt: any = null;
                if (
                    this.highlightedRow!.clinicalAttribute.datatype.toLowerCase() ===
                    'number'
                ) {
                    if (this.boxPlotData.isComplete) {
                        plotElt = (
                            <PlotsTabBoxPlot
                                svgId={SVG_ID}
                                domainPadding={75}
                                boxWidth={
                                    this.boxPlotData.result.data.length > 7
                                        ? 30
                                        : 60
                                }
                                axisLabelX={this.horzLabel}
                                axisLabelY={this.vertLabel}
                                data={this.boxPlotData.result.data}
                                chartBase={500}
                                scatterPlotTooltip={this.scatterPlotTooltip}
                                boxPlotTooltip={this.boxPlotTooltip}
                                horizontal={this.boxPlotData.result.horizontal}
                                logScale={this.logScaleFunction}
                                size={scatterPlotSize}
                                fill={basicAppearance.fill}
                                stroke={basicAppearance.stroke}
                                strokeOpacity={basicAppearance.strokeOpacity}
                                symbol="circle"
                                useLogSpaceTicks={true}
                                legendLocationWidthThreshold={550}
                            />
                        );
                    } else if (this.boxPlotData.isError) {
                        return <span>Error loading plot data.</span>;
                    } else {
                        return (
                            <LoadingIndicator
                                center={true}
                                isLoading={true}
                                size={'big'}
                            />
                        );
                    }
                } else {
                    plotElt = (
                        <MultipleCategoryBarPlot
                            svgId={SVG_ID}
                            horzData={
                                (this.horzAxisDataPromise
                                    .result! as IStringAxisData).data
                            }
                            vertData={
                                (this.vertAxisDataPromise
                                    .result! as IStringAxisData).data
                            }
                            horzCategoryOrder={
                                (this.horzAxisDataPromise
                                    .result! as IStringAxisData).categoryOrder
                            }
                            vertCategoryOrder={
                                (this.vertAxisDataPromise
                                    .result! as IStringAxisData).categoryOrder
                            }
                            categoryToColor={this.categoryToColor}
                            barWidth={20}
                            domainPadding={20}
                            chartBase={500}
                            axisLabelX={this.horzLabel}
                            axisLabelY={this.vertLabel}
                            legendLocationWidthThreshold={450}
                            ticksCount={6}
                            horizontalBars={this.horizontalBars}
                            percentage={isPercentage}
                            stacked={isStacked}
                        />
                    );
                }

                return (
                    <div
                        data-test="ClinicalTabPlotDiv"
                        className="borderedChart posRelative"
                        style={{ marginBottom: 10 }}
                    >
                        <ScrollBar
                            style={{ position: 'relative', top: -5 }}
                            getScrollEl={this.getScrollPane}
                        />
                        <Observer>{this.toolbar}</Observer>
                        <div
                            ref={this.assignScrollPaneRef}
                            style={{
                                position: 'relative',
                                display: 'inline-block',
                            }}
                        >
                            {plotElt}
                        </div>
                    </div>
                );
            }
        }
    }

    @autobind
    private toolbar() {
        return (
            <div style={{ textAlign: 'center', position: 'relative' }}>
                <DownloadControls
                    getSvg={this.getSvg}
                    filename={SVG_ID}
                    dontFade={true}
                    type="button"
                    style={{ position: 'absolute', right: 0, top: 0 }}
                />
            </div>
        );
    }

    componentWillUnmount() {
        this.tableDataStore.destroy();
    }

    public render() {
        return this.tabUI.component;
    }
}
