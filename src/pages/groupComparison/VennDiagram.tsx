import * as React from "react";
import {Observer, observer} from "mobx-react";
import autobind from "autobind-decorator";
import * as d3 from "d3";
import {ComparisonGroup} from "./GroupComparisonUtils";
import {computed, observable, reaction} from "mobx";
import _ from "lodash";
import {
    blendColors,
    getExcludedIndexes,
    getTextColor,
    joinNames,
    regionIsSelected,
    toggleRegionSelected
} from "./OverlapUtils";
import {pluralize} from "../../shared/lib/StringUtils";
import * as ReactDOM from "react-dom";
import {Popover} from "react-bootstrap";
import classnames from "classnames";
import styles from "../resultsView/survival/styles.module.scss";
const venn = require("venn.js");

export interface IVennDiagramProps {
    groups: {
        uid: string;
        cases: string[];
    }[]; // either 2 or 3
    x:number;
    y:number;
    uidToGroup: { [uid: string]: ComparisonGroup };
    height:number;
    width:number;
    svgGroupId:string;
    onChangeSelectedRegions:(selectedRegions:number[][])=>void;
    selection:{
        regions:number[][]; // we do it like this so that updating it doesn't update all props and thus force `regions` to recompute (expensive)
    };
    caseType:"sample"|"patient"
}

@observer
export default class VennDiagram extends React.Component<IVennDiagramProps, {}> {
    @observable.ref tooltipModel:{ combination:number[], numCases:number } | null = null;
    @observable mousePosition = { x:0, y:0 };

    componentDidMount() {
        this.update();
        reaction(()=>this.props.selection.regions, this.update);
    }

    componentDidUpdate() {
        this.update();
    }

    @computed get regions() {
        let combinations:number[][]; // in painting order so that mouse interactions look right
        switch (this.props.groups.length) {
            case 2:
                // all combinations of two groups
                combinations = [[0], [1], [0,1]];
                break;
            case 3:
            default:
                // all combinations of three groups
                combinations = [[0],[1],[2],[0,1],[0,2],[1,2],[0,1,2]];
                break;
        }

        const unsortedRegions = combinations.map(combination=>{
            // compute the cases in this region
            let casesInRegion = _.intersection(...combination.map(index=>this.props.groups[index].cases));
            const numCasesOnlyIntersection = casesInRegion.length;
            for (const i of getExcludedIndexes(combination, this.props.groups.length)) {
                _.pullAll(casesInRegion, this.props.groups[i].cases);
            }
            return {
                combination,
                numCasesOnlyIntersection,
                numCases: casesInRegion.length,
                color: blendColors(combination.map(index=>this.props.uidToGroup[this.props.groups[index].uid].color))
            };
        });

        return _.sortBy<any>(
            unsortedRegions,
            [
                region=>region.combination.length,
                (region:any)=>-region.numCasesOnlyIntersection
            ]// sort first by number of sets in combination, then descending by num cases so smaller sets get put on top and not hidden
        );
    }

    private getRegionLabel(combination:number[], numCases:number) {
        if (numCases === 0) {
            return "";
        } else if (regionIsSelected(combination, this.props.selection.regions)) {
            return numCases+" "+String.fromCharCode(10004);
        } else {
            return numCases.toString();
        }
    }

    @autobind private resetSelection() {
        this.props.onChangeSelectedRegions([]);
    }

    @autobind private resetTooltip() {
        this.tooltipModel = null;
    }

    @computed get tooltipContent() {
        if (!this.tooltipModel) {
            return null;
        }

        const includedGroupUids = this.tooltipModel.combination.map(groupIndex=>this.props.groups[groupIndex].uid);
        const excludedGroupUids = getExcludedIndexes(this.tooltipModel.combination, this.props.groups.length)
            .map(groupIndex=>this.props.groups[groupIndex].uid);

        const includedGroupNames = includedGroupUids.map(uid=>this.props.uidToGroup[uid].name);
        const excludedGroupNames = excludedGroupUids.map(uid=>this.props.uidToGroup[uid].name);
        return (
            <div style={{width:300, whiteSpace:"normal"}}>
                This area contains {this.props.caseType}s which are in {joinNames(includedGroupNames, "and")}
                {(excludedGroupNames.length > 0) && <span>, but are not in {joinNames(excludedGroupNames, "or")}</span>}&nbsp;
                ({this.tooltipModel.numCases} {pluralize(this.props.caseType, this.tooltipModel.numCases)}).
                {(this.tooltipModel.numCases > 0) && [
                    <br/>,
                    <br/>,
                    <strong>Click to select this region.</strong>
                ]}
            </div>
        );
    }

