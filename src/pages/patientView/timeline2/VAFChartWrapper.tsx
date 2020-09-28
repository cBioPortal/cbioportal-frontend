import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react-lite';
import { CoverageInformation } from '../../resultsView/ResultsViewPageStoreUtils';
import { Sample } from 'cbioportal-ts-api-client';
import PatientViewMutationsDataStore from '../mutation/PatientViewMutationsDataStore';
import { VAFChartControls, VAFChartHeader } from './VAFChartControls';
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
import { downloadZippedTracks } from 'pages/patientView/timeline/timelineTSV';
import {
    buildBaseConfig,
    configureGenieTimeline,
    sortTracks,
} from 'pages/patientView/timeline2/helpers';
import { computed } from 'mobx';
import { CustomTrackSpecification } from 'cbioportal-clinical-timeline/dist/CustomTrack';
import { wrapper } from 'react-bootstrap/lib/utils/deprecationWarning';

export interface ISampleMetaDeta {
    color: { [sampleId: string]: string };
    index: { [sampleId: string]: number };
    label: { [sampleId: string]: string };
}

export interface IVAFChartWrapperProps {
    dataStore: PatientViewMutationsDataStore;
    data: ClinicalEvent[];
    caseMetaData: ISampleMetaDeta;
    sampleManager: SampleManager;
    width: number;
    samples: Sample[];
    mutationProfileId: string;
    coverageInformation: CoverageInformation;
}

const VAFChartWrapper: React.FunctionComponent<IVAFChartWrapperProps> = observer(
    function({
        dataStore,
        data,
        caseMetaData,
        sampleManager,
        width,
        samples,
        mutationProfileId,
        coverageInformation,
    }: IVAFChartWrapperProps) {
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

            setStores([store1]);

            const wrapperStore = new TimelineWrapperStore();

            setWrapperStore(wrapperStore);

            (window as any).store = store1;
        }, []);

        if (!stores || !wrapperStore) return null;

        const groupByTracks = wrapperStore.groupByTracks;

        const vafPlotTrack = {
            renderHeader: (store: TimelineStore) => (
                <VAFChartHeader wrapperStore={wrapperStore} />
            ),
            renderTrack: (store: TimelineStore) => (
                <VAFChart
                    dataStore={dataStore}
                    store={store}
                    wrapperStore={wrapperStore}
                    sampleMetaData={caseMetaData}
                    samples={samples}
                    mutationProfileId={mutationProfileId}
                    coverageInformation={coverageInformation}
                    sampleManager={sampleManager}
                />
            ),
            disableHover: true,
            height: (store: TimelineStore) => {
                return wrapperStore.vafChartHeight;
            },
            labelForExport: 'VAF',
        } as CustomTrackSpecification;

        let customTracks = [vafPlotTrack].concat(wrapperStore.groupByTracks);

        return (
            <>
                <div style={{ marginTop: 20 }}>
                    <VAFChartControls
                        wrapperStore={wrapperStore}
                        sampleManager={sampleManager}
                    />
                    <Timeline
                        store={stores[0]}
                        width={width}
                        onClickDownload={() => downloadZippedTracks(data)}
                        hideLabels={false}
                        hideXAxis={wrapperStore.showSequentialMode}
                        visibleTracks={[]}
                        customTracks={customTracks}
                    />
                </div>
            </>
        );
    }
);

export default VAFChartWrapper;
