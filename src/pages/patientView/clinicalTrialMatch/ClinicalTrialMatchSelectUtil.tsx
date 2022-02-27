import React, { useState } from 'react';
import { CreatableSelect, Select } from 'react-select';
import styles from './style/clinicalTrialMatch.module.scss';
import { components } from 'react-select';
import {
    DefaultTooltip,
    placeArrowBottomLeft,
} from 'cbioportal-frontend-commons';

export interface Dict<T> {
    [key: string]: T;
}

interface Option {
    label: string;
    value: string;
}

interface MutationSelectProps {
    data: string[];
    options: Option[];
    onChange: (selectedOption: Array<any>) => void;
    isMulti?: boolean;
    name?: string;
    className?: string;
    classNamePrefix?: string;
    placeholder?: string;
}

interface CountrySelectProps {
    data: string[];
    options: Option[];
    countryGroups: Dict<string[]>;
    onChange: (mutations: string[]) => void;
    isMulti?: boolean;
    name?: string;
    className?: string;
    classNamePrefix?: string;
    placeholder?: string;
}

export const ClinicalTrialMatchCountrySelect = (props: CountrySelectProps) => {
    const countryDefault = props.data.map((country: string) => ({
        value: country,
        label: country,
    }));

    const [value, setValue] = useState<Option[]>();
    const [inputValue, setInputValue] = useState<string>();
    const [options, setOptions] = useState<Option[]>([]);

    const onChange = (selectedOption: any) => {
        var selectedOptionsMapped = selectedOption.reduce(
            (list: any, option: Option) => {
                if (option.value in props.countryGroups) {
                    return list.concat(
                        props.countryGroups[option.value].map(country => {
                            return { value: country, label: country };
                        })
                    );
                } else {
                    return list.concat(option);
                }
            },
            []
        );
        setValue(selectedOptionsMapped as Option[]);

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

export const ClinicalTrialMatchMutationSelect = (
    props: MutationSelectProps
) => {
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
                name={props.name}
                className={props.className}
                classNamePrefix={props.classNamePrefix}
                defaultInputValue=""
                defaultValue={mutationDefault}
                allowCreateWhileLoading={true}
                inputValue={inputValue}
                onInputChange={onInputChange}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
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

export const recruitingOption = (props: any) => {
    return (
        <div>
            <components.Option {...props}>
                <span style={{ marginRight: 5 }}>{props.label}</span>
                <DefaultTooltip
                    placement="bottomLeft"
                    trigger={['hover', 'focus']}
                    overlay={getTooltipRecruitingContent(props.label)}
                    destroyTooltipOnHide={false}
                    onPopupAlign={placeArrowBottomLeft}
                >
                    <i className={'fa fa-info-circle ' + styles.icon}></i>
                </DefaultTooltip>
            </components.Option>
        </div>
    );
};

export const getTooltipRecruitingContent = (recruitingStatus: string) => {
    const statusMap: { [status: string]: JSX.Element } = {
        'Not yet recruiting': (
            <span>The study has not started recruiting participants.</span>
        ),
        Recruiting: (
            <span>The study is currently recruiting participants.</span>
        ),
        'Enrolling by invitation': (
            <span>
                The study is selecting its participants from a population, or
                group of people, decided on by the researchers in advance. These
                studies are not open to everyone who meets the eligibility
                criteria but only to people in that particular population, who
                are specifically invited to participate.
            </span>
        ),
        'Active, not recruiting': (
            <span>
                The study is ongoing, and participants are receiving an
                intervention or being examined, but potential participants are
                not currently being recruited or enrolled.
            </span>
        ),
        Suspended: (
            <span>The study has stopped early but may start again.</span>
        ),
        Terminated: (
            <span>
                The study has stopped early and will not start again.
                Participants are no longer being examined or treated.
            </span>
        ),
        Completed: (
            <span>
                The study has ended normally, and participants are no longer
                being examined or treated (that is, the last participant's last
                visit has occurred).
            </span>
        ),
        Withdrawn: (
            <span>
                The study stopped early, before enrolling its first participant.
            </span>
        ),
        'Unknown status': (
            <span>
                A study on ClinicalTrials.gov whose last known status was
                recruiting; not yet recruiting; or active, not recruiting but
                that has passed its completion date, and the status has not been
                last verified within the past 2 years.
            </span>
        ),
    };
    return (
        <div className={styles.tooltip} style={{ width: '300px' }}>
            {statusMap[recruitingStatus]}
        </div>
    );
};
