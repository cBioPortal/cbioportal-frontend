import { observable } from 'mobx';

import { makeTooltipMouseEvents } from '../../lib/PlotUtils';

export class ScatterPlotTooltipHelper {
    @observable.ref tooltipModel: any = null;
    @observable pointHovered: boolean = false;

    public get mouseEvents() {
        return makeTooltipMouseEvents(this);
    }
}
