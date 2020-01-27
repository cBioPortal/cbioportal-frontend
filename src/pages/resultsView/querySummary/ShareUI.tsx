import { DefaultTooltip, getBrowserWindow } from 'cbioportal-frontend-commons';
import ExtendedRouterStore from '../../../shared/lib/ExtendedRouterStore';
import { observer } from 'mobx-react';
import * as React from 'react';
import URL, { QueryParams } from 'url';
import styles from './shareUI.module.scss';
import autobind from 'autobind-decorator';
import { BookmarkModal } from '../bookmark/BookmarkModal';
import { action, observable } from 'mobx';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';

interface IShareUI {
    sessionEnabled: boolean;
    urlWrapper: ResultsViewURLWrapper;
    bitlyAccessToken?: string | null;
}

const win = getBrowserWindow();

export interface ShareUrls {
    bitlyUrl: string | undefined;
    fullUrl: string;
    sessionUrl: string | undefined;
}

@observer
export class ShareUI extends React.Component<IShareUI, {}> {
    @observable showBookmarkDialog: boolean = false;

    async getUrls(): Promise<ShareUrls> {
        let sessionUrl = win.location.href;

        let bitlyResponse;

        // now lets shorten with bityly, if we have key
        // WE ARE DISABLING BITLY PENDING DISCUSSION
        if (this.props.bitlyAccessToken) {
            try {
                bitlyResponse = await $.ajax({
                    url: `https://api-ssl.bitly.com/v3/shorten?access_token=${
                        this.props.bitlyAccessToken
                    }&longUrl=${encodeURIComponent(sessionUrl)}`,
                });
            } catch (ex) {
                // fail silently.  we can just reutrn sessionUrl without shortening
            }
        }

        return {
            bitlyUrl:
                bitlyResponse && bitlyResponse.data && bitlyResponse.data.url
                    ? bitlyResponse.data.url
                    : undefined,
            fullUrl: win.location.href,
            sessionUrl: sessionUrl,
        };
    }

    @autobind
    @action
    toggleBookmarkDialog() {
        this.showBookmarkDialog = !this.showBookmarkDialog;
    }

    render() {
        return (
            <div className={styles.shareModule}>
                <DefaultTooltip
                    placement={'topLeft'}
                    overlay={<div>Get bookmark link</div>}
                >
                    <a onClick={this.toggleBookmarkDialog}>
                        <span className="fa-stack fa-4x">
                            <i className="fa fa-circle fa-stack-2x"></i>
                            <i className="fa fa-link fa-stack-1x"></i>
                        </span>
                    </a>
                </DefaultTooltip>
                {this.showBookmarkDialog && (
                    <BookmarkModal
                        onHide={this.toggleBookmarkDialog}
                        urlPromise={this.getUrls()}
                    />
                )}
            </div>
        );
    }
}
