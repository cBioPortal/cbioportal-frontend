import { observable } from 'mobx';

import LollipopPlotControlsConfig from '../model/LollipopPlotControlsConfig';

export class DefaultLollipopPlotControlsConfig
    implements LollipopPlotControlsConfig {
    @observable
    public bottomYMaxInput: number | undefined;

    @observable
    public legendShown = false;

    @observable
    public yMaxInput: number | undefined;
}

export default DefaultLollipopPlotControlsConfig;
