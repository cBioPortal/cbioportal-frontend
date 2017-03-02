import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import DefaultTooltip from 'shared/components/DefaultTooltip';
import {compareNumberLists} from '../../../../shared/lib/SortUtils';
import 'rc-tooltip/assets/bootstrap_white.css';
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";
import {MrnaExprRankCacheType, MrnaExprRankCacheDataType} from "../../clinicalInformation/MrnaExprRankCache";
import {Mutation} from "../../../../shared/api/CBioPortalAPI";

export default class MrnaExprColumnFormatter {

    protected static getCircleX(percentile:number, circleLeft: number, circleRight:number) {
        const proportion = percentile/100;
        return circleLeft*(1-proportion) + circleRight*proportion;
    }

    protected static getCircleFill(percentile:number) {
        if (percentile < 25) {
            return "blue";
        } else if (percentile > 75) {
            return "red";
        } else {
            return "gray";
        }
    }

    protected static getTooltipContents(data:Mutation[]|undefined, mrnaExprData: MrnaExprRankCacheType) {
        const exprData = MrnaExprColumnFormatter.getData(data, mrnaExprData);
        if (exprData && exprData.status === "complete" && exprData.data !== null) {
            return (
                <div>
                    <span>mRNA level of the gene in this tumor</span><br/>
                    <span><b>mRNA z-score: </b>{exprData.data.zScore}</span><br/>
                    <span><b>Percentile: </b>{exprData.data.percentile}</span><br/>
                </div>
            );
        } else if (exprData && exprData.status === "complete" && exprData.data === null) {
            return (<span>mRNA data is not available for this gene.</span>);
        } else if (exprData && exprData.status === "error") {
            return (<span>Error.</span>);
        } else {
            return (<span>Querying server for data.</span>);
        }
    }

    private static getTdContents(data:Mutation[]|undefined, mrnaExprData: MrnaExprRankCacheType) {
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
        if (exprData && exprData.status === "complete" && exprData.data !== null) {
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
                    {Math.round(exprData.data.percentile)+"%"}
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
                        cx={MrnaExprColumnFormatter.getCircleX(exprData.data.percentile, circleXLeft, circleXRight)}
                        cy={8}
                        r={circleRadius}
                        fill={MrnaExprColumnFormatter.getCircleFill(exprData.data.percentile)}
                    />
                </g>
            </svg>);
        } else if (exprData && exprData.status === "complete" && exprData.data === null) {
            return (
                <span
                    style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                    alt="mRNA data is not available for this gene."
                >
                    NA
                </span>
            );
        } else if (exprData && exprData.status === "error") {
            return (<span
                style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                alt="mRNA data is not available for this gene."
            >
                    ERROR
                </span>);
        } else {
            return (
                <span
                    style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                    alt="Querying server for data."
                >
                    LOADING
                </span>
            );
        }
    }

    protected static getData(data: Mutation[] | undefined, mrnaExprData:MrnaExprRankCacheType):MrnaExprRankCacheDataType | null {
        if (!data || data.length === 0) {
            return null;
        }
        const sampleId = data[0].sampleId;
        const entrezGeneId = data[0].entrezGeneId;
        const cacheDatum = mrnaExprData && mrnaExprData[sampleId] && mrnaExprData[sampleId].geneData
            && mrnaExprData[sampleId].geneData[entrezGeneId];
        return cacheDatum || null;
    }

    protected static getTdValue(cacheDatum:MrnaExprRankCacheDataType | null) {
        if (cacheDatum !== null && cacheDatum.status === "complete" && cacheDatum.data !== null) {
            return cacheDatum.data.percentile;
        } else {
            return Number.POSITIVE_INFINITY;
        }
    }

    public static renderFunction(data: IColumnFormatterData<MutationTableRowData>, columnProps: any) {
        const exprData = MrnaExprColumnFormatter.getData(data.rowData, columnProps.data);
        return (<Td key={data.name} column={data.name} value={MrnaExprColumnFormatter.getTdValue(exprData)}>
            <DefaultTooltip
                placement="left"
                overlay={MrnaExprColumnFormatter.getTooltipContents(data.rowData, columnProps.data as MrnaExprRankCacheType)}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
            >
                {MrnaExprColumnFormatter.getTdContents(data.rowData, columnProps.data)}
            </DefaultTooltip>
        </Td>);
    }
}
