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
import { action, computed, makeObservable, observable } from 'mobx';
import { MUTATIONAL_SIGNATURES_SIGNIFICANT_PVALUE_THRESHOLD } from 'shared/lib/GenericAssayUtils/MutationalSignaturesUtils';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import Tooltip from 'rc-tooltip';

export interface IClinicalInformationMutationalSignatureTableProps {
    data: IMutationalSignature[];
    parentCallback: (childData: string, visibility: boolean) => void;
    url: string;
    signature: string;
    description: string;
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
    url: string;
}

export function prepareMutationalSignatureDataForTable(
    mutationalSignatureData: IMutationalSignature[],
    samples: { id: string }[]
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
            url: mutationalSignatureSampleData[0].meta.url,
        }))
        .value();
    for (const mutationalSignature of sampleInvertedDataByMutationalSignature) {
        let mutationalSignatureRowForTable: IMutationalSignatureRow = {
            name: '',
            sampleValues: {},
            url: '',
        };
        mutationalSignatureRowForTable.name = mutationalSignature.name;
        mutationalSignatureRowForTable.url = mutationalSignature.url;
        for (const sample of mutationalSignature.samples) {
            mutationalSignatureRowForTable.sampleValues[sample.sampleId] = {
                value: sample.value,
                confidence: sample.confidence,
            };
        }
        if (
            Object.keys(mutationalSignatureRowForTable.sampleValues).length ===
            samples.length
        ) {
            tableData.push(mutationalSignatureRowForTable);
        }
    }
    return tableData;
}
@observer
export default class ClinicalInformationMutationalSignatureTable extends React.Component<
    IClinicalInformationMutationalSignatureTableProps,
    {}
> {
    @observable selectedSignature: string;

    constructor(props: IClinicalInformationMutationalSignatureTableProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound getMutationalSignatureProfileData(
        e: React.MouseEvent<Element, MouseEvent>
    ): void {
        this.selectedSignature = e.currentTarget.innerHTML;
    }
    @computed get uniqueSamples() {
        return _.map(_.uniqBy(this.props.data, 'sampleId'), uniqSample => ({
            id: uniqSample.sampleId,
        }));
    }

    @computed get tableData() {
        return prepareMutationalSignatureDataForTable(
            this.props.data,
            this.uniqueSamples
        );
    }
    @computed get tooltipInfo() {
        return (
            <div
                style={{ maxWidth: 450 }}
                data-test="SignificantMutationalSignaturesTooltip"
            >
                <div>
                    <h4>
                        <b>Signature:</b>
                        {this.props.signature}
                    </h4>
                    <p>
                        <b>Description: </b>
                        {this.props.description}
                    </p>
                    <p>
                        {this.props.url != '' && (
                            <a href={this.props.url} target="_blank">
                                External link to signature (opens new tab)
                            </a>
                        )}
                        {this.props.url == '' &&
                            'No link to external website available'}
                    </p>
                </div>
            </div>
        );
    }
    readonly firstCol = 'name';
    @computed get columns(): Column<IMutationalSignatureRow>[] {
        return [
            {
                name: 'Mutational Signature',
                render: (data: IMutationalSignatureRow) => (
                    <Tooltip overlay={this.tooltipInfo}>
                        {
                            <span
                                onMouseOver={() =>
                                    this.props.parentCallback(data.name, false)
                                }
                            >
                                {data[this.firstCol]}
                            </span>
                        }
                    </Tooltip>
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
                    data.sampleValues[col.id].confidence ? (
                        data.sampleValues[col.id].confidence <
                        MUTATIONAL_SIGNATURES_SIGNIFICANT_PVALUE_THRESHOLD ? ( //if it's a significant signature, bold the contribution
                            // Based on significant pvalue the span is created with style.mutationalSignatureValue for bold (sign)
                            // or normal styling (not signficant)
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
                        )
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
                showCopyDownload={
                    getServerConfig().skin_hide_download_controls ===
                    DownloadControlOption.SHOW_ALL
                }
            />
        );
    }
}
