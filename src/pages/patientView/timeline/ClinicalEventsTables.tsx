import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { groupTimelineData } from 'pages/patientView/timeline/timelineDataUtils';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import _ from 'lodash';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import {
    PATHOLOGY_SLIDES_EVENT_TYPE,
    pathologySlideOpenPath,
    withoutPathologySlideLinkouts,
} from './pathologySlidesTimeline';

class EventsTable extends LazyMobXTable<{}> {}

/** A PATHOLOGY SLIDES LINKOUT as a link to the Pathology Slides tab. */
function renderPathologySlidesLinkout(value: string) {
    const path = pathologySlideOpenPath({
        attributes: [{ key: 'LINKOUT', value }],
    });
    return path ? <Link to={path}>Open slides</Link> : <span>{value}</span>;
}

function makeColumns(data: string[][], eventType: string) {
    return data[0].map((item, i: number) => {
        const linkout =
            item === 'LINKOUT' &&
            eventType.toUpperCase() === PATHOLOGY_SLIDES_EVENT_TYPE;
        return {
            name: item,
            render: (data: string[]) =>
                linkout ? (
                    renderPathologySlidesLinkout(data[i])
                ) : (
                    <span>{data[i]}</span>
                ),
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
    /**
     * Links PATHOLOGY SLIDES events to the Pathology Slides tab; set only
     * when that tab is shown. Unset, their LINKOUT is left out.
     */
    linkPathologySlides?: boolean;
}> = function({ clinicalEvents, linkPathologySlides }) {
    const data = groupTimelineData(
        linkPathologySlides
            ? clinicalEvents
            : withoutPathologySlideLinkouts(clinicalEvents)
    );

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
                            columns={makeColumns(cleanedDataCategory, key)}
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
