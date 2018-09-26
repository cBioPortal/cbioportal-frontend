import * as React from "react";
import {observer} from "mobx-react";
import {VictoryAxis, VictoryPie, VictoryChart, VictoryLabel, VictoryScatter, VictorySelectionContainer} from "victory";
import {computed} from "mobx";
import {Group} from "pages/studyView/StudyViewPageStore";
import {If} from 'react-if';
import * as d3 from 'd3';
const venn = require('venn.js');

export interface IVennDiagramProps {
    data?: Group[];
}

@observer
export default class VennDiagram extends React.Component<IVennDiagramProps, {}> {
    private sets = [ {sets: ['A'], size: 24},
        {sets: ['B'], size: 24},
        {sets: ['C'], size: 24},
        // {sets: ['D'], size: 24},
        {sets: ['A','B'], size: 2},
        {sets: ['A','C'], size: 2},
        // {sets: ['A','D'], size: 2},
        {sets: ['B','C'], size: 2},
        // {sets: ['B','D'], size: 2},
        // {sets: ['C','D'], size: 2},
        // {sets: ['A','B', 'C'], size: 2},
        // {sets: ['B','C', 'D'], size: 2},
        // {sets: ['A','C', 'D'], size: 2},
        // {sets: ['A','B', 'D'], size: 2},
        // {sets: ['A','B', 'C', 'D'], size: 2},
    ];

    constructor(props: IVennDiagramProps, context: any) {
        super(props, context);
    }

    componentDidMount() {
        let chart1 = venn.VennDiagram()
        let chart2 = venn.VennDiagram();
        d3.select("#sampleVennDiagram").datum(this.sets).call(chart1);
        d3.select("#patientVennDiagram").datum(this.sets).call(chart2);
    }

    public render() {
        return (<div style={{display: 'flex'}}>
            <div style={{alignItems:'center', display:'flex', flexDirection:'column'}}>
                <span>Sample Overlap</span>
                <div id='sampleVennDiagram'></div>
            </div>
            <div style={{alignItems:'center', display:'flex', flexDirection:'column'}}>
                <span>Patient Overlap</span>
                <div id='patientVennDiagram'></div>
            </div>
        </div>)
    }
}