import { observer } from 'mobx-react';
import * as React from 'react';
import { computed } from 'mobx';
import ReactSelect from 'react-select1';
import InfoIcon from '../InfoIcon';
import _ from 'lodash';
import { Sample } from 'cbioportal-ts-api-client';

export interface ICohortSelector {
    includeNavCohortOption: boolean;
    samplesInCohort: Sample[];
    study: string;
    cancerTypes: string[];
    cancerTypesDetailed: string[];
    cohortSelection: CohortOptions;
    handleCohortChange: (cohort: {
        value: CohortOptions;
        label: string;
    }) => void;
}

export enum CohortOptions {
    WholeCohort = 'WholeCohort',
    WholeStudy = 'WholeStudy',
    CancerType = 'CancerType',
    CancerTypeDetailed = 'CancerTypeDetailed',
}

@observer
export default class CohortSelector extends React.Component<
    ICohortSelector,
    {}
> {
    @computed get defaultOptions(): {
        value: CohortOptions;
        label: string;
    }[] {
        return [
            {
                value: CohortOptions.WholeStudy,
                label: `Study: ${this.props.study}`,
            },
            {
                value: CohortOptions.CancerType,
                label: `Cancer Type: ${_.uniq(this.props.cancerTypes).join(
                    ' or '
                )}`,
            },
            {
                value: CohortOptions.CancerTypeDetailed,
                label: `Cancer Type Detailed: ${_.uniq(
                    this.props.cancerTypesDetailed
                ).join(' or ')}`,
            },
        ];
    }

    @computed get cohortNavOption(): {
        value: CohortOptions;
        label: string;
    }[] {
        return [
            {
                value: CohortOptions.WholeCohort,
                label: `Samples In Cohort Nav: ${this.props.samplesInCohort.length}`,
            },
        ];
    }

    render() {
        return (
            <div
                style={{
                    marginBottom: '15px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        zIndex: 4,
                        alignItems: 'center',
                        position: 'relative',
                    }}
                >
                    <strong style={{ marginRight: '5px' }}>
                        Reference Cohort:{' '}
                    </strong>
                    <ReactSelect
                        name="cohort-select"
                        value={this.props.cohortSelection}
                        onChange={this.props.handleCohortChange}
                        options={
                            this.props.includeNavCohortOption
                                ? [
                                      ...this.cohortNavOption,
                                      ...this.defaultOptions,
                                  ]
                                : this.defaultOptions
                        }
                        clearable={false}
                        style={{ width: '350px', zIndex: 4 }}
                    />
                    <InfoIcon
                        tooltip={
                            <span>
                                Set of patients/samples displayed alongside the
                                current patient/sample for context
                            </span>
                        }
                        tooltipPlacement="right"
                        style={{ marginLeft: 7 }}
                    />
                </div>
            </div>
        );
    }
}
