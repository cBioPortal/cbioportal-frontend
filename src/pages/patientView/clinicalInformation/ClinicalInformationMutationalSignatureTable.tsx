import * as React from 'react';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import styles from './style/mutationalSignatureTable.module.scss';
import { SHOW_ALL_PAGE_SIZE } from '../../../shared/components/paginationControls/PaginationControls';
import { IMutationalSignature } from '../../../shared/model/MutationalSignature';
import { getMutationalSignaturePercentage } from '../../../shared/lib/FormatUtils';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import { MUTATIONAL_SIGNATURES_SIGNIFICANT_PVALUE_THRESHOLD } from 'shared/lib/GenericAssayUtils/MutationalSignaturesUtils';

export interface IClinicalInformationMutationalSignatureTableProps {
    data: IMutationalSignature[];
}

class MutationalSignatureTable extends LazyMobXTable<IMutationalSignatureRow> {}

interface IMutationalSignatureRow {
    name: string;
    sampleValues: {
        [sampleId: string]: {
            //each element in the row will contain data about contribution and confidence
            value: number;
            confidence: number;
        };
    };
}

export function prepareMutationalSignatureDataForTable(
    mutationalSignatureData: IMutationalSignature[]
): IMutationalSignatureRow[] {
    const tableData: IMutationalSignatureRow[] = [];

    //group data by mutational signature
    //[{id: mutationalsignatureid, samples: [{}, {}]}]
    let sampleInvertedDataByMutationalSignature: Array<any> = _(
        mutationalSignatureData
    )
        .groupBy(
            mutationalSignatureSample => mutationalSignatureSample.meta.name
        )
        .map((mutationalSignatureSampleData, name) => ({
            name,
            samples: mutationalSignatureSampleData,
        }))
        .value();

    for (const mutationalSignature of sampleInvertedDataByMutationalSignature) {
        let mutationalSignatureRowForTable: IMutationalSignatureRow = {
            name: '',
            sampleValues: {},
        };
        mutationalSignatureRowForTable.name = mutationalSignature.name;
        for (const sample of mutationalSignature.samples) {
            mutationalSignatureRowForTable.sampleValues[sample.sampleId] = {
                value: sample.value,
                confidence: sample.confidence,
            };
        }
        tableData.push(mutationalSignatureRowForTable);
    }
    return tableData;
}

@observer
export default class ClinicalInformationMutationalSignatureTable extends React.Component<
    IClinicalInformationMutationalSignatureTableProps,
    {}
> {
    constructor(props: IClinicalInformationMutationalSignatureTableProps) {
        super(props);
        makeObservable(this);
    }

    @computed get uniqueSamples() {
        return _.map(_.uniqBy(this.props.data, 'sampleId'), uniqSample => ({
            id: uniqSample.sampleId,
        }));
    }

    @computed get tableData() {
        return prepareMutationalSignatureDataForTable(this.props.data);
    }
    readonly firstCol = 'name';
    @computed get columns(): Column<IMutationalSignatureRow>[] {
        return [
            {
                name: 'Mutational Signature',
                render: (data: IMutationalSignatureRow) => (
                    <span>{data[this.firstCol]}</span>
                ),
                download: (data: IMutationalSignatureRow) =>
                    `${data[this.firstCol]}`,
                filter: (
                    data: IMutationalSignatureRow,
                    filterString: string,
                    filterStringUpper: string
                ) =>
                    data[this.firstCol]
                        .toString()
                        .toUpperCase()
                        .indexOf(filterStringUpper) > -1,
                sortBy: (data: IMutationalSignatureRow) => data[this.firstCol],
            },
            ...this.uniqueSamples.map(col => ({
                name: col.id,
                render: (data: IMutationalSignatureRow) =>
                    data.sampleValues[col.id].confidence <
                    MUTATIONAL_SIGNATURES_SIGNIFICANT_PVALUE_THRESHOLD ? ( //if it's a significant signature, bold the contribution
                        <span className={styles.mutationalSignatureValue}>
                            {getMutationalSignaturePercentage(
                                data.sampleValues[col.id].value
                            )}
                        </span>
                    ) : (
                        <span>
                            {getMutationalSignaturePercentage(
                                data.sampleValues[col.id].value
                            )}
                        </span>
                    ),
                download: (data: IMutationalSignatureRow) =>
                    `${getMutationalSignaturePercentage(
                        data.sampleValues[col.id].value
                    )}`,
                filter: (
                    data: IMutationalSignatureRow,
                    filterString: string,
                    filterStringUpper: string
                ) =>
                    getMutationalSignaturePercentage(
                        data.sampleValues[col.id].value
                    )
                        .toUpperCase()
                        .indexOf(filterStringUpper) > -1,
                sortBy: (data: IMutationalSignatureRow) =>
                    data.sampleValues[col.id].value,
            })),
        ];
    }

    public render() {
        return (
            <MutationalSignatureTable
                columns={this.columns}
                data={this.tableData}
                showPagination={false}
                initialItemsPerPage={SHOW_ALL_PAGE_SIZE}
                showColumnVisibility={false}
                initialSortColumn={this.uniqueSamples[0].id}
                initialSortDirection="desc"
            />
        );
    }
}
