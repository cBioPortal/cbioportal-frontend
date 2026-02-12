import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { IChartHeaderProps } from './ChartHeader';
import summaryData from '../summary.json';

interface IChartTitleTooltipProps {
    chartProps: IChartHeaderProps;
}

export const ChartTitleTooltip: React.FC<IChartTitleTooltipProps> = ({
    chartProps,
}) => {
    // Try to find the chart in summary.json using the uniqueKey
    const chartId = chartProps.chartMeta.uniqueKey;

    const matchKey = chartProps.chartMeta.displayName
        .toLowerCase()
        .replace(/-/g, '')
        .replace(/\([^\)]*\)/g, '');

    const chartInfo = summaryData.charts.find((chart: any) =>
        new RegExp(matchKey, 'i').test(chart.chart_name.replace(/-/g, ''))
    );

    if (!chartInfo) {
        console.log(matchKey);
    }

    const tooltipContent = chartInfo ? (
        <div style={{ maxWidth: 500 }}>
            <strong>{chartInfo.chart_name}</strong>
            <div style={{ marginTop: 8, fontSize: '13px' }}>
                {chartInfo.summary}
            </div>
            <div
                style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <button
                    style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '16px',
                    }}
                >
                    <i className="fa fa-thumbs-up" />
                </button>
                <button
                    style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '16px',
                    }}
                >
                    <i className="fa fa-thumbs-down" />
                </button>
                <button className={'button button-xs'}>Re-prompt</button>
                <a style={{ marginLeft: 50 }}>
                    AI makes mistakes. Please report inaccuracy here.
                </a>
            </div>
        </div>
    ) : (
        <div>{`No summary found for  ${chartId}`}</div>
    );

    return (
        <DefaultTooltip
            placement="right"
            overlay={tooltipContent}
            destroyTooltipOnHide={true}
        >
            <span
                style={{
                    color: '#999',
                    position: 'absolute',
                    left: 5,
                    cursor: 'pointer !important',
                }}
            >
                AI
            </span>
        </DefaultTooltip>
    );
};
