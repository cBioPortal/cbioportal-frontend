import * as _ from "lodash";

import genomeNexusClient from "shared/api/genomeNexusClientInstance";
import GenomeNexusAPI, {
    TranscriptConsequenceSummary, VariantAnnotation,
    VariantAnnotationSummary,
    TranscriptConsequence
} from "shared/api/generated/GenomeNexusAPI";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {uniqueGenomicLocations, genomicLocationString, extractGenomicLocation} from "./MutationUtils";
import {getMutationTypeFromProteinChange, getProteinPositionFromProteinChange} from "./ProteinChangeUtils";

export function resolveDefaultsForMissingValues(mutations: Partial<Mutation>[])
{
    // if no protein position from user input or annotator, we derive it from the protein change.
    // in case no genomic location is available we can still plot lollipop diagram using this info.
    resolveMissingProteinPositions(mutations);

    // if no mutation type from user input or annotator, we derive it from the protein change.
    resolveMissingMutationTypes(mutations);
}

/**
 * Tries resolving the protein position value from the protein change string.
 */
export function resolveMissingProteinPositions(mutations: Partial<Mutation>[])
{
    mutations.forEach(mutation => {
        if (mutation.proteinPosStart === undefined &&
            mutation.proteinPosEnd === undefined)
        {
            const proteinChange = mutation.proteinChange || mutation.aminoAcidChange;
            // derive protein start and end position from the protein change value.
            const proteinPosition = getProteinPositionFromProteinChange(proteinChange);

            if (proteinPosition) {
                mutation.proteinPosStart = proteinPosition.start;
                mutation.proteinPosEnd = proteinPosition.end;
            }
        }
    });
}

export function resolveMissingMutationTypes(mutations: Partial<Mutation>[])
{
    mutations.forEach(mutation => {
        if (!mutation.mutationType)
        {
            mutation.mutationType = getMutationTypeFromProteinChange(
                mutation.proteinChange || mutation.aminoAcidChange) || "";
        }
    });
}

export async function fetchVariantAnnotationsByMutation(mutations: Mutation[],
                                                        fields:string[] = ["annotation_summary"],
                                                        isoformOverrideSource: string = "uniprot",
                                                        client: GenomeNexusAPI = genomeNexusClient)
{
    const genomicLocations = uniqueGenomicLocations(mutations);

    const variantAnnotations = genomicLocations.length > 0 ? await client.fetchVariantAnnotationByGenomicLocationPOST(
        {
            genomicLocations,
            fields,
            isoformOverrideSource
        }
    ): [];

    return variantAnnotations;
}

export async function fetchVariantAnnotationsIndexedByGenomicLocation(mutations: Mutation[],
                                                                      fields:string[] = ["annotation_summary"],
                                                                      isoformOverrideSource: string = "uniprot",
                                                                      client: GenomeNexusAPI = genomeNexusClient)
{
    const variantAnnotations = await fetchVariantAnnotationsByMutation(mutations, fields, isoformOverrideSource, client);
    return indexAnnotationsByGenomicLocation(variantAnnotations);
}

export function annotateMutations(mutations: Mutation[],
                                  indexedVariantAnnotations: {[genomicLocation: string]: VariantAnnotation})
{
    // add annotation values by updating corresponding fields
    return mutations.map(mutation => annotateMutation(mutation, indexedVariantAnnotations));
}

/** 
 * Returns those mutations where the most significant impact on a canonical
 * transcript is affecting the given transcript id.
 * 
 * TODO: Once the comoponents downstream are improved to handle multiple
 * annotations we can change this function to return all mutations that have
 * any effect on the given transcript.
*/
export function filterMutationByTranscriptId(mutation:Mutation,
                                             ensemblTranscriptId: string,
                                             indexedVariantAnnotations: {[genomicLocation: string]: VariantAnnotation})
{
    const genomicLocation = extractGenomicLocation(mutation);
    const variantAnnotation = genomicLocation ?
        indexedVariantAnnotations[genomicLocationString(genomicLocation)] : undefined;

    if (variantAnnotation) {
        return variantAnnotation.annotation_summary.canonicalTranscriptId === ensemblTranscriptId;
    } else {
        return false;
    }
}

