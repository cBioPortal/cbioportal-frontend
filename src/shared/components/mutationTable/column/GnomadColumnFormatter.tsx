import * as React from 'react';
import { Circle } from 'better-react-spinkit';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'shared/api/generated/CBioPortalAPI';
import {
    TableCellStatusIndicator,
    TableCellStatus,
    MyVariantInfo,
    MyVariantInfoAnnotation,
} from 'cbioportal-frontend-commons';
import GenomeNexusMyVariantInfoCache, {
    GenomeNexusCacheDataType,
} from 'shared/cache/GenomeNexusMyVariantInfoCache';
import {
    calculateGnomadAllelFrequency,
    GnomadFrequency,
    gnomadSortValue,
} from 'react-mutation-mapper';

export default class GnomadColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        genomeNexusMyVariantInfoCache: GenomeNexusMyVariantInfoCache | undefined
    ) {
        const genomeNexusCacheData = GnomadColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusMyVariantInfoCache
        );
        return (
            <span data-test="gnomad-column" data-test2={data[0].sampleId}>
                {GnomadColumnFormatter.getGnomadDataViz(genomeNexusCacheData)}
            </span>
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

    private static getGnomadDataViz(genomeNexusCacheData: GenomeNexusCacheDataType | null) {
        let status: TableCellStatus | null = null;

        if (genomeNexusCacheData == null) {
            status = TableCellStatus.LOADING;
        } else if (genomeNexusCacheData.status === 'error') {
            status = TableCellStatus.ERROR;
        } else if (genomeNexusCacheData.data == null) {
            status = TableCellStatus.NA;
        } else {
            return (
                <GnomadFrequency
                    myVariantInfo={
                        genomeNexusCacheData &&
                        genomeNexusCacheData.data &&
                        genomeNexusCacheData.data.my_variant_info
                            ? genomeNexusCacheData.data.my_variant_info.annotation
                            : undefined
                    }
                    annotation={
                        genomeNexusCacheData && genomeNexusCacheData.data
                            ? genomeNexusCacheData.data
                            : undefined
                    }
                />
            );
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

    public static getData(genomeNexusData: MyVariantInfoAnnotation | null): MyVariantInfo | null {
        if (!genomeNexusData) {
            return null;
        }
        return genomeNexusData.annotation;
    }

    public static getSortValue(
        data: Mutation[],
        genomeNexusMyVariantInfoCache: GenomeNexusMyVariantInfoCache
    ): number | null {
        const genomeNexusCacheData = GnomadColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusMyVariantInfoCache
        );
        if (
            genomeNexusCacheData &&
            genomeNexusCacheData.data &&
            genomeNexusCacheData.data.my_variant_info
        ) {
            return gnomadSortValue(genomeNexusCacheData.data.my_variant_info.annotation);
        }
        // If genomeNexusCacheData is null or gnomadData is null, return null
        return null;
    }

    public static download(
        data: Mutation[],
        genomeNexusMyVariantInfoCache: GenomeNexusMyVariantInfoCache
    ): string {
        const genomeNexusCacheData = GnomadColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusMyVariantInfoCache
        );

        if (genomeNexusCacheData && genomeNexusCacheData.data) {
            let gnomadData = GnomadColumnFormatter.getData(
                genomeNexusCacheData.data.my_variant_info
            );

            if (gnomadData && gnomadData.gnomadExome && gnomadData.gnomadGenome) {
                return calculateGnomadAllelFrequency(
                    gnomadData.gnomadExome.alleleCount.ac + gnomadData.gnomadGenome.alleleCount.ac,
                    gnomadData.gnomadExome.alleleNumber.an +
                        gnomadData.gnomadGenome.alleleFrequency.af,
                    null
                ).toString();
            }

            if (gnomadData && gnomadData.gnomadExome) {
                return calculateGnomadAllelFrequency(
                    gnomadData.gnomadExome.alleleCount.ac,
                    gnomadData.gnomadExome.alleleNumber.an,
                    gnomadData.gnomadExome.alleleFrequency.af
                ).toString();
            }

            if (gnomadData && gnomadData.gnomadGenome) {
                return calculateGnomadAllelFrequency(
                    gnomadData.gnomadGenome.alleleCount.ac,
                    gnomadData.gnomadGenome.alleleNumber.an,
                    gnomadData.gnomadGenome.alleleFrequency.af
                ).toString();
            }
        }

        return '';
    }
}
