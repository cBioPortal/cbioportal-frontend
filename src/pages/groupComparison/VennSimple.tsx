import * as React from "react";
import {observer} from "mobx-react";
import {computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {ComparisonGroup} from "./GroupComparisonUtils";
import * as d3 from 'd3';
import _ from "lodash";
import LazyMemo from "../../shared/lib/LazyMemo";
import MemoizedHandlerFactory from "../../shared/lib/MemoizedHandlerFactory";

export interface IVennSimpleProps {
    groups: {
        uid: string;
        cases: string[];
    }[]; // either 2 or 3
    x:number;
    y:number;
    width:number;
    height:number;
    uidToGroup: { [uid: string]: ComparisonGroup };
    onClickRegion:(regionParams:{ intersectedUids:string[], excludedUids:string[] })=>void;
    caseCountFilterName:string;
}

function blendColors(colors:string[]) {
    // helper function for venn diagram drawing. In order to highlight set complements,
    //  we draw things from the bottom up - the visual exclusion simulates the complement,
    //  even though we don't explicitly draw the set complements in SVG. In order to make
    //  this work, no element can have less than 1 opacity - it would show that the entire
    //  set, not just the complement, is being highlighted and ruin the effect. Therefore...

    // TL;DR: We use this function to blend colors between groups, for the intersection regions.

    switch (colors.length) {
        case 1:
            // for 1 color, no blending necessary
            return colors[0];
        case 2:
            // for 2 colors, easy linear blend in Lab space
            return d3.interpolateLab(colors[0], colors[1])(0.5);
        case 3:
        default:
            // for 3 colors, linear blend between the first two,
            //  then linear blend between the first-two-blend, and the third.
            return d3.interpolateLab(
                d3.interpolateLab(colors[0], colors[1])(0.5),
                colors[2]
            )(0.5);
    }
}

function regionMouseOver(e:any) {
    e.target.setAttribute("fill", e.target.getAttribute("data-hover-fill"));
}

function regionMouseOut(e:any) {
    e.target.setAttribute("fill", e.target.getAttribute("data-default-fill"));
}

function getExcludedIndexes(combination:number[], numGroupsTotal:number) {
    // get all indexes not in the given combination

    const excl = [];
    for (let i=0; i<numGroupsTotal; i++) {
        if (!combination.includes(i)) {
            excl.push(i);
        }
    }
    return excl;
}

@observer
export default class VennSimple extends React.Component<IVennSimpleProps, {}> {
    @observable.ref svg:SVGElement|null;
    private regionClickHandlers = MemoizedHandlerFactory(
        (params:{
            combination:number[],
            numGroupsTotal:number
        }) => this.props.onClickRegion({
            intersectedUids: params.combination.map(index=>this.props.groups[index].uid),
            excludedUids:getExcludedIndexes(params.combination, params.numGroupsTotal).map(index=>this.props.groups[index].uid)
        })
    );

    @autobind private svgRef(_svg:SVGElement|null) {
        this.svg = _svg;
    }

    @computed get maxCircleRadius() {
        return Math.min(this.props.width, this.props.height) / 4;
    }

    @computed get minCircleRadius() {
        return this.maxCircleRadius - 30;
    }

    @computed get circleRadii() {
        const maxVal = Math.max(...this.props.groups.map((g:IVennSimpleProps["groups"][0])=>g.cases.length));
        const minVal = maxVal / 10;

        const radius = (numCases:number)=>{
            const x = Math.max(numCases, minVal);

            // Linear scale where biggest group gets max circle radius, and anything smaller than
            //  10% max group size gets min circle radius
            return (1 - ((maxVal - x)/(maxVal - minVal))) * (this.maxCircleRadius - this.minCircleRadius) + this.minCircleRadius;
        };

        return this.props.groups.reduce((map, group)=>{
            map[group.uid] = radius(group.cases.length);
            return map;
        }, {} as {[uid:string]:number});
    }

    @computed get angleIncrement() {
        // divide the circle (2PI radians) into (# groups), in order
        //  to arrange the group circles evenly spaced in a circle
        return Math.PI*2 / this.props.groups.length;
    }

    @computed get circleCenters() {
        // arrange the circles evenly spaced in a circle around the center of the svg
        const svgCenter = { x: this.props.width / 2, y: this.props.height / 2 };
        return this.props.groups.reduce((map, group, index)=>{
            const distanceFromCenter = 0.7*this.circleRadii[group.uid];
            // distance from center is less than the full radius, so that there are intersection regions
            map[group.uid] = {
                x: svgCenter.x + distanceFromCenter*Math.cos(this.angleIncrement*index),
                y: svgCenter.y + distanceFromCenter*Math.sin(this.angleIncrement*index)
            };
            return map;
        }, {} as {[uid:string]:{x:number, y:number}});
    }

    @computed get displayElements() {
        // Compute all of the display elements of the venn diagram - the outline, the fills, and the text

        // compute the clip paths corresponding to each group circle
        const clipPaths = this.props.groups.map((group, index)=>(
            <clipPath id={`circle_${index}`}>
                <circle
                    cx={this.circleCenters[group.uid].x}
                    cy={this.circleCenters[group.uid].y}
                    r={this.circleRadii[group.uid]}
                />
            </clipPath>
        ));

        // each region corresponds to a combination of groups that it represents
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
        return _.flattenDeep<any>((clipPaths as any).concat(combinations.map(comb=>{
            // FOR EACH REGION: generate the filled area, and the "# cases" text for it
            // Each region is specified by the combination of groups corresponding to it, which is our iteration param.

            // compute the fill based on the colors of the included groups
            const fill = blendColors(comb.map(index=>this.props.uidToGroup[this.props.groups[index].uid].color));

            // compute the cases in this region
            let casesInRegion = _.intersection(...comb.map(index=>this.props.groups[index].cases));
            for (const i of getExcludedIndexes(comb, this.props.groups.length)) {
                _.pullAll(casesInRegion, this.props.groups[i].cases);
            }

            // generate clipped hover area by iteratively nesting a rect in all the clip paths
            //  corresponding to groups in this area. This clips out, one by one, everything
            //  except for the intersection.
            let hoverArea:JSX.Element = (
                <rect
                    x="0"
                    y="0"
                    height={this.props.height}
                    width={this.props.width}
                    fill={casesInRegion.length === 0 ? "white" : fill}
                    data-default-fill={fill}
                    data-hover-fill={d3.hsl(fill).brighter(1).rgb()}
                    onMouseOver={casesInRegion.length > 0 ? regionMouseOver : undefined}
                    onMouseOut={casesInRegion.length > 0 ? regionMouseOut : undefined}
                    onClick={this.regionClickHandlers({ combination: comb, numGroupsTotal: this.props.groups.length })}
                />
            );
            for (const index of comb) {
                hoverArea = (
                    <g clipPath={`url(#circle_${index})`}>
                        {hoverArea}
                    </g>
                );
            }

            // compute location of the "# cases" text
            let x:number, y:number;
            if (comb.length === this.props.groups.length) {
                // center intersection
                x = this.props.width/2;
                y = this.props.height/2;
            } else if (comb.length === 1) {
                // single group
                const group = this.props.groups[comb[0]];
                const angle = comb[0]*this.angleIncrement;
                x = this.props.width/2 + 1.25*this.circleRadii[group.uid]*Math.cos(angle);
                y = this.props.height/2 + 1.25*this.circleRadii[group.uid]*Math.sin(angle);
            } else {
                // two groups out of three
                let angleMultiple;
                if (comb[1] - comb[0] === 1) {
                    angleMultiple = (comb[0] + comb[1]) / 2;
                } else {
                    // have to manually handle case of 0 and 2 because
                    //  angles wrap at 2*PI making average mess up in this case
                    angleMultiple = 2.5;
                }
                const angle = angleMultiple*this.angleIncrement;
                const radius = 0.7*Math.min(
                    this.circleRadii[this.props.groups[comb[0]].uid],
                    this.circleRadii[this.props.groups[comb[1]].uid]
                );
                x = this.props.width/2 + radius*Math.cos(angle);
                y = this.props.height/2 + radius*Math.sin(angle);
            }
            return [
                hoverArea,
                <text
                    x={x}
                    y={y}
                    fontWeight={casesInRegion.length > 0 ? "bold" : "normal"}
                    filter={`url(#${this.props.caseCountFilterName})`}
                    pointerEvents="none"
                >
                    {casesInRegion.length}
                </text>
            ];
        })).concat(this.props.groups.map(group=>(
            // draw the outlines of the circles
            <circle
                cx={this.circleCenters[group.uid].x}
                cy={this.circleCenters[group.uid].y}
                r={this.circleRadii[group.uid]}
                fill="none"
                stroke="black"
                strokeWidth={2}
            />
        ))));
    }

    render() {
        return (
            <g
                transform={`translate(${this.props.x},${this.props.y})`}
            >
                {this.displayElements}
            </g>
        );
    }
}