import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { computed } from 'mobx';
import styles from './styles.module.scss';
import { ClinicalDataFilterValue } from 'shared/api/generated/CBioPortalAPIInternal';
import {
    UniqueKey,
    DataType,
    getUniqueKeyFromMolecularProfileIds,
    ChartType,
} from 'pages/studyView/StudyViewUtils';
import {
    ChartMeta,
    getCNAColorByAlteration,
    getPatientIdentifiers,
    getSelectedGroupNames,
    intervalFiltersDisplayValue,
    StudyViewFilterWithSampleIdentifierFilters,
} from 'pages/studyView/StudyViewUtils';
import { PillTag } from '../../shared/components/PillTag/PillTag';
import { GroupLogic } from './filters/groupLogic/GroupLogic';
import classnames from 'classnames';
import { STUDY_VIEW_CONFIG, ChartTypeEnum } from './StudyViewConfig';
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

export interface IUserSelectionsProps {
    filter: StudyViewFilterWithSampleIdentifierFilters;
    customChartsFilter: { [key: string]: string[] };
    numberOfSelectedSamplesInCustomSelection: number;
    comparisonGroupSelection: StudyViewComparisonGroup[];
    attributesMetaSet: { [id: string]: ChartMeta & { chartType: ChartType } };
    updateClinicalDataFilterByValues: (
        uniqueKey: string,
        values: ClinicalDataFilterValue[]
    ) => void;
    updateCustomChartFilter: (uniqueKey: string, values: string[]) => void;
    removeGeneFilter: (uniqueKey: string, oql: string) => void;
    removeCustomSelectionFilter: () => void;
    removeComparisonGroupSelectionFilter: () => void;
    clearAllFilters: () => void;
    clinicalAttributeIdToDataType: { [key: string]: string };
    onBookmarkClick: () => void;
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
                                    geneQuery => {
                                        return (
                                            <GroupLogic
                                                components={geneQuery.map(
                                                    oql => {
                                                        let color = DEFAULT_NA_COLOR;
                                                        let displayGeneSymbol = oql;
                                                        switch (
                                                            chartMeta.chartType
                                                        ) {
                                                            case ChartTypeEnum.MUTATED_GENES_TABLE:
                                                                color = MUT_COLOR_MISSENSE;
                                                                break;
                                                            case ChartTypeEnum.FUSION_GENES_TABLE:
                                                                color = MUT_COLOR_FUSION;
                                                                break;
                                                            case ChartTypeEnum.CNA_GENES_TABLE: {
                                                                const oqlParts = oql
                                                                    .trim()
                                                                    .split(':');
                                                                if (
                                                                    oqlParts.length ===
                                                                    2
                                                                ) {
                                                                    displayGeneSymbol =
                                                                        oqlParts[0];
                                                                    let tagColor = getCNAColorByAlteration(
                                                                        oqlParts[1]
                                                                    );
                                                                    if (
                                                                        tagColor
                                                                    ) {
                                                                        color = tagColor;
                                                                    }
                                                                }
                                                                break;
                                                            }
                                                        }
                                                        return (
                                                            <PillTag
                                                                content={
                                                                    displayGeneSymbol
                                                                }
                                                                backgroundColor={
                                                                    color
                                                                }
                                                                onDelete={() =>
                                                                    this.props.removeGeneFilter(
                                                                        chartMeta.uniqueKey,
                                                                        oql
                                                                    )
                                                                }
                                                            />
                                                        );
                                                    }
                                                )}
                                                operation="or"
                                                group={geneQuery.length > 1}
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

        return components;
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
                            styles.summaryHeaderBtn,
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
