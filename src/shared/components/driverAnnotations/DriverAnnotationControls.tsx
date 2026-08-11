import * as React from 'react';
import { observer } from 'mobx-react';
import ErrorIcon from '../ErrorIcon';
import autobind from 'autobind-decorator';
import {
    IDriverAnnotationControlsState,
    IDriverAnnotationControlsHandlers,
} from '../../alterationFiltering/AnnotationFilteringSettings';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { hotspotLink, hotspotPublication } from 'react-mutation-mapper';
import 'rc-tooltip/assets/bootstrap_white.css';
import styles from './styles.module.scss';
import InfoIcon from 'shared/components/InfoIcon';

enum EVENT_KEY {
    distinguishDrivers = '0',
    annotateOncoKb = '1',
    annotateHotspots = '2',
    annotateCBioPortal = '3',
    customDriverBinaryAnnotation = '5',
}

export interface DriverAnnotationControlsProps {
    state: IDriverAnnotationControlsState;
    handlers: IDriverAnnotationControlsHandlers;
    showOnckbAnnotationControls?: boolean;
}

@observer
export default class DriverAnnotationControls extends React.Component<
    DriverAnnotationControlsProps,
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
            <>
                <div>
                    <p className={styles.headerSubsection}>
                        Driver annotations:
                        <InfoIcon
                            style={{ color: 'grey' }}
                            divStyle={{
                                display: 'inline-block',
                                marginLeft: 6,
                            }}
                            tooltip={<>Annotate drivers from these sources</>}
                        />
                    </p>
                    <div style={{ marginLeft: '20px' }}>
                        {this.props.showOnckbAnnotationControls && (
                            <>
                                {!this.props.state
                                    .annotateDriversOncoKbDisabled && (
                                    <div className="checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                value={EVENT_KEY.annotateOncoKb}
                                                checked={
                                                    this.props.state
                                                        .annotateDriversOncoKb
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
                                                            Error loading OncoKb
                                                            data. Please refresh
                                                            the page or try
                                                            again later.
                                                        </span>
                                                    }
                                                />
                                            )}
                                            <img
                                                src={require('oncokb-styles/dist/images/logo/oncokb.svg')}
                                                alt="OncoKB SVG"
                                                style={{
                                                    maxHeight: '12px',
                                                    cursor: 'pointer',
                                                    marginRight: '5px',
                                                }}
                                            />
                                            <InfoIcon
                                                style={{ color: 'grey' }}
                                                divStyle={{
                                                    display: 'inline-block',
                                                    marginLeft: 6,
                                                }}
                                                tooltip={
                                                    <>
                                                        Oncogenicity from
                                                        OncoKB™
                                                    </>
                                                }
                                            />
                                        </label>
                                    </div>
                                )}
                                {this.props.handlers.onSelectAnnotateHotspots &&
                                    !this.props.state
                                        .annotateDriversHotspotsDisabled && (
                                        <div className="checkbox">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    value={
                                                        EVENT_KEY.annotateHotspots
                                                    }
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
                                                        style={{
                                                            marginRight: 4,
                                                        }}
                                                        tooltip={
                                                            <span>
                                                                Error loading
                                                                Hotspots data.
                                                                Please refresh
                                                                the page or try
                                                                again later.
                                                            </span>
                                                        }
                                                    />
                                                )}
                                                Hotspots
                                                <DefaultTooltip
                                                    overlay={
                                                        <div
                                                            style={{
                                                                maxWidth:
                                                                    '400px',
                                                            }}
                                                        >
                                                            {hotspotPublication(
                                                                true,
                                                                true
                                                            )}
                                                            <br />
                                                            <br />
                                                            {hotspotLink(
                                                                true,
                                                                true
                                                            )}
                                                        </div>
                                                    }
                                                    placement="top"
                                                >
                                                    <img
                                                        src={require('../../../rootImages/cancer-hotspots.svg')}
                                                        alt="Cancer Hotspots SVG"
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
                            </>
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
                                        src={require('../../../rootImages/driver.svg')}
                                        alt="driver filter"
                                        style={{
                                            height: '15px',
                                            width: '15px',
                                            cursor: 'pointer',
                                            marginLeft: '5px',
                                        }}
                                    />
                                    <InfoIcon
                                        style={{ color: 'grey' }}
                                        divStyle={{
                                            display: 'inline-block',
                                            marginLeft: 6,
                                        }}
                                        tooltip={
                                            <>
                                                Use driver annotations from
                                                source data
                                            </>
                                        }
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                </div>
                {!!this.props.state.customDriverAnnotationTiersMenuLabel && (
                    <span data-test="annotateCustomTiers">
                        <p className={styles.headerSubsection}>
                            {
                                this.props.state
                                    .customDriverAnnotationTiersMenuLabel
                            }
                            :
                            <InfoIcon
                                style={{ color: 'grey' }}
                                divStyle={{
                                    display: 'inline-block',
                                    marginLeft: 6,
                                }}
                                tooltip={
                                    <>
                                        Consider these annotation tiers as
                                        driver
                                    </>
                                }
                            />
                        </p>
                        <div style={{ marginLeft: '20px' }}>
                            {(
                                this.props.state.customDriverAnnotationTiers ||
                                []
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
            </>
        );
    }
}
