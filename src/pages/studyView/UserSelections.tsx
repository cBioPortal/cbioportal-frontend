import * as React from 'react';
import * as _ from 'lodash';
import { observer } from "mobx-react";
import { computed } from 'mobx';
import styles from "./styles.module.scss";
import {ClinicalDataIntervalFilterValue, StudyViewFilter} from 'shared/api/generated/CBioPortalAPIInternal';
import { ChartMeta, UniqueKey, StudyViewFilterWithSampleIdentifierFilters} from 'pages/studyView/StudyViewPageStore';
import {intervalFiltersDisplayValue, isFiltered} from 'pages/studyView/StudyViewUtils';
import autobind from 'autobind-decorator';

export interface IUserSelectionsProps {
    filter: StudyViewFilterWithSampleIdentifierFilters;
    attributesMetaSet: { [id: string]: ChartMeta };
    updateClinicalDataEqualityFilter: (chartMeta: ChartMeta, value: string[]) => void;
    updateClinicalDataIntervalFilter: (chartMeta: ChartMeta, values: ClinicalDataIntervalFilterValue[]) => void;
    clearGeneFilter: () => void;
    clearCNAGeneFilter: () => void;
    clearChartSampleIdentifierFilter: (chartMeta: ChartMeta) => void;
    clearAllFilters: () => void
}


@observer
export default class UserSelections extends React.Component<IUserSelectionsProps, {}> {

    constructor(props: IUserSelectionsProps) {
        super(props);
    }

    @computed get showFilters() {
        return isFiltered(this.props.filter)
    }

    @computed private get clinicalDataEqualityFilters() {
        return _.reduce((this.props.filter.clinicalDataEqualityFilters || []), (acc,clinicalDataEqualityFilter) => {
            let chartMeta = this.props.attributesMetaSet[clinicalDataEqualityFilter.clinicalDataType + '_' + clinicalDataEqualityFilter.attributeId];
            if (chartMeta) {
                let labelValueSet = _.keyBy(clinicalDataEqualityFilter.values);
                acc.push(<ChartFilter
                    chartMeta={chartMeta}
                    labelValueSet={labelValueSet}
                    updateFilter={this.props.updateClinicalDataEqualityFilter}
                />);
            }
            return acc;
        },[] as JSX.Element[])
    }

    @computed private get clinicalDataIntervalFilters() {
        return _.map((this.props.filter.clinicalDataIntervalFilters || []), clinicalDataIntervalFilter => {
            const chartMeta = this.props.attributesMetaSet[clinicalDataIntervalFilter.clinicalDataType + '_' + clinicalDataIntervalFilter.attributeId];
            if (chartMeta) {
                return (
                    <ClinicalDataIntervalFilter
                        chartMeta={chartMeta}
                        values={clinicalDataIntervalFilter.values}
                        updateClinicalDataIntervalFilter={this.props.updateClinicalDataIntervalFilter}
                    />
                );
            } else {
                return null;
            }
        });
    }

    @computed private get mutatedGeneFilter() {
        let chartMeta = this.props.attributesMetaSet[UniqueKey.MUTATED_GENES_TABLE];
        if (chartMeta && !_.isEmpty(this.props.filter.mutatedGenes)) {
            return (
                <ChartFilter
                    chartMeta={chartMeta}
                    clearFilter={this.props.clearGeneFilter}
                />)
        }
        return null;
    }

    @computed private get cnaGeneFilter() {
        let chartMeta = this.props.attributesMetaSet[UniqueKey.CNA_GENES_TABLE];
        if (chartMeta && !_.isEmpty(this.props.filter.cnaGenes)) {
            return (
                <ChartFilter
                    chartMeta={chartMeta}
                    clearFilter={this.props.clearCNAGeneFilter}
                />)
        }
        return null;
    }

    @computed private get sampleIdentifiersFilters() {
        return _.reduce(this.props.filter.sampleIdentifiersSet, (acc, sampleIdentifiers, chartUniqKey) => {
            let chartMeta = this.props.attributesMetaSet[chartUniqKey];
            if (chartMeta) {
                acc.push(<ChartFilter
                    chartMeta={chartMeta}
                    clearFilter={this.props.clearChartSampleIdentifierFilter}
                />)
            }
            return acc;
        },[] as JSX.Element[])
    }

