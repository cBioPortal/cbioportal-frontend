import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react-lite';
import { Sample } from 'cbioportal-ts-api-client';
import PatientViewMutationsDataStore from '../mutation/PatientViewMutationsDataStore';

import 'cbioportal-clinical-timeline/dist/styles.css';

import {
    configureTracks,
    ITimelineConfig,
    Timeline,
    TimelineEvent,
    TimelineStore,
    TimelineTrackSpecification,
} from 'cbioportal-clinical-timeline';

import { ClinicalEvent } from 'cbioportal-ts-api-client';
import SampleManager from 'pages/patientView/SampleManager';
import {
    buildBaseConfig,
    configureGenieTimeline,
    configureTriageTimeline,
    sortTracks,
} from 'pages/patientView/timeline2/timeline_helpers';
import { downloadZippedTracks } from './timelineDataUtils';

export interface ISampleMetaDeta {
    color: { [sampleId: string]: string };
    index: { [sampleId: string]: number };
    label: { [sampleId: string]: string };
}

export interface ITimeline2Props {
    dataStore: PatientViewMutationsDataStore;
    data: ClinicalEvent[];
    caseMetaData: ISampleMetaDeta;
    sampleManager: SampleManager;
    width: number;
    samples: Sample[];
    mutationProfileId: string;
    headerWidth?: number;
}

const TimelineWrapper: React.FunctionComponent<ITimeline2Props> = observer(
    function({
        data,
        caseMetaData,
        sampleManager,
        width,
        headerWidth,
    }: ITimeline2Props) {
        const [events, setEvents] = useState<
            TimelineTrackSpecification[] | null
        >(null);

        const [store, setStore] = useState<TimelineStore | null>(null);

        useEffect(() => {
            const isGenieBpcStudy = window.location.href.includes('genie_bpc');
            const isTriagePortal =
                window.location.hostname === 'triage.cbioportal.mskcc.org';

            const baseConfig: ITimelineConfig = buildBaseConfig(
                sampleManager,
                caseMetaData
            );

            if (isGenieBpcStudy) {
                configureGenieTimeline(baseConfig);
            }

            if (isTriagePortal) {
                const extraData = {
                    uniquePatientKey: 'SFRBOV8xOmh0YW5fdGVzdF8yMDIx',
                    studyId: 'htan_test_2021',
                    patientId: 'HTA9_1',
                    eventType: 'IMAGING',
                    attributes: [
                        {
                            key: 'linkout',
                            value:
                                'https://minerva-story-htan-ohsu-demo.surge.sh/#s=1#w=1#g=6#m=-1#a=-100_-100#v=0.6178_0.57_0.6129#o=-100_-100_1_1#p=Q',
                        },
                        { key: 'ASSAY_TYPE', value: 'mIHC' },
                        {
                            key: 'FILE_FORMAT',
                            value: 'OME-TIFF',
                        },
                    ],
                    startNumberOfDaysSinceDiagnosis: 25726,
                };

                //e assay type to the tooltip (mIHC) and file format (OME-TIFF)

                // @ts-ignore
                data.push(extraData);

                configureTriageTimeline(baseConfig);
            }

            const trackSpecifications = sortTracks(baseConfig, data);

            configureTracks(trackSpecifications, baseConfig);

            const store = new TimelineStore(trackSpecifications);

            setStore(store);
        }, []);

        if (store) {
            return (
                <>
                    <div>
                        <div>
                            <Timeline
                                store={store}
                                width={width}
                                headerWidth={headerWidth}
                                onClickDownload={() =>
                                    downloadZippedTracks(data)
                                }
                            />
                        </div>
                    </div>
                </>
            );
        } else {
            return <div />;
        }
    }
);

export default TimelineWrapper;
