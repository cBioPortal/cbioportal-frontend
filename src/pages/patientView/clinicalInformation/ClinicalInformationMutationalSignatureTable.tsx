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
import Tooltip from 'rc-tooltip';
import FeatureInstruction from 'shared/FeatureInstruction/FeatureInstruction';
import autobind from 'autobind-decorator';
import { MutationalSignatureTableDataStore } from '../mutationalSignatures/MutationalSignaturesDataStore';
import PatientViewUrlWrapper from 'pages/patientView/PatientViewUrlWrapper';
export interface IClinicalInformationMutationalSignatureTableProps {
    data: IMutationalSignature[];
    parentCallback: (
        childData: string,
        visibility: boolean,
        updateReference: boolean
    ) => void;
    dataStore: MutationalSignatureTableDataStore;
    url: string;
    signature: string;
    description: string;
    samples: string[];
}

class MutationalSignatureTable extends LazyMobXTable<IMutationalSignatureRow> {}

export interface IMutationalSignatureRow {
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
    samplesInData: string[]
): IMutationalSignatureRow[] {
    const tableData: IMutationalSignatureRow[] = [];
    //group data by mutational signature
    //[{id: mutationalsignatureid, samples: [{}, {}]}]
    const sampleInvertedDataByMutationalSignature: Array<any> = _(
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
        if (
            Object.keys(mutationalSignature.samples).length ===
            samplesInData.length
        ) {
            for (const sample of mutationalSignature.samples) {
                mutationalSignatureRowForTable.sampleValues[sample.sampleId] = {
                    value: sample.value,
                    confidence: sample.confidence,
                };
            }
            tableData.push(mutationalSignatureRowForTable);
        } else {
            for (const sampleId of samplesInData) {
                if (
                    mutationalSignature.samples.some(
                        (obj: IMutationalSignature) => obj.sampleId === sampleId
                    )
                ) {
                    // Sample exists and we can use the values
                    for (const sample of mutationalSignature.samples) {
                        mutationalSignatureRowForTable.sampleValues[
                            sample.sampleId
                        ] = {
                            value: sample.value,
                            confidence: sample.confidence,
                        };
                    }
                } else {
                    mutationalSignatureRowForTable.sampleValues[sampleId] = {
                        value: 0,
                        confidence: 1,
                    };
                }
            }
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
    @observable selectedSignature = '';
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

    @autobind
    onMutationalSignatureTableRowClick(d: IMutationalSignatureRow) {
        const dSend = this.props.data.filter(x => x.meta.name === d.name);
        // select mutation and toggle off previous selected
        if (dSend.length) {
            this.props.dataStore.setSelectedMutSig(dSend);
            if (this.props.dataStore.selectedMutSig.length > 0) {
                this.props.dataStore.toggleSelectedMutSig(
                    this.props.dataStore.selectedMutSig[0]
                );
            }
            //this.handleLocusChange(d[0].gene.hugoGeneSymbol);
        }
        this.props.parentCallback(d.name, false, true);
    }

    @computed get tableData() {
        return prepareMutationalSignatureDataForTable(
            this.props.data,
            this.props.samples
        );
    }
    @computed get tooltipInfo() {
        return (
            <div
                style={{ maxWidth: 450 }}
                data-test="SignificantMutationalSignaturesTableTooltip"
            >
                <div>
                    <h4>
                        <b>Signature: </b>
                        {this.props.signature}
                    </h4>
                    <p style={{ fontSize: '16px' }}>
                        <b>Description: </b>
                        {this.props.description}
                    </p>
                    <p style={{ fontSize: '16px' }}>
                        <a href={this.props.url} target="_blank">
                            External link to signature (opens new tab)
                        </a>
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
                                    this.props.parentCallback(
                                        data.name,
                                        false,
                                        false
                                    )
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
            <div>
                <MutationalSignatureTable
                    columns={this.columns}
                    data={this.tableData}
                    showPagination={false}
                    initialItemsPerPage={SHOW_ALL_PAGE_SIZE}
                    showColumnVisibility={false}
                    initialSortColumn={this.uniqueSamples[0].id}
                    initialSortDirection="desc"
                    onRowClick={this.onMutationalSignatureTableRowClick}
                />
            </div>
        );
    }
}
