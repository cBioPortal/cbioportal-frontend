import * as React from 'react';
import {Td} from 'reactableMSK';
import {IColumnFormatterData, IColumnFormatter} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import Tooltip from 'rc-tooltip'
import {compareNumberLists} from '../../../../shared/lib/SortUtils';
import 'rc-tooltip/assets/bootstrap_white.css';

export default class AlleleFreqColumnFormatter implements IColumnFormatter {
    static barWidth = 6;
    static barSpacing = 3;
    static maxBarHeight = 12;
    static indexToBarLeft = (n) => n*(AlleleFreqColumnFormatter.barWidth + AlleleFreqColumnFormatter.barSpacing);

    public static renderFunction(data:IColumnFormatterData, columnProps:any) {
        const barX = columnProps.sampleOrder.reduce((map, sampleId, i) => {map[sampleId] = AlleleFreqColumnFormatter.indexToBarLeft(i); return map}, {});
        const elements = data.rowData.map(function(mutation) {
            const altReads = mutation.tumorAltCount;
            const refReads = mutation.tumorRefCount;
            const freq = altReads / (altReads + refReads);
            const barHeight = (isNaN(freq) ? 0 : freq)*AlleleFreqColumnFormatter.maxBarHeight;
            const barY = AlleleFreqColumnFormatter.maxBarHeight - barHeight;


            const bar = (<rect x={barX[mutation.sampleId]} y={barY} width={AlleleFreqColumnFormatter.barWidth} height={barHeight} fill={columnProps.sampleColors[mutation.sampleId]}></rect>);

            const circleRadius = 6;
            const sampleId = mutation.sampleId;
            const circle = (<svg width={circleRadius*2} height={circleRadius*2}>
                <g key={sampleId} transform={`translate(${circleRadius},${circleRadius})`}>
                    <circle r={circleRadius} fill={columnProps.sampleColors[sampleId]}></circle>
                    <text y={circleRadius-2} textAnchor="middle" fontSize="10" fill="white">
                        {columnProps.sampleLabels[sampleId]}
                    </text>
                </g>
            </svg>);

            const text = (<span>
                    <strong>{Math.round(100*freq)/100}</strong> {`(${altReads} variant reads out of ${altReads+refReads} total)`}
                </span>);
            return {
                sampleId, bar, circle, text, freq
            };
        });
        const sampleToElements = elements.reduce((map, elements) => {map[elements.sampleId] = elements; return map; }, {});
        const elementsInSampleOrder = columnProps.sampleOrder.map(sampleId => sampleToElements[sampleId]).filter(x => !!x);
        const tooltipLines = elementsInSampleOrder.map(elements=>(<span key={elements.sampleId}>{elements.circle}  {elements.text}<br/></span>));
        const freqs = columnProps.sampleOrder.map(sampleId => (sampleToElements[sampleId] && sampleToElements[sampleId].freq) || undefined);
        const bars = elementsInSampleOrder.map(elements=>elements.bar);

        return (<Td column={data.name} value={freqs}>
            <Tooltip placement="left" overlay={tooltipLines} arrowContent={<div className="rc-tooltip-arrow-inner"></div>}>
                <svg width={columnProps.sampleOrder.length*AlleleFreqColumnFormatter.barWidth + (columnProps.sampleOrder.length-1)*AlleleFreqColumnFormatter.barSpacing}
                     height={AlleleFreqColumnFormatter.maxBarHeight}>
                    {bars}
                </svg>
            </Tooltip>
        </Td>);
    }
    public static sortFunction(a:number[], b:number[]) {
        const result = compareNumberLists(a,b);
        return (result === 1);
    }
}