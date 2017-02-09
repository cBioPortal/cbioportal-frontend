import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import DefaultTooltip from 'shared/components/DefaultTooltip';
import {compareNumberLists} from '../../../../shared/lib/SortUtils';
import 'rc-tooltip/assets/bootstrap_white.css';
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";

export default class MrnaExprColumnFormatter {

    private static getCircleX(data: IColumnFormatterData<MutationTableRowData>, percentile:number, circleLeft: number, circleRight:number) {
        const proportion = percentile/100;
        return circleLeft*(1-proportion) + circleRight*proportion;
    }

    private static getCircleFill(percentile:number) {
        if (percentile < 25) {
            return "blue";
        } else if (percentile > 75) {
            return "red";
        } else {
            return "gray";
        }
    }

    private static getTooltipContents(data:IColumnFormatterData<MutationTableRowData>, mrnaExprData: any) {
        const exprData = MrnaExprColumnFormatter.getData(data, mrnaExprData);
        if (exprData) {
            return (
                <div>
                    <span>mRNA level of the gene in this tumor</span><br/>
                    <span><b>mRNA z-score: </b>{exprData.zScore}</span><br/>
                    <span><b>Percentile: </b>{exprData.percentile}</span><br/>
                </div>
            );
        } else {
            return (<span>mRNA data is not available for this gene.</span>);

        }
    }

    private static getTdContents(data:IColumnFormatterData<MutationTableRowData>, mrnaExprData: any) {
        const barWidth = 30;
        const circleRadius = 3;
        const barXLeft = 0;
        const circleXLeft = barXLeft + circleRadius;
        const barXRight = barXLeft + barWidth;
        const circleXRight = barXRight - circleRadius;
        const textWidth = 30;
        const textXLeft = circleXRight + circleRadius + 3;
        const width = textXLeft + textWidth;
        const exprData = MrnaExprColumnFormatter.getData(data, mrnaExprData);
        if (exprData) {
            return (<svg
                width={width}
                height={12}
            >
                <text
                    x={textXLeft}
                    y={11}
                    textAnchor="start"
                    fontSize={10}
                >
                    {Math.round(exprData.percentile)+"%"}
                </text>
                <g>
                    <line
                        x1={barXLeft}
                        y1={8}
                        x2={barXRight}
                        y2={8}
                        style={{stroke:"gray", strokeWidth:2}}
                    />
                    <circle
                        cx={MrnaExprColumnFormatter.getCircleX(data, exprData.percentile, circleXLeft, circleXRight)}
                        cy={8}
                        r={circleRadius}
                        fill={MrnaExprColumnFormatter.getCircleFill(exprData.percentile)}
                    />
                </g>
            </svg>);
        } else {
            return (
                <span
                    style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                    alt="mRNA data is not available for this gene."
                >
                    NA
                </span>
            );
        }
    }

    private static getData(data: IColumnFormatterData<MutationTableRowData>, mrnaExprData:any) {
        if (!data.rowData || data.rowData.length === 0) {
            return null;
        }
        const sampleId = data.rowData[0].sampleId;
        const entrezGeneId = data.rowData[0].entrezGeneId;
        const ret = mrnaExprData && mrnaExprData[sampleId] && mrnaExprData[sampleId][entrezGeneId];
        return ret || null;
    }

    public static renderFunction(data: IColumnFormatterData<MutationTableRowData>, columnProps: any) {
        const exprData = MrnaExprColumnFormatter.getData(data, columnProps.data);
        return (<Td key={data.name} column={data.name} value={exprData? exprData.percentile : Number.POSITIVE_INFINITY}>
            <DefaultTooltip
                placement="left"
                overlay={MrnaExprColumnFormatter.getTooltipContents(data, columnProps.data)}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
            >
                {MrnaExprColumnFormatter.getTdContents(data, columnProps.data)}
            </DefaultTooltip>
        </Td>);
    }
}
