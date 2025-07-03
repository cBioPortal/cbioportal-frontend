import {
    ColoringMenuOmnibarOption,
    ColoringType,
    SelectedColoringTypes,
    NONE_SELECTED_OPTION_NUMERICAL_VALUE,
} from '../plots/PlotsTab';
import { ClinicalAttribute, Sample } from 'cbioportal-ts-api-client';
import { IPlotSampleData } from '../plots/PlotsTabUtils';
import { getOncoprintMutationType } from '../oncoprint/DataUtils';
import ClinicalDataCache from '../../cache/ClinicalDataCache';
import { makeScatterPlotPointAppearance } from '../plots/PlotsTabUtils';
import { DEFAULT_GREY } from '../../lib/Colors';
import {
    CNA_COLOR_AMP,
    CNA_COLOR_HOMDEL,
    MUT_COLOR_INFRAME,
    MUT_COLOR_INFRAME_PASSENGER,
    MUT_COLOR_MISSENSE,
    MUT_COLOR_MISSENSE_PASSENGER,
    MUT_COLOR_TRUNC,
    MUT_COLOR_TRUNC_PASSENGER,
    MUT_COLOR_SPLICE,
    MUT_COLOR_SPLICE_PASSENGER,
    MUT_COLOR_OTHER,
    MUT_COLOR_OTHER_PASSENGER,
    STRUCTURAL_VARIANT_COLOR,
} from 'cbioportal-frontend-commons';

export interface ColoredDataPoint {
    sampleId: string;
    patientId: string;
    studyId: string;
    color: string;
    value?: string | number;
    displayValue?: string;
}

export interface ColoringServiceConfig {
    selectedOption?: ColoringMenuOmnibarOption;
    clinicalDataCache?: ClinicalDataCache;
    logScale?: boolean;
    // Molecular data sources (same as PlotsTab)
    annotatedMutationCache?: any;
    annotatedCnaCache?: any;
    annotatedSvCache?: any;
    structuralVariantCache?: any; // Raw structural variant cache for Study View
    // Driver annotation settings (same as PlotsTab)
    driverAnnotationSettings?: any;
}

export class ColoringService {
    private config: ColoringServiceConfig;

    constructor(config: ColoringServiceConfig) {
        this.config = config;
    }

    public getColoringTypes(): SelectedColoringTypes {
        const coloringTypes: SelectedColoringTypes = {};

        if (!this.config.selectedOption) {
            return coloringTypes;
        }

        const option = this.config.selectedOption;

        if (option.info.entrezGeneId === NONE_SELECTED_OPTION_NUMERICAL_VALUE) {
            // No coloring
            return coloringTypes;
        }

        if (option.info.entrezGeneId) {
            // Gene-based coloring - would need mutation/CNA data
            // For now, we'll focus on clinical data coloring
            return coloringTypes;
        }

        if (option.info.clinicalAttribute) {
            coloringTypes[ColoringType.ClinicalData] = true;
        }

        return coloringTypes;
    }

    public getPointColor(sample: Sample): string {
        if (!this.config.selectedOption || !this.config.clinicalDataCache) {
            return '#BEBEBE'; // Default gray
        }

        const option = this.config.selectedOption;

        if (option.info.entrezGeneId === NONE_SELECTED_OPTION_NUMERICAL_VALUE) {
            return '#BEBEBE'; // No coloring
        }

        if (option.info.clinicalAttribute) {
            return this.getClinicalDataColor(
                sample,
                option.info.clinicalAttribute
            );
        }

        if (
            option.info.entrezGeneId &&
            option.info.entrezGeneId !== NONE_SELECTED_OPTION_NUMERICAL_VALUE
        ) {
            return this.getGeneDataColorUsingPlotsTabLogic(
                sample,
                option.info.entrezGeneId
            );
        }

        return '#BEBEBE';
    }

