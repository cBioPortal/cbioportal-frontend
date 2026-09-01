import * as React from 'react';
import './styles.scss';
import { action, computed, makeObservable } from 'mobx';
import { inputBoxChangeTimeoutEvent } from '../../lib/EventUtils';

export interface IDoubleHandleSliderProps {
    id: string;
    min: string;
    max: string;
    lowerValue?: number;
    upperValue?: number;
    callbackLowerValue: (lowerValue: number) => void;
    callbackUpperValue: (upperValue: number) => void;
    // Overall widget width. Defaults to DEFAULT_WIDTH, which comfortably fits the
    // small integers the mutation table uses; callers whose values run longer
    // (e.g. server-computed metadata ranges) can widen it so both input boxes fit
    // side by side instead of the upper one wrapping below the lower one.
    width?: string;
}

export interface IDoubleHandleSliderState {
    lowerValue: number;
    upperValue: number;
}

const DEFAULT_WIDTH = '135px';
// Horizontal chrome of a Bootstrap 3 `.form-control.input-sm`: 10px padding and a
// 1px border on each side. The value itself is measured in `ch` units (the advance
// width of "0"), which is exact for the digit strings these boxes hold.
const INPUT_BOX_CHROME_PX = 22;
const PRECISION = 10;
const POWER = 10 ** PRECISION;
export default class DoubleHandleSlider extends React.Component<
    IDoubleHandleSliderProps,
    IDoubleHandleSliderState
