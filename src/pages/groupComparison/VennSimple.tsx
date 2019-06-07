import * as React from "react";
import {observer} from "mobx-react";
import {computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {ComparisonGroup} from "./GroupComparisonUtils";
import * as d3 from 'd3';
import _ from "lodash";
import MemoizedHandlerFactory from "../../shared/lib/MemoizedHandlerFactory";
import measureText from "measure-text";
import * as ReactDOM from "react-dom";
import {Popover} from "react-bootstrap";
import classnames from "classnames";
import styles from "../resultsView/survival/styles.module.scss";
import {pluralize} from "../../shared/lib/StringUtils";
import {blendColors, getExcludedIndexes, getTextColor, joinGroupNames} from "./OverlapUtils";
import {computeVennJsSizes, lossFunction} from "./VennUtils";

const VennJs = require("venn.js");

export interface IVennSimpleProps {
    uid:string;
    groups: {
        uid: string;
        cases: string[];
    }[]; // either 2 or 3
    x:number;
    y:number;
    width:number;
    height:number;
    uidToGroup: { [uid: string]: ComparisonGroup };
    onChangeSelectedRegions:(selectedRegions:number[][])=>void;
    selection:{
        regions:number[][]; // we do it like this so that updating it doesn't update all props
    };
    caseType:"sample"|"patient"
}

function regionMouseOver(e:any) {
    e.target.setAttribute("fill", e.target.getAttribute("data-hover-fill"));
}

function regionMouseOut(e:any) {
    e.target.setAttribute("fill", e.target.getAttribute("data-default-fill"));
}

function regionIsSelected(
    regionComb:number[],
    selectedRegions:number[][]
) {
    return selectedRegions.find(r=>_.isEqual(r, regionComb));
}

function toggleRegionSelected(
    regionComb:number[],
    selectedRegions:number[][]
) {
    const withoutComb = selectedRegions.filter(r=>!_.isEqual(r, regionComb));
    if (withoutComb.length === selectedRegions.length) {
        // combination currently not selected, so add it
        return selectedRegions.concat([regionComb]);
    } else {
        // combination was selected, so return version without it
        return withoutComb;
    }
}

@observer
export default class VennSimple extends React.Component<IVennSimpleProps, {}> {
    @observable.ref svg:SVGElement|null = null;
    @observable.ref tooltipModel:{ combination:number[], numCases:number } | null = null;
    @observable mousePosition = { x:0, y:0 };

    private regionClickHandlers = MemoizedHandlerFactory(
        (e:any, params:{ combination:number[], }) => {
            this.props.onChangeSelectedRegions(toggleRegionSelected(params.combination, this.props.selection.regions));
        }
    );

    private regionHoverHandlers = MemoizedHandlerFactory(
        (e:React.MouseEvent<any>, params:{ combination:number[], numCases:number}) => {
            this.tooltipModel = params;
            this.mousePosition.x = e.pageX;
            this.mousePosition.y = e.pageY;
        }
    );

    @autobind private svgRef(_svg:SVGElement|null) {
        this.svg = _svg;
    }

    @computed get layoutParams() {
        const data = this.regions.map(r=>({
            size: r.vennJsSize,
            sets: r.combination.map(i=>this.props.groups[i].uid),
        }));

        const padding = 20;

        let solution = VennJs.venn(data, {
            lossFunction
        });
        solution = VennJs.normalizeSolution(solution, Math.PI/2, null);
        const circles = VennJs.scaleSolution(solution, this.props.width, this.props.height, padding);
        const textCenters = VennJs.computeTextCentres(circles, data);

        return {
            circles, textCenters
        }
    }

    @computed get circleRadii() {
        return _.mapValues(this.layoutParams.circles, c=>c.radius);
    }

    @computed get circleCenters() {
        return _.mapValues(this.layoutParams.circles, c=>({ x:c.x, y: c.y }));
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

        return computeVennJsSizes(combinations.map(combination=>{
            // compute the cases in this region
            let casesInRegion = _.intersection(...combination.map(index=>this.props.groups[index].cases));
            const intersectionSize = casesInRegion.length;
            for (const i of getExcludedIndexes(combination, this.props.groups.length)) {
                _.pullAll(casesInRegion, this.props.groups[i].cases);
            }
            return {
                combination,
                intersectionSize,
                numCases: casesInRegion.length,
                // compute the fill based on the colors of the included groups
                color: blendColors(combination.map(index=>this.props.uidToGroup[this.props.groups[index].uid].color))
            };
        }));
    }

    @computed get displayElements() {
        // Compute all of the display elements of the venn diagram - the outline, the fills, and the text

        // compute the clip paths corresponding to each group circle
        const clipPaths = this.props.groups.map((group, index)=>(
            <clipPath id={`${this.props.uid}_circle_${index}`}>
                <circle
                    cx={this.circleCenters[group.uid].x}
                    cy={this.circleCenters[group.uid].y}
                    r={this.circleRadii[group.uid]}
                />
            </clipPath>
        ));

        return _.flattenDeep<any>((clipPaths as any).concat(this.regions.map(region=>{

            // FOR EACH REGION: generate the filled area, and the "# cases" text for it
            // Each region is specified by the combination of groups corresponding to it
            const comb = region.combination;

            // generate clipped hover area by iteratively nesting a rect in all the clip paths
            //  corresponding to groups in this area. This clips out, one by one, everything
            //  except for the intersection.
            let hoverArea:JSX.Element = (
                <g>
                    <rect
                        x="0"
                        y="0"
                        height={this.props.height}
                        width={this.props.width}
                        fill={region.color}
                        style={{ cursor: region.numCases > 0 ? "pointer" : "default" }}
                        data-default-fill={region.color}
                        data-hover-fill={d3.hsl(region.color).brighter(1).rgb()}
                        onMouseOver={region.numCases > 0 ? regionMouseOver : undefined}
                        onMouseOut={region.numCases > 0 ? regionMouseOut : undefined}
                        onMouseMove={this.regionHoverHandlers({combination:comb, numCases: region.numCases })}
                        onClick={region.numCases > 0 ? this.regionClickHandlers({ combination: comb }) : undefined}
                    />
                </g>
            );
            for (const index of comb) {
                hoverArea = (
                    <g clipPath={`url(#${this.props.uid}_circle_${index})`}>
                        {hoverArea}
                    </g>
                );
            }

            return [hoverArea];
        })).concat(_.sortBy(this.regions.filter(r=>r.combination.length === 1), r=>-r.vennJsSize).map(r=>{
            // draw the outlines of the circles
            const uid = this.props.groups[r.combination[0]].uid;
            return (
                <circle
                    cx={this.circleCenters[uid].x}
                    cy={this.circleCenters[uid].y}
                    r={this.circleRadii[uid]}
                    fill="none"
                    stroke={r.color}
                    strokeWidth={2}
                />
            );
        }))).concat(_.flattenDeep<any>(this.regions.map(region=>{
            if (region.numCases === 0) {
                return [];
            }

            const selected = regionIsSelected(region.combination, this.props.selection.regions);

            const textContents = `${region.numCases.toString()}${selected ? " "+String.fromCharCode(10004) : ""}`;
            // Add rect behind for ease of reading
            const textSize = measureText({text:textContents, fontFamily:"Arial", fontSize:"13px", lineHeight: 1});
            const padding = 4;
            const textPosition = this.layoutParams.textCenters[region.combination.map(i=>this.props.groups[i].uid).join(",")];
            let textBackground = null;
            if (selected) {
                textBackground = <rect
                    x={textPosition.x - textSize.width.value / 2 - padding}
                    y={textPosition.y - textSize.height.value}
                    width={textSize.width.value + 2*padding}
                    height={textSize.height.value + padding}
                    fill={"yellow"}
                    rx={3}
                    ry={3}
                    pointerEvents="none"
                />;
            }
            return [
                textBackground,
                <text
                    x={textPosition.x}
                    y={textPosition.y}
                    style={{ userSelect:"none", color:selected ? "black" : getTextColor(region.color)}}
                    fontWeight={region.numCases > 0 ? "bold" : "normal"}
                    pointerEvents="none"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                >
                    {textContents}
                </text>
            ];
        })));
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
        const includedGroups = includedGroupUids.map(uid=>this.props.uidToGroup[uid]);

        return (
            <div style={{width:300, whiteSpace:"normal"}}>
                <strong>{this.tooltipModel.numCases} {pluralize(this.props.caseType, this.tooltipModel.numCases)}</strong>
                <br/>
                in only {joinGroupNames(includedGroups, "and")}.
            </div>
        );
    }

    render() {
        return (
            <g
                transform={`translate(${this.props.x},${this.props.y})`}
                onMouseOut={this.resetTooltip}
            >
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
                {this.displayElements}
                {!!this.tooltipModel && (
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
                    )
                )}
            </g>
        );
    }
}