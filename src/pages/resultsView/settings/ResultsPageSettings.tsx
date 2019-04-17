import * as React from 'react';
import { observer } from 'mobx-react';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import ReactSelect from 'react-select2';
import { capitalize } from '../../../shared/lib/StringUtils';
import autobind from 'autobind-decorator';
import DriverAnnotationControls, {
    IDriverAnnotationControlsHandlers,
    IDriverAnnotationControlsState,
} from './DriverAnnotationControls';
import { IObservableObject } from 'mobx';
import {
    boldedTabList,
    buildDriverAnnotationControlsHandlers,
    buildDriverAnnotationControlsState,
} from './ResultsPageSettingsUtils';
import CustomDropdown from '../../../shared/components/oncoprint/controls/CustomDropdown';
import InfoIcon from '../../../shared/components/InfoIcon';

export interface IResultsPageSettingsProps {
    store: ResultsViewPageStore;
}

enum EVENT_KEY {
    hidePutativePassengers = '0',
    showGermlineMutations = '1',

    dataTypeSample = '2',
    dataTypePatient = '3',
}

@observer
export default class ResultsPageSettings extends React.Component<
    IResultsPageSettingsProps,
    {}
> {
    @autobind private onChange(v: {
        label: string;
        value: 'sample' | 'patient';
    }) {
        this.props.store.setCaseType(v.value);
    }

    private driverSettingsState: IDriverAnnotationControlsState &
        IObservableObject;
    private driverSettingsHandlers: IDriverAnnotationControlsHandlers;

    constructor(props: IResultsPageSettingsProps) {
        super(props);
        this.driverSettingsState = buildDriverAnnotationControlsState(this);
        this.driverSettingsHandlers = buildDriverAnnotationControlsHandlers(
            this,
            this.driverSettingsState
        );
    }

    @autobind private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        switch ((event.target as HTMLInputElement).value) {
            case EVENT_KEY.hidePutativePassengers:
                this.props.store.driverAnnotationSettings.ignoreUnknown = !this
                    .props.store.driverAnnotationSettings.ignoreUnknown;
                break;
            case EVENT_KEY.showGermlineMutations:
                this.props.store.setShowGermlineMutations(
                    !this.props.store.showGermlineMutations
                );
                break;
            case EVENT_KEY.dataTypeSample:
                this.props.store.setCaseType('sample');
                break;
            case EVENT_KEY.dataTypePatient:
                this.props.store.setCaseType('patient');
                break;
        }
    }

    render() {
        return (
            <div
                id="globalSettingsDropdown"
                className="cbioportal-frontend"
                style={{ padding: 5 }}
            >
                <h5>Data Type</h5>
                <InfoIcon
                    style={{ color: 'rgb(54, 134, 194)' }}
                    tooltip={
                        <span>
                            This setting affects the following tabs:{' '}
                            {boldedTabList(['Oncoprint'])}
                        </span>
                    }
                />
                <div className="radio">
                    <label>
                        <input
                            type="radio"
                            value={EVENT_KEY.dataTypeSample}
                            checked={this.props.store.caseType === 'sample'}
                            onClick={this.onInputClick}
                        />{' '}
                        Events per sample
                    </label>
                </div>
                <div className="radio">
                    <label>
                        <input
                            type="radio"
                            value={EVENT_KEY.dataTypePatient}
                            checked={this.props.store.caseType === 'patient'}
                            onClick={this.onInputClick}
                        />{' '}
                        Events per patient
                    </label>
                </div>
                <hr />

                <h5>Annotate Data</h5>
                <InfoIcon
                    style={{ color: 'rgb(54, 134, 194)' }}
                    tooltip={
                        <span>
                            These settings affect the following tabs:{' '}
                            {boldedTabList([
                                'Oncoprint',
                                'Mutual Exclusivity',
                                'Mutations',
                                'Enrichments',
                                'Survival',
                            ])}
                        </span>
                    }
                />
                <DriverAnnotationControls
                    state={this.driverSettingsState}
                    handlers={this.driverSettingsHandlers}
                />

                <hr />

                <h5>Filter Data</h5>
                <InfoIcon
                    style={{ color: 'rgb(54, 134, 194)' }}
                    tooltip={
                        <span>
                            These settings affect the following tabs:{' '}
                            {boldedTabList([
                                'Oncoprint',
                                'Mutual Exclusivity',
                                'Mutations',
                                'Enrichments',
                                'Survival',
                            ])}
                        </span>
                    }
                />
                <div style={{ marginLeft: 10 }}>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="HideVUS"
                                type="checkbox"
                                value={EVENT_KEY.hidePutativePassengers}
                                checked={
                                    !this.props.store.driverAnnotationSettings
                                        .ignoreUnknown
                                }
                                onClick={this.onInputClick}
                                disabled={
                                    !this.driverSettingsState.distinguishDrivers
                                }
                            />{' '}
                            Show VUS (variants of unknown significance)
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="HideGermline"
                                type="checkbox"
                                value={EVENT_KEY.showGermlineMutations}
                                checked={this.props.store.showGermlineMutations}
                                onClick={this.onInputClick}
                            />{' '}
                            Show germline mutations
                        </label>
                    </div>
                </div>
            </div>
        );
    }
}
