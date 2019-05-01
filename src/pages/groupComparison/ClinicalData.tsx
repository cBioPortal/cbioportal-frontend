import * as React from "react";
import { observer, Observer } from "mobx-react";
import autobind from "autobind-decorator";
import GroupComparisonStore, { OverlapStrategy } from "./GroupComparisonStore";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import { computed, observable, IReactionDisposer, autorun, action } from "mobx";
import { SimpleGetterLazyMobXTableApplicationDataStore } from "shared/lib/ILazyMobXTableApplicationDataStore";
import ClinicalDataEnrichmentsTable from "./ClinicalDataEnrichmentsTable";
import _ from "lodash";
import { remoteData } from "shared/api/remoteData";
import client from "shared/api/cbioportalClientInstance";
import { IAxisData, IStringAxisData, makeBoxScatterPlotData, IBoxScatterPlotPoint, INumberAxisData, isNumberData, isStringData, boxPlotTooltip, mutationSummaryToAppearance, MutationSummary } from "pages/resultsView/plots/PlotsTabUtils";
import DownloadControls from "shared/components/downloadControls/DownloadControls";
import ScrollBar from "shared/components/Scrollbar/ScrollBar";
import BoxScatterPlot, { IBoxScatterPlotData } from "shared/components/plots/BoxScatterPlot";
import { getMobxPromiseGroupStatus } from "shared/lib/getMobxPromiseGroupStatus";
import { scatterPlotSize } from "shared/components/plots/PlotUtils";
import { ClinicalDataEnrichmentWithQ, CLINICAL_TAB_OVERLAPPING_SAMPLES_MSG, CLINICAL_TAB_NOT_ENOUGH_GROUPS_MSG, EXCLUDE_OVERLAPPING_SAMPLES_AND_PATIENTS_MSG } from "./GroupComparisonUtils";
import MultipleCategoryBarPlot from "../../shared/components/plots/MultipleCategoryBarPlot";
import { STUDY_VIEW_CONFIG } from "pages/studyView/StudyViewConfig";
import ReactSelect from "react-select";
import { MakeMobxView } from "shared/components/MobxView";

export interface IClinicalDataProps {
    store: GroupComparisonStore
}

const SVG_ID = "clinical-plot-svg";

class PlotsTabBoxPlot extends BoxScatterPlot<IBoxScatterPlotPoint> { }

export class ClinicalDataEnrichmentStore extends SimpleGetterLazyMobXTableApplicationDataStore<ClinicalDataEnrichmentWithQ> {

    private reactionDisposer: IReactionDisposer;