    public getPointAppearance(
        sample: Sample
    ): { fill: string; stroke: string; strokeWidth?: number } {
        if (!this.config.selectedOption || !this.config.clinicalDataCache) {
            return { fill: '#BEBEBE', stroke: '#BEBEBE' };
        }

        const option = this.config.selectedOption;

        if (option.info.entrezGeneId === NONE_SELECTED_OPTION_NUMERICAL_VALUE) {
            return { fill: '#BEBEBE', stroke: '#BEBEBE' };
        }

        if (option.info.clinicalAttribute) {
            const color = this.getClinicalDataColor(
                sample,
                option.info.clinicalAttribute
            );
            return { fill: color, stroke: color };
        }

        if (
            option.info.entrezGeneId &&
            option.info.entrezGeneId !== NONE_SELECTED_OPTION_NUMERICAL_VALUE
        ) {
            return this.getGeneDataAppearance(sample, option.info.entrezGeneId);
        }

        return { fill: '#BEBEBE', stroke: '#BEBEBE' };
    }

    private getGeneDataAppearance(
        sample: Sample,
        entrezGeneId: number
    ): { fill: string; stroke: string; strokeWidth?: number } {
        const plotSampleData = this.buildPlotSampleData(sample, entrezGeneId);
        if (!plotSampleData) {
            return { fill: DEFAULT_GREY, stroke: DEFAULT_GREY };
        }

        // Enable all available coloring types like Plots Tab does
        const coloringTypes: SelectedColoringTypes = {};

        if (this.config.annotatedMutationCache) {
            coloringTypes[ColoringType.MutationType] = true;
        }
        if (this.config.annotatedCnaCache) {
            coloringTypes[ColoringType.CopyNumber] = true;
        }
        if (
            this.config.annotatedSvCache ||
            this.config.structuralVariantCache
        ) {
            coloringTypes[ColoringType.StructuralVariant] = true;
        }

        // Use the same point appearance function as PlotsTab
        const appearanceFunction = makeScatterPlotPointAppearance(
            coloringTypes,
            !!this.config.annotatedMutationCache,
            !!this.config.annotatedCnaCache,
            !!this.config.annotatedSvCache,
            !!this.config.driverAnnotationSettings?.driversAnnotated,
            this.config.selectedOption,
            this.config.clinicalDataCache,
            this.config.logScale
        );

        try {
            const appearance = appearanceFunction(plotSampleData);
            return {
                fill: appearance.fill || DEFAULT_GREY,
                stroke: appearance.stroke || DEFAULT_GREY,
                strokeWidth: 1,
            };
        } catch (error) {
            console.warn('Error getting gene appearance:', error);
            return { fill: DEFAULT_GREY, stroke: DEFAULT_GREY };
        }
    }

    private getClinicalDataColor(
        sample: Sample,
        clinicalAttribute: ClinicalAttribute
    ): string {
        if (!this.config.clinicalDataCache) {
            return '#BEBEBE';
        }

        const cacheEntry = this.config.clinicalDataCache.get(clinicalAttribute);

        if (!cacheEntry.isComplete || !cacheEntry.result) {
            return '#BEBEBE';
        }

        const data = cacheEntry.result;

        // Find clinical data for this sample
        let clinicalData = null;
        if (data.data && Array.isArray(data.data)) {
            clinicalData = (data.data as any[]).find(
                (d: any) =>
                    d.sampleId === sample.sampleId &&
                    d.studyId === sample.studyId
            );
        }

        if (!clinicalData) {
            return '#BEBEBE'; // No data
        }

        if (clinicalAttribute.datatype === 'STRING') {
            // Categorical data
            if (data.categoryToColor) {
                return data.categoryToColor[clinicalData.value] || '#BEBEBE';
            }
        } else if (clinicalAttribute.datatype === 'NUMBER') {
            // Numerical data
            if (data.numericalValueToColor) {
                const numValue = parseFloat(clinicalData.value);
                if (!isNaN(numValue)) {
                    return data.numericalValueToColor(numValue);
                }
            }
        }

        return '#BEBEBE';
    }

