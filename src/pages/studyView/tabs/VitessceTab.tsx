import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable, observable, action } from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { ResourceData } from 'cbioportal-ts-api-client';
import { Vitessce } from 'vitessce';

export interface IVitessceTabProps {
    store: StudyViewPageStore;
}

// Helper to find zarr resources from study resource data
export function getZarrResources(resourceData: ResourceData[]): ResourceData[] {
    return resourceData.filter(r => r.url?.toLowerCase().includes('.zarr'));
}

// Helper to check if zarr resources exist (used for tab visibility)
export function hasZarrResources(resourceData: ResourceData[]): boolean {
    return getZarrResources(resourceData).length > 0;
}

@observer
export class VitessceTab extends React.Component<IVitessceTabProps, {}> {
    @observable vitessceConfig: object | null = null;
    @observable configError: string | null = null;
    @observable isLoadingConfig: boolean = false;

    constructor(props: IVitessceTabProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        this.loadConfig();
    }

    componentDidUpdate(prevProps: IVitessceTabProps) {
        // Reload config if the zarr URL changes
        if (this.zarrResourceUrl !== this.getPreviousZarrUrl(prevProps)) {
            this.loadConfig();
        }
    }

    private getPreviousZarrUrl(
        prevProps: IVitessceTabProps
    ): string | undefined {
        if (prevProps.store.studyResourceData.isComplete) {
            const resources = getZarrResources(
                prevProps.store.studyResourceData.result
            );
            return resources[0]?.url;
        }
        return undefined;
    }

    @action
    async loadConfig() {
        const url = this.zarrResourceUrl;
        if (!url) {
            this.vitessceConfig = null;
            return;
        }

        this.isLoadingConfig = true;
        this.configError = null;

        try {
            // Assume the URL points to a Vitessce config JSON file
            // If it's a .zarr URL, you may need to construct a config instead
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch config: ${response.statusText}`
                );
            }
            const config = await response.json();
            this.setConfig(config);
        } catch (error) {
            this.setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to load Vitessce config'
            );
        }
    }

    @action
    setConfig(config: object) {
        this.vitessceConfig = config;
        this.isLoadingConfig = false;
    }

    @action
    setError(error: string) {
        this.configError = error;
        this.isLoadingConfig = false;
    }

    @computed get zarrResources(): ResourceData[] {
        if (this.props.store.studyResourceData.isComplete) {
            return getZarrResources(this.props.store.studyResourceData.result);
        }
        return [];
    }

    @computed get zarrResourceUrl(): string | undefined {
        // Return the first zarr resource URL
        return this.zarrResources[0]?.url;
    }

    @computed get selectedSampleCount(): number {
        return this.props.store.selectedSamples.result?.length ?? 0;
    }

    @computed get studyIds(): string[] {
        return this.props.store.studyIds;
    }

    render() {
        // Show loading indicator while resources are loading
        if (
            this.props.store.studyResourceData.isPending ||
            this.isLoadingConfig
        ) {
            return (
                <LoadingIndicator isLoading={true} size={'big'} center={true} />
            );
        }

        // Show error if config failed to load
        if (this.configError) {
            return (
                <div className="vitessce-tab" style={{ padding: 20 }}>
                    <div className="alert alert-danger">
                        <strong>Error loading Vitessce config:</strong>{' '}
                        {this.configError}
                    </div>
                    <p>
                        Zarr Resource URL: <code>{this.zarrResourceUrl}</code>
                    </p>
                </div>
            );
        }

        // Show message if no config available
        if (!this.vitessceConfig) {
            return (
                <div className="vitessce-tab" style={{ padding: 20 }}>
                    <div className="alert alert-warning">
                        No Vitessce configuration available.
                    </div>
                    <p>
                        Zarr Resource URL:{' '}
                        <code>{this.zarrResourceUrl ?? 'Not found'}</code>
                    </p>
                </div>
            );
        }

        return (
            <div className="vitessce-tab" style={{ padding: 20 }}>
                <div style={{ height: 'calc(100vh - 250px)', minHeight: 500 }}>
                    <Vitessce
                        config={this.vitessceConfig}
                        height={window.innerHeight - 250}
                        theme="light"
                    />
                </div>
            </div>
        );
    }
}
