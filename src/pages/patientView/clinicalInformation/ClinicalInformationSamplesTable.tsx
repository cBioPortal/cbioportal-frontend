import * as React from 'react';
import convertSamplesData, {
    IConvertedSamplesData,
} from './lib/convertSamplesData';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import {
    ClinicalAttribute,
    ClinicalDataBySampleId,
} from 'cbioportal-ts-api-client';
import styles from './style/sampleTable.module.scss';
import { SHOW_ALL_PAGE_SIZE } from '../../../shared/components/paginationControls/PaginationControls';
import { sortByClinicalAttributePriorityThenName } from '../../../shared/lib/SortUtils';
import { DownloadControlOption, isUrl } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import { getClinicalAttributeDisplayName } from 'shared/lib/ClinicalAttributeDisplay';

interface IClinicalInformationSamplesTableProps {
    samples?: ClinicalDataBySampleId[];
}

export interface ISampleRow {
    attribute: string;
    [key: string]: string | number | ClinicalAttribute;
}

function isHiddenSampleClinicalAttribute(attributeId: string) {
    return attributeId === 'HAS_WSI_SLIDE' || attributeId.startsWith('WSI_');
}

class SampleTableComponent extends LazyMobXTable<ISampleRow> {}

export default class ClinicalInformationSamplesTable extends React.Component<
    IClinicalInformationSamplesTableProps,
    {}
> {
    public render() {
        const sampleInvertedData = convertSamplesData(this.props.samples);
        const tableData = this.prepareData(sampleInvertedData);
        const columns: Column<ISampleRow>[] = [
            { id: 'attribute' },
            ...sampleInvertedData.columns,
        ].map(col => ({
            name: col.id,
            render: (data: ISampleRow) => {
                if (isUrl(data[col.id] as any)) {
                    return (
                        <a href={data[col.id] as any} target="_blank">
                            {data[col.id] as any}
                        </a>
                    );
                }
                return (
                    <span style={{ whiteSpace: 'pre-wrap' }}>
                        {data[col.id] as any}
                    </span>
                );
            },
            download: (data: ISampleRow) => `${data[col.id]}`,
            filter: (
                data: ISampleRow,
                filterString: string,
                filterStringUpper: string
            ) =>
                data[col.id]
                    .toString()
                    .toUpperCase()
                    .indexOf(filterStringUpper) > -1,
        }));
        columns[0].sortBy = data => data.attribute;
        return (
            <SampleTableComponent
                columns={columns}
                data={tableData}
                className={styles.sampleTable}
                showPagination={false}
                initialItemsPerPage={SHOW_ALL_PAGE_SIZE}
                showColumnVisibility={false}
                showCopyDownload={
                    getServerConfig().skin_hide_download_controls ===
                    DownloadControlOption.SHOW_ALL
                }
            />
        );
    }

    public prepareData(sampleInvertedData: IConvertedSamplesData) {
        const rowDataList = Object.values(sampleInvertedData.items)
            .filter(rowData => !isHiddenSampleClinicalAttribute(rowData.id))
            .sort((a: any, b: any) =>
                sortByClinicalAttributePriorityThenName(
                    a.clinicalAttribute,
                    b.clinicalAttribute
                )
            );
        const tableData = new Array<ISampleRow>(rowDataList.length);

        for (let rowIndex = 0; rowIndex < rowDataList.length; rowIndex += 1) {
            const rowData = rowDataList[rowIndex];
            const row: ISampleRow = {
                attribute: getClinicalAttributeDisplayName(
                    rowData.clinicalAttribute
                ),
            };

            for (
                let columnIndex = 0;
                columnIndex < sampleInvertedData.columns.length;
                columnIndex += 1
            ) {
                const columnId = sampleInvertedData.columns[columnIndex].id;
                row[columnId] =
                    columnId in rowData ? (rowData[columnId] as string) : 'n/a';
            }

            tableData[rowIndex] = row;
        }

        return tableData;
    }
}
