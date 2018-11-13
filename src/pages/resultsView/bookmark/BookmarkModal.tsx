import * as React from "react";
import * as _ from 'lodash';
import {observer} from "mobx-react";
import MobxPromise from "mobxpromise";
import Loader, {default as LoadingIndicator} from "../../../shared/components/loadingIndicator/LoadingIndicator";
import {Modal} from 'react-bootstrap';
import ExtendedRouterStore from "../../../shared/lib/ExtendedRouterStore";
import {remoteData} from "../../../shared/api/remoteData";
import getBrowserWindow from "../../../shared/lib/getBrowserWindow";
import URL, {QueryParams} from 'url';
import {observable} from "mobx";
import {ShareUrls} from "../querySummary/ShareUI";
import classNames from "classnames";
import autobind from "autobind-decorator";
var Clipboard = require('clipboard');


@observer
export class BookmarkModal extends React.Component<{ onHide: () => void, urlPromise:Promise<any> }, {}> {

    constructor(){
        super();
    }

    @observable
    urlData:ShareUrls;

    clipboards:any[] = [];

    private clipboardInitialized = false;

    componentDidMount(){
        // this is an $.ajax promise, not a real promise
        this.props.urlPromise.then(
            (data)=>{
                this.urlData = data;
                setTimeout(()=>{
                    this.initializeClipboards();
                },0);
            },
            ()=>{

            }
        );
    }

    @autobind
    showThumb(e:any){
        e.target.className="fa fa-thumbs-up";
    }

    @autobind
    initializeClipboards(){
            this.clipboards.push(new Clipboard(this.sessionButton, {
                text: function() {
                    return this.urlData.sessionUrl || this.urlData.fullUrl;
                }.bind(this),
                container: this.container
            }));

            if (this.urlData && this.urlData.bitlyUrl) {
                this.clipboards.push(new Clipboard(this.bitlyButton, {
                    text: function () {
                        return this.urlData.bitlyUrl;
                    }.bind(this),
                    container: this.container
                }));
            }

    }

    componentWillUnmount(){
        // we need to clean up clipboards
        this.clipboards.forEach((clipboard:any)=>clipboard.destroy());
    }

    public sessionButton:HTMLAnchorElement;

    public bitlyButton:HTMLAnchorElement;

    public container:HTMLDivElement;

    render() {

        //NOTE: internal div id necessary for
        return <Modal show={true} onHide={this.props.onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Bookmark Query</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{minHeight:70}}>
                <LoadingIndicator size={"small"} center={true} style={{top:32}} isLoading={!this.urlData}/>
                    <div className={classNames({hidden:!this.urlData})} ref={(el:HTMLDivElement)=>this.container=el}>
                        <form>
                            <div className="form-group">
                                <label htmlFor="exampleInputAmount">Share link</label>
                                <div className="input-group">
                                    <input type="text" className="form-control" value={(this.urlData ? this.urlData.sessionUrl : "")}/>
                                    <div className="input-group-addon">
                                        <a ref={(el:HTMLAnchorElement)=>this.sessionButton=el}
                                            onClick={this.showThumb}
                                        >
                                            <i className="fa fa-clipboard"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            {
                                (this.urlData && this.urlData.bitlyUrl) && (
                                    <div className="form-group">
                                        <label htmlFor="exampleInputAmount">Shortened URL</label>
                                        <div className="input-group">
                                            <input type="text" className="form-control" value={(this.urlData ? this.urlData.bitlyUrl : "")}/>
                                            <div className="input-group-addon"><a
                                                onClick={this.showThumb}
                                                ref={(el: HTMLAnchorElement) => this.bitlyButton = el}><i
                                                className="fa fa-clipboard"></i></a></div>
                                        </div>
                                    </div>
                                )
                            }
                        </form>
                    </div>
            </Modal.Body>
        </Modal>

    }

}