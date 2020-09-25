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
import VAFLineChart, { SHOW_ONLY_SELECTED_LABEL } from './VAFLineChart';
import { action, computed, observable } from 'mobx';
import autobind from 'autobind-decorator';
import PatientViewMutationsDataStore from './PatientViewMutationsDataStore';
import { Mutation } from 'cbioportal-ts-api-client';
import MutationOncoprint from './oncoprint/MutationOncoprint';
import { DownloadControls } from 'cbioportal-frontend-commons';
import LabeledCheckbox from '../../../shared/components/labeledCheckbox/LabeledCheckbox';
import PatientViewMutationTable from './PatientViewMutationTable';
import { GeneFilterOption } from './GeneFilterMenu';
import { isFusion } from '../../../shared/lib/MutationUtils';
import PatientViewUrlWrapper from '../PatientViewUrlWrapper';
import WindowStore from '../../../shared/components/window/WindowStore';
import Timeline from '../timeline/Timeline';
import VAFChartWrapper from 'pages/patientView/timeline2/VAFChartWrapper';

export interface IPatientViewMutationsTabProps {
    patientViewPageStore: PatientViewPageStore;
    urlWrapper: PatientViewUrlWrapper;
    mutationTableColumnVisibility?: { [columnId: string]: boolean };
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

    @autobind
    @action
    private toggleTimeline() {
        this.showTimeline = !this.showTimeline;
    }

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

    @autobind
    @action
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
            <div className="borderedChart" style={{ display: 'inline-block' }}>
                {/*<div*/}
                {/*    style={{*/}
                {/*        display: 'flex',*/}
                {/*        alignItems: 'center',*/}
                {/*        justifyContent: 'space-between',*/}
                {/*        marginBottom: 5,*/}
                {/*    }}*/}
                {/*>*/}
                {/*    <div style={{ display: 'flex', alignItems: 'center' }}>*/}
                {/*        <LabeledCheckbox*/}
                {/*            checked={this.dataStore.onlyShowSelectedInVAFChart}*/}
                {/*            onChange={() =>*/}
                {/*                this.dataStore.setOnlyShowSelectedInVAFChart(*/}
                {/*                    !this.dataStore.onlyShowSelectedInVAFChart*/}
                {/*                )*/}
                {/*            }*/}
                {/*            labelProps={{ style: { marginRight: 10 } }}*/}
                {/*            inputProps={{ 'data-test': 'VAFOnlyHighlighted' }}*/}
                {/*        >*/}
                {/*            <span style={{ marginTop: -3 }}>*/}
                {/*                {SHOW_ONLY_SELECTED_LABEL}*/}
                {/*            </span>*/}
                {/*        </LabeledCheckbox>*/}
                {/*        <LabeledCheckbox*/}
                {/*            checked={this.vafLineChartLogScale}*/}
                {/*            onChange={() => {*/}
                {/*                this.vafLineChartLogScale = !this*/}
                {/*                    .vafLineChartLogScale;*/}
                {/*            }}*/}
                {/*            labelProps={{ style: { marginRight: 10 } }}*/}
                {/*            inputProps={{ 'data-test': 'VAFLogScale' }}*/}
                {/*        >*/}
                {/*            <span style={{ marginTop: -3 }}>Log scale</span>*/}
                {/*        </LabeledCheckbox>*/}
                {/*        <LabeledCheckbox*/}
                {/*            checked={!this.vafLineChartZeroToOneYAxis}*/}
                {/*            onChange={() => {*/}
                {/*                this.vafLineChartZeroToOneYAxis = !this*/}
                {/*                    .vafLineChartZeroToOneYAxis;*/}
                {/*            }}*/}
                {/*            labelProps={{ style: { marginRight: 10 } }}*/}
                {/*            inputProps={{ 'data-test': 'VAFDataRange' }}*/}
                {/*        >*/}
                {/*            <span style={{ marginTop: -3 }}>*/}
                {/*                Set y-axis to data range*/}
                {/*            </span>*/}
                {/*        </LabeledCheckbox>*/}
                {/*    </div>*/}
                {/*    <DownloadControls*/}
                {/*        filename="vafHeatmap"*/}
                {/*        getSvg={() => this.vafLineChartSvg}*/}
                {/*        buttons={['SVG', 'PNG', 'PDF']}*/}
                {/*        type="button"*/}
                {/*        dontFade*/}
                {/*    />*/}
                {/*</div>*/}

                {this.props.sampleManager && (
                    <VAFChartWrapper
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
                    />
                )}

                {/*<VAFLineChart*/}
                {/*    dataStore={this.dataStore}*/}
                {/*    samples={this.props.store.samples.result!}*/}
                {/*    coverageInformation={*/}
                {/*        this.props.store.coverageInformation.result!*/}
                {/*    }*/}
                {/*    mutationProfileId={*/}
                {/*        this.props.store.mutationMolecularProfileId.result!*/}
                {/*    }*/}
                {/*    sampleManager={this.props.sampleManager}*/}
                {/*    svgRef={this.vafLineChartSvgRef}*/}
                {/*    logScale={this.vafLineChartLogScale}*/}
                {/*    zeroToOneAxis={this.vafLineChartZeroToOneYAxis}*/}
                {/*/>*/}
            </div>
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
                        className="borderedChart"
                        style={{
                            marginBottom: 20,
                            padding: this.showTimeline ? 10 : 5,
                            width: WindowStore.size.width - 50,
                        }}
                    >
                        <button
                            className="btn btn-xs btn-default"
                            style={{
                                paddingTop: 0,
                                paddingBottom: 0,
                                marginLeft: this.showTimeline ? -5 : 0, // negative margins hardcoded in to make button not move when its clicked
                                marginTop: this.showTimeline ? -10 : 0, // ^^
                            }}
                            onClick={this.toggleTimeline}
                            data-test="ToggleTimeline"
                        >
                            {this.showTimeline
                                ? 'Hide Timeline'
                                : 'Show Timeline'}
                        </button>
                        {this.showTimeline && (
                            <div style={{ marginTop: 10 }}>
                                <Timeline
                                    store={this.props.patientViewPageStore}
                                    width={WindowStore.size.width - 100}
                                    sampleManager={this.props.sampleManager}
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
                {this.timeline.component}
                <MSKTabs
                    activeTabId={this.plotTab}
                    onTabClick={this.setPlotTab}
                    className="secondaryNavigation vafVizNavTabs"
                    unmountOnHide={false}
                >
                    <MSKTab id={PlotTab.LINE_CHART} linkText="Line Chart">
                        <div style={{ paddingBottom: 10 }}>
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