    @autobind
    private update() {

        console.log(this.regions);

        const self = this;

        let vennDiagram = venn.VennDiagram();
        vennDiagram.width(this.props.width);
        vennDiagram.height(this.props.height);
        vennDiagram.padding(20);
        vennDiagram.fontSize('14px');

        let vennDiagramDiv = d3.select(`#${this.props.svgGroupId}`)
        vennDiagramDiv.datum(this.regions.map(r=>({
            label: this.getRegionLabel(r.combination, r.numCases),
            size: r.numCasesOnlyIntersection,
            trueSize: r.numCases,
            sets: r.combination,
            color: r.color
        }))).call(vennDiagram);

        vennDiagramDiv.selectAll(".venn-area path")
            .style({
                "fill": function (d: any) { return d.color; },
                "fill-opacity":1,
                "cursor":"pointer"
            });

        // copy base circles and just give them outlines

        vennDiagramDiv.selectAll(".venn-outline").remove();

        vennDiagramDiv.selectAll(".venn-circle path")
            .select(function() {
                return this.parentNode.parentNode.appendChild(this.cloneNode());
            })
            .classed("venn-outline", true)
            .style({
                "stroke": function (d: any) { return d.color; },
                "stroke-width":1.5,
                "fill-opacity":0,
            })
            .attr("pointer-events", "none");

        vennDiagramDiv.selectAll(".venn-area text")
            .style({
                "opacity":(d:any)=>(d.label.length === 0 ? 0 : 1),
                "user-select":"none",
                "fill":(d:any)=>getTextColor(d.color),
                "stroke":(d:any)=>getTextColor(d.color, true),
                "stroke-width":6,
                "stroke-opacity":(d:any)=>(+regionIsSelected(d.sets, this.props.selection.regions)),
                "paint-order":"stroke"
            })
            .attr("pointer-events", "none");

        vennDiagramDiv.selectAll("g")
            .on("mouseover", function (d: any, e:any) {
                // highlight the current path
                d3.select(this)
                    .select("path")
                    .style("fill", (d:any)=>d3.hsl(d.color).brighter(1).rgb());
            })
            .on("mouseout", function (d: any) {
                d3.select(this)
                    .select("path")
                    .style("fill", (d:any)=>d.color)
            })
            .on("mousemove", function(d:any) {
                self.tooltipModel = {
                    combination: d.sets,
                    numCases: d.trueSize
                };
            })
            .on("click", function(d:any){
                self.props.onChangeSelectedRegions(toggleRegionSelected(d.sets, self.props.selection.regions));
            });

        d3.select("body").on("mousemove", function() {
            const mouseCoords = d3.mouse(this);
            self.mousePosition.x = mouseCoords[0];
            self.mousePosition.y = mouseCoords[1];
        });
    }

    render() {
        return (
            <g transform={`translate(${this.props.x}, ${this.props.y})`}>
                <rect
                    x="0"
                    y="0"
                    fill="white"
                    fillOpacity={0}
                    width={this.props.width}
                    height={this.props.height}
                    onMouseMove={this.resetTooltip}
                    onClick={this.resetSelection}
                />
                <g id={this.props.svgGroupId}/>
                <Observer>
                    {()=>(
                        !!this.tooltipModel ?
                        (ReactDOM as any).createPortal(
                            <Popover
                                arrowOffsetTop={17}
                                className={classnames("cbioportal-frontend", "cbioTooltip", styles.Tooltip)}
                                positionLeft={this.mousePosition.x+15}
                                positionTop={this.mousePosition.y-17}
                            >
                                {this.tooltipContent}
                            </Popover>,
                            document.body
                        ) : <span/>
                    )}
                </Observer>
            </g>
        );
    }
}