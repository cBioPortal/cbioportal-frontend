import * as React from 'react';
import CBioPortalAPI from "../../shared/api/generated/CBioPortalAPI";
import {CancerStudy} from "../../shared/api/generated/CBioPortalAPI";
import AppConfig from 'appConfig';
import {getCbioPortalApiUrl} from "../../shared/api/urls";

interface IHomePageProps
{
}

interface IHomePageState
{
    data?:CancerStudy[];
}

export default class HomePage extends React.Component<IHomePageProps, IHomePageState>
{
    constructor(props:IHomePageProps)
    {
        super(props);
        this.state = {};
    }

    client = new CBioPortalAPI(getCbioPortalApiUrl());

    componentDidMount()
    {
        this.client.getAllStudiesUsingGET({
            projection: "DETAILED"
        }).then(data => {
            this.setState({data});
        });
    }

    public render() {
        return <pre>
            { JSON.stringify(this.state.data, null, 4) }
        </pre>;
    }
};
