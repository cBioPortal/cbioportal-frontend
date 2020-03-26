import * as React from 'react';
import { Circle } from 'better-react-spinkit';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'shared/api/generated/CBioPortalAPI';
import {
    TableCellStatusIndicator,
    TableCellStatus,
} from 'cbioportal-frontend-commons';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import GenomeNexusCache, {
    GenomeNexusCacheDataType,
} from 'shared/cache/GenomeNexusCache';

export default class HgvscColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        genomeNexusCache: GenomeNexusCache | undefined
    ) {
        const genomeNexusCacheData = HgvscColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );
        return (
            <div>
                <span>
                    {HgvscColumnFormatter.getHgvscDataViz(genomeNexusCacheData)}
                </span>
            </div>
        );
    }

    private static getGenomeNexusDataFromCache(
        data: Mutation[],
        cache: GenomeNexusCache | undefined
    ): GenomeNexusCacheDataType | null {
        if (data.length === 0 || !cache) {
            return null;
        }
        return cache.get(data[0]);
    }

    private static getHgvscDataViz(
        genomeNexusCacheData: GenomeNexusCacheDataType | null
    ) {
        let status: TableCellStatus | null = null;

        if (genomeNexusCacheData === null) {
            status = TableCellStatus.LOADING;
        } else if (genomeNexusCacheData.status === 'error') {
            status = TableCellStatus.ERROR;
        } else if (genomeNexusCacheData.data === null) {
            status = TableCellStatus.NA;
        } else {
            let hgvscData = HgvscColumnFormatter.getData(
                genomeNexusCacheData.data
            );
            if (hgvscData == null) {
                return hgvscData;
            } else {
                return (
                    <span style={{ display: 'inline-block', float: 'right' }}>
                        {hgvscData}
                    </span>
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

    public static getData(
        genomeNexusData: VariantAnnotation | null
    ): string | null {
        if (!genomeNexusData) {
            return null;
        }
        return genomeNexusData.annotation_summary.transcriptConsequenceSummary
            .hgvsc;
    }

    public static download(
        data: Mutation[],
        genomeNexusCache: GenomeNexusCache
    ): string {
        const genomeNexusData = HgvscColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );
        const hgvscData =
            genomeNexusData &&
            HgvscColumnFormatter.getData(genomeNexusData.data);

        if (!hgvscData) {
            return '';
        } else {
            return hgvscData;
        }
    }

    public static getSortValue(
        data: Mutation[],
        genomeNexusCache: GenomeNexusCache
    ): number | null {
        const genomeNexusCacheData = HgvscColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );
        if (genomeNexusCacheData) {
            let hgvscData = HgvscColumnFormatter.getData(
                genomeNexusCacheData.data
            );
            if (hgvscData == null) {
                return null;
            } else {
                return parseInt(hgvscData.split('c.')[1]);
            }
        } else {
            return null;
        }
    }
}
