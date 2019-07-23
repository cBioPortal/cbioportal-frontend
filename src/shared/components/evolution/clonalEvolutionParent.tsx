import * as React from "react";
import * as _ from "lodash";
import $ from "jquery";
import {computed} from "mobx";
import {observer} from "mobx-react";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {default as PatientViewMutationTable} from "../../../pages/patientView/mutation/PatientViewMutationTable";
import {parseCohortIds, PatientViewPageStore} from "../../../pages/patientView/clinicalInformation/PatientViewPageStore";
import { 
    IPatientViewMutationTableProps 
} from "../../../pages/patientView/mutation/PatientViewMutationTable";
import SampleManager from "../../../pages/patientView/sampleManager";
import {drawTreePlot} from "./plotTree";
import * as d3 from 'd3';

import TreePlot from "./treePlot"

// load the treeJson
const treeJson = require("./tree4test.json") as string;


export interface IPatientViewEvolutionMutationTableProps extends IPatientViewMutationTableProps {
    sampleManager: SampleManager;
    columnVisibility: {[columnId: string]: boolean}|undefined;
}

export default class ClonalEvolutionParent extends React.Component<IPatientViewEvolutionMutationTableProps, {selectedMutationClusterId: number}> {
    constructor(props:IPatientViewEvolutionMutationTableProps) {

        super(props);

        this.state = {
            // TODO binding the setState to button
            selectedMutationClusterId: -1,
        };
    }

    handleClick(currentSelectedMutationClusterId:number) {
        const previousSelectedMutationClusterId = this.state.selectedMutationClusterId;
        if (previousSelectedMutationClusterId === currentSelectedMutationClusterId) {
            // remove filter;
            this.setState({selectedMutationClusterId: -1});
        } else {
            // add filter
            this.setState({selectedMutationClusterId: currentSelectedMutationClusterId});
        }
    }

    // evolutionMutationDataStore = this.props.data;
    // TODO: Is this object possible to be undefined? Does it matter?

    public render() {
        const evolutionMutationDataStoreFiltered = this.state.selectedMutationClusterId === -1 ? this.props.data : this.props.data.filter((mutationPerPerson) => {return mutationPerPerson[0].clusterId == this.state.selectedMutationClusterId}); 
        return(
            <div className="evolution">
            <TreePlot
                selectNode={(currentSelectedMutationClusterId: number) => this.handleClick(currentSelectedMutationClusterId)}
                treeData={treeJson}
                height={300}
                width={500}
                margin={20}
            />
            <PatientViewMutationTable
                studyIdToStudy={this.props.studyIdToStudy}
                sampleManager={this.props.sampleManager}
                sampleIds={this.props.sampleIds}
                uniqueSampleKeyToTumorType={this.props.uniqueSampleKeyToTumorType}
                molecularProfileIdToMolecularProfile={this.props.molecularProfileIdToMolecularProfile}
                variantCountCache={this.props.variantCountCache}
                indexedVariantAnnotations={this.props.indexedVariantAnnotations}
                discreteCNACache={this.props.discreteCNACache}
                mrnaExprRankCache={this.props.mrnaExprRankCache}
                oncoKbEvidenceCache={this.props.oncoKbEvidenceCache}
                pubMedCache={this.props.pubMedCache}
                genomeNexusCache={this.props.genomeNexusCache}
                mrnaExprRankMolecularProfileId={this.props.mrnaExprRankMolecularProfileId}
                discreteCNAMolecularProfileId={this.props.discreteCNAMolecularProfileId}
                data={evolutionMutationDataStoreFiltered}
                downloadDataFetcher={this.props.downloadDataFetcher}
                mutSigData={this.props.mutSigData}
                myCancerGenomeData={this.props.myCancerGenomeData}
                hotspotData={this.props.hotspotData}
                cosmicData={this.props.cosmicData}
                oncoKbData={this.props.oncoKbData}
                oncoKbCancerGenes={this.props.oncoKbCancerGenes}
                civicGenes={this.props.civicGenes}
                civicVariants={this.props.civicVariants}
                userEmailAddress={this.props.userEmailAddress}
                enableOncoKb={this.props.enableOncoKb}
                enableFunctionalImpact={this.props.enableFunctionalImpact}
                enableHotspot={this.props.enableHotspot}
                enableMyCancerGenome={this.props.enableMyCancerGenome}
                enableCivic={this.props.enableCivic}
                columnVisibility={this.props.columnVisibility}
                columnVisibilityProps={this.props.columnVisibilityProps}
                />
            </div>
        )
    }
}


