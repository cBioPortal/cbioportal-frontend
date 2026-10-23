import * as React from 'react';
import { observer } from 'mobx-react';
import {
    action,
    computed,
    makeObservable,
    observable,
    runInAction,
} from 'mobx';
import classNames from 'classnames';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import FeatureTitle from '../featureTitle/FeatureTitle';
import WindowStore from '../window/WindowStore';
import IFrameLoader from 'shared/components/iframeLoader/IFrameLoader';
import {
    getFileExtension,
    IResourceTableRow,
} from 'shared/lib/ResourceTableUtils';
import { applyCustomUrlTransforms } from './resourceUrlTransforms';
import { buildPDFUrl } from './resourceUrlUtils';
import styles from './styles.module.scss';

/** Shown when a resource's host does not answer and the resource names no message of its own. */
const DEFAULT_UNREACHABLE_MESSAGE =
    'This resource could not be reached. It may need a network connection the portal does ' +
    'not have, or it may be temporarily unavailable. The link below opens it directly.';

export interface IResourceViewerProps {
    /** The items this viewer can step through, in display order. */
    rows: IResourceTableRow[];
    /** Which item is shown. */
    index: number;
    onIndexChange: (index: number) => void;
    resourceDisplayName: string;
    /**
     * Replaces the general message when the resource host cannot be reached, for a resource
     * whose reason is known, e.g. one behind a VPN.
     */
    iframeErrorMessage?: string;
    /** Leaves out the title and caption, for a page whose tab already names the resource. */
    hideHeader?: boolean;
}

/** Frames one resource and steps through the rest. The caller owns which item is shown. */
@observer
export default class ResourceViewer extends React.Component<
    IResourceViewerProps,
    {}
