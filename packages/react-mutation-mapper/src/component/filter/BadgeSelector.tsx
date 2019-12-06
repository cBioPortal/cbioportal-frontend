import autobind from "autobind-decorator";
import {CheckBoxType, Checklist, getSelectedValuesMap, Option} from "cbioportal-frontend-commons";
import {action, computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import {CSSProperties} from "react";

import {DataFilter} from "../../model/DataFilter";
import {getAllOptionValues, getSelectedOptionValues, handleOptionSelect} from "../../util/SelectorUtils";
import {BadgeLabel, DEFAULT_BADGE_STYLE} from "./BadgeLabel";

export type BadgeSelectorOption = {
    value: string;
    label?: string | JSX.Element;
    badgeContent?: number | string;
    badgeStyleOverride?: CSSProperties;
    badgeStyleSelectedOverride?: CSSProperties;
};

export type BadgeSelectorProps = {
    name?: string;
    placeholder?: string;
    isDisabled?: boolean;
    unselectOthersWhenAllSelected?: boolean;
    numberOfColumnsPerRow?: number;
    onSelect?: (selectedOptionIds: string[], allValuesSelected?: boolean) => void;
    selectedValues?: {value: string}[];
    getOptionLabel?: (option: Option,
                      selectedValues: {[optionValue: string]: any},
                      checkBoxType?: CheckBoxType) => JSX.Element;
    getBadgeLabel?: (option: BadgeSelectorOption,
                     selectedValues: {[optionValue: string]: any},
                     badgeClassName?: string) => JSX.Element;
    filter?: DataFilter<string>;
    options?: BadgeSelectorOption[];
    badgeClassName?: string;
};

export function getBadgeStyleOverride(option: BadgeSelectorOption, selectedValues: {[optionValue: string]: any})
{
    let override = option.badgeStyleOverride;
    const defaultStyle = {...DEFAULT_BADGE_STYLE, ...override};
    const isSelected = option.value in selectedValues;

    if (!isSelected)
    {
        // by default swap background color and text color for unselected options
        override = option.badgeStyleSelectedOverride || {
            color: defaultStyle.backgroundColor,
            backgroundColor: defaultStyle.color,
            borderColor: defaultStyle.backgroundColor
        }
    }

    return override;
}

@observer
export class BadgeSelector extends React.Component<BadgeSelectorProps, {}>
{
    @computed
    public get allValues() {
        return getAllOptionValues(this.props.options);
    }

    @computed
    public get selectedValues() {
        return this.props.selectedValues || getSelectedOptionValues(this.allValues, this.props.filter);
    }

    @computed
    public get selectedValuesMap(): {[optionValue: string]: any} {
        return getSelectedValuesMap(this.selectedValues);
    }

    public getBadgeLabel(option: BadgeSelectorOption,
                         selectedValues: {[optionValue: string]: any},
                         badgeClassName?: string): JSX.Element
    {
        return this.props.getBadgeLabel ?
            this.props.getBadgeLabel(option, selectedValues, badgeClassName): (
                <BadgeLabel
                    label={option.label || option.value}
                    badgeContent={option.badgeContent}
                    badgeStyleOverride={getBadgeStyleOverride(option, selectedValues)}
                    badgeClassName={this.props.badgeClassName}
                />
            );
    }

    @computed
    public get options(): Option[] {
        return (this.props.options || [])
            .map(option => ({
                label: this.getBadgeLabel(option, this.selectedValuesMap, this.props.badgeClassName),
                value: option.value
            }));
    }

    public render()
    {
        return (
            <Checklist
                onChange={this.onChange}
                options={this.options}
                getOptionLabel={this.props.getOptionLabel}
                value={this.selectedValues}
                isDisabled={this.props.isDisabled}
                numberOfColumnsPerRow={this.props.numberOfColumnsPerRow}
                unselectOthersWhenAllSelected={this.props.unselectOthersWhenAllSelected}
            />
        );
    }

    @autobind
    @action
    private onChange(values: Array<{value: string}>)
    {
        handleOptionSelect(values, this.allValues, this.props.onSelect);
    }
}

export default BadgeSelector;
