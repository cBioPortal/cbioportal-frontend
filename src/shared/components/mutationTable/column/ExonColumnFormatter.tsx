import * as React from 'react';
import { Circle } from 'better-react-spinkit';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'shared/api/generated/CBioPortalAPI';
import {
    TableCellStatusIndicator,
    TableCellStatus,
    VariantAnnotation,
} from 'cbioportal-frontend-commons';
import GenomeNexusCache, { GenomeNexusCacheDataType } from 'shared/cache/GenomeNexusCache';
import styles from './exon.module.scss';

export default class ExonColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        genomeNexusCache: GenomeNexusCache | undefined,
        showTotalNumberOfExons?: boolean
    ) {
        const genomeNexusCacheData = ExonColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );
        return (
            <div className={styles['exon-table']}>
                <span>
                    {ExonColumnFormatter.getExonDataViz(
                        genomeNexusCacheData,
                        showTotalNumberOfExons
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

    private static getExonDataViz(
        genomeNexusCacheData: GenomeNexusCacheDataType | null,
        showTotalNumberOfExons?: boolean
    ) {
        let status: TableCellStatus | null = null;

        if (genomeNexusCacheData === null) {
            status = TableCellStatus.LOADING;
        } else if (genomeNexusCacheData.status === 'error') {
            status = TableCellStatus.ERROR;
        } else if (genomeNexusCacheData.data === null) {
            status = TableCellStatus.NA;
        } else {
            let exonData = ExonColumnFormatter.getData(genomeNexusCacheData.data);
            if (exonData == null) {
                return exonData;
            } else {
                return (
                    <span style={{ display: 'inline-block', float: 'right' }}>
                        <span
                            style={{
                                float: 'left',
                                width: '24px',
                                textAlign: 'right',
                            }}
                        >
                            {' '}
                            {exonData.split('/')[0]}{' '}
                        </span>
                        {showTotalNumberOfExons && (
                            <span
                                style={{
                                    float: 'left',
                                    width: '34px',
                                    textAlign: 'left',
                                    marginLeft: '4px',
                                }}
                            >
                                {' '}
                                {`/ ${exonData.split('/')[1]}`}{' '}
                            </span>
                        )}
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

    public static getData(genomeNexusData: VariantAnnotation | null): string | null {
        if (!genomeNexusData) {
            return null;
        }
        const exon = genomeNexusData.annotation_summary.transcriptConsequenceSummary.exon;
        if (exon) {
            return exon;
        } else {
            // find any other mutation affecting the exon on the same transcript
            const transcriptConsequence = genomeNexusData.transcript_consequences.filter(
                x =>
                    x.transcript_id ===
                        genomeNexusData.annotation_summary.transcriptConsequenceSummary
                            .transcriptId && x.exon
            )[0];
            if (transcriptConsequence) {
                return transcriptConsequence.exon;
            } else {
                return null;
            }
        }
    }

    public static download(data: Mutation[], genomeNexusCache: GenomeNexusCache): string {
        const genomeNexusData = ExonColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );
        const exonData = genomeNexusData && ExonColumnFormatter.getData(genomeNexusData.data);

        if (!exonData) {
            return '';
        } else {
            return exonData;
        }
    }

    public static getSortValue(
        data: Mutation[],
        genomeNexusCache: GenomeNexusCache
    ): number | null {
        const genomeNexusCacheData = ExonColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );
        if (genomeNexusCacheData) {
            let exonData = ExonColumnFormatter.getData(genomeNexusCacheData.data);
            if (exonData == null) {
                return null;
            } else {
                return parseInt(exonData.split('/')[0]);
            }
        } else {
            return null;
        }
    }
}
