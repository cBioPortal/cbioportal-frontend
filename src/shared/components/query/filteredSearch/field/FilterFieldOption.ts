export type FilterFieldOption = {
    value: string;
    displayValue: string;
};

export function toFilterFieldOption(option: string) {
    return { value: option, displayValue: option };
}

export function toFilterFieldValue(option: FilterFieldOption) {
    return option.value;
}
