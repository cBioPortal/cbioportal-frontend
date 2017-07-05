import * as _ from 'lodash';
import {default as PdbAnnotationAPI, PdbUniprotResidueMapping} from "shared/api/generated/PdbAnnotationAPI";
import pdbAnnotationClient from "shared/api/pdbAnnotationClientInstance";
import LazyMobXCache from "shared/lib/LazyMobXCache";

export type AlignmentIdAndUniportPos = {
    alignmentId: number;
    uniprotPosition: number;
};

export async function fetchPdbPositionMappingData(positions: number[],
                                                  alignmentIds: number[],
                                                  client: PdbAnnotationAPI = pdbAnnotationClient)
{
    if (positions.length > 0 && alignmentIds.length > 0) {
        return await client.postPositionMap({
            positions: positions,
            alignments: alignmentIds
        });
    } else {
        return [];
    }
}

async function fetch(queries: AlignmentIdAndUniportPos[]): Promise<PdbUniprotResidueMapping[]>
{
    const uniqueAlignments = _.uniq(queries.map(q => q.alignmentId));
    const uniquePositions = _.uniq(queries.map(q => q.uniprotPosition));

    // TODO postPositionMap actually returns a map of <uniprotPosition: PdbUniprotResidueMapping[]>
    // so we need to flatten to match the actual promise data
    return _.flatten(_.values(await fetchPdbPositionMappingData(uniquePositions, uniqueAlignments)));

}

export default class PdbPositionMappingCache extends LazyMobXCache<PdbUniprotResidueMapping, AlignmentIdAndUniportPos> {
    constructor() {
        super(
            q => `${q.alignmentId},${q.uniprotPosition}`,
            d => `${d.alignmentId},${d.uniprotPosition}`,
            fetch
        );
    }
}
