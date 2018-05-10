import {Mutation} from "../../shared/api/generated/CBioPortalAPI";
import {getSimplifiedMutationType} from "../../shared/lib/oql/accessors";

//testIt
export function countMutations(mutations: Mutation[]){
    const mutationPositionIdentifiers:any = {};
    for (const mutation of mutations) {
        const key = mutationCountByPositionKey(mutation);
        mutationPositionIdentifiers[key] = {
            entrezGeneId: mutation.entrezGeneId,
            proteinPosStart: mutation.proteinPosStart,
            proteinPosEnd: mutation.proteinPosEnd
        };
    }
    return mutationPositionIdentifiers;
}

export function mutationCountByPositionKey(obj:{entrezGeneId:number, proteinPosStart:number, proteinPosEnd:number}) {
    return `${obj.entrezGeneId}_${obj.proteinPosStart}_${obj.proteinPosEnd}`;
}