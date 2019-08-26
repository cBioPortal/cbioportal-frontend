/**
 * Copyright (c) 2017 The Hyve B.V.
 * This code is licensed under the GNU General Public License,
 * version 3, or (at your option) any later version.
 */

import React from 'react';
import PropTypes from 'prop-types'
import Select from "react-select1";
import classNames from 'classnames';
import CheckedOption from './CheckedOption';
import CheckedValue from './CheckedValue';
import OptionTools from './OptionTools';
import stripDiacritics from './stripDiacritics';

import 'react-select1/dist/react-select.css';

class CheckedSelect extends React.Component {

    // constructor
    constructor(props, context) {
        super(props, context);

        this.handleFilterOptions = this.handleFilterOptions.bind(this);
        this.handleAddAll = this.handleAddAll.bind(this);
        this.handleClearAll = this.handleClearAll.bind(this);
        this.handleSearchInputChange = this.handleSearchInputChange.bind(this);
        this.renderValueContext = this.renderValueContext.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.toggleSelection = this.toggleSelection.bind(this);

        this.state = { shouldShowPlaceholder: true };
    }

    /**
     * Custom filter options when user type filter in input value
     * @param options
     * @param filterValue
     * @param currentValue
     * @returns {*}
     */
    handleFilterOptions (options, filterValue, currentValue) {

        if (this.props.value.length) {
            currentValue = this.props.value;
        }

        if (this.props.ignoreAccents) {
            filterValue = stripDiacritics(filterValue);
        }

        if (this.props.ignoreCase) {
            filterValue = filterValue.toLowerCase();
        }

        if (currentValue) currentValue = currentValue.map(i => i[this.props.valueKey]);
        this._visibleOptions = options.filter(option => {

            if (!filterValue) return true;
            let valueTest = String(option[this.props.valueKey]);
            let labelTest = String(option[this.props.labelKey]);
            if (this.props.ignoreAccents) {
                if (this.props.matchProp !== 'label') valueTest = stripDiacritics(valueTest);
                if (this.props.matchProp !== 'value') labelTest = stripDiacritics(labelTest);
            }
            if (this.props.ignoreCase) {
                if (this.props.matchProp !== 'label') valueTest = valueTest.toLowerCase();
                if (this.props.matchProp !== 'value') labelTest = labelTest.toLowerCase();
            }
            return this.props.matchPos === 'start' ? (
                (this.props.matchProp !== 'label' && valueTest.substr(0, filterValue.length) === filterValue) ||
                (this.props.matchProp !== 'value' && labelTest.substr(0, filterValue.length) === filterValue)
            ) : (
                (this.props.matchProp !== 'label' && valueTest.indexOf(filterValue) >= 0) ||
                (this.props.matchProp !== 'value' && labelTest.indexOf(filterValue) >= 0)
            );
        });

        this._visibleOptionValues = this._visibleOptions.reduce((map, option)=>{
            map[option[this.props.valueKey]] = true;
            return map;
        }, {});

        return this._visibleOptions;
    }

    addVisibleOptions() {
        const values = this.props.value;
        const valueStrings = values.reduce((map, valueObject)=>{
            map[valueObject[this.props.valueKey]] = true;
            return map;
        }, {});

        // Add currently visible, enabled options to
        // the already-selected ones
        const optionsToAdd = this._visibleOptions
                .filter(optionObject => (
                    !optionObject.disabled
                    && !valueStrings[optionObject[this.props.valueKey]]));
        return values.concat(optionsToAdd)
    }

    clearVisibleOptions() {
        const visibleOptionValues = this._visibleOptionValues;
        const values = this.props.value;
        // remove all visible values, keeping only invisible ones
        return values.filter(valueObject => !visibleOptionValues[valueObject[this.props.valueKey]]);
    }

    setValue (value) {
        if (this.props.simpleValue && value) {
            value = this.props.multi ?
                value.map(i => i[this.props.valueKey]).join(this.props.delimiter) : value[this.props.valueKey];
        }
        this.props.onChange(value);
    }

    /**
     * Add all enabled visible options to the selection
     */
    handleAddAll() {
        const newValue = this.addVisibleOptions();
        this.setValue(newValue);
    }

    /**
     * Clear all visible options from the selection
     */
    handleClearAll() {
        const newValue = this.clearVisibleOptions();
        this.setValue(newValue);
    }

    /**
     * Update state to typing in the search box, leaving the input untouched
     */
    handleSearchInputChange(inputString) {
        this.setState({ shouldShowPlaceholder: inputString === '' });
        return inputString;
    }

    /**
    * valueRenderer callback that gathers context to render the value component
    */
    renderValueContext(__, valueIndex) {
        return {
            valueIndex,
            shouldShowPlaceholder: this.state.shouldShowPlaceholder,
            placeholder: this.props.placeholder
        };
    }

