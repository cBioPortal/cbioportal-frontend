import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import { MakeMobxView } from '../../../shared/components/MobxView';
import FeatureTitle from '../../../shared/components/featureTitle/FeatureTitle';
import { StudyViewPageStore } from '../StudyViewPageStore';
import { remoteData } from 'cbioportal-frontend-commons';
import HierarchicalResourcesTable from 'shared/components/resources/HierarchicalResourcesTable';
import { parseTsvToRows } from 'shared/lib/ResourceNodeTsvParser';
import { ResourceNodeRow } from 'shared/lib/ResourceNodeTypes';

const RESOURCE_BASE_URL = '//localhost:3000/';

/** Maps study IDs to their resource TSV filenames served by the dev server. */
export const STUDY_RESOURCE_TSV_MAP: Record<string, string> = {
    coad_msk_2025: 'data_resource_image.txt',
    blca_tcga_pan_can_atlas_2018: 'tcga_imaging_resources_mock_data.txt',
};

export const HIERARCHICAL_RESOURCES_TAB_NAME = 'Hierarchical Resources';

export interface IHierarchicalResourcesTabProps {
    store: StudyViewPageStore;
}

@observer
export default class HierarchicalResourcesTab extends React.Component<
    IHierarchicalResourcesTabProps,
    {}
> {
    @observable private searchTerm: string = '';

    constructor(props: IHierarchicalResourcesTabProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private handleSearchChange(e: React.FormEvent<HTMLInputElement>) {
        this.searchTerm = e.currentTarget.value;
    }

    @action.bound
    private clearSearch() {
        this.searchTerm = '';
    }

    @computed get isFiltering() {
        return this.searchTerm.trim().length > 0;
    }

    readonly tsvData = remoteData<ResourceNodeRow[]>({
        await: () => [
            this.props.store.selectedSamples,
            this.props.store.queriedPhysicalStudyIds,
        ],
        onError: () => {},
        invoke: async () => {
            const studyId = this.props.store.queriedPhysicalStudyIds.result![0];
            const tsvFile = STUDY_RESOURCE_TSV_MAP[studyId];
            if (!tsvFile) return [];

            const selectedSamples = this.props.store.selectedSamples.result!;
            // Include both sample IDs and patient IDs so that patient-level
            // resources (where sampleId === patientId) are not filtered out.
            const allowedIds = new Set([
                ...selectedSamples.map(s => s.sampleId),
                ...selectedSamples.map(s => s.patientId),
            ]);

            const response = await fetch(`${RESOURCE_BASE_URL}${tsvFile}`);
            if (!response.ok) return [];
            const text = await response.text();
            const allRows = parseTsvToRows(text);
            return allRows.filter(row => allowedIds.has(row.sampleId));
        },
    });

    /**
     * Further filters tsvData rows to only those matching active resource
     * metadata filters from the study view summary charts (e.g. "47 resources
     * with 4 samples"). Each active filter restricts which items are shown.
     */
    @computed get filteredRows(): ResourceNodeRow[] {
        if (!this.tsvData.result) return [];
        const filterSummary = this.props.store.resourceMetadataFilterSummary;
        if (filterSummary.length === 0) return this.tsvData.result;

        return this.tsvData.result.filter(row =>
            // Row must pass every active metadata filter (AND logic across filters)
            filterSummary.every(filter => {
                const { values } = filter;
                if (values.length === 0) return true;
                // displayName is the raw metadata key (e.g. "scanner_id")
                const metadataKey = filter.displayName;
                const rowValue = row.metadata?.[metadataKey];
                if (rowValue === undefined || rowValue === null) return false;
                return values.includes(String(rowValue));
            })
        );
    }

    @computed get studyId(): string {
        return this.props.store.queriedPhysicalStudyIds.result?.[0] ?? '';
    }

    readonly content = MakeMobxView({
        await: () => [this.tsvData],
        render: () => (
            <HierarchicalResourcesTable
                data={this.filteredRows}
                studyId={this.studyId}
                searchTerm={this.searchTerm}
            />
        ),
    });

    render() {
        const isFiltering = this.isFiltering;
        return (
            <div className="resourcesTab">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                    }}
                >
                    <FeatureTitle
                        title={HIERARCHICAL_RESOURCES_TAB_NAME}
                        isLoading={this.tsvData.isPending}
                        className={'pull-left'}
                        style={{ margin: 0 }}
                    />
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <div
                            className="form-group has-feedback input-group-sm tableFilter"
                            style={{ position: 'relative', margin: 0 }}
                        >
                            <input
                                type="text"
                                value={this.searchTerm}
                                onInput={this.handleSearchChange}
                                placeholder="Search resources..."
                                className="form-control tableSearchInput"
                                style={{ width: 200 }}
                                data-test="hierarchical-resources-search-input"
                                aria-label="Resources Table Search Input"
                            />
                            {isFiltering ? (
                                <span
                                    style={{
                                        fontSize: 18,
                                        cursor: 'pointer',
                                        color: 'rgb(153,153,153)',
                                        position: 'absolute',
                                        right: 9,
                                        top: 2,
                                        zIndex: 10,
                                        lineHeight: '30px',
                                    }}
                                    onClick={this.clearSearch}
                                >
                                    ×
                                </span>
                            ) : (
                                <span
                                    className="fa fa-search form-control-feedback"
                                    aria-hidden="true"
                                    style={{
                                        zIndex: 0,
                                        width: 30,
                                        height: 30,
                                        lineHeight: '30px',
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div>{this.content.component}</div>
            </div>
        );
    }
}
