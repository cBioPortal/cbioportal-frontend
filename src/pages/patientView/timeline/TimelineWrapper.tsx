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
import usePathologyAugmentedClinicalEvents from './usePathologyAugmentedClinicalEvents';

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

interface ITimelinePortalFlags {
    isGenieBpcStudy: boolean;
    isHtanOhsuPatient: boolean;
    isToxicityPortal: boolean;
}

const HTAN_OHSU_EXTRA_EVENT: ClinicalEvent = {
    uniquePatientKey: 'SFRBOV8xOmh0YW5fdGVzdF8yMDIx',
    uniqueSampleKey: '',
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
    endNumberOfDaysSinceDiagnosis: 25726,
    startNumberOfDaysSinceDiagnosis: 25726,
};

function getTimelinePortalFlags(location: Location): ITimelinePortalFlags {
    return {
        isGenieBpcStudy: location.href.includes('genie_bpc'),
        isHtanOhsuPatient:
            location.href.includes('htan_test_2021') &&
            location.href.includes('HTA9_1'),
        isToxicityPortal: [
            'triage.cbioportal.mskcc.org',
            'cbioportal.mskcc.org',
            'private.cbioportal.mskcc.org',
        ].includes(location.hostname),
    };
}

export function getTimelineDataWithPortalExtras(
    timelineData: ClinicalEvent[],
    isHtanOhsuPatient: boolean
): ClinicalEvent[] {
    return isHtanOhsuPatient
        ? timelineData.concat(HTAN_OHSU_EXTRA_EVENT)
        : timelineData;
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
        const patientId = samples[0]?.patientId || data[0]?.patientId;
        const studyId = samples[0]?.studyId || data[0]?.studyId;
        const timelineData = usePathologyAugmentedClinicalEvents({
            clinicalEvents: data,
            errorMessage: 'Failed to load pathology timeline image counts',
            patientId,
            samples: sampleManager.samples,
            studyId,
        });
        const {
            isGenieBpcStudy,
            isHtanOhsuPatient,
            isToxicityPortal,
        } = getTimelinePortalFlags(window.location);
        const timelineDataWithPortalExtras = getTimelineDataWithPortalExtras(
            timelineData,
            isHtanOhsuPatient
        );

        useEffect(() => {
            const baseConfig: ITimelineConfig = buildBaseConfig(
                sampleManager,
                caseMetaData
            );

            if (isGenieBpcStudy) {
                configureGenieTimeline(baseConfig);
            }

            if (isHtanOhsuPatient) {
                configureHtanOhsuTimeline(baseConfig);
            }

            if (isToxicityPortal) {
                configureTimelineToxicityColors(baseConfig);
            }

            const trackSpecifications = sortTracks(
                baseConfig,
                timelineDataWithPortalExtras
            );

            configureTracks(trackSpecifications, baseConfig);
            setStore(new TimelineStore(trackSpecifications));
        }, [
            caseMetaData,
            isGenieBpcStudy,
            isHtanOhsuPatient,
            isToxicityPortal,
            sampleManager,
            timelineDataWithPortalExtras,
        ]);

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
                                    downloadZippedTracks(
                                        timelineDataWithPortalExtras
                                    )
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
