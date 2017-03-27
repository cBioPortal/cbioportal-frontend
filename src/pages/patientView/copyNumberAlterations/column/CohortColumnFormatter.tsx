import * as React from 'react';
import {DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {CopyNumberCount} from "shared/api/generated/CBioPortalAPIInternal";
import FrequencyBar from "shared/components/cohort/FrequencyBar";
import Icon from "shared/components/cohort/LetterIcon";

export interface IGisticSummary {
    amp: boolean;
    qValue:number;
    peakGeneCount:number;
}

export interface IGisticData {
    [entrezGeneId:string]: IGisticSummary[];
}

export default class CohortColumnFormatter
{
    public static renderFunction(data:DiscreteCopyNumberData,
                                 copyNumberCountData:CopyNumberCount[],
                                 gisticData:IGisticData)
    {
        const copyNumberCount = CohortColumnFormatter.getCopyNumberCount(data, copyNumberCountData);
        const freqViz = CohortColumnFormatter.makeCohortFrequencyViz(data, copyNumberCount);
        const gisticValue = CohortColumnFormatter.getGisticValue(data, gisticData);
        let gisticIcon:JSX.Element|null = null;

        if (gisticValue !== null)
        {
            const tooltipCallback = () => CohortColumnFormatter.getGisticTooltip(
                gisticValue.qValue, gisticValue.peakGeneCount);

            gisticIcon = (
                <Icon
                    text="G"
                    tooltip={tooltipCallback}
                />
            );
        }

        return (
            <div>
                {(freqViz !== null) && freqViz}
                {gisticIcon}
            </div>
        );
    }

    public static makeCohortFrequencyViz(data:DiscreteCopyNumberData, copyNumberCount?:CopyNumberCount) {

        if (copyNumberCount !== undefined) {
            const counts = [copyNumberCount.numberOfSamplesWithAlterationInGene];
            const colors = data.alteration > 0 ? ["red"] : ["blue"];

            return (
                <FrequencyBar
                    counts={counts}
                    freqColors={colors}
                    totalCount={copyNumberCount.numberOfSamples}
                    tooltip={CohortColumnFormatter.tooltipContent(data, copyNumberCount)}
                />
            );
        }
        else {
            return null;
        }
    }

    public static tooltipContent(data:DiscreteCopyNumberData, copyNumberCount:CopyNumberCount)
    {
        const count = copyNumberCount.numberOfSamplesWithAlterationInGene;
        const percent = 100 * (copyNumberCount.numberOfSamplesWithAlterationInGene / copyNumberCount.numberOfSamples);
        const boldPercentage = <b>{`${percent.toFixed(1)}%`}</b>;
        const gene = data.gene.hugoGeneSymbol;
        const cna = data.alteration === -2 ? "deleted" : "amplified";
        const samples = count === 1 ? "sample" : "samples";
        const have = count === 1 ? "has" : "have";

        return (
            <span>{count} {samples} ({boldPercentage}) in this study {have} {cna} {gene}</span>
        );
    }

    public static getSortValue(data:DiscreteCopyNumberData, copyNumberCountData:CopyNumberCount[]):number {
        const copyNumberCount = CohortColumnFormatter.getCopyNumberCount(data, copyNumberCountData);

        if (copyNumberCount) {
            return copyNumberCount.numberOfSamplesWithAlterationInGene;
        } else {
            return Number.POSITIVE_INFINITY;
        }
    }

    public static getCopyNumberCount(data:DiscreteCopyNumberData, copyNumberCountData:CopyNumberCount[])
    {
        return copyNumberCountData.find((copyNumberCount: CopyNumberCount) => {
            return (
                copyNumberCount.entrezGeneId === data.entrezGeneId &&
                copyNumberCount.alteration === data.alteration
            );
        });
    }

    public static getGisticValue(data:DiscreteCopyNumberData, gisticData:IGisticData): IGisticSummary|null
    {
        const gistic = gisticData[data.entrezGeneId];
        let summary:IGisticSummary|undefined;

        if (gistic)
        {
            // here we are assuming that we have at most 2 values in the GisticSummary array:
            // one for amp === true, and one for amp === false
            summary = gistic.find((gs:IGisticSummary) => {
                // alteration === 2 => amplified
                // otherwise => not amplified (deleted)
                return gs.amp === (data.alteration === 2);
            });
        }

        return summary === undefined ? null : summary;
    }

    private static getGisticTooltip(qValue:number, peakGeneCount:number)
    {
        return (
            <div>
                <b>Gistic</b><br/>
                <span> Q-value: {(qValue || 0).toExponential(3)}</span><br/>
                <span> Number of genes in the peak: {peakGeneCount}</span>
            </div>
        );
    }
}
