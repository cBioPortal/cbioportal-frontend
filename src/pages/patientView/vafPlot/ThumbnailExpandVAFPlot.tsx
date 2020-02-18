import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import { VAFPlot, IVAFPlotProps, MutationFrequenciesBySample } from './VAFPlot';
import Tooltip, { RCTooltip } from 'rc-tooltip';
import { IKeyedIconData } from '../genomicOverview/GenomicOverviewUtils';
import { DefaultTooltip, isWebdriver } from 'cbioportal-frontend-commons';

export type IThumbnailExpandVAFPlotProps = {
    data: MutationFrequenciesBySample;
    order?: { [s: string]: number };
    colors?: { [s: string]: string };
    labels?: { [s: string]: string };
    overlayPlacement?: RCTooltip.Placement;
    cssClass?: string;
    genePanelIconData?: IKeyedIconData;
};

export class ThumbnailExpandVAFPlot extends React.Component<IThumbnailExpandVAFPlotProps, {}> {
    public static defaultProps = {
        order: {},
        colors: {},
        labels: {},
        overlayPlacement: 'left',
    };

    render() {
        let thumbnailProps = {
            data: this.props.data,
            colors: this.props.colors,
            order: this.props.order,
            show_controls: false,
            nolegend: true,
            width: 64,
            height: 64,
            label_font_size: '6.5px',
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
            genepanel_icon_data: this.props.genePanelIconData,
        };

        return (
            <DefaultTooltip
                placement={this.props.overlayPlacement}
                trigger={['hover', 'focus']}
                overlay={<VAFPlot {...expandedProps} />}
                arrowContent={<div className="rc-tooltip-arrow-inner" />}
                destroyTooltipOnHide={false}
                mouseLeaveDelay={isWebdriver ? 2 : 0.05}
            >
                <div className={this.props.cssClass || ''}>
                    <VAFPlot {...thumbnailProps} />
                </div>
            </DefaultTooltip>
        );
    }
}
