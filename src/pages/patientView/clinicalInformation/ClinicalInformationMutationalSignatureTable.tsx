import * as React from "react";
import {ClinicalAttribute, ClinicalData} from "../../../shared/api/generated/CBioPortalAPI";
import LazyMobXTable, {Column} from "shared/components/lazyMobXTable/LazyMobXTable";
import styles from './style/mutationalSignatureTable.module.scss';
import {SHOW_ALL_PAGE_SIZE} from "../../../shared/components/paginationControls/PaginationControls";
import {IMutationalSignature} from "../../../shared/model/MutationalSignature";
import convertSamplesData, {IConvertedSamplesData} from "./lib/convertSamplesData";
import {getMutSigPercentage} from "../../../shared/lib/FormatUtils";
import _ from 'lodash';
import {labelMobxPromises} from "mobxpromise";

export interface IClinicalInformationMutationalSignatureTableProps {
    data: IMutationalSignature[];
    showTitleBar: boolean;
    cssClass?:string;
    showFilter?:boolean;
    showCopyDownload?:boolean;
}

class MutationalSignatureTable extends LazyMobXTable<IMutationalSignatureRow> {}

interface IMutationalSignatureRow {
    mutationalSignatureId:string;
    sampleValues:{
        [uniqueSampleKey: string]: { //each element in the row will contain data about exposure and confidence
            value: number
            confidence: number
        }
    };
}

export function prepareDataForTable(mutationalSignatureData: IMutationalSignature[]):IMutationalSignatureRow[] {

    const tableData: IMutationalSignatureRow[] = [];

    //group data by mutational signature
    //[{id: mutationalsignatureid, samples: [{}, {}]}]
    let sampleInvertedDataByMutationalSignature:Array<any> = _(mutationalSignatureData)
        .groupBy(mutationalSignatureSample => mutationalSignatureSample.mutationalSignatureId)
        .map((mutationalSignatureSampleData, mutationalSignatureId)  => ({id: mutationalSignatureId, samples: mutationalSignatureSampleData}))
        .value();

    for (const mutationalSignature of sampleInvertedDataByMutationalSignature){
        let mutationalSignatureRowForTable: IMutationalSignatureRow = {mutationalSignatureId:"", sampleValues: {}};
        mutationalSignatureRowForTable.mutationalSignatureId = mutationalSignature.id;
        for (const sample of mutationalSignature.samples){
            mutationalSignatureRowForTable.sampleValues[sample.uniqueSampleKey] =
                {value: sample.value,
                confidence: sample.confidence};
        }
        tableData.push(mutationalSignatureRowForTable);
    }
    return tableData;
}

export default class ClinicalInformationMutationalSignatureTable extends React.Component<IClinicalInformationMutationalSignatureTableProps, {}> {

    public render() {
        const uniqueSamples = _.map(_.uniqBy(this.props.data, "uniqueSampleKey"), (uniqSample => ({id: uniqSample.uniqueSampleKey})));
        const tableData = prepareDataForTable(this.props.data);
        const firstCol = 'mutationalSignatureId';
        const columns:Column<IMutationalSignatureRow>[] = [{
            name: "Mutational Signature",
            render: (data:IMutationalSignatureRow)=><span>{data[firstCol]}</span>,
            download: (data: IMutationalSignatureRow) => `${data[firstCol]}`,
            filter: (data: IMutationalSignatureRow, filterString: string, filterStringUpper: string) =>
                (data[firstCol].toString().toUpperCase().indexOf(filterStringUpper) > -1),
            sortBy: (data)=> Number(data[firstCol].slice(21)) //slice off "mutational_signature_" and convert to a number
        }, ...uniqueSamples.map((col) => (
            {
                name: col.id,
                render: (data: IMutationalSignatureRow) => (data.sampleValues[col.id].confidence > 0.85) ? //if confidence of mutsig sample is greater than 0.85, bold the exposure
                    <span className={styles.mutationalSignatureValue}>{getMutSigPercentage(data.sampleValues[col.id].value)}</span> :
                    <span>{getMutSigPercentage(data.sampleValues[col.id].value)}</span>,
                download: (data: IMutationalSignatureRow) => `${getMutSigPercentage(data.sampleValues[col.id].value)}`,
                filter: (data: IMutationalSignatureRow, filterString: string, filterStringUpper: string) =>
                    (data.sampleValues[col.id].value.toString().toUpperCase().indexOf(filterStringUpper) > -1),
                sortBy: (data: IMutationalSignatureRow) => data.sampleValues[col.id].value//Number(data.sampleValues[col.id].value.match(/\d+/g)) //extracts digits out of format like 5%
            }
        ))];
        return <MutationalSignatureTable
            columns={columns}
            data={tableData}
            className={styles.mutationalSignatureTable}
            showPagination={false}
            initialItemsPerPage={SHOW_ALL_PAGE_SIZE}
            showColumnVisibility={false}
            initialSortColumn="attribute"
            initialSortDirection="asc"
        />;
    }
}


