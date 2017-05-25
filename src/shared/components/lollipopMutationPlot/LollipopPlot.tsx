import * as React from 'react';
import _ from "lodash";
import Lollipop from "./Lollipop";
import Domain from "./Domain";
import SVGAxis from "../SVGAxis";
import {Tick} from "../SVGAxis";
import {observer} from "mobx-react";
import {observable, asMap, ObservableMap, computed} from "mobx";
import $ from "jquery";
import DefaultTooltip from "../DefaultTooltip";
import LollipopPlotNoTooltip from "./LollipopPlotNoTooltip";
import {LollipopSpec} from "./LollipopPlotNoTooltip";
import {DomainSpec} from "./LollipopPlotNoTooltip";
import ReactDOM from "react-dom";
import HitZone from "./HitZone";
import MutationMapperDataStore from "../../../pages/resultsView/mutation/MutationMapperDataStore";

export type LollipopPlotProps = {
    lollipops:LollipopSpec[];
    domains:DomainSpec[];
    vizWidth:number;
    vizHeight:number;
    xMax:number;
    yMax?:number;
    dataStore:MutationMapperDataStore;
    onXAxisOffset?:(offset:number)=>void;
};

@observer
export default class LollipopPlot extends React.Component<LollipopPlotProps, {}> {
    @observable private hitZoneConfig:{hitRect:{x:number, y:number, width:number, height:number}, content?:JSX.Element,
        onMouseOver?:()=>void, onClick?:()=>void, onMouseOut?:()=>void} = {
        hitRect: {
            x:0, y:0, width:0, height:0
        },
        content:(<span></span>),
        onMouseOver:()=>0,
        onClick:()=>0,
        onMouseOut:()=>0
    }

    private plot:LollipopPlotNoTooltip;
    private handlers:any;

    constructor() {
        super();

        this.handlers = {
            ref: (plot:LollipopPlotNoTooltip)=>{ this.plot = plot; },
            setHitZone:(hitRect:{x:number, y:number, width:number, height:number}, content?:JSX.Element,
                        onMouseOver?:()=>void, onClick?:()=>void, onMouseOut?:()=>void)=>{
                this.hitZoneConfig = {
                    hitRect, content, onMouseOver, onClick, onMouseOut
                };
            },
            getOverlay:()=>this.hitZoneConfig.content,
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
            <div style={{position:"relative"}}>
                <DefaultTooltip
                    placement="top"
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