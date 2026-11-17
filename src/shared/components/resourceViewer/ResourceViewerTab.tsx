import * as React from 'react';
import { observer } from 'mobx-react';
import { action, makeObservable, observable } from 'mobx';
import ResourceViewer from 'shared/components/resourceViewer/ResourceViewer';
import { ResourceViewerStore } from 'shared/components/resourceViewer/ResourceViewerStore';

export interface IResourceViewerTabProps {
    store: ResourceViewerStore;
    resourceDisplayName: string;
    iframeErrorMessage?: string;
    hideHeader?: boolean;
    fillWindowHeight?: boolean;
    /** Whether this viewer's tab is the one in view. */
    isActive: boolean;
    /** The item the URL names; it belongs to this viewer only while this tab is in view. */
    urlItem?: string;
    /** Names an item in the URL; replace writes it without adding a history entry. */
    onSelect: (url: string, replace?: boolean) => void;
}

/**
 * One resource's viewer as a page tab. It stays mounted while another tab is in view, so
 * it remembers the item it last showed: the URL names an item only for the tab in view, and
 * without this a hidden viewer would fall back to its first item and its frame would reload.
 *
 * Rows are read here rather than by the page, so a resource's items are fetched when its tab is
 * first opened instead of for every resource on load.
 */
@observer
export default class ResourceViewerTab extends React.Component<
    IResourceViewerTabProps,
    {}
> {
    constructor(props: IResourceViewerTabProps) {
        super(props);
        makeObservable(this);
    }

    @observable private lastShownUrl: string | undefined = undefined;

    private get rows() {
        return this.props.store.rows.result || [];
    }

    /** The URL's item, when this tab is in view and the item is one of this resource's rows. */
    private get urlRowUrl(): string | undefined {
        if (!this.props.isActive || !this.props.urlItem) {
            return undefined;
        }
        return this.rows.some(row => row.url === this.props.urlItem)
            ? this.props.urlItem
            : undefined;
    }

    componentDidMount() {
        this.rememberUrlItem();
    }

    componentDidUpdate(prevProps: IResourceViewerTabProps) {
        this.syncWithUrl(prevProps);
        this.rememberUrlItem();
    }

    // While this tab is in view the URL decides the item. Coming into view, the URL may name
    // another viewer's item or none, so this viewer's item is written back. In view, a URL change
    // that names none of its items is Back or Forward, so the viewer returns to its first item.
    @action
    private syncWithUrl(prevProps: IResourceViewerTabProps) {
        if (!this.props.isActive || this.urlRowUrl) {
            return;
        }
        if (!prevProps.isActive) {
            if (this.lastShownUrl) {
                this.props.onSelect(this.lastShownUrl, true);
            }
        } else if (prevProps.urlItem !== this.props.urlItem) {
            this.lastShownUrl = undefined;
        }
    }

    // Covers every way the URL can name an item: a shared link, the remount between patient and
    // sample mode, and Back or Forward.
    @action
    private rememberUrlItem() {
        const url = this.urlRowUrl;
        if (url && url !== this.lastShownUrl) {
            this.lastShownUrl = url;
        }
    }

    @action.bound
    private onIndexChange(index: number) {
        const row = this.rows[index];
        if (row) {
            this.lastShownUrl = row.url;
            this.props.onSelect(row.url);
        }
    }

    render() {
        const rows = this.rows;
        const shown = this.urlRowUrl || this.lastShownUrl;
        const index = Math.max(
            rows.findIndex(row => row.url === shown),
            0
        );

        return (
            <ResourceViewer
                rows={rows}
                index={index}
                onIndexChange={this.onIndexChange}
                resourceDisplayName={this.props.resourceDisplayName}
                iframeErrorMessage={this.props.iframeErrorMessage}
                hideHeader={this.props.hideHeader}
                fillWindowHeight={this.props.fillWindowHeight}
            />
        );
    }
}
