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
import {
    getAlphaMissenseColumnData,
    alphaMissenseSortValue,
    alphaMissenseDownload,
    AlphaMissense,
} from 'react-mutation-mapper';
import { RemoteData } from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';

export default class AlphaMissenseColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        selectedTranscriptId?: string
    ) {
        // const genomeNexusCacheData = AlphaMissenseColumnFormatter.getGenomeNexusDataFromCache(
        //     data,
        //     genomeNexusCache
        // );

        // const alphaMissenseCache = getAlphaMissenseColumnData(
        //     data[0],
        //     indexedVariantAnnotations,
        // );
        const alphaMissenseCache = getAlphaMissenseColumnData(
            data[0],
            indexedVariantAnnotations
        );
        // console.log("alphaMissenseCache===",alphaMissenseCache)

        return (
            <div className={styles['exon-table']}>
                <AlphaMissense
                    mutation={data[0]}
                    indexedVariantAnnotations={indexedVariantAnnotations}
                ></AlphaMissense>
            </div>
        );
    }

    // private static getAlphaMissenseDataViz(
    //     genomeNexusCacheData: AlphaMissense | null
    // ) {
    //     let status: TableCellStatus | null = null;
    //     if (genomeNexusCacheData === null) {
    //         status = TableCellStatus.LOADING;
    //     } else if (
    //         genomeNexusCacheData.status === 'error' ||
    //         genomeNexusCacheData.data?.successfully_annotated === false
    //     ) {
    //         status = TableCellStatus.ERROR;
    //     } else if (genomeNexusCacheData.data === null) {
    //         status = TableCellStatus.NA;
    //     } else {
    //         let alphamissenseData = AlphaMissenseColumnFormatter.getData(
    //             genomeNexusCacheData
    //         );
    //         let pathogenicity = alphamissenseData?.pathogenicity || '';
    //         let score = alphamissenseData?.score || 0.0;
    //         if (alphamissenseData == null) {
    //             return alphamissenseData;
    //         } else {
    //             return (
    //             );
    //         }
    //     }

    //     if (status !== null) {
    //         if (status === TableCellStatus.LOADING) {
    //             return (
    //                 <Circle
    //                     size={18}
    //                     scaleEnd={0.5}
    //                     scaleStart={0.2}
    //                     color="#aaa"
    //                     className="pull-right"
    //                 />
    //             );
    //         } else {
    //             return <TableCellStatusIndicator status={status} />;
    //         }
    //     }
    // }

    // public static getData(
    //     genomeNexusCache: GenomeNexusCacheDataType | null
    // ): AlphaMissense | null {
    //     let alphaMissenseData: AlphaMissense | null = {
    //         pathogenicity: 'N/A',
    //         score: 0,
    //     };
    //     if (genomeNexusCache?.data) {
    //         const genomeNexusData = genomeNexusCache.data;
    //         const alphaMissense =
    //             genomeNexusData.annotation_summary?.transcriptConsequenceSummary
    //                 ?.alphaMissense;
    //         if (alphaMissense) {
    //             alphaMissenseData = alphaMissense;
    //         }
    //     }
    //     return alphaMissenseData;
    // }

    public static download(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >
    ): string {
        return alphaMissenseDownload(
            getAlphaMissenseColumnData(data[0], indexedVariantAnnotations)
        );

        // const genomeNexusCacheData = AlphaMissenseColumnFormatter.getGenomeNexusDataFromCache(
        //     data,
        //     genomeNexusCache
        // );
        // const alphamissenseData =
        //     genomeNexusCacheData &&
        //     AlphaMissenseColumnFormatter.getData(genomeNexusCacheData);
        //
        // if (!alphamissenseData) {
        //     return '';
        // } else {
        //     return (
        //         alphamissenseData.pathogenicity +
        //         ' (' +
        //         alphamissenseData.score +
        //         ')'
        //     );
        // }
    }

    public static getSortValue(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >
        // genomeNexusCache: GenomeNexusCache
    ): number | null {
        // return alphaMissenseSortValue(
        //     // data[0],
        //     // indexedVariantAnnotations
        //
        // )
        return alphaMissenseSortValue(
            getAlphaMissenseColumnData(data[0], indexedVariantAnnotations)
        );

        //     const genomeNexusCacheData = AlphaMissenseColumnFormatter.getGenomeNexusDataFromCache(
        //         data,
        //         genomeNexusCache
        //     );
        //     if (genomeNexusCacheData) {
        //         let alphamissenseData = AlphaMissenseColumnFormatter.getData(
        //             genomeNexusCacheData
        //         );
        //         if (alphamissenseData == null) {
        //             return null;
        //         } else {
        //             return alphamissenseData.score;
        //         }
        //     } else {
        //         return null;
        //     }
    }
}
