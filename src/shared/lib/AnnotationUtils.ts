import {CosmicMutation} from "shared/api/CBioPortalAPIInternal";
import {ICosmicData} from "shared/components/mutationTable/column/CosmicColumnFormatter";
import {IMyCancerGenome, IMyCancerGenomeData} from "pages/patientView/mutation/column/AnnotationColumnFormatter";
import {HotspotMutation} from "../api/CancerHotspotsAPI";

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
    cosmicMutations.forEach(function(cosmic:CosmicMutation) {
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

    myCancerGenomes.forEach(function (myCancerGenome) {
        if (!(myCancerGenome.hugoGeneSymbol in map)) {
            map[myCancerGenome.hugoGeneSymbol] = [];
        }

        map[myCancerGenome.hugoGeneSymbol].push(myCancerGenome);
    });

    return map;
}

export function geneAndProteinPosToHotspots(hotspots:HotspotMutation[]):{[key:string]: boolean}
{
    // key: geneSymbol_proteinPosition
    // (protienPosition: start[_end])
    const map: {[key:string]: boolean} = {};

    // create a map for a faster lookup
    hotspots.forEach(function(hotspot:HotspotMutation) {
        const positions = hotspot.residue.match(/[0-9]+/g) || []; // start (and optionally end) positions
        const key = [hotspot.hugoSymbol.toUpperCase()].concat(positions).join("_");
        map[key] = true;
    });

    return map;
}