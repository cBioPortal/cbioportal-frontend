import * as React from 'react';

import d3 from 'd3';
import * as sankeyPlugin from 'd3-plugins-sankey';
import _ from 'lodash';
import './sankeychart.css';
sankeyPlugin; // If I delete this line, the d3 import doesn't include the sankey plugin

import { StudyViewPageStore } from './StudyViewPageStore';
import {
    TreatmentSankeyGraph,
    TreatmentSequenceNode,
} from 'cbioportal-ts-api-client';
import { action, makeObservable, observable, computed } from 'mobx';
import { observer } from 'mobx-react';

export type SankeyProps = {
    store: StudyViewPageStore;
};

@observer
export default class TreatmentSankeyDiagram extends React.Component<
    SankeyProps,
    {}
> {
    private store: StudyViewPageStore;

    @observable
    private filter = '';

    constructor(props: SankeyProps) {
        super(props);
        makeObservable(this);
        this.store = props.store;
    }

    private nSpaces(n: number): string {
        var ret = ' ';
        while (n > 0) {
            ret = ret + ' ';
            n--;
        }
        return ret;
    }

    private nodeToString(node: TreatmentSequenceNode): string {
        return node.treatment + this.nSpaces(node.index);
    }

    @computed
    private get sankeyDataD3() {
        if (!this.store.treatmentSequences.isComplete) {
            return { nodes: [], links: [] };
        }

        const graph = this.filteredTreatmentGraph;
        const treatmentIndexMap = new Map<string, number>();
        const nodes = graph.nodes.map((node, i) => {
            return {
                name: this.nodeToString(node),
                node: i,
            };
        });
        nodes.forEach(node => treatmentIndexMap.set(node.name, node.node));
        const links = graph.edges.map(edge => {
            return {
                source: treatmentIndexMap.get(
                    this.nodeToString(edge.from)
                ) as number,
                target: treatmentIndexMap.get(
                    this.nodeToString(edge.to)
                ) as number,
                value: edge.count,
            };
        });

        return { nodes, links };
    }

    @computed
    private get filteredTreatmentGraph(): TreatmentSankeyGraph {
        if (!this.store.treatmentSequences.isComplete) {
            return { nodes: [], edges: [] };
        }

        const graph = this.store.treatmentSequences.result;
        if (this.filter == '') {
            return graph;
        }

        var filterRegex: RegExp;
        try {
            filterRegex = new RegExp(this.filter);
        } catch (e) {
            filterRegex = new RegExp('.*');
        }

        const filteredEdges = graph.edges.filter(edge => {
            return (
                edge.to.treatment.search(filterRegex) ||
                edge.from.treatment.search(filterRegex)
            );
        });
        const filteredEdgeSet = filteredEdges.reduce((set, e) => {
            set.add(this.nodeToString(e.from));
            set.add(this.nodeToString(e.to));
            return set;
        }, new Set<string>());
        const filteredNodes = graph.nodes.filter(node => {
            return filteredEdgeSet.has(this.nodeToString(node));
        });

        return {
            nodes: filteredNodes,
            edges: filteredEdges,
        };
    }

    @action.bound
    onFilterChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.filter = event.target.value;
    }

    onSelect({ chartWrapper }: any) {
        const chart = chartWrapper.getChart();
        const selection = chart.getSelection();
        console.log(selection);
    }

    renderGraph() {
        const margin = { top: 10, right: 0, bottom: 10, left: 0 };
        const width = 1000 - margin.left - margin.right;
        const height = 750 - margin.top - margin.bottom;
        let formatNumber = d3.format(',.0f'),
            format = (d: any) => formatNumber(d);

        var sankey = d3
            .sankey()
            .size([width, height])
            .nodeWidth(15)
            .nodePadding(10);

        var path = sankey.link();

        var graph = {
            nodes: this.sankeyDataD3.nodes,
            links: this.sankeyDataD3.links,
        };

        sankey
            .nodes(graph.nodes)
            .links(graph.links)
            .layout(32);

        var links = graph.links.map((link: any, i: number) => {
            return (
                <g>
                    <path
                        key={i}
                        className="link"
                        d={path(link)}
                        style={{ strokeWidth: Math.max(1, link.dy) }}
                    >
                        <title>
                            {link.source.name +
                                ' → ' +
                                link.target.name +
                                '\n Weight: ' +
                                format(link.value)}
                        </title>
                    </path>
                </g>
            );
        });

        var nodes = graph.nodes.map((node: any, i: number) => {
            return (
                <g
                    key={i}
                    className="node"
                    transform={'translate(' + node.x + ',' + node.y + ')'}
                >
                    <rect height={node.dy} width={sankey.nodeWidth()}>
                        <title>{node.name + '\n' + format(node.value)}</title>
                    </rect>
                    {node.x >= width / 2 ? (
                        <text
                            x={-6}
                            y={node.dy / 2}
                            dy={'.35em'}
                            textAnchor={'end'}
                        >
                            {node.name}
                        </text>
                    ) : (
                        <text
                            x={6 + sankey.nodeWidth()}
                            y={node.dy / 2}
                            dy={'.35em'}
                            textAnchor={'start'}
                        >
                            {node.name}
                        </text>
                    )}
                </g>
            );
        });

        return (
            <svg
                width={width + margin.left + margin.right}
                height={height + margin.top + margin.bottom}
            >
                <g
                    transform={
                        'translate(' + margin.left + ',' + margin.top + ')'
                    }
                >
                    {links}
                    {nodes}
                </g>
            </svg>
        );
    }

    render() {
        if (!this.store.treatmentSequences.isComplete) {
            return <div>Chill for a second</div>;
        }

        return (
            <div>
                <div>
                    <input type="text" onChange={this.onFilterChange}></input>
                </div>

                {this.renderGraph()}
            </div>
        );
    }
}
