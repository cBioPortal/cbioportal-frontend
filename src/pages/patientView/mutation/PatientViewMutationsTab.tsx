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
import { Mutation } from '../../../shared/api/generated/CBioPortalAPI';
import ReactSelect from 'react-select';
import MutationOncoprint from './oncoprint/MutationOncoprint';
import { DownloadControls } from 'cbioportal-frontend-commons';
import LabeledCheckbox from '../../../shared/components/labeledCheckbox/LabeledCheckbox';
import PatientViewMutationTable from './PatientViewMutationTable';
import { GeneFilterOption } from './GeneFilterMenu';
import { isFusion } from '../../../shared/lib/MutationUtils';
import PatientViewUrlWrapper from '../PatientViewUrlWrapper';

export interface IPatientViewMutationsTabProps {
    store: PatientViewPageStore;
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
}

export const LOCAL_STORAGE_PLOT_TAB_KEY =
    'patient_view_mutations_tab__vaf_plot_choice';

@observer
export default class PatientViewMutationsTab extends React.Component<
    IPatientViewMutationsTabProps,
    {}
> {
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
        this.props.urlWrapper.updateURL({
            genomicEvolutionSettings: Object.assign(
                {},
                this.props.urlWrapper.query.genomicEvolutionSettings,
                {
                    logScaleChart: o.toString(),
                }
            ),
        });
    }

    get vafLineChartZeroToOneYAxis() {
        const urlValue = this.props.urlWrapper.query.genomicEvolutionSettings
            .yAxisDataRangeInChart;
        return !urlValue || urlValue === 'true'; // default true
    }
    set vafLineChartZeroToOneYAxis(o: boolean) {
        this.props.urlWrapper.updateURL({
            genomicEvolutionSettings: Object.assign(
                {},
                this.props.urlWrapper.query.genomicEvolutionSettings,
                {
                    yAxisDataRangeInChart: o.toString(),
                }
            ),
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
        return this.props.store.mergedMutationDataIncludingUncalledFilteredByGene.filter(
            mutationArray => {
                return !isFusion(mutationArray[0]);
            }
        );
    }

    readonly vafLineChart = MakeMobxView({
        await: () => [
            this.props.store.coverageInformation,
            this.props.store.samples,
            this.props.store.mutationMolecularProfileId,
        ],
        renderPending: () => <LoadingIndicator isLoading={true} size="small" />,
        render: () => (
            <div className="borderedChart" style={{ display: 'inline-block' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 5,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <LabeledCheckbox
                            checked={this.dataStore.onlyShowSelectedInVAFChart}
                            onChange={() =>
                                this.dataStore.setOnlyShowSelectedInVAFChart(
                                    !this.dataStore.onlyShowSelectedInVAFChart
                                )
                            }
                            labelProps={{ style: { marginRight: 10 } }}
                            inputProps={{ 'data-test': 'VAFOnlyHighlighted' }}
                        >
                            <span style={{ marginTop: -3 }}>
                                {SHOW_ONLY_SELECTED_LABEL}
                            </span>
                        </LabeledCheckbox>
                        <LabeledCheckbox
                            checked={this.vafLineChartLogScale}
                            onChange={() => {
                                this.vafLineChartLogScale = !this
                                    .vafLineChartLogScale;
                            }}
                            labelProps={{ style: { marginRight: 10 } }}
                            inputProps={{ 'data-test': 'VAFLogScale' }}
                        >
                            <span style={{ marginTop: -3 }}>Log scale</span>
                        </LabeledCheckbox>
                        <LabeledCheckbox
                            checked={!this.vafLineChartZeroToOneYAxis}
                            onChange={() => {
                                this.vafLineChartZeroToOneYAxis = !this
                                    .vafLineChartZeroToOneYAxis;
                            }}
                            labelProps={{ style: { marginRight: 10 } }}
                            inputProps={{ 'data-test': 'VAFDataRange' }}
                        >
                            <span style={{ marginTop: -3 }}>
                                Set y-axis to data range
                            </span>
                        </LabeledCheckbox>
                    </div>
                    <DownloadControls
                        filename="vafHeatmap"
                        getSvg={() => this.vafLineChartSvg}
                        buttons={['SVG', 'PNG', 'PDF']}
                        type="button"
                        dontFade
                    />
                </div>
                <VAFLineChart
                    dataStore={this.dataStore}
                    samples={this.props.store.samples.result!}
                    coverageInformation={
                        this.props.store.coverageInformation.result!
                    }
                    mutationProfileId={
                        this.props.store.mutationMolecularProfileId.result!
                    }
                    sampleManager={this.props.sampleManager}
                    svgRef={this.vafLineChartSvgRef}
                    logScale={this.vafLineChartLogScale}
                    zeroToOneAxis={this.vafLineChartZeroToOneYAxis}
                />
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
        this.props.store.mutationTableGeneFilterOption = option;
    }

    readonly table = MakeMobxView({
        await: () => [
            this.props.store.mutationData,
            this.props.store.uncalledMutationData,
            this.props.store.oncoKbAnnotatedGenes,
            this.props.store.studyIdToStudy,
            this.props.store.sampleToMutationGenePanelId,
            this.props.store.genePanelIdToEntrezGeneIds,
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
                        this.props.store.mutationTableShowGeneFilterMenu.result
                    }
                    currentGeneFilter={
                        this.props.store.mutationTableGeneFilterOption
                    }
                    onFilterGenes={this.onFilterGenesMutationTable}
                    onRowClick={this.onTableRowClick}
                    onRowMouseEnter={this.onTableRowMouseEnter}
                    onRowMouseLeave={this.onTableRowMouseLeave}
                    studyIdToStudy={this.props.store.studyIdToStudy.result!}
                    sampleManager={this.props.sampleManager}
                    sampleIds={
                        this.props.sampleManager
                            ? this.props.sampleManager.getSampleIdsInOrder()
                            : []
                    }
                    uniqueSampleKeyToTumorType={
                        this.props.store.uniqueSampleKeyToTumorType
                    }
                    molecularProfileIdToMolecularProfile={
                        this.props.store.molecularProfileIdToMolecularProfile
                            .result
                    }
                    variantCountCache={this.props.store.variantCountCache}
                    indexedVariantAnnotations={
                        this.props.store.indexedVariantAnnotations
                    }
                    discreteCNACache={this.props.store.discreteCNACache}
                    mrnaExprRankCache={this.props.store.mrnaExprRankCache}
                    pubMedCache={this.props.store.pubMedCache}
                    genomeNexusCache={this.props.store.genomeNexusCache}
                    genomeNexusMyVariantInfoCache={
                        this.props.store.genomeNexusMyVariantInfoCache
                    }
                    mrnaExprRankMolecularProfileId={
                        this.props.store.mrnaRankMolecularProfileId.result ||
                        undefined
                    }
                    discreteCNAMolecularProfileId={
                        this.props.store.molecularProfileIdDiscrete.result
                    }
                    downloadDataFetcher={this.props.store.downloadDataFetcher}
                    mutSigData={this.props.store.mutSigData.result}
                    myCancerGenomeData={this.props.store.myCancerGenomeData}
                    hotspotData={this.props.store.indexedHotspotData}
                    cosmicData={this.props.store.cosmicData.result}
                    oncoKbData={this.props.store.oncoKbData}
                    oncoKbCancerGenes={this.props.store.oncoKbCancerGenes}
                    civicGenes={this.props.store.civicGenes}
                    civicVariants={this.props.store.civicVariants}
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
                        this.props.store.sampleToMutationGenePanelId.result!
                    }
                    genePanelIdToEntrezGeneIds={
                        this.props.store.genePanelIdToEntrezGeneIds.result!
                    }
                />
            </div>
        ),
    });

    readonly tabUI = MakeMobxView({
        await: () => [this.table, this.vafLineChart],
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
                        <div style={{ paddingBottom: 20 }}>
                            {this.vafLineChart.component}
                        </div>
                    </MSKTab>
                    <MSKTab id={PlotTab.HEATMAP} linkText="Heatmap">
                        <div style={{ paddingBottom: 20 }}>
                            <MutationOncoprint
                                store={this.props.store}
                                dataStore={this.dataStore}
                                sampleManager={this.props.sampleManager}
                                urlWrapper={this.props.urlWrapper}
                            />
                        </div>
                    </MSKTab>
                </MSKTabs>
                <div style={{ marginTop: 30 }}>{this.table.component}</div>
            </div>
        ),
    });

    render() {
        return this.tabUI.component;
    }
}
