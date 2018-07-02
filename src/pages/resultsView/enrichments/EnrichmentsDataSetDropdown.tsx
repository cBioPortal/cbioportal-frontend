import * as React from 'react';
import { observer } from "mobx-react";
import { observable } from 'mobx';
import { Checkbox, Button, Form, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import styles from "./styles.module.scss";
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import autobind from 'autobind-decorator';

export interface IEnrichmentsDataSetDropdownProps {
    dataSets: MolecularProfile[];
    onChange: (molecularProfile: MolecularProfile) => void;
    selectedValue: string;
    molecularProfileIdToProfiledSampleCount:{[molecularProfileId:string]:number};
}

@observer
export default class EnrichmentsDataSetDropdown extends React.Component<IEnrichmentsDataSetDropdownProps, {}> {

    @autobind
    private change(e: any) {
        this.props.onChange(this.props.dataSets.find(d => d.molecularProfileId === e.target.value)!);
    }

    public render() {

        if (this.props.dataSets.length === 1 && (this.props.dataSets[0].molecularAlterationType === "MUTATION_EXTENDED"
            || this.props.dataSets[0].molecularAlterationType === "COPY_NUMBER_ALTERATION")) {
            return null;
        }

        const options: JSX.Element[] = [];
        this.props.dataSets.forEach(dataSet => {
            const sampleCount = this.props.molecularProfileIdToProfiledSampleCount[dataSet.molecularProfileId];
            options.push(<option value={dataSet.molecularProfileId}>{dataSet.name} ({sampleCount} sample{sampleCount !== 1 ? "s" : ""})</option>);
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
