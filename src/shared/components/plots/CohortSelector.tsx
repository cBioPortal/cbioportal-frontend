import { observer } from 'mobx-react';
import * as React from 'react';
import { computed } from 'mobx';
import ReactSelect from 'react-select1';

export interface ICohortSelector {
    study: string;
    cancerType: string;
    cancerTypeDetailed: string;
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
                label: `Samples with: ${this.props.cancerType}`,
            },
            {
                value: CohortOptions.CancerTypeDetailed,
                label: `Samples with: ${this.props.cancerTypeDetailed}`,
            },
        ];
    }

    render() {
        return (
            <div style={{ marginBottom: 10 }}>
                <div className="form-group">
                    <label>Relevant Cohort</label>
                    <div className="cohort-select-div">
                        <ReactSelect
                            name="cohort-select"
                            value={this.props.cohortSelection}
                            onChange={this.props.handleCohortChange}
                            options={this.cohortOptions}
                            clearable={false}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
