import * as React from "react";
import _ from 'lodash';
import {IMutationalSignature, IMutationalSignatureMeta, ISignificantMutationalSignaturesForSample} from "../model/MutationalSignature";

const MIN_NUMBER_OF_MUTATIONS_THRESHOLD = 5;
const MIN_NUMBER_OF_MUTATIONS_STATEMENT = "There are not enough mutations to call mutational signatures for this case.";
const DUBIOUS_NUMBER_OF_MUTATIONS_THRESHOLD = 15;
const DUBIOUS_NUMBER_OF_MUTATIONS_STATEMENT = "This case has a low number of mutations, signatures are highly uncertain.";


export function progressBar(confidence:string, determineColor:boolean) {
    let confidencePerc = Math.round(parseFloat(confidence) * 100);

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

export function prepareMutationalSignaturesForHeader(mutationalSignatureData: IMutationalSignature[], mutationalSignatureMetaData: IMutationalSignatureMeta[],
                                                     uniqueSampleKey: string): ISignificantMutationalSignaturesForSample{
    //group data by uniquesamples for now -> this processing will need to be done in patientpageviewstore in the future
    let mutationalSignatureDataForUniqueSample: Array<any> = _(mutationalSignatureData)
        .filter(["uniqueSampleKey", uniqueSampleKey])
        .value();

    let significantMutationalSignatureForSample: ISignificantMutationalSignaturesForSample = {
        numberOfMutationsForSample:0,
        confidenceStatement:"",
        significantSignatures:{}
    };

    for (const mutationalSignatureSample of mutationalSignatureDataForUniqueSample){

        //for each uniquesample, build significant mutational signature data structure
        significantMutationalSignatureForSample.numberOfMutationsForSample = mutationalSignatureSample.numberOfMutationsForSample;

        if(mutationalSignatureSample.confidence > 0.85){ //make a variable called confidence threshold
            // add significant mutational signatures
            significantMutationalSignatureForSample.significantSignatures[mutationalSignatureSample.mutationalSignatureId] = mutationalSignatureSample.value;

            //build confidence statement
            if(significantMutationalSignatureForSample.numberOfMutationsForSample <= MIN_NUMBER_OF_MUTATIONS_THRESHOLD){//account for low number of mutations
                significantMutationalSignatureForSample.confidenceStatement += MIN_NUMBER_OF_MUTATIONS_STATEMENT;
            }
            else if(significantMutationalSignatureForSample.numberOfMutationsForSample <= DUBIOUS_NUMBER_OF_MUTATIONS_THRESHOLD){
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

    significantMutationalSignatureForSample.confidenceStatement = significantMutationalSignatureForSample.confidenceStatement.trim();
    return significantMutationalSignatureForSample;
}