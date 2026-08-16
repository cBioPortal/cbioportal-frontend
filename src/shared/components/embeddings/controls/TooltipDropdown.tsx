import * as React from 'react';
import Select from 'react-select';
import { TOOLTIP_FIELD_OPTIONS } from './TooltipDisplay';

export interface TooltipDropDownProps {
    // current selection of tooltip fields
    selectedFields: Set<string>;

    // event handler for when the selection changes
    onSelectionChange: (selectedFields: Set<string>) => void;
}

export class TooltipDropdown extends React.Component<TooltipDropDownProps> {
    private handleSelectionChange = (
        selected: { value: string; label: string }[] | null
    ) => {
        const newSelectedFields = new Set(
            (selected || []).map(option => option.value)
        );
        this.props.onSelectionChange(newSelectedFields);
    };

    render() {
        const selectedOptions = TOOLTIP_FIELD_OPTIONS.filter(opt =>
            this.props.selectedFields.has(opt.value)
        );

        return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <label
                    style={{
                        marginRight: '8px',
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                    }}
                >
                    Tooltip fields:
                </label>
                <Select
                    name="tooltip-fields-select"
                    isMulti
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    options={TOOLTIP_FIELD_OPTIONS}
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
                        valueContainer: (base: any) => ({
                            ...base,
                            flexWrap: 'nowrap',
                            overflowX: 'auto',
                        }),
                        multiValue: (base: any) => ({
                            ...base,
                            flexShrink: 0,
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
