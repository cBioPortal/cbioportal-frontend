import React, { useState } from 'react';
import CreatableSelect from 'react-select';
import { Mutation, DiscreteCopyNumberData } from 'cbioportal-ts-api-client';
import { VariantAnnotation, MyVariantInfo } from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import { flattenArray } from '../therapyRecommendation/TherapyRecommendationTableUtils';

export interface Dict<T> {
    [key: string]: T;
}

export interface City {
    city: string;
    city_ascii?: string;
    lat: number;
    lng: number;
    country: string;
    iso2?: string;
    iso3?: string;
    admin_name: string;
    capital?: string;
    population?: number;
    id?: number;
}

interface Option {
    label: string;
    value: string;
}

interface MutationSelectProps {
    data: string[];
    mutations: Mutation[];
    cna: DiscreteCopyNumberData[];
    onChange: (selectedOption: Array<any>) => void;
    isMulti?: boolean;
    name?: string;
    className?: string;
    classNamePrefix?: string;
    placeholder?: string;
}

export const ClinicalTrialMatchMutationSelect = (
    props: MutationSelectProps
) => {
    let alterationOptions: Array<object> = [];
    props.mutations.forEach((alteration: Mutation) => {
        alterationOptions.push({
            value: alteration.gene.hugoGeneSymbol,
            label: alteration.gene.hugoGeneSymbol,
        });
        alterationOptions.push({
            value:
                alteration.gene.hugoGeneSymbol + ' ' + alteration.proteinChange,
            label:
                alteration.gene.hugoGeneSymbol + ' ' + alteration.proteinChange,
        });
    });

    props.cna.forEach((alteration: DiscreteCopyNumberData) => {
        alterationOptions.push({
            value: alteration.gene.hugoGeneSymbol,
            label: alteration.gene.hugoGeneSymbol,
        });
        alterationOptions.push({
            value:
                alteration.gene.hugoGeneSymbol +
                ' ' +
                (alteration.alteration === -2 ? 'Deletion' : 'Amplification'),
            label:
                alteration.gene.hugoGeneSymbol +
                ' ' +
                (alteration.alteration === -2 ? 'Deletion' : 'Amplification'),
        });
    });

    alterationOptions.sort();

    const mutationDefault = props.data.map((mutation: string) => ({
        value: mutation,
        label: mutation,
    }));

    const [value, setValue] = useState<Option[]>();
    const [inputValue, setInputValue] = useState<string>();
    const [options, setOptions] = useState<Option[]>([]);

    const onChange = (selectedOption: Option[]) => {
        setValue(selectedOption);
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
        if (inputValue !== '' && inputValue !== undefined) {
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
                height={'100%'}
                name={props.name}
                className={props.className}
                classNamePrefix={props.classNamePrefix}
                defaultInputValue=""
                defaultValue={mutationDefault}
                allowCreateWhileLoading={true}
                inputValue={inputValue}
                onInputChange={onInputChange}
                autoSize={false}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                value={value}
                options={alterationOptions}
                tabSelectsOption={true}
                placeholder={props.placeholder}
                backspaceRemovesValue={false}
                isMulti
            />
        </>
    );
};

export default ClinicalTrialMatchMutationSelect;
