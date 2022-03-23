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
    }: ITimelineProps) {
        const [events, setEvents] = useState<
            TimelineTrackSpecification[] | null
        >(null);

        const [store, setStore] = useState<TimelineStore | null>(null);

        useEffect(() => {
            const isGenieBpcStudy = window.location.href.includes('genie_bpc');
            // This patient has hardcoded functionality for showing an image
            // icon (prototype). TODO: We can replace it once we have generalized
            // functionality for adding links to a timepoint.
            const isHtanOhsuPatient =
                window.location.href.includes('brca_hta9_htan_2022') &&
                window.location.href.includes('HTA9_1');
            const isToxicityPortal = [
                'deploy-preview-4209--cbioportalfrontend.netlify.app',
                'www.cbioportal.org',
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
                    studyId: 'brca_hta9_htan_2022',
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

                // @ts-ignore
                data.push(extraData);

                configureHtanOhsuTimeline(baseConfig);
            }

            if (isToxicityPortal) {
                configureTimelineToxicityColors(baseConfig);
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