    private getGeneDataColorUsingPlotsTabLogic(
        sample: Sample,
        entrezGeneId: number
    ): string {
        // Build proper IPlotSampleData object with molecular data
        const plotSampleData = this.buildPlotSampleData(sample, entrezGeneId);
        if (!plotSampleData) {
            return DEFAULT_GREY;
        }

        // Enable all available coloring types like Plots Tab does
        const coloringTypes: SelectedColoringTypes = {};

        if (this.config.annotatedMutationCache) {
            coloringTypes[ColoringType.MutationType] = true;
        }
        if (this.config.annotatedCnaCache) {
            coloringTypes[ColoringType.CopyNumber] = true;
        }
        if (
            this.config.annotatedSvCache ||
            this.config.structuralVariantCache
        ) {
            coloringTypes[ColoringType.StructuralVariant] = true;
        }

        // Use the same point appearance function as PlotsTab
        const appearanceFunction = makeScatterPlotPointAppearance(
            coloringTypes,
            !!this.config.annotatedMutationCache,
            !!this.config.annotatedCnaCache,
            !!this.config.annotatedSvCache,
            !!this.config.driverAnnotationSettings?.driversAnnotated,
            this.config.selectedOption,
            this.config.clinicalDataCache,
            this.config.logScale
        );

        try {
            const appearance = appearanceFunction(plotSampleData);

            // For molecular data, both fill and stroke can contain meaningful colors
            // Mutations typically use fill, CNAs typically use stroke
            // Prioritize CNA stroke colors over mutation fill colors
            let color = DEFAULT_GREY;

            if (
                appearance.stroke &&
                appearance.stroke !== DEFAULT_GREY &&
                appearance.stroke !== '#BEBEBE'
            ) {
                color = appearance.stroke; // Use stroke for CNAs (higher priority)
            } else if (
                appearance.fill &&
                appearance.fill !== DEFAULT_GREY &&
                appearance.fill !== '#BEBEBE'
            ) {
                color = appearance.fill; // Use fill for mutations
            } else if (appearance.stroke) {
                color = appearance.stroke; // Fallback to stroke
            } else if (appearance.fill) {
                color = appearance.fill; // Fallback to fill
            }

            return color;
        } catch (error) {
            console.warn(
                'Error getting gene color using PlotsTab logic:',
                error
            );
            return DEFAULT_GREY;
        }
    }

    private static cnaValuesSeen = new Set<number>();
    private static samplesSeen = new Set<string>();

