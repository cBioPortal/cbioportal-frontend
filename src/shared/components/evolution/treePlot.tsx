import * as React from "react";
import {computed} from "mobx";
import {observer} from "mobx-react";
import * as d3 from 'd3';
import $ from "jquery";

// load the treeJson
const treeJson = require("./tree4test.json") as string;

// load the svg used as placeholder
const demoSvg = require("./demo.svg") as string;

export interface TreeNodeProps {
    clusterId: number;
    parent: number;
    blengths: number;
    sample: [{string: string}]
}

function selectMutationClusterInMutationTable(props:any) {
    props
}

export class TreeNode extends React.Component<TreeNodeProps> {
    constructor(props:TreeNodeProps) {
        super(props);
    }

    clusterSelected = 1;
    renderNode(i:TreeNodeProps) {
        return(
            //             <button onClick={() => this.props.onClock(i)}>Cluster{this.props.nodeMutationClusterId}</button>
            <button>Cluster1</button>
        )
    }
}


function findCildOf(clusterId:any, treeTable:any) {
    return treeTable.filter(function(cluster:any) {
        return cluster.parent == clusterId;
    }).map(function(cluster:any) {
        return cluster.clusterId
    })
}


function getCoordination(treeTable:any) {

    // Parsing the tree 
    var tree = [];

    tree.push({parent: "-1", child: findCildOf("-1", treeTable)});

    var completed = false;
    var currentParentsIndex = 0;

    while (!completed && currentParentsIndex < 100) {
        var newParents = tree[currentParentsIndex].child;
        if (currentParentsIndex == tree.length - 1 && newParents.length == 0) {
            completed = true;
        }
        for (var i in newParents) {
            parent = newParents[i];
            var newChild = findCildOf(parent, treeTable);
            tree.push({parent: parent, child: newChild});
            if (newChild.length > 0) completed = false;
        }
        currentParentsIndex++;
    }

    // Get nodes coordination
    var nodes = {"-1": {x: 0, y: 0}};
    var length_factor = 20;
    const pi = Math.PI;

    var angleList = [
        [0],
        [pi / 4, -pi / 4],
        [0, pi / 6, -pi / 6],
        [pi / 12, -pi / 12, pi / 6, -pi / 6],
        [0, pi / 12, -pi / 12, pi / 12, -pi / 12]
    ];

    for (i in tree) {
        var childs = tree[i].child;
        var childNum = childs.length;
        if (childNum > 0) {
            var parentId = tree[i].parent;
            var sign = 1;
            for (var j in childs) {
                var angle = angleList[childs.length - 1];
                var blength = treeTable.filter(function(x:any) { return x.clusterId == childs[j] })[0].blengths;

                //                blength = 3;

                var x = nodes[tree[i].parent].x + length_factor * blength * Math.cos(angle[j]);
                var y = nodes[tree[i].parent].y + length_factor * blength * Math.sin(angle[j]);

                nodes[childs[j]] = { x: x, y: y };
            }
        } 
    }


    // Get edges coordination
    var edges = {1: {x_start: 0, x_end: 0, y_start: 0, y_end: 0}};
    for (i in treeTable) {
        var start = treeTable[i].parent,
            end = treeTable[i].clusterId,
            coordStart = nodes[start],
            coordEnd = nodes[end];

        edges[i] = {
            start: start,
            end: end,
            xStart: coordStart.x,
            yStart: coordStart.y,
            xEnd: coordEnd.x,
            yEnd: coordEnd.y
        }
    }

    return {nodes: nodes, edges: edges};
}

function getColor(i:any, colorList:any) {
    return colorList[i % colorList.length];
}


export default class TreePlot extends React.Component<any, any> {
    // load the tree plot svg
    // In this commit: using "Button" to represent the node in the tree

    ref: SVGSVGElement;
    componentDidMount() {
        this.drawTreePlot(this.props.treeData, this.props.height, this.props.width, this.props.margin);
    }

    drawTreePlot(treeTable:any, height:any, width:any, margin:any) {

        // Create svg canvas
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

        for (var i in coordination.edges) {
            svg.append('g')
                .attr("transform", "translate(" + margin +"," + height / 2 + ")")
                .attr('class', 'line')
                .append('line')
                .attr('x1', edges[i].xStart)
                .attr('x2', edges[i].xEnd)
                .attr('y1', edges[i].yStart)
                .attr('y2', edges[i].yEnd)
                .attr("stroke-width", 7)
                .attr("stroke", getColor(i, edgeColors))
                .attr('clusterId', edges[i].end)
                .on("click", edgeHandleMouseClick)
                .on("mouseover", edgeHandleMouseOver)
                .on("mouseout", edgeHandleMouseOut)
        }

        // Draw the node
        for (var i in nodes) {
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
            $(this).attr("stroke-width", function(index, attr) { 
                return attr == "10" ? "7" : "10";
            });
            // $(`tr.${class_name}`).css({ background: 'red' });
        }

        function edgeHandleMouseOver() {
            $(this).attr("stroke-width", function(index, attr) { 
                return attr == "10" ? "10" : "9";
            });
            // $(`tr.${class_name}`).css({ background: 'red' });
        }


        function edgeHandleMouseOut() {
            $(this).attr("stroke-width", function(index, attr) { 
                return attr == "10" ? "10" : "7";
            });
            // const class_name = $(this).attr('id');
            // $(`tr.${class_name}`).css({ background: 'white' });
        }
    }


    render() {
        return(
            <div className="treePlot">
                <div className="demoTree">
                    <svg className="container" ref={(ref: SVGSVGElement) => this.ref = ref}> 
                    </svg>
                </div>
                <div className="popUp">
                </div>
            </div>
        )
    }
}


