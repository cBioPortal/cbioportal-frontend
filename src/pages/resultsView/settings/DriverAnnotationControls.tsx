import * as React from 'react';
import { observer } from 'mobx-react';
import ErrorIcon from '../../../shared/components/ErrorIcon';
import { IObservableObject, ObservableMap } from 'mobx';
import autobind from 'autobind-decorator';
import {
    EditableSpan,
    DefaultTooltip,
    getNCBIlink,
} from 'cbioportal-frontend-commons';
import 'rc-tooltip/assets/bootstrap_white.css';

export interface IDriverAnnotationControlsState {
    distinguishDrivers: boolean;

    annotateDriversOncoKbDisabled: boolean;
    annotateDriversOncoKbError: boolean;
    annotateDriversOncoKb: boolean;

    annotateDriversHotspotsDisabled?: boolean;
    annotateDriversHotspotsError?: boolean;
    annotateDriversHotspots?: boolean;

    annotateDriversCBioPortal: boolean;
    annotateCBioPortalInputValue: string;

    annotateDriversCOSMIC?: boolean;
    annotateCOSMICInputValue?: string;

    customDriverAnnotationBinaryMenuLabel?: string;
    customDriverAnnotationTiersMenuLabel?: string;
    customDriverAnnotationTiers?: string[];
    selectedCustomDriverAnnotationTiers?: ObservableMap<boolean>;
    annotateCustomDriverBinary?: boolean;
}

export interface IDriverAnnotationControlsHandlers {
    onSelectDistinguishDrivers: (distinguish: boolean) => void;
    onSelectAnnotateOncoKb: (annotate: boolean) => void;
    onSelectAnnotateHotspots?: (annotate: boolean) => void;
    onSelectAnnotateCBioPortal: (annotate: boolean) => void;
    onSelectAnnotateCOSMIC?: (annotate: boolean) => void;
    onChangeAnnotateCBioPortalInputValue: (value: string) => void;
    onChangeAnnotateCOSMICInputValue?: (value: string) => void;
    onSelectCustomDriverAnnotationBinary?: (s: boolean) => void;
    onSelectCustomDriverAnnotationTier?: (value: string, s: boolean) => void;
}

export interface IDriverAnnotationControlsProps {
    state: IDriverAnnotationControlsState & IObservableObject;
    handlers: IDriverAnnotationControlsHandlers;
}

enum EVENT_KEY {
    distinguishDrivers = '0',
    annotateOncoKb = '1',
    annotateHotspots = '2',
    annotateCBioPortal = '3',
    annotateCOSMIC = '4',
    customDriverBinaryAnnotation = '5',
}

@observer
export default class DriverAnnotationControls extends React.Component<
    IDriverAnnotationControlsProps,
    {}
