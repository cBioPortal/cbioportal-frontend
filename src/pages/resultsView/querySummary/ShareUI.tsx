import {remoteData} from "../../../shared/api/remoteData";
import getBrowserWindow from "../../../shared/lib/getBrowserWindow";
import ExtendedRouterStore from "../../../shared/lib/ExtendedRouterStore";
import {observer} from "mobx-react";
import * as React from "react";
import URL, {QueryParams} from 'url';
import styles from './shareUI.module.scss';
import autobind from "autobind-decorator";
import {BookmarkModal} from "../bookmark/BookmarkModal";
import {action, observable} from "mobx";
import AppConfig from "appConfig";

interface IShareUI {
    sessionEnabled: boolean;
    routingStore: ExtendedRouterStore;
    bitlyKey?: string | null;
}

const win = getBrowserWindow();

export interface ShareUrls {
    sessionUrl:string|undefined;
    bitlyUrl:any|undefined;
    fullUrl:string;
}

@observer
export class ShareUI extends React.Component<IShareUI, {}> {

    constructor() {
        super();
    }

    @observable showBookmarkDialog:boolean = false;

    async getUrl():Promise<ShareUrls> {

        let sessionUrl = win.location.href;

        let bitlyResponse;

        if (this.props.sessionEnabled) {
            if (this.props.routingStore._session) {
                sessionUrl = getBrowserWindow().location.href;
            } else {
                const resp = await this.props.routingStore.saveRemoteSession(this.props.routingStore.query);
                // for testing purposes we don't have links to localhost
                sessionUrl = URL.format({
                    hostname: (win.location.hostname.includes("localhost") ? "www.cbioportal.org" : win.location.hostname),
                    pathname: win.location.pathname,
                    protocol: win.location.protocol,
                    query: {
                        session_id: resp.id
                    }
                });
            }
        }

        // now lets shorten with bityly, if we have key
        // WE ARE DISABLING BITLY PENDING DISCUSSION
        // if (this.props.bitlyKey) {
        //     try {
        //         bitlyResponse = await $.ajax({
        //             url: `https://api-ssl.bitly.com/v3/shorten?access_token=${this.props.bitlyKey}&longUrl=${encodeURIComponent(sessionUrl)}`
        //         });
        //     } catch (ex) {
        //         // fail silently.  we can just reutrn sessionUrl without shortening
        //     }
        // }

        return {
            sessionUrl,
            bitlyUrl: undefined, //((bitlyResponse && bitlyResponse.data && bitlyResponse.data.url) ? bitlyResponse.data.url : undefined),
            fullUrl: win.location.href
        }

    }

    @autobind
    shareTwitter() {
        this.getUrl().then((urlData:ShareUrls) => {
            const url = urlData.bitlyUrl || urlData.sessionUrl || urlData.fullUrl;
            win.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(document.title)}&via=cbioportal`);
        });
    }

    @autobind
    openEmail() {
        this.getUrl().then((urlData)=>{
            window.location.href =
                `mailto:?subject=${encodeURIComponent(document.title)}&body=${encodeURIComponent(urlData.sessionUrl || urlData.fullUrl)}%20${encodeURIComponent(document.title)}`;
        });
    }

    @autobind
    @action
    toggleBookmarkDialog(){
        this.showBookmarkDialog = !this.showBookmarkDialog;
    }

    render() {
        return <div className={styles.shareModule}>

            {
                (AppConfig.serverConfig.skin_show_tweet_button) && (
                    <a onClick={this.shareTwitter}>
                        <span className="fa-stack fa-4x">
                            <i className="fa fa-circle fa-stack-2x"></i>
                            <i className="fa fa-twitter fa-stack-1x"></i>
                        </span>
                    </a>
                )
            }

            <a onClick={this.openEmail}>
                <span className="fa-stack fa-4x">
                    <i className="fa fa-circle fa-stack-2x"></i>
                    <i className="fa fa-envelope fa-stack-1x"></i>
                </span>
            </a>
            <a onClick={this.toggleBookmarkDialog}>
                <span className="fa-stack fa-4x">
                    <i className="fa fa-circle fa-stack-2x"></i>
                    <i className="fa fa-external-link-square fa-stack-1x"></i>
                </span>
            </a>
            {
                (this.showBookmarkDialog) && (<BookmarkModal onHide={this.toggleBookmarkDialog} urlPromise={this.getUrl()}/>)
            }
        </div>
    }

}