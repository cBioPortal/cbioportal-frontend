import React from 'react';
import { observer } from 'mobx-react';
import {
    VictoryLine,
    VictoryChart,
    VictoryAxis,
    VictoryTheme,
    VictoryTooltip,
    VictoryScatter,
    VictorySelectionContainer,
} from 'victory';
import _ from 'lodash';
import { makeObservable, observable, computed } from 'mobx';
import autobind from 'autobind-decorator';
import BarChartToolTip from '../barChart/BarChartToolTip';
import { ToolTipModel } from '../barChart/BarChartToolTip';
import WindowStore from 'shared/components/window/WindowStore';
import ReactDOM from 'react-dom';

interface IDataBin {
    id: string;
    count: number;
    start: number;
    end: number;
    specialValue?: string;
}

interface ILineChartProps {
    data: IDataBin[];
    width: number;
    height: number;
    onUserSelection: (selectedData: IDataBin[]) => void;
}

@observer
class LineChart extends React.Component<ILineChartProps> {
    @observable.ref
    private mousePosition = { x: 0, y: 0 };
    @observable
    private currentPointIndex = -1;

    @observable
    private toolTipModel: ToolTipModel | null = null;

    constructor(props: ILineChartProps) {
        super(props);
        makeObservable(this);
    }

    @computed
    get processedData(): { x: number; y: number; label: number }[] {
        return _.chain(this.props.data)
            .filter(item => item.specialValue === undefined)
            .map(item => ({
                x: item.start,
                y: item.count,
                label: item.count,
            }))
            .value();
    }

    @computed
    get processedDataLabels(): { x: number; y: number; label: number }[] {
        return _.chain(this.props.data)
            .filter(item => item.specialValue === undefined)
            .map(item => ({
                x: (item.start + item.end) / 2,
                y: item.count,
                label: item.count,
            }))
            .value();
    }

    handleSelection = (points: any, bounds: any) => {
        if (bounds && bounds.x) {
            const selectedData = this.props.data.filter(
                item =>
                    (item.end ?? item.start ?? 0) >= bounds.x[0] &&
                    (item.end ?? item.start ?? 0) <= bounds.x[1]
            );
            this.props.onUserSelection(selectedData);
        }
    };

    @autobind
    private onMouseMove(event: React.MouseEvent<any>): void {
        this.mousePosition = { x: event.pageX, y: event.pageY };
    }

    private get scatterEvents() {
        const self = this;
        return [
            {
                target: 'data',
                eventHandlers: {
                    onMouseEnter: () => {
                        return [
                            {
                                target: 'data',
                                mutation: (event: any) => {
                                    self.currentPointIndex =
                                        event.datum.eventKey;
                                    self.toolTipModel = {
                                        start:
                                            self.props.data[
                                                self.currentPointIndex
                                            ].start,
                                        end:
                                            self.props.data[
                                                self.currentPointIndex
                                            ].end,
                                        special:
                                            self.props.data[
                                                self.currentPointIndex
                                            ].specialValue,
                                        sampleCount: event.datum.y,
                                    };
                                },
                            },
                        ];
                    },
                    onMouseLeave: () => {
                        return [
                            {
                                target: 'data',
                                mutation: () => {
                                    self.toolTipModel = null;
                                },
                            },
                        ];
                    },
                },
            },
        ];
    }

    render() {
        // Increased the aspect ratio by adjusting the width and height
        const chartWidth = this.props.width * 1.7; // Increase width by 50%
        const chartHeight = this.props.height * 1.7; // Increase height by 20%

        return (
            <div onMouseMove={this.onMouseMove}>
                <VictoryChart
                    theme={VictoryTheme.material}
                    width={chartWidth}
                    height={chartHeight}
                    padding={{
                        left: 60,
                        right: 40,
                        top: 30,
                        bottom: 60,
                    }}
                    containerComponent={
                        <VictorySelectionContainer
                            onSelection={this.handleSelection}
                            selectionDimension="x"
                        />
                    }
                >
                    <VictoryAxis
                        tickFormat={(t: number) => t.toLocaleString()}
                        style={{ tickLabels: { fontSize: 18 } }}
                        fixLabelOverlap={true}
                    />
                    <VictoryAxis
                        dependentAxis
                        tickFormat={(t: number) => t.toLocaleString()}
                        style={{ tickLabels: { fontSize: 18 } }}
                    />
                    <VictoryLine
                        data={this.processedData}
                        style={{ data: { stroke: '#4f72b2' } }}
                        interpolation="monotoneX"
                    />
                    <VictoryScatter
                        data={this.processedData}
                        size={5}
                        style={{ data: { fill: '#c43a31' } }}
                        labels={({ datum }: { datum: any }) => datum.label}
                        labelComponent={<></>}
                        events={this.scatterEvents}
                    />
                </VictoryChart>
                {ReactDOM.createPortal(
                    <BarChartToolTip
                        mousePosition={this.mousePosition}
                        windowWidth={WindowStore.size.width}
                        model={this.toolTipModel}
                        totalBars={this.props.data.length}
                        currentBarIndex={this.currentPointIndex}
                    />,
                    document.body
                )}
            </div>
        );
    }
}

export default LineChart;
