import * as React from "react";
import {ClinicalDataBySampleId} from "./getClinicalInformationData";
import convertSamplesData, {IConvertedSamplesData} from "./lib/convertSamplesData";
import {SampleLabelHTML} from "../SampleLabel";
import {Table as DataTable, Thead, Th} from "reactableMSK";
import TableHeaderControls from "shared/components/tableHeaderControls/TableHeaderControls";

interface IClinicalInformationSamplesTableProps {
    samples?: Array<ClinicalDataBySampleId>;
}

export default class ClinicalInformationSamplesTable extends React.Component<IClinicalInformationSamplesTableProps, void> {

    public render() {
        const sampleInvertedData = convertSamplesData(this.props.samples);
        const tableData = this.prepareData(sampleInvertedData);
        const headerCells = this.buildHeaderCells(sampleInvertedData);
        return (
            <div>
                <div>
                    <h4 className="pull-left">Samples</h4>
                    <TableHeaderControls className="pull-right" tableData={tableData} />
                </div>
                <DataTable className="table table-striped" data={tableData} >
                    <Thead>{ headerCells }</Thead>
                </DataTable>
            </div>
        );
    }

    public buildHeaderCells(sampleInvertedData: IConvertedSamplesData) {

        const headerCells: Array<JSX.Element> = sampleInvertedData.columns.map((col, i) => {
            return (<Th column={col.id} key={i}>
                {' ' + col.id}
            </Th>);
        });

        // add the row title at beg of array
        headerCells.unshift(<Th key={-1} column="attribute">Attribute</Th>);

        return headerCells;
    }

    public prepareData(sampleInvertedData: IConvertedSamplesData) {

        const tableData: Array<any> = [];

        for (let key in sampleInvertedData.items) {
            const rowData = sampleInvertedData.items[key];

            const row: any = {};
            row.attribute = rowData.clinicalAttribute.displayName;

            sampleInvertedData.columns.map(col => {
                if (col.id in rowData)
                    row[col.id] = rowData[col.id];
                else
                    row[col.id] = 'n/a';
            });

            tableData.push(row);
        }

        return tableData;
    }
}
