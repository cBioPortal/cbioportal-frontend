import React from 'react';
import { ITherapyRecommendation, IClinicalTrial } from 'cbioportal-utils';
import AsyncCreatableSelect from 'react-select/async';
import _ from 'lodash';
import request from 'superagent';

interface TherapyRecommendationFormClinicalTrialInputProps {
    data: ITherapyRecommendation;
    onChange: (clinicalTrials: IClinicalTrial[]) => void;
    clinicalTrialClipboard: IClinicalTrial[];
}

type MyOption = { label: string; value: IClinicalTrial };

export default class TherapyRecommendationFormClinicalTrialInput extends React.Component<
    TherapyRecommendationFormClinicalTrialInputProps,
    {}
> {
    public render() {
        const clinicalTrialDefaultValue = this.props.data.clinicalTrials.map(
            (clinicalTrial: IClinicalTrial) => ({
                value: clinicalTrial,
                label: clinicalTrial.id + ': ' + clinicalTrial.name,
            })
        );
        const clinicalTrialDefaultOptions = this.props.clinicalTrialClipboard.map(
            (clinicalTrial: IClinicalTrial) => ({
                value: clinicalTrial,
                label: clinicalTrial.id + ': ' + clinicalTrial.name,
            })
        );
        return (
            <AsyncCreatableSelect
                isMulti
                defaultValue={clinicalTrialDefaultValue}
                cacheOptions
                placeholder="Enter or search trial title..."
                name="clinicalTrialsSelect"
                className="creatable-multi-select"
                classNamePrefix="select"
                onChange={(selectedOption: MyOption[]) => {
                    if (Array.isArray(selectedOption)) {
                        this.props.onChange(
                            selectedOption.map(option => {
                                if (_.isString(option.value)) {
                                    return {
                                        id: '',
                                        name: option.value,
                                    } as IClinicalTrial;
                                } else {
                                    return option.value as IClinicalTrial;
                                }
                            })
                        );
                    } else if (selectedOption === null) {
                        this.props.onChange([] as IClinicalTrial[]);
                    }
                }}
                loadOptions={promiseOptions}
                defaultOptions={clinicalTrialDefaultOptions}
            />
        );
    }
}

const promiseOptions = (
    inputValue: string,
    callback: (options: ReadonlyArray<MyOption>) => void
) =>
    new Promise<MyOption>((resolve, reject) => {
        // TODO better to separate this call to a configurable client
        request
            .get(
                'https://clinicaltrials.gov/api/v2/studies/' +
                    inputValue +
                    '?format=json&fields=BriefTitle%7CNCTId'
            )
            .end((err, res) => {
                if (!err && res.ok) {
                    const response = JSON.parse(res.text);
                    const result =
                        response.protocolSection.identificationModule;
                    console.group('Result from ClinicalTrials.gov');
                    console.log(response);
                    console.groupEnd();
                    return callback([
                        {
                            value: {
                                name: result.briefTitle,
                                id: result.nctId,
                            },
                            label: result.nctId + ': ' + result.briefTitle,
                        } as MyOption,
                    ]);
                } else {
                    const errClinicalTrial = {
                        id: '',
                        name: 'Could not fetch trial for: ' + inputValue,
                    };
                    return callback([
                        {
                            value: errClinicalTrial,
                            label:
                                errClinicalTrial.id +
                                ': ' +
                                errClinicalTrial.name,
                        },
                    ]);
                }
            });
    });
