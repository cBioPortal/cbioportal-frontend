import * as React from 'react';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import {FlexCol, FlexRow} from "../../shared/components/flexbox/FlexBox";
import {observer, inject} from "mobx-react";
import DevTools from "mobx-react-devtools";
import {toJS, observable, action, computed, whyRun, expr} from "mobx";
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
    constructor(props:IHomePageProps)
    {
        super(props);
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
                   <div>
                       {blurb}
                   </div>
                   <QueryAndDownloadTabs store={this.props.queryStore} />
                </div>);
    }
}
