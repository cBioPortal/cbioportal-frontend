import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { action, computed, makeObservable, observable } from 'mobx';
import styles from '../styles.module.scss';
import { CirclePicker, CirclePickerProps } from 'react-color';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { ColorPickerIcon } from 'pages/groupComparison/comparisonGroupManager/ColorPickerIcon';
import {
    CLI_FEMALE_COLOR,
    CLI_NO_COLOR,
    CLI_YES_COLOR,
    DARK_GREY,
    rgbaToHex,
} from 'shared/lib/Colors';
import { COLORS } from 'pages/studyView/StudyViewUtils';
import { ResultsViewPageStore } from 'pages/resultsView/ResultsViewPageStore';
import {
    IOncoprintControlsHandlers,
    IOncoprintControlsState,
} from './OncoprintControls';
import { RGBAColor } from 'oncoprintjs';
import { ClinicalTrackSpec } from '../Oncoprint';
import _ from 'lodash';

export interface IGroupCheckboxProps {
    store?: ResultsViewPageStore;
    handlers: IOncoprintControlsHandlers;
    state: IOncoprintControlsState;
    handleClinicalAttributeColorChange?: (
        label: string,
        value: string,
        color: RGBAColor | undefined
    ) => void;
    clinicalAttributeLabel: string;
    clinicalAttributeValue: any;
    color: RGBAColor;
    clinicalTrack: ClinicalTrackSpec;
    // markedWithWarningSign: boolean;
}

const COLOR_UNDEFINED = '#FFFFFF';

@observer
export default class OncoprintColors extends React.Component<
    IGroupCheckboxProps,
    {}
> {
    constructor(props: IGroupCheckboxProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    handleChangeComplete = (color: any, event: any) => {
        // if same color is select, unselect it (go back to no color)
        if (color.hex === rgbaToHex(this.props.color)) {
            this.props.handleClinicalAttributeColorChange &&
                this.props.handleClinicalAttributeColorChange(
                    this.props.clinicalAttributeLabel,
                    this.props.clinicalAttributeValue,
                    undefined
                );
        } else {
            this.props.handleClinicalAttributeColorChange &&
                this.props.handleClinicalAttributeColorChange(
                    this.props.clinicalAttributeLabel,
                    this.props.clinicalAttributeValue,
                    [color.rgb.r, color.rgb.g, color.rgb.b, color.rgb.a]
                );
        }
        // set changed track key
        this.props.handlers.onSetChangedTrackKey &&
            this.props.handlers.onSetChangedTrackKey(
                this.props.clinicalTrack.key
            );
    };

    @computed get colorList() {
        let colors: string[] = COLORS.slice(0, 20);
        colors.push(CLI_YES_COLOR);
        colors.push(CLI_NO_COLOR);
        colors.push(CLI_FEMALE_COLOR);
        colors.push(DARK_GREY);
        return colors;
    }

    buildColorChooserWidget = () => (
        <Popover>
            <div
                onMouseDown={e => {
                    e.nativeEvent.stopImmediatePropagation();
                }}
                onClick={e => {
                    e.nativeEvent.stopImmediatePropagation();
                }}
            >
                <CirclePicker
                    colors={this.colorList}
                    circleSize={20}
                    circleSpacing={3}
                    onChangeComplete={this.handleChangeComplete}
                    color={rgbaToHex(this.props.color)}
                    width="140px"
                />
            </div>
        </Popover>
    );

    render() {
        return (
            <div>
                {this.props.clinicalAttributeValue}
                {/* <DefaultTooltip
                    overlay={
                        'You have selected identical colors for some alterations.'
                    }
                > */}
                {/* <span>
                        {this.props.markedWithWarningSign && (
                            <i
                                className="fa fa-warning"
                                style={{
                                    cursor: 'pointer',
                                    color: '#fad201',
                                    position: 'relative',
                                    top: '1px',
                                    right: '2px',
                                }}
                            />
                        )}
                    </span> */}
                {/* </DefaultTooltip> */}
                <OverlayTrigger
                    containerPadding={40}
                    trigger="click"
                    placement="bottom"
                    overlay={this.buildColorChooserWidget()}
                    rootClose={true}
                >
                    <DefaultTooltip
                        overlay={
                            'Optional: Select color for alteration to be used in oncoprint. If no color is selected, the default color will be applied.'
                        }
                    >
                        <span
                            style={{
                                float: 'right',
                            }}
                        >
                            <ColorPickerIcon
                                color={
                                    rgbaToHex(this.props.color) ||
                                    COLOR_UNDEFINED
                                }
                            />
                        </span>
                    </DefaultTooltip>
                </OverlayTrigger>
            </div>
        );
    }
}
