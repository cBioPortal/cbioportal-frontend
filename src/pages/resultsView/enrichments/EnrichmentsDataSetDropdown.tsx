import * as React from 'react';
import { observer } from "mobx-react";
import {computed, observable} from 'mobx';
import { Checkbox, Button, Form, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import styles from "./styles.module.scss";
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import autobind from 'autobind-decorator';
import {filterAndSortProfiles} from "../coExpression/CoExpressionTabUtils";
import MolecularProfileSelector from "../../../shared/components/MolecularProfileSelector";
import {MobxPromise} from "mobxpromise";

export interface IEnrichmentsDataSetDropdownProps {
    dataSets: MobxPromise<MolecularProfile[]>;
    onChange: (molecularProfile: MolecularProfile) => void;
    selectedValue: string;
    molecularProfileIdToProfiledSampleCount:{[molecularProfileId:string]:number};
}

@observer
export default class EnrichmentsDataSetDropdown extends React.Component<IEnrichmentsDataSetDropdownProps, {}> {

    @autobind
    private change(o: any) {
        // at this point, we know dataSets is complete because otherwise this callback wouldnt be fired
        this.props.onChange(this.props.dataSets.result!.find(d => d.molecularProfileId === o.value)!);
    }

    public render() {

        if (this.props.dataSets.isComplete && this.props.dataSets.result!.length === 1 &&
            (this.props.dataSets.result![0].molecularAlterationType === "MUTATION_EXTENDED"
                || this.props.dataSets.result![0].molecularAlterationType === "COPY_NUMBER_ALTERATION")) {
            return null;
        }

        return (
            <div className={styles.DataSet}>
                <div style={{display:"flex", alignItems:"center"}}>
                    <strong>Data Set:</strong>
                    <div style={{display:"inline-block", marginLeft:5, width:400}}>
                        <MolecularProfileSelector
                            value={this.props.selectedValue}
                            molecularProfiles={this.props.dataSets}
                            molecularProfileIdToProfiledSampleCount={this.props.molecularProfileIdToProfiledSampleCount}
                            onChange={this.change}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
