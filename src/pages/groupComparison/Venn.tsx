import * as React from 'react';
import { observer } from "mobx-react";
import * as d3 from 'd3';
import autobind from 'autobind-decorator';
import { COLORS } from 'pages/studyView/StudyViewUtils';
const venn = require('venn.js');

export interface IVennProps {
    sets: {
        sets: string[];
        color?: string;
        count:number; //represents the real intersection count
        size:number; //represents the size of intersection visually
    }[],
    id: string
}

@observer
export default class Venn extends React.Component<IVennProps, {}> {

    constructor(props: IVennProps, context: any) {
        super(props, context);
    }

    componentDidMount() {
        this.createVennDiagram()
    }

    componentDidUpdate() {
        this.createVennDiagram()
    }

    @autobind
    private createVennDiagram() {

        let vennDiagram = venn.VennDiagram();
        vennDiagram.width(400);
        vennDiagram.height(300);
        vennDiagram.padding(5);
        vennDiagram.fontSize('14px');

        let vennDiagramDiv = d3.select(`#${this.props.id}`)
        vennDiagramDiv.datum(this.props.sets).call(vennDiagram);

        vennDiagramDiv.selectAll(".venn-circle path")
            .style("fill-opacity", .8)
            .style("fill", function (d: any, i: number) { return d.color; });

        vennDiagramDiv.selectAll("text")
            .style("fill", "black")

        vennDiagramDiv.selectAll("text").each(function (d: any, i: any) {
            d3.select(this).text(function (d: any, i: any) { return d.count > 0 ? d.count : ''; });
        });

        vennDiagramDiv.selectAll("path")
            .style("stroke-opacity", 0)
            .style("stroke", "#fff")
            .style("stroke-width", 3);

        vennDiagramDiv.selectAll("g")
            .on("mouseover", function (d: any, i: any) {
                // highlight the current path
                d3.select(this)
                    .select("path")
                    .style("fill-opacity", d.sets.length == 1 ? .4 : .1)
                    .style("stroke-opacity", 1);
            })
            .on("mouseout", function (d: any, i: any) {
                d3.select(this)
                    .select("path")
                    .style("fill-opacity", d.sets.length == 1 ? .8 : .0)
                    .style("stroke-opacity", 0);
            });

    }

    public render() {
        return (<div id={this.props.id}></div>)
    }
}
