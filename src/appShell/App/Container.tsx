import * as React from 'react';

import 'cbioportal-frontend-commons/dist/styles.css';
import '../../globalStyles/prefixed-global.scss';

import PortalHeader from './PortalHeader';
import { getBrowserWindow, isWebdriver } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';

import AppConfig from 'appConfig';
import Helmet from 'react-helmet';
import { If, Else, Then } from 'react-if';
import UserMessager from 'shared/components/userMessager/UserMessage';
import {
    formatErrorLog,
    formatErrorTitle,
    formatErrorMessages,
} from 'shared/lib/errorFormatter';
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import ErrorScreen from 'shared/components/errorScreen/ErrorScreen';
import { ServerConfigHelpers } from 'config/config';
import {
    shouldShowStudyViewWarning,
    StudyAgreement,
} from 'appShell/App/usageAgreements/StudyAgreement';
import {
    GenieAgreement,
    shouldShowGenieWarning,
} from 'appShell/App/usageAgreements/GenieAgreement';
import makeRoutes from 'routes';

interface IContainerProps {
    location: Location;
    children: React.ReactNode;
}

function isLocalDBServer() {
    try {
        return (
            (window as any).frontendConfig.serverConfig.app_name ===
            'localdbe2e'
        );
    } catch (ex) {
        return false;
    }
}

@observer
export default class Container extends React.Component<IContainerProps, {}> {
    private get routingStore() {
        return getBrowserWindow().routingStore;
    }

    private get appStore() {
        return getBrowserWindow().globalStores.appStore;
    }

    renderChildren() {
        const childProps = { ...this.props };
        const { children } = this.props;
        return React.Children.map(children, c =>
            React.cloneElement(c as React.ReactElement<any>, childProps)
        );
    }

    render() {
        if (
            !isLocalDBServer() &&
            !isWebdriver() &&
            !ServerConfigHelpers.sessionServiceIsEnabled()
        ) {
            return (
                <div className="contentWrapper">
                    <ErrorScreen
                        title={'No session service configured'}
                        body={
                            <p>
                                As of version 3.0.0, all cBioPortal
                                installations require a session service. Please
                                review these instructions for how to do so.{' '}
                                <a href="https://docs.cbioportal.org/2.1.2-deploy-without-docker/deploying#run-cbioportal-session-service">
                                    https://docs.cbioportal.org/2.1.2-deploy-without-docker/deploying#run-cbioportal-session-service
                                </a>
                            </p>
                        }
                    />
                </div>
            );
        }

        return (
            <div>
                <Helmet>
                    <meta charSet="utf-8" />
                    <title>{AppConfig.serverConfig.skin_title}</title>
                    <meta
                        name="description"
                        content={AppConfig.serverConfig.skin_description}
                    />
                </Helmet>

                <div id="pageTopContainer" className="pageTopContainer">
                    <UserMessager />

                    {shouldShowStudyViewWarning() && <StudyAgreement />}

                    {shouldShowGenieWarning() && <GenieAgreement />}

                    <div className="contentWidth">
                        <PortalHeader appStore={this.appStore} />
                    </div>
                </div>
                <If condition={this.appStore.isErrorCondition}>
                    <Then>
                        <div className="contentWrapper">
                            <ErrorScreen
                                title={
                                    formatErrorTitle(
                                        this.appStore.undismissedSiteErrors
                                    ) ||
                                    'Oops. There was an error retrieving data.'
                                }
                                body={
                                    <a href={buildCBioPortalPageUrl('/')}>
                                        Return to homepage
                                    </a>
                                }
                                errorLog={formatErrorLog(
                                    this.appStore.undismissedSiteErrors
                                )}
                                errorMessages={formatErrorMessages(
                                    this.appStore.undismissedSiteErrors
                                )}
                            />
                        </div>
                    </Then>
                    <Else>
                        <div className="contentWrapper">
                            {makeRoutes(this.routingStore)}
                        </div>
                    </Else>
                </If>
            </div>
        );
    }
}
