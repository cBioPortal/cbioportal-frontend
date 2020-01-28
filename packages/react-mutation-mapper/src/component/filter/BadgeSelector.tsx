import autobind from 'autobind-decorator';
import {
    CheckBoxType,
    Checklist,
    getSelectedValuesMap,
    Option,
} from 'cbioportal-frontend-commons';
import _ from 'lodash';
import { action, computed } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { CSSProperties } from 'react';

import { DataFilter } from '../../model/DataFilter';
import {
    getAllOptionValues,
    getSelectedOptionValues,
    handleOptionSelect,
} from '../../util/SelectorUtils';
import { BadgeLabel, DEFAULT_BADGE_STYLE } from './BadgeLabel';

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
    alignColumns?: boolean;
    uniformBadgeWidth?: boolean;
    alignmentPaddingWithinBadge?: boolean;
    onSelect?: (
        selectedOptionIds: string[],
        allValuesSelected?: boolean
    ) => void;
    selectedValues?: { value: string }[];
    getOptionLabel?: (
        option: Option,
        selectedValues: { [optionValue: string]: any },
        checkBoxType?: CheckBoxType
    ) => JSX.Element;
    getBadgeLabel?: (
        option: BadgeSelectorOption,
        selectedValues: { [optionValue: string]: any },
        badgeClassName?: string,
        badgeAlignmentStyle?: CSSProperties
    ) => JSX.Element;
    filter?: DataFilter<string>;
    options?: BadgeSelectorOption[];
    badgeClassName?: string;
    badgeContentPadding?: number;
    badgeCharWidth?: number;
};

export const DEFAULT_BADGE_CHAR_WIDTH = 10;
export const DEFAULT_BADGE_CONTENT_PADDING = 7;

export function getBadgeStyleOverride(
    option: BadgeSelectorOption,
    selectedValues: { [optionValue: string]: any },
    badgeAlignmentStyle?: CSSProperties
) {
    let override: CSSProperties = {
        ...badgeAlignmentStyle,
        ...option.badgeStyleOverride,
    };

    const defaultStyle = {
        ...DEFAULT_BADGE_STYLE,
        ...override,
    };

    const isSelected = option.value in selectedValues;

    if (!isSelected) {
        // by default swap background color and text color for unselected options
        override = option.badgeStyleSelectedOverride
            ? {
                  ...badgeAlignmentStyle,
                  ...option.badgeStyleSelectedOverride,
              }
            : {
                  ...defaultStyle,
                  color: defaultStyle.backgroundColor,
                  backgroundColor: defaultStyle.color,
                  borderColor: defaultStyle.backgroundColor,
              };
    }

    return override;
}

export function calculateBadgeAlignmentStyle(
    maxLengthInCol: number,
    optionLength: number,
    badgeCharWidth: number = DEFAULT_BADGE_CHAR_WIDTH,
    badgeContentPadding: number = DEFAULT_BADGE_CONTENT_PADDING,
    padWithinBadge: boolean = false
): CSSProperties {
    // this is an approximation with the assumption that each character has more or less equal width
    const totalWidth =
        maxLengthInCol * badgeCharWidth + badgeContentPadding * 2;

    if (padWithinBadge) {
        // no additional left or right margin, since all the padding is applied within the badge width
        return {
            width: totalWidth,
        };
    } else {
        // need additional left and right margins to adjust the alignment
        const width = optionLength * badgeCharWidth + badgeContentPadding * 2;
        const margin = (totalWidth - width) / 2;
        return {
            width,
            marginLeft: margin,
            marginRight: margin,
        };
    }
}

export function getOptionContentLengths(
    options: BadgeSelectorOption[]
): number[] {
    // string length of each badge content of an option
    return options
        .map((option: BadgeSelectorOption) => option.badgeContent)
        .filter(content => content !== undefined)
        .map(content => content!.toString().length);
}

