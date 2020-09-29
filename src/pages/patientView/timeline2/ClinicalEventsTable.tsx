import React from 'react';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { groupTimelineData } from 'pages/patientView/timeline2/timeline-data-utils';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import _ from 'lodash';
import { isUrl } from 'cbioportal-frontend-commons';
import styles from 'pages/patientView/clinicalInformation/style/patientTable.module.scss';
import { SHOW_ALL_PAGE_SIZE } from 'shared/components/paginationControls/PaginationControls';

class EventsTable extends LazyMobXTable<{}> {}

function makeColumns(data: string[][]) {
    return data[0].map((d, i: number) => {
        const txt = d;
        return {
            name: txt,
            render: (data: any) => <span>{data[i]}</span>,
            download: (data: any) => data[i],
            sortBy: (data: any) => data[i],
        };
    });
}

const ClinicalEventsTable: React.FunctionComponent<{
    clinicalEvents: ClinicalEvent[];
}> = function({ clinicalEvents }) {
    const data = groupTimelineData(clinicalEvents);

    return (
        <div>
            {_.map(data, (d: any, key: string) => {
                return (
                    <>
                        <h2
                            className={'pull-left'}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {key.toLowerCase()}
                        </h2>

                        <EventsTable
                            data={d.slice(1)}
                            columns={makeColumns(d)}
                            showPagination={false}
                            showColumnVisibility={false}
                            showFilter={false}
                            showCopyDownload={true}
                        />
                    </>
                );
            })}
        </div>
    );
};

export default ClinicalEventsTable;
