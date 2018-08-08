import * as React from 'react';
import _ from "lodash";
import Sequence from "./Sequence";
import Lollipop from "./Lollipop";
import Domain from "./Domain";
import SVGAxis from "../SVGAxis";
import {Tick} from "../SVGAxis";
import {observer} from "mobx-react";
import {computed, action} from "mobx";
import $ from "jquery";
import {LollipopPlotProps} from "./LollipopPlot";
import {SyntheticEvent} from "react";

export type LollipopSpec = {
    codon:number;
    count:number;
    label?:string;
    color?:string;
    tooltip?:JSX.Element;
};

export type DomainSpec = {
    startCodon:number;
    endCodon:number;
    color:string;
    label?:string;
    labelColor?:string;
    tooltip?:JSX.Element;
};

export type SequenceSpec = {
    tooltip?:JSX.Element;
}

export type LollipopPlotNoTooltipProps = LollipopPlotProps & {
    setHitZone?:(
        hitRect:{x:number, y:number, width:number, height:number},
        tooltipContent?:JSX.Element,
        onMouseOver?:()=>void,
        onClick?:()=>void,
        onMouseOut?:()=>void,
        cursor?:string,
        tooltipPlacement?:string
    )=>void;
    onMouseLeave?:()=>void;
    onBackgroundMouseMove?:()=>void;
};

const DELETE_FOR_DOWNLOAD_CLASS = "delete-for-download";
const LOLLIPOP_ID_CLASS_PREFIX = "lollipop-";
const DOMAIN_ID_CLASS_PREFIX = "domain-";
const SEQUENCE_ID_CLASS_PREFIX = "sequence-";

@observer
export default class LollipopPlotNoTooltip extends React.Component<LollipopPlotNoTooltipProps, {}> {

    private lollipopComponents:{[lollipopIndex:string]:Lollipop};
    private domainComponents:{[domainIndex:string]:Domain};
    private sequenceComponents: Sequence[] = [];

    private svg:SVGElement;
    private shiftPressed:boolean = false;
    private handlers:any;

    private lollipopZeroHeight = 10;
    private xAxisCandidateTickIntervals = [50, 100, 200, 250, 500, 1000, 2500, 5000, 10000, 25000];
    private yAxisCandidateTickIntervals = [1,2,5,10,20,50,100,200,500];
    private xAxisHeight = 30;
    private yAxisWidth = 50;
    private geneHeight = 14;
    private domainHeight = 24;

    constructor(props:LollipopPlotNoTooltipProps) {
        super(props);
        this.handlers = {
            ref: (svg:SVGElement)=>{this.svg = svg;},
            onBackgroundClick:()=>{
                this.props.dataStore.clearSelectedPositions();
            },
            onBackgroundMouseMove:()=>{
                this.props.onBackgroundMouseMove && this.props.onBackgroundMouseMove();
                // unhover all of the lollipops if mouse hits background
                this.unhoverAllLollipops();
            },
            onLollipopClick:(codon:number)=>{
                const isSelected = this.props.dataStore.isPositionSelected(codon);
                if (!this.shiftPressed) {
                    this.props.dataStore.clearSelectedPositions();
                }
                this.props.dataStore.setPositionSelected(codon, !isSelected);
            },
            onKeyDown:(e: JQueryKeyEventObject)=>{
                if (e.which === 16) {
                    this.shiftPressed = true;
                }
            },
            onKeyUp:(e: JQueryKeyEventObject)=>{
                if (e.which === 16) {
                    this.shiftPressed = false;
                }
            },
            onMouseOver:(e: SyntheticEvent<any>)=>{
                // No matter what, unhover all lollipops - if we're hovering one, we'll set it later in this method
                this.unhoverAllLollipops();

                const target = e.target as SVGElement;
                const className = target.getAttribute("class") || "";
                const lollipopIndex: number|null = this.getLollipopIndex(className);
                let domainIndex: number|null = null;
                let sequenceIndex: number|null = null;

                if (lollipopIndex !== null) {
                    const lollipopComponent = this.lollipopComponents[lollipopIndex];
                    if (lollipopComponent) {
                        lollipopComponent.isHovered = true;
                        if (this.props.setHitZone) {
                            this.props.setHitZone(
                                lollipopComponent.circleHitRect,
                                lollipopComponent.props.spec.tooltip,
                                action(()=>{
                                    this.props.dataStore.setPositionHighlighted(lollipopComponent.props.spec.codon, true);
                                    lollipopComponent.isHovered = true
                                }),
                                ()=>this.handlers.onLollipopClick(lollipopComponent.props.spec.codon)
                            );
                        }
                    }
                } else {
                    domainIndex = this.getDomainIndex(className);
                }

                if (domainIndex !== null) {
                    const domainComponent = this.domainComponents[domainIndex];
                    if (domainComponent) {
                        if (this.props.setHitZone) {
                            this.props.setHitZone(
                                domainComponent.hitRect,
                                domainComponent.props.spec.tooltip,
                                undefined, undefined, undefined,
                                "auto"
                            );
                        }
                    }
                }
                else {
                    sequenceIndex = this.getSequenceIndex(className);
                }

                if (sequenceIndex !== null) {
                    const sequenceComponent = this.sequenceComponents[sequenceIndex];
                    if (sequenceComponent) {
                        if (this.props.setHitZone) {
                            this.props.setHitZone(
                                sequenceComponent.hitRect,
                                sequenceComponent.props.spec.tooltip,
                                undefined, undefined, undefined,
                                "auto"
                            );
                        }
                    }
                }
            },
            onSVGMouseLeave:(e:SyntheticEvent<any>)=>{
                const target = e.target as Element;
                if (target.tagName.toLowerCase() === "svg") {
                    this.props.onMouseLeave && this.props.onMouseLeave();
                }
            }
        };
    }