    constructor(
        getData: () => ClinicalDataEnrichmentWithQ[],
        getHighlighted: () => ClinicalDataEnrichmentWithQ | undefined,
        public setHighlighted: (c: ClinicalDataEnrichmentWithQ) => void
    ) {
        super(getData);
        this.dataHighlighter = (d: ClinicalDataEnrichmentWithQ) => {
            const highlighted = getHighlighted();
            return !!(highlighted && (d.clinicalAttribute.clinicalAttributeId === highlighted.clinicalAttribute.clinicalAttributeId));
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
    Bar = "Bar",
    StackedBar = "StackedBar",
    PercentageStackedBar = "PercentageStackedBar"
}

const plotTypeOptions = [
    { value: PlotType.Bar, label: "Bar chart" },
    { value: PlotType.StackedBar, label: "Stacked bar chart" },
    { value: PlotType.PercentageStackedBar, label: "100% stacked bar chart" }
]

@observer
export default class ClinicalData extends React.Component<IClinicalDataProps, {}> {

    @observable.ref highlightedRow: ClinicalDataEnrichmentWithQ | undefined;

    private scrollPane: HTMLDivElement;

    readonly tabUI = MakeMobxView({
        await: () => {
            if (this.props.store._originalGroupsOverlapRemoved.isComplete &&
                this.props.store._originalGroupsOverlapRemoved.result.length < 2) {
                // dont bother loading data for and computing clinical tab if not enough groups for it
                return [this.props.store._originalGroupsOverlapRemoved];
            } else {
                return [this.props.store._originalGroupsOverlapRemoved, this.overlapUI];
            }
        },
        render: () => {
            if (this.props.store._originalGroupsOverlapRemoved.result!.length < 2) {
                return <span>{CLINICAL_TAB_NOT_ENOUGH_GROUPS_MSG}</span>;
            } else {
                let content: any = [];
                if (this.props.store.overlapStrategy === OverlapStrategy.INCLUDE && (this.props.store._selectionInfo.result!.overlappingSamples.length !== 0 || this.props.store._selectionInfo.result!.overlappingPatients.length !== 0)) {
                    content.push(<div className={'alert alert-info'}>{EXCLUDE_OVERLAPPING_SAMPLES_AND_PATIENTS_MSG}</div>);
                }
                content.push(this.overlapUI.component)
                return content;
            }
        },
        renderPending: () => <LoadingIndicator isLoading={true} centerRelativeToContainer={true} size={"big"} />
    });

    readonly overlapUI = MakeMobxView({
        await: () => [this.props.store.clinicalDataEnrichmentsWithQValues],
        render: () => {
            return (<div className="clearfix" style={{ display: "flex", marginTop: 6 }}>
                <div style={{ width: "600px" }}>
                    <ClinicalDataEnrichmentsTable dataStore={this.tableDataStore} />
                </div>
                <div style={{ marginLeft: "10px" }} >
                    {this.getUtilitiesMenu}
                    {this.plot}
                </div>
            </div>)
        },
        renderPending: () => <LoadingIndicator isLoading={true} centerRelativeToContainer={true} size="big" />
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
        return this.highlightedRow!.clinicalAttribute.datatype.toLowerCase() === 'number';
    }

    @observable logScale = false;
    @observable swapAxes = false;
    @observable horizontalBars = false;

    @autobind
    @action private onClickLogScale() {
        this.logScale = !this.logScale;
    }

    @autobind
    @action private onClickSwapAxes() {
        this.swapAxes = !this.swapAxes;
    }

    @autobind
    @action private onClickhorizontalBars() {
        this.horizontalBars = !this.horizontalBars;
    }

    private readonly clinicalDataPromise = remoteData({
        await: () => [this.props.store.patientKeyToSamples, this.props.store._originalGroupsOverlapRemoved],
        invoke: async () => {
            const axisData: IAxisData = { data: [], datatype: 'string' };
            if (this.highlightedRow) {
                let attribute = this.highlightedRow!.clinicalAttribute;
                let patientKeyToSamples = this.props.store.patientKeyToSamples.result!;

                let sampleIdentifiers = _.flatMap(this.props.store._originalGroupsOverlapRemoved.result, group => _.flatMap(group.studies, study => {
                    return study.samples.map(sample => ({
                        studyId: study.id,
                        entityId: sample
                    }));
                }));

                let patientidentifiers = _.flatMap(this.props.store._originalGroupsOverlapRemoved.result, group => _.flatMap(group.studies, study => {
                    return study.patients.map(patient => ({
                        studyId: study.id,
                        entityId: patient
                    }));
                }));

                let clinicalData = await client.fetchClinicalDataUsingPOST({
                    clinicalDataType: attribute.patientAttribute ? 'PATIENT' : 'SAMPLE',
                    clinicalDataMultiStudyFilter: {
                        attributeIds: [attribute.clinicalAttributeId],
                        identifiers: attribute.patientAttribute ? patientidentifiers : sampleIdentifiers
                    }
                });

                const shouldParseFloat = attribute.datatype.toLowerCase() === "number";
                axisData.datatype = attribute.datatype.toLowerCase();
                const axisData_Data = axisData.data;
                if (attribute.patientAttribute) {
                    // produce sample data from patient clinical data
                    for (const d of clinicalData) {
                        const samples = patientKeyToSamples[d.uniquePatientKey];
                        for (const sample of samples) {
                            axisData_Data.push({
                                uniqueSampleKey: sample.uniqueSampleKey,
                                value: d.value,
                            });
                        }
                    }
                } else {
                    // produce sample data from sample clinical data
                    for (const d of clinicalData) {
                        axisData_Data.push({
                            uniqueSampleKey: d.uniqueSampleKey,
                            value: d.value
                        });
                    }
                }
                if (shouldParseFloat) {
                    for (const d of axisData_Data) {
                        d.value = parseFloat(d.value as string); // we know its a string bc all clinical data comes back as string
                    }
                }
            }
            return Promise.resolve(axisData);
        }
    });

    private readonly groupSampleDataPromise = remoteData({
        await: () => [this.props.store._originalGroupsOverlapRemoved, this.props.store.sampleSet],
        invoke: async () => {
            const axisData: IAxisData = { data: [], datatype: "string" };
            if (this.highlightedRow) {
                let sampleSet = this.props.store.sampleSet.result!;
                const axisData_Data = axisData.data;
                _.forEach(this.props.store._originalGroupsOverlapRemoved.result!, group => {
                    group.studies.forEach(study => {
                        study.samples.forEach(sampleId => {
                            const sample = sampleSet.get({ studyId: study.id, sampleId });
                            if (sample) {
                                axisData_Data.push({
                                    uniqueSampleKey: sample.uniqueSampleKey,
                                    value: group.name,
                                });
                            }
                        })
                    });
                });
            }
            return Promise.resolve(axisData);
        }
    });

    @computed get vertAxisDataPromise() {
        return this.swapAxes ? this.groupSampleDataPromise : this.clinicalDataPromise;
    }

    @computed get horzAxisDataPromise() {
        return this.swapAxes ? this.clinicalDataPromise : this.groupSampleDataPromise;
    }

    @computed get horzLabel() {
        return this.swapAxes ? `${this.highlightedRow!.clinicalAttribute.displayName}${this.logScale ? ' (log2)' : ''}` : `Group`;
    }

    @computed get vertLabel() {
        return this.swapAxes ? 'Group' : `${this.highlightedRow!.clinicalAttribute.displayName}${this.logScale ? ' (log2)' : ''}`;
    }

    @autobind
    private getSvg() {
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    @autobind
    private assignScrollPaneRef(el: HTMLDivElement) {
        this.scrollPane = el;
    }

    private readonly boxPlotData = remoteData<{ horizontal: boolean, data: IBoxScatterPlotData<IBoxScatterPlotPoint>[] }>({
        await: () => [
            this.horzAxisDataPromise,
            this.vertAxisDataPromise,
            this.props.store.sampleKeyToSample
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
                } else if (isStringData(horzAxisData) && isNumberData(vertAxisData)) {
                    categoryData = horzAxisData;
                    numberData = vertAxisData;
                    horizontal = false;
                } else {
                    return Promise.resolve({ horizontal: false, data: [] });
                }
                return Promise.resolve({
                    horizontal,
                    data: makeBoxScatterPlotData(
                        categoryData, numberData,
                        this.props.store.sampleKeyToSample.result!,
                        {},
                        undefined,
                        undefined
                    )
                });
            }
        }
    });

    @computed get boxPlotTooltip() {
        return (d: IBoxScatterPlotPoint) => {
            let content;
            if (this.boxPlotData.isComplete) {
                content = boxPlotTooltip(d, this.boxPlotData.result.horizontal);
            } else {
                content = <span>Loading... (this shouldnt appear because the box plot shouldnt be visible)</span>;
            }
            return content;
        }
    }

    @computed get categoryToColor() {
        //add group colors and reserved category colors
        return _.reduce(this.props.store.uidToGroup.result!, (acc, next) => {
            acc[next.name] = next.color;
            return acc;
        }, STUDY_VIEW_CONFIG.colors.reservedValue);
    }

    @observable plotType: PlotType = PlotType.PercentageStackedBar;

    @autobind
    @action
    private onPlotTypeSelect(option: any) {
        this.plotType = option.value
    }

    @computed private get getUtilitiesMenu() {
        if (!this.highlightedRow) {
            return <span></span>;
        }
        return (
            <div style={{ marginBottom: "10px"}}>
                {!this.showLogScaleControls && (
                    <div className="form-group" style={{display:"flex", alignItems:"center"}}>
                        <label>Plot Type</label>
                        <div style={{ width: 240, marginLeft:5 }}>
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
                        />Swap Axes
                        </label>
                    {!this.showLogScaleControls && (
                        <label className="checkbox-inline">
                            <input
                                type="checkbox"
                                name="horizontalBars"
                                checked={this.horizontalBars}
                                onClick={this.onClickhorizontalBars}
                            />Horizontal Bars
                        </label>
                    )}
                    {this.showLogScaleControls && (
                        <label className="checkbox-inline">
                            <input
                                type="checkbox"
                                checked={this.logScale}
                                onClick={this.onClickLogScale}
                            />Log Scale
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
        const groupStatus = getMobxPromiseGroupStatus(...promises);
        const isPercentage = this.plotType === PlotType.PercentageStackedBar;
        const isStacked = isPercentage || this.plotType === PlotType.StackedBar;
        switch (groupStatus) {
            case "pending":
                return <LoadingIndicator center={true} isLoading={true} size={"big"} />;
            case "error":
                return <span>Error loading plot data.</span>;
            default: {

                if (!this.horzAxisDataPromise.result || !this.vertAxisDataPromise.result) {
                    return <span>Error loading plot data.</span>;
                }

                let plotElt: any = null;
                if (this.highlightedRow!.clinicalAttribute.datatype.toLowerCase() === 'number') {
                    if (this.boxPlotData.isComplete) {
                        plotElt = (
                            <PlotsTabBoxPlot
                                svgId={SVG_ID}
                                domainPadding={75}
                                boxWidth={this.boxPlotData.result.data.length > 7 ? 30 : 60}
                                axisLabelX={this.horzLabel}
                                axisLabelY={this.vertLabel}
                                data={this.boxPlotData.result.data}
                                chartBase={500}
                                tooltip={this.boxPlotTooltip}
                                horizontal={this.boxPlotData.result.horizontal}
                                logScale={this.logScale}
                                size={scatterPlotSize}
                                fill={mutationSummaryToAppearance[MutationSummary.Neither].fill}
                                stroke={mutationSummaryToAppearance[MutationSummary.Neither].stroke}
                                strokeOpacity={mutationSummaryToAppearance[MutationSummary.Neither].strokeOpacity}
                                symbol="circle"
                                useLogSpaceTicks={true}
                                legendLocationWidthThreshold={550}
                            />
                        );
                    } else if (this.boxPlotData.isError) {
                        return <span>Error loading plot data.</span>;
                    } else {
                        return <LoadingIndicator center={true} isLoading={true} size={"big"} />;
                    }
                } else {
                    plotElt = <MultipleCategoryBarPlot
                        svgId={SVG_ID}
                        horzData={(this.horzAxisDataPromise.result! as IStringAxisData).data}
                        vertData={(this.vertAxisDataPromise.result! as IStringAxisData).data}
                        horzCategoryOrder={(this.horzAxisDataPromise.result! as IStringAxisData).categoryOrder}
                        vertCategoryOrder={(this.vertAxisDataPromise.result! as IStringAxisData).categoryOrder}
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
                }

                return (
                    <div data-test="ClinicalTabPlotDiv" className="borderedChart posRelative">
                        <ScrollBar style={{ position: 'relative', top: -5 }} getScrollEl={this.getScrollPane} />
                        <Observer>
                            {this.toolbar}
                        </Observer>
                        <div ref={this.assignScrollPaneRef} style={{ position: "relative", display: "inline-block" }}>
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
            <div style={{ textAlign: "center", position: "relative" }}>
                <DownloadControls
                    getSvg={this.getSvg}
                    filename={SVG_ID}
                    dontFade={true}
                    collapse={true}
                    style={{ position: 'absolute', right: 0, top: 0 }}
                />
            </div>
        );
    }

    componentWillUnmount() {
        this.tableDataStore.destroy();
    }

    public render() {
        return (
            <div className="inlineBlock">
                {this.tabUI.component}
            </div>
        )
    }
}