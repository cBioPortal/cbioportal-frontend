import * as React from "react";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import {placeArrowBottomLeft} from "shared/components/defaultTooltip/DefaultTooltip";
import SimpleTable from "shared/components/simpleTable/SimpleTable";
import {IMutationalSignature, IMutationalSignatureMeta, ISignificantMutationalSignaturesForSample} from "../../../shared/model/MutationalSignature";
import LazyMobXTable, {Column} from "shared/components/lazyMobXTable/LazyMobXTable";
import "../../../shared/components/simpleTable/styles.scss"
import _ from 'lodash';
import {getMutationalSignaturePercentage} from "../../../shared/lib/FormatUtils";
import FontAwesome from "react-fontawesome";
import {computed} from "mobx";

export const MIN_NUMBER_OF_MUTATIONS_THRESHOLD = 5;
export const MIN_NUMBER_OF_MUTATIONS_STATEMENT = "There are not enough mutations to call mutational signatures for this case.";
export const DUBIOUS_NUMBER_OF_MUTATIONS_THRESHOLD = 15;
export const DUBIOUS_NUMBER_OF_MUTATIONS_STATEMENT = "This case has a low number of mutations, signatures are highly uncertain.";

interface ISignificantMutationalSignaturesProps {
    data: IMutationalSignature[];
    metadata: IMutationalSignatureMeta[];
    uniqueSampleKey: string;
}

export default class SignificantMutationalSignatures extends React.Component<ISignificantMutationalSignaturesProps, {}> {
    public render() {
        return (
            <DefaultTooltip
                placement='bottomLeft'
                trigger={['hover', 'focus']}
                overlay={this.tooltipContent(this.props.data, this.props.metadata, this.props.uniqueSampleKey)}
                destroyTooltipOnHide={false}
                onPopupAlign={placeArrowBottomLeft}
            >
                <span style={{paddingLeft:2}}>
                    <a>(Significant Mutational Signatures)</a>
                </span>
            </DefaultTooltip>
        );
    }

    private tooltipContent(mutationalSignatureData: IMutationalSignature[], mutationalSignatureMetaData: IMutationalSignatureMeta[], uniqueSampleKey: string) {

        const significantMutationalSignaturesForSample: ISignificantMutationalSignaturesForSample = prepareMutationalSignaturesForHeader(mutationalSignatureData, mutationalSignatureMetaData, uniqueSampleKey);
        let hasMutationalSignatures: boolean = true;

        if(_.isEmpty(significantMutationalSignaturesForSample.significantSignatures)){
            hasMutationalSignatures = false;
        }

        return (
            <div style={{maxWidth:250}}>
                {/*<h6 style={{textAlign:"center"}}>*/}
                    {/*Mutational Signature Confidences*/}
                {/*</h6>*/}
                <span className="small">
                    {significantMutationalSignaturesForSample.confidenceStatement}
                </span>
                <hr style={{marginTop:10,marginBottom:10}}/>
                {hasMutationalSignatures &&
                    <table>
                    <th>Significant Mutational Signatures</th>
                        <th>Exposure</th>
                    {Object.keys(significantMutationalSignaturesForSample.significantSignatures).map((significantSignatureValue)=>
                        <tr><td style={{paddingTop: 3}}>{significantSignatureValue}</td>
                        <td style={{paddingTop: 3}}>{this.progressBar(significantMutationalSignaturesForSample.significantSignatures[significantSignatureValue].toString(), false)}</td>
                        </tr>)}
                    </table>
                }

            </div>
        );
    }

    public progressBar(confidence:string, determineColor:boolean) {
        let confidencePerc = Math.round(parseFloat(confidence) * 100);

        // Coloring same as CVR as discussed with @anoopbr
        let progressBarClassName:string = "progress-bar-info";
        let progressBarStyle:{ [s:string]:string; } = {"backgroundColor":"darkgray"};

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

}

export function prepareMutationalSignaturesForHeader(mutationalSignatureData: IMutationalSignature[], mutationalSignatureMetaData: IMutationalSignatureMeta[],
                                                     uniqueSampleKey: string): ISignificantMutationalSignaturesForSample{
    //group data by uniquesamples for now -> this processing will need to be done in patientpageviewstore in the future
    let mutationalSignatureDataForSample: Array<any> = _(mutationalSignatureData)
        .filter(["uniqueSampleKey", uniqueSampleKey])
        .value();

    let significantMutationalSignatureForSample: ISignificantMutationalSignaturesForSample = {
        numberOfMutations:0,
        confidenceStatement:"",
        significantSignatures:{}
    };

    for (const mutationalSignatureSample of mutationalSignatureDataForSample){

        //for each uniquesample, build significant mutational signature data structure
        significantMutationalSignatureForSample.numberOfMutations = mutationalSignatureSample.numberOfMutations;

        if(mutationalSignatureSample.confidence > 0.85){ //make a variable called confidence threshold
            // add significant mutational signatures
            significantMutationalSignatureForSample.significantSignatures[mutationalSignatureSample.mutationalSignatureId] = mutationalSignatureSample.value;

            //build confidence statement
            if(significantMutationalSignatureForSample.numberOfMutations <= MIN_NUMBER_OF_MUTATIONS_THRESHOLD){//account for low number of mutations
                significantMutationalSignatureForSample.confidenceStatement += MIN_NUMBER_OF_MUTATIONS_STATEMENT;
            }
            else if(significantMutationalSignatureForSample.numberOfMutations <= DUBIOUS_NUMBER_OF_MUTATIONS_THRESHOLD){
                significantMutationalSignatureForSample.confidenceStatement += DUBIOUS_NUMBER_OF_MUTATIONS_STATEMENT;
            }

            for (const mutationalSignature of mutationalSignatureMetaData){ //generate confidence statement depending on the mutational signature
                if(mutationalSignatureSample.mutationalSignatureId === mutationalSignature.mutationalSignatureId){
                    significantMutationalSignatureForSample.confidenceStatement += (" " + mutationalSignature.confidenceStatement);
                }
            }
        }
    }

    //check if any significant signatures were added using lodash
    if(_.isEmpty(significantMutationalSignatureForSample.significantSignatures)){
        significantMutationalSignatureForSample.confidenceStatement += "No signatures confidently detected.";
    }

    return significantMutationalSignatureForSample;
}