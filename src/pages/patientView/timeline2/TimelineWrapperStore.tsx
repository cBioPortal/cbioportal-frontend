import { action, observable } from 'mobx';
import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { MutationStatus } from '../mutation/PatientViewMutationsTabUtils';
import { CustomTrackSpecification } from 'cbioportal-clinical-timeline/dist/CustomTrack';

export default class TimelineWrapperStore {
    @observable groupByOption: string | null = null;

    @observable.ref groupByTracks: CustomTrackSpecification[] = [];

    @observable vafChartHeight: number = 240;

    @observable onlyShowSelectedInVAFChart: boolean | undefined = undefined;

    @observable vafChartLogScale: boolean | undefined = undefined;

    @observable vafChartYAxisToDataRange: boolean | undefined = undefined;

    @observable.ref tooltipModel: {
        datum: {
            mutationStatus: MutationStatus | null;
            sampleId: string;
            vaf: number;
        } | null;
        mutation: Mutation | null;
        mouseEvent: React.MouseEvent<any> | null;
        tooltipOnPoint: boolean;
    } = {
        datum: null,
        mutation: null,
        mouseEvent: null,
        tooltipOnPoint: false,
    };

    @action
    setVafChartHeight(value: number) {
        this.vafChartHeight = value;
    }

    @action
    setGroupByOption(value: string) {
        this.groupByOption = value;
    }

    @action
    setOnlyShowSelectedInVAFChart(value: boolean) {
        this.onlyShowSelectedInVAFChart = value;
    }

    @action
    setVafChartLogScale(value: boolean) {
        this.vafChartLogScale = value;
    }

    @action
    setVafChartYAxisToDataRange(value: boolean) {
        this.vafChartYAxisToDataRange = value;
    }

    @action
    public setTooltipModel(
        datum: {
            sampleId: string;
            vaf: number;
            mutationStatus: MutationStatus;
        } | null,
        mutation: Mutation | null,
        mouseEvent: React.MouseEvent<any>,
        tooltipOnPoint: boolean
    ) {
        this.tooltipModel = {
            datum: datum,
            mutation: mutation,
            mouseEvent: mouseEvent,
            tooltipOnPoint: tooltipOnPoint,
        };
    }
}
