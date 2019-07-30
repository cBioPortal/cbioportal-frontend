import * as React from "react";
import {Observer, observer} from "mobx-react";
import {VictoryAxis, VictoryChart, VictoryLabel, VictoryLine, VictoryScatter} from "victory";
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";
import {computed, observable} from "mobx";
import {Mutation, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import {stringListToIndexSet} from "../../../public-lib";
import _ from "lodash";
import {getVariantAlleleFrequency} from "../../../shared/lib/MutationUtils";
import WindowStore from "../../../shared/components/window/WindowStore";
import TruncatedTextWithTooltipSVG from "../../../shared/components/TruncatedTextWithTooltipSVG";
import {Popover} from "react-bootstrap";
import classnames from "classnames";
import styles from "../../resultsView/survival/styles.module.scss";
import autobind from "autobind-decorator";
import {Portal} from "react-portal";

export interface IVAFLineChartProps {
    mutations:Mutation[][];
    samples:Sample[];
}

const LINE_COLOR = "#c43a31";

@observer
export default class VAFLineChart extends React.Component<IVAFLineChartProps, {}> {

    @observable.ref private tooltipModel:any | null = null;
    private mouseEvents = this.makeMouseEvents();
    @observable mousePosition = { x:0, y:0 };

    private makeMouseEvents() {
        return [{
            target: "data",
            eventHandlers: {
                onMouseOver: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props: any) => {
                                this.tooltipModel = props;
                                return null;
                            }
                        }
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: "data",
                            mutation: () => {
                                this.tooltipModel = null;
                                return null;
                            }
                        }
                    ];
                },
            }
        }];
    }

    @autobind private onMouseMove(e:React.MouseEvent<any>) {
        this.mousePosition.x = e.pageX;
        this.mousePosition.y = e.pageY;
    }

    @computed get chartWidth() {
        return Math.min(
            this.props.samples.length * 100 + 100,
            WindowStore.size.width - 100
        );
    }

    @computed get chartHeight() {
        return 300;
    }

    @computed get svgWidth() {
        return this.chartWidth;
    }

    @computed get svgHeight() {
        return this.chartHeight + 50; // give room for labels
    }

    @computed get sampleOrder() {
        return stringListToIndexSet(this.props.samples.map(s=>s.uniqueSampleKey));
    }

    @computed get sampleMap() {
        return _.keyBy(this.props.samples, s=>s.uniqueSampleKey);
    }

    @computed get data() {
        const allData = this.props.mutations.map(mutations=>{
            const sorted = _.sortBy(mutations, m=>this.sampleOrder[m.uniqueSampleKey]);
            return sorted.map(mutation=>({
                x: mutation.uniqueSampleKey,
                y: getVariantAlleleFrequency(mutation),
                mutation
            }));
        });
        // for now: take out any null values
        const nonNull = allData.filter(dataForMutation=>_.every(dataForMutation, d=>(d.y !== null)));

        return nonNull;
    }

    private tooltipFunction(datum: any) {
        return (
            <div>
                <span>Sample ID: {datum.mutation.sampleId}</span><br/>
                <span>Protein Change: {datum.mutation.proteinChange}</span><br/>
                <span>VAF: {datum.y.toFixed(2)} </span>
            </div>
        );
    }

    @autobind
    private getTooltipComponent() {
        if (!this.tooltipModel) {
            return <span/>;
        } else {
            const maxWidth = 400;
            let tooltipPlacement = (this.mousePosition.x > WindowStore.size.width-maxWidth ? "left" : "right");
            return (
                <Portal isOpened={true} node={document.body}>
                    <Popover
                        arrowOffsetTop={17}
                        className={classnames("cbioportal-frontend", "cbioTooltip", styles.Tooltip)}
                        positionLeft={this.mousePosition.x+(tooltipPlacement === "left" ? -8 : 8)}
                        positionTop={this.mousePosition.y-17}
                        style={{
                            transform: (tooltipPlacement === "left" ? "translate(-100%,0%)" : undefined),
                            maxWidth
                        }}
                        placement={tooltipPlacement}
                    >
                        {this.tooltipFunction(this.tooltipModel.datum)}
                    </Popover>
                </Portal>
            );
        }
    }

    render() {
        return (
            <>
                <svg
                    style={{
                        width: this.svgWidth,
                        height: this.svgHeight,
                        pointerEvents: "all"
                    }}
                    height={this.svgHeight}
                    width={this.svgWidth}
                    role="img"
                    viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`}
                    onMouseMove={this.onMouseMove}
                >
                    <VictoryChart
                        theme={CBIOPORTAL_VICTORY_THEME}
                        standalone={false}
                        domain={{ y: [0, 1] }}
                        width={this.chartWidth}
                        height={this.chartHeight}
                    >
                        <VictoryAxis dependentAxis />
                        <VictoryAxis
                            style={{
                                grid: {
                                    strokeOpacity: (t:number, i:number)=>{ return i === 0 ? 0 : 1; },
                                }
                            }}
                            tickValues={this.props.samples.map(s=>s.uniqueSampleKey)}
                            tickFormat={(t:string)=>this.sampleMap[t].sampleId}
                            tickLabelComponent={
                                <TruncatedTextWithTooltipSVG
                                    verticalAnchor="start"
                                    textAnchor="start"
                                    maxWidth={50}
                                    transform={(x:number, y:number)=>`rotate(50, ${x}, ${y})`}
                                    dx={5}
                                />
                            }
                        />
                        {this.data.map(dataForMutation=>
                            <VictoryLine
                                style={{
                                    data: { stroke: LINE_COLOR }
                                }}
                                data={dataForMutation}
                            />
                        )}
                        <VictoryScatter
                            style={{
                                data: {
                                    stroke:LINE_COLOR,
                                    fill:"white",
                                    strokeWidth:2
                                }
                            }}
                            size={3}
                            data={_.flatten(this.data)}
                            events={this.mouseEvents}
                        />
                    </VictoryChart>
                </svg>
                <Observer>
                    {this.getTooltipComponent}
                </Observer>
            </>
        );
    }
}