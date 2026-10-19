import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import { ResourceDefinition } from 'cbioportal-ts-api-client';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { IResourceTableRow } from 'shared/lib/ResourceTableUtils';
import { getResourceConfig } from 'shared/lib/ResourceConfig';
import ResourceTree from './ResourceTree';
import ResourceViewer from './ResourceViewer';
import { ResourceViewerStore } from './ResourceViewerStore';

export interface IResourceBrowserProps {
    store: ResourceViewerStore;
    resourceDefinitions?: { [resourceId: string]: ResourceDefinition };
    emptyText?: string;
}

/**
 * Every resource of one patient on the left, the selected one framed on the right. The whole
 * list is one request, so moving between a slide and a scan costs nothing and the viewer never
 * leaves the screen.
 */
@observer
export default class ResourceBrowser extends React.Component<
    IResourceBrowserProps,
    {}
> {
    constructor(props: IResourceBrowserProps) {
        super(props);
        makeObservable(this);
    }

    @observable private selectedKey: string | undefined = undefined;

    @computed get rows(): IResourceTableRow[] {
        return this.props.store.rows.result || [];
    }

    /** First row until the user picks one, so the tab opens on a resource rather than blank. */
    @computed get index(): number {
        const index = this.rows.findIndex(row => row.key === this.selectedKey);
        return index === -1 ? 0 : index;
    }

    @computed get current(): IResourceTableRow | undefined {
        return this.rows[this.index];
    }

    @action.bound
    private onSelect(row: IResourceTableRow) {
        this.selectedKey = row.key;
    }

    @action.bound
    private onIndexChange(index: number) {
        const row = this.rows[index];
        if (row) {
            this.selectedKey = row.key;
        }
    }

    @computed get errorMessage(): string | undefined {
        const resourceId = this.current?.resourceId;
        const definition =
            resourceId && this.props.resourceDefinitions
                ? this.props.resourceDefinitions[resourceId]
                : undefined;
        return definition
            ? getResourceConfig(definition).iframeErrorMessage
            : undefined;
    }

    render() {
        const { store } = this.props;

        if (store.rows.isPending) {
            return (
                <LoadingIndicator isLoading={true} center={true} size="big" />
            );
        }

        if (store.rows.isError) {
            return (
                <div className="alert alert-danger">
                    Error loading resources.
                </div>
            );
        }

        const current = this.current;
        if (!current) {
            return (
                <div className="alert alert-info">
                    {this.props.emptyText || 'No resources available.'}
                </div>
            );
        }

        return (
            <div
                style={{ display: 'flex', alignItems: 'flex-start' }}
                data-test="ResourceBrowser"
            >
                <ResourceTree
                    rows={this.rows}
                    selectedKey={current.key}
                    onSelect={this.onSelect}
                />
                <div style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                    <ResourceViewer
                        rows={this.rows}
                        index={this.index}
                        onIndexChange={this.onIndexChange}
                        resourceDisplayName={current.resourceType}
                        resourceDescription={current.description || undefined}
                        iframeErrorMessage={this.errorMessage}
                    />
                </div>
            </div>
        );
    }
}
