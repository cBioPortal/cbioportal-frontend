import * as React from "react";
import {ClinicalAttribute, ClinicalData} from "../../../shared/api/generated/CBioPortalAPI";
import LazyMobXTable, {Column} from "shared/components/lazyMobXTable/LazyMobXTable";
import {fetchMutationalSignatureData} from "../../../shared/lib/StoreUtils";
import styles from './style/patientTable.module.scss';
import {SHOW_ALL_PAGE_SIZE} from "../../../shared/components/paginationControls/PaginationControls";
import {IMutationalSignature} from "../../../shared/model/MutationalSignature";
import convertSamplesData, {IConvertedSamplesData} from "./lib/convertSamplesData";
import {ISampleRow} from "./ClinicalInformationSamplesTable";
import _ from 'lodash';

export interface IClinicalInformationMutationalSignatureTableProps {
    data: IMutationalSignature;
    showTitleBar?: boolean;
    cssClass?:string;
    showFilter?:boolean;
    showCopyDownload?:boolean;
}

class MutationalSignatureTable extends LazyMobXTable<IMutationalSignatureRow> {}

interface IMutationalSignatureRow {
    mutationalSignatureId:string;
    [key:string]:string;
};

export default class ClinicalInformationMutationalSignatureTable extends React.Component<{}> {
    public render() {
        const sampleData: IMutationalSignature[] = fetchMutationalSignatureData();
        const sampleInvertedData =  this.invertData(sampleData);
        const tableData = this.prepareData(sampleData);
        const columns:Column<IMutationalSignatureRow>[] = [{id: 'mutationalSignatureId'}, ...sampleInvertedData.columns].map((col) =>  (
            {
                name: col.id,
                render: (data:IMutationalSignatureRow)=><span>{data[col.id]}</span>,
                download: (data:IMutationalSignatureRow) => `${data[col.id]}`,
                filter: (data:IMutationalSignatureRow, filterString:string, filterStringUpper:string) =>
                    (data[col.id].toString().toUpperCase().indexOf(filterStringUpper) > -1)
            }
        ));
        //columns[0].sortBy = (data)=>data.mutationalSignatureId;
        return <MutationalSignatureTable
            columns={columns}
            data={tableData}
            className={styles.sampleTable}
            showPagination={false}
            initialItemsPerPage={SHOW_ALL_PAGE_SIZE}
            showColumnVisibility={false}
            initialSortColumn="attribute"
            initialSortDirection="asc"
        />;
    }

    public invertData(sampleData: IMutationalSignature[]): IConvertedSamplesData{
        interface IColumn {
            id:string;
        };

        interface IAttrData {
            [attrId:string]: {
                [sampleId: string]: ClinicalAttribute | string;
                clinicalAttribute: ClinicalAttribute;
                id: string;
            };
        };

        interface IConvertedSamplesData {
            columns: IColumn[];
            items: IAttrData;
        }


        let sampleInvertedDataByMutationalSignature = _(sampleData)
            .groupBy(x => x.sampleId)
            .map((value, key)  => ({id: key, clinicalData: value}))
            .value();

        let output: IConvertedSamplesData = {columns: [], items: {}};

        sampleInvertedDataByMutationalSignature.forEach((sample) => {
            const sampleId = sample.id;
            output.columns.push({id: sampleId});
            sample.clinicalData.forEach((clinicalData => {
                output.items[clinicalData.mutationalSignatureId] = output.items[clinicalData.mutationalSignatureId] || {};
                output.items[clinicalData.mutationalSignatureId][sampleId] = clinicalData.value;
                output.items[clinicalData.mutationalSignatureId].id = clinicalData.mutationalSignatureId;
            }))
        })

        return output;
    }

    public prepareData(sampleData: IMutationalSignature[]) :IMutationalSignatureRow[] {

        interface IMutationalSignatureRow {
            mutationalSignatureId:string;
            [key:string]:string;
        };

        const tableData: IMutationalSignatureRow[] = [];

        let sampleInvertedDataByMutationalSignature:Array<any> = _(sampleData)
            .groupBy(x => x.mutationalSignatureId)
            .map((value, key)  => ({mutationalSignatureId: key, samples: value}))
            .value();

        for (const mutationalSignature of sampleInvertedDataByMutationalSignature){
            let mutationalSignatureForRow: IMutationalSignatureRow = {mutationalSignatureId:""};
            mutationalSignatureForRow.mutationalSignatureId = mutationalSignature.mutationalSignatureId;
            for (const sample of mutationalSignature.samples){
                mutationalSignatureForRow[sample.sampleId] = sample.value;
            }
            tableData.push(mutationalSignatureForRow);
        }
        return tableData;
    }
}


