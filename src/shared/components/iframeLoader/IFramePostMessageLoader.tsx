import * as React from 'react';
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

    @autobind
    private onLoad() {
        console.log('[cBioPortal] iframe loaded:', this.props.url);
        this.iframeLoaded = true;

        if (this.props.postMessageData) {
            console.log(
                '[cBioPortal] postMessage data to send:',
                this.props.postMessageData
            );

            if (this.iframeRef.current?.contentWindow) {
                const origin =
                    this.props.postMessageOrigin ||
                    new URL(this.props.url).origin;
                // Delay to allow the iframe's React app to fully mount
                // and register its message listeners after the HTML document loads
                console.log(
                    '[cBioPortal] waiting for iframe app to initialize...'
                );
                setTimeout(() => {
                    console.log(
                        '[cBioPortal] sending postMessage to origin:',
                        origin
                    );
                    this.iframeRef.current?.contentWindow?.postMessage(
                        this.props.postMessageData,
                        origin
                    );
                    console.log('[cBioPortal] postMessage sent successfully');
                }, 500);
            } else {
                console.warn(
                    '[cBioPortal] iframe contentWindow not available, cannot send postMessage'
                );
            }
        } else {
            console.log('[cBioPortal] no postMessageData provided, skipping');
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
