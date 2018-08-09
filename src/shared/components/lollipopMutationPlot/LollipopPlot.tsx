import * as React from 'react';
import {observer} from "mobx-react";
import {observable, computed} from "mobx";
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";
import {default as LollipopPlotNoTooltip, LollipopSpec, DomainSpec, SequenceSpec} from "./LollipopPlotNoTooltip";
import HitZone from "../HitZone";
import MutationMapperDataStore from "shared/components/mutationMapper/MutationMapperDataStore";
import {Gene} from "../../api/generated/CBioPortalAPI";

export type LollipopPlotProps = {
    sequence:SequenceSpec;
    lollipops:LollipopSpec[];
    domains:DomainSpec[];
    vizWidth:number;
    vizHeight:number;
    xMax:number;
    yMax?:number;
    hugoGeneSymbol:string;
    dataStore:MutationMapperDataStore;
    onXAxisOffset?:(offset:number)=>void;
};

type HitZoneConfig = {
    hitRect: {x:number, y:number, width:number, height:number};
    content?: JSX.Element;
    tooltipPlacement?: string;
    cursor?: string;
    onMouseOver?: () => void;
    onClick?: () => void;
    onMouseOut?: () => void;
}

@observer
export default class LollipopPlot extends React.Component<LollipopPlotProps, {}> {
    @observable private hitZoneConfig: HitZoneConfig = {
        hitRect: {
            x:0, y:0, width:0, height:0
        },
        content:(<span></span>),
        tooltipPlacement: "top",
        cursor: "pointer",
        onMouseOver:()=>0,
        onClick:()=>0,
        onMouseOut:()=>0
    };

    private plot:LollipopPlotNoTooltip;
    private handlers:any;

    constructor() {
        super();

        this.handlers = {
            ref: (plot:LollipopPlotNoTooltip)=>{ this.plot = plot; },
            setHitZone:(hitRect:{x:number, y:number, width:number, height:number},
                        content?:JSX.Element,
                        onMouseOver?:()=>void,
                        onClick?:()=>void,
                        onMouseOut?:()=>void,
                        cursor: string = "pointer",
                        tooltipPlacement: string = "top") => {
                this.hitZoneConfig = {
                    hitRect, content, onMouseOver, onClick, onMouseOut, cursor, tooltipPlacement
                };
            },
            getOverlay:()=>this.hitZoneConfig.content,
            getOverlayPlacement:()=>this.hitZoneConfig.tooltipPlacement,
            onMouseLeave:()=>{
                this.hitZoneConfig.onMouseOut && this.hitZoneConfig.onMouseOut();
            },
            onBackgroundMouseMove:()=>{
                this.hitZoneConfig.onMouseOut && this.hitZoneConfig.onMouseOut();
            }
        };
    }

    @computed private get tooltipVisible() {
        return !!this.hitZoneConfig.content;
    }

    @computed private get hitZone() {
        return (
            <HitZone
                y={this.hitZoneConfig.hitRect.y}
                x={this.hitZoneConfig.hitRect.x}
                width={this.hitZoneConfig.hitRect.width}
                height={this.hitZoneConfig.hitRect.height}
                onMouseOver={this.hitZoneConfig.onMouseOver}
                onClick={this.hitZoneConfig.onClick}
                onMouseOut={this.hitZoneConfig.onMouseOut}
                cursor={this.hitZoneConfig.cursor}
            />
        );
    }

    public toSVGDOMNode():Element {
        if (this.plot) {
            // Clone node
            return this.plot.toSVGDOMNode();
        } else {
            return document.createElementNS("http://www.w3.org/2000/svg", "svg");
        }
    }

    render() {
        const tooltipVisibleProps:any = {};
        if (!this.tooltipVisible) {
            tooltipVisibleProps.visible = false;
        }
        return (
            <div style={{position:"relative"}} data-test="LollipopPlot">
                <DefaultTooltip
                    placement={this.handlers.getOverlayPlacement()}
                    overlay={this.handlers.getOverlay}
                    {...tooltipVisibleProps}
                >
                    {this.hitZone}
                </DefaultTooltip>
                <LollipopPlotNoTooltip
                    ref={this.handlers.ref}
                    setHitZone={this.handlers.setHitZone}
                    onMouseLeave={this.handlers.onMouseLeave}
                    onBackgroundMouseMove={this.handlers.onBackgroundMouseMove}
                    {...this.props}
                />
            </div>
        );
    }
}
