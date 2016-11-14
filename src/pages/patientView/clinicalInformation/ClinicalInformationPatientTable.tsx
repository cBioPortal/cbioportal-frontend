import * as _ from 'lodash';
import * as React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { Table } from 'react-bootstrap';
import {ClinicalData} from '../../../shared/api/CBioPortalAPI';
import renderIf from 'render-if';
import { Table as DataTable } from 'reactableMSK';
import TableExportButtons from '../../../shared/components/tableExportButtons/TableExportButtons';

type TODO = any;

export interface IClinicalInformationPatientTableProps {
    data: Array<ClinicalData>;
    showTitleBar: Boolean;
}

class ClinicalInformationPatientTable extends React.Component<IClinicalInformationPatientTableProps, {}> {

    public render() {

        let tableData = _.map(this.props.data, (el: ClinicalData) =>{ return {
            attribute: el.clinicalAttribute.displayName || '',
            value: el.attrValue };
        });

        return (
            <div>

                {renderIf(this.props.showTitleBar)(
                    <div>
                        <h4 className="pull-left">Patient</h4>
                        <TableExportButtons className="pull-right" tableData={tableData} />
                    </div>
                )}

                <DataTable className='table table-striped' columns={[{ key:'attribute', label:'Attribute'},{ key:'value', label:'Value'}]} data={tableData} />

            </div>
        );
    }
}

export default ClinicalInformationPatientTable;