    private buildPlotSampleData(
        sample: Sample,
        entrezGeneId: number
    ): IPlotSampleData | null {
        const uniqueSampleKey = `${sample.sampleId}:${sample.studyId}`;

        // Track unique samples
        if (!ColoringService.samplesSeen.has(sample.sampleId)) {
            ColoringService.samplesSeen.add(sample.sampleId);
        }

        // Initialize the plot sample data structure
        const plotData: IPlotSampleData = {
            uniqueSampleKey,
            sampleId: sample.sampleId,
            studyId: sample.studyId,
            mutations: [],
            copyNumberAlterations: [],
            structuralVariants: [],
        };

        try {
            // Get mutation data for this gene and sample
            if (this.config.annotatedMutationCache) {
                const mutationCacheResult = this.config.annotatedMutationCache.get(
                    { entrezGeneId }
                );

                if (
                    mutationCacheResult?.isComplete &&
                    mutationCacheResult.result
                ) {
                    const allMutations = mutationCacheResult.result;
                    plotData.mutations = allMutations.filter(
                        (mut: any) =>
                            mut.sampleId === sample.sampleId &&
                            mut.studyId === sample.studyId
                    );

                    // Set dispMutationType based on mutations with driver annotation support
                    if (plotData.mutations.length > 0) {
                        plotData.dispMutationType = getOncoprintMutationType(
                            plotData.mutations[0]
                        );

                        // Store driver status separately to avoid type conflicts
                        const driversAnnotated =
                            this.config.driverAnnotationSettings
                                ?.driversAnnotated || false;
                        (plotData as any).isDriverMutation =
                            driversAnnotated &&
                            plotData.mutations[0]?.putativeDriver;

                        plotData.isProfiledMutations = true;
                    } else {
                        plotData.isProfiledMutations = true; // Still profiled, just no mutations
                    }
                }
            }

            // Get CNA data for this gene and sample
            if (this.config.annotatedCnaCache) {
                const cnaCacheResult = this.config.annotatedCnaCache.get({
                    entrezGeneId,
                });

                if (cnaCacheResult?.isComplete && cnaCacheResult.result) {
                    const allCnas = cnaCacheResult.result;
                    plotData.copyNumberAlterations = allCnas.filter(
                        (cna: any) =>
                            cna.sampleId === sample.sampleId &&
                            cna.studyId === sample.studyId
                    );

                    // Set dispCna based on CNA data
                    if (plotData.copyNumberAlterations.length > 0) {
                        plotData.dispCna = plotData.copyNumberAlterations[0];
                        plotData.isProfiledCna = true;
                        ColoringService.cnaValuesSeen.add(
                            plotData.dispCna.value
                        );
                    } else {
                        plotData.isProfiledCna = true; // Still profiled, just no CNAs
                    }
                }
            }

            // Get structural variant data for this gene and sample
            const svCache =
                this.config.annotatedSvCache ||
                this.config.structuralVariantCache;
            if (svCache) {
                const svCacheResult = svCache.get({
                    entrezGeneId,
                });
                if (svCacheResult?.isComplete && svCacheResult.result) {
                    plotData.structuralVariants = svCacheResult.result.filter(
                        (sv: any) =>
                            sv.sampleId === sample.sampleId &&
                            sv.studyId === sample.studyId
                    );

                    if (plotData.structuralVariants.length > 0) {
                        // For structural variants, use the variant class or type as the display value
                        const firstSv = plotData.structuralVariants[0];
                        plotData.dispStructuralVariant =
                            firstSv.variantClass || firstSv.eventInfo || 'SV';
                        plotData.isProfiledStructuralVariants = true;
                    } else {
                        plotData.isProfiledStructuralVariants = true;
                    }
                }
            }

            return plotData;
        } catch (error) {
            console.warn('Error building plot sample data:', error);
            return null;
        }
    }

    public getDisplayValue(sample: Sample): string | undefined {
        if (!this.config.selectedOption) {
            return undefined;
        }

        const option = this.config.selectedOption;

        if (option.info.clinicalAttribute && this.config.clinicalDataCache) {
            const cacheEntry = this.config.clinicalDataCache.get(
                option.info.clinicalAttribute
            );

            if (cacheEntry.isComplete && cacheEntry.result) {
                let clinicalData = null;
                if (
                    cacheEntry.result.data &&
                    Array.isArray(cacheEntry.result.data)
                ) {
                    clinicalData = (cacheEntry.result.data as any[]).find(
                        (d: any) =>
                            d.sampleId === sample.sampleId &&
                            d.studyId === sample.studyId
                    );
                }

                return clinicalData?.value;
            }
        }

        if (
            option.info.entrezGeneId &&
            option.info.entrezGeneId !== NONE_SELECTED_OPTION_NUMERICAL_VALUE
        ) {
            // For gene-based coloring, return the legend label from the appearance function
            return this.getGeneLegendLabel(sample, option.info.entrezGeneId);
        }

        return undefined;
    }

