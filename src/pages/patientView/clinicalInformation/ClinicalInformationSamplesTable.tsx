import * as React from 'react';
import { ClinicalDataBySampleId } from "./getClinicalInformationData";
import convertSamplesData from './lib/convertSamplesData';
import { SampleLabelHTML } from '../SampleLabel';
import { Table as DataTable, Tr, Td, Thead, Th } from 'reactableMSK';
import TableExportButtons from '../../../shared/components/tableExportButtons/TableExportButtons';

interface IClinicalInformationSamplesTableProps {
    samples: Array<ClinicalDataBySampleId>;
}

type TODO = any;

export class ClinicalInformationSamplesTable extends React.Component<IClinicalInformationSamplesTableProps, any> {

    public render() {

        const sampleInvertedData: TODO = convertSamplesData(this.props.samples);

        const tableData = this.prepareData(sampleInvertedData);

        const headerCells = this.buildHeaderCells(sampleInvertedData);

        return (
            <div>
                <div>
                    <h4 className="pull-left">Samples</h4>
                    <TableExportButtons className="pull-right" tableData={tableData} />
                </div>
                <DataTable className="table table-striped" data={tableData} >
                    <Thead>{ headerCells }</Thead>
                </DataTable>
            </div>
        );
    }

    public buildHeaderCells(sampleInvertedData: TODO){

        const headerCells: Array<JSX.Element> = sampleInvertedData.columns.map((col: TODO, i: number) => {
            return (<Th column={col.id} key={i}>
                <SampleLabelHTML color={'black'} label={(i + 1).toString()} />
                {' ' + col.id}
            </Th>);
        });

        // add the row title at beg of array
        headerCells.unshift(<Th key={-1} column="attribute">Attribute</Th>);

        return headerCells;

    }

    public prepareData(sampleInvertedData: TODO){

        const tableData: Array<any> = [];

        Object.keys(sampleInvertedData.items).forEach((key: string) => {
            const rowData: TODO = sampleInvertedData.items[key];

            const row: any = {};
            row.attribute = rowData.clinicalAttribute.displayName;

            sampleInvertedData.columns.map((col: TODO, i: number) => {
                if (col.id in rowData) {
                    row[col.id] = rowData[col.id];
                } else {
                    row[col.id] = 'n/a';
                }
            });

            tableData.push(row);

        });

        return tableData;

    }

}

export default ClinicalInformationSamplesTable;
