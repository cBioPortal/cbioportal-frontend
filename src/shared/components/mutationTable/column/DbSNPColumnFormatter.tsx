import * as React from 'react';
import { Mutation } from "shared/api/generated/CBioPortalAPI";
import { MyVariantInfo as MyVariantInfoData } from 'shared/api/generated/GenomeNexusAPIInternal';
import GenomeNexusCache, { GenomeNexusCacheDataType } from "shared/cache/GenomeNexusEnrichment";
import MyVariantInfo from "shared/components/annotation/genomeNexus/MyVariantInfo.tsx";
import { TableCellStatus } from "shared/components/TableCellStatus";

interface IDbsnpData {
    myVariantInfo: MyVariantInfoData;
}
export default class DbsnpColumnFormatter
{
    private static getData(genomeNexusData: GenomeNexusCacheDataType | null): IDbsnpData | null {
        if (genomeNexusData === null ||
            genomeNexusData.status === "error" ||
            genomeNexusData.data === null) {
            return null;
    }

        // TODO: handle multiple transcripts instead of just picking the first one
        const myVariantInfo = genomeNexusData.data.my_variant_info && genomeNexusData.data.my_variant_info.annotation;

        return {myVariantInfo};
    }

    public static renderFunction(data: Mutation[], genomeNexusCache: GenomeNexusCache) {
        const genomeNexusData = this.getGenomeNexusData(data, genomeNexusCache);
        return (
            <div>
                {this.makeDbsnpViz(genomeNexusData)}
            </div>
        );
    }

    public static download(data: Mutation[], genomeNexusCache: GenomeNexusCache): string {
        const genomeNexusData = this.getGenomeNexusData(data, genomeNexusCache);
        const dbsnpData = this.getData(genomeNexusData);

        if (!dbsnpData) {
            return "";
        }

        return [
            `MyVariantInfo: ${MyVariantInfo.download(dbsnpData.myVariantInfo)}`
        ].join(";");
    }

    private static getGenomeNexusData(data: Mutation[], cache: GenomeNexusCache): GenomeNexusCacheDataType | null {
        if (data.length === 0) {
            return null;
        }
        return cache.get(data[0]);
    }

    private static makeDbsnpViz(genomeNexusData:GenomeNexusCacheDataType | null) {
        let status:TableCellStatus | null = null;

        if (genomeNexusData === null) {
            status = TableCellStatus.LOADING;
        } else if (genomeNexusData.status === "error") {
            status = TableCellStatus.ERROR;
        } else if (genomeNexusData.data === null) {
            status = TableCellStatus.NA;
        } else {
            const dbsnpData = this.getData(genomeNexusData);

            return dbsnpData && (
                <div>
                    
                    <MyVariantInfo
                        myVariantInfo={dbsnpData.myVariantInfo}>
                    </MyVariantInfo>

                </div>
            );
        }
    }
}