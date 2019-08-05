import * as React from "react";
import {observer} from "mobx-react";
import {MakeMobxView} from "../../../shared/components/MobxView";
import LoadingIndicator from "../../../shared/components/loadingIndicator/LoadingIndicator";
import PatientViewSelectableMutationTable from "./PatientViewSelectableMutationTable";
import {ServerConfigHelpers} from "../../../config/config";
import AppConfig from "appConfig";
import {MSKTab} from "../../../shared/components/MSKTabs/MSKTabs";
import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";
import PatientViewPage from "../PatientViewPage";
import SampleManager from "../sampleManager";
import {IColumnVisibilityDef} from "../../../shared/components/columnVisibilityControls/ColumnVisibilityControls";
import ErrorMessage from "../../../shared/components/ErrorMessage";
import VAFLineChart from "./VAFLineChart";
import {computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {remoteData} from "../../../public-lib";
import PatientViewMutationsDataStore from "./PatientViewMutationsDataStore";
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";

export interface IPatientViewMutationsTabProps {
    store:PatientViewPageStore;
    mutationTableColumnVisibility?:{[columnId: string]: boolean};
    onMutationTableColumnVisibilityToggled:(columnId: string, columnVisibility?: IColumnVisibilityDef[]) => void;
    sampleManager:SampleManager|null;
}

@observer
export default class PatientViewMutationsTab extends React.Component<IPatientViewMutationsTabProps, {}> {
    private dataStore = new PatientViewMutationsDataStore(()=>this.props.store.mergedMutationDataIncludingUncalled);
    @observable.ref mutationsTable:PatientViewSelectableMutationTable|null = null;

    @autobind
    private tableRef(t:PatientViewSelectableMutationTable|null) {
        this.mutationsTable = t;
    }

    readonly selectedMutations = remoteData({
        await:()=>[this.props.store.mutationData, this.props.store.uncalledMutationData],
        invoke:()=>{
            if (!this.mutationsTable || this.mutationsTable.selectedMutations.length === 0) {
                return Promise.resolve(this.props.store.mergedMutationDataIncludingUncalled);
            } else {
                return Promise.resolve(this.mutationsTable.selectedMutations);
            }
        }
    });

    readonly vafLineChart = MakeMobxView({
        await:()=>[
            this.props.store.coverageInformation,
            this.selectedMutations,
            this.props.store.samples,
            this.props.store.mutationMolecularProfileId
        ],
        renderPending:()=><LoadingIndicator isLoading={true} size="small"/>,
        render:()=>(
            this.props.store.samples.result!.length > 1 ?
                (<VAFLineChart
                    mutations={this.selectedMutations.result!}
                    dataStore={this.dataStore}
                    samples={this.props.store.samples.result!}
                    coverageInformation={this.props.store.coverageInformation.result!}
                    mutationProfileId={this.props.store.mutationMolecularProfileId.result!}
                    sampleManager={this.props.sampleManager}
                />) :
                null
        ),
        showLastRenderWhenPending:true
    });

    @autobind
    private onTableRowMouseEnter(d:Mutation[]) {
        if (d.length) {
            this.dataStore.setHighlightModel({
                proteinChange:d[0].proteinChange,
                hugoGeneSymbol:d[0].gene.hugoGeneSymbol
            });
        }
    }
    @autobind
    private onTableRowMouseLeave() {
        this.dataStore.setHighlightModel(null);
    }

    readonly table = MakeMobxView({
        await:()=>[
            this.props.store.mutationData,
            this.props.store.uncalledMutationData,
            this.props.store.oncoKbAnnotatedGenes,
            this.props.store.studyIdToStudy
        ],
        renderPending:()=><LoadingIndicator isLoading={true} size="small"/>,
        render:()=>(
            <PatientViewSelectableMutationTable
                ref={this.tableRef}
                dataStore={this.dataStore}
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
                data={this.props.store.mergedMutationDataIncludingUncalled}
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
            />
        )
    });
    render() {
        return (
            <div>
                <div style={{marginBottom:25}}>
                    {this.vafLineChart.component}
                </div>
                {this.table.component}
            </div>
        );
    }
}