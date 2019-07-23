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


export default class TreePlot extends React.Component<any, any> {
    // load the tree plot svg
    // In this commit: using "Button" to represent the node in the tree

    ref: SVGSVGElement;
    componentDidMount() {
        this.drawTreePlot(this.props.treeData, this.props.height, this.props.width, this.props.margin);
    }

    drawTreePlot(data:any, height:any, width:any, margin:any) {

//         let height = 300,
//             width = 500,
//             margin = 20;

        // Create svg canvas
        var svg = d3.select(this.ref)
            .attr('width', width)
            .attr('height', height)
            .append('g');


        // The node radius
        const r = 5;


        // Parsing the tree 
        var tree = [];

        function findCildOf(clusterId:string, treeTable:any) {
            return treeTable.filter(function(cluster:any) {
                return cluster.parent == clusterId;
            }).map(function(cluster:any) {
                return cluster.clusterId
            })
        }

        tree.push({parent: "-1", child: findCildOf("-1", data)});

        var completed = false;
        var currentParentsIndex = 0;
        debugger;
        while (!completed && currentParentsIndex < 100) {
            completed = true;
            var newParents:any = tree[currentParentsIndex].child;
            for (var i in newParents) {
                var parent:any = newParents[i];
                var newChild = findCildOf(parent, data);
                if (newChild.length > 0) completed = false;
                tree.push({parent: parent, child: newChild});
            }
            currentParentsIndex++;
        }

        // Get nodes coordination
        var nodes = {"-1": {x: r + margin, y: height / 2 - r / 2}};
        var length_factor = 20;
        const pi = Math.PI;

        for (i in tree) {
            var childs = tree[i].child;
            var childNum = childs.length;
            if (childNum > 0) {
                var parentId = tree[i].parent;
                var sign = 1;
                for (var j in childs) {
                    var blength = data.filter(function(x:any) { return x.clusterId == childs[j] })[0].blengths;
                    var angle = childNum == 1 ? pi / 2 : pi / 4;
                    var x = nodes[tree[i].parent].x + length_factor * blength * Math.sin(angle);
                    var y = nodes[tree[i].parent].y + length_factor * blength * Math.cos(angle) * sign;

                    nodes[childs[j]] = { x: x, y: y };
                    sign *= -1;
                }
            } 
        }

//         debugger;
        for (i in nodes) {
            svg.append('circle')
                .attr("class", i)
                .attr("cx", nodes[i].x)
                .attr('cy', nodes[i].y)
                .attr('r', r)
                .style('fill', 'red');
        }

        // Get edges coordination
        var edges = {1: {x_start: 0, x_end: 0, y_start: 0, y_end: 0}};
        for (i in tree) {

        }


//         svg.append('g')
//             .attr('class', 'line')
//             .append('line')
//             .attr('id', '4')
//             .attr('x1', x2)
//             .attr('x2', x4)
//             .attr('y1', y2)
//             .attr('y2', y4)
//             .attr('stroke-width', 5)
//             .attr('stroke', 'black')
//             .on('click', handleMouseClick)
//             .on('mouseover', handleMouseOver)
//             .on('mouseout', handleMouseOut);

        const selectNode = this.props.selectNode;

        function handleMouseClick() {
            const class_name = $(this).attr('id');
            selectNode(class_name);
//             alert("mouse down");
//                    $(`tr.${class_name}`).css({ background: 'red' });
        }

        function handleMouseOver() {
            const class_name = $(this).attr('id');
//                    $(`tr.${class_name}`).css({ background: 'red' });
        }


        function handleMouseOut() {
            //        const class_name = $(this).attr('id');
            //        $(`tr.${class_name}`).css({ background: 'white' });
        }
    };

    render() {
        return(
            <div className="treePlot">
                <div className="demoTree">
                    <svg className="container" ref={(ref: SVGSVGElement) => this.ref = ref}> 
                    </svg>
                </div>
            </div>
        )
    }
}


