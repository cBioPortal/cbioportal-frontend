import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { action, computed, makeObservable, observable } from 'mobx';
import styles from '../styles.module.scss';
import { CirclePicker, CirclePickerProps } from 'react-color';
import {
    OverlayTrigger as OverlayTriggerUntyped,
    Popover,
} from 'react-bootstrap';
// @types/react-bootstrap 0.32 OverlayTriggerProps has no `children` under @types/react 18.
const OverlayTrigger = OverlayTriggerUntyped as any;
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
import { RGBAColor } from 'oncoprintjs';
import { normalizeColorToRGBA } from './OncoprintColorPalette';
import _ from 'lodash';

export interface IGroupCheckboxProps {
    handleClinicalTrackColorChange?: (
        value: string,
        color: RGBAColor | undefined
    ) => void;
    clinicalTrackValue: any;
    color: RGBAColor;
}

const COLOR_UNDEFINED = '#FFFFFF';

@observer
export default class ClinicalTrackColorPicker extends React.Component<
    IGroupCheckboxProps,
    {}
> {
    constructor(props: IGroupCheckboxProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    handleChangeComplete = (color: any, event: any) => {
        // if same color is selected, unselect it (go back to default color)
        if (color.hex === rgbaToHex(this.props.color)) {
            this.props.handleClinicalTrackColorChange &&
                this.props.handleClinicalTrackColorChange(
                    this.props.clinicalTrackValue,
                    undefined
                );
        } else {
            this.props.handleClinicalTrackColorChange &&
                this.props.handleClinicalTrackColorChange(
                    this.props.clinicalTrackValue,
                    [color.rgb.r, color.rgb.g, color.rgb.b, color.rgb.a]
                );
        }
        // set changed track key
    };

    // Free text hex entry, held separately from props.color so that a half typed value does
    // not repaint the oncoprint. undefined means "show whatever color is currently applied".
    @observable private hexInput: string | undefined = undefined;

    @computed get hexInputValue() {
        return this.hexInput !== undefined
            ? this.hexInput
            : rgbaToHex(this.props.color) || '';
    }

    @computed get hexInputIsInvalid() {
        return (
            this.hexInput !== undefined &&
            this.hexInput.trim().length > 0 &&
            !normalizeColorToRGBA(this.hexInput)
        );
    }

    @action.bound
    private onHexInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.hexInput = e.target.value;
    }

    /**
     * Unlike a swatch click, typing the currently applied color must not be read as "unset
     * this color" - so this deliberately does not go through handleChangeComplete.
     */
    @action.bound
    private commitHexInput() {
        if (this.hexInput === undefined) {
            return;
        }
        const rgba = normalizeColorToRGBA(this.hexInput);
        if (rgba) {
            this.props.handleClinicalTrackColorChange &&
                this.props.handleClinicalTrackColorChange(
                    this.props.clinicalTrackValue,
                    rgba
                );
        }
        // either way, go back to tracking the applied color rather than leaving stale text
        this.hexInput = undefined;
    }

    @action.bound
    private onHexInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.commitHexInput();
        } else if (e.key === 'Escape') {
            this.hexInput = undefined;
        }
    }

    @computed get colorList() {
        let colors: string[] = COLORS.slice(0, 20);
        colors.push(CLI_YES_COLOR);
        colors.push(CLI_NO_COLOR);
        colors.push(CLI_FEMALE_COLOR);
        colors.push(DARK_GREY);
        return colors;
    }

    @computed get colorChooserElement() {
        return (
            <Popover>
                <div>
                    <CirclePicker
                        colors={this.colorList}
                        circleSize={20}
                        circleSpacing={3}
                        onChangeComplete={this.handleChangeComplete}
                        color={rgbaToHex(this.props.color)}
                        width="140px"
                    />
                    <div style={{ width: 140, marginTop: 8 }}>
                        <input
                            type="text"
                            className="form-control input-sm"
                            data-test="colorPickerHexInput"
                            aria-label="Hex color"
                            spellCheck={false}
                            placeholder="#rrggbb"
                            value={this.hexInputValue}
                            onChange={this.onHexInputChange}
                            onKeyDown={this.onHexInputKeyDown}
                            onBlur={this.commitHexInput}
                            style={
                                this.hexInputIsInvalid
                                    ? { borderColor: '#a94442' }
                                    : undefined
                            }
                        />
                        {this.hexInputIsInvalid && (
                            <div
                                className="text-danger"
                                data-test="colorPickerHexInputError"
                                style={{ fontSize: 11, marginTop: 2 }}
                            >
                                Enter a hex color, e.g. #1b9e77
                            </div>
                        )}
                    </div>
                </div>
            </Popover>
        );
    }

    render() {
        return (
            <OverlayTrigger
                containerPadding={40}
                trigger="click"
                placement="bottom"
                overlay={this.colorChooserElement}
                rootClose={true}
            >
                <DefaultTooltip
                    overlay={
                        'Optional: Select color for clinical track value to be used in oncoprint. If no color is selected, the default color will be applied.'
                    }
                >
                    <span
                        onClick={e => e.nativeEvent.stopImmediatePropagation()}
                    >
                        <ColorPickerIcon
                            color={
                                rgbaToHex(this.props.color) || COLOR_UNDEFINED
                            }
                        />
                    </span>
                </DefaultTooltip>
            </OverlayTrigger>
        );
    }
}
