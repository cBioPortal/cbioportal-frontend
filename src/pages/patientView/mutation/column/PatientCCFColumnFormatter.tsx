import * as React from 'react';
import {If, Else, Then } from 'react-if';
import DefaultTooltip from "shared/components/DefaultTooltip";
import 'rc-tooltip/assets/bootstrap_white.css';
import {Mutation} from "../../../../shared/api/generated/CBioPortalAPI";
import SampleManager from "../../sampleManager";
import {isUncalled} from '../../../../shared/lib/mutationUtils';

export default class PatientCCFColumnFormatter {
    static barWidth = 6;
    static barSpacing = 3;
    static maxBarHeight = 12;
    static indexToBarLeft = (n:number) => n*(PatientCCFColumnFormatter.barWidth + PatientCCFColumnFormatter.barSpacing);

    public static getComponentForSampleArgs<T extends {mutCCF:number,geneticProfileId:string}>(mutation:T) {
        const ccf = mutation.mutCCF;
        let opacity: number = 1;
        let extraTooltipText: string = '';

        return {
           opacity,
           extraTooltipText
        };
    }

    public static convertMutationToSampleElement<T extends {sampleId:string, mutCCF:number, geneticProfileId:string}>(mutation:T, color:string, barX:number, sampleComponent:any) {
            const ccf = mutation.mutCCF;
            if (ccf < 0) {
                return null;
            }

            const barHeight = (ccf == -1 ? 0 : ccf)*PatientCCFColumnFormatter.maxBarHeight;
            const barY = PatientCCFColumnFormatter.maxBarHeight - barHeight;

            const bar = (<rect x={barX} y={barY} width={PatientCCFColumnFormatter.barWidth} height={barHeight} fill={color}/>);
            const bar2 = (<rect x={barX} y={0} width={PatientCCFColumnFormatter.barWidth} height={PatientCCFColumnFormatter.maxBarHeight} fill={"#ccc"}/>);

            const text = (<span>
                    <strong>{ccf.toFixed(2)}</strong>
                </span>);
            return {
                sampleId:mutation.sampleId, bar2, bar, component:sampleComponent, text, ccf
            };
    }

    public static renderFunction(mutations:Mutation[], sampleManager:SampleManager|null) {
        if (!sampleManager) {
            return (<span></span>);
        }

        const sampleOrder = sampleManager.getSampleIdsInOrder();
        const barX = sampleOrder.reduce((map:{[s:string]:number}, sampleId:string, i:number) => {map[sampleId] = PatientCCFColumnFormatter.indexToBarLeft(i); return map;}, {});
        const sampleElements = mutations.map((m:Mutation) => {
        const args = PatientCCFColumnFormatter.getComponentForSampleArgs(m);
            return PatientCCFColumnFormatter.convertMutationToSampleElement(
                m,
                sampleManager.getColorForSample(m.sampleId),
                barX[m.sampleId],
                sampleManager.getComponentForSample(m.sampleId, args.opacity, args.extraTooltipText)
            );
        });
        const sampleToElements = sampleElements.reduce((map:{[s:string]:any}, elements:any) => {if (elements) { map[elements.sampleId] = elements } return map; }, {});
        const elementsInSampleOrder = sampleOrder.map((sampleId:string) => sampleToElements[sampleId]).filter((x:any) => !!x);
        const tooltipLines = elementsInSampleOrder.map((elements:any)=>(<span key={elements.sampleId}>{elements.component}  {elements.text}<br/></span>));
        const freqs = sampleOrder.map((sampleId:string) => (sampleToElements[sampleId] && sampleToElements[sampleId].freq) || undefined);
        const bars = elementsInSampleOrder.map((elements:any)=>elements.bar);
        const bars2 = elementsInSampleOrder.map((elements:any)=>elements.bar2);

        let content:JSX.Element = <span />;

        // single sample: just show the number
        if (sampleManager.samples.length === 1) {
            content = <span>{ (!isNaN(freqs[0]) ? freqs[0].toFixed(2) : '') }</span>;
        }
        // multiple samples: show a graphical component
        // (if no tooltip info available do not update content)
        else if (tooltipLines.length > 0) {
            content = (
                <svg
                    width={PatientCCFColumnFormatter.getSVGWidth(sampleOrder.length)}
                    height={PatientCCFColumnFormatter.maxBarHeight}
                >
                    {bars2}
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
        return numSamples*PatientCCFColumnFormatter.barWidth + (numSamples-1)*PatientCCFColumnFormatter.barSpacing
    }

    public static getSortValue(d:Mutation[], sampleManager:SampleManager|null) {
        if (!sampleManager) {
            return [null];
        }

        // frequencies in sample order
        const sampleToMutation = d.reduce((map:{[s:string]:Mutation}, next:Mutation)=>{
            map[next.sampleId] = next;
            return map;
        }, {});
        return sampleManager.getSampleIdsInOrder().map(sampleId=>sampleToMutation[sampleId]).map(mutation=>{
            if (!mutation) {
                return null;
            }
            const ccf = mutation.mutCCF;
            return (ccf);
        });
    }
}