> {
    @autobind
    private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        switch ((event.target as HTMLInputElement).value) {
            case EVENT_KEY.distinguishDrivers:
                this.props.handlers.onSelectDistinguishDrivers(
                    !this.props.state.distinguishDrivers
                );
                break;
            case EVENT_KEY.annotateOncoKb:
                this.props.handlers.onSelectAnnotateOncoKb(
                    !this.props.state.annotateDriversOncoKb
                );
                break;
            case EVENT_KEY.annotateHotspots:
                this.props.handlers.onSelectAnnotateHotspots &&
                    this.props.handlers.onSelectAnnotateHotspots(
                        !this.props.state.annotateDriversHotspots
                    );
                break;
            case EVENT_KEY.annotateCBioPortal:
                this.props.handlers.onSelectAnnotateCBioPortal(
                    !this.props.state.annotateDriversCBioPortal
                );
                break;
            case EVENT_KEY.annotateCOSMIC:
                this.props.handlers.onSelectAnnotateCOSMIC &&
                    this.props.handlers.onSelectAnnotateCOSMIC(
                        !this.props.state.annotateDriversCOSMIC
                    );
                break;
            case EVENT_KEY.customDriverBinaryAnnotation:
                this.props.handlers.onSelectCustomDriverAnnotationBinary &&
                    this.props.handlers.onSelectCustomDriverAnnotationBinary(
                        !this.props.state.annotateCustomDriverBinary
                    );
                break;
        }
    }

    @autobind
    private onCustomDriverTierCheckboxClick(
        event: React.MouseEvent<HTMLInputElement>
    ) {
        let a = 1;
        this.props.handlers.onSelectCustomDriverAnnotationTier &&
            this.props.handlers.onSelectCustomDriverAnnotationTier(
                (event.target as HTMLInputElement).value,
                !(
                    this.props.state.selectedCustomDriverAnnotationTiers &&
                    this.props.state.selectedCustomDriverAnnotationTiers.get(
                        (event.target as HTMLInputElement).value
                    )
                )
            );
    }

    render() {
        return (
            <div>
                <div className="checkbox">
                    <label>
                        <input
                            data-test="ColorByDriver"
                            type="checkbox"
                            value={EVENT_KEY.distinguishDrivers}
                            checked={this.props.state.distinguishDrivers}
                            onClick={this.onInputClick}
                        />{' '}
                        Putative drivers vs VUS:
                    </label>
                </div>
                <div style={{ marginLeft: '20px' }}>
                    {!this.props.state.annotateDriversOncoKbDisabled && (
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    value={EVENT_KEY.annotateOncoKb}
                                    checked={
                                        this.props.state.annotateDriversOncoKb
                                    }
                                    onClick={this.onInputClick}
                                    data-test="annotateOncoKb"
                                    disabled={
                                        this.props.state
                                            .annotateDriversOncoKbError
                                    }
                                />
                                {this.props.state
                                    .annotateDriversOncoKbError && (
                                    <ErrorIcon
                                        style={{ marginRight: 4 }}
                                        tooltip={
                                            <span>
                                                Error loading OncoKb data.
                                                Please refresh the page or try
                                                again later.
                                            </span>
                                        }
                                    />
                                )}
                                <DefaultTooltip
                                    overlay={
                                        <span>Oncogenicity from OncoKB</span>
                                    }
                                    placement="top"
                                >
                                    <img
                                        src={require('../../../rootImages/oncokb.png')}
                                        style={{
                                            maxHeight: '12px',
                                            cursor: 'pointer',
                                            marginRight: '5px',
                                        }}
                                    />
                                </DefaultTooltip>
                                driver annotation
                            </label>
                        </div>
                    )}
                    {this.props.handlers.onSelectAnnotateHotspots &&
                        !this.props.state.annotateDriversHotspotsDisabled && (
                            <div className="checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        value={EVENT_KEY.annotateHotspots}
                                        checked={
                                            this.props.state
                                                .annotateDriversHotspots
                                        }
                                        onClick={this.onInputClick}
                                        data-test="annotateHotspots"
                                        disabled={
                                            this.props.state
                                                .annotateDriversHotspotsError
                                        }
                                    />
                                    {this.props.state
                                        .annotateDriversHotspotsError && (
                                        <ErrorIcon
                                            style={{ marginRight: 4 }}
                                            tooltip={
                                                <span>
                                                    Error loading Hotspots data.
                                                    Please refresh the page or
                                                    try again later.
                                                </span>
                                            }
                                        />
                                    )}
                                    Hotspots
                                    <DefaultTooltip
                                        overlay={
                                            <div
                                                style={{
                                                    maxWidth: '400px',
                                                }}
                                            >
                                                Identified as a recurrent
                                                hotspot (statistically
                                                significant) in a
                                                population-scale cohort of tumor
                                                samples of various cancer types
                                                using methodology based in part
                                                on{' '}
                                                <a
                                                    href={getNCBIlink(
                                                        '/pubmed/26619011'
                                                    )}
                                                    target="_blank"
                                                >
                                                    Chang et al., Nat
                                                    Biotechnol, 2016.
                                                </a>
                                                Explore all mutations at{' '}
                                                <a
                                                    href="https://www.cancerhotspots.org"
                                                    target="_blank"
                                                >
                                                    https://cancerhotspots.org
                                                </a>
                                            </div>
                                        }
                                        placement="top"
                                    >
                                        <img
                                            src={require('../../../rootImages/cancer-hotspots.svg')}
                                            style={{
                                                height: '15px',
                                                width: '15px',
                                                cursor: 'pointer',
                                                marginLeft: '5px',
                                            }}
                                        />
                                    </DefaultTooltip>
                                </label>
                            </div>
                        )}
                    {this.props.handlers
                        .onChangeAnnotateCBioPortalInputValue && (
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    value={EVENT_KEY.annotateCBioPortal}
                                    checked={
                                        this.props.state
                                            .annotateDriversCBioPortal
                                    }
                                    onClick={this.onInputClick}
                                    data-test="annotateCBioPortalCount"
                                />
                                cBioPortal >=
                            </label>
                            <EditableSpan
                                value={
                                    this.props.state
                                        .annotateCBioPortalInputValue || ''
                                }
                                setValue={
                                    this.props.handlers
                                        .onChangeAnnotateCBioPortalInputValue
                                }
                                numericOnly={true}
                                textFieldAppearance={true}
                                maxChars={10}
                            />
                        </div>
                    )}
                    {this.props.handlers.onChangeAnnotateCOSMICInputValue && (
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    value={EVENT_KEY.annotateCOSMIC}
                                    checked={
                                        this.props.state.annotateDriversCOSMIC
                                    }
                                    onClick={this.onInputClick}
                                    data-test="annotateCOSMICCount"
                                />
                                COSMIC >=
                            </label>
                            <EditableSpan
                                value={
                                    this.props.state.annotateCOSMICInputValue ||
                                    ''
                                }
                                setValue={
                                    this.props.handlers
                                        .onChangeAnnotateCOSMICInputValue
                                }
                                numericOnly={true}
                                textFieldAppearance={true}
                                maxChars={10}
                            />
                        </div>
                    )}
                    {!!this.props.state
                        .customDriverAnnotationBinaryMenuLabel && (
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={
                                        this.props.state
                                            .annotateCustomDriverBinary
                                    }
                                    value={
                                        EVENT_KEY.customDriverBinaryAnnotation
                                    }
                                    onClick={this.onInputClick}
                                    data-test="annotateCustomBinary"
                                />{' '}
                                {
                                    this.props.state
                                        .customDriverAnnotationBinaryMenuLabel
                                }
                                <img
                                    src={require('../../../rootImages/driver.png')}
                                    alt="driver filter"
                                    style={{
                                        height: '15px',
                                        width: '15px',
                                        cursor: 'pointer',
                                        marginLeft: '5px',
                                    }}
                                />
                            </label>
                        </div>
                    )}
                    {!!this.props.state
                        .customDriverAnnotationTiersMenuLabel && (
                        <span data-test="annotateCustomTiers" >
                            <span className="caret" />
                            &nbsp;&nbsp;
                            <span>
                                {
                                    this.props.state
                                        .customDriverAnnotationTiersMenuLabel
                                }
                            </span>
                            &nbsp;
                            <img
                                src={require('../../../rootImages/driver_tiers.png')}
                                alt="driver tiers filter"
                                style={{
                                    height: '15px',
                                    width: '15px',
                                    cursor: 'pointer',
                                    marginLeft: '5px',
                                }}
                            />
                            <div style={{ marginLeft: '30px' }}>
                                {(
                                    this.props.state
                                        .customDriverAnnotationTiers || []
                                ).map(tier => (
                                    <div className="checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                value={tier}
                                                checked={
                                                    !!(
                                                        this.props.state
                                                            .selectedCustomDriverAnnotationTiers &&
                                                        this.props.state.selectedCustomDriverAnnotationTiers.get(
                                                            tier
                                                        )
                                                    )
                                                }
                                                onClick={
                                                    this
                                                        .onCustomDriverTierCheckboxClick
                                                }
                                            />{' '}
                                            {tier}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </span>
                    )}
                </div>
            </div>
        );
    }
}
