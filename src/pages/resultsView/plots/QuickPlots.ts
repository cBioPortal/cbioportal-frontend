import {
    PlotsTabOption,
    PlotsTabDataSource,
    NONE_SELECTED_OPTION_STRING_VALUE,
    NONE_SELECTED_OPTION_LABEL,
} from './PlotsTab';

export type ButtonInfo = {
    selected: boolean;
    display: string;
    plotModel: {
        vertical: {
            dataSource: PlotsTabOption | undefined;
            dataType: PlotsTabOption | undefined;
        };
        horizontal: {
            dataSource: PlotsTabOption | undefined;
            dataType: PlotsTabOption | undefined;
        };
    }
};

export type TypeSourcePair = {
    type: string | undefined,
    source: string | undefined,
}

/**
 * This is how the example links are created.
 * Each quickplot knows how to validate itself and produce a ButtonInfo
 * object.
 * To add a new example link, add a new object of type QuickPlot to
 * the quickPlots constant.
 */
type QuickPlot = {
    toButtonInfo: (
        vertical: TypeSourcePair,
        horizontal: TypeSourcePair,
        dataTypes: PlotsTabOption[],
        dataSources?: PlotsTabDataSource
    ) => ButtonInfo;
    isApplicableToQuery: (
        dataTypes: PlotsTabOption[],
        dataSources?: PlotsTabDataSource,
        cancerTypes?: string[],
        mutationCount?: number
    ) => boolean,
}

