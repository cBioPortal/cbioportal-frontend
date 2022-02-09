import React from 'react';
import {
    ITherapyRecommendation,
    IReference,
} from 'shared/model/TherapyRecommendation';
import AsyncCreatableSelect from 'react-select/async-creatable';
import _ from 'lodash';
import request from 'superagent';

interface TherapyRecommendationFormReferenceInputProps {
    data: ITherapyRecommendation;
    onChange: (references: IReference[]) => void;
}

type MyOption = { label: string; value: IReference };

export default class TherapyRecommendationFormReferenceInput extends React.Component<
    TherapyRecommendationFormReferenceInputProps,
    {}
> {
    public render() {
        const referenceDefault = this.props.data.references.map(
            (reference: IReference) => ({
                value: reference,
                label: reference.pmid + ': ' + reference.name,
            })
        );
        return (
            <AsyncCreatableSelect
                isCreatable
                isMulti
                defaultValue={referenceDefault}
                cacheOptions
                placeholder="Enter PubMed ID..."
                name="referencesSelect"
                className="creatable-multi-select"
                classNamePrefix="select"
                onChange={(selectedOption: MyOption[]) => {
                    if (Array.isArray(selectedOption)) {
                        this.props.onChange(
                            selectedOption.map(option => {
                                if (_.isString(option.value)) {
                                    return {
                                        pmid: -1,
                                        name: option.value,
                                    } as IReference;
                                } else {
                                    return option.value as IReference;
                                }
                            })
                        );
                    } else if (selectedOption === null) {
                        this.props.onChange([] as IReference[]);
                    }
                }}
                loadOptions={promiseOptions}
            />
        );
    }
}

const promiseOptions = (
    inputValue: string,
    callback: (options: ReadonlyArray<MyOption>) => void
) =>
    new Promise<MyOption>((resolve, reject) => {
        if (isNaN(+inputValue)) {
            const nanReference = { pmid: -1, name: inputValue };
            return callback([
                {
                    value: nanReference,
                    label: nanReference.name,
                },
            ]);
        } else {
            const pmid = +inputValue;
            // TODO better to separate this call to a configurable client
            request
                .get(
                    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=' +
                        pmid +
                        '&retmode=json'
                )
                .end((err, res) => {
                    if (!err && res.ok) {
                        const response = JSON.parse(res.text);
                        const result = response.result;
                        const uid = result.uids[0];
                        const reference = {
                            pmid: pmid,
                            name: result[uid].title,
                        };
                        const ret: MyOption = {
                            value: reference,
                            label: reference.pmid + ': ' + reference.name,
                        };
                        return callback([ret]);
                    } else {
                        const errReference = {
                            pmid: pmid,
                            name: 'Could not fetch name for ID ' + pmid,
                        };
                        return callback([
                            {
                                value: errReference,
                                label:
                                    errReference.pmid +
                                    ': ' +
                                    errReference.name,
                            },
                        ]);
                    }
                });
        }
    });
