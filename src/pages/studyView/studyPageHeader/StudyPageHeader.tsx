import * as React from 'react';
import {observer} from "mobx-react";
import {StudyViewPageStore} from 'pages/studyView/StudyViewPageStore';
import RightPanel from "./rightPanel/RightPanel";
import StudySummary from "./studySummary/StudySummary";
import UserSelections from "../UserSelections";
import * as _ from 'lodash';


export interface IStudyPageHeaderProps {
    userEmail: string | undefined,
    store: StudyViewPageStore,
}

@observer
export default class StudyPageHeader extends React.Component<IStudyPageHeaderProps, {}> {
    render() {
        return (
            <div style={{display: 'flex', flexDirection:'column',margin: '0 20px 5px 20px'}} data-test="study-view-header">
                {_.keys(this.props.store.pageStatusMessages).length > 0 && (
                    <div>
                        {_.values(this.props.store.pageStatusMessages).map(statusMessage => <div
                            className={`alert alert-${statusMessage.status}`}>{statusMessage.message}</div>)}
                    </div>
                )}
                <div style={{display: 'flex', marginBottom:10}}>
                <StudySummary
                    hasRawDataForDownload={this.props.store.hasRawDataForDownload.result}
                    studies={this.props.store.displayedStudies.result}
                    originStudies={this.props.store.originStudies}
                    showOriginStudiesInSummaryDescription={this.props.store.showOriginStudiesInSummaryDescription}
                />
                <RightPanel
                    user={this.props.userEmail}
                    store={this.props.store}/>
                </div>

                <UserSelections
                    filter={this.props.store.userSelections}
                    numberOfSelectedSamplesInCustomSelection={this.props.store.numberOfSelectedSamplesInCustomSelection}
                    customChartsFilter={this.props.store.customChartFilterSet.toJS()}
                    getSelectedGene={this.props.store.getKnownHugoGeneSymbolByEntrezGeneId}
                    attributesMetaSet={this.props.store.chartMetaSet}
                    updateClinicalDataEqualityFilter={this.props.store.updateClinicalDataEqualityFilters}
                    updateClinicalDataIntervalFilter={this.props.store.updateClinicalDataIntervalFiltersByValues}
                    updateCustomChartFilter={this.props.store.setCustomChartFilters}
                    removeGeneFilter={this.props.store.removeGeneFilter}
                    removeCNAGeneFilter={this.props.store.removeCNAGeneFilters}
                    resetMutationCountVsCNAFilter={this.props.store.resetMutationCountVsCNAFilter}
                    clearCNAGeneFilter={this.props.store.clearCNAGeneFilter}
                    clearGeneFilter={this.props.store.clearGeneFilter}
                    removeCustomSelectionFilter={this.props.store.removeCustomSelectFilter}
                    removeWithMutationDataFilter={this.props.store.removeWithMutationDataFilter}
                    removeWithCNADataFilter={this.props.store.removeWithCNADataFilter}
                    clearChartSampleIdentifierFilter={this.props.store.clearChartSampleIdentifierFilter}
                    clearAllFilters={this.props.store.clearAllFilters}
                />
            </div>
        )
    }
}