    private unhoverAllLollipops() {
        for (const index of Object.keys(this.lollipopComponents)) {
            const component = this.lollipopComponents[index];
            if (component) {
                component.isHovered = false;
            }
        }
        this.props.dataStore.clearHighlightedPositions();
    }


    componentDidMount() {
        // Make it so that if you hold down shift, you can select more than one lollipop at once
        $(document).on("keydown",this.handlers.onKeyDown);
        $(document).on("keyup", this.handlers.onKeyUp);
        this.props.onXAxisOffset && this.props.onXAxisOffset(this.geneX);
    }

    componentWillUnmount() {
        $(document).off("keydown",this.handlers.onKeyDown);
        $(document).off("keyup", this.handlers.onKeyUp);
    }

    componentDidUpdate() {
        this.props.onXAxisOffset && this.props.onXAxisOffset(this.geneX);
    }

    private codonToX(codon:number) {
        return (codon/this.props.xMax)*this.props.vizWidth;
    }

    private countToHeight(count:number) {
        return this.lollipopZeroHeight + Math.min(1, (count/this.yMax))*this.yAxisHeight;
    }

    private calculateTickInterval(candidates:number[], rangeSize:number, maxTickCount:number) {
        let ret:number;
        const tickInterval = candidates.find(c=>((rangeSize/c) < (maxTickCount - 1)));
        if (!tickInterval) {
            ret = 10;
            while ((rangeSize/ret) > (maxTickCount - 1)) {
                ret *= 10;
            }
        } else {
            ret = tickInterval;
        }
        return ret;
    }

    private calculateTicks(tickInterval:number, rangeSize:number, labelEvenTicks:boolean) {
        const ret: {position: number, label: string|undefined}[] = [];
        let nextTick = tickInterval;
        while (nextTick < rangeSize) {
            let label: string|undefined = undefined;

            // add label only for the even ticks
            // but do not add label if it is too close to the end value
            if (labelEvenTicks
                && (rangeSize - nextTick > (2*tickInterval) / 3)
                && (nextTick % (2*tickInterval) === 0)) {
                label = nextTick + "";
            }
            ret.push({
                position: nextTick,
                label
            });
            nextTick += tickInterval;
        }
        return ret;
    }

    @computed private get xAxisTickInterval() {
        return this.calculateTickInterval(this.xAxisCandidateTickIntervals, this.props.xMax, 16);
    }

    @computed private get yAxisTickInterval() {
        return this.calculateTickInterval(this.yAxisCandidateTickIntervals, this.yMax, 10);
    }

