import * as React from 'react';
import { Circle } from 'better-react-spinkit';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    TableCellStatusIndicator,
    TableCellStatus,
    DefaultTooltip,
} from 'cbioportal-frontend-commons';
import GenomeNexusCache, {
    GenomeNexusCacheDataType,
} from 'shared/cache/GenomeNexusCache';
import styles from './exon.module.scss';
import { AlphaMissense } from 'genome-nexus-ts-api-client';

export default class AlphaMissenseColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        genomeNexusCache: GenomeNexusCache | undefined
    ) {
        const genomeNexusCacheData = AlphaMissenseColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );

        return (
            <div className={styles['exon-table']}>
                <span>
                    {AlphaMissenseColumnFormatter.getAlphaMissenseDataViz(
                        genomeNexusCacheData
                    )}
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

    private static getAlphaMissenseDataViz(
        genomeNexusCacheData: GenomeNexusCacheDataType | null
    ) {
        let status: TableCellStatus | null = null;
        if (genomeNexusCacheData === null) {
            status = TableCellStatus.LOADING;
        } else if (
            genomeNexusCacheData.status === 'error' ||
            genomeNexusCacheData.data?.successfully_annotated === false
        ) {
            status = TableCellStatus.ERROR;
        } else if (genomeNexusCacheData.data === null) {
            status = TableCellStatus.NA;
        } else {
            let alphamissenseData = AlphaMissenseColumnFormatter.getData(
                genomeNexusCacheData
            );
            let pathogenicity = alphamissenseData?.pathogenicity || '';
            let score = alphamissenseData?.score || 0.0;
            if (alphamissenseData == null) {
                return alphamissenseData;
            } else {
                return (
                    <DefaultTooltip
                        overlay={() => (
                            <div style={{ maxWidth: 300 }}>{score}</div>
                        )}
                        placement="topLeft"
                    >
                        <span
                            style={{
                                width: '24px',
                                textAlign: 'center',
                            }}
                        >
                            {pathogenicity}
                        </span>
                    </DefaultTooltip>
                );
            }
        }

        if (status !== null) {
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
        genomeNexusCache: GenomeNexusCacheDataType | null
    ): AlphaMissense | null {
        let alphaMissenseData: AlphaMissense | null = {
            pathogenicity: 'N/A',
            score: 0,
        };
        if (genomeNexusCache?.data) {
            const genomeNexusData = genomeNexusCache.data;
            const alphaMissense =
                genomeNexusData.annotation_summary?.transcriptConsequenceSummary
                    ?.alphaMissense;
            if (alphaMissense) {
                alphaMissenseData = alphaMissense;
            }
        }
        return alphaMissenseData;
    }

    public static download(
        data: Mutation[],
        genomeNexusCache: GenomeNexusCache
    ): string {
        const genomeNexusCacheData = AlphaMissenseColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );
        const alphamissenseData =
            genomeNexusCacheData &&
            AlphaMissenseColumnFormatter.getData(genomeNexusCacheData);

        if (!alphamissenseData) {
            return '';
        } else {
            return (
                alphamissenseData.pathogenicity +
                ' (' +
                alphamissenseData.score +
                ')'
            );
        }
    }

    public static getSortValue(
        data: Mutation[],
        genomeNexusCache: GenomeNexusCache
    ): number | null {
        const genomeNexusCacheData = AlphaMissenseColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );
        if (genomeNexusCacheData) {
            let alphamissenseData = AlphaMissenseColumnFormatter.getData(
                genomeNexusCacheData
            );
            if (alphamissenseData == null) {
                return null;
            } else {
                return alphamissenseData.score;
            }
        } else {
            return null;
        }
    }
}
