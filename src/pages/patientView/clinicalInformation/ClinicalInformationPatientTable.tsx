import * as React from "react";
import {ClinicalData} from "../../../shared/api/CBioPortalAPI";
import {Table as DataTable} from "reactableMSK";
import TableHeaderControls from "shared/components/tableHeaderControls/TableHeaderControls";

import styles from './style/patientTable.module.scss';

export interface IClinicalInformationPatientTableProps {
    data?: Array<ClinicalData>;
    showTitleBar?: Boolean;
    cssClass?:String;
}

export default class ClinicalInformationPatientTable extends React.Component<IClinicalInformationPatientTableProps, {}> {

    public render() {

        let tableData = this.props.data && this.props.data.map((el: ClinicalData) => ({
            attribute: el.clinicalAttribute.displayName || '',
            value: el.value
        }));

        return (
            <div>
                {
                    this.props.showTitleBar
                    ?   <div>
                            <TableHeaderControls className="pull-right" tableData={tableData} />
                        </div>
                    :   null
                }
                <DataTable className={ `table table-striped table-border-top ${styles.patientTable} ${this.props.cssClass || ''}` } columns={[{ key:'attribute', label:'Attribute'},{ key:'value', label:'Value'}]} data={tableData} />
            </div>
        );
    }
}
