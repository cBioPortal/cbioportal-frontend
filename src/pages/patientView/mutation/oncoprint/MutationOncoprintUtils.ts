import {Mutation, Sample} from "../../../../shared/api/generated/CBioPortalAPI";
import _ from "lodash";
import {generateMutationIdByGeneAndProteinChangeAndEvent} from "../../../../shared/lib/StoreUtils";
import {IGeneHeatmapTrackDatum, IGeneHeatmapTrackSpec} from "../../../../shared/components/oncoprint/Oncoprint";
import {CoverageInformation} from "../../../resultsView/ResultsViewPageStoreUtils";
import {isSampleProfiled} from "../../../../shared/lib/isSampleProfiled";
import {MutationStatus} from "../PatientViewMutationsTabUtils";

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
    uncalledMutations:Mutation[],
    coverageInformation:CoverageInformation
) {
    const mutationsByKey = _.keyBy(mutations, generateMutationIdByGeneAndProteinChangeAndEvent);
    const mutationsBySample = _.groupBy(mutations, m=>m.uniqueSampleKey);
    const uncalledMutationsBySample = _.groupBy(uncalledMutations, m=>m.uniqueSampleKey);

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
                mutationStatus: isNaN(profile_data) ? MutationStatus.MUTATED_BUT_NO_VAF : MutationStatus.MUTATED_WITH_VAF
            });
        }

        const uncalledSampleMutations = uncalledMutationsBySample[sample.uniqueSampleKey] || [];
        for (const mutation of uncalledSampleMutations) {
            const uid = generateMutationIdByGeneAndProteinChangeAndEvent(mutation);
            if ((uid in mutationsByKey) && (mutation.tumorAltCount > 0)) {
                // only add uncalled data if the mutation is called for some sample, and if theres supporting reads
                mutationKeys[uid] = true;
                data.push({
                    profile_data:mutation.tumorAltCount / (mutation.tumorAltCount + mutation.tumorRefCount),
                    sample: sample.sampleId,
                    patient: sample.patientId,
                    study_id: sample.studyId,
                    hugo_gene_symbol:"", // not used by us
                    mutation,
                    uid,
                    mutationStatus: MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED
                });
            }
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