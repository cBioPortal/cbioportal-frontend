import * as React from "react";
import {ClinicalData} from "../../../shared/api/generated/CBioPortalAPI";
import {Table as DataTable} from "reactableMSK";
import LazyMobXTable from "shared/components/lazyMobXTable/LazyMobXTable";
import TableHeaderControls from "shared/components/tableHeaderControls/TableHeaderControls";

import styles from './style/patientTable.module.scss';
import {MSKTab} from "../../../shared/components/MSKTabs/MSKTabs";

export interface IClinicalInformationPatientTableProps {
    data: ClinicalData[];
    showTitleBar?: boolean;
    cssClass?:string;
}

class PatientTable extends LazyMobXTable<IPatientRow> {}

interface IPatientRow {
    attribute: string;
    value: string;
};

export default class ClinicalInformationPatientTable extends React.Component<IClinicalInformationPatientTableProps, {}> {

    public render() {

        const tableData = this.props.data && this.props.data.map((el: ClinicalData) => ({
            attribute: el.clinicalAttribute.displayName || '',
            value: el.value
        }));

        return (
            <PatientTable
                  data={tableData}
                  columns={[{ name:'Attribute', render:(data)=><span>{data.attribute}</span>},
                        { name:'Value', render: (data)=><span>{data.value}</span>}]}
                  showPagination={false}
                  showColumnVisibility={false}
            />
        );
    }
}


