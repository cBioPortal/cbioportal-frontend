import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Sample } from 'cbioportal-ts-api-client';
import PatientViewMutationsDataStore from '../mutation/PatientViewMutationsDataStore';

import 'cbioportal-clinical-timeline/dist/styles.css';

import {
    configureTracks,
    ITimelineConfig,
    Timeline,
    TimelineStore,
    TimelineTrackSpecification,
} from 'cbioportal-clinical-timeline';

import { ClinicalEvent } from 'cbioportal-ts-api-client';
import SampleManager from 'pages/patientView/SampleManager';
import {
    buildBaseConfig,
    configureGenieTimeline,
    configureHtanOhsuTimeline,
    configureTimelineToxicityColors,
    sortTracks,
} from 'pages/patientView/timeline/timeline_helpers';
import { downloadZippedTracks } from './timelineDataUtils';
import { getServerConfig } from 'config/config';
import { fetchPathologyTimelineEvents } from './pathologyTimelineUtils';

export interface ISampleMetaDeta {
    color: { [sampleId: string]: string };
    index: { [sampleId: string]: number };
    label: { [sampleId: string]: string };
}

export interface ITimelineProps {
    dataStore: PatientViewMutationsDataStore;
    data: ClinicalEvent[];
    caseMetaData: ISampleMetaDeta;
    sampleManager: SampleManager;
    width: number;
    samples: Sample[];
    mutationProfileId: string;
    headerWidth?: number;
}

const TimelineWrapper: React.FunctionComponent<ITimelineProps> = observer(
    function({
        data,
        caseMetaData,
        sampleManager,
        width,
        headerWidth,
        samples,
    }: ITimelineProps) {
        const [store, setStore] = useState<TimelineStore | null>(null);

        useEffect(() => {
            let cancelled = false;

            async function buildTimeline() {
                let timelineData = data.slice();
                const tileServerBase = getServerConfig().msk_wsi_tile_server_url;
                const patientId = samples[0]?.patientId || data[0]?.patientId;
                const studyId = samples[0]?.studyId || data[0]?.studyId;

                if (
                    tileServerBase !== null &&
                    tileServerBase !== undefined &&
                    patientId &&
                    studyId
                ) {
                    try {
                        timelineData = timelineData.concat(
                            await fetchPathologyTimelineEvents(
                                tileServerBase,
                                patientId,
                                studyId,
                                sampleManager.samples
                            )
                        );
                    } catch (error) {
                        console.warn(
                            'Failed to load pathology timeline image counts',
                            error
                        );
                    }
                }

                const isGenieBpcStudy =
                    window.location.href.includes('genie_bpc');
                // This patient has hardcoded functionality for showing an image
                // icon (prototype). TODO: We can replace it once we have generalized
                // functionality for adding links to a timepoint.
                const isHtanOhsuPatient =
                    window.location.href.includes('htan_test_2021') &&
                    window.location.href.includes('HTA9_1');
                const isToxicityPortal = [
                    'triage.cbioportal.mskcc.org',
                    'cbioportal.mskcc.org',
                    'private.cbioportal.mskcc.org',
                ].includes(window.location.hostname);

                const baseConfig: ITimelineConfig = buildBaseConfig(
                    sampleManager,
                    caseMetaData
                );

                if (isGenieBpcStudy) {
                    configureGenieTimeline(baseConfig);
                }

                if (isHtanOhsuPatient) {
                    const extraData = {
                        uniquePatientKey: 'SFRBOV8xOmh0YW5fdGVzdF8yMDIx',
                        studyId: 'htan_test_2021',
                        patientId: 'HTA9_1',
                        eventType: 'IMAGING',
                        attributes: [
                            {
                                key: 'linkout',
                                value:
                                    'https://minerva-story-htan-ohsu-demo.surge.sh/#s=0#w=0#g=0#m=-1#a=-100_-100#v=0.5_0.5_0.5#o=-100_-100_1_1#p=Q',
                            },
                            { key: 'ASSAY_TYPE', value: 'mIHC' },
                            {
                                key: 'FILE_FORMAT',
                                value: 'OME-TIFF',
                            },
                        ],
                        startNumberOfDaysSinceDiagnosis: 25726,
                    };

                    // @ts-ignore
                    timelineData.push(extraData);

                    configureHtanOhsuTimeline(baseConfig);
                }

                if (isToxicityPortal) {
                    configureTimelineToxicityColors(baseConfig);
                }

                const trackSpecifications = sortTracks(baseConfig, timelineData);

                configureTracks(trackSpecifications, baseConfig);

                if (!cancelled) {
                    const store = new TimelineStore(trackSpecifications);
                    setStore(store);
                }
            }

            void buildTimeline();

            return () => {
                cancelled = true;
            };
        }, [caseMetaData, data, sampleManager, samples]);

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
