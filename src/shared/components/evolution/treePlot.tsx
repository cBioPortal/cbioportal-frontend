import * as React from "react";
import {computed} from "mobx";
import {observer} from "mobx-react";
import * as d3 from 'd3';
import $ from "jquery";

interface Inode {
    clusterId: string;
    x: number; 
    y: number;
};


// load the svg used as placeholder
const demoSvg = require("./demo.svg") as string;

export interface ItreeNode {
    clusterId: string;
    parent: string;
    blengths: number;
    sample: [{string: string}];
}

function findChildOf(clusterId:string, treeTable:Array<ItreeNode>): Array<string> {
    return treeTable.filter(function(cluster: ItreeNode) {
        return cluster.parent == clusterId;
    }).map(function(cluster: ItreeNode) {
        return cluster.clusterId
    })
}

function getNodeCoord(nodes:[Inode], nodeId:string): {x: number, y: number} {
    var node = nodes.filter(function(x) { return x.clusterId == nodeId})[0];
    return {x: node.x, y: node.y};
}

function getCoordination(treeTable: Array<ItreeNode>) {

    // Parsing the tree 
    var tree = [];

    // TODO: make a API
    const length_factor = 7;

    tree.push({parentNode: "-1", childNode: findChildOf("-1", treeTable)});

    var completed = false;
    var currentParentsIndex = 0;

    while (!completed && currentParentsIndex < 100) {
        var newParents = tree[currentParentsIndex].childNode;
        if (currentParentsIndex == tree.length - 1 && newParents.length == 0) {
            completed = true;
        }
        for (var i in newParents) {
            var newParent: string = newParents[i];
            var newChild = findChildOf(newParent, treeTable);
            tree.push({parentNode: newParent, childNode: newChild});
            if (newChild.length > 0) completed = false;
        }
        currentParentsIndex++;
    }

    // Get nodes coordination
    var nodes:[Inode] = [{clusterId: "-1", x: 0, y: 0}];
    const pi = Math.PI;

    var angleList: Array<Array<number>> = [
        [0],
        [pi / 4, -pi / 4],
        [0, pi / 6, -pi / 6],
        [pi / 12, -pi / 12, pi / 6, -pi / 6],
        [0, pi / 12, -pi / 12, pi / 12, -pi / 12]
    ];

    
    for (i in tree) {
        var childs = tree[i].childNode;
        var childNum = childs.length;
        if (childNum > 0) {
            var parentId = tree[i].parentNode;
            var sign = 1;
            for (var j:number = 0; j < childs.length; j++) {
                var angle: Array<number> = angleList[childs.length - 1];
                var blength = treeTable.filter(function(x:ItreeNode) { return x.clusterId == childs[j] })[0].blengths;
                var parentCoord = getNodeCoord(nodes, tree[i].parentNode);
                var x = parentCoord.x + length_factor * blength * Math.cos(angle[j]);
                var y = parentCoord.y + length_factor * blength * Math.sin(angle[j]);

                nodes.push({clusterId: childs[j], x: x, y: y });
            }
        } 
    }


    // Get edges coordination
    interface Iedge {
        start: string;
        end: string;
        edgeId: string;
        xStart: number;
        yStart: number;
        xEnd: number;
        yEnd: number;
    }

    var edges: Array<Iedge> = []; //= [{edgeId: "1", xStart: 0, yStart: 0, xEnd: 0, yEnd: 0}];
    for (i in treeTable) {
        var start = treeTable[i].parent,
            end = treeTable[i].clusterId;

        var    coordStart = getNodeCoord(nodes, start),
            coordEnd = getNodeCoord(nodes, end);

        edges.push({
            edgeId: i,
            start: start,
            end: end,
            xStart: coordStart.x,
            yStart: coordStart.y,
            xEnd: coordEnd.x,
            yEnd: coordEnd.y
        });
    }

    return {nodes: nodes, edges: edges};
}

