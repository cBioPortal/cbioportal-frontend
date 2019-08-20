import * as React from "react";
import * as _ from "lodash";
import $ from "jquery";
import {computed} from "mobx";
import {observer} from "mobx-react";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {default as PatientViewMutationTable} from "../../../pages/patientView/mutation/PatientViewMutationTable";
import {parseCohortIds, PatientViewPageStore} from "../../../pages/patientView/clinicalInformation/PatientViewPageStore";
import {CancerStudy, MolecularProfile, Mutation} from "shared/api/generated/CBioPortalAPI";
import { 
    IPatientViewMutationTableProps 
} from "../../../pages/patientView/mutation/PatientViewMutationTable";
import SampleManager from "../../../pages/patientView/sampleManager";
import {drawTreePlot} from "./plotTree";
import * as d3 from 'd3';

import TreePlot from "./treePlot"
import LinePlot from "./plotLine"

const s = require('./clonalEvolutionParent.scss');

export interface IPatientViewEvolutionMutationTableProps extends IPatientViewMutationTableProps {
    sampleManager: SampleManager;
    columnVisibility: {[columnId: string]: boolean}|undefined;
}

export interface ISummrizedMutTable {
	mutClusterCCF: {sampleId: string, mutClusterId: string, CCF: number}[]; 
	mutClusterSize: {[key:string]: number};
}

function summaryCCF(
	data: Mutation[][] | undefined, 
	sampleIds: string[] | undefined, 
	mutClusterNum: number
): ISummrizedMutTable | undefined {
	if (data) {

		var mutNumber = data.length;
		var summarizedCCF: {[key:string]: {[key:string] : number[]}} = {};
		var mutClusterSize: {[key:string]: number } = {};
		var sampleNum = sampleIds ? sampleIds.length : 0;

		for (var j=0; j<sampleNum; j++) {
			var sampleId = sampleIds ? sampleIds[j] : "";
			summarizedCCF[sampleId] = {};
			for (var i=0; i<data.length; i++) {
				var mutClusterId:string = data[i][0].clusterId.toString();
				mutClusterSize[mutClusterId] = (mutClusterSize[mutClusterId] == undefined) ? 1 : (mutClusterSize[mutClusterId] + 1);
				summarizedCCF[sampleId][mutClusterId] = [];
			}
		}

		for (var i=0; i<data.length; i++) {
			var mutClusterId:string = data[i][0].clusterId.toString();
			for (var j=0; j<data[i].length; j++) {
				var dataPerMutPerSample = data[i][j];
				var sampleId = dataPerMutPerSample.sampleId,
					CCF = dataPerMutPerSample.CCF;
				summarizedCCF[sampleId][mutClusterId].push(CCF);
			}
		}

		var mutClusterSizeArray: {mutClusterId: string, size: number}[] = [];
		var sampleIdKey: string;
		for (sampleIdKey in mutClusterSize) {
			mutClusterSizeArray.push({
				mutClusterId: sampleIdKey,
				size: mutClusterSize[sampleIdKey]
			});
		}

		mutClusterSizeArray.sort(function(x, y) {
			if (x.size == y.size) return 0;
			else if (x.size < y.size) return 1;
			else return -1;
		})

		var filtertedMutClusterSize: {[key:string]: number } = {};
		var filtertedCluster:string[] = [];
		for (var i=0; i<mutClusterNum; i++) {
			filtertedMutClusterSize[mutClusterSizeArray[i].mutClusterId] = mutClusterSizeArray[i].size;
			filtertedCluster.push(mutClusterSizeArray[i].mutClusterId);
		}

		var sampleIdKey: string,
			mutClusterIdKey: string,
			mutClusterCCF: {sampleId: string, mutClusterId: string, CCF: number}[] = [];
		for (sampleIdKey in summarizedCCF) {
			for (var i=0; i<filtertedCluster.length; i++) {
				mutClusterIdKey = filtertedCluster[i];
				var CCFarray = summarizedCCF[sampleIdKey][mutClusterIdKey],
					meanCCF = 0;
				for (var j=0; j<CCFarray.length; j++) {
					meanCCF += CCFarray[j];
				}
				meanCCF = meanCCF / filtertedMutClusterSize[mutClusterIdKey] * sampleIds.length;
				mutClusterCCF.push({
					sampleId: sampleIdKey, 
					mutClusterId: mutClusterIdKey, 
					CCF: meanCCF
				})
			}
		}

		return({
			mutClusterCCF: mutClusterCCF,
			mutClusterSize: filtertedMutClusterSize
		});
	}
}

