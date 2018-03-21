import * as _ from 'lodash';
import {GenePanelData, Mutation, NumericGeneMolecularData} from "../../../shared/api/generated/CBioPortalAPI";
import getCanonicalMutationType, {getProteinImpactType} from "../../../shared/lib/getCanonicalMutationType";
import {CoverageInformation} from "../ResultsViewPageStoreUtils";
import {isSampleProfiled} from "../../../shared/lib/isSampleProfiled";

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
    frameshift: {
        typeName: "Frameshift",
        symbol: VictoryShapeType.triangleDown,
        fill: "#1C1C1C",
        stroke: "#B40404",
        legendText: "Frameshift"
    },
    nonsense: {
        typeName: "Nonsense",
        symbol: VictoryShapeType.diamond,
        fill: "#1C1C1C",
        stroke: "#B40404",
        legendText: "Nonsense"
    },
    splice: {
        typeName: "Splice",
        symbol: VictoryShapeType.triangleUp,
        fill: "#A4A4A4",
        stroke: "#B40404",
        legendText: "Splice"
    },
    in_frame: {
        typeName: "In_frame",
        symbol: VictoryShapeType.square,
        fill: "#DF7401",
        stroke: "#B40404",
        legendText: "In-frame"
    },
    nonstart: {
        typeName: "Nonstart",
        symbol: VictoryShapeType.plus,
        fill: "#DF7401",
        stroke: "#B40404",
        legendText: "Nonstart"
    },
    nonstop: {
        typeName: "Nonstop",
        symbol: VictoryShapeType.triangleUp,
        fill: "#1C1C1C",
        stroke: "#B40404",
        legendText: "Nonstop"
    },
    missense: {
        typeName: "Missense",
        symbol: VictoryShapeType.circle,
        fill: "#DF7401",
        stroke: "#B40404",
        legendText: "Missense"
    },
    other: {
        typeName: "Other",
        symbol: VictoryShapeType.square,
        fill: "#1C1C1C",
        stroke: "#B40404",
        legendText: "Other"
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
    non_mut: {
        typeName: "non_mut",
        symbol: VictoryShapeType.circle,
        fill: "#00AAF8",
        stroke: "#0089C6",
        legendText: "No Mutation"
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
    const mappedType = mutationVocabularyMap[mutationType] || 'other';
    return ExpressionStyleSheet[mappedType] || ExpressionStyleSheet.other;
}


export const mutationVocabularyMap: { [key:string] : string } = {
    "5'flank": "other",
    "complex_indel": "other",
    "essential_splice_site": "splice",
    "exon skipping": "other",
    "exon14skip": "other",
    "frame_shift_del": "frameshift",
    "frame_shift_ins": "frameshift",
    "frameshift": "frameshift",
    "frameshift deletion": "frameshift",
    "frameshift insertion": "frameshift",
    "frameshift_coding": "frameshift",
    "frameshift_insertion": "frameshift",
    "fusion": "other",
    "in_frame_del": "in_frame",
    "in_frame_ins": "in_frame",
    "missense": "missense",
    "missense_mutation": "missense",
    "nonsense": "nonsense",
    "nonsense_mutation": "nonsense",
    "nonstop_mutation": "nonstop",
    "splice": "splice",
    "splice_site": "splice",
    "splice_site_snp": "splice",
    "splicing": "splice",
    "translation_start_site": "nonstart",
    "viii deletion": "other"
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
            const canonicalMutationType = getCanonicalMutationType(mutation.mutationType) || "other";
            const bucket = memo.mutationBuckets[canonicalMutationType] = memo.mutationBuckets[canonicalMutationType] || [];
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


function getRandomNumber(seed:number) {
    // source: https://stackoverflow.com/a/23304189
    seed = Math.sin(seed)*10000;
    return seed - Math.floor(seed);
}

// private jitter(seed:number) {
//     // receive seed so jitter for same number is always the same
//     return varianceSize * (getRandomNumber(seed) - getRandomNumber(seed+1));
// }

export function calculateJitter(boxWidth: number, seed:number){
    return (getRandomNumber(seed) - getRandomNumber(seed+1)) * 0.30;
    //return (Math.random()-0.5)*0.45;

}


const mutRenderPriority = {
    truncating: 1,
    inframe: 2,
    missense: 3,
    other : 4
};

export function prioritizeMutations(mutations:Mutation[]){
    return _.orderBy(mutations,(mutation:Mutation)=>{
        const impactType = getProteinImpactType(mutation.mutationType);
        return mutRenderPriority[impactType] || 10;
    })
}
