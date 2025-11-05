import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, makeObservable, computed } from 'mobx';
import styles from './styles/styles.module.scss';
import classNames from 'classnames';
import { QueryStore } from './QueryStore';
import { CancerStudy } from 'cbioportal-ts-api-client';
import CancerTypeFilterSidebar from './CancerTypeFilterSidebar';
import { DataTypeFilterSidebar } from './DataTypeFilterSidebar';
import {
    getSampleCountsPerFilter,
    getStudyCountPerFilter,
} from 'shared/components/query/filteredSearch/StudySearchControls';

export interface IFilterPanelProps {
    store: QueryStore;
    toggleFilter: (id: string) => void;
}

export interface IFilterSection {
    id: string;
    title: string;
    expanded: boolean;
    content: JSX.Element;
    count?: number;
}

@observer
export default class FilterPanel extends React.Component<IFilterPanelProps, {}> {
    @observable expandedSections: { [key: string]: boolean } = {
        cancerType: true,
        dataType: true,
        consortia: true,
        publication: true,
    };

    constructor(props: IFilterPanelProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    toggleSection(sectionId: string) {
        this.expandedSections[sectionId] = !this.expandedSections[sectionId];
    }

    @computed get consortiaList(): string[] {
        if (!this.props.store.cancerStudies.isComplete) return [];
        const consortia = new Set<string>();
        this.props.store.cancerStudies.result.forEach(study => {
            if (study.groups && study.groups.trim()) {
                study.groups
                    .split(/[,;]/)
                    .map(g => g.trim())
                    .filter(g => g)
                    .forEach(g => consortia.add(g));
            }
        });
        return Array.from(consortia).sort();
    }

    @computed get publicationYears(): number[] {
        if (!this.props.store.cancerStudies.isComplete) return [];
        const years = new Set<number>();
        this.props.store.cancerStudies.result.forEach(study => {
            if (study.citation) {
                // Try to extract year from citation
                const yearMatch = study.citation.match(/\b(19|20)\d{2}\b/);
                if (yearMatch) {
                    years.add(parseInt(yearMatch[0]));
                }
            }
        });
        return Array.from(years).sort((a, b) => b - a);
    }

    @computed get publicationJournals(): string[] {
        if (!this.props.store.cancerStudies.isComplete) return [];
        const journals = new Set<string>();
        this.props.store.cancerStudies.result.forEach(study => {
            if (study.citation) {
                // Extract journal name (typically before year or period)
                // This is a simplified extraction
                const parts = study.citation.split('.');
                if (parts.length > 1) {
                    const journal = parts[0].trim();
                    if (journal && journal.length < 100) {
                        journals.add(journal);
                    }
                }
            }
        });
        return Array.from(journals).sort();
    }

    renderFilterSection(section: IFilterSection) {
        const isExpanded = this.expandedSections[section.id];
        return (
            <div key={section.id} className={styles.filterSection}>
                <div
                    className={styles.filterSectionHeader}
                    onClick={() => this.toggleSection(section.id)}
                >
                    <span className={styles.filterSectionTitle}>
                        {section.title}
                        {section.count !== undefined && (
                            <span className={styles.filterSectionCount}>
                                ({section.count})
                            </span>
                        )}
                    </span>
                    <i
                        className={classNames('fa', {
                            'fa-chevron-down': isExpanded,
                            'fa-chevron-right': !isExpanded,
                        })}
                    />
                </div>
                {isExpanded && (
                    <div className={styles.filterSectionContent}>
                        {section.content}
                    </div>
                )}
            </div>
        );
    }

    renderConsortiaFilter() {
        return (
            <div className={styles.filterList}>
                {this.consortiaList.map(consortium => {
                    const isSelected = this.props.store.selectedConsortia?.includes(
                        consortium
                    );
                    return (
                        <label key={consortium} className={styles.filterItem}>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                    this.props.store.toggleConsortium(consortium)
                                }
                            />
                            <span>{consortium}</span>
                        </label>
                    );
                })}
                {this.consortiaList.length === 0 && (
                    <div className={styles.noFilters}>No consortia available</div>
                )}
            </div>
        );
    }