    public getGeneLegendLabel(sample: Sample, entrezGeneId: number): string {
        // Build proper IPlotSampleData object with molecular data
        const plotSampleData = this.buildPlotSampleData(sample, entrezGeneId);
        if (!plotSampleData) {
            return 'Not profiled';
        }

        // Enable all available coloring types like Plots Tab does
        // The makeScatterPlotPointAppearance function will combine them appropriately
        let coloringTypes: SelectedColoringTypes = {};

        if (this.config.annotatedMutationCache) {
            coloringTypes[ColoringType.MutationType] = true;
        }
        if (this.config.annotatedCnaCache) {
            coloringTypes[ColoringType.CopyNumber] = true;
        }
        if (
            this.config.annotatedSvCache ||
            this.config.structuralVariantCache
        ) {
            coloringTypes[ColoringType.StructuralVariant] = true;
        }

        let hasMutation = plotSampleData.mutations.length > 0;
        let hasCNA =
            plotSampleData.copyNumberAlterations.length > 0 &&
            plotSampleData.dispCna &&
            plotSampleData.dispCna.value !== 0;
        let hasSV = plotSampleData.structuralVariants.length > 0;

        // Use the same point appearance function as PlotsTab
        const appearanceFunction = makeScatterPlotPointAppearance(
            coloringTypes,
            !!this.config.annotatedMutationCache,
            !!this.config.annotatedCnaCache,
            !!this.config.annotatedSvCache,
            !!this.config.driverAnnotationSettings?.driversAnnotated,
            this.config.selectedOption,
            this.config.clinicalDataCache,
            this.config.logScale
        );

        try {
            const appearance = appearanceFunction(plotSampleData);

            // Determine the label based on the sample data, prioritizing structural variants first
            if (plotSampleData.structuralVariants.length > 0) {
                // Has structural variants - highest priority for visibility
                return 'Structural Variant';
            } else if (
                plotSampleData.mutations.length > 0 &&
                plotSampleData.dispMutationType
            ) {
                // Has mutations - return mutation type with driver/VUS annotation
                const mutationType = plotSampleData.dispMutationType;
                const isDriverMutation = (plotSampleData as any)
                    .isDriverMutation;
                const driversAnnotated =
                    this.config.driverAnnotationSettings?.driversAnnotated ||
                    false;

                const capitalizedType =
                    mutationType.charAt(0).toUpperCase() +
                    mutationType.slice(1);

                if (driversAnnotated) {
                    return isDriverMutation
                        ? `${capitalizedType} (Driver)`
                        : `${capitalizedType} (VUS)`;
                } else {
                    return capitalizedType;
                }
            } else if (
                plotSampleData.copyNumberAlterations.length > 0 &&
                plotSampleData.dispCna &&
                plotSampleData.dispCna.value !== 0
            ) {
                // Has non-diploid CNA alterations - return CNA type
                const cnaValue = plotSampleData.dispCna.value;
                switch (cnaValue) {
                    case -2:
                        return 'Deep Deletion';
                    case -1:
                        return 'Shallow Deletion';
                    case 1:
                        return 'Gain';
                    case 2:
                        return 'Amplification';
                    default:
                        return `CNA ${cnaValue}`;
                }
            } else if (
                plotSampleData.copyNumberAlterations.length > 0 &&
                plotSampleData.dispCna &&
                plotSampleData.dispCna.value === 0
            ) {
                // Has diploid CNA (value 0) but no mutations or SVs - return Diploid
                return 'Diploid';
            } else {
                // No alterations found - this should be the vanilla dot
                return 'No mutation';
            }
        } catch (error) {
            console.warn('Error getting gene legend label:', error);
            return 'Error';
        }
    }