    render() {
        if (this.showFilters) {
            return (
                <div className={styles.userSelections}>
                    <span>Your selection:</span>
                    <div>
                        {this.clinicalDataEqualityFilters}
                        {this.clinicalDataIntervalFilters}
                        {this.cnaGeneFilter}
                        {this.mutatedGeneFilter}
                        {this.sampleIdentifiersFilters}
                        <span><button className="btn btn-default btn-xs" onClick={this.props.clearAllFilters}>Clear All</button></span>
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }
}


export interface IChartFilterProps {
    chartMeta: ChartMeta;
    labelValueSet?: { [id: string]: any };
    updateFilter?: (chartMeta: ChartMeta, value: any[]) => void;
    clearFilter?: (chartMeta: ChartMeta) => void; // could be used if we want to remove all filters for that particular chart
}

@observer
class ChartFilter extends React.Component<IChartFilterProps, {}> {

    @autobind
    private updateFilter(displayLabel: string) {
        if (this.props.updateFilter) {
            let filteredValues = _.filter(this.props.labelValueSet || {}, (_value, _displayLabel) => _displayLabel !== displayLabel);
            this.props.updateFilter(this.props.chartMeta, filteredValues);
        }
    }

    @autobind
    private clearFilter() {
        if (this.props.clearFilter) {
            this.props.clearFilter(this.props.chartMeta)
        }
    }

    render() {
        return (
            <span className={styles.filter}>
                <span className={styles.name}>{this.props.chartMeta.displayName}</span>
                {this.props.labelValueSet && _.map(this.props.labelValueSet, (value, displayLabel) => {
                    return (
                        <UnitFilter
                            value={value}
                            displayLabel={displayLabel}
                            removeFilter={this.updateFilter} />
                    )
                })}
                {!this.props.labelValueSet &&
                    <i
                        className="fa fa-times"
                        style={{ cursor: "pointer" }}
                        onClick={this.clearFilter}
                    />
                }
            </span>
        )
    }
}

export interface IClinicalDataIntervalFilterProps {
    chartMeta: ChartMeta;
    values: ClinicalDataIntervalFilterValue[];
    updateClinicalDataIntervalFilter: (chartMeta: ChartMeta, values: ClinicalDataIntervalFilterValue[]) => void;
}

class ClinicalDataIntervalFilter extends React.Component<IClinicalDataIntervalFilterProps, {}> {

    @autobind
    private updateClinicalDataIntervalFilter() {
        this.props.updateClinicalDataIntervalFilter(this.props.chartMeta, []);
    }

    render() {
        return (
            <span className={styles.filter}>
                <span className={styles.name}>{this.props.chartMeta.displayName}</span>
                <IntervalFilter
                    values={this.props.values}
                    removeClinicalDataIntervalFilter={this.updateClinicalDataIntervalFilter}
                />
            </span>
        );
    }
}

export interface IUnitFilterProps {
    value: string;
    displayLabel: string
    removeFilter: (value: string) => void
}

@observer
class UnitFilter extends React.Component<IUnitFilterProps, {}> {

    @autobind
    private removeFilter() {
        this.props.removeFilter(this.props.displayLabel)
    }

    render() {
        return (
            <span className={styles.value}>
                <span className={styles.label}>{this.props.displayLabel}</span>
                <i
                    className="fa fa-times"
                    style={{ cursor: "pointer" }}
                    onClick={this.removeFilter}
                />
            </span>
        )
    }
}

class IntervalFilter extends React.Component<{ values: ClinicalDataIntervalFilterValue[]; removeClinicalDataIntervalFilter: (values: ClinicalDataIntervalFilterValue[]) => void; }, {}> {

    @autobind
    private removeClinicalDataIntervalFilter() {
        this.props.removeClinicalDataIntervalFilter([]);
    }

    render() {
        return (
            <span className={styles.value}>
                <span className={styles.label}>{intervalFiltersDisplayValue(this.props.values)}</span>
                <i
                    className="fa fa-times"
                    style={{ cursor: "pointer" }}
                    onClick={this.removeClinicalDataIntervalFilter}
                />
            </span>
        );
    }
}
