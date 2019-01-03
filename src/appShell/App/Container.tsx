import * as _ from 'lodash';
import * as React from 'react';
import UnsupportedBrowserModal from "shared/components/unsupportedBrowserModal/UnsupportedBrowserModal";

import '../../globalStyles/prefixed-global.scss';
import PortalHeader from "./PortalHeader";
import PortalFooter from "./PortalFooter";
import getBrowserWindow from "../../shared/lib/getBrowserWindow";
import {observer} from "mobx-react";

import LoadingIndicator from "../../shared/components/loadingIndicator/LoadingIndicator";
import AppConfig from "appConfig";
import Helmet from "react-helmet";
import {computed} from "mobx";
import { If, Else, Then } from 'react-if';
import ErrorScreen from "./ErrorScreen";

interface IContainerProps {
    location: Location;
    children: React.ReactNode;
}

@observer
export default class Container extends React.Component<IContainerProps, {}> {

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
                        <title>{AppConfig.serverConfig.skin_title}</title>
                        <meta name="description" content={AppConfig.serverConfig.skin_description} />
                    </Helmet>

                    <div className="pageTopContainer">
                        <div className="contentWidth">
                            <PortalHeader appStore={this.appStore}/>
                        </div>
                    </div>
                    <If condition={this.appStore.isErrorCondition}>
                       <Then>
                           <div className="contentWrapper">
                               <ErrorScreen appStore={this.appStore}/>
                           </div>
                       </Then>
                        <Else>
                            <div className="contentWrapper">
                                <UnsupportedBrowserModal/>
                                {(this.isSessionLoaded) && this.props.children}
                            </div>
                        </Else>
                    </If>


                </div>
                <Else>
                    <LoadingIndicator isLoading={!this.isSessionLoaded} center={true} size={"big"}/>
                </Else>
            </If>
        );
    }
}


