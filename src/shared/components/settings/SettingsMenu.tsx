import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import {
    IDriverSettingsProps,
    IDriverAnnotationControlsHandlers,
    IDriverAnnotationControlsState,
    buildDriverAnnotationControlsHandlers,
    buildDriverAnnotationControlsState,
    IExclusionSettings,
} from '../../driverAnnotation/DriverAnnotationSettings';
import InfoIcon from '../InfoIcon';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import get = Reflect.get;
import DriverAnnotationControls from 'shared/components/driverAnnotations/DriverAnnotationControls';

enum EVENT_KEY {
    hidePutativePassengers = '0',
    showGermlineMutations = '1',
    hideUnprofiledSamples = '1.1',
}

function boldedTabList(tabs: string[]) {
    return (
        <span>
            {tabs.map((tab, index) => (
                <span>
                    <strong>{tab}</strong>
                    {index < tabs.length - 1 ? ', ' : ''}
                </span>
            ))}
        </span>
    );
}

export interface IResultsPageSettings {
    store: IDriverSettingsProps & IExclusionSettings;
    resultsView?: boolean;
    disabled?: boolean;
}

@observer
export default class SettingsMenu extends React.Component<
    IResultsPageSettings,
    {}
> {
    private driverSettingsState: IDriverAnnotationControlsState;
    private driverSettingsHandlers: IDriverAnnotationControlsHandlers;

    constructor(props: IResultsPageSettings) {
        super(props);
        this.driverSettingsState = buildDriverAnnotationControlsState(
            props.store.driverAnnotationSettings,
            props.store.customDriverAnnotationReport.result,
            props.store.didOncoKbFailInOncoprint,
            props.store.didHotspotFailInOncoprint
        );
        this.driverSettingsHandlers = buildDriverAnnotationControlsHandlers(
            props.store.driverAnnotationSettings,
            this.driverSettingsState
        );
    }

    @autobind private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        switch ((event.target as HTMLInputElement).value) {
            case EVENT_KEY.hidePutativePassengers:
                this.props.store.driverAnnotationSettings.excludeVUS = !this
                    .props.store.driverAnnotationSettings.excludeVUS;
                break;
            case EVENT_KEY.hideUnprofiledSamples:
                this.props.store.hideUnprofiledSamples = !this.props.store
                    .hideUnprofiledSamples;
                break;
            case EVENT_KEY.showGermlineMutations:
                this.props.store.excludeGermlineMutations = !this.props.store
                    .excludeGermlineMutations;
                break;
        }
    }

    render() {
        if (this.props.disabled) {
            return (
                <div data-test={'GlobalSettingsButtonHint'}>
                    <div>
                        Filtering based on annotations is not available for this
                        study.
                    </div>
                    <div>
                        Load custom driver annotations for the selected study to
                        enable filtering.
                    </div>
                </div>
            );
        }
        return (
            <div
                data-test="GlobalSettingsDropdown"
                className={classNames(
                    'cbioportal-frontend',
                    styles.annotationFilterDropdown
                )}
                style={{ padding: 5 }}
            >
                <h5 style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                    Filter Data
                </h5>
                <InfoIcon
                    divStyle={{ display: 'inline-block', marginLeft: 6 }}
                    style={{ color: 'rgb(54, 134, 194)' }}
                    tooltip={
                        <span>
                            Filter the alterations that are counted in the
                            Mutated Genes, CNA Genes and Fusion Genes tables.
                            <br />
                            Driver/passenger annotations are based on
                            <b>
                                {' ' +
                                    getBrowserWindow().frontendConfig
                                        .serverConfig
                                        .oncoprint_custom_driver_annotation_binary_menu_label +
                                    ' '}
                            </b>
                            data.
                        </span>
                    }
                />
                <div style={{ marginLeft: 10 }}>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="HideGermline"
                                type="checkbox"
                                value={EVENT_KEY.showGermlineMutations}
                                checked={
                                    !this.props.store.excludeGermlineMutations
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Include germline mutations
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="HideVUS"
                                type="checkbox"
                                value={EVENT_KEY.hidePutativePassengers}
                                checked={
                                    !this.props.store.driverAnnotationSettings
                                        .excludeVUS
                                }
                                onClick={this.onInputClick}
                                disabled={
                                    !this.driverSettingsState.distinguishDrivers
                                }
                            />{' '}
                            Include mutations and copy number alterations of
                            unknown significance
                        </label>
                    </div>
                    {!!this.driverSettingsState.customDriverAnnotationTiers && (
                        <DriverAnnotationControls
                            state={this.driverSettingsState}
                            handlers={this.driverSettingsHandlers}
                        />
                    )}
                </div>
            </div>
        );
    }
}
