import * as React from "react";
import {computed} from "mobx";
import {observer} from "mobx-react";
import * as d3 from 'd3';
import $ from "jquery";
import {CancerStudy, MolecularProfile, Mutation} from "shared/api/generated/CBioPortalAPI";

import LineChart from "react-linechart";
import "./plotLine.scss";


var edgeColors = ["#6699CC", "#663366", "#CCCC99", "#996699", "#CCCC99", "#669999", "#996699", "#9999CC", "#CCCCFF"];

function getColor(i:number, colorList:Array<string>) {
    return colorList[i % colorList.length];
}


export default class LinePlot extends React.Component<{mutData: any, sampleIds: string[] | undefined, setMutClusterNum:any, mutClusterNum: number}> {

	constructor(props:any) {
		super(props);
	}


	render() {

		const handleRangeMouseOut =	this.props.setMutClusterNum;

		var mutData = this.props.mutData;
		var sampleNum = this.props.sampleIds ? this.props.sampleIds.length : 0;
		var sampleIdHash: {[key: string]: number} = {};
		for (var i=0; i<sampleNum; i++) {
			var sampleId = this.props.sampleIds ? this.props.sampleIds[i] : "";
			sampleIdHash[sampleId] = i + 1;
		}

		var data: {color: string, points: {x: number, y: number}[], name: string, id: string}[] = [];

		var mutClusterId: string;
		for (mutClusterId in mutData.mutClusterSize) {
			var color = getColor(Number(mutClusterId), edgeColors);
			var mutClusterList = mutData.mutClusterCCF.filter(function(x: any) { return x.mutClusterId == mutClusterId });
			var points:{x: number, y:number}[] = [];
			for (var i=0; i<mutClusterList.length; i++) {
				points.push({x: sampleIdHash[mutClusterList[i].sampleId], y: mutClusterList[i].CCF});
			}
			data.push({color: color, points: points, name: "MutCluster" + mutClusterId, id: "linePlotMutClusterId_" + mutClusterId})
		}

		var xMax = sampleNum + 2;

		return (
			<div className="mutClusterLinePlot">
				<LineChart 
					width={300}
					height={250}
					data={data}
					interpolate={"linear"}
					xMin = {0.8}
					xMax = {xMax}
					yMin = {0}
					yMax = {1}
					xLabel = "Sample"
					yLabel = "Cancer Cell Fraction (CCF)"
					showLegends = {true}
					legendPosition	= {"top-right"}
					margins = {{ top: 50, right: 30, bottom: 40, left: 55 }}
					nameGenerator = {(i:number) => {return("Cluster: " + i)}}
				/>

				<div className="clusterNumRange">
					<p>Mutation Cluster Number: </p>
					<input type='range' min="3" max="7" step="1" defaultValue="5" className="slider" onMouseUp={handleRangeMouseOut}/>
					<div className="sliderticks">
						<p>3</p>
						<p>4</p>
						<p>5</p>
						<p>6</p>
						<p>7</p>
					</div>
				</div>
			</div>				

		);
	}
}

