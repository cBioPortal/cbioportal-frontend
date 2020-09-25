import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react-lite';
import { CoverageInformation } from '../../resultsView/ResultsViewPageStoreUtils';
import { Sample } from 'cbioportal-ts-api-client';
import PatientViewMutationsDataStore from '../mutation/PatientViewMutationsDataStore';
import VAFChartControls from './VAFChartControls';
import VAFChart from 'pages/patientView/timeline2/VAFChart';
import TimelineWrapperStore from 'pages/patientView/timeline2/TimelineWrapperStore';

import 'cbioportal-clinical-timeline/dist/styles.css';

import {
    configureTracks,
    Timeline,
    TimelineStore,
    TimelineTrackSpecification,
} from 'cbioportal-clinical-timeline';

import { ClinicalEvent } from 'cbioportal-ts-api-client';
import SampleManager from 'pages/patientView/SampleManager';
import {
    buildBaseConfig,
    configureGenieTimeline,
    sortTracks,
} from 'pages/patientView/timeline2/helpers';
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
    coverageInformation: CoverageInformation;
}

const TimelineWrapper: React.FunctionComponent<ITimeline2Props> = observer(
    function({
        dataStore,
        data,
        caseMetaData,
        sampleManager,
        width,
        samples,
        mutationProfileId,
        coverageInformation,
    }: ITimeline2Props) {
        const [events, setEvents] = useState<
            TimelineTrackSpecification[] | null
        >(null);

        const [stores, setStores] = useState<TimelineStore[] | null>(null);
        const [
            wrapperStore,
            setWrapperStore,
        ] = useState<TimelineWrapperStore | null>(null);

        useEffect(() => {
            var isGenieBpcStudy = window.location.href.includes('genie_bpc');

            const baseConfig: any = buildBaseConfig(
                sampleManager,
                caseMetaData
            );

            if (isGenieBpcStudy) {
                configureGenieTimeline(baseConfig);
            }

            const trackSpecifications = sortTracks(baseConfig, data);

            configureTracks(
                trackSpecifications,
                baseConfig.trackEventRenderers
            );

            // we can consider perhaps moving store into Timeline component
            // not sure if/why it needs to be out here
            const store1 = new TimelineStore(trackSpecifications);

            const store2 = new TimelineStore(trackSpecifications);

            setStores([store1, store2]);

            const wrapperStore = new TimelineWrapperStore();

            setWrapperStore(wrapperStore);

            (window as any).store = store1;
        }, []);

        if (stores && wrapperStore) {
            return (
                <>
                    <div>
                        <div>
                            <Timeline
                                store={stores[0]}
                                width={width}
                                onClickDownload={() =>
                                    downloadZippedTracks(data)
                                }
                                // customTracks={[
                                //     {
                                //         renderHeader: () => 'VAF',
                                //         renderTrack: (store: TimelineStore) => (
                                //             <VAFChartWrapper
                                //                 dataStore={dataStore}
                                //                 store={store}
                                //                 wrapperStore={wrapperStore}
                                //                 sampleMetaData={caseMetaData}
                                //                 samples={samples}
                                //                 mutationProfileId={mutationProfileId}
                                //                 coverageInformation={
                                //                     coverageInformation
                                //                 }
                                //                 sampleManager={sampleManager}
                                //             />
                                //         ),
                                //         height: (store: TimelineStore) => {
                                //             return wrapperStore.vafChartHeight;
                                //         },
                                //         labelForExport: 'VAF',
                                //     },
                                // ]}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <Timeline
                            store={stores[1]}
                            width={width}
                            onClickDownload={() => downloadZippedTracks(data)}
                            hideLabels={false}
                            hideXAxis={true}
                            visibleTracks={[]}
                            customTracks={[
                                {
                                    renderHeader: () => 'VAF',
                                    renderTrack: (store: TimelineStore) => (
                                        <VAFChart
                                            dataStore={dataStore}
                                            store={store}
                                            wrapperStore={wrapperStore}
                                            sampleMetaData={caseMetaData}
                                            samples={samples}
                                            mutationProfileId={
                                                mutationProfileId
                                            }
                                            coverageInformation={
                                                coverageInformation
                                            }
                                            sampleManager={sampleManager}
                                        />
                                    ),
                                    height: (store: TimelineStore) => {
                                        return wrapperStore.vafChartHeight;
                                    },
                                    labelForExport: 'VAF',
                                },
                            ]}
                        />
                        <VAFChartControls
                            wrapperStore={wrapperStore}
                            sampleManager={sampleManager}
                        />
                    </div>
                </>
            );
        } else {
            return <div />;
        }
    }
);

export default TimelineWrapper;
