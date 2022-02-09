import React, { useState } from 'react';
import {
    ITherapyRecommendation,
    ITreatment,
} from 'shared/model/TherapyRecommendation';
import CreatableSelect from 'react-select/creatable';
import _ from 'lodash';
interface Option {
    label: string;
    value: string;
}

interface CustomSelectProps {
    data: ITherapyRecommendation;
    onChange: (comments: string[]) => void;
}

export const TherapyRecommendationFormCommentInput = (
    props: CustomSelectProps
) => {
    let comments = props.data.comment;
    const commentDefault = comments.map((comment: string) => ({
        value: comment,
        label: comment,
    }));

    const [value, setValue] = useState<Option[]>();
    const [inputValue, setInputValue] = useState<string>();
    const [options, setOptions] = useState<Option[]>([]);

    const onChange = (selectedOption: any) => {
        setValue(selectedOption as Option[]);
        setInputValue('');
        if (Array.isArray(selectedOption)) {
            props.onChange(
                selectedOption.map((option: Option) => {
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

    const onBlur = (event: any) => {
        if (inputValue !== '') {
            const newValue = { label: inputValue, value: inputValue } as Option;
            const opts = [...(value || []), newValue];
            props.onChange(
                opts.map((option: Option) => {
                    return option.value;
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
                const newValue = {
                    label: inputValue,
                    value: inputValue,
                } as Option;
                const opts = [...(value || []), newValue];
                props.onChange(
                    opts.map((option: Option) => {
                        return option.value;
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
                name="commentSelect"
                className="creatable-multi-select"
                classNamePrefix="select"
                defaultInputValue=""
                defaultValue={commentDefault}
                allowCreateWhileLoading={true}
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

export default TherapyRecommendationFormCommentInput;
