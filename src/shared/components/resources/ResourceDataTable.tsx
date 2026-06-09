import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import ResourceDataTableContent, {
    IResourceDataTableProps,
} from './ResourceDataTableContent';
import {
    buildResourceTableRows,
    buildResourceTableTabs,
} from 'shared/lib/ResourceTableUtils';

@observer
export default class ResourceDataTable extends React.Component<
    IResourceDataTableProps,
    {}
> {
    public static defaultProps = {
        showResourceTabs: true,
    };

    @observable private activeTabId = '';

    constructor(props: IResourceDataTableProps) {
        super(props);
        makeObservable(this);
    }

    @computed get rows() {
        return buildResourceTableRows(
            this.props.resources,
            this.props.patientIdFallback
        );
    }

    @computed get tabs() {
        return buildResourceTableTabs(this.rows);
    }

    @computed get selectedResourceId() {
        if (this.props.selectedResourceId) {
            return this.props.selectedResourceId;
        }

        return this.selectedTab?.id;
    }

    @computed get selectedTab() {
        if (this.tabs.length === 0) {
            return undefined;
        }

        return (
            this.tabs.find(tab => tab.id === this.activeTabId) || this.tabs[0]
        );
    }

    @computed get activeResources() {
        if (!this.selectedResourceId) {
            return this.props.resources;
        }

        return this.props.resources.filter(
            resource => resource.resourceId === this.selectedResourceId
        );
    }

    @action.bound
    private setActiveTab(tabId: string) {
        this.activeTabId = tabId;
    }

    render() {
        return (
            <ResourceDataTableContent
                key={this.selectedResourceId || 'all-resources'}
                {...this.props}
                resources={this.activeResources}
                tabs={this.props.showResourceTabs ? this.tabs : []}
                activeTabId={this.props.showResourceTabs ? this.selectedTab?.id : undefined}
                onTabClick={this.setActiveTab}
            />
        );
    }
}
