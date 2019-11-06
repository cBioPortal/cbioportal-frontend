import * as React from "react";
import {observer} from "mobx-react";
import {MakeMobxView} from "../../../shared/components/MobxView";
import LoadingIndicator from "../../../shared/components/loadingIndicator/LoadingIndicator";
import {ServerConfigHelpers} from "../../../config/config";
import AppConfig from "appConfig";
import {MSKTab, MSKTabs} from "../../../shared/components/MSKTabs/MSKTabs";
import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";
import SampleManager from "../SampleManager";
import {IColumnVisibilityDef} from "../../../shared/components/columnVisibilityControls/ColumnVisibilityControls";
import VAFLineChart from "./VAFLineChart";
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";
import PatientViewMutationsDataStore from "./PatientViewMutationsDataStore";
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import ReactSelect from "react-select";
import MutationOncoprint from "./oncoprint/MutationOncoprint";
import DownloadControls from "../../../public-lib/components/downloadControls/DownloadControls";
import LabeledCheckbox from "../../../shared/components/labeledCheckbox/LabeledCheckbox";
import PatientViewMutationTable from "./PatientViewMutationTable";

export interface IPatientViewMutationsTabProps {
    store:PatientViewPageStore;
    mutationTableColumnVisibility?:{[columnId: string]: boolean};
    onMutationTableColumnVisibilityToggled:(columnId: string, columnVisibility?: IColumnVisibilityDef[]) => void;
    sampleManager:SampleManager|null;
}

const DROPDOWN_STYLES = {
    control: (provided:any)=>({
        ...provided,
        height:36,
        minHeight:36,
        border: "1px solid rgb(204,204,204)"
    }),
    menu: (provided:any)=>({
        ...provided,
        maxHeight: 400
    }),
    menuList: (provided:any)=>({
        ...provided,
        maxHeight:400
    }),
    placeholder:(provided:any)=>({
        ...provided,
        color: "#000000"
    }),
    dropdownIndicator:(provided:any)=>({
        ...provided,
        color:"#000000"
    }),
    option:(provided:any, state:any)=>{
        return {
            ...provided,
            cursor:"pointer",
        };
    }
};

const DROPDOWN_THEME = (theme:any)=>({
    ...theme,
    colors: {
        ...theme.colors,
        neutral80:"black",
        //primary: theme.colors.primary50
    },
});

enum PlotTab {
    LINE_CHART="lineChart",
    HEATMAP="heatmap"
}

export const LOCAL_STORAGE_PLOT_TAB_KEY = "patient_view_mutations_tab__vaf_plot_choice";

@observer
export default class PatientViewMutationsTab extends React.Component<IPatientViewMutationsTabProps, {}> {
    private dataStore = new PatientViewMutationsDataStore(()=>this.props.store.mergedMutationDataIncludingUncalled);
    private vafLineChartSvg:SVGElement|null = null;
    @observable vafLineChartLogScale = false;
    // TODO: replace this with URL stuff
    @observable private _plotTab = localStorage.getItem(LOCAL_STORAGE_PLOT_TAB_KEY) || PlotTab.LINE_CHART;

    @computed get plotTab() {
        return this._plotTab;
    }

    @autobind
    @action
    private setPlotTab(id:PlotTab) {
        this._plotTab = id;
        localStorage.setItem(LOCAL_STORAGE_PLOT_TAB_KEY, id);
    }

    @autobind
    private vafLineChartSvgRef(elt:SVGElement|null) {
        this.vafLineChartSvg = elt;
    }

    readonly vafLineChart = MakeMobxView({
        await:()=>[
            this.props.store.coverageInformation,
            this.props.store.samples,
            this.props.store.mutationMolecularProfileId
        ],
        renderPending:()=><LoadingIndicator isLoading={true} size="small"/>,
        render:()=>(
            <div>
                <div style={{display:"flex", alignItems:"center", marginBottom:5}}>
                    <LabeledCheckbox
                        checked={this.dataStore.onlyShowHighlightedInVAFChart}
                        onChange={()=>this.dataStore.setOnlyShowHighlightedInVAFChart(!this.dataStore.onlyShowHighlightedInVAFChart)}
                        labelProps={{style:{ marginRight:10}}}
                    >
                        <span style={{marginTop:-3}}>Show only highlighted mutations</span>
                    </LabeledCheckbox>
                    <LabeledCheckbox
                        checked={this.vafLineChartLogScale}
                        onChange={()=>{ this.vafLineChartLogScale = !this.vafLineChartLogScale; }}
                        labelProps={{style:{ marginRight:10}}}
                    >
                        <span style={{marginTop:-3}}>Log scale</span>
                    </LabeledCheckbox>
                    <DownloadControls
                        filename="vafHeatmap"
                        getSvg={()=>this.vafLineChartSvg}
                        buttons={["SVG", "PNG", "PDF"]}
                        type="button"
                        dontFade
                    />
                </div>
                <VAFLineChart
                    mutations={this.props.store.mergedMutationDataIncludingUncalled}
                    dataStore={this.dataStore}
                    samples={this.props.store.samples.result!}
                    coverageInformation={this.props.store.coverageInformation.result!}
                    mutationProfileId={this.props.store.mutationMolecularProfileId.result!}
                    sampleManager={this.props.sampleManager}
                    svgRef={this.vafLineChartSvgRef}
                    logScale={this.vafLineChartLogScale}
                />
            </div>
        ),
        showLastRenderWhenPending:true
    });