    renderPublicationFilter() {
        return (
            <div>
                <div className={styles.filterSubsection}>
                    <div className={styles.filterSubsectionTitle}>Year</div>
                    <div className={styles.filterList}>
                        {this.publicationYears.slice(0, 10).map(year => {
                            const isSelected = this.props.store.selectedPublicationYears?.includes(
                                year
                            );
                            return (
                                <label key={year} className={styles.filterItem}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() =>
                                            this.props.store.togglePublicationYear(
                                                year
                                            )
                                        }
                                    />
                                    <span>{year}</span>
                                </label>
                            );
                        })}
                        {this.publicationYears.length === 0 && (
                            <div className={styles.noFilters}>
                                No publication years available
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.filterSubsection}>
                    <div className={styles.filterSubsectionTitle}>Journal</div>
                    <div className={styles.filterList}>
                        {this.publicationJournals.slice(0, 10).map(journal => {
                            const isSelected = this.props.store.selectedPublicationJournals?.includes(
                                journal
                            );
                            return (
                                <label
                                    key={journal}
                                    className={styles.filterItem}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() =>
                                            this.props.store.togglePublicationJournal(
                                                journal
                                            )
                                        }
                                    />
                                    <span title={journal}>
                                        {journal.length > 30
                                            ? journal.substring(0, 30) + '...'
                                            : journal}
                                    </span>
                                </label>
                            );
                        })}
                        {this.publicationJournals.length === 0 && (
                            <div className={styles.noFilters}>
                                No journals available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    @computed get showSamplesPerFilterType() {
        const shownStudies = this.props.store.studyListLogic.mainView.getSelectionReport()
            .shownStudies;
        const studyForCalculation =
            shownStudies.length < this.props.store.cancerStudies.result.length
                ? shownStudies
                : this.props.store.cancerStudies.result;
        const sampleCountsPerFilter = getSampleCountsPerFilter(
            this.props.store.studyFilterOptions,
            studyForCalculation
        );
        return sampleCountsPerFilter;
    }

    @computed get showStudiesPerFilterType() {
        const shownStudies = this.props.store.studyListLogic.mainView.getSelectionReport()
            .shownStudies;
        const studyForCalculation =
            shownStudies.length < this.props.store.cancerStudies.result.length
                ? shownStudies
                : this.props.store.cancerStudies.result;
        const studyCount = getStudyCountPerFilter(
            this.props.store.studyFilterOptions,
            studyForCalculation
        );
        return studyCount;
    }

    render() {
        // This will be populated with actual filter sections
        const sections: IFilterSection[] = [
            {
                id: 'cancerType',
                title: 'Cancer Type',
                expanded: this.expandedSections['cancerType'],
                content: (
                    <CancerTypeFilterSidebar store={this.props.store} />
                ),
            },
            {
                id: 'dataType',
                title: 'Data Type',
                expanded: this.expandedSections['dataType'],
                content: (
                    <DataTypeFilterSidebar
                        store={this.props.store}
                        dataFilterActive={this.props.store.studyFilterOptions}
                        toggleFilter={this.props.toggleFilter}
                        samplePerFilter={this.showSamplesPerFilterType}
                        studyPerFilter={this.showStudiesPerFilterType}
                    />
                ),
            },
            {
                id: 'consortia',
                title: 'Consortia',
                expanded: this.expandedSections['consortia'],
                content: this.renderConsortiaFilter(),
                count: this.consortiaList.length,
            },
            {
                id: 'publication',
                title: 'Publication',
                expanded: this.expandedSections['publication'],
                content: this.renderPublicationFilter(),
            },
        ];

        return (
            <div className={styles.filterPanel}>
                <div className={styles.filterPanelHeader}>
                    <h3>Filters</h3>
                </div>
                <div className={styles.filterPanelContent}>
                    {sections.map(section => this.renderFilterSection(section))}
                </div>
            </div>
        );
    }
}
