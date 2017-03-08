import * as React from 'react';
import {If, Else, Then } from 'react-if';
import {Td} from 'reactable';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import DefaultTooltip from "shared/components/DefaultTooltip";
import {compareNumberLists} from '../../../../shared/lib/SortUtils';
import 'rc-tooltip/assets/bootstrap_white.css';
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";
import {Mutation} from "../../../../shared/api/generated/CBioPortalAPI";
import SampleManager from "../../sampleManager";

export default class AlleleFreqColumnFormatter {
    static barWidth = 6;
    static barSpacing = 3;
    static maxBarHeight = 12;
    static indexToBarLeft = (n:number) => n*(AlleleFreqColumnFormatter.barWidth + AlleleFreqColumnFormatter.barSpacing);

    public static renderFunction(mutations:Mutation[], sampleManager:SampleManager|null) {
        if (!sampleManager) {
            return (<span></span>);
        }

        const sampleOrder = sampleManager.getSampleIdsInOrder();
        const barX = sampleOrder.reduce((map:{[s:string]:number}, sampleId:string, i:number) => {map[sampleId] = AlleleFreqColumnFormatter.indexToBarLeft(i); return map;}, {});
        const sampleElements = mutations.map(function(mutation:Mutation) {
            const altReads = mutation.tumorAltCount;
            const refReads = mutation.tumorRefCount;
            if ((altReads < 0) || (refReads < 0)) {
                return null;
            }
            const freq = altReads / (altReads + refReads);
            const barHeight = (isNaN(freq) ? 0 : freq)*AlleleFreqColumnFormatter.maxBarHeight;
            const barY = AlleleFreqColumnFormatter.maxBarHeight - barHeight;


            const bar = (<rect x={barX[mutation.sampleId]} y={barY} width={AlleleFreqColumnFormatter.barWidth} height={barHeight} fill={sampleManager.getColorForSample(mutation.sampleId)}/>);

            const circleRadius = 6;
            const sampleId = mutation.sampleId;
            const component = sampleManager.getComponentForSample(sampleId);

            const text = (<span>
                    <strong>{Math.round(100*freq)/100}</strong> {`(${altReads} variant reads out of ${altReads+refReads} total)`}
                </span>);
            return {
                sampleId, bar, component, text, freq
            };
        });
        const sampleToElements = sampleElements.reduce((map:{[s:string]:any}, elements:any) => {if (elements) { map[elements.sampleId] = elements } return map; }, {});
        const elementsInSampleOrder = sampleOrder.map((sampleId:string) => sampleToElements[sampleId]).filter((x:any) => !!x);
        const tooltipLines = elementsInSampleOrder.map((elements:any)=>(<span key={elements.sampleId}>{elements.component}  {elements.text}<br/></span>));
        const freqs = sampleOrder.map((sampleId:string) => (sampleToElements[sampleId] && sampleToElements[sampleId].freq) || undefined);
        const bars = elementsInSampleOrder.map((elements:any)=>elements.bar);

        let ret;
        if (sampleManager.samples.length === 1) {
            ret = (<span>{ (!isNaN(freqs[0]) ? Math.round(100*freqs[0])/100 : '') }</span>);
        } else if (tooltipLines.length > 0) {
            const overlay = (<span>{tooltipLines}</span>);
            ret = (<DefaultTooltip
                placement="left"
                overlay={overlay}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
            >

                <svg
                    width={AlleleFreqColumnFormatter.getSVGWidth(sampleOrder.length)}
                    height={AlleleFreqColumnFormatter.maxBarHeight}
                >
                    {bars}
                </svg>
            </DefaultTooltip>);
        } else {
            ret = (<span></span>);
        }
        return ret;
    }

    public static getSVGWidth(numSamples:number) {
        return numSamples*AlleleFreqColumnFormatter.barWidth + (numSamples-1)*AlleleFreqColumnFormatter.barSpacing
    }

    public static getSortValue(d:Mutation[], sampleManager:SampleManager|null) {
        if (!sampleManager) {
            return [Number.POSITIVE_INFINITY];
        }

        // frequencies in sample order
        const sampleToMutation = d.reduce((map:{[s:string]:Mutation}, next:Mutation)=>{
            map[next.sampleId] = next;
            return map;
        }, {});
        return sampleManager.getSampleIdsInOrder().map(sampleId=>sampleToMutation[sampleId]).map(mutation=>{
            const altReads = mutation.tumorAltCount;
            const refReads = mutation.tumorRefCount;
            if ((altReads < 0) || (refReads < 0)) {
                return null;
            }
            return (altReads / (altReads + refReads));
        });
    }
}
