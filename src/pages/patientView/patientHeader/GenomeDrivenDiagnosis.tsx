import * as React from "react";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import {placeArrowBottomLeft} from "shared/components/defaultTooltip/DefaultTooltip";
import SimpleTable from "shared/components/simpleTable/SimpleTable";
import FontAwesome from "react-fontawesome";
import {computed} from "mobx";

export type GDDOutput = {
    Pred1: string;
    Pred2: string;
    Pred3: string;
    Conf1: string;
    Conf2: string;
    Conf3: string;
    Diagnosed_Cancer_Type: string;
    Diagnosed_Cancer_Type_Detailed: string;
}

// Genome Driven Diagnosis only works on these 22 cancer types
export const GDD_CANCER_TYPES: string[] = [
    "bladder cancer",
    "breast cancer",
    "cholangiocarcinoma",
    "colorectal cancer",
    "endometrial cancer",
    "esophagogastric cancer",
    "gastrointestinal stromal tumor",
    "germ cell tumor",
    "glioma",
    "head and neck cancer",
    "melanoma",
    "mesothelioma",
    "neuroblastoma",
    "non-small cell lung cancer",
    "ovarian cancer",
    "pancreatic cancer",
    "pancreatic neuroendocrine tumor",
    "prostate cancer",
    "renal cell cancer",
    "small cell lung cancer",
    "thyroid cancer",
    "uveal melanoma",
];

// in percentage
export const HIGH_CONFIDENCE_PREDICTION = 75;
export const MEDIUM_CONFIDENCE_PREDICTION = 50;

interface IGenomeDrivenDiagnosisProps {
    prediction: GDDOutput;
}

export default class GenomeDrivenDiagnosis extends React.Component<IGenomeDrivenDiagnosisProps, {}> {
    public render() {
        return (
            <DefaultTooltip
                placement='bottomLeft'
                trigger={['hover', 'focus']}
                overlay={this.tooltipContent()}
                destroyTooltipOnHide={false}
                onPopupAlign={placeArrowBottomLeft}
            >
                <span style={{paddingLeft:2}}>
                    {this.predictionContent()}
                </span>
            </DefaultTooltip>
        );
    }

    @computed private get isInAllowedCancerTypes() {
        return GDD_CANCER_TYPES.indexOf(this.cleanCancerType(this.props.prediction.Diagnosed_Cancer_Type).toLowerCase()) > -1;
    }

    @computed private get hasMatchingDiagnosis() {
        return this.props.prediction.Pred1 && this.cleanCancerType(this.props.prediction.Pred1).toLowerCase() === this.cleanCancerType(this.props.prediction.Diagnosed_Cancer_Type).toLowerCase()
    }

    @computed private get confidenceAsPerc() {
        return Math.round(parseFloat(this.props.prediction.Conf1) * 100)
    }
    
    @computed private get isHighConfidence() {
        return this.confidenceAsPerc > HIGH_CONFIDENCE_PREDICTION;
    }

    @computed private get isMediumConfidence() {
        return this.confidenceAsPerc > MEDIUM_CONFIDENCE_PREDICTION && this.confidenceAsPerc <= HIGH_CONFIDENCE_PREDICTION;
    }

    private predictionContent() {
        if (!this.isInAllowedCancerTypes || this.hasMatchingDiagnosis) {
            return <a>(GDD)</a>
        } else {
            let textType = "";
            let icon:JSX.Element|null = null;
            if (this.isHighConfidence) {
                textType = "text-danger";
                icon = <i className="fa fa-exclamation-triangle" style={{color:"darkred"}}></i>;
            } else if (this.isMediumConfidence) {
                textType = "text-warning";
                icon = <i className="fa fa-exclamation-triangle" style={{color:"darkorange"}}></i>;
            }

            return <a>
                (GDD: <span className={textType} data-test="gdd-prediction">
                    {this.cleanCancerType(this.props.prediction.Pred1)}
                </span> {icon})
            </a>
        }
    }

    private tooltipContent() {
        return (
            <div style={{maxWidth:250}}>
                <h6 style={{textAlign:"center"}}>
                    Genome Driven Diagnosis (GDD)
                </h6>
                {   // Show warning when no diagnosis found
                    (!this.props.prediction.Diagnosed_Cancer_Type && (
                    <p className="small text-danger" style={{textAlign:"center"}}>
                        No diagnosed cancer type found.
                    </p>
                  )) || 
                  // Show warning when diagnosis not part of 22 types
                  (!this.isInAllowedCancerTypes && (
                    <p className="small text-danger" style={{textAlign:"center"}}>
                        The diagnosed
                        cancer type "{this.props.prediction.Diagnosed_Cancer_Type}" is not
                        part of the 22 tumor types GDD can predict.
                    </p>
                  ))
                }
                <SimpleTable
                    headers={[
                        <th>Cancer Type</th>,
                        <th>Confidence</th>
                    ]}
                    rows={[
                        <tr><td>{this.cleanCancerType(this.props.prediction.Pred1)}</td><td>{this.progressBar(this.props.prediction.Conf1, this.isInAllowedCancerTypes)}</td></tr>,
                        <tr><td>{this.cleanCancerType(this.props.prediction.Pred2)}</td><td>{this.progressBar(this.props.prediction.Conf2, false)}</td></tr>,
                        <tr><td>{this.cleanCancerType(this.props.prediction.Pred3)}</td><td>{this.progressBar(this.props.prediction.Conf3, false)}</td></tr>
                    ]}
                />
                <hr style={{marginTop:10,marginBottom:10}}/>
                <span className="small">
                    <b>Genome Driven Diagnosis (GDD)</b> predicts probability for 22 tumor
                    types based on genomic features, using a calibrated RandomForest
                    algorithm.
                </span>
            </div>
        );
    }

    public progressBar(confidence:string, determineColor:boolean) {
        let confidencePerc = Math.round(parseFloat(confidence) * 100);

        // Coloring same as CVR as discussed with @anoopbr
        let progressBarClassName:string = "progress-bar-info";
        let progressBarStyle:{ [s:string]:string; } = {"backgroundColor":"darkgray"};
        if (determineColor) {
            if (confidencePerc > HIGH_CONFIDENCE_PREDICTION) {
                progressBarStyle = {};
                if (this.hasMatchingDiagnosis) {
                    progressBarClassName = "progress-bar-success";
                } else {
                    progressBarClassName = "progress-bar-danger";
                }
            } else if (confidencePerc > MEDIUM_CONFIDENCE_PREDICTION) {
                progressBarStyle = {};
                if (this.hasMatchingDiagnosis) {
                    progressBarClassName = "progress-bar-info";
                } else {
                    progressBarClassName = "progress-bar-warning";
                }
            } 
        }

        return (
            <div className="progress" style={{position:"relative",width:100,marginBottom:0}}>
                <div data-test="progress-bar" className={`progress-bar ${progressBarClassName}`}
                     role="progressbar" aria-valuenow={`${confidencePerc}`}
                     aria-valuemin="0" aria-valuemax="100"
                     style={Object.assign(progressBarStyle, {width:`${confidencePerc}%`})} />
                 <div style={{position:"absolute",
                              textShadow:"-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white",
                              width:100,
                              marginTop:2,
                              textAlign:"center"}}
                  >{confidencePerc}%</div>
            </div>
        );
    }

    private cleanCancerType(cancerType:string) {
        return cancerType && cancerType.replace(/\./g," ").replace("Non S", "Non-S") || "";
    }
}
