import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import $ from 'jquery';
import { VictoryChart, VictoryTheme, VictoryScatter, VictoryContainer, VictoryAxis, VictoryLabel, VictoryStack, VictoryBar } from 'victory';
import {observable} from "mobx";
import {observer} from "mobx-react";

@observer
export default class Playground extends React.Component<{}, {}> {

    data = [];

    @observable showChart = null;

    public plotlyData;

    constructor(){
        super();
        const limit = 50000;

        (window as any).comp = this;

        for (let i=0;i<limit;i++) {

            this.data.push({ x:Math.random()*10, y:Math.random()*10  });

        }


        this.plotlyData = {
            x: this.data.map((d)=>d.x),
            y: this.data.map((d)=>d.y),
            mode: 'markers',
        };


        this.renderPlotly = this.renderPlotly.bind(this);
        this.renderPlotlyGL = this.renderPlotlyGL.bind(this);

    }

    renderPlotly(){

        this.plotlyData.type = "scatter";

        Plotly.newPlot('plotlyChart', [this.plotlyData]);

    }

    renderPlotlyGL(){


        this.plotlyData.type = "scattergl";

        Plotly.newPlot('plotlyChart', [this.plotlyData]);

    }


    render(){


        return (
            <div>
                <div>
                    <button onClick={()=>this.showChart = Date.now()}>Render Victory</button>
                    <button onClick={this.renderPlotly}>Render Plotly SVG</button>
                    <button onClick={this.renderPlotlyGL}>Render Plotly WebGL</button>
                </div>

                {
                    (this.showChart) && (
                        <VictoryChart>
                            <VictoryScatter
                                style={{ data: { fill: "#c43a31" } }}
                                size={7}
                                data={this.data}
                            />
                        </VictoryChart>
                    )
                }

                <div id="plotlyChart"></div>

            </div>
        )
    }

};