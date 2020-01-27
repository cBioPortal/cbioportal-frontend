import * as React from 'react';
import { observer } from 'mobx-react';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import RightPanel from './rightPanel/RightPanel';
import StudySummary from './studySummary/StudySummary';
import UserSelections from '../UserSelections';
import * as _ from 'lodash';

export interface IStudyPageHeaderProps {
    store: StudyViewPageStore;
}

@observer
export default class StudyPageHeader extends React.Component<
    IStudyPageHeaderProps,
    {}
> {
    render() {
        return (
            <div className={'headBlock'} data-test="study-view-header">
                {_.keys(this.props.store.pageStatusMessages).length > 0 && (
                    <div>
                        {_.values(this.props.store.pageStatusMessages).map(
                            statusMessage => (
                                <div
                                    className={`alert alert-${statusMessage.status}`}
                                >
                                    {statusMessage.message}
                                </div>
                            )
                        )}
                    </div>
                )}
                <div style={{ display: 'flex' }}>
                    <StudySummary
                        hasRawDataForDownload={
                            this.props.store.hasRawDataForDownload.result
                        }
                        studies={this.props.store.displayedStudies.result}
                        originStudies={this.props.store.originStudies}
                        showOriginStudiesInSummaryDescription={
                            this.props.store
                                .showOriginStudiesInSummaryDescription
                        }
                    />
                    <RightPanel store={this.props.store} />
                </div>

                {this.props.store.clinicalAttributeIdToDataType.isComplete && (
                    <UserSelections
                        filter={this.props.store.userSelections}
                        comparisonGroupSelection={
                            this.props.store.filterComparisonGroups
                        }
                        numberOfSelectedSamplesInCustomSelection={
                            this.props.store
                                .numberOfSelectedSamplesInCustomSelection
                        }
                        customChartsFilter={this.props.store.customChartFilterSet.toJS()}
                        attributesMetaSet={
                            this.props.store.chartMetaSetWithChartType
                        }
                        clinicalAttributeIdToDataType={
                            this.props.store.clinicalAttributeIdToDataType
                                .result!
                        }
                        updateClinicalDataFilterByValues={
                            this.props.store.updateClinicalDataFilterByValues
                        }
                        updateCustomChartFilter={
                            this.props.store.setCustomChartFilters
                        }
                        removeGeneFilter={this.props.store.removeGeneFilter}
                        removeCustomSelectionFilter={
                            this.props.store.removeCustomSelectFilter
                        }
                        removeComparisonGroupSelectionFilter={
                            this.props.store
                                .removeComparisonGroupSelectionFilter
                        }
                        clearAllFilters={this.props.store.clearAllFilters}
                    />
                )}
            </div>
        );
    }
}
