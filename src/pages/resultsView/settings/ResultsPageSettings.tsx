import * as React from 'react';
import { observer } from 'mobx-react';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import autobind from 'autobind-decorator';
import DriverAnnotationControls, {
    IDriverAnnotationControlsHandlers,
    IDriverAnnotationControlsState,
} from './DriverAnnotationControls';
import {
    boldedTabList,
    buildDriverAnnotationControlsHandlers,
    buildDriverAnnotationControlsState,
} from './ResultsPageSettingsUtils';
import InfoIcon from '../../../shared/components/InfoIcon';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { OncoprintAnalysisCaseType } from '../ResultsViewPageStoreUtils';

export interface IResultsPageSettingsProps {
    store: ResultsViewPageStore;
}

enum EVENT_KEY {
    hidePutativePassengers = '0',
    showGermlineMutations = '1',
    hideUnprofiledSamples = '1.1',

    dataTypeSample = '2',
    dataTypePatient = '3',
}

@observer
export default class ResultsPageSettings extends React.Component<
    IResultsPageSettingsProps,
    {}
> {
    private driverSettingsState: IDriverAnnotationControlsState;
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
                this.props.store.driverAnnotationSettings.excludeVUS = !this
                    .props.store.driverAnnotationSettings.excludeVUS;
                break;
            case EVENT_KEY.hideUnprofiledSamples:
                this.props.store.setHideUnprofiledSamples(
                    !this.props.store.hideUnprofiledSamples
                );
                break;
            case EVENT_KEY.showGermlineMutations:
                this.props.store.setExcludeGermlineMutations(
                    !this.props.store.excludeGermlineMutations
                );
                break;
            case EVENT_KEY.dataTypeSample:
                this.props.store.setOncoprintAnalysisCaseType(
                    OncoprintAnalysisCaseType.SAMPLE
                );
                break;
            case EVENT_KEY.dataTypePatient:
                this.props.store.setOncoprintAnalysisCaseType(
                    OncoprintAnalysisCaseType.PATIENT
                );
                break;
        }
    }

    render() {
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
                            {boldedTabList(['Co-expression', 'CN Segments'])}
                        </span>
                    }
                />
                <div style={{ marginLeft: 10 }}>
                    <DriverAnnotationControls
                        state={this.driverSettingsState}
                        handlers={this.driverSettingsHandlers}
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
                                    this.props.store.driverAnnotationSettings
                                        .excludeVUS
                                }
                                onClick={this.onInputClick}
                                disabled={
                                    !this.driverSettingsState.distinguishDrivers
                                }
                            />{' '}
                            Exclude mutations and copy number alterations of
                            unknown significance
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="HideGermline"
                                type="checkbox"
                                value={EVENT_KEY.showGermlineMutations}
                                checked={
                                    this.props.store.excludeGermlineMutations
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Exclude germline mutations
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="HideUnprofiled"
                                type="checkbox"
                                value={EVENT_KEY.hideUnprofiledSamples}
                                checked={this.props.store.hideUnprofiledSamples}
                                onClick={this.onInputClick}
                            />{' '}
                            Exclude samples that are not profiled for all
                            queried genes in all queried profiles
                        </label>
                    </div>
                </div>
            </div>
        );
    }
}