    renderOptions({
                      focusedOption,
                      onFocus,
                      onSelect,
                      optionClassName,
                      optionComponent,
                      options,
                      valueArray,
                      valueKey
                  }) {
        const Option = optionComponent;
        return options.map((option, i) => {
            const isSelected = this.props.value.some(selectedOption => selectedOption[valueKey] === option[valueKey]);
            const isFocused = focusedOption && option[valueKey] === focusedOption[valueKey];
            const optionClass = classNames(optionClassName, {
                'Select-option': true,
                'is-selected': isSelected,
                'is-focused': isFocused,
                'is-disabled': option.disabled,
            });

            return (
                <div key={`option-${i}-${option[valueKey]}`}>
                    <Option
                        className={optionClass}
                        option={option}
                        onFocus={onFocus}
                        onSelect={onSelect}
                        isSelected={isSelected}
                    />
                </div>
            );
        });
    };

    renderMenu (params) {

        const props = this.props;
        const filteredOptions = params.options ? params.options.filter(option => !option.disabled).length : 0;
        const optsContainerStyle = {
            maxHeight: '150px',
            overflow: 'scroll'
        };
        const optionItems = this.renderOptions(params);

        return (
            <div>
                <OptionTools
                    onAddAll={this.handleAddAll}
                    onClearAll={this.handleClearAll}
                    addAllTitle={props.addAllTitle}
                    clearAllTitle={props.clearAllTitle}
                    filteredOptions={filteredOptions}
                />
                <div style={optsContainerStyle}>
                    {optionItems}
                </div>
            </div>
        );
    }

    /**
     * Select option when it is not selected and the other way around.
     * @param selectedValue
     */
    toggleSelection (selectedValue) {
        const latestSelected = selectedValue[selectedValue.length - 1];

        const toggleItem = latestSelected && this.props.value.find(val => {
            return val.value === latestSelected.value;
        });
        if (toggleItem) {
            selectedValue = this.props.value.filter(val => {
                return val.value !== toggleItem.value;
            });
        }
        this._visibleOptions.forEach( option => {
            option.isSelected = selectedValue.value === option.value;
        });
        this.setValue(selectedValue);
    }

    getSelectComponent() {
        return (
                <Select
                    options={this.props.options}
                    value={this.props.value}
                    onChange={this.toggleSelection}
                    closeOnSelect={false}
                    onSelectResetsInput={false}
                    disabled={this.props.disabled}
                    multi
                    menuRenderer={this.renderMenu}
                    backspaceRemoves={false}
                    clearable={false}
                    optionComponent={CheckedOption}
                    valueComponent={CheckedValue}
                    valueRenderer={this.renderValueContext}
                    onInputChange={this.handleSearchInputChange}
                    filterOptions={this.handleFilterOptions}
                    placeholder={this.props.placeholder}
                    noResultsText={this.props.noResultsText}
                />
        );
    }

    getSelectAsyncComponent() {
        return (
                <Select.Async
                    loadOptions={this.props.loadOptions}
                    cache={this.props.cache}
                    value={this.props.value}
                    onChange={this.props.onChange}
                    closeOnSelect={false}
                    onSelectResetsInput={false}
                    disabled={this.props.disabled}
                    multi
                    menuRenderer={this.renderMenu}
                    backspaceRemoves={false}
                    clearable={false}
                    optionComponent={CheckedOption}
                    valueComponent={CheckedValue}
                    valueRenderer={this.renderValueContext}
                    onInputChange={this.handleSearchInputChange}
                    filterOptions={this.handleFilterOptions}
                    placeholder={this.props.placeholder}
                    noResultsText={this.props.noResultsText}
                />
        );
    }

    render() {
        return this.props.async ?  this.getSelectAsyncComponent() : this.getSelectComponent();
    }
}

CheckedSelect.propTypes = {
    addAllTitle: PropTypes.string,
    async: PropTypes.bool,
    cache: PropTypes.any,
    clearAllTitle: PropTypes.string,
    disabled: PropTypes.bool,
    ignoreAccents: PropTypes.bool,
    ignoreCase: PropTypes.bool,
    loadOptions: PropTypes.func,
    matchPos: PropTypes.string,
    matchProp: PropTypes.string,
    onChange: PropTypes.func,
    options: PropTypes.array,
    placeholder: PropTypes.string,
    value: PropTypes.any,
    valueKey: PropTypes.string,
};

CheckedSelect.defaultProps = {
    addAllTitle: 'Add all',
    async: false,
    cache: {},
    clearAllTitle: 'Clear',
    disabled: false,
    ignoreAccents: true,
    ignoreCase: true,
    label: '',
    matchPos: 'any',
    matchProp: 'any',
    options: [],
    placeholder: 'Please select ..',
    valueKey: 'value',
};

export default CheckedSelect;
