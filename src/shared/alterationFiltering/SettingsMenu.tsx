import * as React from 'react';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import classNames from 'classnames';
import DriverAnnotationControls from 'shared/components/driverAnnotations/DriverAnnotationControls';
import {
    IAnnotationFilterSettings,
    IDriverAnnotationControlsState,
    IDriverAnnotationControlsHandlers,
    buildDriverAnnotationControlsState,
    buildDriverAnnotationControlsHandlers,
} from './AnnotationFilteringSettings';
import styles from 'shared/components/driverAnnotations/styles.module.scss';

enum EVENT_KEY {
    hidePutativePassengers = '0',
    showGermlineMutations = '1',
    hideUnprofiledSamples = '1.1',
    hideAnyUnprofiledSamples = '1.2',
    hideTotallyUnprofiledSamples = '1.3',

    dataTypeSample = '2',
    dataTypePatient = '3',
}

export interface SettingsMenuProps {
    store: IAnnotationFilterSettings;
    annotationTitleComponent?: JSX.Element;
    showOnckbAnnotationControls?: boolean;
    showFilterControls?: boolean;
    showExcludeUnprofiledSamplesControl?: boolean;
    disabled?: boolean;
}

@observer
export default class SettingsMenu extends React.Component<
    SettingsMenuProps,
    {}
> {
    public driverSettingsState: IDriverAnnotationControlsState;
    public driverSettingsHandlers: IDriverAnnotationControlsHandlers;

    constructor(props: SettingsMenuProps) {
        super(props);
        makeObservable(this, {
            driverSettingsState: observable,
            driverSettingsHandlers: observable,
        });
        this.driverSettingsState = buildDriverAnnotationControlsState(
            props.store.driverAnnotationSettings,
            props.store.customDriverAnnotationReport,
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
                this.props.store.driverAnnotationSettings.includeVUS = !this
                    .props.store.driverAnnotationSettings.includeVUS;
                break;
            case EVENT_KEY.hideUnprofiledSamples:
                if (!this.props.store.hideUnprofiledSamples) {
                    this.props.store.hideUnprofiledSamples = 'any';
                } else {
                    this.props.store.hideUnprofiledSamples = false;
                }
                break;
            case EVENT_KEY.hideAnyUnprofiledSamples:
                this.props.store.hideUnprofiledSamples = 'any';
                break;
            case EVENT_KEY.hideTotallyUnprofiledSamples:
                this.props.store.hideUnprofiledSamples = 'totally';
                break;
            case EVENT_KEY.showGermlineMutations:
                this.props.store.includeGermlineMutations = !this.props.store
                    .includeGermlineMutations;
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
        const noGenomicAlterations = !this.props.store.driverAnnotationSettings
            .isGenomicAlterationProfileSelected;
        return (
            <div
                data-test="GlobalSettingsDropdown"
                className={classNames(
                    'cbioportal-frontend',
                    styles.globalSettingsDropdown
                )}
                style={{ padding: 5 }}
            >
                {this.props.annotationTitleComponent}
                <div style={{ marginLeft: 10 }}>
                    <DriverAnnotationControls
                        state={this.driverSettingsState}
                        handlers={this.driverSettingsHandlers}
                        showOnckbAnnotationControls={
                            this.props.showOnckbAnnotationControls
                        }
                    />
                </div>
                {this.props.showFilterControls && (
                    <>
                        <hr />
                        <h5 style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                            Filter Data
                        </h5>
                        <div style={{ marginLeft: 10 }}>
                            <div className="checkbox">
                                <label>
                                    <input
                                        data-test="HideVUS"
                                        type="checkbox"
                                        value={EVENT_KEY.hidePutativePassengers}
                                        checked={
                                            !this.props.store
                                                .driverAnnotationSettings
                                                .includeVUS
                                        }
                                        onClick={this.onInputClick}
                                        disabled={
                                            !this.driverSettingsState
                                                .distinguishDrivers ||
                                            noGenomicAlterations
                                        }
                                    />{' '}
                                    Exclude alterations (mutations, structural
                                    variants and copy number) of unknown
                                    significance
                                </label>
                            </div>
                            <div className="checkbox">
                                <label>
                                    <input
                                        data-test="HideGermline"
                                        type="checkbox"
                                        value={EVENT_KEY.showGermlineMutations}
                                        checked={
                                            !this.props.store
                                                .includeGermlineMutations
                                        }
                                        onClick={this.onInputClick}
                                        disabled={noGenomicAlterations}
                                    />{' '}
                                    Exclude germline mutations
                                </label>
                            </div>
                            {this.props.showExcludeUnprofiledSamplesControl && (
                                <div>
                                    <div className="checkbox">
                                        <label>
                                            <input
                                                data-test="HideUnprofiled"
                                                type="checkbox"
                                                value={
                                                    EVENT_KEY.hideUnprofiledSamples
                                                }
                                                checked={
                                                    this.props.store
                                                        .hideUnprofiledSamples !==
                                                    false
                                                }
                                                onClick={this.onInputClick}
                                            />{' '}
                                            Exclude unprofiled samples
                                        </label>
                                    </div>
                                    <div style={{ marginLeft: 10 }}>
                                        <div className="radio">
                                            <label>
                                                <input
                                                    type="radio"
                                                    checked={
                                                        this.props.store
                                                            .hideUnprofiledSamples ===
                                                        'any'
                                                    }
                                                    value={
                                                        EVENT_KEY.hideAnyUnprofiledSamples
                                                    }
                                                    onClick={this.onInputClick}
                                                />
                                                Exclude samples that are
                                                unprofiled in any queried gene
                                                or profile
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    checked={
                                                        this.props.store
                                                            .hideUnprofiledSamples ===
                                                        'totally'
                                                    }
                                                    value={
                                                        EVENT_KEY.hideTotallyUnprofiledSamples
                                                    }
                                                    onClick={this.onInputClick}
                                                />
                                                Exclude samples that are
                                                unprofiled in every queried gene
                                                and profile.
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }
}
