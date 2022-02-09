import React, { useState } from 'react';
import CreatableSelect from 'react-select';
import { OptionsType, ValueType } from 'react-select';

import { Drugs } from './data/Drugs';
import {
    ITherapyRecommendation,
    ITreatment,
} from 'shared/model/TherapyRecommendation';

interface Option {
    label: string;
    value: ITreatment;
}

interface CustomSelectProps {
    data: ITherapyRecommendation;
    onChange: (drugs: ITreatment[]) => void;
}

export const TherapyRecommendationFormDrugInput = (
    props: CustomSelectProps
) => {
    let allDrugs = Drugs;

    let drugOptions = allDrugs.map((drug: ITreatment) => ({
        value: drug,
        label: drug.name,
    }));

    const drugDefault = props.data.treatments.map((drug: ITreatment) => ({
        value: drug,
        label: drug.name,
    }));

    const [value, setValue] = useState<Option[]>();
    const [inputValue, setInputValue] = useState<string>();
    const [options, setOptions] = useState<Option[]>(drugOptions as Option[]);

    const onChange = (selectedOption: any) => {
        setValue(selectedOption as Option[]);
        setInputValue('');
        if (Array.isArray(selectedOption)) {
            props.onChange(
                selectedOption.map((option: Option) => {
                    return option.value as ITreatment;
                })
            );
        } else if (selectedOption === null) {
            props.onChange([] as ITreatment[]);
        }
    };

    const onInputChange = (textInput: string, { action }: any) => {
        if (action === 'input-change') {
            setInputValue(textInput);
        }
    };

    const onBlur = (event: any) => {
        if (inputValue !== '') {
            const val = { name: inputValue, ncit_code: '' } as ITreatment;
            const newValue = { label: inputValue, value: val } as Option;
            const opts = [...(value || []), newValue];
            props.onChange(
                opts.map((option: Option) => {
                    return option.value as ITreatment;
                })
            );
            setValue([...(value || []), newValue] as Option[]);
            setInputValue('');
        }
    };

    const onKeyDown = (event: any) => {
        if (event.key === 'Backspace' && value !== undefined) {
            if (inputValue === '' && value.length > 0) {
                const remainder = [...(value || [])];
                if (typeof remainder !== 'undefined' && remainder.length > 0) {
                    const temp = remainder.pop() as Option;
                    const remainderValue = temp.label;
                    setValue(remainder);
                    setInputValue(remainderValue);
                }
            }
        }
        if (event.key === 'Enter') {
            if (inputValue !== '') {
                const val = { name: inputValue, ncit_code: '' } as ITreatment;
                const newValue = { label: inputValue, value: val } as Option;
                const opts = [...(value || []), newValue];
                props.onChange(
                    opts.map((option: Option) => {
                        return option.value as ITreatment;
                    })
                );
                setValue([...(value || []), newValue] as Option[]);
                setInputValue('');
            }
        }
    };

    return (
        <>
            <CreatableSelect
                name="commentsSelect"
                className="creatable-multi-select"
                classNamePrefix="select"
                defaultInputValue=""
                defaultValue={drugDefault}
                allowCreateWhileLoading="true"
                inputValue={inputValue}
                onInputChange={onInputChange}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                value={value}
                options={options}
                tabSelectsOption={true}
                backspaceRemovesValue={false}
                isMulti
            />
        </>
    );
};

export default TherapyRecommendationFormDrugInput;
