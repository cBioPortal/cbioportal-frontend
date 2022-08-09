import React, { FC } from 'react';

import CreatableSelect, { components } from 'react-select';
import MultiValueGenericProps from 'react-select/base/dist/react-select.cjs';
import Options from 'react-select/base/dist/react-select.cjs';

import {
    SortEnd,
    SortableContainer,
    SortableElement,
    SortableHandle,
} from 'react-sortable-hoc';

interface OptionTypeBase {
    [key: string]: any;
}
const SortableSelect = SortableContainer(CreatableSelect);

/* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
const SortableMultiValue = SortableElement((props: any) => {
    // this prevents the menu from being opened/closed when the user clicks
    // on a value to begin dragging it. ideally, detecting a click (instead of
    // a drag) would still focus the control and toggle the menu, but that
    // requires some magic with refs that are out of scope for this example
    const onMouseDown = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const innerProps = { ...props.innerProps, onMouseDown };
    return <components.MultiValue {...props} innerProps={innerProps} />;
});

const SortableMultiValueLabel = SortableHandle<
    MultiValueGenericProps<OptionTypeBase>
>((props: MultiValueGenericProps<OptionTypeBase>) => (
    <components.MultiValueLabel {...props} />
));

export type SortableMultiSelectProps = {
    isMulti: boolean;
    label: string;
    id: string;
    options: OptionTypeBase[];
    value: OptionTypeBase[];
    onSortEnd: ({ oldIndex, newIndex }: SortEnd) => void;
    onChange: (
        selectedOptions: OptionTypeBase | Options<OptionTypeBase>
    ) => void;
};

const SortableMultiSelect: FC<SortableMultiSelectProps> = ({
    isMulti,
    label,
    id,
    options,
    value,
    onSortEnd,
    onChange,
}) => (
    <div>
        <div>
            <label htmlFor={id} id={'labelId'}>
                {label}
            </label>
            <SortableSelect
                // @ts-ignore
                isMulti={isMulti}
                useDragHandle
                axis="xy"
                onSortEnd={onSortEnd}
                getHelperDimensions={({ node }) => node.getBoundingClientRect()}
                distance={4}
                defaultValue={value}
                closeMenuOnSelect={false}
                isSearchable={false}
                name={id}
                options={options}
                inputId={id}
                onChange={(selectedOptions: OptionTypeBase) =>
                    selectedOptions &&
                    onChange &&
                    onChange(selectedOptions as OptionTypeBase)
                }
                helperClass="sortableHelper"
                aria-label={label}
                aria-labelledby={'labelId'}
                classNamePrefix="react-select-dropdown"
                className="react-select-dropdown shadow"
                components={{
                    MultiValue: SortableMultiValue,
                    MultiValueLabel: SortableMultiValueLabel,
                }}
            />
        </div>
    </div>
);

export default SortableMultiSelect;
