import {
    ColoringMenuOmnibarOption,
    ColoringType,
    SelectedColoringTypes,
} from '../plots/PlotsTab';
import { ClinicalAttribute, Sample } from 'cbioportal-ts-api-client';
import ClinicalDataCache from '../../cache/ClinicalDataCache';
import { NONE_SELECTED_OPTION_NUMERICAL_VALUE } from '../plots/PlotsTab';

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
            console.log('No selected option or clinical data cache');
            return '#BEBEBE'; // Default gray
        }

        const option = this.config.selectedOption;
        console.log(
            'Getting point color for sample:',
            sample.sampleId,
            'with option:',
            option.info.clinicalAttribute?.clinicalAttributeId
        );

        if (option.info.entrezGeneId === NONE_SELECTED_OPTION_NUMERICAL_VALUE) {
            return '#BEBEBE'; // No coloring
        }

        if (option.info.clinicalAttribute) {
            return this.getClinicalDataColor(
                sample,
                option.info.clinicalAttribute
            );
        }

        // Gene-based coloring would go here
        // For mutations, CNAs, etc.
        return '#BEBEBE';
    }

    private getClinicalDataColor(
        sample: Sample,
        clinicalAttribute: ClinicalAttribute
    ): string {
        if (!this.config.clinicalDataCache) {
            console.log('No clinical data cache available');
            return '#BEBEBE';
        }

        const cacheEntry = this.config.clinicalDataCache.get(clinicalAttribute);

        if (!cacheEntry.isComplete || !cacheEntry.result) {
            console.log(
                'Clinical data not complete or no result for',
                clinicalAttribute.clinicalAttributeId,
                {
                    isComplete: cacheEntry.isComplete,
                    hasResult: !!cacheEntry.result,
                    isPending: cacheEntry.isPending,
                    isError: cacheEntry.isError,
                }
            );
            return '#BEBEBE';
        }

        const data = cacheEntry.result;

        console.log(
            'Clinical data cache result for',
            clinicalAttribute.clinicalAttributeId,
            ':',
            data
        );
        console.log('Cache keys:', Object.keys(data));
        console.log(
            'Data array length:',
            data.data ? data.data.length : 'no data array'
        );
        console.log('categoryToColor available:', !!data.categoryToColor);
        if (data.categoryToColor) {
            console.log(
                'Available categories:',
                Object.keys(data.categoryToColor)
            );
        }
        console.log(
            'Looking for sample:',
            sample.sampleId,
            'in study:',
            sample.studyId
        );
        console.log(
            'Clinical attribute being used:',
            clinicalAttribute.clinicalAttributeId,
            clinicalAttribute.displayName
        );

        if (data.data && data.data.length > 0) {
            console.log(
                'First few clinical data entries:',
                data.data.slice(0, 3)
            );
            const matchingSamples = (data.data as any[]).filter(
                (d: any) => d.studyId === sample.studyId
            );
            console.log(
                'Clinical data entries for this study:',
                matchingSamples.length
            );
            if (matchingSamples.length > 0) {
                console.log(
                    'Sample IDs in clinical data:',
                    matchingSamples.slice(0, 5).map((d: any) => d.sampleId)
                );
            }
        }

        // Find clinical data for this sample
        let clinicalData = null;
        if (data.data && Array.isArray(data.data)) {
            clinicalData = (data.data as any[]).find(
                (d: any) =>
                    d.sampleId === sample.sampleId &&
                    d.studyId === sample.studyId
            );
            console.log('Found clinical data:', clinicalData);
        } else {
            console.log(
                'data.data is not an array:',
                typeof data.data,
                data.data
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

    public getDisplayValue(sample: Sample): string | undefined {
        if (!this.config.selectedOption || !this.config.clinicalDataCache) {
            return undefined;
        }

        const option = this.config.selectedOption;

        if (option.info.clinicalAttribute) {
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

        return undefined;
    }

    public getLegendData(): { name: string; color: string }[] {
        if (!this.config.selectedOption || !this.config.clinicalDataCache) {
            return [];
        }

        const option = this.config.selectedOption;

        if (option.info.clinicalAttribute) {
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

        return [];
    }

    public updateConfig(newConfig: Partial<ColoringServiceConfig>) {
        this.config = { ...this.config, ...newConfig };
    }
}

export default ColoringService;
