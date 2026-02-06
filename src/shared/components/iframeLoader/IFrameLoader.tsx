import * as React from 'react';
import { ThreeBounce } from 'better-react-spinkit';
import LoadingIndicator from '../loadingIndicator/LoadingIndicator';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import FontAwesome from 'react-fontawesome';
interface FrameLoaderProps {
    url?: string;
    className?: string;
    iframeId?: string;
    name?: string;
    height?: number | string;
    width?: number | string;
}
@observer
export default class IFrameLoader extends React.Component<
    FrameLoaderProps,
    {}
> {
    public static defaultProps = {
        width: '',
    };

    @observable iframeLoaded = false;

    constructor(props: FrameLoaderProps) {
        super(props);
        makeObservable(this);
    }

    @autobind
    private onLoad() {
        this.iframeLoaded = true;
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
                    id={this.props.iframeId || ''}
                    className={this.props.className || ''}
                    name={this.props.name}
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
