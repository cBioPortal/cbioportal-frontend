import * as React from 'react';
import {DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {CopyNumberCount} from "shared/api/generated/CBioPortalAPIInternal";
import FrequencyBar from "shared/components/cohort/FrequencyBar";

export default class CohortColumnFormatter
{
    public static renderFunction(data:DiscreteCopyNumberData,
                                 copyNumberCountData:CopyNumberCount[])
    {
        const copyNumberCount = CohortColumnFormatter.getCopyNumberCount(data, copyNumberCountData);
        const freqViz = CohortColumnFormatter.makeCohortFrequencyViz(data, copyNumberCount);

        return (
            <div>
                {(freqViz !== null) && freqViz}
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
        const boldPercentage = <span style={{fontWeight:'bold'}}>{`${percent.toFixed(1)}%`}</span>;
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

    private static getCopyNumberCount(data:DiscreteCopyNumberData, copyNumberCountData:CopyNumberCount[])
    {
        return copyNumberCountData.find((copyNumberCount: CopyNumberCount) => {
            return (
                copyNumberCount.entrezGeneId === data.entrezGeneId &&
                copyNumberCount.alteration === data.alteration
            );
        });
    }
}
