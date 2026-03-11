import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import FeatureTitle from '../../../shared/components/featureTitle/FeatureTitle';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { MakeMobxView } from '../../../shared/components/MobxView';
import { remoteData } from 'cbioportal-frontend-commons';
import HierarchicalResourcesTable from 'shared/components/resources/HierarchicalResourcesTable';
import { parseTsvToRows } from 'shared/lib/ResourceNodeTsvParser';
import { ResourceNodeRow } from 'shared/lib/ResourceNodeTypes';
import { STUDY_RESOURCE_TSV_MAP } from 'pages/studyView/resources/HierarchicalResourcesTab';

const RESOURCE_BASE_URL = '//localhost:3000/';

export const HIERARCHICAL_RESOURCES_TAB_NAME = 'Hierarchical Resources';

export interface IHierarchicalResourcesTabProps {
    store: PatientViewPageStore;
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
        await: () => [this.props.store.samples],
        invoke: async () => {
            const tsvFile = STUDY_RESOURCE_TSV_MAP[this.props.store.studyId];
            if (!tsvFile) return [];
            const response = await fetch(`${RESOURCE_BASE_URL}${tsvFile}`);
            if (!response.ok) return [];
            const text = await response.text();
            const allRows = parseTsvToRows(text);

            // Filter to only rows for this patient. For sample-mode pages,
            // also restrict to the specific sample(s) loaded for this patient.
            const patientId = this.props.store.patientId;
            const sampleIds = new Set(this.props.store.sampleIds);

            return allRows.filter(row => {
                if (row.patientId !== patientId) return false;
                // Patient-level resources (sampleId === patientId) always pass.
                if (row.sampleId === patientId) return true;
                // Sample-level resources: only include samples for this patient.
                return sampleIds.has(row.sampleId);
            });
        },
    });

    readonly content = MakeMobxView({
        await: () => [this.tsvData],
        render: () => (
            <HierarchicalResourcesTable
                data={this.tsvData.result!}
                studyId={this.props.store.studyId}
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
