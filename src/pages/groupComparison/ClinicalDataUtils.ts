import { getServerConfig } from 'config/config';

export function getComparisonCategoricalNaValue(): string[] {
    const rawString = getServerConfig().comparison_categorical_na_values;
    const naValues = rawString.split(',');
    return naValues;
}
