import * as React from 'react';
import { observer } from 'mobx-react';
import FeatureTitle from '../featureTitle/FeatureTitle';
import WindowStore from '../window/WindowStore';
import { action, computed, makeObservable, observable } from 'mobx';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { ResourceData } from 'cbioportal-ts-api-client';
import { buildPDFUrl, getFileExtension } from './ResourcesTableUtils';
import IFrameLoader from 'shared/components/iframeLoader/IFrameLoader';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { getServerConfig } from 'config/config';
import { CUSTOM_URL_TRANSFORMERS } from 'shared/components/resources/customResourceHelpers';
import { getResourceConfig } from 'shared/lib/ResourceConfig';

export interface IResourceTabProps {
    resourceDisplayName: string;
    resourceData: ResourceData[];
    urlWrapper: {
        setResourceUrl: (resourceUrl: string) => void;
        query: { resourceUrl?: string };
    };
}

@observer
export default class ResourceTab extends React.Component<
    IResourceTabProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @observable private urlCheckComplete = false;
    @observable private urlIsAccessible = true;

    componentDidMount() {
        // Check URL accessibility if there's an error message configured
        if (this.iframeErrorMessage && this.currentResourceDatum.url) {
            this.checkUrlAccessibility();
        }
    }

    @action.bound
    private async checkUrlAccessibility() {
        try {
            // Try to fetch the URL with HEAD request (lightweight)
            await fetch(this.currentResourceDatum.url, {
                method: 'HEAD',
                mode: 'no-cors', // Avoid CORS issues
            });
            // With no-cors, we can't read the status, but if it doesn't throw, assume it's accessible
            this.urlIsAccessible = true;
        } catch (error) {
            // If fetch fails, URL is not accessible
            this.urlIsAccessible = false;
        } finally {
            this.urlCheckComplete = true;
        }
    }

    @computed get iframeHeight() {
        return WindowStore.size.height - 275;
    }

    @computed get currentResourceIndex() {
        if (!this.props.urlWrapper.query.resourceUrl) {
            return 0;
        } else {
            const index = this.props.resourceData.findIndex(
                d => d.url === this.props.urlWrapper.query.resourceUrl
            );
            if (index === -1) {
                return 0;
            } else {
                return index;
            }
        }
    }

    @computed get currentResourceDatum() {
        return this.props.resourceData[this.currentResourceIndex];
    }

    @action.bound
    private goToNextDatum() {
        if (!this.isLastDatum) {
            this.props.urlWrapper.setResourceUrl(
                this.props.resourceData[this.currentResourceIndex + 1].url
            );
        }
    }

    @action.bound
    private goToPrevDatum() {
        if (!this.isFirstDatum) {
            this.props.urlWrapper.setResourceUrl(
                this.props.resourceData[this.currentResourceIndex - 1].url
            );
        }
    }

    @computed get isFirstDatum() {
        return this.currentResourceIndex === 0;
    }

    @computed get isLastDatum() {
        return this.currentResourceIndex === this.props.resourceData.length - 1;
    }

    @computed get httpIframeWithHttpsPortal() {
        return (
            getBrowserWindow().location.protocol === 'https:' &&
            new URL(this.currentResourceDatum.url).protocol === 'http:'
        );
    }

    @computed get iframeUrl() {
        const fileExtension = getFileExtension(this.currentResourceDatum.url);
        let url = this.currentResourceDatum.url;
        switch (fileExtension) {
            case 'pdf':
                url = buildPDFUrl(this.currentResourceDatum.url);
                break;
        }

        try {
            // apply instance specific transformation on url (e.g. to keep state)
            CUSTOM_URL_TRANSFORMERS.forEach(config => {
                if (config.test(this.currentResourceDatum) === true) {
                    url = config.transformer(this.currentResourceDatum);
                }
            });
        } catch (ex) {
            console.error(ex);
            // it's just some configuration failure so let things proceed
            // with unprocessed url
        }

        return url;
    }

    @computed get iframeErrorMessage() {
        // Get the resource definition for the current resource
        const resourceDef = this.currentResourceDatum.resourceDefinition;
        if (resourceDef) {
            const config = getResourceConfig(resourceDef);
            return config.iframeErrorMessage;
        }
        return undefined;
    }

    @computed get shouldShowWarning() {
        // Only show warning if:
        // 1. There's an error message configured
        // 2. URL check is complete
        // 3. URL is NOT accessible
        return (
            this.iframeErrorMessage &&
            this.urlCheckComplete &&
            !this.urlIsAccessible
        );
    }

    @computed get isCheckingUrlAccessibility() {
        // Show loading indicator while checking URL accessibility
        return this.iframeErrorMessage && !this.urlCheckComplete;
    }

    render() {
        const multipleData = this.props.resourceData.length > 1;

        return (
            <div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <FeatureTitle
                        title={this.props.resourceDisplayName}
                        isLoading={false}
                        className="pull-left"
                        style={{ marginBottom: 10 }}
                    />
                    <p style={{ marginLeft: 10 }}>
                        {this.currentResourceDatum.sampleId
                            ? this.currentResourceDatum.sampleId
                            : this.currentResourceDatum.patientId}
                        {` | ${this.props.resourceDisplayName}`}
                        {` | ${this.currentResourceIndex + 1} of ${
                            this.props.resourceData.length
                        }`}
                    </p>
                </div>
                <div
                    style={{
                        width: '100%',
                        height: this.iframeHeight,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    {multipleData && (
                        <div
                            className={classNames(styles.carouselButton, {
                                [styles.active]: !this.isFirstDatum,
                            })}
                            onClick={this.goToPrevDatum}
                        >
                            <i
                                style={{ marginRight: 15 }}
                                className="fa fa-4x fa-chevron-left"
                            />
                        </div>
                    )}
                    {this.httpIframeWithHttpsPortal ? (
                        <div>
                            <span>
                                We can't show this URL in the portal. Please use
                                the link below:
                            </span>
                            <br />
                            <a href={this.currentResourceDatum.url}>
                                {this.currentResourceDatum.url}
                            </a>
                        </div>
                    ) : (
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                minHeight: this.iframeHeight,
                            }}
                        >
                            {this.isCheckingUrlAccessibility ? (
                                // Show loading while checking URL accessibility
                                <LoadingIndicator
                                    isLoading={true}
                                    center={true}
                                    size="big"
                                />
                            ) : this.shouldShowWarning ? (
                                // Show warning if URL is not accessible
                                <div className={styles.warningBanner}>
                                    <div className={styles.warningIcon}>
                                        <i className="fa fa-exclamation-triangle" />
                                    </div>
                                    <div className={styles.warningText}>
                                        {this.iframeErrorMessage}
                                    </div>
                                    <button
                                        className={styles.refreshButton}
                                        onClick={() => window.location.reload()}
                                    >
                                        <i
                                            className="fa fa-refresh"
                                            style={{ marginRight: 6 }}
                                        />
                                        Refresh Page
                                    </button>
                                </div>
                            ) : (
                                // Show iframe if no error message or URL is accessible
                                <IFrameLoader
                                    url={this.iframeUrl}
                                    height={this.iframeHeight}
                                    width={'100%'}
                                />
                            )}
                        </div>
                    )}
                    {multipleData && (
                        <div
                            className={classNames(styles.carouselButton, {
                                [styles.active]: !this.isLastDatum,
                            })}
                            onClick={this.goToNextDatum}
                        >
                            <i
                                style={{ marginLeft: 15 }}
                                className="fa fa-4x fa-chevron-right"
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
