import * as React from 'react';
import {If, Else, Then } from 'react-if';
import {Td} from 'reactable';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import DefaultTooltip from "shared/components/DefaultTooltip";
import {compareNumberLists} from '../../../../shared/lib/SortUtils';
import 'rc-tooltip/assets/bootstrap_white.css';
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";
import {Mutation} from "../../../../shared/api/generated/CBioPortalAPI";

export default class AlleleFreqColumnFormatter {
    static barWidth = 6;
    static barSpacing = 3;
    static maxBarHeight = 12;
    static indexToBarLeft = (n:number) => n*(AlleleFreqColumnFormatter.barWidth + AlleleFreqColumnFormatter.barSpacing);

    public static renderFunction(data:IColumnFormatterData<MutationTableRowData>, columnProps:any) {
        const sampleOrder = columnProps.sampleManager.getSampleIdsInOrder();
        const barX = sampleOrder.reduce((map:{[s:string]:number}, sampleId:string, i:number) => {map[sampleId] = AlleleFreqColumnFormatter.indexToBarLeft(i); return map;}, {});
        const mutations:Array<Mutation> = data.rowData || [];
        const sampleElements = mutations.map(function(mutation:Mutation) {
            const altReads = mutation.tumorAltCount;
            const refReads = mutation.tumorRefCount;
            if ((altReads < 0) || (refReads < 0)) {
                return null;
            }
            const freq = altReads / (altReads + refReads);
            const barHeight = (isNaN(freq) ? 0 : freq)*AlleleFreqColumnFormatter.maxBarHeight;
            const barY = AlleleFreqColumnFormatter.maxBarHeight - barHeight;


            const bar = (<rect x={barX[mutation.sampleId]} y={barY} width={AlleleFreqColumnFormatter.barWidth} height={barHeight} fill={columnProps.sampleManager.getColorForSample(mutation.sampleId)}/>);

            const circleRadius = 6;
            const sampleId = mutation.sampleId;
            const component = columnProps.sampleManager.getComponentForSample(sampleId);

            const text = (<span>
                    <strong>{Math.round(100*freq)/100}</strong> {`(${altReads} variant reads out of ${altReads+refReads} total)`}
                </span>);
            return {
                sampleId, bar, component, text, freq
            };
        });
        const sampleToElements = sampleElements.reduce((map:{[s:string]:any}, elements:any) => {if (elements) { map[elements.sampleId] = elements }; return map; }, {});
        const elementsInSampleOrder = sampleOrder.map((sampleId:string) => sampleToElements[sampleId]).filter((x:any) => !!x);
        const tooltipLines = elementsInSampleOrder.map((elements:any)=>(<span key={elements.sampleId}>{elements.component}  {elements.text}<br/></span>));
        const freqs = sampleOrder.map((sampleId:string) => (sampleToElements[sampleId] && sampleToElements[sampleId].freq) || undefined);
        const bars = elementsInSampleOrder.map((elements:any)=>elements.bar);

        return (<Td key={data.name} column={data.name} value={freqs}>
            <If condition={columnProps.sampleManager.samples.length === 1}>
            <Then>
                <span>{ (!isNaN(freqs[0]) ? Math.round(100*freqs[0])/100 : '') }</span>
            </Then>
            <Else>
                <If condition={tooltipLines.length > 0}>
                    <DefaultTooltip
                        placement="left"
                        overlay={tooltipLines}
                        arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                    >

                        <svg
                            width={AlleleFreqColumnFormatter.getSVGWidth(sampleOrder.length)}
                            height={AlleleFreqColumnFormatter.maxBarHeight}
                        >
                            {bars}
                        </svg>
                    </DefaultTooltip>
                </If>
            </Else>
            </If>
        </Td>);
    }

    public static getSVGWidth(numSamples:number) {
        return numSamples*AlleleFreqColumnFormatter.barWidth + (numSamples-1)*AlleleFreqColumnFormatter.barSpacing
    }

    public static sortFunction(a:number[], b:number[]):number {
        return compareNumberLists(a, b);
    }
}
