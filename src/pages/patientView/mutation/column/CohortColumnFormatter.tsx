import * as React from 'react';
import DefaultTooltip from 'shared/components/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import {MutSigData} from "../../PatientViewPage";
import {Mutation} from "../../../../shared/api/generated/CBioPortalAPI";
import {
    VariantCountOutput,
    default as CohortVariantCountCache
} from "../../clinicalInformation/CohortVariantCountCache";

export interface IVariantCountData {
    numberOfSamples?:number;
    geneData?:{ [entrezGeneId:string]: {
        numberOfSamplesWithMutationInGene?:number,
        numberOfSamplesWithKeyword?:{ [keyword:string]:number }
    }};
};

type AugVariantCountOutput = (VariantCountOutput & {hugoGeneSymbol:string});

export default class CohortColumnFormatter {

    public static renderFunction(data:Mutation[], mutSigData:MutSigData | undefined, variantCountCache:CohortVariantCountCache) {
        const mutSigQValue:number|null = CohortColumnFormatter.getMutSigQValue(data, mutSigData);
        const variantCountData = CohortColumnFormatter.getVariantCountData(data, variantCountCache);
        const freqViz = CohortColumnFormatter.makeCohortFrequencyViz(variantCountData);
        return (
                <div>
                    {(freqViz !== null) && freqViz}
                    {(mutSigQValue !== null) && CohortColumnFormatter.makeMutSigIcon(mutSigQValue)}
                </div>
        );
    };

    public static getSortValue(data:Mutation[], variantCountCache:CohortVariantCountCache):number {
        const variantCountData = CohortColumnFormatter.getVariantCountData(data, variantCountCache);
        if (variantCountData && variantCountData.data) {
            return variantCountData.data.mutationInGene;
        } else {
            return Number.POSITIVE_INFINITY;
        }
    }

    private static getVariantCountData(data:Mutation[], cache:CohortVariantCountCache):AugVariantCountOutput | null {
        if (data.length === 0) {
            return null;
        }
        const entrezGeneId = data[0].entrezGeneId;
        const keyword = data[0].keyword;

        let cacheDatum = cache.get(entrezGeneId, keyword);
        if (cacheDatum) {
            return {hugoGeneSymbol:data[0].gene.hugoGeneSymbol, ...cacheDatum};
        } else {
            return null;
        }
    }

    private static getMutSigQValue(data:Mutation[], mutSigData:MutSigData|undefined) {
        if (!mutSigData || data.length === 0) {
            return null;
        }
        const thisData = mutSigData[data[0].entrezGeneId];
        if (!thisData) {
            return null;
        }
        return thisData.qValue;
    }

    private static getCohortFrequencyContents(variantCount:AugVariantCountOutput | null) {

        if (variantCount === null) {
            return (
                <span
                    style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                    alt="Querying server for data."
                >
                    LOADING
                </span>
            );
        } else if (variantCount.status === "error") {
            return (<span
                style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                alt="Error retrieving data."
            >
                    ERROR
                </span>);
        } else if (variantCount.data === null) {
            return (
                <span
                    style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                    alt="mRNA data is not available for this gene."
                >
                    NA
                </span>
            );
        } else {
            const geneProportion = variantCount.data.mutationInGene / variantCount.data.numberOfSamples;
            const keywordProportion = variantCount.data.keyword ? (variantCount.data.mutationInKeyword! / variantCount.data.numberOfSamples) : null;
            const barWidth = 30;
            const barHeight = 8;

            return (<svg width="70" height="12">
                <text x="36" y="9.5" textAnchor="start" fontSize="10">{(100*geneProportion).toFixed(1) + "%"}</text>
                <rect y="2" width={barWidth} height={barHeight} fill="#ccc"/>
                <rect y="2" width={geneProportion*barWidth} height={barHeight} fill="lightgreen"/>
                {(keywordProportion !== null) &&
                (<rect y="2" width={keywordProportion*barWidth} height={barHeight} fill="green"/>)}
            </svg>);
        }
    }

    private static makeCohortFrequencyViz(variantCount:AugVariantCountOutput | null) {
        return (
            <DefaultTooltip
                placement="left"
                overlay={CohortColumnFormatter.getCohortFrequencyTooltip(variantCount)}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
            >
                {CohortColumnFormatter.getCohortFrequencyContents(variantCount)}
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

    private static getCohortFrequencyTooltip(variantCount:AugVariantCountOutput | null) {
        let message:string;
        if (variantCount === null) {
            return (<span>Querying server for data.</span>);
        } else if (variantCount.status === "error") {
            return (<span>Error retrieving data.</span>);
        } else if (variantCount.data === null) {
            return (<span>Count data is not available for this gene.</span>);
        } else {
            return (<div>
            <span>{variantCount.data.mutationInGene} samples
            ({CohortColumnFormatter.getBoldPercentage(variantCount.data.mutationInGene / variantCount.data.numberOfSamples)})
            in this study have mutated {variantCount.hugoGeneSymbol}
                {(typeof variantCount.data.keyword !== "undefined") && (
                    <span>
                        , out of which {variantCount.data.mutationInKeyword} ({CohortColumnFormatter.getBoldPercentage(variantCount.data.mutationInKeyword! / variantCount.data.numberOfSamples)}) have {variantCount.data.keyword} mutations
                    </span>
                )}
                .
            </span>
        </div>);
        }
    }

    private static getMutSigTooltip(qValue:number) {
        return (<div>
            <span style={{fontWeight:'bold'}}>MutSig</span><br/>
            <span> Q-value: {(qValue || 0).toExponential(3)}</span>
        </div>);
    }
}