    @autobind
    private onTableRowClick(d:Mutation[]) {
        if (d.length) {
            this.dataStore.toggleHighlightedMutation(d[0]);
        }
    }
    @autobind
    private onTableRowMouseEnter(d:Mutation[]) {
        if (d.length) {
            this.dataStore.setMouseOverMutation(d[0]);
        }
    }
    @autobind
    private onTableRowMouseLeave() {
        this.dataStore.setMouseOverMutation(null);
    }

    private highlightedInTableOptions:{[value:string]:{label:string, value:boolean}} = {
        "true": {
            label: "Only show highlighted mutations in table",
            value: true
        },
        "false": {
            label: "Show all mutations in table",
            value: false
        }
    };

    readonly table = MakeMobxView({
        await:()=>[
            this.props.store.mutationData,
            this.props.store.uncalledMutationData,
            this.props.store.oncoKbAnnotatedGenes,
            this.props.store.studyIdToStudy,
            this.props.store.sampleToMutationGenePanelId,
            this.props.store.genePanelIdToEntrezGeneIds
        ],
        renderPending:()=><LoadingIndicator isLoading={true} size="small"/>,
        render:()=>(
            <div>
                <div style={{ width: 314, float: "left", marginRight: 15, marginTop: -6 }} >
                    <ReactSelect
                        name="select whether table filters out non-highlighted mutations"
                        onChange={(option:any|null)=>{
                            if (option) {
                                this.dataStore.setOnlyShowHighlightedInTable(option.value);
                            }
                        }}
                        options={[this.highlightedInTableOptions.true, this.highlightedInTableOptions.false]}
                        clearable={false}
                        searchable={false}
                        value={this.highlightedInTableOptions[this.dataStore.onlyShowHighlightedInTable.toString()]}
                        styles={DROPDOWN_STYLES}
                        theme={DROPDOWN_THEME}
                    />
                </div>
                <PatientViewMutationTable
                    dataStore={this.dataStore}
                    currentGeneFilter={this.props.store.mutationTableGeneFilterOption}
                    onRowClick={this.onTableRowClick}
                    onRowMouseEnter={this.onTableRowMouseEnter}
                    onRowMouseLeave={this.onTableRowMouseLeave}
                    studyIdToStudy={this.props.store.studyIdToStudy.result!}
                    sampleManager={this.props.sampleManager}
                    sampleIds={this.props.sampleManager ? this.props.sampleManager.getSampleIdsInOrder() : []}
                    uniqueSampleKeyToTumorType={this.props.store.uniqueSampleKeyToTumorType}
                    molecularProfileIdToMolecularProfile={this.props.store.molecularProfileIdToMolecularProfile.result}
                    variantCountCache={this.props.store.variantCountCache}
                    indexedVariantAnnotations={this.props.store.indexedVariantAnnotations}
                    discreteCNACache={this.props.store.discreteCNACache}
                    mrnaExprRankCache={this.props.store.mrnaExprRankCache}
                    oncoKbEvidenceCache={this.props.store.oncoKbEvidenceCache}
                    pubMedCache={this.props.store.pubMedCache}
                    genomeNexusCache={this.props.store.genomeNexusCache}
                    genomeNexusMyVariantInfoCache={this.props.store.genomeNexusMyVariantInfoCache}
                    mrnaExprRankMolecularProfileId={this.props.store.mrnaRankMolecularProfileId.result || undefined}
                    discreteCNAMolecularProfileId={this.props.store.molecularProfileIdDiscrete.result}
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
                    enableFunctionalImpact={AppConfig.serverConfig.show_genomenexus}
                    enableHotspot={AppConfig.serverConfig.show_hotspot}
                    enableMyCancerGenome={AppConfig.serverConfig.mycancergenome_show}
                    enableCivic={AppConfig.serverConfig.show_civic}
                    columnVisibility={this.props.mutationTableColumnVisibility}
                    columnVisibilityProps={{
                        onColumnToggled: this.props.onMutationTableColumnVisibilityToggled
                    }}
                    sampleToGenePanelId={this.props.store.sampleToMutationGenePanelId.result!}
                    genePanelIdToEntrezGeneIds={this.props.store.genePanelIdToEntrezGeneIds.result!}
                />
            </div>
        )
    });
    render() {
        return (
            <div>
                <MSKTabs
                    activeTabId={this.plotTab}
                    onTabClick={this.setPlotTab}
                    className="secondaryNavigation vafVizNavTabs"
                    unmountOnHide={false}
                >
                    <MSKTab id={PlotTab.LINE_CHART} linkText="Line Chart">
                        <div style={{marginBottom:25}}>
                            {this.vafLineChart.component}
                        </div>
                    </MSKTab>
                    <MSKTab id={PlotTab.HEATMAP} linkText="Heatmap">
                        <MutationOncoprint store={this.props.store} dataStore={this.dataStore} sampleManager={this.props.sampleManager}/>
                    </MSKTab>
                </MSKTabs>
                <div style={{marginTop:30}}>
                    {this.table.component}
                </div>
            </div>
        );
    }
}