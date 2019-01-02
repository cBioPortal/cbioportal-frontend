import * as React from 'react';
//import * as _ from 'lodash';
//import {If, Else, Then } from 'react-if';
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
//import 'rc-tooltip/assets/bootstrap_white.css';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import SampleManager from "../../sampleManager";
//import {isUncalled} from 'shared/lib/MutationUtils';
import {floatValueIsNA} from "shared/lib/NumberUtils";

export default class FACETSClonalColumnFormatter {

    public static getDisplayValue(mutations:Mutation[], sampleIds:string[], sampleManager:SampleManager|null) {
        let values:string[] = [];
        const sampleToValue:{[key: string]: any} = {};
        const sampleToCCF:{[key: string]: number} = {};
        for (const mutation of mutations) {
            sampleToValue[mutation.sampleId] = FACETSClonalColumnFormatter.getClonalValue([mutation]);
        }
        for (const mutation of mutations) {
            sampleToCCF[mutation.sampleId] = mutation.ccfMCopies;
        }
        // exclude samples with invalid count value (undefined || emtpy || lte 0)
        const samplesWithValue = sampleIds.filter(sampleId =>
            sampleToValue[sampleId] && sampleToValue[sampleId].toString().length > 0);

        // single value: just add the actual value only
        let tdValue = null;
        if (!samplesWithValue) {
            return (<span></span>);
        } else if (samplesWithValue.length === 1) {
             tdValue = <li><DefaultTooltip overlay={FACETSClonalColumnFormatter.getTooltip(`${samplesWithValue[0]}`, `${sampleToValue[samplesWithValue[0]]}`, `${sampleToCCF[samplesWithValue[0]]}`)} placement="left" arrowContent={<div className="rc-tooltip-arrow-inner"/>}>{FACETSClonalColumnFormatter.getClonalCircle(sampleToValue[samplesWithValue[0]])}</DefaultTooltip></li>;
        }
        // multiple value: add sample id and value pairs
        else {
             tdValue = samplesWithValue.map((sampleId:string) => {
                return (
                    <li><DefaultTooltip overlay={FACETSClonalColumnFormatter.getTooltip(`${sampleId}`, `${sampleToValue[sampleId]}`, `${sampleToCCF[sampleId]}`)} placement="left" arrowContent={<div className="rc-tooltip-arrow-inner"/>}>{FACETSClonalColumnFormatter.getClonalCircle(`${sampleToValue[sampleId]}`)}</DefaultTooltip></li>
                );
            });
        }
        return (
                <span style={{display:'inline-block', minWidth:100}}>
                    <ul style={{marginBottom:0}} className="list-inline list-unstyled">{ tdValue }</ul>
                </span>
               );
    }

    public static getTooltip(sampleId:string, clonalValue:string, ccfMCopies:string) {
        let clonalColor = "";
        if (clonalValue === "yes") {
            clonalColor = "limegreen";
        } else if  (clonalValue === "no") {
            clonalColor = "dimgrey";
        } else {
            clonalColor = "lightgrey";
        }
        return (
                <div>
                        <table>
                                <tr><td>Sample</td><td><strong>{sampleId}</strong></td></tr>
                                <tr><td>Clonal</td><td><span style={{color: `${clonalColor}`, fontWeight: "bold"}}>{clonalValue}</span></td></tr>
                                <tr><td style={{paddingRight:5}}>CCF</td><td><strong>{ccfMCopies}</strong></td></tr>
                        </table>
                </div>
        );
    }

    public static getClonalCircle(clonalValue:string) {
        let color:string = "";
        if (clonalValue === "yes") {
            color = "limegreen";
        } else if (clonalValue === "no") {
            color = "dimgrey";
        } else {
            color = "lightgrey";
        }
        return (
                <svg height="10" width="10">
                    <circle cx={5} cy={5} r={5} fill={`${color}`}/>
                </svg>
        );
    }

    public static getCcfMCopiesUpperValue(mutations:Mutation[]):number {
        const ccfMCopiesUpperValue = mutations[0].ccfMCopiesUpper;
        return ccfMCopiesUpperValue;
    }

    public static getCcfMCopiesValue(mutations:Mutation[]):number {
        const ccfMCopiesValue = mutations[0].ccfMCopies;
        return ccfMCopiesValue;
    }

    public static getClonalValue(mutations:Mutation[]):string {
        let textValue:string = "";
        const ccfMCopiesUpperValue = FACETSClonalColumnFormatter.getCcfMCopiesUpperValue(mutations);
        if (floatValueIsNA(ccfMCopiesUpperValue)) {
            textValue = "";
        } else if (ccfMCopiesUpperValue === 1) {
            textValue = "yes";
        } else {
            textValue = "no";
        }
        return textValue;
    }

