import * as React from "react";
import {ClinicalData} from "../../../shared/api/CBioPortalAPI";
import {Table as DataTable} from "reactableMSK";
import TableExportButtons from "../../../shared/components/tableExportButtons/TableExportButtons";

export interface IClinicalInformationPatientTableProps {
    data?: Array<ClinicalData>;
    showTitleBar?: Boolean;
}

export default class ClinicalInformationPatientTable extends React.Component<IClinicalInformationPatientTableProps, {}> {

    public render() {

        let tableData = this.props.data && this.props.data.map((el: ClinicalData) => ({
            attribute: el.clinicalAttribute.displayName || '',
            value: el.attrValue
        }));

        return (
            <div>
                {
                    this.props.showTitleBar
                    ?   <div>
                            <h4 className="pull-left">Patient</h4>
                            <TableExportButtons className="pull-right" tableData={tableData} />
                        </div>
                    :   null
                }
                <DataTable className='table table-striped' columns={[{ key:'attribute', label:'Attribute'},{ key:'value', label:'Value'}]} data={tableData} />
            </div>
        );
    }
}
