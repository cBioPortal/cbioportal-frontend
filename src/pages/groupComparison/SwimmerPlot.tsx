import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable, observable, action } from 'mobx';
import { Popover } from 'react-bootstrap';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from 'shared/components/ErrorMessage';
import { MakeMobxView } from 'shared/components/MobxView';
import ComparisonStore from 'shared/lib/comparison/ComparisonStore';
import { VictoryChart, VictoryAxis, VictoryBar, VictoryLabel, VictoryScatter } from 'victory';
import { CBIOPORTAL_VICTORY_THEME } from 'cbioportal-frontend-commons';
import _ from 'lodash';

interface ISwimmerPlotProps {
    store: ComparisonStore;
}

interface ITimelineEvent {
    patientId: string;
    clinicalEvent: string;
    timeDaysLastFollowUp: number;
    timeDaysEvent: number;
    styleColor: string;
    styleShape?: string;
}

interface ISwimmerPlotRow {
    patientId: string;
    order: number;
    timelineEnd: number;
    events: ITimelineEvent[];
}

// Mock timeline data from test_swimmer_plot_data.tsv
const mockTimelineData: ITimelineEvent[] = [
    { patientId: 'TCGA-05-4244', clinicalEvent: 'Diagnosis', timeDaysLastFollowUp: 500, timeDaysEvent: 0, styleColor: '#FF8849', styleShape: 'triangleUp' },
    { patientId: 'TCGA-05-4382', clinicalEvent: 'Diagnosis', timeDaysLastFollowUp: 100, timeDaysEvent: 0, styleColor: '#FF8849', styleShape: 'triangleUp' },
    { patientId: 'TCGA-05-4384', clinicalEvent: 'Diagnosis', timeDaysLastFollowUp: 50, timeDaysEvent: 0, styleColor: '#FF8849', styleShape: 'triangleUp' },
    { patientId: 'TCGA-05-4386', clinicalEvent: 'Diagnosis', timeDaysLastFollowUp: 300, timeDaysEvent: 0, styleColor: '#FF8849', styleShape: 'triangleUp' },
    { patientId: 'TCGA-05-4389', clinicalEvent: 'Diagnosis', timeDaysLastFollowUp: 267, timeDaysEvent: 0, styleColor: '#FF8849', styleShape: 'triangleUp' },
    { patientId: 'TCGA-05-4244', clinicalEvent: 'Blood_Col1', timeDaysLastFollowUp: 500, timeDaysEvent: 10, styleColor: '#22870e', styleShape: 'circle' },
    { patientId: 'TCGA-05-4382', clinicalEvent: 'Blood_Col1', timeDaysLastFollowUp: 100, timeDaysEvent: 15, styleColor: '#22870e', styleShape: 'circle' },
    { patientId: 'TCGA-05-4384', clinicalEvent: 'Blood_Col1', timeDaysLastFollowUp: 50, timeDaysEvent: 7, styleColor: '#22870e', styleShape: 'circle' },
    { patientId: 'TCGA-05-4386', clinicalEvent: 'Blood_Col1', timeDaysLastFollowUp: 300, timeDaysEvent: 20, styleColor: '#22870e', styleShape: 'circle' },
    { patientId: 'TCGA-05-4389', clinicalEvent: 'Blood_Col1', timeDaysLastFollowUp: 267, timeDaysEvent: 15, styleColor: '#22870e', styleShape: 'circle' },
    { patientId: 'TCGA-05-4244', clinicalEvent: 'Blood_Col2', timeDaysLastFollowUp: 500, timeDaysEvent: 20, styleColor: '#22870e', styleShape: 'circle' },
    { patientId: 'TCGA-05-4382', clinicalEvent: 'Blood_Col2', timeDaysLastFollowUp: 100, timeDaysEvent: 30, styleColor: '#22870e', styleShape: 'circle' },
    { patientId: 'TCGA-05-4384', clinicalEvent: 'Blood_Col2', timeDaysLastFollowUp: 50, timeDaysEvent: 14, styleColor: '#22870e', styleShape: 'circle' },
    { patientId: 'TCGA-05-4386', clinicalEvent: 'Blood_Col2', timeDaysLastFollowUp: 300, timeDaysEvent: 30, styleColor: '#22870e', styleShape: 'circle' },
    { patientId: 'TCGA-05-4389', clinicalEvent: 'Blood_Col2', timeDaysLastFollowUp: 267, timeDaysEvent: 32, styleColor: '#22870e', styleShape: 'circle' }
];

