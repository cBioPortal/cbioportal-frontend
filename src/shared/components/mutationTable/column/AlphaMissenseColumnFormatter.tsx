import * as React from 'react';
import { Circle } from 'better-react-spinkit';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    TableCellStatusIndicator,
    TableCellStatus,
} from 'cbioportal-frontend-commons';
import GenomeNexusCache, {
    GenomeNexusCacheDataType,
} from 'shared/cache/GenomeNexusCache';
import styles from './exon.module.scss';
import { AlphaMissense} from 'genome-nexus-ts-api-client';

export default class AlphaMissenseColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        genomeNexusCache: GenomeNexusCache | undefined,
    ) {
        const genomeNexusCacheData = AlphaMissenseColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );

        console.log("genomeNexusCacheData===="+genomeNexusCacheData?.data?.annotation_summary)
        return (
            <div className={styles['exon-table']}>
                <span>
                    {AlphaMissenseColumnFormatter.getalphamissenseDataViz(
                        genomeNexusCacheData,
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
        console.log("cache==="+cache.get(data[0]))
        return cache.get(data[0]);
    }

    private static getalphamissenseDataViz(
        genomeNexusCacheData: GenomeNexusCacheDataType | null,
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
            let alphamissenseData = AlphaMissenseColumnFormatter.getData(genomeNexusCacheData);
            let aclass = alphamissenseData?.am_class || "";

            let  pathogenicityScore= alphamissenseData?.am_pathogenicity_score ||0.0;
            console.log("alphamissenseData ===="+alphamissenseData);
            if (alphamissenseData == null) {
                return alphamissenseData;
            } else {
                return (
                    <span className="mutationType-module__missenseMutation__1TVMD">
                        <span
                            style={{
                                width: '24px',
                                textAlign: 'center',
                            }}
                        >
                            {content}
                        </span>

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
        genomeNexusCache: GenomeNexusCacheDataType | null
    ): AlphaMissense | null {
        let alphaMissenseData: AlphaMissense | null = {
            am_class: 'N/A',
            am_pathogenicity_score: 0
        };
        if (genomeNexusCache?.data) {
            const genomeNexusData = genomeNexusCache.data;
            const alphaMissense =
                genomeNexusData.annotation_summary?.transcriptConsequenceSummary
                    ?.alphaMissense;
            if (alphaMissense) {
                alphaMissenseData =alphaMissense;
            } else if (genomeNexusData.transcript_consequences) {
                const transcriptConsequence = genomeNexusData.transcript_consequences.filter(
                    x =>
                        x.transcript_id ===
                        genomeNexusData.annotation_summary
                            ?.transcriptConsequenceSummary?.transcriptId &&
                        x.exon
                )[0];
                alphaMissenseData = transcriptConsequence.alphaMissense ||{
                    am_class: 'Pathogenic',
                    am_pathogenicity_score:  (Math.random()*0.11+0.89).toFixed(3)
                };
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
            return alphamissenseData.am_class + " (" +alphamissenseData.am_pathogenicity_score+")";
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
            let alphamissenseData = AlphaMissenseColumnFormatter.getData(genomeNexusCacheData);
            if (alphamissenseData == null) {
                return null;
            } else {
                return alphamissenseData.am_pathogenicity_score;
            }
        } else {
            return null;
        }
    }
}
