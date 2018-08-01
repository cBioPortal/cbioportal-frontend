import * as React from "react";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import {placeArrowBottomLeft} from "shared/components/defaultTooltip/DefaultTooltip";
import SimpleTable from "shared/components/simpleTable/SimpleTable";
import {IMutationalSignature, IMutationalSignatureMeta, ISignificantMutationalSignaturesBySample} from "../../../shared/model/MutationalSignature";
import _ from 'lodash';
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

export const MIN_NUMBER_OF_MUTATIONS_THRESHOLD = 5;
export const MIN_NUMBER_OF_MUTATIONS_STATEMENT = "There are not enough mutations to call mutational signatures for this case.";
export const DUBIOUS_NUMBER_OF_MUTATIONS_THRESHOLD = 15;
export const MIN_NUMBER_OF_MUTATIONS_STATEMENT = "This case has a low number of mutations, signatures are highly uncertain.";

interface ISignificantMutationalSignaturesProps {
    data: IMutationalSignature[];
}

export default class SignificantMutationalSignatures extends React.Component<ISignificantMutationalSignaturesProps, {}> {


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
                    <a>(Mutational Signatures)</a>
                </span>
            </DefaultTooltip>
        );
    }

    private tooltipContent() {
        return (
            <div style={{maxWidth:250}}>
                <h6 style={{textAlign:"center"}}>
                    Mutational Signature Confidences
                </h6>
                <SimpleTable
                    headers={[
                        <th>Significant Mutational Signatures</th>,
                        <th>Exposure</th>
                    ]}
                    rows={[
                        <tr><td>Mutational Signature 1</td><td>{this.progressBar("0.41", false)}</td></tr>,
                        <tr><td>Mutational Signature 2</td><td>{this.progressBar("0.31", false)}</td></tr>,
                        <tr><td>Mutational Signature 3</td><td>{this.progressBar("0.21", false)}</td></tr>
                    ]}
                />
                <hr style={{marginTop:10,marginBottom:10}}/>
                <span className="small">

                    No significant mutational signatures.
                </span>
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