    public getLegendData(): { name: string; color: string; style?: string }[] {
        if (!this.config.selectedOption) {
            return [];
        }

        const option = this.config.selectedOption;

        // Clinical attribute legend
        if (option.info.clinicalAttribute && this.config.clinicalDataCache) {
            const cacheEntry = this.config.clinicalDataCache.get(
                option.info.clinicalAttribute
            );

            if (cacheEntry.isComplete && cacheEntry.result) {
                const data = cacheEntry.result;

                if (
                    option.info.clinicalAttribute.datatype === 'STRING' &&
                    data.categoryToColor
                ) {
                    return Object.entries(data.categoryToColor).map(
                        ([name, color]) => ({
                            name,
                            color,
                        })
                    );
                }
            }
        }

        // Gene-based legend - create based on common alteration types
        if (
            option.info.entrezGeneId &&
            option.info.entrezGeneId !== NONE_SELECTED_OPTION_NUMERICAL_VALUE
        ) {
            const legend: {
                name: string;
                color: string;
                style?: string;
            }[] = [];

            // Add mutation type legends if mutations are enabled (show as filled dots)
            if (this.config.annotatedMutationCache) {
                const driversAnnotated =
                    this.config.driverAnnotationSettings?.driversAnnotated ||
                    false;

                if (driversAnnotated) {
                    // Show both driver and VUS versions with correct colors
                    legend.push(
                        {
                            name: 'Missense (Driver)',
                            color: MUT_COLOR_MISSENSE,
                            style: 'filled',
                        },
                        {
                            name: 'Missense (VUS)',
                            color: MUT_COLOR_MISSENSE_PASSENGER,
                            style: 'filled',
                        },
                        {
                            name: 'Truncating (Driver)',
                            color: MUT_COLOR_TRUNC,
                            style: 'filled',
                        },
                        {
                            name: 'Truncating (VUS)',
                            color: MUT_COLOR_TRUNC_PASSENGER,
                            style: 'filled',
                        },
                        {
                            name: 'Inframe (Driver)',
                            color: MUT_COLOR_INFRAME,
                            style: 'filled',
                        },
                        {
                            name: 'Inframe (VUS)',
                            color: MUT_COLOR_INFRAME_PASSENGER,
                            style: 'filled',
                        },
                        {
                            name: 'Splice (Driver)',
                            color: MUT_COLOR_SPLICE,
                            style: 'filled',
                        },
                        {
                            name: 'Splice (VUS)',
                            color: MUT_COLOR_SPLICE_PASSENGER,
                            style: 'filled',
                        },
                        {
                            name: 'Other (Driver)',
                            color: MUT_COLOR_OTHER,
                            style: 'filled',
                        },
                        {
                            name: 'Other (VUS)',
                            color: MUT_COLOR_OTHER_PASSENGER,
                            style: 'filled',
                        }
                    );
                } else {
                    // Show standard mutation types when driver annotations are disabled
                    legend.push(
                        {
                            name: 'Missense',
                            color: MUT_COLOR_MISSENSE,
                            style: 'filled',
                        },
                        {
                            name: 'Truncating',
                            color: MUT_COLOR_TRUNC,
                            style: 'filled',
                        },
                        {
                            name: 'Inframe',
                            color: MUT_COLOR_INFRAME,
                            style: 'filled',
                        },
                        {
                            name: 'Splice',
                            color: MUT_COLOR_SPLICE,
                            style: 'filled',
                        },
                        {
                            name: 'Other',
                            color: MUT_COLOR_OTHER,
                            style: 'filled',
                        }
                    );
                }
            }

            // Add vanilla "No mutation" dot (unfilled, no border)
            legend.push({
                name: 'No mutation',
                color: '#c4e5f5',
                style: 'vanilla',
            });

            // Add CNA type legends if CNAs are enabled (show as unfilled borders)
            if (this.config.annotatedCnaCache) {
                legend.push(
                    {
                        name: 'Amplification',
                        color: CNA_COLOR_AMP,
                        style: 'border',
                    }, // Red border
                    { name: 'Gain', color: '#ff8c9f', style: 'border' }, // Pink border
                    { name: 'Diploid', color: DEFAULT_GREY, style: 'border' }, // Grey border
                    {
                        name: 'Shallow Deletion',
                        color: '#2aced4',
                        style: 'border',
                    }, // Light blue border
                    {
                        name: 'Deep Deletion',
                        color: CNA_COLOR_HOMDEL,
                        style: 'border',
                    } // Blue border
                );
            }

            // Add structural variant legend if SVs are enabled (show as unfilled border)
            if (
                this.config.annotatedSvCache ||
                this.config.structuralVariantCache
            ) {
                legend.push({
                    name: 'Structural Variant',
                    color: STRUCTURAL_VARIANT_COLOR,
                    style: 'border',
                });
            }

            // Add not profiled category
            legend.push({ name: 'Not profiled', color: '#d3d3d3' });

            return legend;
        }

        return [];
    }

    public updateConfig(newConfig: Partial<ColoringServiceConfig>) {
        this.config = { ...this.config, ...newConfig };
    }
}

export default ColoringService;
