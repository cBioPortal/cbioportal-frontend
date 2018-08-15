import * as _ from 'lodash';
import {GenePanelData, Mutation, NumericGeneMolecularData} from "../../../shared/api/generated/CBioPortalAPI";
import getCanonicalMutationType, {getProteinImpactType} from "../../../shared/lib/getCanonicalMutationType";
import {CoverageInformation} from "../ResultsViewPageStoreUtils";
import {isSampleProfiled} from "../../../shared/lib/isSampleProfiled";
import {getOncoprintMutationType} from "../../../shared/components/oncoprint/DataUtils";
import {mutationRenderPriority} from "../plots/PlotsTabUtils";
import {
    MUT_COLOR_FUSION, MUT_COLOR_INFRAME,
    MUT_COLOR_MISSENSE, MUT_COLOR_PROMOTER, MUT_COLOR_TRUNC
} from "../../../shared/components/oncoprint/geneticrules";
import {getJitterForCase} from "../../../shared/components/plots/PlotUtils";

export type ExpressionStyle = {
    typeName: string;
    symbol: string;
    fill: string;
    stroke: string;
    legendText: string;
};


export interface MolecularDataBuckets {
    mutationBuckets: { [mutationType: string]: NumericGeneMolecularData[] };
    unmutatedBucket: NumericGeneMolecularData[],
    unsequencedBucket: NumericGeneMolecularData[]
};

enum VictoryShapeType {

    circle = "circle",
    diamond = "diamond",
    plus = "plus",
    square = "square",
    star = "star",
    triangleDown = "triangleDown",
    triangleUp = "triangleUp"

}

export const ExpressionStyleSheet: { [mutationType:string]:ExpressionStyle } = {
    missense: {
        typeName: "Missense",
        symbol: VictoryShapeType.circle,
        fill: MUT_COLOR_MISSENSE,
        stroke: "#000000",
        legendText: "Missense"
    },
    inframe: {
        typeName:"Inframe",
        symbol : VictoryShapeType.circle,
        fill: MUT_COLOR_INFRAME,
        stroke : "#000000",
        legendText : "Inframe"
    },
    fusion:{
        typeName:"Fusion",
        symbol: VictoryShapeType.circle,
        fill: MUT_COLOR_FUSION,
        stroke: "#000000",
        legendText: "Fusion"
    },
    trunc:{
        typeName:"Truncating",
        symbol: VictoryShapeType.circle,
        fill: MUT_COLOR_TRUNC,
        stroke: "#000000",
        legendText: "Truncating"
    },
    promoter:{
        typeName:"Promoter",
        symbol: VictoryShapeType.circle,
        fill: MUT_COLOR_PROMOTER,
        stroke: "#000000",
        legendText: "Promoter"
    },
    one_mut: {
        typeName: "one_mut",
        symbol: VictoryShapeType.circle,
        fill: "#DBA901",
        stroke: "#886A08",
        legendText: "One Gene mutated"
    },
    both_mut: {
        typeName: "both_mut",
        symbol: VictoryShapeType.circle,
        fill: "#FF0000",
        stroke: "#B40404",
        legendText: "Both mutated"
    },
    not_showing_mut: {
        typeName: "not_showing_mut",
        symbol: VictoryShapeType.circle,
        fill: "#00AAF8",
        stroke: "#0089C6",
        legendText:"shouldnt be in legend"
    },
    non_mut: {
        typeName: "non_mut",
        symbol: VictoryShapeType.circle,
        fill: "#e3e3e3",
        stroke: "#000000",
        legendText: "Not mutated"
    },
    non_sequenced: {
        typeName: "non_sequenced",
        symbol: VictoryShapeType.circle,
        fill: "white",
        stroke: "gray",
        legendText: "Not sequenced"
    }

};

export function getExpressionStyle(mutationType: string){
    return ExpressionStyleSheet[mutationType];
}

// this function classifies molecular data by corresponding mutation type or
// non-mutated or non-sequenced status
export function getMolecularDataBuckets(studyData: NumericGeneMolecularData[],
                                 showMutations: boolean,
                                 mutationsKeyedBySampleId: { [sampleId: string]: Mutation },
                                 coverageInformation:CoverageInformation,
                                        hugoGeneSymbol:string
                                        ):MolecularDataBuckets {

    // if mutation mode is on, we want to fill buckets by mutation type (or unmutated)
    const mutationModeInteratee = (memo: MolecularDataBuckets, molecularData: NumericGeneMolecularData) => {

        const mutation = mutationsKeyedBySampleId[molecularData.uniqueSampleKey];
        if (mutation) {
            const oncoprintMutationType = getOncoprintMutationType(mutation);
            const bucket = memo.mutationBuckets[oncoprintMutationType] = memo.mutationBuckets[oncoprintMutationType] || [];
            bucket.push(molecularData);
        } else if (isSampleProfiled(molecularData.uniqueSampleKey,molecularData.molecularProfileId,
                hugoGeneSymbol, coverageInformation)) {

            memo.unmutatedBucket.push(molecularData);
        } else {
            memo.unsequencedBucket.push(molecularData);
        }
        return memo;
    };

    // if mutation mode is off, we don't care about mutation state
    const noMutationModeIteratee = (memo: MolecularDataBuckets, molecularData: NumericGeneMolecularData) => {
        memo.unmutatedBucket.push(molecularData);
        return memo;
    };

    const iteratee = (showMutations) ? mutationModeInteratee : noMutationModeIteratee;

    // populate buckets using iteratee
    const buckets = studyData.reduce(iteratee, {mutationBuckets: {}, unmutatedBucket: [], unsequencedBucket:[] });

    return buckets;

}

export function calculateJitter(uniqueSampleKey:string) {
    return getJitterForCase(uniqueSampleKey) * 0.30;
}

export function prioritizeMutations(mutations:Mutation[]){
    return _.orderBy(mutations,(mutation:Mutation)=>{
        const oncoprintMutationType = getOncoprintMutationType(mutation);
        return mutationRenderPriority[oncoprintMutationType];
    });
}

