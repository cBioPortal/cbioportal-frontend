import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { computed } from 'mobx';
import styles from './styles.module.scss';
import {
    AndedPatientTreatmentFilters,
    AndedSampleTreatmentFilters,
    DataFilterValue,
    PatientTreatmentFilter,
    SampleTreatmentFilter,
} from 'cbioportal-ts-api-client';
import {
    ChartMeta,
    ChartType,
    DataType,
    geneFilterQueryToOql,
    getCNAColorByAlteration,
    getGenomicChartUniqueKey,
    getPatientIdentifiers,
    getSelectedGroupNames,
    getUniqueKeyFromMolecularProfileIds,
    intervalFiltersDisplayValue,
    StudyViewFilterWithSampleIdentifierFilters,
} from 'pages/studyView/StudyViewUtils';
import { PillTag } from '../../shared/components/PillTag/PillTag';
import { GroupLogic } from './filters/groupLogic/GroupLogic';
import classnames from 'classnames';
import { ChartTypeEnum, STUDY_VIEW_CONFIG } from './StudyViewConfig';
import {
    DEFAULT_NA_COLOR,
    MUT_COLOR_FUSION,
    MUT_COLOR_MISSENSE,
} from 'shared/lib/Colors';
import {
    caseCounts,
    getSampleIdentifiers,
    StudyViewComparisonGroup,
} from '../groupComparison/GroupComparisonUtils';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import {
    GeneFilterQuery,
    OredPatientTreatmentFilters,
    OredSampleTreatmentFilters,
} from 'cbioportal-ts-api-client/dist/generated/CBioPortalAPIInternal';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';

export interface IUserSelectionsProps {
    filter: StudyViewFilterWithSampleIdentifierFilters;
    customChartsFilter: { [key: string]: string[] };
    numberOfSelectedSamplesInCustomSelection: number;
    comparisonGroupSelection: StudyViewComparisonGroup[];
    attributesMetaSet: { [id: string]: ChartMeta & { chartType: ChartType } };
    updateClinicalDataFilterByValues: (
        uniqueKey: string,
        values: DataFilterValue[]
    ) => void;
    updateCustomChartFilter: (uniqueKey: string, values: string[]) => void;
    removeGeneFilter: (uniqueKey: string, oql: string) => void;
    updateGenomicDataIntervalFilter: (
        uniqueKey: string,
        values: DataFilterValue[]
    ) => void;
    removeCustomSelectionFilter: () => void;
    removeComparisonGroupSelectionFilter: () => void;
    clearAllFilters: () => void;
    clinicalAttributeIdToDataType: { [key: string]: string };
    onBookmarkClick: () => void;
    molecularProfileNameSet: { [key: string]: string };
    caseListNameSet: { [key: string]: string };
    removeGenomicProfileFilter: (value: string) => void;
    removeCaseListsFilter: (value: string) => void;
    removeSampleTreatmentsFilter: (
        andedIndex: number,
        oredIndex: number
    ) => void;
    removePatientTreatmentsFilter: (
        andedIndex: number,
        oredIndex: number
    ) => void;
}

@observer
export default class UserSelections extends React.Component<
    IUserSelectionsProps,
    {}
