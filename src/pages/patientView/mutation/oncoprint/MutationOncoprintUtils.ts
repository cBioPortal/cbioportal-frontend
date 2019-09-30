import {Mutation, Sample} from "../../../../shared/api/generated/CBioPortalAPI";
import _ from "lodash";
import {generateMutationIdByGeneAndProteinChangeAndEvent} from "../../../../shared/lib/StoreUtils";
import {IGeneHeatmapTrackDatum, IHeatmapTrackSpec} from "../../../../shared/components/oncoprint/Oncoprint";
import {CoverageInformation} from "../../../resultsView/ResultsViewPageStoreUtils";
import {isSampleProfiled} from "../../../../shared/lib/isSampleProfiled";
import {MutationStatus} from "../PatientViewMutationsTabUtils";
import {getVariantAlleleFrequency} from "../../../../shared/lib/MutationUtils";

export interface IMutationOncoprintTrackDatum extends IGeneHeatmapTrackDatum {
    mutation:Mutation;
    mutationStatus:MutationStatus;
}

export interface IMutationOncoprintTrackSpec extends IHeatmapTrackSpec {
    data:IMutationOncoprintTrackDatum[];
}

export function makeMutationHeatmapData(
    samples:Sample[],
    mutations:Mutation[],
    coverageInformation:CoverageInformation
) {
    const mutationsByKey = _.keyBy(mutations, generateMutationIdByGeneAndProteinChangeAndEvent);
    const mutationsBySample = _.groupBy(mutations, m=>m.uniqueSampleKey);
    const mutationHasAtLeastOneVAF = _.mapValues(mutationsByKey, ()=>false);

    const everyMutationDataBySample = samples.reduce((map, sample)=>{
        const sampleMutations = mutationsBySample[sample.uniqueSampleKey] || [];
        const mutationKeys:{[uid:string]:boolean} = {};
        const data:IMutationOncoprintTrackDatum[] = [];
        for (const mutation of sampleMutations) {
            const uid = generateMutationIdByGeneAndProteinChangeAndEvent(mutation);
            const isUncalled = mutation.mutationStatus.toLowerCase() === "uncalled";
            if (!isUncalled || mutation.tumorAltCount > 0) {
                mutationKeys[uid] = true;
                let vaf = getVariantAlleleFrequency(mutation);

                let mutationStatus;
                if (isUncalled) {
                    mutationStatus = MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED;
                } else if (vaf === null) {
                    mutationStatus = MutationStatus.MUTATED_BUT_NO_VAF;
                } else {
                    mutationStatus = MutationStatus.MUTATED_WITH_VAF;
                    mutationHasAtLeastOneVAF[uid] = true;
                }

                data.push({
                    profile_data:vaf,
                    sample: sample.sampleId,
                    patient: sample.patientId,
                    study_id: sample.studyId,
                    hugo_gene_symbol:"", // not used by us
                    mutation,
                    uid,
                    mutationStatus
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

    // filter out data for mutations where none of them have data
    return _.mapValues(everyMutationDataBySample, mutationData=>{
        return mutationData.filter(d=>mutationHasAtLeastOneVAF[d.uid]);
    });
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