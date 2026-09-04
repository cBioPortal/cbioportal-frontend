import * as React from 'react';
import Select from 'react-select';

type TooltipFieldOption = { value: string; label: string };
type TooltipFieldGroup = { label: string; options: TooltipFieldOption[] };

export interface TooltipDropDownProps {
    // current selection of tooltip fields
    selectedFields: Set<string>;

    // event handler for when the selection changes
    onSelectionChange: (selectedFields: Set<string>) => void;

    // fields the user can add to the tooltip, optionally grouped
    // (e.g. Genes / Map Attributes / Clinical Attributes)
    options: (TooltipFieldOption | TooltipFieldGroup)[];
}

export class TooltipDropdown extends React.Component<TooltipDropDownProps> {
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
                <Select
                    inputId="tooltip-fields-select"
                    aria-label="Tooltip fields"
                    name="tooltip-fields-select"
                    isMulti
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    options={this.props.options}
                    value={selectedOptions}
                    onChange={this.handleSelectionChange}
                    styles={{
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
                    }}
                />
            </div>
        );
    }
}

export default TooltipDropdown;
