import * as React from 'react';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import {
    IDriverAnnotationControlsHandlers,
    IDriverAnnotationControlsState,
    buildDriverAnnotationControlsState,
    buildDriverAnnotationControlsHandlers,
    IAnnotationFilterSettings,
} from '../../../shared/alterationFiltering/AnnotationFilteringSettings';
import DriverAnnotationControls from '../../../shared/components/driverAnnotations/DriverAnnotationControls';
import InfoIcon from '../../../shared/components/InfoIcon';
import styles from '../../../shared/components/driverAnnotations/styles.module.scss';
import classNames from 'classnames';
import { BoldedSpanList } from 'pages/resultsView/ResultsViewPageHelpers';

enum EVENT_KEY {
    hidePutativePassengers = '0',
    showGermlineMutations = '1',
    hideUnprofiledSamples = '1.1',

    dataTypeSample = '2',
    dataTypePatient = '3',
}

export interface SettingsMenuProps {
    store: IAnnotationFilterSettings;
    resultsView?: boolean;
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
                this.props.store.driverAnnotationSettings.includeVUS = !this
                    .props.store.driverAnnotationSettings.includeVUS;
                break;
            case EVENT_KEY.hideUnprofiledSamples:
                this.props.store.hideUnprofiledSamples = !this.props.store
                    .hideUnprofiledSamples;
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
        return (
            <div
                data-test="GlobalSettingsDropdown"
                className={classNames(
                    'cbioportal-frontend',
                    styles.globalSettingsDropdown
                )}
                style={{ padding: 5 }}
            >
                <h5 style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                    Annotate Data
                </h5>
                <InfoIcon
                    divStyle={{ display: 'inline-block', marginLeft: 6 }}
                    style={{ color: 'rgb(54, 134, 194)' }}
                    tooltip={
                        <span>
                            Putative driver vs VUS setings apply to every tab
                            except{' '}
                            <BoldedSpanList
                                words={['Co-expression', 'CN Segments']}
                            />
                        </span>
                    }
                />
                <div style={{ marginLeft: 10 }}>
                    <DriverAnnotationControls
                        state={this.driverSettingsState}
                        handlers={this.driverSettingsHandlers}
                        resultsView={this.props.resultsView}
                    />
                </div>

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
                                    !this.props.store.driverAnnotationSettings
                                        .includeVUS
                                }
                                onClick={this.onInputClick}
                                disabled={
                                    !this.driverSettingsState.distinguishDrivers
                                }
                            />{' '}
                            Exclude alterations (mutations, structural variants
                            and copy number) of unknown significance
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="HideGermline"
                                type="checkbox"
                                value={EVENT_KEY.showGermlineMutations}
                                checked={
                                    !this.props.store.includeGermlineMutations
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Exclude germline mutations
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
