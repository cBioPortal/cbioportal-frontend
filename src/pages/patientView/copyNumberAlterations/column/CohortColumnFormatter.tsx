import * as React from 'react';
import {DiscreteCopyNumberData, CopyNumberCount} from "shared/api/generated/CBioPortalAPI";
import FrequencyBar from "shared/components/cohort/FrequencyBar";
import Icon from "shared/components/cohort/LetterIcon";
import {IGisticData, IGisticSummary} from "shared/model/Gistic";
import {getPercentage} from "shared/lib/FormatUtils";

import CopyNumberCountCache from "../../clinicalInformation/CopyNumberCountCache";
import {CacheData} from "../../../../shared/lib/LazyMobXCache";
import DefaultTooltip from "../../../../shared/components/defaultTooltip/DefaultTooltip";

export default class CohortColumnFormatter
{
    public static renderFunction(data:DiscreteCopyNumberData[],
                                 copyNumberCountCache:CopyNumberCountCache,
                                 gisticData:IGisticData)
    {
        const copyNumberCount = CohortColumnFormatter.getCopyNumberCount(data, copyNumberCountCache);
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

    public static makeCohortFrequencyViz(data:DiscreteCopyNumberData[], cacheDatum:CacheData<CopyNumberCount> | null) {

        if (cacheDatum !== null) {
            const copyNumberCount = cacheDatum.data;
            if (cacheDatum.status === "complete" && copyNumberCount) {
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
            } else if (cacheDatum.status === "complete") {
                return (
                    <DefaultTooltip
                        placement="left"
                        overlay={(<span>Data not available for this gene and alteration.</span>)}
                    >
                        <span
                            style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                        >
                            NA
                        </span>
                    </DefaultTooltip>);
            } else {
                return (
                    <DefaultTooltip
                        placement="left"
                        overlay={(<span>Error retrieving data.</span>)}
                        >
                        <span
                            style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                        >
                        ERROR
                        </span>
                    </DefaultTooltip>);
            }
        } else {
            return (
                <DefaultTooltip
                    placement="left"
                    overlay={(<span>Querying server for data.</span>)}
                    >
                    <span
                        style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                    >
                        LOADING
                    </span>
                </DefaultTooltip>
            );
        }
    }

    public static tooltipContent(data:DiscreteCopyNumberData[], copyNumberCount:CopyNumberCount)
    {
        const count = copyNumberCount.numberOfSamplesWithAlterationInGene;
        const proportion = copyNumberCount.numberOfSamplesWithAlterationInGene / copyNumberCount.numberOfSamples;
        const boldPercentage = <b>{getPercentage(proportion)}</b>;
        const gene = data[0].gene.hugoGeneSymbol;
        const cna = data[0].alteration === -2 ? "deleted" : "amplified";
        const samples = count === 1 ? "sample" : "samples";
        const have = count === 1 ? "has" : "have";

        return (
            <span>{count} {samples} ({boldPercentage}) in this study {have} {cna} {gene}</span>
        );
    }

    public static getSortValue(data:DiscreteCopyNumberData[], copyNumberCountCache:CopyNumberCountCache):number|null {
        const copyNumberCount = CohortColumnFormatter.getCopyNumberCount(data, copyNumberCountCache);

        if (copyNumberCount && copyNumberCount.data) {
            return copyNumberCount.data.numberOfSamplesWithAlterationInGene;
        } else {
            return null;
        }
    }

    private static getCopyNumberCount(data:DiscreteCopyNumberData[], copyNumberCountCache:CopyNumberCountCache):CacheData<CopyNumberCount> | null
    {
        return copyNumberCountCache.get({entrezGeneId: data[0].entrezGeneId, alteration: data[0].alteration});
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
