import * as _ from 'lodash';
import {CosmicMutation} from "shared/api/generated/CBioPortalAPIInternal";
import {HotspotMutation} from "shared/api/generated/CancerHotspotsAPI";
import {ICosmicData} from "shared/model/Cosmic";
import {IMyCancerGenome, IMyCancerGenomeData} from "shared/model/MyCancerGenome";
import {IHotspotIndex, IHotspotLookup} from "shared/model/CancerHotspots";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import HotspotSet from "./HotspotSet";

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

export function indexHotspots(hotspots:HotspotMutation[], defaultHotspotType: string = "hotspot"): IHotspotIndex
{
    const index:IHotspotIndex = {};

    hotspots.forEach((hotspot:HotspotMutation) => {
        const geneSymbol = hotspot.hugoSymbol.toUpperCase();
        let geneIndex = index[geneSymbol];

        if (!geneIndex) {
            geneIndex = index[geneSymbol] = {};
        }

        const hotspotType = hotspot.type || defaultHotspotType;
        let lookup = geneIndex[hotspotType];

        if (!lookup)
        {
            lookup = {
                hotspotMutations: [],
                hotspotSet: new HotspotSet([]) // this is a placeholder to avoid TS errors.
                                               // overwritten by the initHotspotSets function.
            };

            geneIndex[hotspotType] = lookup;
        }

        lookup.hotspotMutations.push(hotspot);
    });

    initHotspotSets(index);

    return index;
}

export function initHotspotSets(hotspotIndex: IHotspotIndex)
{
    _.keys(hotspotIndex).forEach((geneSymbol:string) => {
        const geneIndex = hotspotIndex[geneSymbol];

        _.keys(geneIndex).forEach((hotspotType:string) => {
            const lookup = geneIndex[hotspotType];

            const intervals = lookup.hotspotMutations.map(
                (hotspot:HotspotMutation):[number, number] => {
                    // start (and optionally end) positions
                    const positions = hotspot.residue.match(/[0-9]+/g) || [];

                    let start = -1;
                    let end = -1;

                    if (positions.length > 0) {
                        start = parseInt(positions[0]);
                        end = start;
                    }

                    // overwrite end if exists
                    if (positions.length > 1) {
                        end = parseInt(positions[1]);
                    }

                    return [start, end];
                }
            );

            lookup.hotspotSet = new HotspotSet(intervals);
        });
    });
}

export function isHotspot(mutation:Mutation, index:IHotspotIndex):boolean
{
    let isHotspot = false;
    let hotspotType:string|null = null;
    const mutationType = mutation.mutationType && mutation.mutationType.toLowerCase();

    if (mutationType)
    {
        if (mutationType.indexOf("missense") > -1) {
            hotspotType = "single residue";
        }
        else if (mutationType.indexOf("inframe") > -1 ||
            mutationType.indexOf("in_frame") > -1 ||
            mutationType.indexOf("in frame") > -1)
        {
            hotspotType = "in-frame indel";
        }
    }

    if (hotspotType)
    {
        const geneSymbol = mutation.gene && mutation.gene.hugoGeneSymbol;
        const geneIndex = index[geneSymbol];

        if (geneIndex)
        {
            const lookup = geneIndex[hotspotType];

            if (lookup) {
                isHotspot = checkHotspot(mutation, lookup.hotspotSet);
            }
        }
    }

    return isHotspot;
}

export function is3dHotspot(mutation:Mutation, index:IHotspotIndex):boolean
{
    let isHotspot = false;

    const mutationType = mutation.mutationType && mutation.mutationType.toLowerCase();

    if (mutationType &&
        mutationType.indexOf("missense") > -1)
    {
        const geneSymbol = mutation.gene && mutation.gene.hugoGeneSymbol;
        const geneIndex = index[geneSymbol];

        if (geneIndex) {
            _.values(geneIndex).forEach((lookup: IHotspotLookup) => {
                isHotspot = checkHotspot(mutation, lookup.hotspotSet);
            });
        }
    }

    return isHotspot;
}

function checkHotspot(mutation: Mutation, hotspotSet: HotspotSet)
{
    let isHotspot = false;
    const start = mutation.proteinPosStart;

    // only check for valid start position values
    if (start >= 0)
    {
        // if proteinPosEnd value is not valid, use start as end
        const end = mutation.proteinPosEnd >= start ? mutation.proteinPosEnd : undefined;
        isHotspot = hotspotSet.check(start, end);
    }

    return isHotspot;
}
