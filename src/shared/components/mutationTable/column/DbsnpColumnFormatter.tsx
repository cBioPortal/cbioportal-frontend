import * as React from 'react';
import { Circle } from 'better-react-spinkit';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'shared/api/generated/CBioPortalAPI';
import {
    DefaultTooltip,
    MyVariantInfoAnnotation,
    TableCellStatusIndicator,
    TableCellStatus,
} from 'cbioportal-frontend-commons';
import GenomeNexusMyVariantInfoCache, {
    GenomeNexusCacheDataType,
} from 'shared/cache/GenomeNexusMyVariantInfoCache';

export default class DbsnpColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        genomeNexusCache: GenomeNexusMyVariantInfoCache | undefined
    ) {
        const genomeNexusCacheData = DbsnpColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );
        return (
            <div data-test="dbsnp-data">
                {DbsnpColumnFormatter.getDbsnpViz(genomeNexusCacheData)}
            </div>
        );
    }

    private static getGenomeNexusDataFromCache(
        data: Mutation[],
        cache: GenomeNexusMyVariantInfoCache | undefined
    ): GenomeNexusCacheDataType | null {
        if (data.length === 0 || !cache) {
            return null;
        }
        return cache.get(data[0]);
    }

    private static getDbsnpViz(genomeNexusCacheData: GenomeNexusCacheDataType | null) {
        let status: TableCellStatus | null = null;

        if (genomeNexusCacheData === null) {
            status = TableCellStatus.LOADING;
        } else if (genomeNexusCacheData.status === 'error') {
            status = TableCellStatus.ERROR;
        } else if (genomeNexusCacheData.data === null) {
            status = TableCellStatus.NA;
        } else {
            let rsId = DbsnpColumnFormatter.getData(genomeNexusCacheData.data.my_variant_info);
            if (rsId == null) {
                return (
                    <DefaultTooltip
                        placement="topRight"
                        overlay={<span>Variant has no dbSNP data.</span>}
                    >
                        <span
                            style={{
                                height: '100%',
                                width: '100%',
                                display: 'block',
                                overflow: 'hidden',
                            }}
                        >
                            &nbsp;
                        </span>
                    </DefaultTooltip>
                );
            } else {
                let dbsnpLink = 'https://www.ncbi.nlm.nih.gov/snp/' + rsId;
                return (
                    <DefaultTooltip
                        placement="top"
                        overlay={<span>Click to see variant on dbSNP website.</span>}
                    >
                        <span style={{ textAlign: 'right', float: 'right' }}>
                            <a href={dbsnpLink} target="_blank">
                                {rsId}
                            </a>
                        </span>
                    </DefaultTooltip>
                );
            }
        }

        if (status !== null) {
            // show loading circle
            if (status === TableCellStatus.LOADING) {
                return (
                    <Circle
                        size={18}
                        scaleEnd={0.5}
                        scaleStart={0.2}
                        color="#aaa"
                        className="pull-right"
                    />
                );
            } else {
                return <TableCellStatusIndicator status={status} />;
            }
        }
    }

    public static getData(genomeNexusData: MyVariantInfoAnnotation | null): string | null {
        if (
            genomeNexusData &&
            genomeNexusData.annotation &&
            genomeNexusData.annotation.dbsnp &&
            genomeNexusData.annotation.dbsnp.rsid
        ) {
            return genomeNexusData.annotation.dbsnp.rsid;
        } else {
            return null;
        }
    }

    public static download(
        data: Mutation[],
        genomeNexusMyVariantInfoCache: GenomeNexusMyVariantInfoCache
    ): string {
        const genomeNexusCacheData = DbsnpColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusMyVariantInfoCache
        );
        if (genomeNexusCacheData && genomeNexusCacheData.data) {
            const dbsnpData =
                genomeNexusCacheData &&
                DbsnpColumnFormatter.getData(genomeNexusCacheData.data.my_variant_info);
            if (dbsnpData) {
                return dbsnpData;
            }
        }
        return '';
    }

    public static getSortValue(
        data: Mutation[],
        genomeNexusCache: GenomeNexusMyVariantInfoCache
    ): string | null {
        const genomeNexusCacheData = DbsnpColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );
        if (
            genomeNexusCacheData &&
            genomeNexusCacheData.data &&
            genomeNexusCacheData.data.my_variant_info
        ) {
            let dbsnpData = DbsnpColumnFormatter.getData(genomeNexusCacheData.data.my_variant_info);
            if (dbsnpData !== null) {
                return dbsnpData;
            }
        }
        return null;
    }
}
