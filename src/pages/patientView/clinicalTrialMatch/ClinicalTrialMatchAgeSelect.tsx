import React, { Component, KeyboardEventHandler } from 'react';
import CreatableSelect from 'react-select/creatable';
import { ActionMeta, OnChangeValue } from 'react-select';

const components = {
    DropdownIndicator: null,
};

interface Option {
    readonly label: string;
    readonly value: string;
}

const createOption = (label: string) => ({
    label: label,
    value: label,
});

interface State {
    readonly inputValue: string;
    readonly value: readonly Option[];
}

interface AgeSelectProps {
    data: number;
    onChange: (age: string) => void;
    isMulti?: boolean;
    name?: string;
    className?: string;
    classNamePrefix?: string;
    placeholder?: string;
}

export default class CreatableInputOnly extends Component<
    AgeSelectProps,
    State
> {
    constructor(props: AgeSelectProps) {
        super(props);
        var defVal =
            props.data !== 0
                ? [
                      {
                          value: props.data.toString(),
                          label: props.data.toString(),
                      },
                  ]
                : [];
        this.state = {
            inputValue: '',
            value: defVal,
        };
    }
    handleChange = (value: any, actionMeta: any) => {
        this.setState({ value });
    };
    handleInputChange = (inputValue: string) => {
        this.setState({ inputValue });
    };
    handleKeyDown: KeyboardEventHandler<HTMLDivElement> = event => {
        const { inputValue, value } = this.state;
        if (!inputValue) return;
        switch (event.key) {
            case 'Enter':
            case 'Tab':
                this.props.onChange(inputValue);
                this.setState({
                    inputValue: '',
                    value: [createOption(inputValue)],
                });
                event.preventDefault();
        }
    };

    handleOnBlur = (e: any) => {
        const { inputValue, value } = this.state;
        if (!inputValue) return;
        this.props.onChange(inputValue);
        this.setState({
            inputValue: '',
            value: [createOption(inputValue)],
        });
    };

    render() {
        const { inputValue, value } = this.state;

        return (
            <CreatableSelect
                components={components}
                inputValue={inputValue}
                isClearable
                menuIsOpen={false}
                onBlur={this.handleOnBlur}
                onChange={this.handleChange}
                onInputChange={this.handleInputChange}
                onKeyDown={this.handleKeyDown}
                placeholder={this.props.placeholder}
                classNamePrefix={this.props.classNamePrefix}
                className={this.props.className}
                value={value}
            />
        );
    }
}
