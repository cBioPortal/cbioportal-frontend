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
import {setServerConfig, updateConfig} from "../../config/config";
import {embedGoogleAnalytics} from "../../shared/lib/tracking";
import {computed} from "mobx";
import { If, Else } from 'react-if';
import {AppStore} from "../../AppStore";

interface IContainerProps {
    location: Location;
    children: React.ReactNode;
}

@observer
export default class Container extends React.Component<IContainerProps, {}> {

    static contextTypes = {
        router: React.PropTypes.object
    };

    context: { router: any };

    private get routingStore(){
        return getBrowserWindow().routingStore;
    }

    private get appStore(){
        return getBrowserWindow().globalStores.appStore;
    }

    renderChildren() {
        const childProps = {...this.props};
        const {children} = this.props;
        return React.Children.map(children,
            c => React.cloneElement(c as React.ReactElement<any>, childProps));
    }

    @computed get isSessionLoaded(){

        return !this.routingStore.needsRemoteSessionLookup || this.routingStore.remoteSessionData.isComplete;

    }

    render() {
        return (
            <If condition={this.isSessionLoaded}>
                <div>
                    <Helmet>
                        <meta charSet="utf-8" />
                        <title>cBioPortal for Cancer Genomics</title>
                        <meta name="description" content="The cBioPortal for Cancer Genomics provides visualization, analysis and download of large-scale cancer genomics data sets" />
                    </Helmet>

                    <div className="pageTopContainer">
                        <div className="contentWidth">
                            <PortalHeader appStore={this.appStore}/>
                        </div>
                    </div>

                    <div className="contentWrapper">
                        <UnsupportedBrowserModal/>
                        {(this.isSessionLoaded) && this.props.children}
                    </div>

                    <PortalFooter/>
                </div>
                <Else>
                    <LoadingIndicator isLoading={!this.isSessionLoaded} center={true} size={"big"}/>
                </Else>
            </If>
        );
    }
}
//