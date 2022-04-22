import { getServerConfig } from 'config/config';

const NA_VALUES_DELIMITER = '|';

export function getComparisonCategoricalNaValue(): string[] {
    const rawString = getServerConfig().comparison_categorical_na_values;
    const naValues = rawString.split(NA_VALUES_DELIMITER);
    return naValues;
}
