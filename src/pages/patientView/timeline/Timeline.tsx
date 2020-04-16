import * as React from 'react';
import * as _ from 'lodash';
import $ from 'jquery';
import 'jquery-migrate';
require('datatables.net');
import { buildTimeline } from './legacy.js';
import 'qtip2';
import 'qtip2/dist/jquery.qtip.css';

import './styles.scss';
import SampleManager from '../SampleManager';

import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { ClinicalEvent, ClinicalEventData } from 'cbioportal-ts-api-client';
import { DownloadControls } from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import { toTSV } from './timelineTSV';

interface ITimelineProps {
    sampleManager: SampleManager;
    store: PatientViewPageStore;
    width: number;
}

type TimelineDataPoint = {
    eventType: string;
    patientId: string;
    startDate: number | null;
    stopDate: number | null;
    eventData: any;
};

export default class Timeline extends React.Component<ITimelineProps, {}> {
    private currentWidth: number;

    shouldComponentUpdate(nextProps: ITimelineProps) {
        if (nextProps.width !== this.currentWidth) {
            // only rerender to resize
            this.drawTimeline(nextProps.width);
        }
        return false;
    }

    componentDidMount() {
        this.drawTimeline(this.props.width);

        /*var debouncedResize =  _.debounce(()=>this.drawTimeline(),500);

        $(window).resize(debouncedResize);*/
    }

    @autobind
    getData(): string {
        return toTSV(this.props.store.clinicalEvents.result);
    }

    drawTimeline(width: number) {
        let clinicalDataMap = this.props.store.patientViewData.result.samples!.reduce(
            (memo: any, item) => {
                memo[item.id] = item.clinicalData.reduce(
                    (innerMemo: any, innerItem) => {
                        innerMemo[innerItem.clinicalAttributeId] =
                            innerItem.value;
                        return innerMemo;
                    },
                    {}
                );
                return memo;
            },
            {}
        );

        let caseIds = this.props.sampleManager.getSampleIdsInOrder();

        let params = {
            cancer_study_id: this.props.store.studyId,
            patient_id: this.props.store.patientId,
        };

        let patientInfo = this.props.store.patientViewData.result!.patient!.clinicalData.reduce(
            (memo: any, item) => {
                memo[item.clinicalAttributeId] = item.value;
                return memo;
            },
            {}
        );

        let caseMetaData = {
            color: this.props.sampleManager.sampleColors,
            label: this.props.sampleManager.sampleLabels,
            index: this.props.sampleManager.sampleIndex,
        };

        let timelineData = this.props.store.clinicalEvents.result.map(
            (eventData: ClinicalEvent) => {
                return {
                    eventType: eventData.eventType,
                    patientId: eventData.patientId,
                    startDate: _.isUndefined(
                        eventData.startNumberOfDaysSinceDiagnosis
                    )
                        ? null
                        : eventData.startNumberOfDaysSinceDiagnosis,
                    stopDate: _.isUndefined(
                        eventData.endNumberOfDaysSinceDiagnosis
                    )
                        ? null
                        : eventData.endNumberOfDaysSinceDiagnosis,
                    eventData: eventData.attributes.reduce(
                        (memo: any, evData: ClinicalEventData) => {
                            memo[evData.key] = evData.value;
                            return memo;
                        },
                        {}
                    ),
                };
            }
        );

        buildTimeline(
            params,
            caseIds,
            patientInfo,
            clinicalDataMap,
            caseMetaData,
            timelineData,
            width
        );
        this.currentWidth = width;
    }

    private svgContainer: HTMLDivElement;
    @autobind
    private getSvg() {
        return this.svgContainer.firstChild as SVGElement;
    }

    public render() {
        return (
            <div id="timeline-container" className="timelineContainer">
                <div
                    id="timeline"
                    ref={container => {
                        this.svgContainer = container!;
                    }}
                ></div>
                <DownloadControls
                    buttons={['PDF', 'PNG', 'SVG', 'Data']}
                    dataExtension={'tsv'}
                    getSvg={this.getSvg}
                    getData={this.getData}
                    filename="timeline"
                    dontFade={true}
                    type="button"
                    style={{ position: 'absolute', top: 0, right: 5 }}
                />
            </div>
        );
    }
}
