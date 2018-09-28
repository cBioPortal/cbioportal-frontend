import * as _ from 'lodash';
import * as React from 'react';
import UnsupportedBrowserModal from "shared/components/unsupportedBrowserModal/UnsupportedBrowserModal";

import '../../globalStyles/prefixed-global.scss';
import PortalHeader from "./PortalHeader";
import PortalFooter from "./PortalFooter";
import {remoteData} from "../../shared/api/remoteData";
import request from 'superagent';
import getBrowserWindow from "../../shared/lib/getBrowserWindow";
import {observer} from "mobx-react";
import client from "../../shared/api/cbioportalClientInstance";
import internalClient from "../../shared/api/cbioportalInternalClientInstance";
import {
    getCbioPortalApiUrl,
    getConfigurationServiceApiUrl, getG2SApiUrl,
    getGenomeNexusApiUrl,
    getOncoKbApiUrl
} from "../../shared/api/urls";
import civicClient from "../../shared/api/civicClientInstance";
import genomeNexusClient from '../../shared/api/genomeNexusClientInstance';
import internalGenomeNexusClient from '../../shared/api/genomeNexusInternalClientInstance';
import oncoKBClient from '../../shared/api/oncokbClientInstance';
import genome2StructureClient from '../../shared/api/g2sClientInstance';
import {getSessionKey} from "../../shared/lib/ExtendedRouterStore";
import LoadingIndicator from "../../shared/components/loadingIndicator/LoadingIndicator";
import AppConfig from "appConfig";
import Helmet from "react-helmet";
import {updateConfig} from "../../config/config";
import {embedGoogleAnalytics} from "../../shared/lib/tracking";
import {computed} from "mobx";

interface IContainerProps {
    location: Location;
    children: React.ReactNode;
}

const configPromise = remoteData(async ()=>{

    // need to use jsonp, so use jquery
    const config = await $.ajax({
        url: getConfigurationServiceApiUrl(),
        dataType: "jsonp",
        jsonpCallback: "callback"
    });

    // overwrite properties of frontend config
    updateConfig(config);

    // we need to set the domain of our api clients
    (client as any).domain = getCbioPortalApiUrl();
    (internalClient as any).domain = getCbioPortalApiUrl();
    (genomeNexusClient as any).domain = getGenomeNexusApiUrl();
    (internalGenomeNexusClient as any).domain = getGenomeNexusApiUrl();
    (oncoKBClient as any).domain = getOncoKbApiUrl();
    (genome2StructureClient as any).domain = getG2SApiUrl();

    if (AppConfig.googleAnalyticsProfile && AppConfig.googleAnalyticsProfile.length > 0) {
        embedGoogleAnalytics();
    }

    return config;

});


@observer
export default class Container extends React.Component<IContainerProps, {}> {

    static contextTypes = {
        router: React.PropTypes.object
    };

    context: { router: any };

    private get routingStore(){
        return getBrowserWindow().routingStore;
    }

    renderChildren() {
        const childProps = {...this.props};
        const {children} = this.props;
        return React.Children.map(children,
            c => React.cloneElement(c as React.ReactElement<any>, childProps));
    }

    @computed get isConfigComplete(){
        // remote session will return undefined if there is no session id, so just check it
        return configPromise.isComplete && this.routingStore.remoteSessionData.isComplete;
    }

    render() {

        return (
            <div>
                <Helmet>
                    <meta charSet="utf-8" />
                    <title>cBioPortal for Cancer Genomics</title>
                    <meta name="description" content="The cBioPortal for Cancer Genomics provides visualization, analysis and download of large-scale cancer genomics data sets" />
                </Helmet>

                <div className="pageTopContainer">
                    <div className="contentWidth">
                        <PortalHeader/>
                    </div>
                </div>

                <div className="contentWrapper">
                    <UnsupportedBrowserModal/>
                    {(this.isConfigComplete) && this.renderChildren()}
                    <LoadingIndicator isLoading={!this.isConfigComplete} center={true} size={"big"}/>
                </div>

                <PortalFooter/>

            </div>
        );
    }
}
