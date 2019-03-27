import * as React from "react";
import {observer} from "mobx-react";
import classnames from "classnames";
import EditableSpan from "../editableSpan/EditableSpan";
import DownloadControls from "../downloadControls/DownloadControls";
import TrackSelector, {TrackDataStatus, TrackVisibility} from "../tracks/TrackSelector";

import styles from "./lollipopMutationPlot.module.scss";

interface ILollipopMutationPlotControlsProps
{
    showControls: boolean;
    hugoGeneSymbol: string;
    countRange: [number, number];
    onYAxisMaxSliderChange: (event: any) => void;
    onYAxisMaxChange: (inputValue: string) => void;
    onYMaxInputFocused: () => void;
    onYMaxInputBlurred: () => void;
    onToggleLegend: () => void;
    yMaxSlider: number;
    yMaxInput: number;
    trackVisibility?: TrackVisibility;
    trackDataStatus?: TrackDataStatus;
    onTrackVisibilityChange?: (selectedTrackIds: string[]) => void;
    getSVG: () => SVGElement;
}

@observer
export default class LollipopMutationPlotControls extends React.Component<ILollipopMutationPlotControlsProps, {}>
{
    public render()
    {
        return (
            <div
                className={classnames("lollipop_mutation_plot__controls",
                    this.props.showControls ? styles["fade-in"] : styles["fade-out"])}
            >
                <div style={{display:"flex", alignItems:"center"}}>
                    {
                        this.props.trackVisibility && this.props.onTrackVisibilityChange &&
                        <div
                            className={classnames("annotation-track-selector", "small")}
                            style={{width: 180, marginRight: 7}}
                        >
                            <TrackSelector
                                trackVisibility={this.props.trackVisibility}
                                trackDataStatus={this.props.trackDataStatus}
                                onChange={this.props.onTrackVisibilityChange}
                            />
                        </div>
                    }
                    <div className="small" style={{display: "flex", alignItems: "center", marginLeft: 10}}>
                        <span>Y-Axis Max:</span>
                        <input
                            style={{display:"inline-block", padding:0, width:200, marginLeft:10, marginRight:10}}
                            type="range"
                            min={this.props.countRange[0]}
                            max={this.props.countRange[1]}
                            step="1"
                            onChange={this.props.onYAxisMaxSliderChange}
                            value={this.props.yMaxSlider}
                        />
                        <EditableSpan
                            className={styles["ymax-number-input"]}
                            value={`${this.props.yMaxInput}`}
                            setValue={this.props.onYAxisMaxChange}
                            numericOnly={true}
                            onFocus={this.props.onYMaxInputFocused}
                            onBlur={this.props.onYMaxInputBlurred}
                        />
                    </div>
                    <div style={{display: "flex", marginLeft: "auto"}}>
                        <button
                            className="btn btn-default btn-xs"
                            onClick={this.props.onToggleLegend}
                            style={{marginRight: 7}}
                        >
                            Legend <i className="fa fa-eye" aria-hidden="true" />
                        </button>
                        <DownloadControls
                            getSvg={this.props.getSVG}
                            filename={`${this.props.hugoGeneSymbol}_lollipop.svg`}
                            dontFade={true}
                            collapse={true}
                        />
                    </div>
                </div>
                {'  '}
            </div>
        );
    }
}
