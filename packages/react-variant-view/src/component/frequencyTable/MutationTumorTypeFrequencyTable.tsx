import { FrequencyCell } from 'cbioportal-frontend-commons';
import { ISignalTumorTypeDecomposition } from 'cbioportal-utils';
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

function renderCount(cellProps: any) {
    return <span className="pull-right mr-1">{cellProps.value}</span>;
}

function renderTumorType(cellProps: any) {
    return <span className="pull-left ml-2">{cellProps.value}</span>;
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
                            Cell: renderTumorType,
                            Header: (
                                <span className="text-wrap">Tumor type</span>
                            ),
                            accessor: 'tumorType',
                            minWidth: 200,
                        },
                        {
                            id: 'sampleCount',
                            Cell: renderCount,
                            Header: (
                                <span className="text-wrap"># Samples</span>
                            ),
                            accessor: 'tumorTypeCount',
                            maxWidth: 100,
                        },
                        {
                            id: 'variantCount',
                            Cell: renderCount,
                            Header: (
                                <span className="text-wrap"># Variants</span>
                            ),
                            accessor: 'variantCount',
                            maxWidth: 100,
                        },
                        {
                            id: 'frequency',
                            Cell: renderPercentage,
                            Header: '% Prevalence',
                            accessor: 'frequency',
                            sortMethod: defaultSortMethod,
                            maxWidth: 100,
                        },
                        {
                            id: 'biallelicRatio',
                            Cell: renderPercentage,
                            Header: '% Biallelic',
                            accessor: 'biallelicRatio',
                            sortMethod: defaultSortMethod,
                            maxWidth: 100,
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
