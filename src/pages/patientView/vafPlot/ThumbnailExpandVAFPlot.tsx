import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import {VAFPlot, IVAFPlotProps, MutationFrequenciesBySample} from './VAFPlot';
import Tooltip from "rc-tooltip";

export type IThumbnailExpandVAFPlotProps = {
    data: MutationFrequenciesBySample;
    order?: { [s:string]:number };
    colors?: { [s: string]:string };
    labels?: { [s:string]:string };
    overlayPlacement?: Tooltip.Placement;
    cssClass?: string;
};

export class ThumbnailExpandVAFPlot extends React.Component<IThumbnailExpandVAFPlotProps, {}> {

    public static defaultProps = {
        order: {},
        colors: {},
        labels: {},
        overlayPlacement: "left",
    };

    shouldComponentUpdate() {
        return false;
    }

    render() {
        let thumbnailProps = {
            data: this.props.data,
            colors: this.props.colors,
            order: this.props.order,
            show_controls: false,
            nolegend: true,
            width: 64,
            height: 64,
            label_font_size: "6.5px",
            xticks: 0,
            yticks: 0,
            margin_bottom: 15,
        };
        let expandedProps = {
            data: this.props.data,
            colors: this.props.colors,
            labels: this.props.labels,
            order: this.props.order,
            show_controls: true,
            nolegend: false,
            init_show_histogram: true,
            init_show_curve: true,
        };

        return (
            <DefaultTooltip
                placement={this.props.overlayPlacement}
                trigger={['hover', 'focus']}
                overlay={<VAFPlot {...expandedProps}/>}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                destroyTooltipOnHide={false}
            >
                <div className={ this.props.cssClass || '' }>
                    <VAFPlot
                            {...thumbnailProps}
                    />
                </div>
            </DefaultTooltip>
        );
    }
}
