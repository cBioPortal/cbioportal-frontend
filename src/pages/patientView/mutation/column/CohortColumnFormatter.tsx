import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import DefaultTooltip from 'shared/components/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";
import {MutSigData} from "../../PatientViewPage";

export interface IVariantCountData {
    numberOfSamples?:number;
    geneData?:{ [entrezGeneId:string]: {
        numberOfSamplesWithMutationInGene?:number,
        numberOfSamplesWithKeyword?:{ [keyword:string]:number }
    }};
};

export default class CohortColumnFormatter {

    public static renderFunction(data:IColumnFormatterData<MutationTableRowData>, columnProps:any) {
        const mutSigQValue:number|null = CohortColumnFormatter.getMutSigQValue(data, columnProps.mutSigData);
        const variantCountData = CohortColumnFormatter.getVariantCountData(data, (columnProps.variantCountData as IVariantCountData));
        const freqViz = CohortColumnFormatter.makeCohortFrequencyViz(data, (columnProps.variantCountData as IVariantCountData))
        return (
            <Td key={data.name} column={data.name} value={variantCountData && variantCountData.numberOfSamplesWithMutationInGene}>
                <div>
                    {(freqViz !== null) && freqViz}
                    {(mutSigQValue !== null) && CohortColumnFormatter.makeMutSigIcon(mutSigQValue)}
                </div>
            </Td>
        );
    };

    private static getVariantCountData(data:IColumnFormatterData<MutationTableRowData>, variantCountData:IVariantCountData) {
        if (!variantCountData || !variantCountData.geneData || !data.rowData || data.rowData.length === 0) {
            return null;
        }
        const entrezGeneId = data.rowData[0].entrezGeneId;
        const hugoGeneSymbol = data.rowData[0].gene.hugoGeneSymbol;
        const keyword = data.rowData[0].keyword;

        const numberOfSamples = variantCountData.numberOfSamples;
        const geneData = variantCountData.geneData[entrezGeneId];

        let numberOfSamplesWithMutationInGene, numberOfSamplesWithKeyword;
        if (geneData) {
            numberOfSamplesWithMutationInGene = geneData.numberOfSamplesWithMutationInGene;
            if (keyword && geneData.numberOfSamplesWithKeyword) {
                numberOfSamplesWithKeyword = geneData.numberOfSamplesWithKeyword[keyword];
            }
        }
        return {
            hugoGeneSymbol, keyword, numberOfSamples, numberOfSamplesWithKeyword, numberOfSamplesWithMutationInGene
        };
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

    private static makeCohortFrequencyViz(data:IColumnFormatterData<MutationTableRowData>, variantCountData:IVariantCountData) {
        const variantCount = CohortColumnFormatter.getVariantCountData(data, variantCountData);

        if (
            !variantCount
            || variantCount.numberOfSamplesWithMutationInGene === undefined
            || variantCount.numberOfSamples === undefined
            || variantCount.numberOfSamplesWithKeyword === undefined
        ) {
            return null;
        }

        const geneProportion = variantCount.numberOfSamplesWithMutationInGene / variantCount.numberOfSamples;
        const keywordProportion = variantCount.keyword ? (variantCount.numberOfSamplesWithKeyword / variantCount.numberOfSamples) : null;
        const barWidth = 30;
        const barHeight = 8;

        return (
            <DefaultTooltip
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
            </DefaultTooltip>
        );
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

    private static getCohortFrequencyTooltip(variantCount:any) {
        return (<div>
            <span>{variantCount.numberOfSamplesWithMutationInGene} samples
            ({CohortColumnFormatter.getBoldPercentage(variantCount.numberOfSamplesWithMutationInGene / variantCount.numberOfSamples)})
            in this study have mutated {variantCount.hugoGeneSymbol}
                {(!!variantCount.keyword) && (
                    <span>
                        , out of which {variantCount.numberOfSamplesWithKeyword} ({CohortColumnFormatter.getBoldPercentage(variantCount.numberOfSamplesWithKeyword / variantCount.numberOfSamples)}) have {variantCount.keyword} mutations
                    </span>
                )}
                .
            </span>
        </div>);

    }

    private static getMutSigTooltip(qValue:number) {
        return (<div>
            <span style={{fontWeight:'bold'}}>MutSig</span><br/>
            <span> Q-value: {(qValue || 0).toExponential(3)}</span>
        </div>);
    }
}
