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
    showPutativeDrivers = '0',
    showPutativePassengers = '1',
    showUnknownOncogenicity = '2',
    showGermlineMutations = '3',
    showSomaticMutations = '4',
    hideUnprofiledSamples = '5',
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
            case EVENT_KEY.showPutativeDrivers:
                this.props.store.driverAnnotationSettings.includeDriver = this.props.store.driverAnnotationSettings.includeDriver;
                break;
            case EVENT_KEY.showPutativePassengers:
                this.props.store.driverAnnotationSettings.includeVUS = this.props.store.driverAnnotationSettings.includeVUS;
                break;
            case EVENT_KEY.showUnknownOncogenicity:
                this.props.store.driverAnnotationSettings.includeUnknownOncogenicity = this.props.store.driverAnnotationSettings.includeUnknownOncogenicity;
                break;
            case EVENT_KEY.hideUnprofiledSamples:
                this.props.store.hideUnprofiledSamples = !this.props.store
                    .hideUnprofiledSamples;
                break;
            case EVENT_KEY.showGermlineMutations:
                this.props.store.includeGermlineMutations = this.props.store.includeGermlineMutations;
                break;
            case EVENT_KEY.showSomaticMutations:
                this.props.store.includeSomaticMutations = this.props.store.includeSomaticMutations;
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
                                data-test="ShowDriver"
                                type="checkbox"
                                value={EVENT_KEY.showPutativeDrivers}
                                checked={
                                    this.props.store.driverAnnotationSettings
                                        .includeDriver
                                }
                                onClick={this.onInputClick}
                                disabled={
                                    !this.driverSettingsState.distinguishDrivers
                                }
                            />{' '}
                            Include known oncogenic mutations and copy number
                            alterations
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="ShowVUS"
                                type="checkbox"
                                value={EVENT_KEY.showPutativePassengers}
                                checked={
                                    this.props.store.driverAnnotationSettings
                                        .includeVUS
                                }
                                onClick={this.onInputClick}
                                disabled={
                                    !this.driverSettingsState.distinguishDrivers
                                }
                            />{' '}
                            Include known non-oncogenic mutations and copy
                            number alterations
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="ShowUnknownOncogenicity"
                                type="checkbox"
                                value={EVENT_KEY.showUnknownOncogenicity}
                                checked={
                                    this.props.store.driverAnnotationSettings
                                        .includeUnknownOncogenicity
                                }
                                onClick={this.onInputClick}
                                disabled={
                                    !this.driverSettingsState.distinguishDrivers
                                }
                            />{' '}
                            Include mutations and copy number alterations of
                            unknown oncogenicity
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="ShowGermline"
                                type="checkbox"
                                value={EVENT_KEY.showGermlineMutations}
                                checked={
                                    this.props.store.includeGermlineMutations
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Include germline mutations
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="HideSomatic"
                                type="checkbox"
                                value={EVENT_KEY.showSomaticMutations}
                                checked={
                                    this.props.store.includeSomaticMutations
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Include somatic mutations
                        </label>
                    </div>
                    {this.props.resultsView && (
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="HideUnprofiled"
                                    type="checkbox"
                                    value={EVENT_KEY.hideUnprofiledSamples}
                                    checked={
                                        this.props.store.hideUnprofiledSamples
                                    }
                                    onClick={this.onInputClick}
                                />{' '}
                                Exclude samples that are not profiled for all
                                queried genes in all queried profiles
                            </label>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
