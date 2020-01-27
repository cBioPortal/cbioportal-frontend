import { observer } from 'mobx-react';
import * as React from 'react';
import { MolecularProfile } from '../api/generated/CBioPortalAPI';
import Select from 'react-select1';
import { getProfileOptions } from 'pages/resultsView/coExpression/CoExpressionTabUtils';

export interface IMolecularProfileSelector {
    name?: string;
    className?: string;
    value: string;
    onChange: (option: { label: string; value: string }) => void;
    molecularProfiles: MolecularProfile[];
    molecularProfileIdToProfiledSampleCount?: {
        [molecularProfileId: string]: number;
    };
}

@observer
export default class MolecularProfileSelector extends React.Component<
    IMolecularProfileSelector,
    {}
> {
    render() {
        return (
            <Select
                name={this.props.name}
                value={this.props.value}
                onChange={this.props.onChange}
                options={getProfileOptions(
                    this.props.molecularProfiles,
                    this.props.molecularProfileIdToProfiledSampleCount
                )}
                searchable={false}
                clearable={false}
                className={this.props.className}
            />
        );
    }
}
