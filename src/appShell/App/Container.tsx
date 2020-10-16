import {
    GenieAgreement,
    shouldShowGenieWarning,
} from 'appShell/App/usageAgreements/GenieAgreement';
import {
    shouldShowStudyViewWarning,
    StudyAgreement,
} from 'appShell/App/usageAgreements/StudyAgreement';
import UserMessager from 'shared/components/userMessager/UserMessage';
import AppConfig from 'appConfig';
import { formatErrorLog } from 'shared/lib/errorFormatter';
import { ErrorAlert } from 'shared/components/errorAlert/ErrorAlert';
import { SiteError } from 'cbioportal-utils';
import PortalHeader from 'appShell/App/PortalHeader';
import ErrorScreen from 'shared/components/errorScreen/ErrorScreen';
import React from 'react';
import Helmet from 'react-helmet';
import { If, Then, Else } from 'react-if';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { getBrowserWindow, isWebdriver } from 'cbioportal-frontend-commons';
import { ServerConfigHelpers } from 'config/config';

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
                <div className="contentWrapper">
                    {this.appStore.undismissedAlertErrors.map(
                        (e: SiteError) => {
                            return (
                                <ErrorAlert
                                    errorLog={formatErrorLog(
                                        this.appStore.undismissedAlertErrors
                                    )}
                                    err={e}
                                    onDismiss={() =>
                                        this.appStore.dismissError(e)
                                    }
                                />
                            );
                        }
                    )}

                    <If
                        condition={this.appStore.undismissedScreenErrors.length}
                    >
                        <Then>
                            <ErrorScreen
                                errorLog={formatErrorLog(
                                    this.appStore.undismissedScreenErrors
                                )}
                                title={
                                    'Oops. There was an error retrieving data.'
                                }
                                errors={this.appStore.undismissedScreenErrors}
                            />
                        </Then>
                        <Else>
                            <>
                                {this.appStore.isDialogErrorCondition && (
                                    <ErrorScreen
                                        title={
                                            'Oops. There was an error retrieving data.'
                                        }
                                        errors={
                                            this.appStore.undismissedSiteErrors
                                        }
                                    />
                                )}
                                {this.props.children}
                            </>
                        </Else>
                    </If>
                </div>
            </div>
        );
    }
}
