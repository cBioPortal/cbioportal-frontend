import { observer } from 'mobx-react';
import * as React from 'react';
import { computed } from 'mobx';
import ReactSelect from 'react-select1';
import InfoIcon from '../InfoIcon';

export interface ICohortSelector {
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
    WholeStudy = 'WholeStudy',
    CancerType = 'CancerType',
    CancerTypeDetailed = 'CancerTypeDetailed',
}

@observer
export default class CohortSelector extends React.Component<
    ICohortSelector,
    {}
> {
    @computed get cohortOptions(): {
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
                label: `Samples with: ${this.props.cancerTypes.join(', ')}`,
            },
            {
                value: CohortOptions.CancerTypeDetailed,
                label: `Samples with: ${this.props.cancerTypesDetailed.join(
                    ', '
                )}`,
            },
        ];
    }

    render() {
        return (
            <div style={{ marginBottom: 10 }}>
                <div className="form-group">
                    <label>Reference Cohort</label>
                    <div
                        className="cohort-select-div"
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <ReactSelect
                            name="cohort-select"
                            value={this.props.cohortSelection}
                            onChange={this.props.handleCohortChange}
                            options={this.cohortOptions}
                            clearable={false}
                        />
                        <InfoIcon
                            tooltip={
                                <span>
                                    Set of patients/samples displayed alongside
                                    the current patient/sample for context
                                </span>
                            }
                            tooltipPlacement="right"
                            style={{ marginLeft: 7 }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
