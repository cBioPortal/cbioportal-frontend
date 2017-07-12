import * as React from 'react';
import {If} from 'react-if';
import * as _ from "lodash";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import OncokbPubMedCache from "shared/cache/PubMedCache";
import CancerHotspots from "shared/components/annotation/CancerHotspots";
import MyCancerGenome from "shared/components/annotation/MyCancerGenome";
import OncoKB from "shared/components/annotation/OncoKB";
import {IOncoKbData} from "shared/model/OncoKB";
import {IMyCancerGenomeData, IMyCancerGenome} from "shared/model/MyCancerGenome";
import {IHotspotData} from "shared/model/CancerHotspots";
import {ClinicalTrialCount, Mutation} from "shared/api/generated/CBioPortalAPI";
import {IndicatorQueryResp, Query} from "shared/api/generated/OncoKbAPI";
import {generateQueryVariantId, generateQueryVariant} from "shared/lib/OncoKbUtils";
import {isHotspot, is3dHotspot} from "shared/lib/AnnotationUtils";
import {ClinicalTrials} from "../../../model/ClinicalTrials";
import MolecularMatch from "../../trials/MolecularMatch";

export interface IClinicalTrialsColumnProps {
    enableMolecularMatch: boolean;
    molecularMatchData?: ClinicalTrialCount[];
}

export interface IClinicalTrial {
    isMolecularMatch: boolean;
    count: number;
   // isMatchMiner: boolean;
}


export default class ClinicalTrialsColumnFormatter
{
    public static getData(rowData:Mutation[]|undefined,
                          molecularMatchData?:ClinicalTrialCount[])
    {
        let value: IClinicalTrial;

        if (rowData) {
            const mutation = rowData[0];

            value = {
                isMolecularMatch: true,
                count: molecularMatchData ?
                    ClinicalTrialsColumnFormatter.getIndicatorData(mutation, molecularMatchData) : 0
            };
        }
        else {
            value = {
                isMolecularMatch: false,
                count: 0
            };
       }

        return value;
    }

    public static getIndicatorData(mutation:Mutation, molecularMatchData:ClinicalTrialCount[]): number
    {
        if (molecularMatchData == null) {
            return 0;
        }

        for(var c = 0 ; c < molecularMatchData.length; c++){ // clinicalTrial in
            // molecularMatchData.clinicalData){

            if(molecularMatchData[c].mutation == (mutation.gene + mutation.proteinChange)){

                return molecularMatchData[c].count;
            }
        }

        return 0;
    }


    public static renderFunction(data:Mutation[], columnProps:IClinicalTrialsColumnProps)
    {
        const trial:IClinicalTrial = ClinicalTrialsColumnFormatter.getData(
            data, columnProps.molecularMatchData);

        let evidenceQuery:Query|undefined;

        if (columnProps.molecularMatchData) {
            //evidenceQuery = this.getEvidenceQuery(data[0], columnProps.oncoKbData) || undefined;
        }

        return ClinicalTrialsColumnFormatter.mainContent(trial,
            columnProps);
    }

    public static mainContent(annotation:IClinicalTrial,
                              columnProps:IClinicalTrialsColumnProps)
    {
        return (
            <span>
                <If condition={columnProps.enableMolecularMatch || false}>
        <MolecularMatch
            count={annotation.count}
        />
        </If>
        </span>
    );
    }
}

