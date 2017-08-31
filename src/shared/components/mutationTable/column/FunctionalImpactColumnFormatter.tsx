import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import GenomeNexusCache, {GenomeNexusCacheDataType} from "shared/cache/GenomeNexusEnrichment";
import {Mutation, DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";
import MutationAssessor from "shared/components/annotation/genomeNexus/MutationAssessor";

export default class FunctionalImpactColumnFormatter {

    public static renderFunction(data:Mutation[], genomeNexusCache:GenomeNexusCache) {
        const genomeNexusData = FunctionalImpactColumnFormatter.getGenomeNexusData(data, genomeNexusCache);
        return (
                <div>
                    {FunctionalImpactColumnFormatter.makeFuncionalConsequenceViz(genomeNexusData)}
                </div>
        );
    };

    private static getGenomeNexusData(data:Mutation[], cache:GenomeNexusCache):GenomeNexusCacheDataType | null {
        if (data.length === 0) {
            return null;
        }
        return cache.get(data[0]);
    }

    private static makeFuncionalConsequenceViz(genomeNexusData:GenomeNexusCacheDataType | null) {
        let status:TableCellStatus | null = null;
        if (genomeNexusData === null) {
            status = TableCellStatus.LOADING;
        } else if (genomeNexusData.status === "error") {
            status = TableCellStatus.ERROR;
        } else if (genomeNexusData.data === null) {
            status = TableCellStatus.NA;
        } else {
            return <MutationAssessor mutationAssessor={genomeNexusData.data.mutation_assessor.annotation} />;
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
