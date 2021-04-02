import * as React from 'react';
import { DownloadControls } from 'cbioportal-frontend-commons';
import AppConfig from 'appConfig';

interface IChartContainer {
    getSVGElement?: () => SVGElement | null;
    exportFileName?: string;
}

export default class ChartContainer extends React.Component<
    IChartContainer,
    {}
> {
    render() {
        return (
            <div className="borderedChart inlineBlock">
                {!AppConfig.serverConfig.skin_hide_download_controls && (
                    <DownloadControls
                        filename={this.props.exportFileName || 'chart-download'}
                        dontFade={true}
                        getSvg={this.props.getSVGElement!}
                        type="button"
                        style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 10,
                        }}
                    />
                )}
                <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}
