import { observer } from 'mobx-react';
import * as React from 'react';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import Select from 'react-select1';
import { getProfileOptions } from 'pages/resultsView/coExpression/CoExpressionTabUtils';

export interface IMolecularProfileSelector {
    name?: string;
    className?: string;
    value: string;
    onChange: (option: { label: string; value: string }) => void;
    molecularProfiles: MolecularProfile[];
    // Custom per-option rendering, passed straight through to react-select1
    // (see its own `optionRenderer` prop) — e.g. to annotate an option with
    // caller-specific context this component has no notion of. Omit it and
    // every option renders as plain text, same as before this existed.
    optionRenderer?: (option: {
        label: string;
        value: string;
    }) => React.ReactNode;
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
                options={getProfileOptions(this.props.molecularProfiles)}
                searchable={false}
                clearable={false}
                className={this.props.className}
                optionRenderer={this.props.optionRenderer}
            />
        );
    }
}