> {
    // fixed precision number equivalent to this.props.min
    @computed get min() {
        const tmp = +(+this.props.min).toFixed(PRECISION + 1);
        return Math.floor(POWER * tmp) / POWER;
    }
    // fixed precision number equivalent to this.props.max
    @computed get max() {
        const tmp = +(+this.props.max).toFixed(PRECISION + 1);
        return Math.ceil(POWER * tmp) / POWER;
    }

    @computed get width() {
        return this.props.width || DEFAULT_WIDTH;
    }

    @computed get id() {
        return this.props.id.replace(/\s+/, '_');
    }

    // this is used to prevent unintended changes to the handle positions
    // which may occur once a handle is released, e.g. due to table resizing
    private justReleasedHandle: boolean;

    constructor(props: IDoubleHandleSliderProps) {
        super(props);
        makeObservable(this);

        this.justReleasedHandle = false;
        this.state = {
            lowerValue: this.props.lowerValue || this.min,
            upperValue: this.props.upperValue || this.max,
        };
    }

    componentDidMount() {
        this.syncValues(true);
        this.syncValues(false);
    }
    componentDidUpdate(prevProps: IDoubleHandleSliderProps) {
        if (prevProps !== this.props) {
            this.setState({
                lowerValue: this.props.lowerValue || this.min,
                upperValue: this.props.upperValue || this.max,
            });
        } else {
            this.syncValues(true);
            this.syncValues(false);
        }
    }

    get LHId() {
        return this.id + '-lowerValue-handle';
    }
    get UHId() {
        return this.id + '-upperValue-handle';
    }
    get LBId() {
        return this.id + '-lowerValue-box';
    }
    get UBId() {
        return this.id + '-upperValue-box';
    }
    get MIDId() {
        return this.id + '-middleTrack';
    }
    get LH() {
        return document.getElementById(this.LHId) as HTMLInputElement;
    }
    get UH() {
        return document.getElementById(this.UHId) as HTMLInputElement;
    }
    get LB() {
        return document.getElementById(this.LBId) as HTMLInputElement;
    }
    get UB() {
        return document.getElementById(this.UBId) as HTMLInputElement;
    }
    get MID() {
        const middleTracks = document.getElementsByClassName('middleTrack');
        for (let i = 0; i < middleTracks.length; i++) {
            if (middleTracks[i].id === this.MIDId) {
                return middleTracks[i] as HTMLElement;
            }
        }
        // should never reach here
        return middleTracks[0] as HTMLElement;
    }

    @computed get defaultStepSize() {
        const propsMin = this.props.min;
        const propsMax = this.props.max;
        // typeof check is needed since this.props.min/max is sometimes a number
        // despite specification of IDoubleHandleSliderProps, e.g. 'Start Pos'
        if (
            (typeof propsMin === 'string' && propsMin.includes('.')) ||
            (typeof propsMax === 'string' && propsMax.includes('.'))
        ) {
            return (this.max - this.min) / 100;
        } else {
            return 1;
        }
    }

    // Number of decimals implied by defaultStepSize. A fractional step of e.g.
    // (max - min) / 100 otherwise produces raw binary-float values such as
    // 8.503000000000002, which overflow the input box and read as truncated.
    @computed get stepDecimals() {
        const step = this.defaultStepSize;
        if (!isFinite(step) || step <= 0 || Number.isInteger(step)) {
            return 0;
        }
        return Math.min(
            PRECISION,
            Math.max(0, Math.ceil(-Math.log10(step)) + 1)
        );
    }

    private roundToStep(value: number) {
        const factor = 10 ** this.stepDecimals;
        return Math.round(value * factor) / factor;
    }

    private syncValues(isLower: boolean, includeCallback?: boolean) {
        if (isLower) {
            this.LH.value = '' + this.state.lowerValue;
            this.LB.value = '' + this.state.lowerValue;

            const percentLeft =
                (this.state.lowerValue - this.min) / (this.max - this.min);
            this.MID.style.left = 100 * percentLeft + '%';

            if (includeCallback) {
                this.props.callbackLowerValue(this.state.lowerValue);
            }
        } else {
            this.UH.value = '' + this.state.upperValue;
            this.UB.value = '' + this.state.upperValue;

            const percentRight =
                (this.max - this.state.upperValue) / (this.max - this.min);
            this.MID.style.right = 100 * percentRight + '%';

            if (includeCallback) {
                this.props.callbackUpperValue(this.state.upperValue);
            }
        }

        this.updateInputBoxWidth(isLower);
    }

    private updateInputBoxWidth(isLower: boolean) {
        const box = isLower ? this.LB : this.UB;
        const characters = Math.max(box.value.length, 1);
        box.style.width = `calc(${characters}ch + ${INPUT_BOX_CHROME_PX}px)`;
    }

    @action
    private onChangeInputBox(
        limit: number,
        otherHandle: number,
        isBeyondLimit: (x: number) => boolean,
        wouldCrossHandles: (x: number) => boolean,
        updateState: (x: number) => void,
        syncValuesNoUpdate: () => void
    ) {
        return (() =>
            inputBoxChangeTimeoutEvent(input => {
                if (!input || isBeyondLimit(+input)) {
                    updateState(limit);
                } else if (wouldCrossHandles(+input)) {
                    updateState(otherHandle);
                } else if (!isNaN(+input)) {
                    updateState(+input);
                } else {
                    syncValuesNoUpdate();
                }
            }, 300))();
    }

    @action
    private onChangeSlider(
        isLower: boolean,
        wouldCrossHandles: (x: number) => boolean,
        updateState: (x: number) => void
    ) {
        return (e: any) => {
            if (this.justReleasedHandle) {
                this.justReleasedHandle = false;
                this.syncValues(isLower);
            } else {
                const otherHandle = isLower
                    ? this.state.upperValue
                    : this.state.lowerValue;
                const newValue = wouldCrossHandles(+e.target.value)
                    ? otherHandle
                    : this.roundToStep(+e.target.value);
                updateState(newValue);
            }
        };
    }

    render() {
        return (
            <div
                style={{
                    width: this.width,
                    margin: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div className="slider">
                    <div className="mainTrack" />
                    <div id={this.MIDId} className="middleTrack" />
                    <input
                        type="range"
                        id={this.LHId}
                        className="handle"
                        min={this.min}
                        max={this.max}
                        step={this.defaultStepSize}
                        defaultValue={'' + this.state.lowerValue}
                        onMouseUp={(e: any) => {
                            this.justReleasedHandle = true;
                            this.setState(
                                {
                                    lowerValue: this.roundToStep(
                                        +e.target.value
                                    ),
                                },
                                () => this.syncValues(true, true)
                            );
                        }}
                        onChange={this.onChangeSlider(
                            true,
                            (x: number) => x > this.state.upperValue,
                            (x: number) =>
                                this.setState({ lowerValue: x }, () =>
                                    this.syncValues(true)
                                )
                        )}
                    />
                    <input
                        type="range"
                        id={this.UHId}
                        className="handle"
                        min={this.min}
                        max={this.max}
                        step={this.defaultStepSize}
                        defaultValue={'' + this.state.upperValue}
                        onMouseUp={(e: any) => {
                            this.justReleasedHandle = true;
                            this.setState(
                                {
                                    upperValue: this.roundToStep(
                                        +e.target.value
                                    ),
                                },
                                () => this.syncValues(false, true)
                            );
                        }}
                        onChange={this.onChangeSlider(
                            false,
                            (x: number) => x < this.state.lowerValue,
                            (x: number) =>
                                this.setState({ upperValue: x }, () =>
                                    this.syncValues(false)
                                )
                        )}
                    />
                </div>

                <div style={{ marginTop: '13px' }}>
                    <input
                        id={this.LBId}
                        className="form-control input-sm"
                        style={{ float: 'left', maxWidth: 'calc(50% - 3px)' }}
                        defaultValue={'' + this.state.lowerValue}
                        onChange={this.onChangeInputBox(
                            this.min,
                            this.state.upperValue,
                            (x: number) => x < this.min,
                            (x: number) => x > this.state.upperValue,
                            (x: number) =>
                                this.setState({ lowerValue: x }, () =>
                                    this.syncValues(true, true)
                                ),
                            () => this.syncValues(true)
                        )}
                        onInput={() => this.updateInputBoxWidth(true)}
                    />
                    <input
                        id={this.UBId}
                        className="form-control input-sm"
                        style={{ float: 'right', maxWidth: 'calc(50% - 3px)' }}
                        defaultValue={'' + this.state.upperValue}
                        onChange={this.onChangeInputBox(
                            this.max,
                            this.state.lowerValue,
                            (x: number) => x > this.max,
                            (x: number) => x < this.state.lowerValue,
                            (x: number) =>
                                this.setState({ upperValue: x }, () =>
                                    this.syncValues(false, true)
                                ),
                            () => this.syncValues(false)
                        )}
                        onInput={() => this.updateInputBoxWidth(false)}
                    />
                </div>
            </div>
        );
    }
}
