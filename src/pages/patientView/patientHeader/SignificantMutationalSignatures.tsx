import * as React from "react";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import {placeArrowBottomLeft} from "shared/components/defaultTooltip/DefaultTooltip";
import SimpleTable from "shared/components/simpleTable/SimpleTable";
import {IMutationalSignature, IMutationalSignatureMeta, ISignificantMutationalSignaturesForSample} from "../../../shared/model/MutationalSignature";
import LazyMobXTable, {Column} from "shared/components/lazyMobXTable/LazyMobXTable";
import "../../../shared/components/simpleTable/styles.scss"
import {progressBar, prepareMutationalSignaturesForHeader} from "../../../shared/lib/MutationalSignaturesUtils";
import _ from 'lodash';
import {getMutationalSignaturePercentage} from "../../../shared/lib/FormatUtils";
import FontAwesome from "react-fontawesome";
import {computed} from "mobx";

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
                        <td style={{paddingTop: 3}}>{progressBar(significantMutationalSignaturesForSample.significantSignatures[significantSignatureValue].toString(), false)}</td>
                        </tr>)}
                    </table>
                }

            </div>
        );
    }
}