    @computed private get xTicks() {
        let ret:Tick[] = [];
        // Start and end, always there
        ret.push({
            position:0,
            label:"0"
        });
        ret.push({
            position:this.props.xMax,
            label: this.props.xMax+"aa"
        });
        // Intermediate ticks, every other one labeled
        ret = ret.concat(this.calculateTicks(this.xAxisTickInterval, this.props.xMax, true));
        return ret;
    }

    @computed private get yTicks() {
        let ret:Tick[] = [];
        // Start and end, always there
        ret.push({
            position:0,
            label:"0"
        });
        ret.push({
            position:this.yMax,
            label:this.yMaxLabel
        });
        // Intermediate ticks, unlabeled
        ret = ret.concat(this.calculateTicks(this.yAxisTickInterval, this.yMax, false));
        return ret;
    }

    @computed private get yMax() {
        return this.props.yMax || this.props.lollipops.reduce((max:number, next:LollipopSpec)=>{
                return Math.max(max, next.count);
            }, 1);
    }

    @computed private get yMaxLabel() {
        return (this.props.lollipops.find(lollipop=>(lollipop.count > this.yMax)) ? ">= " : "") + this.yMax;
    }

    @computed private get yAxisHeight() {
        return this.props.vizHeight - this.domainHeight - this.lollipopZeroHeight;
    }

    @computed private get geneX() {
        return this.yAxisWidth + 20;
    }

    @computed private get geneY() {
        return this.props.vizHeight - this.geneHeight + 30;
    }

    @computed private get domainY() {
        return this.geneY - ((this.domainHeight - this.geneHeight) / 2);
    }

    // we need to create segments for the sequence rectangle for better handling of the tooltip hit zone
    @computed private get sequenceSegments() {
        const sequenceComponents: JSX.Element[] = [];

        let start = 0;

        let segments = _.map(this.props.domains, (domain:DomainSpec) => {
            const segment = {
                start,
                end: this.codonToX(domain.startCodon) // segment ends at the start of the current domain
            };

            // next segment starts at the end of the current domain
            start = this.codonToX(domain.endCodon);

            return segment;
        });

        // last segment after the last domain
        const end = this.props.vizWidth;
        segments.push({start, end});

        // sort segments by start position
        segments.sort((a:{start:number, end:number}, b:{start:number, end:number}) => {
            return a.start - b.start;
        });

        segments.forEach((segment:{start:number, end:number}, index:number) => {
            sequenceComponents.push(
                <Sequence
                    ref={(sequenceComponent) => {
                        if (sequenceComponent !== null) {
                            this.sequenceComponents[index] = sequenceComponent;
                        }
                    }}
                    color="#BABDB6"
                    x={this.geneX + segment.start}
                    y={this.geneY}
                    height={this.geneHeight}
                    width={segment.end - segment.start}
                    spec={this.props.sequence}
                    hitzoneClassName={[DELETE_FOR_DOWNLOAD_CLASS, this.makeSequenceIndexClass(index)].join(" ")}
                />
            );
        });

        return sequenceComponents;
    }

    @computed private get lollipops() {
        this.lollipopComponents = {};
        const maxMutations = this.yMax;
        const hoverHeadRadius = 5;
        return this.props.lollipops.map((lollipop:LollipopSpec, i:number)=>{
            return (<Lollipop
                    key={lollipop.codon}
                    ref={(lollipopComponent:Lollipop)=>{ if (lollipopComponent !== null) { this.lollipopComponents[i] = lollipopComponent; } }}
                    x={this.geneX + this.codonToX(lollipop.codon)}
                    stickBaseY={this.geneY}
                    stickHeight={this.countToHeight(lollipop.count)}
                    headRadius={this.props.dataStore.isPositionSelected(lollipop.codon) ? 5 : 2.8}
                    hoverHeadRadius={hoverHeadRadius}
                    label={lollipop.label}
                    headColor={lollipop.color}
                    hitzoneClassName={[DELETE_FOR_DOWNLOAD_CLASS, this.makeLollipopIndexClass(i)].join(" ")}
                    spec={lollipop}
                />
            );
        });
    }