> {
    @computed
    get showFilters() {
        //return isFiltered(this.props.filter)
        return this.allComponents.length > 0;
    }

    @computed
    get allComponents() {
        let components = [] as JSX.Element[];

        // Show the filter for the custom selection
        if (this.props.numberOfSelectedSamplesInCustomSelection > 0) {
            components.push(
                <div className={styles.parentGroupLogic}>
                    <GroupLogic
                        components={[
                            <span className={styles.filterClinicalAttrName}>
                                Custom Selection
                            </span>,
                            <PillTag
                                content={`${
                                    this.props
                                        .numberOfSelectedSamplesInCustomSelection
                                } sample${
                                    this.props
                                        .numberOfSelectedSamplesInCustomSelection >
                                    1
                                        ? 's'
                                        : ''
                                }`}
                                backgroundColor={
                                    STUDY_VIEW_CONFIG.colors.theme
                                        .clinicalFilterContent
                                }
                                onDelete={() =>
                                    this.props.removeCustomSelectionFilter()
                                }
                            />,
                        ]}
                        operation={':'}
                        group={false}
                    />
                </div>
            );
        }

        // Show the filter for the comparison group selection
        if (this.props.comparisonGroupSelection.length > 0) {
            const numSamples = getSampleIdentifiers(
                this.props.comparisonGroupSelection
            ).length;
            const numPatients = getPatientIdentifiers(
                this.props.comparisonGroupSelection
            ).length;
            components.push(
                <div className={styles.parentGroupLogic}>
                    <GroupLogic
                        components={[
                            <span className={styles.filterClinicalAttrName}>
                                {getSelectedGroupNames(
                                    this.props.comparisonGroupSelection
                                )}
                            </span>,
                            <PillTag
                                content={caseCounts(numSamples, numPatients)}
                                backgroundColor={
                                    STUDY_VIEW_CONFIG.colors.theme
                                        .clinicalFilterContent
                                }
                                onDelete={() =>
                                    this.props.removeComparisonGroupSelectionFilter()
                                }
                            />,
                        ]}
                        operation={':'}
                        group={false}
                    />
                </div>
            );
        }

        _.reduce(
            this.props.filter.clinicalDataFilters || [],
            (acc, clinicalDataFilter) => {
                const chartMeta = this.props.attributesMetaSet[
                    clinicalDataFilter.attributeId
                ];
                if (chartMeta) {
                    const dataType = this.props.clinicalAttributeIdToDataType[
                        clinicalDataFilter.attributeId
                    ];
                    if (dataType === DataType.STRING) {
                        // Pie chart filter
                        acc.push(
                            <div className={styles.parentGroupLogic}>
                                <GroupLogic
                                    components={[
                                        <span
                                            className={
                                                styles.filterClinicalAttrName
                                            }
                                        >
                                            {chartMeta.displayName}
                                        </span>,
                                        <GroupLogic
                                            components={clinicalDataFilter.values.map(
                                                clinicalDataFilterValue => {
                                                    return (
                                                        <PillTag
                                                            content={
                                                                clinicalDataFilterValue.value
                                                            }
                                                            backgroundColor={
                                                                STUDY_VIEW_CONFIG
                                                                    .colors
                                                                    .theme
                                                                    .clinicalFilterContent
                                                            }
                                                            onDelete={() =>
                                                                this.props.updateClinicalDataFilterByValues(
                                                                    chartMeta.uniqueKey,
                                                                    _.remove(
                                                                        clinicalDataFilter.values,
                                                                        value =>
                                                                            value.value !==
                                                                            clinicalDataFilterValue.value
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    );
                                                }
                                            )}
                                            operation={'or'}
                                            group={false}
                                        />,
                                    ]}
                                    operation={':'}
                                    group={false}
                                />
                            </div>
                        );
                    } else {
                        // Bar chart filter
                        acc.push(
                            <div className={styles.parentGroupLogic}>
                                <GroupLogic
                                    components={[
                                        <span
                                            className={
                                                styles.filterClinicalAttrName
                                            }
                                        >
                                            {chartMeta.displayName}
                                        </span>,
                                        <PillTag
                                            content={intervalFiltersDisplayValue(
                                                clinicalDataFilter.values
                                            )}
                                            backgroundColor={
                                                STUDY_VIEW_CONFIG.colors.theme
                                                    .clinicalFilterContent
                                            }
                                            onDelete={() =>
                                                this.props.updateClinicalDataFilterByValues(
                                                    chartMeta.uniqueKey,
                                                    []
                                                )
                                            }
                                        />,
                                    ]}
                                    operation={':'}
                                    group={false}
                                />
                            </div>
                        );
                    }
                }
                return acc;
            },
            components
        );

        // Genomic Bar chart filters
        _.reduce(
            this.props.filter.genomicDataFilters || [],
            (acc, genomicDataIntervalFilter) => {
                const uniqueKey = getGenomicChartUniqueKey(
                    genomicDataIntervalFilter.hugoGeneSymbol,
                    genomicDataIntervalFilter.profileType
                );
                const chartMeta = this.props.attributesMetaSet[uniqueKey];
                if (chartMeta) {
                    acc.push(
                        <div className={styles.parentGroupLogic}>
                            <GroupLogic
                                components={[
                                    <span
                                        className={
                                            styles.filterClinicalAttrName
                                        }
                                    >
                                        {chartMeta.displayName}
                                    </span>,
                                    <PillTag
                                        content={intervalFiltersDisplayValue(
                                            genomicDataIntervalFilter.values
                                        )}
                                        backgroundColor={
                                            STUDY_VIEW_CONFIG.colors.theme
                                                .clinicalFilterContent
                                        }
                                        onDelete={() =>
                                            this.props.updateGenomicDataIntervalFilter(
                                                chartMeta.uniqueKey,
                                                []
                                            )
                                        }
                                    />,
                                ]}
                                operation={':'}
                                group={false}
                            />
                        </div>
                    );
                }
                return acc;
            },
            components
        );

        // All custom charts
        if (!_.isEmpty(this.props.customChartsFilter)) {
            _.reduce(
                this.props.customChartsFilter,
                (acc, content: string[], key: string) => {
                    const chartMeta = this.props.attributesMetaSet[key];
                    if (chartMeta) {
                        acc.push(
                            <div className={styles.parentGroupLogic}>
                                <GroupLogic
                                    components={[
                                        <span
                                            className={
                                                styles.filterClinicalAttrName
                                            }
                                        >
                                            {chartMeta.displayName}
                                        </span>,
                                        <GroupLogic
                                            components={content.map(label => {
                                                return (
                                                    <PillTag
                                                        content={label}
                                                        backgroundColor={
                                                            STUDY_VIEW_CONFIG
                                                                .colors.theme
                                                                .clinicalFilterContent
                                                        }
                                                        onDelete={() =>
                                                            this.props.updateCustomChartFilter(
                                                                chartMeta.uniqueKey,
                                                                _.remove(
                                                                    content,
                                                                    value =>
                                                                        value !==
                                                                        label
                                                                )
                                                            )
                                                        }
                                                    />
                                                );
                                            })}
                                            operation={'or'}
                                            group={false}
                                        />,
                                    ]}
                                    operation={':'}
                                    group={false}
                                />
                            </div>
                        );
                    }
                    return acc;
                },
                components
            );
        }

        _.reduce(
            this.props.filter.geneFilters || [],
            (acc, geneFilter) => {
                const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                    geneFilter.molecularProfileIds
                );
                const chartMeta = this.props.attributesMetaSet[uniqueKey];
                if (chartMeta) {
                    acc.push(
                        <div className={styles.parentGroupLogic}>
                            <GroupLogic
                                components={geneFilter.geneQueries.map(
                                    queries => {
                                        return (
                                            <GroupLogic
                                                components={this.groupedGeneQueries(
                                                    queries,
                                                    chartMeta
                                                )}
                                                operation="or"
                                                group={queries.length > 1}
                                            />
                                        );
                                    }
                                )}
                                operation={'and'}
                                group={false}
                            />
                        </div>
                    );
                }
                return acc;
            },
            components
        );

        if (!_.isEmpty(this.props.filter.genomicProfiles)) {
            components.push(
                <div className={styles.parentGroupLogic}>
                    <GroupLogic
                        components={this.props.filter.genomicProfiles.map(
                            genomicProfiles => {
                                return (
                                    <GroupLogic
                                        components={this.groupedGenomicProfiles(
                                            genomicProfiles
                                        )}
                                        operation="or"
                                        group={genomicProfiles.length > 1}
                                    />
                                );
                            }
                        )}
                        operation={'and'}
                        group={false}
                    />
                </div>
            );
        }

        if (!_.isEmpty(this.props.filter.caseLists)) {
            components.push(
                <div className={styles.parentGroupLogic}>
                    <GroupLogic
                        components={this.props.filter.caseLists.map(
                            caseLists => {
                                return (
                                    <GroupLogic
                                        components={this.groupedCaseLists(
                                            caseLists
                                        )}
                                        operation="or"
                                        group={caseLists.length > 1}
                                    />
                                );
                            }
                        )}
                        operation={'and'}
                        group={false}
                    />
                </div>
            );
        }

        if (
            this.props.filter.sampleTreatmentFilters &&
            this.props.filter.sampleTreatmentFilters.filters.length > 0
        ) {
            const f = this.renderTreatmentFilter(
                this.props.filter.sampleTreatmentFilters
            );
            components.push(f);
        }

        if (
            this.props.filter.patientTreatmentFilters &&
            this.props.filter.patientTreatmentFilters.filters.length > 0
        ) {
            const f = this.renderTreatmentFilter(
                this.props.filter.patientTreatmentFilters
            );
            components.push(f);
        }
        return components;
    }

    private renderTreatmentFilter(
        f: AndedPatientTreatmentFilters | AndedSampleTreatmentFilters
    ): JSX.Element {
        type OuterFilter =
            | OredPatientTreatmentFilters
            | OredSampleTreatmentFilters;
        type InnerFilter = PatientTreatmentFilter | SampleTreatmentFilter;

        // the gross "as any" casting shouldn't be necessary for a type of
        // OredSampleTreatmentFilters[] | OredPatientTreatmentFilters[],
        // but the compiler complains if I remove it
        const filters = (f.filters as any).map(
            (oFilter: OuterFilter, oIndex: number) => {
                const pills = (oFilter.filters as any).map(
                    (iFilter: InnerFilter, iIndex: number) => {
                        const filterInfo = this.getFilterStringAndRemoveFunc(
                            iFilter
                        );

                        return (
                            <PillTag
                                content={
                                    iFilter.treatment + ' ' + filterInfo.str
                                }
                                backgroundColor={
                                    STUDY_VIEW_CONFIG.colors.theme
                                        .clinicalFilterContent
                                }
                                onDelete={() => {
                                    filterInfo.func(oIndex, iIndex);
                                }}
                            />
                        );
                    }
                );

                return (
                    <GroupLogic
                        components={pills}
                        operation={'or'}
                        group={true}
                    />
                );
            }
        );

        return (
            <GroupLogic components={filters} operation={'and'} group={false} />
        );
    }

    private getFilterStringAndRemoveFunc(
        filter: PatientTreatmentFilter | SampleTreatmentFilter
    ): { str: string; func: (o: number, i: number) => void } {
        if (filter.hasOwnProperty('time')) {
            return {
                str: (filter as SampleTreatmentFilter).time,
                func: this.props.removeSampleTreatmentsFilter,
            };
        } else {
            return {
                str: '',
                func: this.props.removePatientTreatmentsFilter,
            };
        }
    }

    private groupedGeneQueries(
        geneQueries: GeneFilterQuery[],
        chartMeta: ChartMeta & { chartType: ChartType }
    ): JSX.Element[] {
        return geneQueries.map(geneQuery => {
            let color = DEFAULT_NA_COLOR;
            let displayGeneSymbol = geneQuery.hugoGeneSymbol;
            switch (chartMeta.chartType) {
                case ChartTypeEnum.MUTATED_GENES_TABLE:
                    color = MUT_COLOR_MISSENSE;
                    break;
                case ChartTypeEnum.FUSION_GENES_TABLE:
                    color = MUT_COLOR_FUSION;
                    break;
                case ChartTypeEnum.CNA_GENES_TABLE: {
                    if (geneQuery.alterations.length === 1) {
                        let tagColor = getCNAColorByAlteration(
                            geneQuery.alterations[0]
                        );
                        if (tagColor) {
                            color = tagColor;
                        }
                    }
                    break;
                }
            }
            return (
                <PillTag
                    content={displayGeneSymbol}
                    backgroundColor={color}
                    infoSection={this.groupedGeneFilterIcons(
                        geneQuery.excludeVUS,
                        geneQuery.selectedTiers,
                        geneQuery.excludeGermline
                    )}
                    onDelete={() =>
                        this.props.removeGeneFilter(
                            chartMeta.uniqueKey,
                            geneFilterQueryToOql(geneQuery)
                        )
                    }
                />
            );
        });
    }

    private groupedGenomicProfiles(genomicProfiles: string[]): JSX.Element[] {
        return genomicProfiles.map(profile => {
            return (
                <PillTag
                    content={
                        this.props.molecularProfileNameSet[profile] || profile
                    }
                    backgroundColor={
                        STUDY_VIEW_CONFIG.colors.theme.clinicalFilterContent
                    }
                    onDelete={() =>
                        this.props.removeGenomicProfileFilter(profile)
                    }
                />
            );
        });
    }

    private groupedGeneFilterIcons(
        excludeVUS?: boolean,
        selectedTiers?: string[],
        excludeGermline?: boolean
    ): JSX.Element {
        const filterTextElements: string[] = [];
        if (excludeVUS) {
            filterTextElements.push('Variants of unknown significance');
        }
        if (excludeGermline) {
            filterTextElements.push('Germline mutations');
        }
        return (
            <div
                data-test={'groupedGeneFilterIcons'}
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '5px 8px 5px -3px',
                }}
            >
                {(excludeVUS || excludeGermline) && (
                    <DefaultTooltip
                        mouseEnterDelay={0}
                        placement="right"
                        overlay={
                            <div className={styles.tooltip}>
                                Excluded:
                                {filterTextElements.map(t => (
                                    <span>
                                        <br />
                                        {t}
                                    </span>
                                ))}
                            </div>
                        }
                    >
                        <img
                            height={11}
                            width={11}
                            style={{
                                marginRight: '2px',
                            }}
                            src={require('../../rootImages/filter_icon_white_circle.svg')}
                            alt="Selected driver tiers"
                        />
                    </DefaultTooltip>
                )}
                {selectedTiers && selectedTiers.length > 0 && (
                    <DefaultTooltip
                        mouseEnterDelay={0}
                        placement="right"
                        overlay={
                            <div className={styles.tooltip}>
                                Selected driver tiers:
                                {selectedTiers!.map(t => (
                                    <span>
                                        <br />
                                        {t}
                                    </span>
                                ))}
                            </div>
                        }
                    >
                        <img
                            height={11}
                            width={11}
                            src={require('../../rootImages/driver_tiers_white_circle.svg')}
                            alt="Selected driver tiers"
                        />
                    </DefaultTooltip>
                )}
            </div>
        );
    }

    private groupedCaseLists(caseLists: string[]): JSX.Element[] {
        return caseLists.map(caseList => {
            return (
                <PillTag
                    content={this.props.caseListNameSet[caseList] || caseList}
                    backgroundColor={
                        STUDY_VIEW_CONFIG.colors.theme.clinicalFilterContent
                    }
                    onDelete={() => this.props.removeCaseListsFilter(caseList)}
                />
            );
        });
    }

    render() {
        if (this.showFilters) {
            return (
                <div
                    className={classnames(
                        styles.userSelections,
                        'userSelections'
                    )}
                >
                    {this.allComponents}
                    <button
                        data-test="clear-all-filters"
                        className={classnames(
                            'btn btn-default btn-sm',
                            styles.summaryClearAllBtn
                        )}
                        onClick={this.props.clearAllFilters}
                    >
                        Clear All Filters
                    </button>

                    <DefaultTooltip
                        placement={'topLeft'}
                        overlay={<div>Get bookmark link for this filter</div>}
                    >
                        <a
                            onClick={this.props.onBookmarkClick}
                            className={styles.bookmarkButton}
                        >
                            <span className="fa-stack fa-4x">
                                <i className="fa fa-circle fa-stack-2x"></i>
                                <i className="fa fa-link fa-stack-1x"></i>
                            </span>
                        </a>
                    </DefaultTooltip>
                </div>
            );
        } else {
            return null;
        }
    }
}
