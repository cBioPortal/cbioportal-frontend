import * as React from 'react';
import { observer } from "mobx-react";
import { observable } from 'mobx';
import { Checkbox, Button, Form, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import styles from "./styles.module.scss";
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import autobind from 'autobind-decorator';

export interface IDataSetDropdownProps {
    dataSets: MolecularProfile[];
    onChange: (molecularProfile: MolecularProfile) => void;
    selectedValue: string;
}

@observer
export default class DataSetDropdown extends React.Component<IDataSetDropdownProps, {}> {

    @autobind
    private change(e: any) {
        this.props.onChange(JSON.parse(e.target.value));
    }

    public render() {

        if (this.props.dataSets.length === 1 && (this.props.dataSets[0].molecularAlterationType === "MUTATION_EXTENDED"
            || this.props.dataSets[0].molecularAlterationType === "COPY_NUMBER_ALTERATION")) {
            return null;
        }

        const options: JSX.Element[] = [];
        this.props.dataSets.forEach(dataSet => {
            options.push(<option value={JSON.stringify(dataSet)}>{dataSet.name}</option>);
        });

        return (
            <div className={styles.DataSet}>
                <Form inline>
                    <FormGroup controlId="formControlsSelect" bsSize="small">
                        <ControlLabel>Data Set</ControlLabel>{' '}
                        <FormControl componentClass="select" onChange={this.change} value={this.props.selectedValue}>
                            {options}
                        </FormControl>
                    </FormGroup>
                </Form>
            </div>
        );
    }
}
