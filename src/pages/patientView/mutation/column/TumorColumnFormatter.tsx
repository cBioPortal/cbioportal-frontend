import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import Tooltip from 'rc-tooltip';
import {compareNumberLists} from '../../../../shared/lib/SortUtils';
import 'rc-tooltip/assets/bootstrap_white.css';


export default class TumorColumnFormatter {

    static circleRadius = 6;
    static circleSpacing = 4;
    static indexToCircleLeft = (n:number) => n*(TumorColumnFormatter.circleSpacing + 2*TumorColumnFormatter.circleRadius);

    public static renderFunction(data:IColumnFormatterData, columnProps:any) {
        const svgX = columnProps.sampleOrder.reduce((map:{[s:string]:number}, sampleId:string, i:number) => {map[sampleId] = TumorColumnFormatter.indexToCircleLeft(i); return map;}, {});
        const samples = TumorColumnFormatter.getSampleIds(data);
        const tooltipText = (sampleId:string) => (`${sampleId}, ${columnProps.sampleTumorType[sampleId]}, ${columnProps.sampleCancerType[sampleId]}`);
        const circles = samples.map(function(sampleId:string) {
            return (
                <Tooltip key={sampleId} placement="right" overlay={tooltipText(sampleId)} arrowContent={<div className="rc-tooltip-arrow-inner"/>}>
                    <svg width={2*TumorColumnFormatter.circleRadius} height={2*TumorColumnFormatter.circleRadius} style={{position:'absolute', left:svgX[sampleId]}}>
                        <g key={sampleId} transform={`translate(${TumorColumnFormatter.circleRadius},${TumorColumnFormatter.circleRadius})`}>
                            <circle r={TumorColumnFormatter.circleRadius} fill={columnProps.sampleColors[sampleId]}/>
                            <text y={TumorColumnFormatter.circleRadius - 2} textAnchor="middle" fontSize="10" fill="white">
                                {columnProps.sampleLabels[sampleId]}
                            </text>
                        </g>
                    </svg>
                </Tooltip>
            );
        });
        const presentSamples = samples.reduce((map:{[s:string]:boolean}, sampleId:string) => {map[sampleId] = true; return map;}, {});
        const tdValue = columnProps.sampleOrder.map((sampleId:string) => (presentSamples[sampleId] ? 1 : 0));
        return (
            <Td key={data.name} column={data.name} value={tdValue}>
                <div style={{position:'relative'}}>
                    {circles}
                </div>
            </Td>
        );
    };

    public static sortFunction(a:number[], b:number[]):number {
        return compareNumberLists(a, b);
    }

    private static getSampleIds(data:IColumnFormatterData) {
        return data.rowData.map((x:any) => x.sampleId);
    }
}
