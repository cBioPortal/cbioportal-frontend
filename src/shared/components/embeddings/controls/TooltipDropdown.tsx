import * as React from 'react';
import AsyncSelect from 'react-select/async';

type TooltipFieldOption = { value: string; label: string };
type TooltipFieldGroup = { label: string; options: TooltipFieldOption[] };
type TooltipFieldItem = TooltipFieldOption | TooltipFieldGroup;

// Keeps the dropdown responsive when Genes holds every gene in the genome, not just a queried panel.
const MAX_OPTIONS_PER_GROUP = 50;

export interface TooltipDropDownProps {
    selectedFields: Set<string>;
    onSelectionChange: (selectedFields: Set<string>) => void;
    options: TooltipFieldItem[];
    // Omits the built-in "Tooltip fields:" label, for callers with their
    // own caption.
    hideLabel?: boolean;
    selectStyles?: { [key: string]: (base: any, state: any) => any };
}

export class TooltipDropdown extends React.Component<TooltipDropDownProps> {
    private getMatchScore(
        option: TooltipFieldOption,
        searchTerm: string
    ): number {
        const label = option.label.toLowerCase();
        const search = searchTerm.toLowerCase();
        if (label === search) return 100;
        if (label.startsWith(search)) return 80;
        if (label.includes(search)) return 60;
        return 0;
    }

    private loadOptions = async (
        inputValue: string
    ): Promise<TooltipFieldItem[]> => {
        if (!inputValue) {
            return this.props.options.map(item =>
                'options' in item
                    ? {
                          ...item,
                          options: item.options.slice(0, MAX_OPTIONS_PER_GROUP),
                      }
                    : item
            );
        }

        const filteredGroups: TooltipFieldItem[] = [];
        for (const item of this.props.options) {
            if ('options' in item) {
                const scored = item.options
                    .map(option => ({
                        option,
                        score: this.getMatchScore(option, inputValue),
                    }))
                    .filter(scored => scored.score > 0)
                    .sort((a, b) => b.score - a.score)
                    .map(scored => scored.option);
                if (scored.length > 0) {
                    filteredGroups.push({
                        ...item,
                        options: scored.slice(0, MAX_OPTIONS_PER_GROUP),
                    });
                }
            } else if (this.getMatchScore(item, inputValue) > 0) {
                filteredGroups.push(item);
            }
        }
        return filteredGroups;
    };

    private handleSelectionChange = (selected: TooltipFieldOption[] | null) => {
        const newSelectedFields = new Set(
            (selected || []).map(option => option.value)
        );
        this.props.onSelectionChange(newSelectedFields);
    };

    render() {
        const flatOptions = this.props.options.reduce<TooltipFieldOption[]>(
            (acc, opt) => acc.concat('options' in opt ? opt.options : opt),
            []
        );
        const selectedOptions = flatOptions.filter(opt =>
            this.props.selectedFields.has(opt.value)
        );

        return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {!this.props.hideLabel && (
                    <label
                        htmlFor="tooltip-fields-select"
                        style={{
                            marginRight: '8px',
                            whiteSpace: 'nowrap',
                            fontSize: '14px',
                        }}
                    >
                        Tooltip fields:
                    </label>
                )}
                <AsyncSelect
                    inputId="tooltip-fields-select"
                    aria-label="Tooltip fields"
                    name="tooltip-fields-select"
                    isMulti
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    loadOptions={this.loadOptions}
                    defaultOptions={true}
                    cacheOptions={true}
                    loadingMessage={() => 'Searching...'}
                    value={selectedOptions}
                    onChange={this.handleSelectionChange}
                    styles={
                        this.props.selectStyles || {
                            container: (base: any) => ({
                                ...base,
                                width: '300px',
                            }),
                            control: (base: any) => ({
                                ...base,
                                fontSize: '14px',
                                minHeight: '34px',
                            }),
                            menu: (base: any) => ({
                                ...base,
                                zIndex: 9999,
                            }),
                        }
                    }
                />
            </div>
        );
    }
}

export default TooltipDropdown;
