import * as React from "react";
import * as _ from "lodash";
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import convertSamplesData, {IConvertedSamplesData} from "./lib/convertSamplesData";
import LazyMobXTable, {Column} from "shared/components/lazyMobXTable/LazyMobXTable";
import {ClinicalAttribute} from "../../../shared/api/generated/CBioPortalAPI";
import styles from './style/sampleTable.module.scss';
import {SHOW_ALL_PAGE_SIZE} from "../../../shared/components/paginationControls/PaginationControls";
import {sortByClinicalAttributePriorityThenName} from "../../../shared/lib/SortUtils";

interface IClinicalInformationSamplesTableProps {
    samples?: ClinicalDataBySampleId[];
}

export interface ISampleRow {
    attribute:string;
    [key:string]:string|number|ClinicalAttribute;
}

class SampleTableComponent extends LazyMobXTable<ISampleRow> {
}

export default class ClinicalInformationSamplesTable extends React.Component<IClinicalInformationSamplesTableProps, {}> {

    public render() {
        const sampleInvertedData = convertSamplesData(this.props.samples);
        const tableData = this.prepareData(sampleInvertedData);
        const columns:Column<ISampleRow>[] = [{id: 'attribute'}, ...sampleInvertedData.columns].map((col) =>  (
            {
                name: col.id,
                render: (data:ISampleRow)=><span>{data[col.id]}</span>,
                download: (data:ISampleRow) => `${data[col.id]}`,
                filter: (data:ISampleRow, filterString:string, filterStringUpper:string) =>
                    (data[col.id].toString().toUpperCase().indexOf(filterStringUpper) > -1)
            }
        ));
        columns[0].sortBy = (data)=>data.attribute;
        return <SampleTableComponent
                    columns={columns}
                    data={tableData}
                    className={styles.sampleTable}
                    showPagination={false}
                    initialItemsPerPage={SHOW_ALL_PAGE_SIZE}
                    showColumnVisibility={false}
                />;
    }

    public prepareData(sampleInvertedData: IConvertedSamplesData) {

        const tableData: ISampleRow[] = [];

        _.each(_.values(sampleInvertedData.items).sort((a: any, b: any) => {
            return sortByClinicalAttributePriorityThenName(a.clinicalAttribute, b.clinicalAttribute);
        }), rowData => {
            const row: ISampleRow = {attribute: rowData.clinicalAttribute.displayName};

            sampleInvertedData.columns.map((col) => {
                if (col.id in rowData)
                    row[col.id] = rowData[col.id];
                else
                    row[col.id] = 'n/a';
            });

            tableData.push(row);
        });

        return tableData;
    }
}
