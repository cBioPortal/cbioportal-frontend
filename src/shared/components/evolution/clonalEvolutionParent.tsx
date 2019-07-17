import * as React from "react";
import {computed} from "mobx";
import {observer} from "mobx-react";

import TreePlot from "./treePlot"

import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {default as PatientViewMutationTable} from "../../../pages/patientView/mutation/PatientViewMutationTable";
import {parseCohortIds, PatientViewPageStore} from "../../../pages/patientView/clinicalInformation/PatientViewPageStore";


export default class ClonalEvolutionParent extends React.Component<PatientViewPageStore> {
    constructor(props) {
        super(props);
        this.state = {
            selectedMutationClusterId: Number;
        };
    }



    render() {
        return(
            <div className="evolution">
            <TreePlot/>
            <PatientViewMutationTable
                studyIdToStudy={patientViewPageStore.studyIdToStudy.result}
                sampleManager={sampleManager}
                sampleIds={sampleManager ? sampleManager.getSampleIdsInOrder() : []}
                uniqueSampleKeyToTumorType={patientViewPageStore.uniqueSampleKeyToTumorType}
                molecularProfileIdToMolecularProfile={patientViewPageStore.molecularProfileIdToMolecularProfile.result}
                variantCountCache={patientViewPageStore.variantCountCache}
                indexedVariantAnnotations={patientViewPageStore.indexedVariantAnnotations}
                discreteCNACache={patientViewPageStore.discreteCNACache}
                mrnaExprRankCache={patientViewPageStore.mrnaExprRankCache}
                oncoKbEvidenceCache={patientViewPageStore.oncoKbEvidenceCache}
                pubMedCache={patientViewPageStore.pubMedCache}
                genomeNexusCache={patientViewPageStore.genomeNexusCache}
                mrnaExprRankMolecularProfileId={patientViewPageStore.mrnaRankMolecularProfileId.result || undefined}
                discreteCNAMolecularProfileId={patientViewPageStore.molecularProfileIdDiscrete.result}
                data={patientViewPageStore.mergedMutationDataIncludingUncalled}
                downloadDataFetcher={patientViewPageStore.downloadDataFetcher}
                mutSigData={patientViewPageStore.mutSigData.result}
                myCancerGenomeData={patientViewPageStore.myCancerGenomeData}
                hotspotData={patientViewPageStore.indexedHotspotData}
                cosmicData={patientViewPageStore.cosmicData.result}
                oncoKbData={patientViewPageStore.oncoKbData}
                oncoKbCancerGenes={patientViewPageStore.oncoKbCancerGenes}
                civicGenes={patientViewPageStore.civicGenes}
                civicVariants={patientViewPageStore.civicVariants}
                userEmailAddress={ServerConfigHelpers.getUserEmailAddress()}
                enableOncoKb={AppConfig.serverConfig.show_oncokb}
                enableFunctionalImpact={AppConfig.serverConfig.show_genomenexus}
                enableHotspot={AppConfig.serverConfig.show_hotspot}
                enableMyCancerGenome={AppConfig.serverConfig.mycancergenome_show}
                enableCivic={AppConfig.serverConfig.show_civic}
                columnVisibility={this.mutationTableColumnVisibility}
                columnVisibilityProps={{
                    onColumnToggled: this.onMutationTableColumnVisibilityToggled
                }}
                />
            </div>
        )
    }
}


