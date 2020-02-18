import _ from 'lodash';
import classnames from 'classnames';
import * as React from 'react';
import ReactTable, { Column } from 'react-table';
import { computed } from 'mobx';
import { observer } from 'mobx-react';

import { Cache, MobxCache } from '../../model/MobxCache';
import { PostTranslationalModification } from '../../model/PostTranslationalModification';
import PtmReferenceList from './PtmReferenceList';

export type PtmSummaryTableProps = {
    data: PostTranslationalModification[];
    pubMedCache?: MobxCache;
    initialSortColumn?: string;
    initialSortDirection?: 'asc' | 'desc';
    initialItemsPerPage?: number;
};

@observer
export default class PtmAnnotationTable extends React.Component<PtmSummaryTableProps, {}> {
    public static defaultProps = {
        data: [],
        initialSortColumn: 'type',
        initialSortDirection: 'asc',
        initialItemsPerPage: 10,
    };

    @computed
    get pmidData(): Cache {
        if (this.props.pubMedCache) {
            this.props.data.forEach(ptm =>
                ptm.pubmedIds.forEach((id: string) => this.props.pubMedCache!.get(Number(id)))
            );
        }

        return (this.props.pubMedCache && this.props.pubMedCache.cache) || {};
    }

    @computed
    get columns(): Column[] {
        const pubmedRender = !_.isEmpty(this.pmidData)
            ? (props: { original: PostTranslationalModification }) => (
                  <PtmReferenceList pmidData={this.pmidData} pubmedIds={props.original.pubmedIds} />
              )
            : () => (this.props.pubMedCache ? <i className="fa fa-spinner fa-pulse" /> : null);

        return [
            {
                id: 'position',
                accessor: 'position',
                Header: 'Position',
                Cell: (props: { original: PostTranslationalModification }) => (
                    <div style={{ textAlign: 'right' }}>{props.original.position}</div>
                ),
                maxWidth: 64,
            },
            {
                id: 'type',
                accessor: 'type',
                Header: 'Type',
                minWidth: 140,
            },
            {
                id: 'pubmedIds',
                Header: '',
                Cell: pubmedRender,
                sortable: false,
                maxWidth: 32,
            },
        ];
    }

    public render() {
        const { data, initialSortColumn, initialSortDirection, initialItemsPerPage } = this.props;

        const showPagination =
            data.length >
            (this.props.initialItemsPerPage || PtmAnnotationTable.defaultProps.initialItemsPerPage);

        return (
            <div className={classnames('cbioportal-frontend', 'default-track-tooltip-table')}>
                <ReactTable
                    data={data}
                    columns={this.columns}
                    defaultSorted={[
                        {
                            id:
                                initialSortColumn ||
                                PtmAnnotationTable.defaultProps.initialSortColumn,
                            desc: initialSortDirection === 'desc',
                        },
                    ]}
                    defaultPageSize={
                        data.length > initialItemsPerPage! ? initialItemsPerPage : data.length
                    }
                    showPagination={showPagination}
                    showPaginationTop={true}
                    showPaginationBottom={false}
                    className="-striped -highlight"
                    previousText="<"
                    nextText=">"
                />
            </div>
        );
    }
}
