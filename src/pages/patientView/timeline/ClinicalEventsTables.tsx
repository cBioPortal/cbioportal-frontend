import React, { useEffect, useState } from 'react';
import { ClinicalDataBySampleId, ClinicalEvent } from 'cbioportal-ts-api-client';
import { groupTimelineData } from 'pages/patientView/timeline/timelineDataUtils';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import _ from 'lodash';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import { fetchPathologyTimelineEvents } from './pathologyTimelineUtils';

class EventsTable extends LazyMobXTable<{}> {}

function makeColumns(data: string[][]) {
    const headers = data[0];
    return data[0].map((item, i: number) => {
        return {
            name: item,
            render: (data: string[]) => {
                if (item === 'LINKOUT' && data[i]) {
                    const subtypeIndex = headers.indexOf('SUBTYPE');
                    const subtype =
                        subtypeIndex !== undefined && subtypeIndex >= 0
                            ? data[subtypeIndex]
                            : '';
                    return (
                        <a
                            href={data[i]}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {subtype === 'IHC'
                                ? 'Open IHC Slides'
                                : 'Open H&E Slides'}
                        </a>
                    );
                }
                return <span>{data[i]}</span>;
            },
            download: (data: string[]) => data[i],
            sortBy: (data: string[]) => data[i],
            filter: (
                txt: string,
                filterString: string,
                filterStringUpper: string
            ) =>
                txt
                    ?.toString()
                    .toUpperCase()
                    .includes(filterStringUpper),
        };
    });
}

const ClinicalEventsTables: React.FunctionComponent<{
    clinicalEvents: ClinicalEvent[];
    patientId: string;
    studyId: string;
    samples: ClinicalDataBySampleId[];
}> = function({ clinicalEvents, patientId, studyId, samples }) {
    const [augmentedEvents, setAugmentedEvents] =
        useState<ClinicalEvent[]>(clinicalEvents);

    useEffect(() => {
        let cancelled = false;

        async function augmentClinicalEvents() {
            const tileServerBase = getServerConfig().msk_wsi_tile_server_url;
            let pathologyEvents: ClinicalEvent[] = [];

            if (patientId && studyId) {
                try {
                    pathologyEvents = await fetchPathologyTimelineEvents(
                        tileServerBase,
                        patientId,
                        studyId,
                        samples
                    );
                } catch (error) {
                    console.warn(
                        'Failed to load pathology timeline data for clinical event tables',
                        error
                    );
                }
            }

            if (!cancelled) {
                setAugmentedEvents(clinicalEvents.concat(pathologyEvents));
            }
        }

        void augmentClinicalEvents();

        return () => {
            cancelled = true;
        };
    }, [clinicalEvents, patientId, samples, studyId]);

    const data = groupTimelineData(augmentedEvents);

    return (
        <div>
            {_.map(data, (dataCategory: string[][], key: string) => {
                // remove PATIENT_ID column since it is redundant
                const hiddenColumnIndex = dataCategory[0].reduce(
                    (aggr: number[], item: string, i) => {
                        if (['PATIENT_ID'].includes(item)) {
                            aggr.push(i);
                        }
                        if (/^STYLE_/.test(item)) {
                            aggr.push(i);
                        }
                        return aggr;
                    },
                    []
                );

                const cleanedDataCategory = dataCategory.map((row, i) => {
                    return row.filter((item, i) => {
                        return !hiddenColumnIndex.includes(i);
                    });
                });

                return (
                    <>
                        <h3
                            className={'pull-left'}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {key.toLowerCase()}
                        </h3>
                        <EventsTable
                            data={cleanedDataCategory.slice(1)}
                            columns={makeColumns(cleanedDataCategory)}
                            showPagination={false}
                            showColumnVisibility={false}
                            showFilter={true}
                            showCopyDownload={
                                getServerConfig()
                                    .skin_hide_download_controls ===
                                DownloadControlOption.SHOW_ALL
                            }
                        />
                    </>
                );
            })}
        </div>
    );
};

export default ClinicalEventsTables;
