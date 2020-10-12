import React from 'react';
import { observer } from 'mobx-react';
import { CoverageInformation } from '../../resultsView/ResultsViewPageStoreUtils';
import { ClinicalEvent, Sample } from 'cbioportal-ts-api-client';
import PatientViewMutationsDataStore from '../mutation/PatientViewMutationsDataStore';
import { VAFChartControls } from './VAFChartControls';
import VAFChart from 'pages/patientView/timeline2/VAFChart';
import TimelineWrapperStore from 'pages/patientView/timeline2/TimelineWrapperStore';

import 'cbioportal-clinical-timeline/dist/styles.css';

import {
    configureTracks,
    Timeline,
    TimelineStore,
} from 'cbioportal-clinical-timeline';
import SampleManager from 'pages/patientView/SampleManager';
import { downloadZippedTracks } from 'pages/patientView/timeline/timelineTSV';
import {
    buildBaseConfig,
    configureGenieTimeline,
    sortTracks,
} from 'pages/patientView/timeline2/helpers';
import { CustomTrackSpecification } from 'cbioportal-clinical-timeline/dist/CustomTrack';

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
    headerWidth?: number;
}

@observer
export default class VAFChartWrapper extends React.Component<
    IVAFChartWrapperProps,
    {}
> {
    store: TimelineStore;
    wrapperStore: TimelineWrapperStore;

    constructor(props: IVAFChartWrapperProps) {
        super(props);

        var isGenieBpcStudy = window.location.href.includes('genie_bpc');

        const baseConfig: any = buildBaseConfig(
            props.sampleManager,
            props.caseMetaData
        );

        if (isGenieBpcStudy) {
            configureGenieTimeline(baseConfig);
        }

        const trackSpecifications = sortTracks(baseConfig, this.props.data);

        configureTracks(trackSpecifications, baseConfig.trackEventRenderers);

        // we can consider perhaps moving store into Timeline component
        // not sure if/why it needs to be out here
        this.store = new TimelineStore(trackSpecifications);

        const wrapperStore = new TimelineWrapperStore();

        this.wrapperStore = new TimelineWrapperStore();

        (window as any).store = this.store;
    }

    render() {
        if (!this.store || !this.wrapperStore) return null;

        const vafPlotTrack = {
            renderHeader: this.wrapperStore.vafPlotHeader,
            renderTrack: (store: TimelineStore) => (
                <VAFChart
                    dataStore={this.props.dataStore}
                    store={store}
                    wrapperStore={this.wrapperStore}
                    sampleMetaData={this.props.caseMetaData}
                    samples={this.props.samples}
                    mutationProfileId={this.props.mutationProfileId}
                    coverageInformation={this.props.coverageInformation}
                    sampleManager={this.props.sampleManager}
                />
            ),
            disableHover: true,
            height: (store: TimelineStore) => {
                return this.wrapperStore.vafChartHeight;
            },
            labelForExport: 'VAF',
        } as CustomTrackSpecification;

        let customTracks = [vafPlotTrack].concat(
            this.wrapperStore.groupByTracks
        );

        return (
            <>
                <div style={{ marginTop: 20 }} data-test={'VAFChartWrapper'}>
                    <VAFChartControls
                        wrapperStore={this.wrapperStore}
                        sampleManager={this.props.sampleManager}
                    />
                    <Timeline
                        key={headerWidth}
                        store={stores[0]}
                        width={width}
                        onClickDownload={() => downloadZippedTracks(data)}
                        store={this.store}
                        width={this.props.width}
                        onClickDownload={() =>
                            downloadZippedTracks(this.props.data)
                        }
                        hideLabels={false}
                        hideXAxis={this.wrapperStore.showSequentialMode}
                        visibleTracks={[]}
                        customTracks={customTracks}
                        headerWidth={
                            wrapperStore.groupByTracks.length
                                ? 150
                                : headerWidth
                        }
                    />
                </div>
            </>
        );
    }
}
