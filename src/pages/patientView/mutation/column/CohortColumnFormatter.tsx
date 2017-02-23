import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import DefaultTooltip from 'shared/components/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";
import {MutSigData} from "../../PatientViewPage";
import {VariantCountCacheType} from "../../clinicalInformation/CohortVariantCountCache";

type FormatterData = {
    status: "complete" | "pending";
    data: {
        hugoGeneSymbol: string;
        keyword?: string;
        numberOfSamples: number;
        numberOfSamplesWithKeyword?: number;
        numberOfSamplesWithMutationInGene: number;
    } | null;
};

export default class CohortColumnFormatter {

    public static renderFunction(data:IColumnFormatterData<MutationTableRowData>, columnProps:{ mutSigData: MutSigData; variantCountData:VariantCountCacheType}) {
        const mutSigQValue:number|null = CohortColumnFormatter.getMutSigQValue(data, columnProps.mutSigData);
        const variantCountData = CohortColumnFormatter.getVariantCountData(data, columnProps.variantCountData);
        const freqViz = CohortColumnFormatter.makeCohortFrequencyViz(data, columnProps.variantCountData);
        let value;
        if (variantCountData.data) {
            value = variantCountData.data.numberOfSamplesWithMutationInGene;
        } else {
            value = Number.POSITIVE_INFINITY;
        }
        return (
            <Td key={data.name} column={data.name} value={value}>
                <div>
                    <span style={{marginRight:"3px"}}>
                        {(freqViz !== null) && freqViz}
                    </span>
                    {(mutSigQValue !== null) && CohortColumnFormatter.makeMutSigIcon(mutSigQValue)}
                </div>
            </Td>
        );
    };

    private static getVariantCountData(data:IColumnFormatterData<MutationTableRowData>, variantCountData:VariantCountCacheType):FormatterData {
        if (!variantCountData || !data.rowData || data.rowData.length === 0) {
            return { status: "pending", data:null };
        }
        const entrezGeneId = data.rowData[0].entrezGeneId;
        const hugoGeneSymbol = data.rowData[0].gene.hugoGeneSymbol;
        const keyword = data.rowData[0].keyword;

        const numberOfSamples = variantCountData.numberOfSamples;
        if (numberOfSamples === null) {
            return { status: "pending", data:null };
        }

        let numberOfSamplesWithKeyword, numberOfSamplesWithMutationInGene;
        const mutationInGeneData = variantCountData.mutationInGene[entrezGeneId];
        if (!mutationInGeneData || mutationInGeneData.status !== "complete") {
            return { status: "pending", data:null };
        } else if (mutationInGeneData.data === null) {
            return { status: "complete", data: null };
        } else {
            numberOfSamplesWithMutationInGene = mutationInGeneData.data;
        }

        const keywordData = keyword ? variantCountData.keyword[keyword] : null;
        if (!keywordData || keywordData.status !== "complete") {
            numberOfSamplesWithKeyword = undefined;
        } else {
            numberOfSamplesWithKeyword = keywordData.data || undefined;
        }

        return { status: "complete", data:{
            hugoGeneSymbol, keyword, numberOfSamples, numberOfSamplesWithKeyword, numberOfSamplesWithMutationInGene
        }};
    }

    private static getMutSigQValue(data:IColumnFormatterData<MutationTableRowData>, mutSigData:MutSigData) {
        if (!mutSigData || !data.rowData || data.rowData.length === 0) {
            return null;
        }
        const thisData = mutSigData[data.rowData[0].entrezGeneId];
        if (!thisData) {
            return null;
        }
        return thisData.qValue;
    }

    private static makeCohortFrequencyViz(data:IColumnFormatterData<MutationTableRowData>, variantCountData:VariantCountCacheType) {
        const variantCount = CohortColumnFormatter.getVariantCountData(data, variantCountData);
        if (variantCount.data) {
            const geneProportion = variantCount.data.numberOfSamplesWithMutationInGene / variantCount.data.numberOfSamples;
            const keywordProportion = typeof variantCount.data.numberOfSamplesWithKeyword !== "undefined" ? (variantCount.data.numberOfSamplesWithKeyword / variantCount.data.numberOfSamples) : null;
            const barWidth = 30;
            const barHeight = 8;
            return (<DefaultTooltip
                    placement="left"
                    overlay={CohortColumnFormatter.getCohortFrequencyTooltip(variantCount)}
                    arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                    >
                <svg width="70" height="12">
                    <text x="36" y="9.5" textAnchor="start" fontSize="10">{(100*geneProportion).toFixed(1) + "%"}</text>
                    <rect y="2" width={barWidth} height={barHeight} fill="#ccc"/>
                    <rect y="2" width={geneProportion*barWidth} height={barHeight} fill="lightgreen"/>
                    {(keywordProportion !== null) &&
                        (<rect y="2" width={keywordProportion*barWidth} height={barHeight} fill="green"/>)}
                </svg>
            </DefaultTooltip>);
        } else if (variantCount.status === "pending") {
            return (<DefaultTooltip
                placement="left"
                overlay={<span>Querying server for data.</span>}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
            >
                <span
                    style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                    alt="Querying server for data."
                >
                    LOADING
                </span>
            </DefaultTooltip>);
        } else {
            return (<DefaultTooltip
                placement="left"
                overlay={<span>Variant count data not available.</span>}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
            >
                <span
                    style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                    alt="Data not available."
                >
                    NA
                </span>
            </DefaultTooltip>);
        }
    }

    private static makeMutSigIcon(qValue:number) {
        return (<DefaultTooltip
            placement="right"
            overlay={CohortColumnFormatter.getMutSigTooltip(qValue)}
            arrowContent={<div className="rc-tooltip-arrow-inner"/>}
        >
            <svg width="12" height="12">
                <circle r="5" cx="6" cy="6" stroke="#55C" fill="none"/>
                <text x="3" y="8.5" fontSize="7" fill="#66C">
                    M
                </text>
            </svg>
        </DefaultTooltip>);
    }

    private static getBoldPercentage(proportion:number) {
        return (
            <span style={{fontWeight:'bold'}}>
                {(100*proportion).toFixed(1) + "%"}
            </span>
        );
    }

    private static getCohortFrequencyTooltip(variantCount:FormatterData) {
        if (variantCount.data) {
        return (<div>
            <span>{variantCount.data.numberOfSamplesWithMutationInGene} samples
            ({CohortColumnFormatter.getBoldPercentage(variantCount.data.numberOfSamplesWithMutationInGene / variantCount.data.numberOfSamples)})
            in this study have mutated {variantCount.data.hugoGeneSymbol}
                {(typeof variantCount.data.numberOfSamplesWithKeyword !== "undefined") && (
                    <span>
                        , out of which {variantCount.data.numberOfSamplesWithKeyword} ({CohortColumnFormatter.getBoldPercentage(variantCount.data.numberOfSamplesWithKeyword / variantCount.data.numberOfSamples)}) have {variantCount.data.keyword} mutations
                    </span>
                )}
                .
            </span>
        </div>);
        } else {
            return (<div></div>);
        }
    }

    private static getMutSigTooltip(qValue:number) {
        return (<div>
            <span style={{fontWeight:'bold'}}>MutSig</span><br/>
            <span> Q-value: {(qValue || 0).toExponential(3)}</span>
        </div>);
    }
}
