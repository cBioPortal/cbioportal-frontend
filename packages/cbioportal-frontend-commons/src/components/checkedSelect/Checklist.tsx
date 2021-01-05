import autobind from 'autobind-decorator';
import * as _ from 'lodash';
import { action, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import {
    CheckBoxType,
    getOptionLabel,
    getSelectedValuesMap,
    Option,
} from './CheckedSelectUtils';

type ChecklistProps = {
    onChange: (values: { value: string }[]) => void;
    value: { value: string }[];
    options: Option[];
    getOptionLabel?: (
        option: Option,
        selectedValues: { [optionValue: string]: any },
        checkBoxType?: CheckBoxType
    ) => JSX.Element;
    checkBoxType?: CheckBoxType;
    isDisabled?: boolean;
    unselectOthersWhenAllSelected?: boolean;
    numberOfColumnsPerRow?: number;
};

function generateTableRows(
    selectComponents: JSX.Element[],
    numberOfColumnsPerRow: number = 1
) {
    return _.chunk(selectComponents, numberOfColumnsPerRow).map(components => (
        <tr>{components}</tr>
    ));
}

@observer
export default class Checklist extends React.Component<ChecklistProps, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps: Partial<ChecklistProps> = {
        isDisabled: false,
        numberOfColumnsPerRow: 1,
        checkBoxType: CheckBoxType.HTML,
    };

    @computed
    get selectedValues() {
        return getSelectedValuesMap(this.props.value);
    }

    public render() {
        return (
            <table>
                {generateTableRows(
                    this.props.options.map(this.optionSelectComponent),
                    this.props.numberOfColumnsPerRow
                )}
            </table>
        );
    }

    @autobind
    private getOptionLabel(option: Option): JSX.Element {
        return this.props.getOptionLabel
            ? this.props.getOptionLabel(
                  option,
                  this.selectedValues,
                  this.props.checkBoxType
              )
            : getOptionLabel(
                  option,
                  this.selectedValues,
                  this.props.checkBoxType
              );
    }

    @autobind
    protected optionSelectComponent(option: Option) {
        const onClick = () => this.handleSelect(option.value);

        return (
            <td
                onClick={onClick}
                style={{
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    paddingRight: 8,
                }}
            >
                {this.getOptionLabel(option)}
            </td>
        );
    }

    @action.bound
    protected handleSelect(value: string) {
        // do nothing if disabled
        if (this.props.isDisabled) {
            return;
        }

        // only select current value if all selected already
        if (
            this.props.unselectOthersWhenAllSelected &&
            this.props.value.length === this.props.options.length
        ) {
            this.props.onChange([{ value }]);
        }
        // unselect if selected
        else if (this.selectedValues[value]) {
            this.props.onChange(
                this.props.value.filter(v => v.value !== value)
            );
        }
        // select if not selected
        else {
            this.props.onChange([{ value }].concat(this.props.value));
        }
    }
}