    @computed private get domains() {
        this.domainComponents = {};
        return this.props.domains.map((domain:DomainSpec, index:number)=>{
            const x = this.codonToX(domain.startCodon);
            const width = this.codonToX(domain.endCodon) - x;
            return (
                <Domain
                    key={index}
                    ref={(domainComponent:Domain)=>{ if (domainComponent !== null) { this.domainComponents[index] = domainComponent; } }}
                    x={this.geneX + x}
                    y={this.domainY}
                    width={width}
                    height={this.domainHeight}
                    color={domain.color}
                    label={domain.label}
                    labelColor={domain.labelColor}
                    hitzoneClassName={[DELETE_FOR_DOWNLOAD_CLASS, this.makeDomainIndexClass(index)].join(" ")}
                    spec={domain}
                />
            );
        });
    }

    @computed public get svgWidth() {
        return this.props.vizWidth + this.geneX + 30;
    }

    @computed public get svgHeight() {
        return this.geneY + this.domainHeight + this.xAxisHeight;
    }

    private makeDomainIndexClass(index:number) {
        return `${DOMAIN_ID_CLASS_PREFIX}${index}`;
    }

    private makeLollipopIndexClass(index:number) {
        return `${LOLLIPOP_ID_CLASS_PREFIX}${index}`;
    }

    private makeSequenceIndexClass(index:number) {
        return `${SEQUENCE_ID_CLASS_PREFIX}${index}`;
    }

    private getComponentIndex(classes:string, classPrefix:string):number|null {
        const match = classes.split(/[\s]+/g).map(c=>c.match(new RegExp(`^${classPrefix}(.*)$`)))
            .find(x=>(x !== null));
        if (!match) {
            return null;
        } else {
            return parseInt(match[1], 10);
        }
    }

    private getDomainIndex(classes:string):number|null {
        return this.getComponentIndex(classes, DOMAIN_ID_CLASS_PREFIX);
    }

    private getLollipopIndex(classes:string):number|null {
        return this.getComponentIndex(classes, LOLLIPOP_ID_CLASS_PREFIX);
    }

    private getSequenceIndex(classes:string):number|null {
        return this.getComponentIndex(classes, SEQUENCE_ID_CLASS_PREFIX);
    }

    public toSVGDOMNode():Element {
        if (this.svg) {
            // Clone node
            const svg = this.svg.cloneNode(true) as Element;
            $(svg).find("."+DELETE_FOR_DOWNLOAD_CLASS).remove();
            return svg;
        } else {
            return document.createElementNS("http://www.w3.org/2000/svg", "svg");
        }
    }

    render() {
        return (
            <div onMouseOver={this.handlers.onMouseOver}>
                <svg xmlns="http://www.w3.org/2000/svg"
                     ref={this.handlers.ref}
                     width={this.svgWidth}
                     height={this.svgHeight}
                     className="lollipop-svgnode"
                     onMouseLeave={this.handlers.onSVGMouseLeave}
                >
                    <rect
                        fill="#FFFFFF"
                        x={0}
                        y={0}
                        width={this.svgWidth}
                        height={this.svgHeight}
                        onClick={this.handlers.onBackgroundClick}
                        onMouseMove={this.handlers.onBackgroundMouseMove}
                    />
                    {
                        // Originally this had tooltips by having separate segments
                        // with hit zones. We disabled those separate segments with
                        // tooltips (this.sequenceSegments) and instead just draw
                        // one rectangle
                        // this.sequenceSegments
                    }
                    <rect
                        fill="#BABDB6"
                        x={this.geneX}
                        y={this.geneY}
                        height={this.geneHeight}
                        width={
                            // the x-axis start from 0, so the rectangle size should be (width + 1)
                            this.props.vizWidth + 1
                        }
                    />
                    {this.lollipops}
                    {this.domains}
                    <SVGAxis
                        key="horz"
                        x={this.geneX}
                        y={this.geneY + this.geneHeight + 10}
                        length={this.props.vizWidth}
                        tickLength={7}
                        rangeLower={0}
                        rangeUpper={this.props.xMax}
                        ticks={this.xTicks}
                    />
                    <SVGAxis
                        key="vert"
                        x={this.geneX-10}
                        y={this.geneY - this.lollipopZeroHeight - this.yAxisHeight}
                        length={this.yAxisHeight}
                        tickLength={7}
                        rangeLower={0}
                        rangeUpper={this.yMax}
                        ticks={this.yTicks}
                        vertical={true}
                        label={`# ${this.props.hugoGeneSymbol} Mutations`}
                    />
                </svg>
            </div>
        );
    }
}
