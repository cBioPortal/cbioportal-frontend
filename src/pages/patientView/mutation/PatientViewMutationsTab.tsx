import * as React from 'react';
import { observer } from 'mobx-react';
import { MakeMobxView } from '../../../shared/components/MobxView';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import { ServerConfigHelpers } from '../../../config/config';
import AppConfig from 'appConfig';
import { MSKTab, MSKTabs } from '../../../shared/components/MSKTabs/MSKTabs';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import SampleManager from '../SampleManager';
import { IColumnVisibilityDef } from '../../../shared/components/columnVisibilityControls/ColumnVisibilityControls';
import { action, computed, makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import PatientViewMutationsDataStore from './PatientViewMutationsDataStore';
import { Mutation, ClinicalDataBySampleId } from 'cbioportal-ts-api-client';
import MutationOncoprint from './oncoprint/MutationOncoprint';
import LabeledCheckbox from '../../../shared/components/labeledCheckbox/LabeledCheckbox';
import PatientViewMutationTable from './PatientViewMutationTable';
import { GeneFilterOption } from './GeneFilterMenu';
import { isFusion } from '../../../shared/lib/MutationUtils';
import PatientViewUrlWrapper from '../PatientViewUrlWrapper';
import WindowStore from '../../../shared/components/window/WindowStore';
import Timeline from '../timeline/Timeline';
import VAFChartWrapper from 'pages/patientView/timeline2/VAFChartWrapper';
import TimelineWrapper from 'pages/patientView/timeline2/TimelineWrapper';
import VAFChartWrapperStore from '../timeline2/VAFChartWrapperStore';

export interface IPatientViewMutationsTabProps {
    patientViewPageStore: PatientViewPageStore;
    urlWrapper: PatientViewUrlWrapper;
    mutationTableColumnVisibility?: { [columnId: string]: boolean };
    samples?: ClinicalDataBySampleId[];
    onMutationTableColumnVisibilityToggled: (
        columnId: string,
        columnVisibility?: IColumnVisibilityDef[]
    ) => void;
    sampleManager: SampleManager | null;
}

enum PlotTab {
    LINE_CHART = 'lineChart',
    HEATMAP = 'heatmap',
    TIMELINE = 'timeline',
}

export const LOCAL_STORAGE_PLOT_TAB_KEY =
    'patient_view_mutations_tab__vaf_plot_choice';

@observer
export default class PatientViewMutationsTab extends React.Component<
    IPatientViewMutationsTabProps,
    {}
> {
    constructor(props: IPatientViewMutationsTabProps) {
        super(props);
        makeObservable(this);
    }
    get showTimeline() {
        return (
            this.props.urlWrapper.query.genomicEvolutionSettings
                .showTimeline === 'true'
        );
    }
    set showTimeline(o: boolean) {
        this.props.urlWrapper.updateURL({
            genomicEvolutionSettings: Object.assign(
                {},
                this.props.urlWrapper.query.genomicEvolutionSettings,
                {
                    showTimeline: o.toString(),
                }
            ),
        });
    }

    @action.bound
    private toggleTimeline() {
        this.showTimeline = !this.showTimeline;
    }

    private vafChartWrapperStore = new VAFChartWrapperStore({
        isOnlySequentialModePossible: () =>
            this.props.patientViewPageStore.clinicalEvents.result.length === 0,
    });
    private dataStore = new PatientViewMutationsDataStore(
        () => this.mergedMutations,
        this.props.urlWrapper
    );
    private vafLineChartSvg: SVGElement | null = null;
    get vafLineChartLogScale() {
        return (
            this.props.urlWrapper.query.genomicEvolutionSettings
                .logScaleChart === 'true'
        );
    }
    set vafLineChartLogScale(o: boolean) {
        this.props.urlWrapper.updateURL(currentParams => {
            currentParams.genomicEvolutionSettings.logScaleChart = o.toString();
            return currentParams;
        });
    }
    get vafLineChartZeroToOneYAxis() {
        const urlValue = this.props.urlWrapper.query.genomicEvolutionSettings
            .yAxisDataRangeInChart;
        return !urlValue || urlValue === 'true'; // default true
    }
    set vafLineChartZeroToOneYAxis(o: boolean) {
        this.props.urlWrapper.updateURL(currentParams => {
            currentParams.genomicEvolutionSettings.yAxisDataRangeInChart = o.toString();
            return currentParams;
        });
    }
    // TODO: replace this with URL stuff
    @observable private _plotTab =
        localStorage.getItem(LOCAL_STORAGE_PLOT_TAB_KEY) || PlotTab.LINE_CHART;

    @computed get plotTab() {
        return this._plotTab;
    }

    @action.bound
    private setPlotTab(id: PlotTab) {
        this._plotTab = id;
        localStorage.setItem(LOCAL_STORAGE_PLOT_TAB_KEY, id);
    }

    @autobind
    private vafLineChartSvgRef(elt: SVGElement | null) {
        this.vafLineChartSvg = elt;
    }

    @computed get mergedMutations() {
        // remove fusions
        return this.props.patientViewPageStore.mergedMutationDataIncludingUncalledFilteredByGene.filter(
            mutationArray => {
                return !isFusion(mutationArray[0]);
            }
        );
    }

    readonly vafLineChart = MakeMobxView({
        await: () => [
            this.props.patientViewPageStore.coverageInformation,
            this.props.patientViewPageStore.samples,
            this.props.patientViewPageStore.mutationMolecularProfileId,
        ],
        renderPending: () => <LoadingIndicator isLoading={true} size="small" />,
        render: () => (
            <>
                {this.props.sampleManager && (
                    <VAFChartWrapper
                        key={`vafKey${WindowStore.size.width}-${this.showTimeline}`}
                        wrapperStore={this.vafChartWrapperStore}
                        dataStore={this.dataStore}
                        caseMetaData={{
                            color: this.props.sampleManager.sampleColors,
                            label: this.props.sampleManager.sampleLabels,
                            index: this.props.sampleManager.sampleIndex,
                        }}
                        data={
                            this.props.patientViewPageStore.clinicalEvents
                                .result
                        }
                        sampleManager={this.props.sampleManager}
                        width={WindowStore.size.width}
                        samples={this.props.patientViewPageStore.samples.result}
                        mutationProfileId={
                            this.props.patientViewPageStore
                                .mutationMolecularProfileId.result!
                        }
                        coverageInformation={
                            this.props.patientViewPageStore.coverageInformation
                                .result
                        }
                        headerWidth={this.showTimeline ? 150 : 50}
                    />
                )}
            </>
        ),
        showLastRenderWhenPending: true,
    });

    @autobind
    private onTableRowClick(d: Mutation[]) {
        if (d.length) {
            this.dataStore.toggleSelectedMutation(d[0]);
        }
    }
    @autobind
    private onTableRowMouseEnter(d: Mutation[]) {
        if (d.length) {
            this.dataStore.setMouseOverMutation(d[0]);
        }
    }
    @autobind
    private onTableRowMouseLeave() {
        this.dataStore.setMouseOverMutation(null);
    }

    @autobind
    private onFilterGenesMutationTable(option: GeneFilterOption): void {
        this.props.patientViewPageStore.mutationTableGeneFilterOption = option;
    }

    readonly table = MakeMobxView({
        await: () => [
            this.props.patientViewPageStore.mutationData,
            this.props.patientViewPageStore.uncalledMutationData,
            this.props.patientViewPageStore.oncoKbAnnotatedGenes,
            this.props.patientViewPageStore.studyIdToStudy,
            this.props.patientViewPageStore.sampleToMutationGenePanelId,
            this.props.patientViewPageStore.genePanelIdToEntrezGeneIds,
        ],
        renderPending: () => <LoadingIndicator isLoading={true} size="small" />,
        render: () => (
            <div data-test="GenomicEvolutionMutationTable">
                <div style={{ float: 'left', marginRight: 15, marginTop: 4 }}>
                    <LabeledCheckbox
                        checked={this.dataStore.onlyShowSelectedInTable}
                        onChange={() =>
                            this.dataStore.setOnlyShowSelectedInTable(
                                !this.dataStore.onlyShowSelectedInTable
                            )
                        }
                        labelProps={{ style: { marginRight: 10 } }}
                        inputProps={{ 'data-test': 'TableShowOnlyHighlighted' }}
                    >
                        <span style={{ marginTop: -3 }}>
                            Show only selected mutations
                        </span>
                    </LabeledCheckbox>
                </div>
                <PatientViewMutationTable
                    dataStore={this.dataStore}
                    showGeneFilterMenu={
                        this.props.patientViewPageStore
                            .mutationTableShowGeneFilterMenu.result
                    }
                    currentGeneFilter={
                        this.props.patientViewPageStore
                            .mutationTableGeneFilterOption
                    }
                    onFilterGenes={this.onFilterGenesMutationTable}
                    onRowClick={this.onTableRowClick}
                    onRowMouseEnter={this.onTableRowMouseEnter}
                    onRowMouseLeave={this.onTableRowMouseLeave}
                    studyIdToStudy={
                        this.props.patientViewPageStore.studyIdToStudy.result!
                    }
                    sampleManager={this.props.sampleManager}
                    sampleIds={
                        this.props.sampleManager
                            ? this.props.sampleManager.getSampleIdsInOrder()
                            : []
                    }
                    uniqueSampleKeyToTumorType={
                        this.props.patientViewPageStore
                            .uniqueSampleKeyToTumorType
                    }
                    molecularProfileIdToMolecularProfile={
                        this.props.patientViewPageStore
                            .molecularProfileIdToMolecularProfile.result
                    }
                    variantCountCache={
                        this.props.patientViewPageStore.variantCountCache
                    }
                    indexedVariantAnnotations={
                        this.props.patientViewPageStore
                            .indexedVariantAnnotations
                    }
                    indexedMyVariantInfoAnnotations={
                        this.props.patientViewPageStore
                            .indexedMyVariantInfoAnnotations
                    }
                    discreteCNACache={
                        this.props.patientViewPageStore.discreteCNACache
                    }
                    mrnaExprRankCache={
                        this.props.patientViewPageStore.mrnaExprRankCache
                    }
                    pubMedCache={this.props.patientViewPageStore.pubMedCache}
                    genomeNexusCache={
                        this.props.patientViewPageStore.genomeNexusCache
                    }
                    mrnaExprRankMolecularProfileId={
                        this.props.patientViewPageStore
                            .mrnaRankMolecularProfileId.result || undefined
                    }
                    discreteCNAMolecularProfileId={
                        this.props.patientViewPageStore
                            .molecularProfileIdDiscrete.result
                    }
                    downloadDataFetcher={
                        this.props.patientViewPageStore.downloadDataFetcher
                    }
                    mutSigData={
                        this.props.patientViewPageStore.mutSigData.result
                    }
                    myCancerGenomeData={
                        this.props.patientViewPageStore.myCancerGenomeData
                    }
                    hotspotData={
                        this.props.patientViewPageStore.indexedHotspotData
                    }
                    cosmicData={
                        this.props.patientViewPageStore.cosmicData.result
                    }
                    oncoKbData={this.props.patientViewPageStore.oncoKbData}
                    oncoKbCancerGenes={
                        this.props.patientViewPageStore.oncoKbCancerGenes
                    }
                    usingPublicOncoKbInstance={
                        this.props.patientViewPageStore
                            .usingPublicOncoKbInstance
                    }
                    civicGenes={this.props.patientViewPageStore.civicGenes}
                    civicVariants={
                        this.props.patientViewPageStore.civicVariants
                    }
                    userEmailAddress={ServerConfigHelpers.getUserEmailAddress()}
                    enableOncoKb={AppConfig.serverConfig.show_oncokb}
                    enableFunctionalImpact={
                        AppConfig.serverConfig.show_genomenexus
                    }
                    enableHotspot={AppConfig.serverConfig.show_hotspot}
                    enableMyCancerGenome={
                        AppConfig.serverConfig.mycancergenome_show
                    }
                    enableCivic={AppConfig.serverConfig.show_civic}
                    columnVisibility={this.props.mutationTableColumnVisibility}
                    columnVisibilityProps={{
                        onColumnToggled: this.props
                            .onMutationTableColumnVisibilityToggled,
                    }}
                    sampleToGenePanelId={
                        this.props.patientViewPageStore
                            .sampleToMutationGenePanelId.result!
                    }
                    genePanelIdToEntrezGeneIds={
                        this.props.patientViewPageStore
                            .genePanelIdToEntrezGeneIds.result!
                    }
                    generateGenomeNexusHgvsgUrl={
                        this.props.patientViewPageStore
                            .generateGenomeNexusHgvsgUrl
                    }
                    sampleIdToClinicalDataMap={
                        this.props.patientViewPageStore
                            .clinicalDataGroupedBySampleMap
                    }
                    existsSomeMutationWithAscnProperty={
                        this.props.patientViewPageStore
                            .existsSomeMutationWithAscnProperty
                    }
                />
            </div>
        ),
    });

    readonly timeline = MakeMobxView({
        await: () => [this.props.patientViewPageStore.clinicalEvents],
        render: () => {
            if (
                this.props.sampleManager !== null &&
                this.props.patientViewPageStore.clinicalEvents.result!.length >
                    0
            ) {
                return (
                    <div
                        style={{
                            marginBottom: 20,
                        }}
                    >
                        <button
                            className="btn btn-xs btn-default displayBlock"
                            onClick={this.toggleTimeline}
                            data-test="ToggleTimeline"
                        >
                            {this.showTimeline
                                ? 'Hide Timeline'
                                : 'Show Timeline'}
                        </button>
                        {this.showTimeline && (
                            <div style={{ marginTop: 10 }}>
                                <TimelineWrapper
                                    key={`tlkey-${WindowStore.size.width}-${this.showTimeline}1`}
                                    dataStore={this.dataStore}
                                    caseMetaData={{
                                        color: this.props.sampleManager
                                            .sampleColors,
                                        label: this.props.sampleManager
                                            .sampleLabels,
                                        index: this.props.sampleManager
                                            .sampleIndex,
                                    }}
                                    data={
                                        this.props.patientViewPageStore
                                            .clinicalEvents.result
                                    }
                                    sampleManager={this.props.sampleManager}
                                    width={WindowStore.size.width}
                                    samples={
                                        this.props.patientViewPageStore.samples
                                            .result
                                    }
                                    mutationProfileId={
                                        this.props.patientViewPageStore
                                            .mutationMolecularProfileId.result!
                                    }
                                    // coverageInformation={
                                    //     this.props.patientViewPageStore
                                    //         .coverageInformation.result
                                    // }
                                    headerWidth={150}
                                />
                            </div>
                        )}
                    </div>
                );
            } else {
                return null;
            }
        },
    });

    readonly tabUI = MakeMobxView({
        await: () => [this.table, this.vafLineChart, this.timeline],
        renderPending: () => (
            <LoadingIndicator isLoading={true} size="big" center={true} />
        ),
        render: () => (
            <div data-test="GenomicEvolutionTab">
                <MSKTabs
                    activeTabId={this.plotTab}
                    onTabClick={this.setPlotTab}
                    className="secondaryNavigation vafVizNavTabs"
                    unmountOnHide={false}
                >
                    <MSKTab id={PlotTab.LINE_CHART} linkText="Line Chart">
                        <div
                            style={{
                                paddingBottom: 10,
                                width: WindowStore.size.width - 50,
                            }}
                        >
                            {this.timeline.component}

                            {this.vafLineChart.component}
                        </div>
                    </MSKTab>
                    <MSKTab id={PlotTab.HEATMAP} linkText="Heatmap">
                        <div style={{ paddingBottom: 10 }}>
                            <MutationOncoprint
                                store={this.props.patientViewPageStore}
                                dataStore={this.dataStore}
                                sampleManager={this.props.sampleManager}
                                urlWrapper={this.props.urlWrapper}
                            />
                        </div>
                    </MSKTab>
                </MSKTabs>
                <div style={{ marginTop: 20 }}>{this.table.component}</div>
            </div>
        ),
    });

    render() {
        return this.tabUI.component;
    }
}