    public static renderFunction(mutations:Mutation[], sampleIds:string[], sampleManager:SampleManager|null) {
        if (!sampleManager) {
            return (<span></span>);
        }
        const sampleOrder = sampleManager.getSampleIdsInOrder();
        const sampleElements = mutations.map((m:Mutation) => {
            const args = FACETSClonalColumnFormatter.getComponentForSampleArgs(m);
            return FACETSClonalColumnFormatter.convertMutationToSampleElement(
                m,
                sampleManager.getColorForSample(m.sampleId),
                sampleManager.getComponentForSample(m.sampleId, args.opacity, args.extraTooltipText)
            );
        });
        return FACETSClonalColumnFormatter.getDisplayValue(mutations, sampleIds, sampleManager);
    }

    public static getClonalDownload(mutations:Mutation[]): string|string[] {
        let result = [];
        if (mutations) {
            for (let mutation of mutations) {
                result.push(FACETSClonalColumnFormatter.getClonalValue([mutation]));
            }
        }
        if (result.length == 1) {
            return result[0];
        }
        return result;
    }









    public static getComponentForSampleArgs<T extends {ccfMCopies:number}>(mutation:T) {
        const ccfMCopiesValue = mutation.ccfMCopies;
        let opacity: number = 1;
        let extraTooltipText: string = '';
        if (ccfMCopiesValue !== 1) {
            opacity = .5;
        }
        return {
           opacity,
           extraTooltipText
        };
    }


    public static convertMutationToSampleElement<T extends {sampleId:string, ccfMCopies:number}>(mutation:T, color:string, sampleComponent:any) {
            const ccfMCopies = mutation.ccfMCopies;
            const text = (<span>
                    <strong>{ccfMCopies.toFixed(2)}</strong>
                </span>);
            return {
                sampleId:mutation.sampleId, component:sampleComponent, text, ccfMCopies
            };
    }

/*
    public static renderFunction(mutations:Mutation[], sampleManager:SampleManager|null) {
        const barX = sampleOrder.reduce((map, sampleId:string, i:number) => {map[sampleId] = FACETSColumnFormatter.indexToBarLeft(i); return map;}, {} as {[s:string]:number});
        const sampleElements = mutations.map((m:Mutation) => {
            const args = FACETSColumnFormatter.getComponentForSampleArgs(m);
            return FACETSColumnFormatter.convertMutationToSampleElement(
                m,
                sampleManager.getColorForSample(m.sampleId),
                barX[m.sampleId],
                sampleManager.getComponentForSample(m.sampleId, args.opacity, args.extraTooltipText)
            );
        });
        const sampleToElements = sampleElements.reduce((map, elements:any) => {if (elements) { map[elements.sampleId] = elements } return map; }, {} as {[s:string]:any});
        const elementsInSampleOrder = sampleOrder.map((sampleId:string) => sampleToElements[sampleId]).filter((x:any) => !!x);
        const tooltipLines = elementsInSampleOrder.map((elements:any)=>(<span key={elements.sampleId}>{elements.component}  {elements.text}<br/></span>));
        const ccfMCopiesValues = sampleOrder.map((sampleId:string) => (sampleToElements[sampleId] && sampleToElements[sampleId].ccfMCopies) || undefined);
        const bars = elementsInSampleOrder.map((elements:any)=>elements.bar);

        let content:JSX.Element = <span />;

        // single sample: just show the number
        if (sampleManager.samples.length === 1) {
            content = <span>{ (!isNaN(ccfMCopiesValues[0]) ? ccfMCopiesValues[0].toFixed(2) : '') }</span>;
        }
        // multiple samples: show a graphical component
        // (if no tooltip info available do not update content)
        else if (tooltipLines.length > 0) {
            content = (
                <svg
                    width={FACETSColumnFormatter.getSVGWidth(sampleOrder.length)}
                    height={FACETSColumnFormatter.maxBarHeight}
                >
                    {bars}
                </svg>
            );
        }
        // as long as we have tooltip lines, show tooltip in either cases (single or multiple)
        if (tooltipLines.length > 0)
        {
            const overlay = () => <span>{tooltipLines}</span>;

            content = (
                <DefaultTooltip
                    placement="left"
                    overlay={overlay}
                    arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                    destroyTooltipOnHide={true}
                >
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }

    public static getSVGWidth(numSamples:number) {
        return numSamples*FACETSColumnFormatter.barWidth + (numSamples-1)*FACETSColumnFormatter.barSpacing
    }
*/

}
