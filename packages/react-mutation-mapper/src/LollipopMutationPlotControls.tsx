import * as React from "react";
import {observer} from "mobx-react";
import classnames from "classnames";
import {DownloadControls, EditableSpan} from "cbioportal-frontend-commons";

import TrackSelector, {TrackDataStatus, TrackName, TrackVisibility} from "./TrackSelector";

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
    tracks?: TrackName[];
    trackVisibility?: TrackVisibility;
    trackDataStatus?: TrackDataStatus;
    showYMaxSlider?: boolean;
    showLegendToggle?: boolean;
    showDownloadControls?: boolean;
    onTrackVisibilityChange?: (selectedTrackIds: string[]) => void;
    getSVG: () => SVGElement;
}

@observer
export default class LollipopMutationPlotControls extends React.Component<ILollipopMutationPlotControlsProps, {}>
{
    public static defaultProps: Partial<ILollipopMutationPlotControlsProps> = {
        showYMaxSlider: true,
        showLegendToggle: true,
        showDownloadControls: true
    };

    protected get yMaxSlider()
    {
        return (
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
        );
    }

    protected get trackSelector()
    {
        return (
            <div
                className={classnames("annotation-track-selector", "small")}
                style={{width: 180, marginRight: 7}}
            >
                <TrackSelector
                    tracks={this.props.tracks}
                    trackVisibility={this.props.trackVisibility}
                    trackDataStatus={this.props.trackDataStatus}
                    onChange={this.props.onTrackVisibilityChange}
                />
            </div>
        );
    }

    protected get legendToggle()
    {
        return (
            <button
                className="btn btn-default btn-xs"
                onClick={this.props.onToggleLegend}
                style={{marginRight: 7}}
            >
                Legend <i className="fa fa-eye" aria-hidden="true" />
            </button>
        );
    }

    protected get downloadControls()
    {
        return (
            <DownloadControls
                getSvg={this.props.getSVG}
                filename={`${this.props.hugoGeneSymbol}_lollipop.svg`}
                dontFade={true}
                collapse={true}
            />
        );
    }

    public render()
    {
        return (
            <div
                className={classnames("lollipop_mutation_plot__controls",
                    this.props.showControls ? styles["fade-in"] : styles["fade-out"])}
            >
                <div style={{display:"flex", alignItems:"center"}}>
                    {this.props.trackVisibility && this.props.onTrackVisibilityChange && this.trackSelector}
                    {this.props.showYMaxSlider && this.yMaxSlider}
                    <div style={{display: "flex", marginLeft: "auto"}}>
                        {this.props.showLegendToggle && this.legendToggle}
                        {this.props.showDownloadControls && this.downloadControls}
                    </div>
                </div>
                {'  '}
            </div>
        );
    }
}
