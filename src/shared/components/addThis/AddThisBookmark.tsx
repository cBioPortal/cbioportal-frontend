import * as React from 'react';
import {observer} from "mobx-react";
import {ResultsViewPageStore} from "pages/resultsView/ResultsViewPageStore";
import addthis from "addthis-snippet";
import Loader from "shared/components/loadingIndicator/LoadingIndicator";
import {observable} from "mobx";


export interface IAddThisBookmarkProps {
    store:ResultsViewPageStore;
    getParameters:{setup: (url:any) => any; className: string};
}

@observer
export default class AddThisBookmark extends React.Component<IAddThisBookmarkProps, {}> {

    @observable private isReady = false;

    constructor() {
        super();
    }

    componentDidMount() {
        this.addAddThis();
    }

    componentDidUpdate() {
        this.addAddThis();
    }

    public addAddThis() {
        const {bitlyShortenedURL, sessionIdURL} = this.props.store;

        if (bitlyShortenedURL.isError || bitlyShortenedURL.isComplete) {
            const url = bitlyShortenedURL.result || sessionIdURL;
            addthis(
                {pubid: 'ra-59959e35901cdde7'},
                this.props.getParameters.setup(url),
                () => {
                    this.isReady = true;
                }
            );
        }
    }

    public render() {
        const {isComplete, isError} = this.props.store.bitlyShortenedURL;
        if (this.isReady && (isComplete || isError)) {
            return <div className={this.props.getParameters.className}/>;
        } else return <Loader isLoading={true}/>;
    }

}