const quickPlots: QuickPlot[] = [
    {
        isApplicableToQuery: (
            dataTypes: PlotsTabOption[],
            dataSources: PlotsTabDataSource,
            cancerTypes: string[]
        ): boolean => {
            const clinicalAttributes = dataSources['clinical_attribute'];
            return (
                dataTypes.find((dataType) => dataType.value === "clinical_attribute") !== undefined &&
                clinicalAttributes.find((attritube) => attritube.value === "MUTATION_COUNT") !== undefined &&
                clinicalAttributes.find((attritube) => attritube.value === "CANCER_TYPE_DETAILED") !== undefined &&
                cancerTypes.length > 1 &&
                cancerTypes.length < 16
            );
        }, toButtonInfo: (
            vertical: TypeSourcePair,
            horizontal: TypeSourcePair,
            dataTypes: PlotsTabOption[],
            dataSources: PlotsTabDataSource
        ): ButtonInfo => {
            const selected = (
                vertical.type === "clinical_attribute" &&
                vertical.source === "MUTATION_COUNT" &&
                horizontal.type === "clinical_attribute" &&
                horizontal.source === "CANCER_TYPE_DETAILED"
            )

            return {
                selected,
                display: 'Mut# vs Dx',
                plotModel: {
                    vertical: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'clinical_attribute'
                        ),
                        dataSource: dataSources['clinical_attribute'].find(
                            attritube => attritube.value === 'MUTATION_COUNT'
                        ),
                    },
                    horizontal: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'clinical_attribute'
                        ),
                        dataSource: dataSources['clinical_attribute'].find(
                            attritube => attritube.value === 'CANCER_TYPE_DETAILED'
                        ),
                    },
                }
            };
        },
    },
    {
        isApplicableToQuery: (
            dataTypes: PlotsTabOption[],
            dataSources: PlotsTabDataSource,
            cancerTypes: string[]
        ): boolean => {
            const clinicalAttributes = dataSources['clinical_attribute'];
            return (
                dataTypes.find((dataType) => dataType.value === "clinical_attribute") !== undefined &&
                clinicalAttributes.find((attritube) => attritube.value === "MUTATION_COUNT") !== undefined &&
                clinicalAttributes.find((attritube) => attritube.value === "CANCER_TYPE") !== undefined &&
                cancerTypes.length > 15
            );
        }, toButtonInfo: (
            vertical: TypeSourcePair,
            horizontal: TypeSourcePair,
            dataTypes: PlotsTabOption[],
            dataSources: PlotsTabDataSource
        ): ButtonInfo => {
            const selected = (
                vertical.type === "clinical_attribute" &&
                vertical.source === "MUTATION_COUNT" &&
                horizontal.type === "clinical_attribute" &&
                horizontal.source === "CANCER_TYPE_DETAILED"
            )

            return {
                selected,
                display: 'Mut# vs Dx',
                plotModel: {
                    vertical: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'clinical_attribute'
                        ),
                        dataSource: dataSources['clinical_attribute'].find(
                            attritube => attritube.value === 'MUTATION_COUNT'
                        ),
                    },
                    horizontal: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'clinical_attribute'
                        ),
                        dataSource: dataSources['clinical_attribute'].find(
                            attritube => attritube.value === 'CANCER_TYPE'
                        ),
                    },
                }
            };
        },
    },
    {
        isApplicableToQuery: (
            dataTypes: PlotsTabOption[],
            dataSources: PlotsTabDataSource,
            cancerTypes: string[]
        ): boolean => {
            const clinicalAttributes = dataSources['clinical_attribute'];
            return (
                dataTypes.find((dataType) => dataType.value === "clinical_attribute") !== undefined &&
                clinicalAttributes.find((attritube) => attritube.value === "FRACTION_GENOME_ALTERED") !== undefined &&
                clinicalAttributes.find((attritube) => attritube.value === "CANCER_TYPE_DETAILED") !== undefined &&
                cancerTypes.length > 1 &&
                cancerTypes.length < 16
            );
        }, toButtonInfo: (
            vertical: TypeSourcePair,
            horizontal: TypeSourcePair,
            dataTypes: PlotsTabOption[],
            dataSources: PlotsTabDataSource
        ): ButtonInfo => {
            const selected = (
                vertical.type === "clinical_attribute" &&
                vertical.source === "FRACTION_GENOME_ALTERED" &&
                horizontal.type === "clinical_attribute" &&
                horizontal.source === "CANCER_TYPE_DETAILED"
            )

            return {
                selected,
                display: 'FGA vs Dx',
                plotModel: {
                    vertical: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'clinical_attribute'
                        ),
                        dataSource: dataSources['clinical_attribute'].find(
                            attritube => attritube.value === "FRACTION_GENOME_ALTERED"
                        ),
                    },
                    horizontal: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'clinical_attribute'
                        ),
                        dataSource: dataSources['clinical_attribute'].find(
                            attritube => attritube.value === 'CANCER_TYPE_DETAILED'
                        ),
                    },
                }
            };
        },
    },
    {
        isApplicableToQuery: (
            dataTypes: PlotsTabOption[],
            dataSources: PlotsTabDataSource,
            cancerTypes: string[]
        ): boolean => {
            const clinicalAttributes = dataSources['clinical_attribute'];
            return (
                dataTypes.find((dataType) => dataType.value === "clinical_attribute") !== undefined &&
                clinicalAttributes.find((attritube) => attritube.value === "FRACTION_GENOME_ALTERED") !== undefined &&
                clinicalAttributes.find((attritube) => attritube.value === "CANCER_TYPE") !== undefined &&
                cancerTypes.length > 15
            );
        }, toButtonInfo: (
            vertical: TypeSourcePair,
            horizontal: TypeSourcePair,
            dataTypes: PlotsTabOption[],
            dataSources: PlotsTabDataSource
        ): ButtonInfo => {
            const selected = (
                vertical.type === "clinical_attribute" &&
                vertical.source === "FRACTION_GENOME_ALTERED" &&
                horizontal.type === "clinical_attribute" &&
                horizontal.source === "CANCER_TYPE_DETAILED"
            )

            return {
                selected,
                display: 'FGA vs Dx',
                plotModel: {
                    vertical: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'clinical_attribute'
                        ),
                        dataSource: dataSources['clinical_attribute'].find(
                            attritube => attritube.value === 'FRACTION_GENOME_ALTERED'
                        ),
                    },
                    horizontal: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'clinical_attribute'
                        ),
                        dataSource: dataSources['clinical_attribute'].find(
                            attritube => attritube.value === 'CANCER_TYPE'
                        ),
                    },
                }
            };
        },
    },
    {
        isApplicableToQuery: (dataTypes: PlotsTabOption[], dataSources: PlotsTabDataSource): boolean => {
            const clinicalAttributes = dataSources['clinical_attribute'];
            return (
                dataTypes.find((dataType) => dataType.value === "clinical_attribute") !== undefined &&
                clinicalAttributes.find((attritube) => attritube.value === "MUTATION_COUNT") !== undefined &&
                clinicalAttributes.find((attritube) => attritube.value === "FRACTION_GENOME_ALTERED") !== undefined
            );
        }, toButtonInfo: (
            vertical: TypeSourcePair,
            horizontal: TypeSourcePair,
            dataTypes: PlotsTabOption[],
            dataSources: PlotsTabDataSource
        ): ButtonInfo => {
            const selected = (
                vertical.type === "clinical_attribute" &&
                vertical.source === "MUTATION_COUNT" &&
                horizontal.type === "clinical_attribute" &&
                horizontal.source === "FRACTION_GENOME_ALTERED"
            )

            return {
                selected,
                display: 'Mut# vs FGA',
                plotModel: {
                    vertical: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'clinical_attribute'
                        ),
                        dataSource: dataSources['clinical_attribute'].find(
                            attritube => attritube.value === 'MUTATION_COUNT'
                        ),
                    },
                    horizontal: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'clinical_attribute'
                        ),
                        dataSource: dataSources['clinical_attribute'].find(
                            attritube =>
                                attritube.value === 'FRACTION_GENOME_ALTERED'
                        ),
                    },
                }
            };
        },
    },
    {
        isApplicableToQuery: (
            dataTypes: PlotsTabOption[],
            dataSources: PlotsTabDataSource,
            cancerTypes: string[]
        ): boolean => {
            const clinicalAttributes = dataSources['clinical_attribute'];
            return (
                dataTypes.find((dataType) => dataType.value === "clinical_attribute") !== undefined &&
                dataTypes.find((dataType) => dataType.value === "MRNA_EXPRESSION") !== undefined &&
                clinicalAttributes.find((attritube) => attritube.value === "CANCER_TYPE_DETAILED") !== undefined &&
                cancerTypes.length > 1
            );
        }, toButtonInfo: (
            vertical: TypeSourcePair,
            horizontal: TypeSourcePair,
            dataTypes: PlotsTabOption[],
            dataSources: PlotsTabDataSource
        ): ButtonInfo => {
            const selected = (
                vertical.type === "MRNA_EXPRESSION" &&
                horizontal.type === "clinical_attribute" &&
                horizontal.source === "CANCER_TYPE_DETAILED"
            )

            return {
                selected,
                display: 'mRNA vs Dx',
                plotModel: {
                    vertical: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'MRNA_EXPRESSION'
                        ),
                        dataSource: undefined,
                    },
                    horizontal: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'clinical_attribute'
                        ),
                        dataSource: dataSources['clinical_attribute'].find(
                            attritube => attritube.value === 'CANCER_TYPE_DETAILED'
                        ),
                    },
                }
            };
        },
    },
    {
        isApplicableToQuery: (
            dataTypes: PlotsTabOption[],
            __: PlotsTabDataSource,
            _: string[],
            mutationCount: number
        ): boolean => {
            return (
                dataTypes.find((dataType) => dataType.value === "MUTATION_EXTENDED") !== undefined &&
                dataTypes.find((dataType) => dataType.value === "MRNA_EXPRESSION") !== undefined &&
                mutationCount > 0
            );
        }, toButtonInfo: (vertical: TypeSourcePair, horizontal: TypeSourcePair, dataTypes: PlotsTabOption[],): ButtonInfo => {
            const selected = (
                vertical.type === "MRNA_EXPRESSION" &&
                horizontal.type === "MUTATION_EXTENDED"
            )

            return {
                selected,
                display: 'mRNA vs mut type',
                plotModel: {
                    vertical: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'MRNA_EXPRESSION'
                        ),
                        dataSource: undefined,
                    },
                    horizontal: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'MUTATION_EXTENDED'
                        ),
                        dataSource: undefined,
                    },
                }
            };
        },
    },
    {
        isApplicableToQuery: (dataTypes: PlotsTabOption[]): boolean => {
            return (
                dataTypes.find((dataType) => dataType.value === "COPY_NUMBER_ALTERATION") !== undefined &&
                dataTypes.find((dataType) => dataType.value === "MRNA_EXPRESSION") !== undefined
            );
        },
        toButtonInfo: (
            vertical: TypeSourcePair,
            horizontal: TypeSourcePair,
            dataTypes: PlotsTabOption[]
        ): ButtonInfo => {
            const selected = (
                vertical.type === "MRNA_EXPRESSION" &&
                horizontal.type === "COPY_NUMBER_ALTERATION"
            )

            return {
                selected,
                display: "mRNA vs CNA",
                plotModel: {vertical: {
                    dataType: dataTypes.find((dataType) => dataType.value === "MRNA_EXPRESSION"),
                    dataSource: undefined,
                },
                horizontal: {
                    dataType: dataTypes.find((dataType) => dataType.value === "COPY_NUMBER_ALTERATION"),
                    dataSource: undefined,},
                },
            }
        }
    },
    {
        isApplicableToQuery: (dataTypes: PlotsTabOption[]): boolean => {
            return (
                dataTypes.find((dataType) => dataType.value === "METHYLATION") !== undefined &&
                dataTypes.find((dataType) => dataType.value === "MRNA_EXPRESSION") !== undefined
            );
        },
        toButtonInfo: (
            vertical: TypeSourcePair,
            horizontal: TypeSourcePair,
            dataTypes: PlotsTabOption[]
        ): ButtonInfo => {
            const selected = (
                vertical.type === "MRNA_EXPRESSION" &&
                horizontal.type === "METHYLATION"
            )

            return {
                selected,
                display: 'mRNA vs methyl',
                plotModel: {
                    vertical: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'MRNA_EXPRESSION'
                        ),
                        dataSource: undefined,
                    },
                    horizontal: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'METHYLATION'
                        ),
                        dataSource: undefined,
                    },
                }
            };
        },
    },
    {
        isApplicableToQuery: (dataTypes: PlotsTabOption[]): boolean => {
            return (
                dataTypes.find((dataType) => dataType.value === "PROTEIN_LEVEL") !== undefined &&
                dataTypes.find((dataType) => dataType.value === "MRNA_EXPRESSION") !== undefined
            );
        }, toButtonInfo: (vertical: TypeSourcePair, horizontal: TypeSourcePair, dataTypes: PlotsTabOption[], dataSources: PlotsTabDataSource): ButtonInfo => {
            const selected = (
                vertical.type === "PROTEIN_LEVEL" &&
                horizontal.type === "MRNA_EXPRESSION"
            )

            return {
                selected,
                display: 'Protein vs mRNA',
                plotModel: {
                    vertical: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'PROTEIN_LEVEL'
                        ),
                        dataSource: dataSources['PROTEIN_LEVEL'].find(
                            source =>
                                source.value === 'brca_tcga_protein_quantification'
                        ),
                    },
                    horizontal: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'MRNA_EXPRESSION'
                        ),
                        dataSource: undefined,
                    },
                }
            };
        },
    },
    {
        isApplicableToQuery: (dataTypes: PlotsTabOption[]): boolean => {
            return (
                dataTypes.find((dataType) => dataType.value === "GENERIC_ASSAY") !== undefined
            );
        }, toButtonInfo: (vertical: TypeSourcePair, horizontal: TypeSourcePair, dataTypes: PlotsTabOption[]): ButtonInfo => {
            const selected = (
                vertical.type === "GENERIC_ASSAY" &&
                horizontal.type === NONE_SELECTED_OPTION_STRING_VALUE
            )

            return {
                selected,
                display: 'Tx Waterfall',
                plotModel: {
                    horizontal: {
                        dataType: {
                            value: NONE_SELECTED_OPTION_STRING_VALUE,
                            label: NONE_SELECTED_OPTION_LABEL,
                        },
                        dataSource: undefined,
                    },
                    vertical: {
                        dataType: dataTypes.find(
                            dataType => dataType.value === 'GENERIC_ASSAY'
                        ),
                        dataSource: undefined,
                    },
                }
            };
        },
    },
]

export function generateQuickPlots(
    dataTypes: PlotsTabOption[],
    dataSources: PlotsTabDataSource,
    cancerTypes: string[],
    mutationCount: number,
    horizontal: TypeSourcePair,
    vertical: TypeSourcePair,
): ButtonInfo[] {
    return quickPlots
        .filter((plot) => plot.isApplicableToQuery(dataTypes, dataSources, cancerTypes, mutationCount))
        .map((plot) => plot.toButtonInfo(vertical, horizontal, dataTypes, dataSources));
}