function getColor(i:number, colorList:Array<string>) {
    return colorList[i % colorList.length];
}


export default class TreePlot extends React.Component<{treeData: any, height: number, width: number, margin: number, selectNode: any}> {
    // load the tree plot svg
    // In this commit: using "Button" to represent the node in the tree
	constructor(props:any) {
		super(props)
	}

    ref: SVGSVGElement;
    componentDidMount() {
		this.drawTreePlot(this.props.treeData, this.props.height, this.props.width, this.props.margin);
    }
	componentDidUpdate() {
		this.drawTreePlot(this.props.treeData, this.props.height, this.props.width, this.props.margin);
	}

    drawTreePlot(treeTable:Array<ItreeNode>, height:number, width:number, margin:number) {

        // Create svg canvas
        d3.select(this.ref).select('g').remove();
        var svg = d3.select(this.ref)
            .attr('width', width)
            .attr('height', height)
            .append('g');

        // The node radius
        const r = 5;

        // Parsing the tree 
        var tree = [];

        // Get location
        var coordination = getCoordination(treeTable);
        var edges = coordination.edges;
        var nodes = coordination.nodes;


        // Draw edges

        var edgeColors = ["#6699CC", "#663366", "#CCCC99", "#996699", "#CCCC99", "#669999", "#996699", "#9999CC", "#CCCCFF"];

        for (var i=0; i<coordination.edges.length; i++) {
            svg.append('g')
                .attr("transform", "translate(" + margin +"," + height / 2 + ")")
                .attr('class', 'line')
                .append('line')
                .attr('x1', edges[i].xStart)
                .attr('x2', edges[i].xEnd)
                .attr('y1', edges[i].yStart)
                .attr('y2', edges[i].yEnd)
                .attr("stroke-width", 7)
                .attr("stroke", getColor(Number(edges[i].end), edgeColors))
                .attr('clusterId', edges[i].end)
                .on("click", edgeHandleMouseClick)
                .on("mouseover", edgeHandleMouseOver)
                .on("mouseout", edgeHandleMouseOut)
        }

        // Draw the node
        for (var i=0; i<nodes.length; i++) {
            svg.append('circle')
                .attr("transform", "translate(" + margin + "," + height / 2 + ")")
                .attr("class", i)
                .attr("cx", nodes[i].x)
                .attr('cy', nodes[i].y)
                .attr('r', r)
                .style('fill', '#6699CC')
                .on("mouseover", edgeHandleMouseOver)
                .on("mouseout", edgeHandleMouseOut)
        }


        // Mouse Over events
        const selectNode = this.props.selectNode;

        function edgeHandleMouseClick() {
            const class_name = $(this).attr("clusterId");
            selectNode(class_name);
//             $(this).addClass("treeEdgeSelected");
			$(".mutClusterLinePlot #linePlotMutClusterId_" + class_name + " path").toggleClass("linePlotSelected");
		}
            // $(`tr.${class_name}`).css({ background: 'red' });

        function edgeHandleMouseOver() {
			const class_name = $(this).attr("clusterId");
            $(this).addClass("treeEdgeSelected");
			$(".mutClusterLinePlot #linePlotMutClusterId_" + class_name + " path").addClass("linePlotMouseOver");
            // $(`tr.${class_name}`).css({ background: 'red' });
        }


        function edgeHandleMouseOut() {
			const class_name = $(this).attr("clusterId");
            $(this).removeClass("treeEdgeSelected");
			$(".mutClusterLinePlot #linePlotMutClusterId_" + class_name + " path").removeClass("linePlotMouseOver");
            // const class_name = $(this).attr('id');
            // $(`tr.${class_name}`).css({ background: 'white' });
        }
    }

	render() {
        return(
		<div className="treePlot">
			<div className="demoTree">
				<svg className="container" ref={(ref: SVGSVGElement) => this.ref = ref}></svg>
			</div>
			<div className="popUp">
			</div>
		</div>
        )
    }
}


