import React from 'react';
import {
    ITherapyRecommendation,
    IClinicalData,
} from 'shared/model/TherapyRecommendation';
import CreatableSelect from 'react-select/creatable';
import _ from 'lodash';
import { components } from 'react-select';
import { ClinicalData } from 'cbioportal-ts-api-client';
import styles from '../style/therapyRecommendation.module.scss';
import SampleManager from 'pages/patientView/SampleManager';
import { If, Then, Else } from 'react-if';
import {
    DefaultTooltip,
    placeArrowBottomLeft,
} from 'cbioportal-frontend-commons';
import { IMutationalSignature } from 'shared/model/MutationalSignature';

interface TherapyRecommendationFormClinicalInputProps {
    data: ITherapyRecommendation;
    clinicalData: ClinicalData[];
    mutationSignatureData: _.Dictionary<IMutationalSignature[]>;
    sampleManager: SampleManager | null;
    onChange: (clinicalData: IClinicalData[]) => void;
}

type MyOption = { label: string; value: IClinicalData | string };

export default class TherapyRecommendationFormClinicalInput extends React.Component<
    TherapyRecommendationFormClinicalInputProps,
    {}
> {
    public render() {
        const Option = (props: any) => {
            return (
                <div>
                    <components.Option {...props}>
                        <span style={{ marginRight: 5 }}>{props.label}</span>
                        <If
                            condition={
                                typeof props.value === 'object' &&
                                props.value !== null &&
                                'sampleId' in props.value &&
                                props.value.sampleId
                            }
                        >
                            <Then>
                                <span className={styles.genomicSpan}>
                                    {this.props.sampleManager!.getComponentForSample(
                                        props.value.sampleId,
                                        1,
                                        ''
                                    )}
                                </span>
                            </Then>
                            <Else>
                                <DefaultTooltip
                                    placement="bottomLeft"
                                    trigger={['hover', 'focus']}
                                    overlay={
                                        <div
                                            className={styles.tooltip}
                                            style={{ width: '120px' }}
                                        >
                                            <span>Patient-level attribute</span>
                                        </div>
                                    }
                                    destroyTooltipOnHide={false}
                                    onPopupAlign={placeArrowBottomLeft}
                                >
                                    <i
                                        className={
                                            'fa fa-product-hunt ' + styles.icon
                                        }
                                        style={{ marginRight: 2 }}
                                    ></i>
                                </DefaultTooltip>
                            </Else>
                        </If>
                    </components.Option>
                </div>
            );
        };

        let allClinicalData = this.props.clinicalData
            .map((clinicalDataItem: ClinicalData) => {
                return {
                    sampleId: clinicalDataItem.sampleId,
                    attributeId:
                        clinicalDataItem.clinicalAttribute.clinicalAttributeId,
                    attributeName:
                        clinicalDataItem.clinicalAttribute.displayName,
                    value: clinicalDataItem.value,
                } as IClinicalData;
            })
            .concat(
                (this.props.mutationSignatureData['v2'] || []).map(
                    (signatureItem: IMutationalSignature) => {
                        return {
                            sampleId: signatureItem.sampleId,
                            attributeId: signatureItem.mutationalSignatureId,
                            attributeName:
                                signatureItem.meta.name +
                                ' (' +
                                signatureItem.meta.description +
                                ')',
                            value: _.toString(signatureItem.value),
                        } as IClinicalData;
                    }
                )
            );
        // allClinicalData = _.uniqBy(allClinicalData, "attribute");

        let clinicalDataOptions = allClinicalData.map(
            (clinicalDataItem: IClinicalData) => ({
                value: clinicalDataItem,
                label:
                    clinicalDataItem.attributeName +
                    ': ' +
                    clinicalDataItem.value,
            })
        );

        const clinicalDataDefault =
            this.props.data.reasoning.clinicalData &&
            this.props.data.reasoning.clinicalData.map(
                (clinicalDataItem: IClinicalData) => ({
                    value: clinicalDataItem,
                    label:
                        clinicalDataItem.attributeName +
                        ': ' +
                        clinicalDataItem.value,
                })
            );
        return (
            <CreatableSelect
                options={clinicalDataOptions}
                // isDisabled
                components={{ Option }}
                isMulti
                defaultValue={clinicalDataDefault}
                name="clinicalSelect"
                className="creatable-multi-select"
                classNamePrefix="select"
                onChange={(selectedOption: MyOption[]) => {
                    if (Array.isArray(selectedOption)) {
                        this.props.onChange(
                            selectedOption.map(option => {
                                if (_.isString(option.value)) {
                                    let clinicalDataString = option.value
                                        .toString()
                                        .split(': ');
                                    return {
                                        attributeName: clinicalDataString[0],
                                        value: clinicalDataString[1],
                                    } as IClinicalData;
                                } else {
                                    return option.value as IClinicalData;
                                }
                            })
                        );
                    } else if (selectedOption === null) {
                        this.props.onChange([] as IClinicalData[]);
                    }
                }}
            />
        );
    }
}
