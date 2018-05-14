import * as React from 'react';
import { inject, observer } from "mobx-react";
import styles from "./styles.module.scss";
import {MutatedGenesTable} from "./table/MutatedGenesTable";
import {CNAGenesTable} from "./table/CNAGenesTable";
import {ChartContainer, ChartType} from 'pages/studyView/charts/ChartContainer';
import SurvivalChart from "../resultsView/survival/SurvivalChart";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import { StudyViewPageStore, ClinicalDataType, SurvivalType } from 'pages/studyView/StudyViewPageStore';
import { reaction } from 'mobx';
import { ClinicalAttribute } from 'shared/api/generated/CBioPortalAPI';


export interface IStudyViewPageProps {
    routing: any;
}

// making this an observer (mobx-react) causes this component to re-render any time
// there is a change to any observable value which is referenced in its render method. 
// Even if this value is referenced deep within some helper method
@inject('routing')
@observer
export default class StudyViewPage extends React.Component<IStudyViewPageProps, {}> {

    store: StudyViewPageStore;
    queryInput: HTMLInputElement;

    constructor(props: IStudyViewPageProps) {
        super();
        this.store = new StudyViewPageStore();
        this.onUserSelection = this.onUserSelection.bind(this);
        this.updateGeneFilter = this.updateGeneFilter.bind(this);
        this.updateCNAGeneFilter = this.updateCNAGeneFilter.bind(this);

        //TODO: this should be done by a module so that it can be reused on other pages
        const reaction1 = reaction(
            () => props.routing.location.query,
            query => {
                if ('studyId' in query) {
                    this.store.studyId = query.studyId;
                    this.store.sampleAttrIds = ('sampleAttrIds' in query ? (query.sampleAttrIds  as string).split(",") : []);
                    this.store.patientAttrIds = ('patientAttrIds' in query ? (query.patientAttrIds as string).split(",") : []);
                }
            },
            {fireImmediately: true}
        );

    }

    private onUserSelection(attrId: string,
                            clinicalDataType: ClinicalDataType,
                            values: string[]) {

        this.store.updateClinicalDataEqualityFilters(attrId, clinicalDataType, values)
    }

    private updateGeneFilter(entrezGeneId: number) {
        this.store.updateGeneFilter(entrezGeneId);
    }

    private updateCNAGeneFilter(entrezGeneId: number, alteration: number) {
        this.store.updateCNAGeneFilter(entrezGeneId, alteration);
    }

    renderAttributeChart = (clinicalAttribute: ClinicalAttribute,
                            arrayIndex: number) => {
        return (<ChartContainer
                    chartType={ChartType.PIE_CHART}
                    store={this.store}
                    clinicalAttribute={clinicalAttribute}
                    onUserSelection={this.onUserSelection}
                    key={clinicalAttribute.clinicalAttributeId}
                />);
    };

    renderSurvivalPlot = (data: SurvivalType) => {
        return <div className={styles.survivalPlot}>
            <SurvivalChart alteredPatientSurvivals={data.alteredGroup}
                           unalteredPatientSurvivals={data.unalteredGroup}
                           title={'test'}
                           xAxisLabel="Months Survival"
                           yAxisLabel="Overall Survival"
                           totalCasesHeader="Number of Cases, Total"
                           statusCasesHeader="Number of Cases, Deceased"
                           medianMonthsHeader="Median Months Survival"
                           yLabelTooltip="Survival estimate"
                           xLabelWithEventTooltip="Time of death"
                           xLabelWithoutEventTooltip="Time of last observation"
                           showDownloadButtons={false}
                           showTable={false}
                           showLegend={false}
                           styleOpts={{
                               width: 500,
                               height: 300
                           }}
                           fileName="Overall_Survival"/>
        </div>
    }

    render() {
        let mutatedGeneData = this.store.mutatedGeneData.result;
        let cnaGeneData = this.store.cnaGeneData.result;
        let cancerStudy = this.store.studyMetaData.result!;
        return (
            <div className="studyView">
                <div className="topBanner">
                    {
                        this.store.studyMetaData.isComplete && (
                            <div className="studyViewHeader">
                                <h3>{cancerStudy.name}</h3>
                                <p dangerouslySetInnerHTML={{__html: cancerStudy.description}}></p>
                            </div>
                        )
                    }
                </div>
                <MSKTabs id="studyViewTabs" activeTabId={this.props.routing.location.query.tab}
                         className="mainTabs">

                    <MSKTab key={0} id="summaryTab" linkText="Summary">
                            {
                                this.store.defaultVisibleAttributes.isComplete &&
                                (
                                    <div className={styles.flexContainer}>
                                        {this.store.defaultVisibleAttributes.result.map(this.renderAttributeChart)}
                                    </div>
                                )
                            }
                            {
                                this.store.survivalPlotData.result.map(this.renderSurvivalPlot)
                            }
                            <div className={styles.flexContainer}>
                                {(this.store.mutatedGeneData.isComplete && <MutatedGenesTable
                                    data={mutatedGeneData}
                                    numOfSelectedSamples={100}
                                    filters={this.store.getMutatedGenesTableFilters()}
                                    toggleSelection={this.updateGeneFilter}
                                />)}
                                {(this.store.cnaGeneData.isComplete && <CNAGenesTable
                                    data={cnaGeneData}
                                    numOfSelectedSamples={100}
                                    filters={this.store.getCNAGenesTableFilters()}
                                    toggleSelection={this.updateCNAGeneFilter}
                                />)}
                            </div>
                    </MSKTab>
                </MSKTabs>
            </div>
        )
    }
}