@observer
export default class SwimmerPlot extends React.Component<ISwimmerPlotProps, {}> {
    @observable.ref private timelineData: ITimelineEvent[] = mockTimelineData;
    @observable private uploadError: string = '';
    @observable.ref private tooltipModel: any = null;

    constructor(props: ISwimmerPlotProps) {
        super(props);
        makeObservable(this);
    }

    @computed get swimmerPlotData(): ISwimmerPlotRow[] {
        // Group events by patient
        const patientMap: { [patientId: string]: ITimelineEvent[] } = {};
        
        this.timelineData.forEach(event => {
            if (!patientMap[event.patientId]) {
                patientMap[event.patientId] = [];
            }
            patientMap[event.patientId].push(event);
        });

        // Create rows, one per patient
        const rows: ISwimmerPlotRow[] = [];
        let order = 0;
        
        Object.keys(patientMap).forEach(patientId => {
            const eventsForPatient = patientMap[patientId];
            // Use the first event's timeDaysLastFollowUp (should be the same for all events of a patient)
            const timelineEnd = eventsForPatient.length > 0 ? eventsForPatient[0].timeDaysLastFollowUp : 0;
            
            rows.push({
                patientId,
                order: order++,
                timelineEnd,
                events: eventsForPatient
            });
        });

        return rows;
    }

    @computed get eventTypes(): string[] {
        return this.timelineData.length > 0 ? _.uniq(this.timelineData.map(d => d.clinicalEvent)) : [];
    }

    private statusColorMapping: { [key: string]: string } = {
        ongoing: '#378ADD',
        completed: '#9FE1CB',
        pd: '#F09595'
    };

    private eventColorMapping: { [key: string]: string } = {
        start: '#7F77DD',
        response: '#639922',
        progression: '#D85A30',
        diagnosis: '#FF8849'
    };

    private getPatientStatusColor(row: ISwimmerPlotRow): string {
        const eventTypes = _.uniq(row.events.map(e => e.clinicalEvent.toLowerCase()));
        if (eventTypes.includes('progression') || eventTypes.includes('pd')) {
            return this.statusColorMapping.pd;
        }
        if (eventTypes.includes('completed')) {
            return this.statusColorMapping.completed;
        }
        return this.statusColorMapping.ongoing;
    }

    private getEventColor(event: ITimelineEvent): string {
        const eventType = (event.clinicalEvent || '').toLowerCase().trim();
        const explicitStyleColor = (event.styleColor || '').trim();

        if (explicitStyleColor) {
            return explicitStyleColor;
        }
        return this.eventColorMapping[eventType] || '#999999';
    }

    private getEventShape(event: ITimelineEvent): string {
        const explicitStyleShape = (event.styleShape || '').trim().toLowerCase();
        const allowedSymbols: { [key: string]: string } = {
            circle: 'circle',
            square: 'square',
            diamond: 'diamond',
            triangleup: 'triangleUp',
            triangledown: 'triangleDown',
            plus: 'plus',
            minus: 'minus',
            star: 'star'
        };
        return allowedSymbols[explicitStyleShape] || 'circle';
    }

    private renderLegendMarker(shape: string, color: string): React.ReactNode {
        switch (shape) {
            case 'square':
                return <rect x="1" y="1" width="10" height="10" fill={color} stroke="#000" strokeWidth="1" />;
            case 'diamond':
                return <polygon points="6,1 11,6 6,11 1,6" fill={color} stroke="#000" strokeWidth="1" />;
            case 'triangleUp':
                return <polygon points="6,1 11,11 1,11" fill={color} stroke="#000" strokeWidth="1" />;
            case 'triangleDown':
                return <polygon points="1,1 11,1 6,11" fill={color} stroke="#000" strokeWidth="1" />;
            case 'plus':
                return <path d="M6 1 L6 11 M1 6 L11 6" stroke={color} strokeWidth="2" strokeLinecap="round" />;
            case 'minus':
                return <path d="M1 6 L11 6" stroke={color} strokeWidth="2" strokeLinecap="round" />;
            case 'star':
                return <polygon points="6,1 7.5,4.5 11,4.5 8.2,6.8 9.2,10.5 6,8.5 2.8,10.5 3.8,6.8 1,4.5 4.5,4.5" fill={color} stroke="#000" strokeWidth="1" />;
            case 'circle':
            default:
                return <circle cx="6" cy="6" r="5" fill={color} stroke="#000" strokeWidth="1" />;
        }
    }

