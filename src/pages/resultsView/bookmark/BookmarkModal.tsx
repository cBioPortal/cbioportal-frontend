import * as React from "react";
import * as _ from 'lodash';
import {observer} from "mobx-react";
import MobxPromise from "mobxpromise";
import Loader from "../../../shared/components/loadingIndicator/LoadingIndicator";
import {Modal} from 'react-bootstrap';
import ExtendedRouterStore from "../../../shared/lib/ExtendedRouterStore";
import {remoteData} from "../../../shared/api/remoteData";
import getBrowserWindow from "../../../shared/lib/getBrowserWindow";
import URL, {QueryParams} from 'url';

@observer
export class BookmarkModal extends React.Component<{ onHide: () => void, routingStore: ExtendedRouterStore }, {}> {

    constructor(){
        super();
    }

    shortenedUrl = remoteData(async () => {

        const win = getBrowserWindow();

        let sessionUrl;
        // if we have a session use current url
        if (this.props.routingStore._session) {
            sessionUrl = getBrowserWindow().location.href;
        } else {
            const resp = await this.props.routingStore.saveRemoteSession(this.props.routingStore.query);
            sessionUrl = URL.format({
                hostname: win.location.hostname,
                pathname: win.location.pathname,
                protocol: win.location.protocol,
                query: {
                    session_id: resp.id
                }
            });
        }

        const BITLY_ACCESS_TOKEN = "7fdf316a43437f8a6291b99963b371d0229d4b2e";

        const bitlyResponse = await $.ajax({
            url:`https://api-ssl.bitly.com/v3/shorten?access_token=${BITLY_ACCESS_TOKEN}&longUrl=${encodeURIComponent(sessionUrl)}`
        });

        return {sessionUrl, bitlyUrl:bitlyResponse.data.url};

    })

    render() {

        return <Modal show={true} onHide={this.props.onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Bookmark Query</Modal.Title>
            </Modal.Header>
            <Modal.Body>

                {
                    (this.shortenedUrl.isComplete) && (
                    <div>
                        <p>Right click on one of the links below to bookmark your results:</p>
                        <p><a href={this.shortenedUrl.result.sessionUrl} target="_blank">{this.shortenedUrl.result.sessionUrl}</a></p>

                        <p>If you would like to use a shorter <strong>URL that will not break in email postings</strong>, you can use the
                        bitly.com url below:</p>
                        <p><a href={this.shortenedUrl.result.bitlyUrl} target="_blank">{this.shortenedUrl.result.bitlyUrl}</a></p>
                    </div>
                    )
                }

            </Modal.Body>
        </Modal>

    }

}