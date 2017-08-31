import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import GenomeNexusCache, {GenomeNexusCacheDataType} from "shared/cache/GenomeNexusEnrichment";
import {Mutation, DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";
import MutationAssessor from "shared/components/annotation/genomeNexus/MutationAssessor";
import Sift from "shared/components/annotation/genomeNexus/Sift";

export default class FunctionalImpactColumnFormatter {

    public static renderFunction(data:Mutation[], genomeNexusCache:GenomeNexusCache) {
        const genomeNexusData = FunctionalImpactColumnFormatter.getGenomeNexusData(data, genomeNexusCache);
        return (
                <div>
                    {FunctionalImpactColumnFormatter.makeFuncionalImpactViz(genomeNexusData)}
                </div>
        );
    };

    private static getGenomeNexusData(data:Mutation[], cache:GenomeNexusCache):GenomeNexusCacheDataType | null {
        if (data.length === 0) {
            return null;
        }
        return cache.get(data[0]);
    }

    private static makeFuncionalImpactViz(genomeNexusData:GenomeNexusCacheDataType | null) {
        let status:TableCellStatus | null = null;
        if (genomeNexusData === null) {
            status = TableCellStatus.LOADING;
        } else if (genomeNexusData.status === "error") {
            status = TableCellStatus.ERROR;
        } else if (genomeNexusData.data === null) {
            status = TableCellStatus.NA;
        } else {
            // TODO: handle multiple transcripts of SIFT instead of just picking first one
            return (
                <div>
                    <MutationAssessor mutationAssessor={genomeNexusData.data.mutation_assessor.annotation} />
                    <Sift siftScore={parseInt(genomeNexusData.data.transcript_consequences[0].sift_score)} siftPrediction={genomeNexusData.data.transcript_consequences[0].sift_prediction} />
                </div>
            );
        }
        if (status !== null) {
            return (
                <TableCellStatusIndicator
                    status={status}
                />
            );
        }
    }
}