    @computed get maxTime(): number {
        return this.timelineData.length > 0 ? Math.max(...this.timelineData.map(d => d.timeDaysLastFollowUp), 1) : 1;
    }

    @action.bound
    private setTooltipModel(model: any) {
        this.tooltipModel = model;
    }

    readonly plot = MakeMobxView({
        await: () => [
            this.props.store.activeGroups
        ],
        render: () => {
            return (
                <div style={{ width: '100%' }}>
                    {/* File Upload Section */}
                    <div style={{
                        marginBottom: '20px',
                        padding: '15px',
                        border: '2px dashed #ccc',
                        borderRadius: '5px',
                        backgroundColor: '#f9f9f9'
                    }}>
                        <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Swimmer Plot</h4>
                        <p style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                            Using mock data from <strong>test_swimmer_plot_data.tsv</strong> format
                        </p>
                        {this.uploadError && (
                            <div style={{ color: 'red', fontSize: '14px' }}>
                                Error: {this.uploadError}
                            </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            Currently showing {this.timelineData.length} timeline events for {_.uniq(this.timelineData.map(d => d.patientId)).length} patients.
                        </div>
                    </div>

                    {/* Plot Section */}
                    {this.swimmerPlotData.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <p>Loading swimmer plot data...</p>
                        </div>
                    ) : (
                        <div style={{ minHeight: '500px', maxWidth: '1600px' }}>
                            <div style={{ position: 'relative' }}>
                            <VictoryChart
                                theme={CBIOPORTAL_VICTORY_THEME}
                                domainPadding={{ x: [10, 50], y: [20, 20] }}
                                width={1600}
                                height={Math.max(400, Math.min(600, this.swimmerPlotData.length * 50))}
                                padding={{ top: 20, bottom: 25, left: 200, right: 20 }}
                                domain={{
                                    x: [0, Math.max(this.maxTime, 100)],
                                    y: [-0.5, Math.max(this.swimmerPlotData.length - 0.5, 0.5)]
                                }}
                            >
                                <VictoryAxis
                                    label="Timeline (Days)"
                                    tickFormat={(t: number) => `${t}`}
                                    style={{
                                        axis: { stroke: '#CCCCCC' },
                                        grid: { stroke: 'rgba(0,0,0,0.08)', strokeDasharray: '4,3' },
                                        axisLabel: { padding: 35, fontSize: 12, fill: '#666' },
                                        tickLabels: { fontSize: 11, fill: '#888' }
                                    }}
                                />
                                <VictoryAxis
                                    dependentAxis
                                    label="Patients"
                                    tickValues={this.swimmerPlotData.map(row => row.order)}
                                    tickFormat={(t: number) => {
                                        const index = Math.round(t);
                                        if (index >= 0 && index < this.swimmerPlotData.length) {
                                            return this.swimmerPlotData[index].patientId;
                                        }
                                        return '';
                                    }}
                                    style={{
                                        axis: { stroke: '#CCCCCC' },
                                        grid: { stroke: 'rgba(0,0,0,0.08)', strokeDasharray: '4,3' },
                                        axisLabel: { padding: 95, fill: '#666', fontSize: 12 },
                                        tickLabels: { fontSize: 11, fill: '#222', angle: 0, textAnchor: 'end' }
                                    }}
                                />

                                {/* Sky blue bars for each patient timeline */}
                                <VictoryBar
                                    horizontal
                                    data={this.swimmerPlotData.map(row => ({
                                        x: row.order,
                                        y0: 0,
                                        y: row.timelineEnd,
                                        patientId: row.patientId,
                                        statusColor: this.getPatientStatusColor(row)
                                    }))}
                                    style={{
                                        data: {
                                            fill: ({ datum }: any) => datum?.statusColor || '#87CEEB',
                                            stroke: '#666',
                                            strokeWidth: 1
                                        }
                                    }}
                                    barWidth={12}
                                    cornerRadius={6}
                                />

                                {/* Event dots positioned on timeline */}
                                {Object.entries(
                                    _.groupBy(
                                        this.timelineData.map(event => {
                                            const row = this.swimmerPlotData.find(r => r.patientId === event.patientId);
                                            return {
                                                patientId: event.patientId,
                                                x: event.timeDaysEvent,
                                                y: row?.order || 0,
                                                size: 6,
                                                event: event.clinicalEvent,
                                                timeDaysEvent: event.timeDaysEvent,
                                                dotColor: this.getEventColor(event),
                                                dotShape: this.getEventShape(event)
                                            };
                                        }),
                                        point => `${point.dotColor || '#999999'}__${point.dotShape || 'circle'}`
                                    )
                                ).map(([groupKey, points]) => (
                                    <VictoryScatter
                                        key={`dots-${groupKey}`}
                                        data={points}
                                        symbol={points[0].dotShape || 'circle'}
                                        style={{
                                            data: {
                                                fill: points[0].dotColor || '#999999',
                                                stroke: points[0].dotColor || '#999999',
                                                strokeWidth: 1
                                            }
                                        }}
                                        events={[
                                            {
                                                target: 'data',
                                                eventHandlers: {
                                                    onMouseOver: () => [{
                                                        target: 'data',
                                                        mutation: (props: any) => {
                                                            this.setTooltipModel(props);
                                                            return { active: true };
                                                        }
                                                    }],
                                                    onMouseOut: () => [{
                                                        target: 'data',
                                                        mutation: () => {
                                                            this.setTooltipModel(null);
                                                            return { active: false };
                                                        }
                                                    }]
                                                }
                                            }
                                        ]}
                                        size={({ datum }: any) => datum?.size || 6}
                                    />
                                ))}

                                <VictoryLabel
                                    text="Clinical Timeline: Patient Events Over Time"
                                    x={400}
                                    y={20}
                                    textAnchor="middle"
                                    style={{ fontSize: 16, fontWeight: 'bold' }}
                                />
                            </VictoryChart>
                            {this.tooltipModel && this.tooltipModel.datum && (
                                <Popover
                                    className="cbioportal-frontend cbioTooltip"
                                    positionLeft={this.tooltipModel.x + 18}
                                    positionTop={this.tooltipModel.y - 24}
                                    {...{ container: this }}
                                >
                                    <div>
                                        Patient ID: {this.tooltipModel.datum.patientId}
                                        <br />
                                        Clinical Event: {this.tooltipModel.datum.event}
                                        <br />
                                        Time: {this.tooltipModel.datum.timeDaysEvent} days
                                    </div>
                                </Popover>
                            )}
                            </div>

                            {/* Legend */}
                            <div style={{
                                marginTop: '20px',
                                textAlign: 'center',
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: '15px'
                            }}>
                                {this.eventTypes.map(eventType => {
                                    const eventExample = this.timelineData.find(e => e.clinicalEvent === eventType);
                                    const eventColor = eventExample ? this.getEventColor(eventExample) : '#999999';
                                    const eventShape = eventExample ? this.getEventShape(eventExample) : 'circle';
                                    return (
                                        <div key={eventType} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '20px' }}>
                                            <svg width="12" height="12" viewBox="0 0 12 12" style={{ marginRight: '5px', overflow: 'visible' }}>
                                                {this.renderLegendMarker(eventShape, eventColor)}
                                            </svg>
                                            <span style={{ fontSize: '12px', color: '#666' }}>{eventType}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Data Info */}
                            <div style={{
                                marginTop: '20px',
                                padding: '10px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px',
                                fontSize: '12px',
                                textAlign: 'center'
                            }}>
                                <strong>Timeline Data:</strong> Showing {this.swimmerPlotData.length} patients with {this.timelineData.length} total clinical events ({this.eventTypes.length} event types).
                            </div>
                        </div>
                    )}
                </div>
            );
        },
        renderPending: () => <LoadingIndicator center={true} isLoading={true} size="big" />,
        renderError: () => <ErrorMessage />
    });

    render() {
        return this.plot.component;
    }
}
