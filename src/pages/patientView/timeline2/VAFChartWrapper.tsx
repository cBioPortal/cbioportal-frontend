import React, { ReactSVGElement } from 'react';
import { observer } from 'mobx-react-lite';
import { TimelineStore } from 'cbioportal-clinical-timeline';
import SampleMarker from 'pages/patientView/timeline2/SampleMarker';
import {
    ISampleMetaDeta,
    ITimeline2Props,
} from 'pages/patientView/timeline2/TimelineWrapper';
import _ from 'lodash';

interface IVAFChartWrapperProps {
    store: TimelineStore;
    sampleMetaData: ISampleMetaDeta;
}

const VAFPoint: React.FunctionComponent<{ x: number; y: number }> = function({
    x,
    y,
}) {
    return (
        <g>
            <path
                d={`M ${x}, ${y}
                            m -3, 0
                            a 3, 3 0 1,0 6,0
                            a 3, 3 0 1,0 -6,01`}
                role="presentation"
                shape-rendering="auto"
                style={{
                    stroke: 'rgb(0, 0, 0)',
                    fill: 'white',
                    strokeWidth: 2,
                    opacity: 1,
                }}
            />
        </g>
    );
};

const VAFPointConnector: React.FunctionComponent<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}> = function({ x1, y1, x2, y2 }) {
    return (
        <path
            d={`M${x1},${y1}L${x2},${y2}`}
            role="presentation"
            shape-rendering="auto"
            style={{
                fill: `white`,
                stroke: 'rgb(0, 0, 0)',
                strokeOpacity: 0.5,
                pointerEvents: `none`,
                opacity: 1,
                strokeWidth: 2,
            }}
        />
    );
};

const dataHeight = 100;
const footerHeight = 20;
export const VAF_CHART_ROW_HEIGHT = _.sum([dataHeight, footerHeight]);

const VAFChartWrapper: React.FunctionComponent<IVAFChartWrapperProps> = observer(
    function({ store, sampleMetaData }) {
        const samples = store.allItems.filter(
            event => event.event.eventType === 'SPECIMEN'
        );

        let lastY: number | undefined;

        return (
            //<svg width={store.pixelWidth} height={VAF_CHART_ROW_HEIGHT}>
            <g>
                {/*<rect width={store.pixelWidth} height="100" style={{fill:`yellow` }} />*/}
                {samples.map((event, i) => {
                    const x1 = store.getPosition(event)!.pixelLeft;
                    let y1;
                    let x2, y2;

                    // temporary crap to fake y position
                    y1 = lastY || Math.random() * dataHeight;
                    lastY = y1;

                    const nextEvent = samples[i + 1];

                    if (nextEvent) {
                        x2 = store.getPosition(nextEvent)!.pixelLeft;
                        lastY = Math.random() * dataHeight;
                        y2 = lastY;
                    }

                    return (
                        <g>
                            {x2 && y2 && (
                                <VAFPointConnector
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                />
                            )}
                            <VAFPoint x={x1} y={y1} />
                        </g>
                    );
                })}

                <g transform={`translate(0,${dataHeight})`}>
                    {samples.map((event, i) => {
                        const x = store.getPosition(event)!.pixelLeft;

                        const sampleId = event.event.attributes.find(
                            (att: any) => att.key === 'SAMPLE_ID'
                        );
                        const color =
                            sampleMetaData.color[sampleId.value] || '#333333';
                        const label =
                            sampleMetaData.label[sampleId.value] || '-';

                        return (
                            <g transform={`translate(${x - 7.5},0)`}>
                                <SampleMarker
                                    color={color}
                                    label={label}
                                    y={0}
                                />
                            </g>
                        );
                    })}
                </g>
            </g>
        );
    }
);

export default VAFChartWrapper;