export function calculateBadgeAlignmentStyles(
    options: BadgeSelectorOption[],
    numberOfColumnsPerRow: number = 1,
    uniformBadgeWidth: boolean = false,
    badgeCharWidth: number = DEFAULT_BADGE_CHAR_WIDTH,
    badgeContentPadding: number = DEFAULT_BADGE_CONTENT_PADDING,
    alignmentPaddingWithinBadge: boolean = false
): CSSProperties[] {
    // regardless of number of columns or alignmentPaddingWithinBadge value
    // set the width of all badges to the width of badge with the longest content
    if (uniformBadgeWidth) {
        const iterationCount = options.length;
        const maxLength = Math.max(...getOptionContentLengths(options));
        const badgeWidth = calculateBadgeAlignmentStyle(
            maxLength,
            maxLength,
            badgeCharWidth,
            badgeContentPadding,
            true
        );

        return _.times(iterationCount, () => badgeWidth);
    } else if (numberOfColumnsPerRow > 0) {
        const groupedByCol = _.groupBy(
            options,
            option => options.indexOf(option) % numberOfColumnsPerRow
        );

        return options.map((option: BadgeSelectorOption, index: number) => {
            // define a max badge length for each column
            const maxLengthInCol = Math.max(
                ...getOptionContentLengths(
                    groupedByCol[index % numberOfColumnsPerRow]
                )
            );
            const length =
                option.badgeContent === undefined
                    ? 0
                    : option.badgeContent.toString().length;

            // align all badges with respect to the max badge length for the corresponding column
            return calculateBadgeAlignmentStyle(
                maxLengthInCol,
                length,
                badgeCharWidth,
                badgeContentPadding,
                alignmentPaddingWithinBadge
            );
        });
    } else {
        return [];
    }
}

@observer
export class BadgeSelector extends React.Component<BadgeSelectorProps, {}> {
    @computed
    public get allValues() {
        return getAllOptionValues(this.props.options);
    }

    @computed
    public get selectedValues() {
        return (
            this.props.selectedValues ||
            getSelectedOptionValues(this.allValues, this.props.filter)
        );
    }

    @computed
    public get selectedValuesMap(): { [optionValue: string]: any } {
        return getSelectedValuesMap(this.selectedValues);
    }

    public getBadgeLabel(
        option: BadgeSelectorOption,
        selectedValues: { [optionValue: string]: any },
        badgeClassName?: string,
        badgeAlignmentStyle?: CSSProperties
    ): JSX.Element {
        return this.props.getBadgeLabel ? (
            this.props.getBadgeLabel(
                option,
                selectedValues,
                badgeClassName,
                badgeAlignmentStyle
            )
        ) : (
            <BadgeLabel
                label={option.label || option.value}
                badgeContent={option.badgeContent}
                badgeStyleOverride={getBadgeStyleOverride(
                    option,
                    selectedValues,
                    badgeAlignmentStyle
                )}
                badgeClassName={this.props.badgeClassName}
            />
        );
    }

    @computed
    public get badgeAlignmentStyles(): CSSProperties[] | undefined {
        return this.props.alignColumns && this.props.options
            ? calculateBadgeAlignmentStyles(
                  this.props.options,
                  this.props.numberOfColumnsPerRow,
                  this.props.uniformBadgeWidth,
                  this.props.badgeCharWidth,
                  this.props.badgeContentPadding,
                  this.props.alignmentPaddingWithinBadge
              )
            : undefined;
    }

    @computed
    public get options(): Option[] {
        return (this.props.options || []).map((option, index) => ({
            label: this.getBadgeLabel(
                option,
                this.selectedValuesMap,
                this.props.badgeClassName,
                this.badgeAlignmentStyles && this.props.numberOfColumnsPerRow
                    ? this.badgeAlignmentStyles[index]
                    : undefined
            ),
            value: option.value,
        }));
    }

    public render() {
        return (
            <Checklist
                onChange={this.onChange}
                options={this.options}
                getOptionLabel={this.props.getOptionLabel}
                value={this.selectedValues}
                isDisabled={this.props.isDisabled}
                numberOfColumnsPerRow={this.props.numberOfColumnsPerRow}
                unselectOthersWhenAllSelected={
                    this.props.unselectOthersWhenAllSelected
                }
            />
        );
    }

    @autobind
    @action
    private onChange(values: Array<{ value: string }>) {
        handleOptionSelect(values, this.allValues, this.props.onSelect);
    }
}

export default BadgeSelector;
