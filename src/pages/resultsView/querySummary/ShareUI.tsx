import { DefaultTooltip, getBrowserWindow } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import * as React from 'react';
import styles from './shareUI.module.scss';
import autobind from 'autobind-decorator';
import { BookmarkModal } from '../bookmark/BookmarkModal';
import { action, observable } from 'mobx';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';
import request from 'superagent';
import AppConfig from 'appConfig';
import { getBitlyShortenedUrl } from '../../../shared/lib/bitly';

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

        const bitlyUrl = await getBitlyShortenedUrl(
            sessionUrl,
            this.props.bitlyAccessToken
        );

        return {
            bitlyUrl,
            fullUrl: sessionUrl,
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
                        title={'Bookmark Query'}
                    />
                )}
            </div>
        );
    }
}
