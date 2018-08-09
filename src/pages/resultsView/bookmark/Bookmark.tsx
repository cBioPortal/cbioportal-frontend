import * as React from "react";
import * as _ from 'lodash';
import {observer} from "mobx-react";
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import {BookmarkLinks} from "../../../shared/model/BookmarkLinks";
import MobxPromise from "mobxpromise";
import Loader from "../../../shared/components/loadingIndicator/LoadingIndicator";

@observer
export class Bookmark extends React.Component<{ urlPromise:MobxPromise<BookmarkLinks> },{}> {

    constructor(){
        super();
    }

    render(){
        return <div>
            {
                (this.props.urlPromise.isComplete) && (
                    <div>
                        <p>Right click on one of the links below to bookmark your results:</p>
                        <p><a href={this.props.urlPromise.result!.longUrl} target="_blank">{this.props.urlPromise.result!.longUrl}</a></p>

                        <p>If you would like to use a shorter <strong>URL that will not break in email postings</strong>, you can use the
                            bitly.com url below:</p>
                        <p><a href={this.props.urlPromise.result!.shortenedUrl} target="_blank">{this.props.urlPromise.result!.shortenedUrl}</a></p>
                    </div>
                )
            }
            <Loader isLoading={this.props.urlPromise.isPending} />
        </div>
    }

}