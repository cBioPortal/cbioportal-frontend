import * as React from 'react';
import { observer } from "mobx-react";
import { observable } from 'mobx';
import styles from "./styles.module.scss";
import { VictoryChart, VictoryBoxPlot, VictoryContainer, VictoryAxis, VictoryScatter } from 'victory';
import { Popover } from 'react-bootstrap';
import SvgSaver from 'svgsaver';
import fileDownload from 'react-file-download';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { ResultsViewPageStore, ExtendedAlteration } from "../ResultsViewPageStore";
import { MolecularProfile, NumericGeneMolecularData } from 'shared/api/generated/CBioPortalAPI';
import * as _ from "lodash";
import { sleep } from "../../../shared/lib/TimeUtils";
import { getDownloadContent, getAlterationsTooltipContent, shortenGenesLabel, 
    getBoxPlotModels, getBoxPlotScatterData } from 'pages/resultsView/enrichments/EnrichmentsUtil';
import autobind from 'autobind-decorator';
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";

export interface IMiniBoxPlotProps {
    selectedGeneHugo: string;
    selectedGeneEntrez: number;
    selectedGeneQValue: number;
    selectedProfile: MolecularProfile;
    fileName: string;
    queryGenes: string[];
    store: ResultsViewPageStore;
}

@observer
export default class MiniBoxPlot extends React.Component<IMiniBoxPlotProps, {}> {

    @observable tooltipModel: any;
    private isTooltipHovered: boolean = false;
    private tooltipCounter: number = 0;
    private svgContainer: any;
    private svgsaver = new SvgSaver();
    private scatterData: any[] = [];

    componentWillReceiveProps() {
        this.scatterData = [];
    }

    @autobind
    private downloadSvg() {
        this.svgsaver.asSvg(this.svgContainer.firstChild, this.props.fileName + '.svg');
    }

    @autobind
    private downloadPng() {
        this.svgsaver.asPng(this.svgContainer.firstChild, this.props.fileName + '.png');
    }

    @autobind
    private downloadData() {
        fileDownload(getDownloadContent(this.scatterData, this.props.selectedGeneHugo, this.props.selectedProfile.name), 
            this.props.fileName + '.txt');
    }

    @autobind
    private tooltipMouseEnter(): void {
        this.isTooltipHovered = true;
    }

    @autobind
    private tooltipMouseLeave(): void {
        this.isTooltipHovered = false;
        this.tooltipModel = null;
    }

