import * as React from "react";
import { observer } from "mobx-react";
import { VictoryPie, VictoryContainer, VictoryLabel, Slice } from 'victory';
import { observable, computed, action, toJS } from "mobx";
import _ from "lodash";
import { UNSELECTED_COLOR } from "pages/studyView/StudyViewUtils";
import CBIOPORTAL_VICTORY_THEME from "shared/theme/cBioPoralTheme";
import { AbstractChart } from "pages/studyView/charts/ChartContainer";
import ifndef from "shared/lib/ifndef";
import { bind } from "bind-decorator";
import { ClinicalDataCountWithColor } from "pages/studyView/StudyViewPageStore";
import classnames from 'classnames';
import ClinicalTable from "pages/studyView/table/ClinicalTable";
import {If} from 'react-if';

export interface IPieChartProps {
    data: ClinicalDataCountWithColor[];
    filters:string[];
    onUserSelection:(values:string[])=>void;
    active:boolean,
    placement:'left'|'right'
}

@observer
export default class PieChart extends React.Component<IPieChartProps, {}> implements AbstractChart{

    private svgContainer: any;

    constructor(props: IPieChartProps) {
        super(props);
    }

    @bind
    private onUserSelection(filter:string) {
        let filters = toJS(this.props.filters);
        if(_.includes(filters,filter)){
            filters = _.filter(filters, obj=> obj !== filter);
        }else{
            filters.push(filter);
        }
        this.props.onUserSelection(filters);
    }

    private get userEvents(){
        const self = this;
        return [{
            target: "data",
            eventHandlers: {
                onClick: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props:any) => {
                                this.onUserSelection(props.datum.value);
                            }
                        }
                    ];
                }
            }
        }];
    }

    @observable isTooltipHovered: boolean = false;
    @observable tooltipHighlightedRow:string|undefined = undefined;

    @bind
    @action private highlightedRow(value:string): void {
        this.tooltipHighlightedRow = value;
    }

    @bind
    @action private inTooltip(flag:boolean): void {
        this.isTooltipHovered = flag;
    }

    @computed private get showTooltip(){
        return this.props.active || this.isTooltipHovered
    }

    public downloadData() {
        return this.props.data.map(obj=>obj.value+'\t'+obj.count).join('\n');
    }

    public toSVGDOMNode():Element {
        return this.svgContainer.firstChild
    }

    @computed get totalCount(){
        return _.sumBy(this.props.data, obj=>obj.count)
    }

    /* Add style properties for each slice datum and make sure
    that the slice color remain same with and without filters

    Step1: check if the slice already has a color assigned
            a. YES -> Go to Step 2
            b. No  -> assign a color depending on the value and update the set
    Step2: check if the filters is empty
            a. Yes -> add fill property to slice datum
            b. No  -> add appropriate slice style properties depending on the filters
    */
    @computed get annotatedData() {
        return _.map(this.props.data, slice => {
            if (_.isEmpty(this.props.filters)) {
                return { ...slice, fill: slice.color};
            } else {
                if (_.includes(this.props.filters, slice.value)) {
                    return { ...slice, fill: slice.color, stroke: "#cccccc", strokeWidth: 3 };
                } else {
                    return { ...slice, fill: UNSELECTED_COLOR, fillOpacity: '0.5' };
                }
            }
        })
    }

    @computed get pieChartData(){
        let data = this.annotatedData
        if(!_.isUndefined(this.tooltipHighlightedRow)){
            data = _.map(data,(obj:any)=>{
                if(_.isEqual(obj.value, this.tooltipHighlightedRow)){
                    return _.assign({ fillOpacity: '0.5' }, obj)
                }
                return obj;
            });
        }
        return data;
    }

    @bind
    private tooltipMouseEnter(): void {
        this.isTooltipHovered = true;
    }

    @bind
    private tooltipMouseLeave(): void {
        this.isTooltipHovered = false;
    }

    public render() {
        let left = _.isEqual(this.props.placement,'right')? '195px' : '-350px'
        return (
            <div>
                <If condition={this.showTooltip}>
                    <div
                        className={ classnames('popover', this.props.placement) }
                        onMouseLeave={() => this.tooltipMouseLeave()}
                        onMouseEnter={() => this.tooltipMouseEnter()}
                        style={{ display: 'block', position: 'absolute', left: left, width: '350px', maxWidth: '350px' }}>
        
                        <div className="arrow" style={{ top: 20 }}></div>
                        <div className="popover-content">
                            <ClinicalTable 
                                data={this.props.data}
                                filters={this.props.filters}
                                highlightedRow={this.highlightedRow}
                                onUserSelection={this.props.onUserSelection}
                            />
                        </div>
                    </div>
                </If>

                
                <VictoryPie
                    theme={CBIOPORTAL_VICTORY_THEME}
                    containerComponent={<VictoryContainer
                                            responsive={false}
                                            containerRef={(ref: any) => this.svgContainer = ref}
                                        />}
                    width={190}
                    height={180}
                    labelRadius={30}
                    padding={30}
                    //to hide label if the angle is too small(currently set to 20 degrees)
                    labels={(d:any) => ((d.count*360)/this.totalCount)<20?'':d.count}
                    data={this.pieChartData}
                    dataComponent={<CustomSlice/>}
                    labelComponent={<VictoryLabel/>}
                    events={this.userEvents}
                    style={{
                        data: { 
                            fill: (d:any) => ifndef(d.fill, "0x000000"),
                            stroke: (d:any) => ifndef(d.stroke, "0x000000"),
                            strokeWidth: (d:any) => ifndef(d.strokeWidth, 0),
                            fillOpacity: (d:any) => ifndef(d.fillOpacity, 1)
                        },
                        labels: { 
                            fill: "white" 
                        }
                    }}
                    x="value"
                    y="count"
                    eventKey="value"
                />
            </div>
        );
    }

}

class CustomSlice extends React.Component<{}, {}> {
    render() {
        const d:any = this.props;
        return (
        <g>
            <Slice {...this.props} active={true}/>
            <title>{`${d.datum.value}:${d.datum.count}`}</title>
        </g>
        );
    }
}