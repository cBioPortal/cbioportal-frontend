import * as React from 'react';
import {If} from 'react-if';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {IndicatorQueryResp, Query} from "shared/api/generated/OncoKbAPI";
import MolecularMatch from "../../trials/MolecularMatch";

export interface IClinicalTrialsColumnProps {
    enableMolecularMatch: boolean;
    molecularMatchData?: string;
}

export interface IClinicalTrial {
    isMolecularMatch: boolean;
    count: number | null | undefined;
    trials: any[] | null | undefined;
   // isMatchMiner: boolean;
}


export default class ClinicalTrialsColumnFormatter
{
    public static getData(rowData:Mutation[]|undefined,
                          molecularMatchData?:string)
    {
        let value: IClinicalTrial;

        if (rowData) {
            const mutation = rowData[0];

            value = {
                isMolecularMatch: true,
                count: molecularMatchData ?
                    ClinicalTrialsColumnFormatter.getIndicatorData(mutation, molecularMatchData, true) : undefined,
                trials: molecularMatchData ?
                    ClinicalTrialsColumnFormatter.getIndicatorData(mutation, molecularMatchData, false) : undefined
            };
        }
        else {
            value = {
                isMolecularMatch: false,
                count: undefined,
                trials: undefined
            };
       }

        return value;
    }

    public static getIndicatorData(mutation:Mutation, molecularMatchData:any, isCount:boolean): any | null
    {
        if (molecularMatchData == null) {
            return null;
        }

        // console.log("$$$$$$$$$$$$$$$$$$$$$$$$$ " + molecularMatchData);
        var dataArr = JSON.parse(molecularMatchData);

        for (var data in dataArr){
            if (dataArr.hasOwnProperty(data)) {
                console.log("$$$$$$$$$$$$$$$$$$$$$$" +dataArr[data].mutation);
                console.log("$$$$$$$$$$$$$$$$$$$$$$" +dataArr[data].count);
                if(dataArr[data].mutation == mutation.gene.hugoGeneSymbol){

                    if(isCount){
                        return dataArr[data].count as number;
                    }
                    else{
                        console.log("$$$$$$$$$$$$$$$$$$$$$$" +JSON.stringify(dataArr[data].trials));

                        return JSON.stringify(dataArr[data].trials);
                    }
                }
            }
            // if(data"id") == (mutation.gene.hugoGeneSymbol))
            // if(key == (mutation.gene.hugoGeneSymbol)){ //+ " " + mutation.proteinChange
            //     return molecularMatchData[key] as number;
            // }
        }
        // molecularMatchData.forEach((object ke) => {
        //     if(key == (mutation.gene.hugoGeneSymbol)){ //+ " " + mutation.proteinChange
        //         return value;
        //     }
        //     console.log(key, value);
        // });

        return null;
    }


    public static renderFunction(data:Mutation[], columnProps:IClinicalTrialsColumnProps)
    {
        const trial:IClinicalTrial = ClinicalTrialsColumnFormatter.getData(
            data, columnProps.molecularMatchData);

        // let evidenceQuery:Query|undefined;

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
            trials={annotation.trials}
        />
        </If>
        </span>
    );
    }
}

