import * as React from 'react';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import {FlexCol, FlexRow} from "../../shared/components/flexbox/FlexBox";
import {observer} from "mobx-react";
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
}

interface IHomePageState
{
}

@observer
export default class HomePage extends React.Component<IHomePageProps, IHomePageState>
{
    constructor(props:IHomePageProps)
    {
        super(props);
    }

    store = new QueryStore(window.location.href);

    public componentDidMount()
    {
        this.exposeComponentRenderersToParentScript();
    }

    exposeComponentRenderersToParentScript()
    {
        exposeComponentRenderer('renderQuerySelectorInModal', this.getModalWrappedComponent.bind(this));

        exposeComponentRenderer('renderQuerySelector', ()=>{ return <QueryAndDownloadTabs store={this.store} />  });

	}

    getModalWrappedComponent(){
        return (
            <QueryModal store={this.store} />
        )
    }

    public render()
    {
        return (<div style={{width:350}}><RightBar/></div>);
    }
}
