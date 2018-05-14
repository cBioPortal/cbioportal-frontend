import * as React from "react";
import styles from "./styles.module.scss";
import { observer } from "mobx-react";
import { ClinicalAttribute } from "shared/api/generated/CBioPortalAPI";
import { observable, computed, action } from "mobx";
import _ from "lodash";
import {If} from 'react-if';
import { ChartHeader } from "pages/studyView/chartHeader/ChartHeader";
import { ClinicalDataType, StudyViewPageStore } from "pages/studyView/StudyViewPageStore";
import { getClinicalDataType } from "pages/studyView/StudyViewUtils";
import fileDownload from 'react-file-download';
import PieChart from "pages/studyView/charts/pieChart/PieChart";
import svgToPdfDownload from "shared/lib/svgToPdfDownload";
import { ClinicalDataCount, StudyViewFilter } from "shared/api/generated/CBioPortalAPIInternal";
import { remoteData } from "shared/api/remoteData";
import internalClient from "shared/api/cbioportalInternalClientInstance";

export interface AbstractChart {
    downloadData:()=>string;
    toSVGDOMNode:()=>Element
}

export enum ChartType {
    PIE_CHART,
    BAR_CHART,
    SURVIVAL,
    TABLE,
    SCATTER
}

export interface IChartContainerProps {
    chartType:ChartType;
    clinicalAttribute: ClinicalAttribute,
    store:StudyViewPageStore,
    onUserSelection: (attrId: string, clinicalDataType: ClinicalDataType, value: string[]) => void;
}

@observer
export class ChartContainer extends React.Component<IChartContainerProps, {}> {

    private handlers:any;
    private plot:AbstractChart;

    @observable mouseInPlot:boolean = false;
    @observable filters:string[] = []

    constructor(props: IChartContainerProps) {
        super(props);
        let fileName = props.clinicalAttribute.displayName.replace(/[ \t]/g,'_')

        this.handlers = {
            ref: (plot:AbstractChart)=>{ 
                this.plot = plot; 
            },
            resetFilters: action(()=>{
                this.filters = [];
                this.props.onUserSelection(
                    this.props.clinicalAttribute.clinicalAttributeId,
                    getClinicalDataType(this.props.clinicalAttribute),
                    []);
            }),
            onUserSelection: action((values:string[])=>{
                this.filters = values;
                this.props.onUserSelection(
                    this.props.clinicalAttribute.clinicalAttributeId,
                    getClinicalDataType(this.props.clinicalAttribute),
                    values);
            }),
            onMouseEnterPlot: action(()=>{ this.mouseInPlot = true;}),
            onMouseLeavePlot: action(()=>{ this.mouseInPlot = false;}),
            handleDownloadDataClick:()=>{
                let firstLine = this.props.clinicalAttribute.displayName+'\tCount'
                fileDownload(firstLine+'\n'+this.plot.downloadData(), fileName);
            },
            handleSVGClick:()=>{
                fileDownload((new XMLSerializer()).serializeToString(this.toSVGDOMNode()), `${fileName}.svg`);
            },
            handlePDFClick:()=>{
                svgToPdfDownload(`${fileName}.pdf`, this.toSVGDOMNode());
            },
        };
    }

    public toSVGDOMNode():Element {
        if (this.plot) {
            // Get result of plot
            return this.plot.toSVGDOMNode();
        } else {
            return document.createElementNS("http://www.w3.org/2000/svg", "svg");
        }
    }

    @computed get showPieControlIcon(){
        return this.props.clinicalAttribute.datatype==='STRING' && this.props.chartType === ChartType.TABLE;
    }

    @computed get showTableControlIcon(){
        return this.props.chartType === ChartType.PIE_CHART && this.props.clinicalAttribute.datatype==='STRING';
    }

    @computed get isChartVisible(){
        //check if there is chart implementation is present
        return this.props.chartType === ChartType.PIE_CHART && this.props.clinicalAttribute.datatype==='STRING';
    }

    private readonly patientClinicalAttributesData = remoteData<ClinicalDataCount[]>({
        await: () => [],
        invoke: async () => {
            return internalClient.fetchClinicalDataCountsUsingPOST({
                studyId: this.props.clinicalAttribute.studyId,
                attributeId:this.props.clinicalAttribute.clinicalAttributeId,
                clinicalDataType: getClinicalDataType(this.props.clinicalAttribute),
                studyViewFilter: this.props.store.filters
            })
        },
        default: []
    });

    @computed get data(){
        return this.patientClinicalAttributesData.result;
    }

    public render() {
        return (
            <If condition={this.isChartVisible}>
                <div className={styles.chart}
                     onMouseEnter={this.handlers.onMouseEnterPlot}
                     onMouseLeave={this.handlers.onMouseLeavePlot}>
                    <ChartHeader 
                        clinicalAttribute={this.props.clinicalAttribute}
                        showControls={this.mouseInPlot}
                        showResetIcon={this.filters.length>0}
                        showTableIcon={this.showTableControlIcon}
                        showPieIcon={this.showPieControlIcon}
                        handleResetClick={this.handlers.resetFilters}
                        handleDownloadDataClick={this.handlers.handleDownloadDataClick}
                        handleSVGClick={this.handlers.handleSVGClick}
                        handlePDFClick={this.handlers.handlePDFClick}
                    />

                    {this.data.length>0 && 
                        <If condition={this.props.chartType===ChartType.PIE_CHART}>
                            <PieChart
                                ref={this.handlers.ref}
                                onUserSelection={this.handlers.onUserSelection}
                                filters={this.filters}
                                data={this.data} />
                        </If>
                    }
                </div>
            </If>
        );
    }

}
