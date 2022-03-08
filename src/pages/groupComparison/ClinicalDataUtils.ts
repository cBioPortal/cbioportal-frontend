import { getServerConfig } from 'config/config';

export function getComparisonCategoricalNaValue(): string[] {
    const rawString = getServerConfig().comparison_categorical_na_value;
    const naValues = rawString.split(',');
    return naValues;
}
