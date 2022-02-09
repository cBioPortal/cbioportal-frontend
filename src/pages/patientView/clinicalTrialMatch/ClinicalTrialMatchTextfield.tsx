import React from 'react';

interface IState {
    value?: string;
}

export class ClinicalTrialMatchTextfield extends React.Component<{}, IState> {
    constructor(props: React.Component) {
        super(props);
        this.state = { value: 'foobar' };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ value: event.target.value });
    }

    render() {
        return (
            <label>
                Additional Query:
                <input
                    type="text"
                    value={this.state.value}
                    onChange={this.handleChange}
                />
            </label>
        );
    }
}
