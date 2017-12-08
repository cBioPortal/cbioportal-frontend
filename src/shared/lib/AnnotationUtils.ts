import {CosmicMutation} from "shared/api/generated/CBioPortalAPIInternal";
import {ICosmicData} from "shared/model/Cosmic";
import {IMyCancerGenome, IMyCancerGenomeData} from "shared/model/MyCancerGenome";
import {IHotspotIndex} from "shared/model/CancerHotspots";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {isHotspot} from "./CancerHotspotsUtils";
import {Hotspot} from "../api/generated/GenomeNexusAPI";

/**
 * Utility functions related to annotation data.
 *
 * @author Selcuk Onur Sumer
 */


export function keywordToCosmic(cosmicMutations:CosmicMutation[]):ICosmicData
{
    // key: keyword
    // value: CosmicMutation[]
    const map: ICosmicData = {};

    // create a map for a faster lookup
    cosmicMutations.forEach((cosmic:CosmicMutation) => {
        if (!(cosmic.keyword in map)) {
            map[cosmic.keyword] = [];
        }

        map[cosmic.keyword].push(cosmic);
    });

    return map;
}

export function geneToMyCancerGenome(myCancerGenomes:IMyCancerGenome[]):IMyCancerGenomeData
{
    // key: hugo gene symbol
    // value: IMyCancerGenome[]
    const map:IMyCancerGenomeData = {};

    myCancerGenomes.forEach((myCancerGenome:IMyCancerGenome) => {
        if (!(myCancerGenome.hugoGeneSymbol in map)) {
            map[myCancerGenome.hugoGeneSymbol] = [];
        }

        map[myCancerGenome.hugoGeneSymbol].push(myCancerGenome);
    });

    return map;
}

export function recurrentHotspotFilter(hotspot:Hotspot) {
    // only single and indel mutations are regular hotspots
    return (hotspot.type.toLowerCase().includes("single") ||
        hotspot.type.toLowerCase().includes("indel"));
}

export function isRecurrentHotspot(mutation:Mutation, index:IHotspotIndex)
{
    return isHotspot(mutation, index, recurrentHotspotFilter);
}

export function is3dHotspot(mutation:Mutation, index:IHotspotIndex):boolean
{
    return isHotspot(mutation, index, hotspot => hotspot.type.toLowerCase().includes("3d"));
}
