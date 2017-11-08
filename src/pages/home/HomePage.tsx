import * as React from 'react';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import {FlexCol, FlexRow} from "../../shared/components/flexbox/FlexBox";
import {observer, inject} from "mobx-react";
import DevTools from "mobx-react-devtools";
import {toJS, observable, action, computed, whyRun, expr, runInAction} from "mobx";
import LabeledCheckbox from "../../shared/components/labeledCheckbox/LabeledCheckbox";
import ReactSelect from 'react-select';
import 'react-select/dist/react-select.css';
import QueryAndDownloadTabs from "../../shared/components/query/QueryAndDownloadTabs";
import {QueryStore} from "../../shared/components/query/QueryStore";
import QueryModal from "../../shared/components/query/QueryModal";
import BarGraph from "shared/components/barGraph/BarGraph";
import client from '../../shared/api/cbioportalClientInstance';
import {remoteData} from "../../shared/api/remoteData";
import RightBar from "../../shared/components/rightbar/RightBar";
import AppConfig from "appConfig";
import Plotly from 'plotly.js';
import classNames from 'classnames';
import {ReactElement} from "react";
import ReactPlotlyWrapper from "../../shared/components/reactPlotlyWrapper/ReactPlotlyWrapper";


export class HomePageStore {

    readonly data = remoteData({
        invoke: () => {
            return client.getAllStudiesUsingGET({projection: "DETAILED"});

        }
    });
}

function getRootElement()
{
    for (let node of document.childNodes)
        if (node instanceof HTMLElement)
            return node;
    throw new Error("No HTMLElement found");
}

interface IHomePageProps
{
    queryStore:QueryStore
}

interface IHomePageState
{
}

@inject("queryStore") @observer
export default class HomePage extends React.Component<IHomePageProps, IHomePageState>
{

    @observable private count = 0;

    private data:any;

    constructor(props:IHomePageProps)
    {
        super(props);

        var trace1 = {
            x: ['giraffes', 'orangutans', 'monkeys'],
            y: [20, 14, 23],
            name: 'SF Zoo',
            type: 'bar'
        };

        var trace2 = {
            x: ['giraffes', 'orangutans', 'monkeys'],
            y: [12, 18, 29],
            name: 'LA Zoo',
            type: 'bar'
        };

        var data = [trace1, trace2];

        this.data = data;

        setInterval(()=>this.count++,4000);

    }

    getModalWrappedComponent(){
        return (
            <QueryModal store={this.props.queryStore} />
        )
    }

    public render()
    {
        const blurb:JSX.Element|null = AppConfig.skinBlurb? <p style={{marginBottom:"20px"}} dangerouslySetInnerHTML={{__html: AppConfig.skinBlurb}}></p> : null;
        return (<div>
                    <ReactPlotlyWrapper data={this.data} layout={{barmode: 'stack'}} buildTooltip={
                        (tooltipModel)=>{
                           return <div>{tooltipModel.points[0].x}</div>
                        }
                    } />
                </div>);
    }
}
