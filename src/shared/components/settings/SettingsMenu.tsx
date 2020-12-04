import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import {
    buildDriverAnnotationControlsHandlers,
    buildDriverAnnotationControlsState,
    IDriverAnnotationControlsHandlers,
    IDriverAnnotationControlsState,
    IDriverSettingsProps,
    IExclusionSettings,
} from '../../driverAnnotation/DriverAnnotationSettings';
import InfoIcon from '../InfoIcon';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import DriverAnnotationControls from 'shared/components/driverAnnotations/DriverAnnotationControls';
import { computed, observable } from 'mobx';

enum EVENT_KEY {
    showPutativeDrivers = '0',
    showPutativePassengers = '1',
    showUnknownOncogenicity = '2',
    showGermlineMutations = '3',
    showSomaticMutations = '4',
    showUnknownStatusMutations = '5',
    hideUnprofiledSamples = '6',
    toggleAllMutationStatus = '7',
    toggleAllDriverAnnotation = '8',
    toggleAllDriverTiers = '9',
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
    disabled?: boolean;
}

@observer
export default class SettingsMenu extends React.Component<
    IResultsPageSettings,
    {}
> {
    private driverSettingsState: IDriverAnnotationControlsState;
    private driverSettingsHandlers: IDriverAnnotationControlsHandlers;
    @observable _mutationStatusCheckboxToggle = true;
    @observable _driverAnnotationsCheckboxToggle = true;
    @observable _driverTiersCheckboxToggle = false;

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

    @autobind
    private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        switch ((event.target as HTMLInputElement).value) {
            case EVENT_KEY.showPutativeDrivers:
                this.props.store.driverAnnotationSettings.includeDriver = !this
                    .props.store.driverAnnotationSettings.includeDriver;
                this._driverAnnotationsCheckboxToggle =
                    this.props.store.driverAnnotationSettings.includeDriver &&
                    this.props.store.driverAnnotationSettings.includeVUS &&
                    this.props.store.driverAnnotationSettings
                        .includeUnknownOncogenicity;
                break;
            case EVENT_KEY.showPutativePassengers:
                this.props.store.driverAnnotationSettings.includeVUS = !this
                    .props.store.driverAnnotationSettings.includeVUS;
                this._driverAnnotationsCheckboxToggle =
                    this.props.store.driverAnnotationSettings.includeDriver &&
                    this.props.store.driverAnnotationSettings.includeVUS &&
                    this.props.store.driverAnnotationSettings
                        .includeUnknownOncogenicity;
                break;
            case EVENT_KEY.showUnknownOncogenicity:
                this.props.store.driverAnnotationSettings.includeUnknownOncogenicity = !this
                    .props.store.driverAnnotationSettings
                    .includeUnknownOncogenicity;
                this._driverAnnotationsCheckboxToggle =
                    this.props.store.driverAnnotationSettings.includeDriver &&
                    this.props.store.driverAnnotationSettings.includeVUS &&
                    this.props.store.driverAnnotationSettings
                        .includeUnknownOncogenicity;
                break;
            case EVENT_KEY.hideUnprofiledSamples:
                this.props.store.hideUnprofiledSamples = !this.props.store
                    .hideUnprofiledSamples;
                break;
            case EVENT_KEY.showGermlineMutations:
                this.props.store.includeGermlineMutations = !this.props.store
                    .includeGermlineMutations;
                this._mutationStatusCheckboxToggle =
                    this.props.store.includeSomaticMutations &&
                    this.props.store.includeGermlineMutations &&
                    this.props.store.includeUnknownStatusMutations;
                break;
            case EVENT_KEY.showSomaticMutations:
                this.props.store.includeSomaticMutations = !this.props.store
                    .includeSomaticMutations;
                this._mutationStatusCheckboxToggle =
                    this.props.store.includeSomaticMutations &&
                    this.props.store.includeGermlineMutations &&
                    this.props.store.includeUnknownStatusMutations;
                break;
            case EVENT_KEY.showUnknownStatusMutations:
                this.props.store.includeUnknownStatusMutations = !this.props
                    .store.includeUnknownStatusMutations;
                this._mutationStatusCheckboxToggle =
                    this.props.store.includeSomaticMutations &&
                    this.props.store.includeGermlineMutations &&
                    this.props.store.includeUnknownStatusMutations;
                break;
            case EVENT_KEY.toggleAllMutationStatus:
                this.props.store.includeGermlineMutations = !this
                    ._mutationStatusCheckboxToggle;
                this.props.store.includeSomaticMutations = !this
                    ._mutationStatusCheckboxToggle;
                this.props.store.includeUnknownStatusMutations = !this
                    ._mutationStatusCheckboxToggle;
                this._mutationStatusCheckboxToggle = !this
                    ._mutationStatusCheckboxToggle;
                break;
            case EVENT_KEY.toggleAllDriverAnnotation:
                this.props.store.driverAnnotationSettings.includeDriver = !this
                    ._driverAnnotationsCheckboxToggle;
                this.props.store.driverAnnotationSettings.includeVUS = !this
                    ._driverAnnotationsCheckboxToggle;
                this.props.store.driverAnnotationSettings.includeUnknownOncogenicity = !this
                    ._driverAnnotationsCheckboxToggle;
                this._driverAnnotationsCheckboxToggle = !this
                    ._driverAnnotationsCheckboxToggle;
                break;
            case EVENT_KEY.toggleAllDriverTiers:
                if (this.driverSettingsState.customDriverAnnotationTiers) {
                    const value =
                        this.driverSettingsState
                            .allCustomDriverAnnotationTiersSelected &&
                        this.driverSettingsState
                            .allCustomDriverAnnotationTiersSelected!;
                    this.driverSettingsState.customDriverAnnotationTiers.forEach(
                        t =>
                            this.driverSettingsHandlers
                                .onSelectCustomDriverAnnotationTier &&
                            this.driverSettingsHandlers.onSelectCustomDriverAnnotationTier(
                                t,
                                !value
                            )
                    );
                }
                break;
        }
    }

    @computed get selectedAllMutationStatusOptions() {
        return (
            this.props.store.includeSomaticMutations &&
            this.props.store.includeGermlineMutations &&
            this.props.store.includeUnknownStatusMutations
        );
    }

    @computed get selectedAllDriverAnnotationOptions() {
        return (
            this.props.store.driverAnnotationSettings.includeDriver &&
            this.props.store.driverAnnotationSettings.includeVUS &&
            this.props.store.driverAnnotationSettings.includeUnknownOncogenicity
        );
    }

    @computed get selectedAllTierOptions() {
        return (
            this.driverSettingsState.allCustomDriverAnnotationTiersSelected &&
            this.driverSettingsState.allCustomDriverAnnotationTiersSelected!
        );
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
                <span style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                    Select alteration types included in the tables of{' '}
                    <i>Mutated Genes</i>, <i>CNA Genes</i> and{' '}
                    <i>Fusion Genes</i>.
                </span>
                <div className={styles.headerSection}>
                    <input
                        className={styles.categoryCheckbox}
                        data-test="ToggleAllMutationStatus"
                        type="checkbox"
                        value={EVENT_KEY.toggleAllMutationStatus}
                        checked={this.selectedAllMutationStatusOptions}
                        onClick={this.onInputClick}
                    />
                    <h5>By mutation status (mutations only)</h5>
                    <InfoIcon
                        divStyle={{ display: 'inline-block', marginLeft: 6 }}
                        style={{ color: 'rgb(54, 134, 194)' }}
                        tooltip={<span>PLACEHOLDER</span>}
                    />
                </div>
                <div style={{ marginLeft: 20 }}>
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
                            Germline
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
                            Somatic
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="ShowUnknown"
                                type="checkbox"
                                value={EVENT_KEY.showUnknownStatusMutations}
                                checked={
                                    this.props.store
                                        .includeUnknownStatusMutations
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Unknown
                        </label>
                    </div>
                </div>
                <div className={styles.headerSection}>
                    <input
                        className={styles.categoryCheckbox}
                        data-test="ToggleAllDriverAnnotation"
                        type="checkbox"
                        value={EVENT_KEY.toggleAllDriverAnnotation}
                        checked={this.selectedAllDriverAnnotationOptions}
                        onClick={this.onInputClick}
                    />
                    <h5>By driver annotation</h5>
                    <InfoIcon
                        divStyle={{ display: 'inline-block', marginLeft: 6 }}
                        style={{ color: 'rgb(54, 134, 194)' }}
                        tooltip={
                            <span>
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
                </div>
                <div style={{ marginLeft: 20 }}>
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
                            Putative drivers
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
                            Putative passengers
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
                            Unknown
                        </label>
                    </div>
                </div>
                {!!this.driverSettingsState.customDriverAnnotationTiers && (
                    <div>
                        <div className={styles.headerSection}>
                            <input
                                className={styles.categoryCheckbox}
                                data-test="ToggleAllDriverTiers"
                                type="checkbox"
                                value={EVENT_KEY.toggleAllDriverTiers}
                                checked={this.selectedAllTierOptions}
                                onClick={this.onInputClick}
                            />
                            <h5>By category</h5>
                            <InfoIcon
                                divStyle={{
                                    display: 'inline-block',
                                    marginLeft: 6,
                                }}
                                style={{ color: 'rgb(54, 134, 194)' }}
                                tooltip={
                                    <span>
                                        Alteration categories are based on
                                        <b>
                                            {' ' +
                                                getBrowserWindow()
                                                    .frontendConfig.serverConfig
                                                    .oncoprint_custom_driver_annotation_binary_menu_label +
                                                ' '}
                                        </b>
                                        tier annotations.
                                    </span>
                                }
                            />
                        </div>
                        <div style={{ marginLeft: 20 }}>
                            <DriverAnnotationControls
                                state={this.driverSettingsState}
                                handlers={this.driverSettingsHandlers}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
