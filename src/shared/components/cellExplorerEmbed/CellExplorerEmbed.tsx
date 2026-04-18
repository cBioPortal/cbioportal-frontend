import * as React from 'react';

declare global {
    interface Window {
        CellExplorerEmbed?: {
            mount: (
                el: HTMLElement,
                config: CellExplorerEmbedConfig
            ) => CellExplorerEmbedHandle;
        };
    }
}

export interface CellExplorerEmbedConfig {
    url: string;
    filterConfig?: any;
}

interface CellExplorerEmbedHandle {
    update: (config: CellExplorerEmbedConfig) => void;
    unmount: () => void;
}

interface CellExplorerEmbedProps {
    url: string;
    filterConfig?: any;
    height?: number | string;
    width?: number | string;
    scriptSrc?: string;
    cssSrc?: string;
}

const DEFAULT_SCRIPT_SRC = '/reactapp/cell-explorer/embed.js';
const DEFAULT_CSS_SRC = '/reactapp/cell-explorer/app.css';

let scriptLoadPromise: Promise<void> | null = null;

function ensureAssetsLoaded(scriptSrc: string, cssSrc: string): Promise<void> {
    if (window.CellExplorerEmbed) {
        return Promise.resolve();
    }
    if (scriptLoadPromise) {
        return scriptLoadPromise;
    }

    if (!document.querySelector(`link[data-cce-css="1"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssSrc;
        link.setAttribute('data-cce-css', '1');
        document.head.appendChild(link);
    }

    scriptLoadPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(
            `script[data-cce-script="1"]`
        ) as HTMLScriptElement | null;
        const script = existing || document.createElement('script');
        if (!existing) {
            script.src = scriptSrc;
            script.async = true;
            script.setAttribute('data-cce-script', '1');
            document.head.appendChild(script);
        }
        script.addEventListener('load', () => resolve());
        script.addEventListener('error', () =>
            reject(
                new Error(
                    `Failed to load Cell Explorer embed from ${scriptSrc}`
                )
            )
        );
    });
    return scriptLoadPromise;
}

export default class CellExplorerEmbed extends React.Component<
    CellExplorerEmbedProps,
    { error?: string }
> {
    private containerRef = React.createRef<HTMLDivElement>();
    private handle: CellExplorerEmbedHandle | null = null;

    state: { error?: string } = {};

    async componentDidMount() {
        const scriptSrc = this.props.scriptSrc || DEFAULT_SCRIPT_SRC;
        const cssSrc = this.props.cssSrc || DEFAULT_CSS_SRC;
        try {
            await ensureAssetsLoaded(scriptSrc, cssSrc);
            if (!this.containerRef.current || !window.CellExplorerEmbed) return;
            this.handle = window.CellExplorerEmbed.mount(
                this.containerRef.current,
                {
                    url: this.props.url,
                    filterConfig: this.props.filterConfig,
                }
            );
        } catch (e) {
            this.setState({ error: e.message || String(e) });
        }
    }

    componentDidUpdate(prev: CellExplorerEmbedProps) {
        if (!this.handle) return;
        if (
            prev.url !== this.props.url ||
            prev.filterConfig !== this.props.filterConfig
        ) {
            this.handle.update({
                url: this.props.url,
                filterConfig: this.props.filterConfig,
            });
        }
    }

    componentWillUnmount() {
        if (this.handle) {
            this.handle.unmount();
            this.handle = null;
        }
    }

    render() {
        const { height, width } = this.props;
        if (this.state.error) {
            return (
                <div style={{ padding: 16, color: '#a00' }}>
                    Cell Explorer failed to load: {this.state.error}
                </div>
            );
        }
        return (
            <div
                ref={this.containerRef}
                style={{
                    height: height ?? '100vh',
                    width: width ?? '100%',
                }}
            />
        );
    }
}
