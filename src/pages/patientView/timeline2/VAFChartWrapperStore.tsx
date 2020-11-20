import { action, computed, observable } from 'mobx';

export default class VAFChartWrapperStore {
    @observable groupByOption: string | null = null;

    @observable _showSequentialMode: boolean | undefined = undefined;
    @computed
    get showSequentialMode() {
        return this.isOnlySequentialModePossible || this._showSequentialMode;
    }

    @observable onlyShowSelectedInVAFChart: boolean | undefined = undefined;

    @observable vafChartLogScale: boolean | undefined = undefined;

    @observable vafChartYAxisToDataRange: boolean | undefined = undefined;

    @observable minYAxisToDataRange: number = 0;

    @observable maxYAxisToDataRange: number = 0;

    @observable dataHeight: number = 200;

    @action
    setGroupByOption(value: string) {
        this.groupByOption = value;
    }

    @action
    setShowSequentialMode(value: boolean) {
        this._showSequentialMode = value;
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

    @computed get isOnlySequentialModePossible() {
        return !!(
            this.options &&
            this.options.isOnlySequentialModePossible &&
            this.options.isOnlySequentialModePossible()
        );
    }

    constructor(
        private options?: { isOnlySequentialModePossible?: () => boolean }
    ) {}
}
