import { action, computed, observable } from 'mobx';

export default class TimelineWrapperStore {
    @observable groupByOption: string | null = null;

    @observable vafChartHeight: number = 240;

    @observable showSequentialMode: boolean | undefined = undefined;

    @observable onlyShowSelectedInVAFChart: boolean | undefined = undefined;

    @observable vafChartLogScale: boolean | undefined = undefined;

    @observable vafChartYAxisToDataRange: boolean | undefined = undefined;

    @observable minYAxisToDataRange: number = 0;

    @observable maxYAxisToDataRange: number = 0;

    @observable dataHeight: number = 200;

    @action
    setVafChartHeight(value: number) {
        this.vafChartHeight = value;
    }

    @action
    setGroupByOption(value: string) {
        this.groupByOption = value;
    }

    @action
    setShowSequentialMode(value: boolean) {
        this.showSequentialMode = value;
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

    @computed get groupingByIsSelected() {
        return !(this.groupByOption == null || this.groupByOption === 'None');
    }
}