function findParent(sortedMutClusterCCF: {sampleId: string, mutClusterId: string, CCF: number, parent: string, remain: number}[], currentClusterIndex: number) {

	for (var i=0; i<sortedMutClusterCCF.length; i++) {
		if (i != currentClusterIndex) {
			if (sortedMutClusterCCF[i].remain >= sortedMutClusterCCF[currentClusterIndex].CCF) {
				sortedMutClusterCCF[i].remain -= sortedMutClusterCCF[currentClusterIndex].CCF;
				sortedMutClusterCCF[currentClusterIndex]['parent'] = sortedMutClusterCCF[i].mutClusterId;
			}
		}
	}
	return sortedMutClusterCCF;
}

function orderClonal(mutData: any, sampleId: string) {

	var mutClusterCCF = mutData.mutClusterCCF.filter(function(x: any) { return x.sampleId == sampleId });
	var thresholdCCF = 0.05;
	var sortedMutClusterCCF = mutClusterCCF.filter(function(x: any) {
		return x.CCF > thresholdCCF;
	}).sort(function(x: any, y: any){
		return y.CCF - x.CCF;
	});

	for (var i=0; i<sortedMutClusterCCF.length; i++) {
		sortedMutClusterCCF[i]['remain'] = sortedMutClusterCCF[i].CCF;
	}

	sortedMutClusterCCF[0]['parent'] = "-1";

	for (var i=1; i<sortedMutClusterCCF.length; i++) {
		sortedMutClusterCCF = findParent(sortedMutClusterCCF, i);
	}
	return sortedMutClusterCCF;
}

function findConsensusOrdering(orderedClonalPerSample: any, mutClusterSize: any) {

	var orderClonesHash: {[key:string]: string} = {}

	for (var i=0; i<orderedClonalPerSample.length; i++) {
		for (var j=0; j<orderedClonalPerSample[i].length; j++) {
			var mutClusterId : string = orderedClonalPerSample[i][j].mutClusterId,
				parent : string = orderedClonalPerSample[i][j].parent;
			if (!orderClonesHash[mutClusterId]) {
				orderClonesHash[mutClusterId] = parent;
			} else if (orderClonesHash[mutClusterId] != parent) {
				return [];
			}
		}
	}

	var mutClusterId: string;
	var treeTable = [];
	for (mutClusterId in orderClonesHash) {
		treeTable.push({
			clusterId: mutClusterId, 
			parent: orderClonesHash[mutClusterId], 
			blengths: Math.sqrt(mutClusterSize[mutClusterId])
		});
	}

	return treeTable;
}

export default class ClonalEvolutionParent extends React.Component<IPatientViewEvolutionMutationTableProps, {selectedMutationClusterId: string, selectedMutClusterNum: number}> {
	constructor(props:IPatientViewEvolutionMutationTableProps) {

		super(props);

		this.state = {
			// TODO binding the setState to button
			selectedMutationClusterId: "-1",
			selectedMutClusterNum: 5
		};
	}

    handleClick4Tree(currentSelectedMutationClusterId: string) {
        const previousSelectedMutationClusterId = this.state.selectedMutationClusterId;
        if (previousSelectedMutationClusterId === currentSelectedMutationClusterId) {
            // remove filter;
            this.setState({selectedMutationClusterId: "-1"});
        } else {
            // add filter
            this.setState({selectedMutationClusterId: currentSelectedMutationClusterId});
        }
    }

	handleChange4ClusterNum() {
		var mutClusterNum = Number($(".clusterNumRange input.slider")[0].value);
		this.setState({
			selectedMutClusterNum: mutClusterNum
		});
    }



    // TODO: Is this object possible to be undefined? Does it matter?

    public render() {
        const evolutionMutationDataStoreFiltered:Mutation[][] | undefined = this.state.selectedMutationClusterId === "-1" ? this.props.data : this.props.data.filter((mutationPerPerson) => {return mutationPerPerson[0].clusterId == this.state.selectedMutationClusterId}); 

		const mutData4LinePlot = summaryCCF(this.props.data, this.props.sampleIds, this.state.selectedMutClusterNum);

		var orderedClonalPerSample = [];
		for (var i=0; i<this.props.sampleIds.length; i++) {
			orderedClonalPerSample.push( orderClonal(mutData4LinePlot, this.props.sampleIds[i]));
		}

		const treeTable = findConsensusOrdering(orderedClonalPerSample, mutData4LinePlot.mutClusterSize);

        return(
            <div className="evolution">
			<div className="visulization">
				<LinePlot
					mutClusterNum={this.state.selectedMutClusterNum}
					sampleIds={this.props.sampleIds}
					mutData={mutData4LinePlot}
					setMutClusterNum={() => this.handleChange4ClusterNum()}
				/>

				<TreePlot
					selectNode={(currentSelectedMutationClusterId: string) => this.handleClick4Tree(currentSelectedMutationClusterId)}
					treeData={treeTable}
					height={280}
					width={500}
					margin={20}
				/>
			</div>
			<div></div>

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


