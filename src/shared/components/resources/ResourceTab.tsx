import * as React from 'react';
import { observer } from 'mobx-react';
import FeatureTitle from '../featureTitle/FeatureTitle';
import WindowStore from '../window/WindowStore';
import {
    action,
    computed,
    makeObservable,
    observable,
    runInAction,
} from 'mobx';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { ResourceData } from 'cbioportal-ts-api-client';
import { buildPDFUrl, getFileExtension } from './ResourcesTableUtils';
import IFrameLoader from 'shared/components/iframeLoader/IFrameLoader';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { CUSTOM_URL_TRANSFORMERS } from 'shared/components/resources/customResourceHelpers';
import { getResourceConfig } from 'shared/lib/ResourceConfig';
import WSIViewer from 'shared/components/wsiViewer/WSIViewer';
import { readWsiHashState } from 'shared/components/wsiViewer/wsiViewStateUtils';
import { warmInitialWsiSlide } from 'shared/components/wsiViewer/wsiViewerWarmup';

type UrlAccessibilityState = 'checking' | 'ready' | 'warning';

interface ICurrentResourceView {
    datum?: ResourceData;
    iframeErrorMessage?: string;
    iframeUrl?: string;
    index: number;
    nativeViewer?: 'wsi';
    url?: string;
}

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

    @observable private urlAccessibilityState: UrlAccessibilityState = 'ready';
    private latestUrlCheckRequestId = 0;

    componentDidMount() {
        this.startUrlAccessibilityCheck();
        this.startWsiWarmup();
    }

    componentDidUpdate(prevProps: IResourceTabProps) {
        if (
            this.buildCurrentResourceView(prevProps).url !==
            this.currentResourceView.url
        ) {
            this.startUrlAccessibilityCheck();
            this.startWsiWarmup();
        }
    }

    componentWillUnmount() {
        this.latestUrlCheckRequestId += 1;
    }

    private buildWsiTileServerBase(url: string): string {
        try {
            const parsed = new URL(url, getBrowserWindow().location.href);
            const pathname = parsed.pathname
                .replace(/\/patient\/[^/]+\/?$/, '')
                .replace(/\/$/, '');
            return `${parsed.origin}${pathname}`;
        } catch {
            return url.replace(/\/patient\/[^/]+\/?$/, '').replace(/\/$/, '');
        }
    }

    private buildCurrentResourceView(
        props: IResourceTabProps = this.props
    ): ICurrentResourceView {
        const selectedResourceUrl = props.urlWrapper.query.resourceUrl;
        const index = selectedResourceUrl
            ? props.resourceData.findIndex(
                  datum => datum.url === selectedResourceUrl
              )
            : 0;
        const normalizedIndex = index === -1 ? 0 : index;
        const datum = props.resourceData[normalizedIndex];

        if (!datum) {
            return { index: normalizedIndex };
        }

        const resourceConfig = datum.resourceDefinition
            ? getResourceConfig(datum.resourceDefinition)
            : {};

        return {
            datum,
            iframeErrorMessage: resourceConfig.iframeErrorMessage,
            iframeUrl: this.resolveIframeUrl(datum),
            index: normalizedIndex,
            nativeViewer: resourceConfig.nativeViewer,
            url: datum.url,
        };
    }

    @action.bound
    private startUrlAccessibilityCheck() {
        const {
            iframeErrorMessage,
            url: currentResourceUrl,
        } = this.currentResourceView;

        if (!iframeErrorMessage || !currentResourceUrl) {
            this.urlAccessibilityState = 'ready';
            return;
        }

        const requestId = this.latestUrlCheckRequestId + 1;
        this.latestUrlCheckRequestId = requestId;
        this.urlAccessibilityState = 'checking';
        void this.checkUrlAccessibility(currentResourceUrl, requestId);
    }

    private startWsiWarmup() {
        if (this.currentResourceView.nativeViewer !== 'wsi') {
            return;
        }

        const currentResourceUrl = this.currentResourceView.url;
        if (!currentResourceUrl) {
            return;
        }

        const hashState = readWsiHashState();
        void warmInitialWsiSlide({
            tileServerUrl: this.buildWsiTileServerBase(currentResourceUrl),
            hierarchyUrl: currentResourceUrl,
            studyId: this.currentResourceView.datum?.studyId,
            preferredSlideId: hashState?.slideId,
            stainFilter: 'all',
        }).catch(() => {
            // Ignore warmup failures; the viewer handles real load errors.
        });
    }

    private async checkUrlAccessibility(url: string, requestId: number) {
        let urlIsAccessible = true;

        try {
            await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
            });
        } catch (error) {
            urlIsAccessible = false;
        }

        if (requestId !== this.latestUrlCheckRequestId) {
            return;
        }

        runInAction(() => {
            this.urlAccessibilityState = urlIsAccessible ? 'ready' : 'warning';
        });
    }

    @computed get iframeHeight() {
        return WindowStore.size.height - 275;
    }

    @action.bound
    private goToNextDatum() {
        if (!this.isLastDatum) {
            this.props.urlWrapper.setResourceUrl(
                this.props.resourceData[this.currentResourceView.index + 1].url
            );
        }
    }

    @action.bound
    private goToPrevDatum() {
        if (!this.isFirstDatum) {
            this.props.urlWrapper.setResourceUrl(
                this.props.resourceData[this.currentResourceView.index - 1].url
            );
        }
    }

    @computed get isFirstDatum() {
        return this.currentResourceView.index === 0;
    }

    @computed get isLastDatum() {
        return (
            this.currentResourceView.index ===
            this.props.resourceData.length - 1
        );
    }

    @computed get httpIframeWithHttpsPortal() {
        const currentResourceUrl = this.currentResourceView.datum?.url;

        return (
            !!currentResourceUrl &&
            getBrowserWindow().location.protocol === 'https:' &&
            new URL(currentResourceUrl).protocol === 'http:'
        );
    }

    private resolveIframeUrl(datum: ResourceData) {
        const fileExtension = getFileExtension(datum.url);
        let url = datum.url;

        switch (fileExtension) {
            case 'pdf':
                url = buildPDFUrl(datum.url);
                break;
        }

        try {
            // apply instance specific transformation on url (e.g. to keep state)
            CUSTOM_URL_TRANSFORMERS.forEach(config => {
                if (config.test(datum) === true) {
                    url = config.transformer(datum);
                }
            });
        } catch (ex) {
            console.error(ex);
            // it's just some configuration failure so let things proceed
            // with unprocessed url
        }

        return url;
    }

    @computed get currentResourceView(): ICurrentResourceView {
        return this.buildCurrentResourceView();
    }

    private renderFeatureHeader(children?: React.ReactNode) {
        return (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <FeatureTitle
                    title={this.props.resourceDisplayName}
                    isLoading={false}
                    className="pull-left"
                    style={{ marginBottom: 10 }}
                />
                {children}
            </div>
        );
    }

    private renderFrameContent(currentResourceView: ICurrentResourceView) {
        const {
            datum: currentResourceDatum,
            iframeErrorMessage,
            iframeUrl,
        } = currentResourceView;

        if (!currentResourceDatum) {
            return null;
        }

        if (this.httpIframeWithHttpsPortal) {
            return (
                <div>
                    <span>
                        We can't show this URL in the portal. Please use the
                        link below:
                    </span>
                    <br />
                    <a href={currentResourceDatum.url}>
                        {currentResourceDatum.url}
                    </a>
                </div>
            );
        }

        return (
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: this.iframeHeight,
                }}
            >
                {this.urlAccessibilityState === 'checking' ? (
                    <LoadingIndicator
                        isLoading={true}
                        center={true}
                        size="big"
                    />
                ) : this.urlAccessibilityState === 'warning' ? (
                    <div className={styles.warningBanner}>
                        <div className={styles.warningIcon}>
                            <i className="fa fa-exclamation-triangle" />
                        </div>
                        <div className={styles.warningText}>
                            {iframeErrorMessage}
                        </div>
                        <button
                            className={styles.refreshButton}
                            onClick={() => getBrowserWindow().location.reload()}
                        >
                            <i
                                className="fa fa-refresh"
                                style={{ marginRight: 6 }}
                            />
                            Refresh Page
                        </button>
                    </div>
                ) : (
                    <IFrameLoader
                        url={iframeUrl!}
                        height={this.iframeHeight}
                        width={'100%'}
                    />
                )}
            </div>
        );
    }

    render() {
        const currentResourceView = this.currentResourceView;
        const {
            datum: currentResourceDatum,
            index: currentResourceIndex,
        } = currentResourceView;
        const multipleData = this.props.resourceData.length > 1;

        if (!currentResourceDatum) {
            return null;
        }

        // Native WSI viewer — replaces iframe entirely
        if (currentResourceView.nativeViewer === 'wsi') {
            return (
                <div>
                    {this.renderFeatureHeader()}
                    <WSIViewer
                        url={currentResourceDatum.url}
                        height={this.iframeHeight}
                        studyId={currentResourceDatum.studyId}
                    />
                </div>
            );
        }

        return (
            <div>
                {this.renderFeatureHeader(
                    <p style={{ marginLeft: 10 }}>
                        {currentResourceDatum.sampleId
                            ? currentResourceDatum.sampleId
                            : currentResourceDatum.patientId}
                        {currentResourceDatum.resourceDefinition?.description &&
                            ` | ${currentResourceDatum.resourceDefinition.description}`}
                        {` | ${currentResourceIndex + 1} of ${
                            this.props.resourceData.length
                        }`}
                    </p>
                )}
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
                    {this.renderFrameContent(currentResourceView)}
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
