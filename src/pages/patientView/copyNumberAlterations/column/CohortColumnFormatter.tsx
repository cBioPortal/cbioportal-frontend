import * as React from 'react';
import {DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {CopyNumberCount} from "shared/api/generated/CBioPortalAPIInternal";
import FrequencyBar from "shared/components/cohort/FrequencyBar";
import Icon from "shared/components/cohort/LetterIcon";
import {IGisticData, IGisticSummary} from "shared/model/Gistic";

export default class CohortColumnFormatter
{
    public static renderFunction(data:DiscreteCopyNumberData[],
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

    public static makeCohortFrequencyViz(data:DiscreteCopyNumberData[], copyNumberCount?:CopyNumberCount) {

        if (copyNumberCount !== undefined) {
            const counts = [copyNumberCount.numberOfSamplesWithAlterationInGene];
            const colors = data[0].alteration > 0 ? ["red"] : ["blue"];

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

    public static tooltipContent(data:DiscreteCopyNumberData[], copyNumberCount:CopyNumberCount)
    {
        const count = copyNumberCount.numberOfSamplesWithAlterationInGene;
        const percent = 100 * (copyNumberCount.numberOfSamplesWithAlterationInGene / copyNumberCount.numberOfSamples);
        const boldPercentage = <b>{`${percent.toFixed(1)}%`}</b>;
        const gene = data[0].gene.hugoGeneSymbol;
        const cna = data[0].alteration === -2 ? "deleted" : "amplified";
        const samples = count === 1 ? "sample" : "samples";
        const have = count === 1 ? "has" : "have";

        return (
            <span>{count} {samples} ({boldPercentage}) in this study {have} {cna} {gene}</span>
        );
    }

    public static getSortValue(data:DiscreteCopyNumberData[], copyNumberCountData:CopyNumberCount[]):number|null {
        const copyNumberCount = CohortColumnFormatter.getCopyNumberCount(data, copyNumberCountData);

        if (copyNumberCount) {
            return copyNumberCount.numberOfSamplesWithAlterationInGene;
        } else {
            return null;
        }
    }

    public static getCopyNumberCount(data:DiscreteCopyNumberData[], copyNumberCountData:CopyNumberCount[])
    {
        const targetEntrez = data[0].entrezGeneId;
        const targetAlteration = data[0].alteration;
        return copyNumberCountData.find((copyNumberCount: CopyNumberCount) => {
            return (
                copyNumberCount.entrezGeneId === targetEntrez &&
                copyNumberCount.alteration === targetAlteration
            );
        });
    }

    public static getGisticValue(data:DiscreteCopyNumberData[], gisticData:IGisticData): IGisticSummary|null
    {
        const gistic = gisticData[data[0].entrezGeneId];
        let summary:IGisticSummary|undefined;

        if (gistic)
        {
            // here we are assuming that we have at most 2 values in the GisticSummary array:
            // one for amp === true, and one for amp === false
            const targetAmp = (data[0].alteration === 2);
            summary = gistic.find((gs:IGisticSummary) => {
                // alteration === 2 => amplified
                // otherwise => not amplified (deleted)
                return gs.amp === targetAmp;
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
