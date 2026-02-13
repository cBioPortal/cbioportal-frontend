import * as React from 'react';
import _ from 'lodash';
import LoadingIndicator from '../loadingIndicator/LoadingIndicator';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import FontAwesome from 'react-fontawesome';

interface IFramePostMessageLoaderProps {
    url: string;
    className?: string;
    iframeId?: string;
    height?: number | string;
    width?: number | string;
    postMessageData?: any;
    postMessageOrigin?: string;
}

@observer
export default class IFramePostMessageLoader extends React.Component<
    IFramePostMessageLoaderProps,
    {}
> {
    public static defaultProps = {
        width: '',
    };

    @observable iframeLoaded = false;

    private iframeRef = React.createRef<HTMLIFrameElement>();

    constructor(props: IFramePostMessageLoaderProps) {
        super(props);
        makeObservable(this);
    }

    private sendPostMessage() {
        if (
            this.props.postMessageData &&
            this.iframeRef.current?.contentWindow
        ) {
            const origin =
                this.props.postMessageOrigin || new URL(this.props.url).origin;
            console.log(
                '[cBioPortal] sending postMessage to origin:',
                origin,
                this.props.postMessageData
            );
            this.iframeRef.current.contentWindow.postMessage(
                this.props.postMessageData,
                origin
            );
        }
    }

    @autobind
    private onLoad() {
        console.log('[cBioPortal] iframe loaded:', this.props.url);
        this.iframeLoaded = true;
        this.sendPostMessage();
    }

    componentDidUpdate(prevProps: IFramePostMessageLoaderProps) {
        if (
            this.iframeLoaded &&
            !_.isEqual(prevProps.postMessageData, this.props.postMessageData)
        ) {
            console.log('[cBioPortal] postMessageData changed, re-sending');
            this.sendPostMessage();
        }
    }

    //NOTE: we need zindex to be higher than that of global loader
    render() {
        return (
            <div
                style={{
                    position: 'relative',
                    width: this.props.width,
                    marginTop: 5,
                }}
            >
                <LoadingIndicator
                    center={true}
                    size={'big'}
                    isLoading={!this.iframeLoaded}
                />
                <a
                    href={this.props.url}
                    target="_blank"
                    style={{
                        position: 'absolute',
                        fontSize: 12,
                        right: 0,
                        top: -18,
                    }}
                >
                    Open in new window <FontAwesome name="external-link" />
                </a>
                <iframe
                    ref={this.iframeRef}
                    id={this.props.iframeId || ''}
                    className={this.props.className || ''}
                    style={{
                        width: '100%',
                        position: 'relative',
                        zIndex: 100,
                        height: this.props.height,
                        border: 'none',
                        marginTop: 5,
                    }}
                    src={this.props.url}
                    onLoad={this.onLoad}
                    allowFullScreen={true}
                ></iframe>
            </div>
        );
    }
}
