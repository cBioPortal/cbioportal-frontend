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
import {
    ClinVarId,
    clinVarSortValue,
    getClinVarId,
} from 'react-mutation-mapper';
import generalStyles from './styles.module.scss';

export default class ClinVarColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        genomeNexusMyVariantInfoCache: GenomeNexusMyVariantInfoCache | undefined
    ) {
        const genomeNexusCacheData = ClinVarColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusMyVariantInfoCache
        );
        return (
            <div
                data-test="clinvar-data"
                className={generalStyles['integer-data']}
            >
                {ClinVarColumnFormatter.getClinVarDataViz(genomeNexusCacheData)}
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

    private static getClinVarDataViz(
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
            return (
                <ClinVarId
                    myVariantInfo={
                        genomeNexusCacheData.data.my_variant_info
                            ? genomeNexusCacheData.data.my_variant_info
                                  .annotation
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

    public static getData(
        genomeNexusData: MyVariantInfoAnnotation | null
    ): string | null {
        if (genomeNexusData) {
            return getClinVarId(genomeNexusData.annotation);
        } else {
            return null;
        }
    }

    public static download(
        data: Mutation[],
        genomeNexusMyVariantInfoCache: GenomeNexusMyVariantInfoCache
    ): string {
        const genomeNexusCacheData = ClinVarColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusMyVariantInfoCache
        );
        if (genomeNexusCacheData && genomeNexusCacheData.data) {
            let clinVarId = ClinVarColumnFormatter.getData(
                genomeNexusCacheData.data.my_variant_info
            );
            if (clinVarId) {
                return clinVarId;
            }
        }
        return '';
    }

    public static getSortValue(
        data: Mutation[],
        genomeNexusCache: GenomeNexusMyVariantInfoCache
    ): number | null {
        const genomeNexusCacheData = ClinVarColumnFormatter.getGenomeNexusDataFromCache(
            data,
            genomeNexusCache
        );
        if (
            genomeNexusCacheData &&
            genomeNexusCacheData.data &&
            genomeNexusCacheData.data.my_variant_info
        ) {
            return clinVarSortValue(
                genomeNexusCacheData.data.my_variant_info.annotation
            );
        }
        return null;
    }
}