    public render() {

        const molecularProfileId = this.props.selectedProfile.molecularProfileId;
        let molecularData: NumericGeneMolecularData[] | undefined; 
        
        if (this.props.selectedGeneHugo) {
            molecularData = this.props.store.numericGeneMolecularDataCache.get({entrezGeneId: this.props.selectedGeneEntrez, 
                molecularProfileId: molecularProfileId}).result;
        }
        
        if (molecularData && molecularData.length > 0 && this.scatterData.length === 0) {
            this.scatterData = getBoxPlotScatterData(molecularData, molecularProfileId, 
                this.props.store.caseAggregatedData.result!.samples, this.props.store.alteredSampleKeys.result!);
        }

        const events = [{
            target: "data",
            eventHandlers: {
                onMouseOver: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props: any) => {
                                this.tooltipModel = props;
                                this.tooltipCounter++;
                                return { active: true };
                            }
                        }
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: "data",
                            mutation: async () => {
                                await sleep(100);
                                if (!this.isTooltipHovered && this.tooltipCounter === 1) {
                                    this.tooltipModel = null;
                                }
                                this.tooltipCounter--;
                                return { active: false };
                            }
                        }
                    ];
                }
            }
        }];

        return (
            <div>
                {this.props.selectedGeneHugo && this.scatterData.length > 0 &&
                    <div>
                        <div className="small" style={{ margin:"10px 0", paddingRight:20 }}>
                            Boxplots of {this.props.selectedProfile.name} data for altered and unaltered cases
                        </div>
                        <div className="posRelative">
                            <div className="borderedChart inlineBlock posRelative">
                                <div className="btn-group" style={{position:'absolute', zIndex:10, right: 10 }} role="group">
                                    <button className={`btn btn-default btn-xs`} onClick={this.downloadSvg}>
                                        SVG <i className="fa fa-cloud-download" />
                                    </button>
                                    <button className={`btn btn-default btn-xs`} onClick={this.downloadPng}>
                                        PNG <i className="fa fa-cloud-download" />
                                    </button>
                                    <button className={`btn btn-default btn-xs`} onClick={this.downloadData}>
                                        Data <i className="fa fa-cloud-download" />
                                    </button>
                                </div>
                                <VictoryChart domainPadding={{ x: 60, y: 20 }}  height={350} width={350} padding={{ top: 40, bottom: 60, left: 60, right: 40 }}
                                              containerComponent={<VictoryContainer responsive={false}
                                    containerRef={(ref: any) => this.svgContainer = ref}/>}
                                              theme={CBIOPORTAL_VICTORY_THEME}>
                                    <VictoryAxis tickValues={[1, 2]} tickFormat={(t: any) => t === 1 ? "Altered" : "Unaltered"}
                                        label={"Query: " + shortenGenesLabel(this.props.queryGenes, 2) + "\n(q-Value: " + 
                                        toConditionalPrecision(this.props.selectedGeneQValue, 3, 0.01) + ")"} offsetY={70}
                                        style={{
                                            axisLabel: { padding: 40 },
                                            grid: {stroke: "none"}
                                    }} />
                                    <VictoryAxis label={this.props.selectedGeneHugo + ", " + this.props.selectedProfile.name} 
                                        dependentAxis={true} style={{
                                            axisLabel: { padding: 40 },
                                            grid: {stroke: "none"}
                                    }}/>
                                    <VictoryBoxPlot data={getBoxPlotModels(this.scatterData)} boxWidth={60} whiskerWidth={30} style={{
                                        q1: { fillOpacity: 0, strokeWidth: 1, stroke: "#BDBDBD" },
                                        q3: { fillOpacity: 0, strokeWidth: 1, stroke: "#BDBDBD" },
                                        median: { strokeWidth: 3, stroke: "#BDBDBD" },
                                        min: { strokeWidth: 1, stroke: "#BDBDBD" },
                                        max: { strokeWidth: 1, stroke: "#BDBDBD" }
                                    }}/>
                                    <VictoryScatter data={this.scatterData} events={events} size={(datum: any, active: any) => active ? 10 : 3}
                                        style={{ data: { fill: "#58ACFA", strokeWidth: 0, stroke: "#0174DF" } }}/>
                                </VictoryChart>
                            </div>
                            {this.tooltipModel &&
                                <Popover positionLeft={this.tooltipModel.x + 22} 
                                    positionTop={this.tooltipModel.y - 22} className="cbioTooltip"
                                    onMouseEnter={this.tooltipMouseEnter} onMouseLeave={this.tooltipMouseLeave}>
                                    <a href={'/case.do#/patient?sampleId=' + this.tooltipModel.datum.sampleId + '&studyId=' +
                                    this.tooltipModel.datum.studyId} target="_blank"><b>{this.tooltipModel.datum.sampleId}</b></a><br />
                                    mRNA expression: {this.tooltipModel.datum.y.toFixed(3)}<br />
                                    Alteration(s): {this.tooltipModel.datum.alterations}
                                </Popover>
                            }
                        </div>
                    </div>
                }
                {!this.props.selectedGeneHugo &&
                    <div className="borderedChart inlineBlock" style={{ marginTop:20}}>
                        <div className="text-center" style={{width:350}}>
                            Click on a gene in table to render plots here.
                        </div>
                    </div>
                }
            </div>
        );
    }
}
