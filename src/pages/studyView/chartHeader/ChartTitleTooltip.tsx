import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { IChartHeaderProps } from './ChartHeader';
import summaryData from '../summary.json';
import { Tabs, Tab } from 'react-bootstrap';

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
                <Tabs defaultActiveKey="summary" id="chart-tooltip-tabs">
                    <Tab eventKey="summary" title="From Paper">
                        <div style={{ padding: '10px 0' }}>
                            {chartInfo.summary_a_paper_only}
                        </div>
                    </Tab>
                    <Tab eventKey="details" title="From Internet">
                        <div style={{ padding: '10px 0' }}>
                            {chartInfo.summary_b_extended_analysis}
                        </div>
                    </Tab>
                    <Tab eventKey="references" title="Follow-ups">
                        <div style={{ padding: '10px 0' }}>
                            <ul>
                                {chartInfo.follow_up_questions.map(
                                    (t: string) => (
                                        <li>{t}</li>
                                    )
                                )}
                            </ul>
                        </div>
                    </Tab>
                </Tabs>
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
