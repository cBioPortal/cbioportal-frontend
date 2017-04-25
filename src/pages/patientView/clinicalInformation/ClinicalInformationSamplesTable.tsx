import * as React from "react";
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import convertSamplesData, {IConvertedSamplesData} from "./lib/convertSamplesData";
import {SampleLabelHTML} from "../../../shared/components/sampleLabel/SampleLabel";
import {Table as DataTable, Thead, Th} from "reactable";
import LazyMobXTable from "shared/components/lazyMobXTable/LazyMobXTable";
import TableHeaderControls from "shared/components/tableHeaderControls/TableHeaderControls";
import {ClinicalAttribute} from "../../../shared/api/generated/CBioPortalAPI";


interface IClinicalInformationSamplesTableProps {
    samples?: Array<ClinicalDataBySampleId>;
}

export interface ISampleRow {
    attribute:string;
    [key:string]:string|number|ClinicalAttribute;
}

class SampleTableComponent extends LazyMobXTable<ISampleRow> {
}

export default class ClinicalInformationSamplesTable extends React.Component<IClinicalInformationSamplesTableProps, void> {

    public render() {
        const sampleInvertedData = convertSamplesData(this.props.samples);
        const tableData = this.prepareData(sampleInvertedData);
        const headerCells = this.buildHeaderCells(sampleInvertedData);
        const columns = headerCells.map((cell) => (
            {name: cell.props.children,
             render: (data:ISampleRow)=><span>{data[cell.props.column]}</span>}
        ));
        return <SampleTableComponent columns={columns} data={tableData} showPagination={false} showColumnVisibility={false}/>;
    }

    public buildHeaderCells(sampleInvertedData: IConvertedSamplesData) {

        const headerCells: Array<JSX.Element> = sampleInvertedData.columns.map((col, i) => {
            return (
                <Th column={col.id} key={i}>
                    {' ' + col.id}
                </Th>
            );
        });

        // add the row title at beg of array
        headerCells.unshift(<Th key={-1} column="attribute">Attribute</Th>);

        return headerCells;
    }

    public prepareData(sampleInvertedData: IConvertedSamplesData) {

        const tableData: ISampleRow[] = []

        for (const key in sampleInvertedData.items) {
            const rowData = sampleInvertedData.items[key];

            const row: ISampleRow = { attribute: rowData.clinicalAttribute.displayName };

            sampleInvertedData.columns.map((col) => {
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
