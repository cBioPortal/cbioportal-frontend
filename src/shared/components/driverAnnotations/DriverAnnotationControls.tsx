import * as React from 'react';
import { observer } from 'mobx-react';
import ErrorIcon from '../ErrorIcon';
import autobind from 'autobind-decorator';
import {
    IDriverAnnotationControlsState,
    IDriverAnnotationControlsHandlers,
} from '../../driverAnnotation/DriverAnnotationSettings';
import {
    EditableSpan,
    DefaultTooltip,
    getNCBIlink,
} from 'cbioportal-frontend-commons';
import 'rc-tooltip/assets/bootstrap_white.css';

export interface IDriverAnnotationControlsProps {
    state: IDriverAnnotationControlsState;
    handlers: IDriverAnnotationControlsHandlers;
    disabled?: boolean;
}

enum EVENT_KEY {
    distinguishDrivers = '0',
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
            <div>
                {(this.props.state.customDriverAnnotationTiers || []).map(
                    tier => (
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
                                    disabled={this.props.disabled}
                                    onClick={
                                        this.onCustomDriverTierCheckboxClick
                                    }
                                />{' '}
                                {tier}
                            </label>
                        </div>
                    )
                )}
            </div>
        );
    }
}
