import { observer } from 'mobx-react';
import * as React from 'react';
import ReactTable from 'react-table';
import { ITrial } from '../../model/ClinicalTrial';
import { getTrialStatusColor } from './ClinicalTrialsUtil';
import { defaultSortMethod } from 'react-mutation-mapper';

type TrialsTableProps = {
    trials: ITrial[];
};

@observer
export default class ClinicalTrialsTable extends React.Component<
    TrialsTableProps
> {
    readonly columns = [
        {
            id: 'nctId',
            Header: (
                <span>
                    <b>ID</b>
                </span>
            ),
            accessor: 'nctId',
            maxWidth: 120,
            style: { textAlign: 'center' },
            sortMethod: (a: string, b: string) => defaultSortMethod(a, b),
            Cell: (props: { original: ITrial }) => (
                <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                    <a
                        href={`https://clinicaltrials.gov/ct2/show/${props.original.nctId}`}
                        target="_blank"
                    >
                        {props.original.nctId}
                    </a>
                    <br />
                    <span
                        style={getTrialStatusColor(
                            props.original.currentTrialStatus
                        )}
                    >
                        {props.original.currentTrialStatus}
                    </span>
                </div>
            ),
        },
        {
            id: 'briefTitle',
            Header: (
                <span>
                    <b>Title</b>
                </span>
            ),
            accessor: 'briefTitle',
            Cell: (props: { value: string }) => (
                <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                    {props.value}
                </div>
            ),
        },
    ];

    public render() {
        return (
            <div className="oncokb-treatment-table">
                <ReactTable
                    data={this.props.trials}
                    columns={this.columns}
                    showPagination={false}
                    pageSize={this.props.trials.length}
                    className="-striped -highlight"
                />
            </div>
        );
    }
}
