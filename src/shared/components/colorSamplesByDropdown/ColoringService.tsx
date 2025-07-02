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
    MUT_COLOR_MISSENSE,
    MUT_COLOR_TRUNC,
    MUT_COLOR_SPLICE,
    MUT_COLOR_OTHER,
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
    // Additional flags for gene-based coloring
    driversAnnotated?: boolean;
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
        if (this.config.annotatedSvCache) {
            coloringTypes[ColoringType.StructuralVariant] = true;
        }

        // Use the same point appearance function as PlotsTab
        const appearanceFunction = makeScatterPlotPointAppearance(
            coloringTypes,
            !!this.config.annotatedMutationCache,
            !!this.config.annotatedCnaCache,
            !!this.config.annotatedSvCache,
            !!this.config.driversAnnotated,
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
        if (this.config.annotatedSvCache) {
            coloringTypes[ColoringType.StructuralVariant] = true;
        }

        // Use the same point appearance function as PlotsTab
        const appearanceFunction = makeScatterPlotPointAppearance(
            coloringTypes,
            !!this.config.annotatedMutationCache,
            !!this.config.annotatedCnaCache,
            !!this.config.annotatedSvCache,
            !!this.config.driversAnnotated,
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

                    // Set dispMutationType based on mutations
                    if (plotData.mutations.length > 0) {
                        plotData.dispMutationType = getOncoprintMutationType(
                            plotData.mutations[0]
                        );
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
            if (this.config.annotatedSvCache) {
                const svCacheResult = this.config.annotatedSvCache.get({
                    entrezGeneId,
                });
                if (svCacheResult?.isComplete && svCacheResult.result) {
                    plotData.structuralVariants = svCacheResult.result.filter(
                        (sv: any) =>
                            sv.sampleId === sample.sampleId &&
                            sv.studyId === sample.studyId
                    );

                    if (plotData.structuralVariants.length > 0) {
                        plotData.dispStructuralVariant = 'SV'; // Simple marker for structural variant presence
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
        if (this.config.annotatedSvCache) {
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
            !!this.config.driversAnnotated,
            this.config.selectedOption,
            this.config.clinicalDataCache,
            this.config.logScale
        );

        try {
            const appearance = appearanceFunction(plotSampleData);

            // Determine the label based on the sample data
            if (
                plotSampleData.mutations.length > 0 &&
                plotSampleData.dispMutationType
            ) {
                // Has mutations - return mutation type
                const label =
                    plotSampleData.dispMutationType.charAt(0).toUpperCase() +
                    plotSampleData.dispMutationType.slice(1);
                return label;
            } else if (
                plotSampleData.copyNumberAlterations.length > 0 &&
                plotSampleData.dispCna
            ) {
                // Has CNA - return CNA type based on value
                const cnaValue = plotSampleData.dispCna.value;
                switch (cnaValue) {
                    case -2:
                        return 'Deep Deletion';
                    case -1:
                        return 'Shallow Deletion';
                    case 0:
                        return 'Diploid';
                    case 1:
                        return 'Gain';
                    case 2:
                        return 'Amplification';
                    default:
                        return `CNA ${cnaValue}`;
                }
            } else if (plotSampleData.structuralVariants.length > 0) {
                return 'Structural Variant';
            } else {
                // No alterations found
                return 'No mutation';
            }
        } catch (error) {
            console.warn('Error getting gene legend label:', error);
            return 'Error';
        }
    }

    public getLegendData(): { name: string; color: string }[] {
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
            const legend: { name: string; color: string }[] = [];

            // Add mutation type legends if mutations are enabled
            if (this.config.annotatedMutationCache) {
                legend.push(
                    { name: 'Missense', color: MUT_COLOR_MISSENSE },
                    { name: 'Truncating', color: MUT_COLOR_TRUNC },
                    { name: 'Inframe', color: MUT_COLOR_INFRAME },
                    { name: 'Splice', color: MUT_COLOR_SPLICE },
                    { name: 'Other', color: MUT_COLOR_OTHER },
                    { name: 'No mutation', color: '#c4e5f5' } // Light blue like PlotsTab
                );
            }

            // Add CNA type legends if CNAs are enabled
            if (this.config.annotatedCnaCache) {
                legend.push(
                    { name: 'Amplification', color: CNA_COLOR_AMP }, // Red
                    { name: 'Gain', color: '#ff8c9f' }, // Pink
                    { name: 'Diploid', color: DEFAULT_GREY }, // Grey
                    { name: 'Shallow Deletion', color: '#2aced4' }, // Light blue
                    { name: 'Deep Deletion', color: CNA_COLOR_HOMDEL } // Blue
                );
            }

            // Add structural variant legend if SVs are enabled
            if (this.config.annotatedSvCache) {
                legend.push({
                    name: 'Structural Variant',
                    color: STRUCTURAL_VARIANT_COLOR,
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
