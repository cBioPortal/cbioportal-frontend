import React from 'react';
import {
    ITherapyRecommendation,
    IClinicalTrial,
} from 'shared/model/TherapyRecommendation';
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
                'https://www.clinicaltrials.gov/api/query/study_fields?expr=' +
                    inputValue +
                    '&fields=NCTId%2CBriefTitle%2COfficialTitle&min_rnk=1&max_rnk=5&fmt=json'
            )
            .end((err, res) => {
                if (!err && res.ok) {
                    const response = JSON.parse(res.text);
                    const result = response.StudyFieldsResponse;
                    console.group('Result from ClinicalTrials.gov');
                    console.log(response);
                    console.groupEnd();
                    const trialResults = result.StudyFields;
                    const ret: MyOption[] = trialResults.map(
                        (trialResult: {
                            OfficialTitle: string[];
                            BriefTitle: string[];
                            NCTId: string[];
                            Rank: number;
                        }) => {
                            const trialName = trialResult.BriefTitle[0];
                            const trialId = trialResult.NCTId[0];
                            return {
                                value: {
                                    name: trialName,
                                    id: trialId,
                                },
                                label: trialId + ': ' + trialName,
                            } as MyOption;
                        }
                    );
                    return callback(ret);
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
