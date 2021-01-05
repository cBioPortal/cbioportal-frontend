import { FrequencyCell } from 'cbioportal-frontend-commons';
import {
    formatFrequencyValue,
    ISignalTumorTypeDecomposition,
} from 'cbioportal-utils';
import _ from 'lodash';
import { computed } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { defaultSortMethod } from 'react-mutation-mapper';
import ReactTable from 'react-table';

import 'react-table/react-table.css';
import './FrequencyTable.css';

interface ITumorTypeFrequencyTableProps {
    data: ISignalTumorTypeDecomposition[];
}

function renderPercentage(cellProps: any) {
    return <FrequencyCell frequency={cellProps.value} />;
}

function renderNumber(cellProps: any, fractionDigits?: number) {
    let displayValue;
    if (cellProps.value !== null) {
        if (fractionDigits) {
            displayValue = cellProps.value.toFixed(fractionDigits);
        } else {
            displayValue = cellProps.value;
        }
    } else {
        displayValue = '-';
    }
    return <span className="pull-right mr-1">{displayValue}</span>;
}

function renderFrequency(cellProps: any) {
    const displayValue =
        cellProps.value === 0 ? 0 : formatFrequencyValue(cellProps.value);
    return <span className="pull-right mr-1">{displayValue}</span>;
}

function renderTextData(cellProps: any) {
    return (
        <span className="pull-left ml-2">{_.upperFirst(cellProps.value)}</span>
    );
}

@observer
class MutationTumorTypeFrequencyTable extends React.Component<
    ITumorTypeFrequencyTableProps
> {
    @computed
    private get defaultPageSize() {
        if (this.props.data.length > 10) {
            return 10;
        } else if (this.props.data.length === 0) {
            return 1;
        } else {
            return this.props.data.length;
        }
    }

    public render() {
        return (
            <div>
                <ReactTable
                    data={this.props.data}
                    columns={[
                        {
                            id: 'tumorType',
                            Cell: renderTextData,
                            Header: (
                                <span className="text-wrap">Tumor type</span>
                            ),
                            accessor: 'tumorType',
                            minWidth: 200,
                        },
                        {
                            id: 'mutationStatus',
                            Cell: renderTextData,
                            Header: (
                                <span className="text-wrap">
                                    Mutation Status
                                </span>
                            ),
                            accessor: 'mutationStatus',
                            maxWidth: 80,
                        },
                        {
                            id: 'sampleCount',
                            Cell: renderNumber,
                            Header: (
                                <span className="text-wrap"># Samples</span>
                            ),
                            accessor: 'tumorTypeCount',
                            maxWidth: 90,
                        },
                        {
                            id: 'variantCount',
                            Cell: renderNumber,
                            Header: (
                                <span className="text-wrap"># Variants</span>
                            ),
                            accessor: 'variantCount',
                            maxWidth: 90,
                        },
                        {
                            id: 'frequency',
                            Cell: renderPercentage,
                            Header: (
                                <span className="text-wrap">% Prevalence</span>
                            ),
                            accessor: 'frequency',
                            sortMethod: defaultSortMethod,
                            maxWidth: 100,
                        },
                        {
                            id: 'biallelicRatio',
                            Cell: renderPercentage,
                            Header: (
                                <span className="text-wrap">% Biallelic</span>
                            ),
                            accessor: 'biallelicRatio',
                            sortMethod: defaultSortMethod,
                            maxWidth: 90,
                        },
                        {
                            id: 'nPrevalence',
                            Cell: renderNumber,
                            Header: (
                                <span className="text-wrap">N Prevalence</span>
                            ),
                            sortMethod: defaultSortMethod,
                            accessor: 'nCancerTypeCount',
                            maxWidth: 100,
                        },
                        {
                            id: 'medianAgeAtDx',
                            Cell: renderNumber,
                            Header: (
                                <span className="text-wrap">
                                    Median Age at Dx
                                </span>
                            ),
                            sortMethod: defaultSortMethod,
                            accessor: 'ageAtDx',
                            maxWidth: 90,
                        },
                        {
                            id: 'medianTMB',
                            Cell: (column: any) => {
                                return renderNumber(column, 1);
                            },
                            Header: (
                                <span className="text-wrap">Median TMB</span>
                            ),
                            sortMethod: defaultSortMethod,
                            accessor: 'tmb',
                            maxWidth: 90,
                        },
                        {
                            id: 'msiScore',
                            Cell: renderNumber,
                            Header: (
                                <span className="text-wrap">MSI Score</span>
                            ),
                            sortMethod: defaultSortMethod,
                            accessor: 'msiScore',
                            maxWidth: 90,
                        },
                        {
                            id: 'medianHRDLST',
                            Cell: renderNumber,
                            Header: (
                                <span className="text-wrap">
                                    Median HRD LST
                                </span>
                            ),
                            sortMethod: defaultSortMethod,
                            accessor: 'lst',
                            maxWidth: 100,
                        },
                        {
                            id: 'medianHRDNtelomericAI',
                            Cell: renderNumber,
                            Header: (
                                <span className="text-wrap">
                                    Median HRD ntelomeric AI
                                </span>
                            ),
                            sortMethod: defaultSortMethod,
                            accessor: 'ntelomericAi',
                            maxWidth: 100,
                        },
                        {
                            id: 'medianHRDFractionLOH',
                            Cell: renderFrequency,
                            Header: (
                                <span className="text-wrap">
                                    Median HRD Fraction LOH %
                                </span>
                            ),
                            sortMethod: defaultSortMethod,
                            accessor: 'fractionLoh',
                            maxWidth: 120,
                        },
                    ]}
                    defaultSorted={[
                        {
                            id: 'frequency',
                            desc: true,
                        },
                    ]}
                    defaultSortDesc={true}
                    defaultPageSize={this.defaultPageSize}
                    showPagination={
                        this.defaultPageSize !== this.props.data.length
                    }
                    minRows={0}
                    className="-striped -highlight"
                    previousText="<"
                    nextText=">"
                />
            </div>
        );
    }
}

export default MutationTumorTypeFrequencyTable;
