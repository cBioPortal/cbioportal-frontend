import React, { useState } from 'react';
import Select from 'react-select';
import styles from './style/clinicalTrialMatch.module.scss';
import { Dict } from './ClinicalTrialMatchSelectUtil';

interface Option {
    label: string;
    value: string;
}

interface CountrySelectProps {
    data: string[];
    options: Array<any>;
    countryGroups: Dict<string[]>;
    onChange: (mutations: string[]) => void;
    isMulti?: boolean;
    name?: string;
    className?: string;
    classNamePrefix?: string;
    placeholder?: string;
}

const ClinicalTrialMatchCountrySelect = (props: CountrySelectProps) => {
    const countryDefault = props.data.map((country: string) => ({
        value: country,
        label: country,
    }));

    const [value, setValue] = useState<Option[]>();
    const [inputValue, setInputValue] = useState<string>();
    const [options, setOptions] = useState<Option[]>([]);

    const onChange = (selectedOption: any) => {
        var selectedOptionsMapped = selectedOption
            .reduce((list: any, option: Option) => {
                if (option.value in props.countryGroups) {
                    return list.concat(
                        props.countryGroups[option.value].map(
                            (country: string) => {
                                return { label: country, value: country };
                            }
                        )
                    );
                } else {
                    return list.concat(option);
                }
            }, [])
            .reduce((unique: any, o: any) => {
                if (
                    !unique.some(
                        (obj: any) =>
                            obj.label === o.label && obj.value === o.value
                    )
                ) {
                    unique.push(o);
                }
                return unique;
            }, []);

        setValue([...new Set(selectedOptionsMapped)] as Option[]);

        setInputValue('');
        if (Array.isArray(selectedOption)) {
            props.onChange(
                selectedOptionsMapped.map((option: Option) => {
                    return option.value;
                })
            );
        } else if (selectedOption === null) {
            props.onChange([]);
        }
    };

    const onInputChange = (textInput: string, { action }: any) => {
        if (action === 'input-change') {
            setInputValue(textInput);
        }
    };

    return (
        <>
            <Select
                name={props.name}
                className={props.className}
                classNamePrefix={props.classNamePrefix}
                defaultInputValue=""
                defaultValue={countryDefault}
                allowCreateWhileLoading={true}
                inputValue={inputValue}
                onInputChange={onInputChange}
                onChange={onChange}
                value={value}
                options={props.options}
                tabSelectsOption={true}
                placeholder={props.placeholder}
                backspaceRemovesValue={false}
                isMulti
            />
        </>
    );
};

export default ClinicalTrialMatchCountrySelect;
