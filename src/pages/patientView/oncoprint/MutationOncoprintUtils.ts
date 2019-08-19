import {Mutation, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import _ from "lodash";
import {generateMutationIdByGeneAndProteinChangeAndEvent} from "../../../shared/lib/StoreUtils";
import {IGeneHeatmapTrackDatum, IGeneHeatmapTrackSpec} from "../../../shared/components/oncoprint/Oncoprint";
import {CoverageInformation} from "../../resultsView/ResultsViewPageStoreUtils";
import {isSampleProfiled} from "../../../shared/lib/isSampleProfiled";

export enum MutationStatus {
    MUTATED,
    MUTATED_BUT_NO_VAF,
    PROFILED_BUT_NOT_MUTATED,
    NOT_PROFILED
}

export interface IMutationOncoprintTrackDatum extends IGeneHeatmapTrackDatum {
    mutation:Mutation;
    mutationStatus:MutationStatus;
}

export interface IMutationOncoprintTrackSpec extends IGeneHeatmapTrackSpec {
    data:IMutationOncoprintTrackDatum[];
}

export function makeMutationHeatmapData(
    samples:Sample[],
    mutations:Mutation[],
    coverageInformation:CoverageInformation
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
            let profile_data = mutation.tumorAltCount / (mutation.tumorAltCount + mutation.tumorRefCount);
            data.push({
                profile_data:isNaN(profile_data) ? null : profile_data,
                sample: sample.sampleId,
                patient: sample.patientId,
                study_id: sample.studyId,
                hugo_gene_symbol:"", // not used by us
                mutation,
                uid,
                mutationStatus: isNaN(profile_data) ? MutationStatus.MUTATED_BUT_NO_VAF : MutationStatus.MUTATED
            });
        }

        const noData = Object.keys(mutationsByKey).filter(key=>!(key in mutationKeys))
                        .map(key=>mutationsByKey[key]);

        for (const mutation of noData) {
            const uid = generateMutationIdByGeneAndProteinChangeAndEvent(mutation);
            const isProfiledForGene = isSampleProfiled(
                sample.uniqueSampleKey,
                mutation.molecularProfileId,
                mutation.gene.hugoGeneSymbol,
                coverageInformation
            );
            data.push({
                profile_data:null,
                sample: sample.sampleId,
                patient: sample.patientId,
                study_id: sample.studyId,
                hugo_gene_symbol:"", // not used by us
                mutation,
                uid,
                mutationStatus: isProfiledForGene ? MutationStatus.PROFILED_BUT_NOT_MUTATED : MutationStatus.NOT_PROFILED,
                na: !isProfiledForGene
            });
        }
        map[sample.sampleId] = data;
        return map;
    }, {} as {[sampleId:string]:IMutationOncoprintTrackDatum[]});
}

export function getDownloadData(
    data:IMutationOncoprintTrackDatum[]
) {
    const downloadData = [];
    downloadData.push(["Sample_ID", "Gene", "Protein_Change", "Variant_Allele_Frequency"]);
    for (const datum of data) {
        if (datum.profile_data !== null) {
            downloadData.push([
                datum.sample,
                datum.mutation.gene.hugoGeneSymbol,
                datum.mutation.proteinChange,
                datum.profile_data
            ]);
        }
    }
    return downloadData.map(line=>line.join("\t")).join("\n");
}