export function getMutationToTranscriptId(mutation:Mutation,
                                          ensemblTranscriptId: string,
                                          indexedVariantAnnotations: {[genomicLocation: string]: VariantAnnotation}): Mutation | undefined
{
    const genomicLocation = extractGenomicLocation(mutation);
    const variantAnnotation = genomicLocation ?
        indexedVariantAnnotations[genomicLocationString(genomicLocation)] : undefined;
    
    const transcriptConsequenceSummaries = variantAnnotation && 
        variantAnnotation.annotation_summary &&  
        variantAnnotation.annotation_summary.transcriptConsequenceSummaries &&  
        variantAnnotation.annotation_summary.transcriptConsequenceSummaries.filter((tc:TranscriptConsequenceSummary) => tc.transcriptId === ensemblTranscriptId);

    if (variantAnnotation && transcriptConsequenceSummaries && transcriptConsequenceSummaries.length > 0) {
        const transcriptConsequenceSummary = transcriptConsequenceSummaries[0]; // TODO: should pick most impactful one
        const annotatedMutation =  getMutationFromSummary(mutation, variantAnnotation.annotation_summary, transcriptConsequenceSummary, true);
        // ignore mutations that don't have a protein change (at some point we
        // might want to change this to include silent mutations)
        if (annotatedMutation.proteinChange && annotatedMutation.proteinChange.length > 0 && (new RegExp(/.*[A-Z].*/, "i").test(annotatedMutation.proteinChange.toLowerCase()))) {
            return annotatedMutation;
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
}

export function getMutationFromSummary(mutation:Mutation,
                                       annotationSummary:VariantAnnotationSummary,
                                       transcriptConsequenceSummary:TranscriptConsequenceSummary,
                                       overwrite:boolean)
{
    const annotatedMutation: Mutation = initAnnotatedMutation(mutation);

    // Overwrite only missing values: Do not overwrite user provided values!
    annotatedMutation.variantType = (!overwrite && annotatedMutation.variantType) || annotationSummary.variantType;

    annotatedMutation.proteinChange = (!overwrite && annotatedMutation.proteinChange) || transcriptConsequenceSummary.hgvspShort;
    // remove p. prefix if exists
    if (annotatedMutation.proteinChange) {
        annotatedMutation.proteinChange = annotatedMutation.proteinChange.replace(/^p./,"");
    }
    annotatedMutation.mutationType = (!overwrite && annotatedMutation.mutationType) || transcriptConsequenceSummary.variantClassification;

    if (transcriptConsequenceSummary.proteinPosition) {
        // TODO: make this logic more clear, lollipopplot fills in proteinstart
        // and end if it's undefined but proteinChange exists
        annotatedMutation.proteinPosStart = (!overwrite && annotatedMutation.proteinChange)? annotatedMutation.proteinPosStart : transcriptConsequenceSummary.proteinPosition.start;
        annotatedMutation.proteinPosEnd = (!overwrite && annotatedMutation.proteinChange)? annotatedMutation.proteinPosEnd : transcriptConsequenceSummary.proteinPosition.end;
    }

    annotatedMutation.gene.hugoGeneSymbol = (!overwrite && annotatedMutation.gene.hugoGeneSymbol) || transcriptConsequenceSummary.hugoGeneSymbol;

    // Entrez Gene id is critical for OncoKB annotation
    const entrezGeneId = parseInt(transcriptConsequenceSummary.entrezGeneId, 10);

    annotatedMutation.gene.entrezGeneId = annotatedMutation.gene.entrezGeneId || entrezGeneId;
    annotatedMutation.entrezGeneId = annotatedMutation.entrezGeneId || entrezGeneId;
        
    return annotatedMutation;
}

export function getMutationsToTranscriptId(mutations:Mutation[],
                                           ensemblTranscriptId: string,
                                           indexedVariantAnnotations: {[genomicLocation: string]: VariantAnnotation}): Mutation[]
{
    return _.compact(mutations.map(mutation => getMutationToTranscriptId(mutation, ensemblTranscriptId, indexedVariantAnnotations)));
}

export function filterMutationsByTranscriptId(mutations: Mutation[],
                                              ensemblTranscriptId: string,
                                              indexedVariantAnnotations: {[genomicLocation: string]: VariantAnnotation})
{
    return mutations.filter(mutation => filterMutationByTranscriptId(mutation, ensemblTranscriptId, indexedVariantAnnotations));
}

export function annotateMutation(mutation: Mutation,
                                 indexedVariantAnnotations: {[genomicLocation: string]: VariantAnnotation}): Mutation
{

    const genomicLocation = extractGenomicLocation(mutation);
    const variantAnnotation = genomicLocation ?
        indexedVariantAnnotations[genomicLocationString(genomicLocation)] : undefined;
    let canonicalTranscript:TranscriptConsequenceSummary|undefined;

    if (variantAnnotation) {
        canonicalTranscript = findCanonicalTranscript(variantAnnotation.annotation_summary);
    }

    if (variantAnnotation && canonicalTranscript) {
        return getMutationFromSummary(mutation, variantAnnotation.annotation_summary, canonicalTranscript, false);
    } else {
        return initAnnotatedMutation(mutation);
    }
}

export function initAnnotatedMutation(mutation:Mutation): Mutation
{
    const annotatedMutation: Mutation = _.cloneDeep(mutation);

    // set some default values in case annotation fails
    annotatedMutation.variantType = annotatedMutation.variantType || "";
    annotatedMutation.gene = annotatedMutation.gene || {};
    annotatedMutation.gene.hugoGeneSymbol = annotatedMutation.gene.hugoGeneSymbol || "";
    annotatedMutation.proteinChange = annotatedMutation.proteinChange || "";
    annotatedMutation.mutationType = annotatedMutation.mutationType || "";

    return annotatedMutation;
}

// TODO: figure out how this is used. We know what the canonical transcript is
// from ensembl/canonical-transcript endpoint
export function findCanonicalTranscript(annotationSummary: VariantAnnotationSummary): TranscriptConsequenceSummary|undefined
{
    let canonical: TranscriptConsequenceSummary|undefined =
        _.find(annotationSummary.transcriptConsequenceSummaries, transcriptConsequenceSummary =>
            transcriptConsequenceSummary.transcriptId === annotationSummary.canonicalTranscriptId);

    // if no transcript matching the canonical transcript id, then return the first one (if exists)
    if (!canonical) {
        canonical = annotationSummary.transcriptConsequenceSummaries.length > 0 ?
            annotationSummary.transcriptConsequenceSummaries[0] : undefined;
    }

    return canonical;
}

export function indexAnnotationsByGenomicLocation(variantAnnotations: VariantAnnotation[]): {[genomicLocation: string]: VariantAnnotation}
{
    return _.keyBy(variantAnnotations, annotation =>
        genomicLocationString(annotation.annotation_summary.genomicLocation));
}