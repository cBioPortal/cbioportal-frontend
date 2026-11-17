import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { groupTimelineData } from 'pages/patientView/timeline/timelineDataUtils';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import _ from 'lodash';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import {
    IsPatientSample,
    PATHOLOGY_SLIDES_EVENT_TYPE,
    pathologySlideOpenLink,
    PathologySlidesPatient,
    withoutPathologySlideLinkouts,
} from './pathologySlidesTimeline';

class EventsTable extends LazyMobXTable<{}> {}

/** Where the Clinical Data table's PATHOLOGY SLIDES links lead. */
interface PathologySlidesLinking {
    patient: PathologySlidesPatient;
    isPatientSample: IsPatientSample;
}

/**
 * A PATHOLOGY SLIDES row's LINKOUT as a link to the Pathology Slides tab,
 * read with the row's other columns (IMAGE_COUNT, SUBTYPE, SAMPLE_ID, ...)
 * like the timeline tooltip's link. Anything else is shown as text.
 */
function renderPathologySlidesLinkout(
    header: string[],
    row: string[],
    linkoutIndex: number,
    linking: PathologySlidesLinking
) {
    const link = pathologySlideOpenLink(
        { attributes: header.map((key, i) => ({ key, value: row[i] })) },
        linking.patient,
        linking.isPatientSample
    );
    return link ? (
        <Link to={link.path} aria-label={link.label}>
            Open slides
        </Link>
    ) : (
        <span>{row[linkoutIndex]}</span>
    );
}

function makeColumns(
    data: string[][],
    eventType: string,
    linking: PathologySlidesLinking | undefined
) {
    const header = data[0];
    return header.map((item, i: number) => {
        const linkout =
            linking &&
            item.toUpperCase() === 'LINKOUT' &&
            eventType.toUpperCase() === PATHOLOGY_SLIDES_EVENT_TYPE;
        return {
            name: item,
            render: (data: string[]) =>
                linkout ? (
                    renderPathologySlidesLinkout(header, data, i, linking!)
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
     * The patient whose Pathology Slides tab PATHOLOGY SLIDES events link to;
     * set only when that tab is shown. Unset, their LINKOUT is left out.
     */
    pathologySlides?: PathologySlidesPatient;
    /** The patient's samples, named in the slide links' accessible names. */
    sampleIds?: string[];
}> = function({ clinicalEvents, pathologySlides, sampleIds }) {
    const data = groupTimelineData(
        pathologySlides
            ? clinicalEvents
            : withoutPathologySlideLinkouts(clinicalEvents)
    );
    const linking: PathologySlidesLinking | undefined = pathologySlides && {
        patient: pathologySlides,
        isPatientSample: sampleId => (sampleIds || []).includes(sampleId),
    };

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
                            columns={makeColumns(
                                cleanedDataCategory,
                                key,
                                linking
                            )}
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
