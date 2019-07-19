import {Mutation, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import _ from "lodash";
import {generateMutationIdByGeneAndProteinChangeAndEvent} from "../../../shared/lib/StoreUtils";
import {IGeneHeatmapTrackDatum} from "../../../shared/components/oncoprint/Oncoprint";

export interface IMutationOncoprintTrackDatum extends IGeneHeatmapTrackDatum {
    mutation:Mutation;
}

export function makeMutationHeatmapData(
    samples:Sample[],
    mutations:Mutation[]
) {
    const mutationsByKey = _.keyBy(mutations, generateMutationIdByGeneAndProteinChangeAndEvent);
    const mutationsBySample = _.groupBy(mutations, m=>m.uniqueSampleKey);

    return samples.reduce((map, sample)=>{
        const sampleMutations = mutationsBySample[sample.uniqueSampleKey] || [];
        const mutationKeys:{[uid:string]:boolean} = {};
        const data:IMutationOncoprintTrackDatum[] = [];
        for (const mutation of sampleMutations) {
            const uid = generateMutationIdByGeneAndProteinChangeAndEvent(mutation);
            mutationKeys[uid] = true;
            const profile_data = mutation.tumorAltCount / (mutation.tumorAltCount + mutation.tumorRefCount);
            data.push({
                profile_data,
                sample: sample.sampleId,
                patient: sample.patientId,
                study_id: sample.studyId,
                hugo_gene_symbol:"", // not used by us
                mutation,
                uid,
                na:isNaN(profile_data)
            });
        }

        const noData = Object.keys(mutationsByKey).filter(key=>!(key in mutationKeys))
                        .map(key=>mutationsByKey[key]);

        for (const mutation of noData) {
            const uid = generateMutationIdByGeneAndProteinChangeAndEvent(mutation);
            data.push({
                profile_data:0,
                sample: sample.sampleId,
                patient: sample.patientId,
                study_id: sample.studyId,
                hugo_gene_symbol:"", // not used by us
                mutation,
                uid
            });
        }
        map[sample.uniqueSampleKey] = data;
        return map;
    }, {} as {[uniqueSampleKey:string]:IMutationOncoprintTrackDatum[]});
}