> {
    constructor(props: IResourceViewerProps) {
        super(props);
        makeObservable(this);
    }

    @observable private urlCheckComplete = false;
    @observable private urlIsAccessible = true;
    // Identifies the check in flight, so a slow answer for an earlier row is discarded.
    private latestUrlCheckRequestId = 0;

    componentDidMount() {
        this.startUrlAccessibilityCheck();
    }

    componentDidUpdate(prevProps: IResourceViewerProps) {
        if (prevProps.rows[prevProps.index]?.url !== this.currentRow?.url) {
            this.startUrlAccessibilityCheck();
        }
    }

    componentWillUnmount() {
        this.latestUrlCheckRequestId += 1;
    }

    @computed get currentIndex() {
        return this.props.index;
    }

    @computed get currentRow(): IResourceTableRow | undefined {
        return this.props.rows[this.currentIndex];
    }

    @computed get isFirstRow() {
        return this.currentIndex === 0;
    }

    @computed get isLastRow() {
        return this.currentIndex === this.props.rows.length - 1;
    }

    @action.bound
    private goToPrevRow() {
        if (!this.isFirstRow) {
            this.props.onIndexChange(this.currentIndex - 1);
        }
    }

    @action.bound
    private goToNextRow() {
        if (!this.isLastRow) {
            this.props.onIndexChange(this.currentIndex + 1);
        }
    }

    @computed get iframeHeight() {
        return WindowStore.size.height - 275;
    }

    /**
     * A portal served over https cannot frame an http resource. The browser blocks it without a
     * message, so offer the link instead.
     */
    @computed get httpIframeWithHttpsPortal() {
        if (!this.currentRow) {
            return false;
        }
        try {
            return (
                getBrowserWindow().location.protocol === 'https:' &&
                new URL(this.currentRow.url).protocol === 'http:'
            );
        } catch {
            return false;
        }
    }

    @computed get iframeUrl() {
        const row = this.currentRow!;
        const url =
            getFileExtension(row.url) === 'pdf'
                ? buildPDFUrl(row.url)
                : row.url;
        return applyCustomUrlTransforms(row, url);
    }

    @action.bound
    private startUrlAccessibilityCheck() {
        const url = this.currentRow?.url;

        if (!url) {
            this.urlIsAccessible = true;
            this.urlCheckComplete = true;
            return;
        }

        const requestId = this.latestUrlCheckRequestId + 1;
        this.latestUrlCheckRequestId = requestId;
        this.urlIsAccessible = true;
        this.urlCheckComplete = false;
        void this.checkUrlAccessibility(url, requestId);
    }

    /**
     * Reports whether the host answers at all. The response is opaque, so this catches an
     * unreachable host and nothing else — a host that answers but refuses to be framed still
     * renders as an empty frame, which is why the link is always offered.
     */
    private async checkUrlAccessibility(url: string, requestId: number) {
        let urlIsAccessible = true;

        try {
            await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        } catch (error) {
            urlIsAccessible = false;
        }

        if (requestId !== this.latestUrlCheckRequestId) {
            return;
        }

        runInAction(() => {
            this.urlIsAccessible = urlIsAccessible;
            this.urlCheckComplete = true;
        });
    }

    /**
     * The frame is shown straight away and replaced if the host turns out to be unreachable, so
     * no resource waits on the check before anything appears.
     */
    @computed get shouldShowWarning() {
        return this.urlCheckComplete && !this.urlIsAccessible;
    }

    private renderBody() {
        const row = this.currentRow!;

        if (this.httpIframeWithHttpsPortal) {
            return (
                <div>
                    <span>
                        We can't show this URL in the portal. Please use the
                        link below:
                    </span>
                    <br />
                    <a href={row.url} target="_blank" rel="noopener noreferrer">
                        {row.url}
                    </a>
                </div>
            );
        }

        if (this.shouldShowWarning) {
            return (
                <div className={styles.warningBanner}>
                    <div className={styles.warningIcon}>
                        <i className="fa fa-exclamation-triangle" />
                    </div>
                    <div className={styles.warningText}>
                        {this.props.iframeErrorMessage ||
                            DEFAULT_UNREACHABLE_MESSAGE}
                    </div>
                    <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginBottom: 10 }}
                        data-testid="ResourceViewerWarningLink"
                    >
                        Open in new window <i className="fa fa-external-link" />
                    </a>
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
            );
        }

        return (
            <IFrameLoader
                url={this.iframeUrl}
                height={this.iframeHeight}
                width={'100%'}
            />
        );
    }

    render() {
        const row = this.currentRow;
        if (!row) {
            return null;
        }

        const multipleRows = this.props.rows.length > 1;

        return (
            <div data-test="ResourceViewer">
                {!this.props.hideHeader && (
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <FeatureTitle
                            title={this.props.resourceDisplayName}
                            isLoading={false}
                            className="pull-left"
                            style={{ marginBottom: 10 }}
                        />
                        <p
                            style={{ marginLeft: 10 }}
                            data-testid="ResourceViewerCaption"
                        >
                            {[
                                row.sampleStableId || row.patientStableId,
                                multipleRows &&
                                    `${this.currentIndex + 1} of ${
                                        this.props.rows.length
                                    }`,
                            ]
                                .filter(Boolean)
                                .join(' | ')}
                        </p>
                    </div>
                )}
                <div
                    style={{
                        width: '100%',
                        minHeight: this.iframeHeight,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    {multipleRows && (
                        <div
                            className={classNames(styles.carouselButton, {
                                [styles.active]: !this.isFirstRow,
                            })}
                            onClick={this.goToPrevRow}
                            data-testid="ResourceViewerPrev"
                        >
                            <i
                                style={{ marginRight: 15 }}
                                className="fa fa-4x fa-chevron-left"
                            />
                        </div>
                    )}
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: this.iframeHeight,
                        }}
                    >
                        {this.renderBody()}
                    </div>
                    {multipleRows && (
                        <div
                            className={classNames(styles.carouselButton, {
                                [styles.active]: !this.isLastRow,
                            })}
                            onClick={this.goToNextRow}
                            data-testid="ResourceViewerNext"
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
