import { action, observable } from 'mobx';
import _ from 'lodash';
import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { MutationStatus } from '../mutation/PatientViewMutationsTabUtils';

export default class TimelineWrapperStore {
    @observable groupByOption: Readonly<string> | null = null;

    @observable vafChartHeight: Readonly<number> = 240;

    @observable onlyShowSelectedInVAFChart:
        | Readonly<boolean>
        | undefined = undefined;

    @observable vafChartLogScale: Readonly<boolean> | undefined = undefined;

    @observable vafChartYAxisToDataRange:
        | Readonly<boolean>
        | undefined = undefined;

    @observable tooltipModel: {
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
        this.tooltipModel.mouseEvent = mouseEvent;
        this.tooltipModel.mutation = mutation;
        this.tooltipModel.datum = datum;
        this.tooltipModel.tooltipOnPoint = tooltipOnPoint;
        // mouseOverMutation is used to higlight mutations in the mutation table below
        //this.mouseOverMutation = mutation;
    }
}
