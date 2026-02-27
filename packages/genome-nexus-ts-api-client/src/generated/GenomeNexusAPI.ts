import * as request from "superagent";
import {
    SuperAgentStatic
} from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
type AggregateSourceInfo = {
    'annotationSourcesInfo' ? : Array < SourceVersionInfo >
        | SourceVersionInfo

    'genomeNexus' ? : GenomeNexusInfo

    'vep' ? : VEPInfo

};
type AlleleCount = {
    'ac': number

    'ac_afr': number

    'ac_amr': number

    'ac_asj': number

    'ac_eas': number

    'ac_fin': number

    'ac_nfe': number

    'ac_oth': number

    'ac_sas': number

};
type AlleleFrequency = {
    'af': number

    'af_afr': number

    'af_amr': number

    'af_asj': number

    'af_eas': number

    'af_fin': number

    'af_nfe': number

    'af_oth': number

    'af_sas': number

};
type AlleleNumber = {
    'an': number

    'an_afr': number

    'an_amr': number

    'an_asj': number

    'an_eas': number

    'an_fin': number

    'an_nfe': number

    'an_oth': number

    'an_sas': number

};
type Alleles = {
    'allele' ? : string

};
type AlphaMissense = {
    'pathogenicity' ? : string

    'score' ? : number

};
type ArticleAbstract = {
    'abstract' ? : string

    'link' ? : string

};
type Citations = {
    'abstracts' ? : Array < ArticleAbstract >
        | ArticleAbstract

    'pmids' ? : Array < string >
        | string

};
type Clinvar = {
    'alternateAllele' ? : string

    'chromosome' ? : string

    'clinicalSignificance' ? : string

    'clinvarId' ? : number

    'conflictingClinicalSignificance' ? : string

    'endPosition' ? : number

    'referenceAllele' ? : string

    'startPosition' ? : number

};
type ClinvarAnnotation = {
    'annotation' ? : Clinvar

};
type ColocatedVariant = {
    'dbSnpId' ? : string

    'gnomad_nfe_allele': string

    'gnomad_nfe_maf': string

    'gnomad_afr_allele': string

    'gnomad_afr_maf': string

    'gnomad_eas_allele': string

    'gnomad_eas_maf': string

};
type Cosmic = {
    'alt' ? : string

    'chrom' ? : string

    'cosmicId' ? : string

    'hg19' ? : Hg19

    'license' ? : string

    'mutFreq' ? : number

    'mutNt' ? : string

    'ref' ? : string

    'tumorSite' ? : string

};
type CountByTumorType = {
    'tumorType' ? : string

    'tumorTypeCount' ? : number

    'variantCount' ? : number

};
type Dbsnp = {
    '_class' ? : string

    'alleleOrigin' ? : string

    'alleles' ? : Array < Alleles >
        | Alleles

    'alt' ? : string

    'chrom' ? : string

    'dbsnpBuild' ? : number

    'flags' ? : Array < string >
        | string

    'hg19' ? : Hg19

    'license' ? : string

    'ref' ? : string

    'rsid' ? : string

    'validated' ? : boolean

    'varSubtype' ? : string

    'vartype' ? : string

};
type Drug = {
    'drugName' ? : string

    'ncitCode' ? : string

    'synonyms' ? : Array < string >
        | string

    'uuid' ? : string

};
type EnsemblFilter = {
    'geneIds' ? : Array < string >
        | string

    'hugoSymbols' ? : Array < string >
        | string

    'proteinIds' ? : Array < string >
        | string

    'transcriptIds' ? : Array < string >
        | string

};
type EnsemblGene = {
    'geneId': string

    'hugoSymbol': string

    'synonyms' ? : Array < string >
        | string

    'previousSymbols' ? : Array < string >
        | string

    'entrezGeneId' ? : string

};
type EnsemblTranscript = {
    'uniprotId' ? : string

    'transcriptId': string

    'transcriptIdVersion' ? : string

    'geneId': string

    'proteinId': string

    'proteinLength' ? : number

    'pfamDomains' ? : Array < PfamDomainRange >
        | PfamDomainRange

    'hugoSymbols' ? : Array < string >
        | string

    'refseqMrnaId' ? : string

    'ccdsId' ? : string

    'exons' ? : Array < Exon >
        | Exon

    'utrs' ? : Array < UntranslatedRegion >
        | UntranslatedRegion

};
type Exon = {
    'exonId': string

    'exonStart': number

    'exonEnd': number

    'rank': number

    'strand': number

    'version': number

};
type Gene = {
    'geneId' ? : string

    'symbol' ? : string

};
type GeneXref = {
    'db_display_name': string

    'dbname': string

    'description': string

    'display_id': string

    'ensemblGeneId' ? : string

    'info_text' ? : string

    'info_types' ? : string

    'primary_id': string

    'synonyms' ? : Array < string >
        | string

    'version': string

};
type GeneralPopulationStats = {
    'counts' ? : SignalPopulationStats

    'frequencies' ? : SignalPopulationStats

};
type GenomeNexusInfo = {
    'database' ? : Version

    'server' ? : Version

};
type GenomicLocation = {
    'chromosome': string

    'start': number

    'end': number

    'referenceAllele': string

    'variantAllele': string

};
type Gnomad = {
    'alleleCount' ? : AlleleCount

    'alleleFrequency' ? : AlleleFrequency

    'alleleNumber' ? : AlleleNumber

    'homozygotes' ? : Homozygotes

};
type Hg19 = {
    'end' ? : number

    'start' ? : number

};
type Hg38 = {
    'end' ? : string

    'start' ? : string

};
type Hgvs = {
    'coding' ? : Array < string >
        | string

    'genomic' ? : Array < string >
        | string

    'protein' ? : Array < string >
        | string

};
type Homozygotes = {
    'hom': number

    'hom_afr': number

    'hom_amr': number

    'hom_asj': number

    'hom_eas': number

    'hom_fin': number

    'hom_nfe': number

    'hom_oth': number

    'hom_sas': number

};
type Hotspot = {
    'hugoSymbol' ? : string

    'inframeCount' ? : number

    'missenseCount' ? : number

    'residue' ? : string

    'spliceCount' ? : number

    'transcriptId' ? : string

    'transcriptIdVersion' ? : string

    'truncatingCount' ? : number

    'tumorCount' ? : number

    'type' ? : string

};
type HotspotAnnotation = {
    'annotation' ? : Array < Array < Hotspot >
        | Hotspot

        >
        | Array < Hotspot >
        | Hotspot

    'license' ? : string

};
type HrdScore = {
    'fractionLoh' ? : number

    'lst' ? : number

    'ntelomericAi' ? : number

};
type Implication = {
    'abstracts' ? : Array < ArticleAbstract >
        | ArticleAbstract

    'alterations' ? : Array < string >
        | string

    'description' ? : string

    'levelOfEvidence' ? : "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

    'pmids' ? : Array < string >
        | string

    'tumorType' ? : TumorType

};
type IndicatorQueryResp = {
    'alleleExist' ? : boolean

    'dataVersion' ? : string

    'diagnosticImplications' ? : Array < Implication >
        | Implication

    'diagnosticSummary' ? : string

    'geneExist' ? : boolean

    'geneSummary' ? : string

    'highestDiagnosticImplicationLevel' ? : "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

    'highestFdaLevel' ? : "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

    'highestPrognosticImplicationLevel' ? : "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

    'highestResistanceLevel' ? : "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

    'highestSensitiveLevel' ? : "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

    'hotspot' ? : boolean

    'lastUpdate' ? : string

    'mutationEffect' ? : MutationEffectResp

    'oncogenic' ? : string

    'otherSignificantResistanceLevels' ? : Array < "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO" >
        | "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

    'otherSignificantSensitiveLevels' ? : Array < "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO" >
        | "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

    'prognosticImplications' ? : Array < Implication >
        | Implication

    'prognosticSummary' ? : string

    'query' ? : Query

    'treatments' ? : Array < IndicatorQueryTreatment >
        | IndicatorQueryTreatment

    'tumorTypeSummary' ? : string

    'variantExist' ? : boolean

    'variantSummary' ? : string

    'vus' ? : boolean

};
type IndicatorQueryTreatment = {
    'abstracts' ? : Array < ArticleAbstract >
        | ArticleAbstract

    'alterations' ? : Array < string >
        | string

    'approvedIndications' ? : Array < string >
        | string

    'description' ? : string

    'drugs' ? : Array < Drug >
        | Drug

    'fdaLevel' ? : "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

    'level' ? : "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

    'levelAssociatedCancerType' ? : TumorType

    'levelExcludedCancerTypes' ? : Array < TumorType >
        | TumorType

    'pmids' ? : Array < string >
        | string

};
type IntegerRange = {
    'end' ? : number

    'start' ? : number

};
type IntergenicConsequenceSummary = {
    'consequenceTerms' ? : Array < string >
        | string

    'impact' ? : string

    'variantAllele' ? : string

    'variantClassification' ? : string

};
type IntergenicConsequences = {
    'impact': string

    'variantAllele': string

    'consequenceTerms': Array < string >
        | string

};
type MainType = {
    'id' ? : number

    'name' ? : string

    'tumorForm' ? : "SOLID" | "LIQUID" | "MIXED"

};
type MutationAssessor = {
    'functionalImpactPrediction' ? : string

    'functionalImpactScore' ? : number

    'hgvspShort' ? : string

    'mav' ? : number

    'msa' ? : string

    'sv' ? : number

    'uniprotId' ? : string

};
type MutationEffectResp = {
    'citations' ? : Citations

    'description' ? : string

    'knownEffect' ? : string

};
type Mutdb = {
    'alt' ? : string

    'chrom' ? : string

    'cosmicId' ? : string

    'hg19' ? : Hg19

    'mutpredScore' ? : number

    'ref' ? : string

    'rsid' ? : string

    'uniprotId' ? : string

};
type MyVariantInfo = {
    'clinVar' ? : MyVariantInfoClinVar

    'cosmic' ? : Cosmic

    'dbsnp' ? : Dbsnp

    'gnomadExome' ? : Gnomad

    'gnomadGenome' ? : Gnomad

    'hgvs' ? : string

    'mutdb' ? : Mutdb

    'query' ? : string

    'snpeff' ? : Snpeff

    'variant' ? : string

    'vcf' ? : Vcf

    'version' ? : number

};
type MyVariantInfoAnnotation = {
    'annotation' ? : MyVariantInfo

    'license' ? : string

};
type MyVariantInfoClinVar = {
    'alleleId' ? : number

    'alt' ? : string

    'chrom' ? : string

    'cytogenic' ? : string

    'gene' ? : Gene

    'hg19' ? : Hg19

    'hg38' ? : Hg38

    'hgvs' ? : Hgvs

    'license' ? : string

    'rcv' ? : Array < Rcv >
        | Rcv

    'variantId' ? : number

};
type NucleotideContext = {
    'hgvs' ? : string

    'id' ? : string

    'molecule' ? : string

    'query' ? : string

    'seq': string

};
type NucleotideContextAnnotation = {
    'annotation' ? : NucleotideContext

    'license' ? : string

};
type OncokbAnnotation = {
    'annotation' ? : IndicatorQueryResp

    'license' ? : string

};
type PdbHeader = {
    'compound' ? : {}

    'pdbId': string

    'source' ? : {}

    'title': string

};
type PfamDomain = {
    'description' ? : string

    'name': string

    'pfamAccession': string

};
type PfamDomainRange = {
    'pfamDomainId': string

    'pfamDomainStart': number

    'pfamDomainEnd': number

};
type PostTranslationalModification = {
    'ensemblTranscriptIds' ? : Array < string >
        | string

    'position' ? : number

    'pubmedIds' ? : Array < string >
        | string

    'sequence' ? : string

    'type' ? : string

    'uniprotAccession' ? : string

    'uniprotEntry' ? : string

};
type PtmAnnotation = {
    'annotation' ? : Array < Array < PostTranslationalModification >
        | PostTranslationalModification

        >
        | Array < PostTranslationalModification >
        | PostTranslationalModification

    'license' ? : string

};
type PtmFilter = {
    'transcriptIds' ? : Array < string >
        | string

};
type Query = {
    'alteration' ? : string

    'alterationType' ? : string

    'consequence' ? : string

    'entrezGeneId' ? : number

    'hgvs' ? : string

    'hugoSymbol' ? : string

    'id' ? : string

    'proteinEnd' ? : number

    'proteinStart' ? : number

    'referenceGenome' ? : "GRCh37" | "GRCh38"

    'svType' ? : "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION" | "UNKNOWN"

    'tumorType' ? : string

};
type Rcv = {
    'accession' ? : string

    'clinicalSignificance' ? : string

    'origin' ? : string

    'preferredName' ? : string

};
type SignalAnnotation = {
    'annotation' ? : Array < SignalMutation >
        | SignalMutation

    'license' ? : string

};
type SignalMutation = {
    'biallelicCountsByTumorType' ? : Array < CountByTumorType >
        | CountByTumorType

    'chromosome' ? : string

    'countsByTumorType' ? : Array < CountByTumorType >
        | CountByTumorType

    'endPosition' ? : number

    'generalPopulationStats' ? : GeneralPopulationStats

    'hugoGeneSymbol' ? : string

    'mskExperReview' ? : boolean

    'mutationStatus' ? : string

    'overallNumberOfGermlineHomozygous' ? : number

    'pathogenic' ? : string

    'penetrance' ? : string

    'qcPassCountsByTumorType' ? : Array < CountByTumorType >
        | CountByTumorType

    'referenceAllele' ? : string

    'startPosition' ? : number

    'statsByTumorType' ? : Array < StatsByTumorType >
        | StatsByTumorType

    'variantAllele' ? : string

};
type SignalPopulationStats = {
    'afr' ? : number

    'asj' ? : number

    'asn' ? : number

    'eur' ? : number

    'impact' ? : number

    'oth' ? : number

};
type Snpeff = {
    'license' ? : string

};
type SourceVersionInfo = {
    'description' ? : string

    'id' ? : string

    'name' ? : string

    'type' ? : string

    'url' ? : string

    'version' ? : string

};
type StatsByTumorType = {
    'ageAtDx' ? : number

    'fBiallelic' ? : number

    'fCancerTypeCount' ? : number

    'hrdScore' ? : HrdScore

    'msiScore' ? : number

    'nCancerTypeCount' ? : number

    'numberOfGermlineHomozygous' ? : number

    'numberWithSig' ? : number

    'tmb' ? : number

    'tumorType' ? : string

};
type TranscriptConsequence = {
    'alphaMissense' ? : AlphaMissense

    'amino_acids' ? : string

    'canonical' ? : string

    'codons' ? : string

    'consequence_terms' ? : Array < string >
        | string

    'exon' ? : string

    'gene_id' ? : string

    'gene_symbol' ? : string

    'hgnc_id' ? : string

    'hgvsc' ? : string

    'hgvsg' ? : string

    'hgvsp' ? : string

    'polyphen_prediction' ? : string

    'polyphen_score' ? : number

    'protein_end' ? : number

    'protein_id' ? : string

    'protein_start' ? : number

    'refseq_transcript_ids' ? : Array < string >
        | string

    'sift_prediction' ? : string

    'sift_score' ? : number

    'transcript_id': string

    'transcript_id_version' ? : string

    'uniprotId' ? : string

    'variant_allele' ? : string

};
type TranscriptConsequenceSummary = {
    'alphaMissense' ? : AlphaMissense

    'aminoAcidAlt' ? : string

    'aminoAcidRef' ? : string

    'aminoAcids' ? : string

    'codonChange' ? : string

    'consequenceTerms' ? : string

    'entrezGeneId' ? : string

    'exon' ? : string

    'hgvsc' ? : string

    'hgvsp' ? : string

    'hgvspShort' ? : string

    'hugoGeneSymbol' ? : string

    'isVue' ? : boolean

    'polyphenPrediction' ? : string

    'polyphenScore' ? : number

    'proteinPosition' ? : IntegerRange

    'refSeq' ? : string

    'siftPrediction' ? : string

    'siftScore' ? : number

    'transcriptId': string

    'transcriptIdVersion' ? : string

    'uniprotId' ? : string

    'variantClassification' ? : string

};
type TumorType = {
    'children' ? : {}

    'code' ? : string

    'color' ? : string

    'id' ? : number

    'level' ? : number

    'mainType' ? : MainType

    'name' ? : string

    'parent' ? : string

    'tissue' ? : string

    'tumorForm' ? : "SOLID" | "LIQUID" | "MIXED"

};
type UntranslatedRegion = {
    'type': string

    'start': number

    'end': number

    'strand': number

};
type VEPInfo = {
    'cache' ? : Version

    'comment' ? : string

    'server' ? : Version

};
type VariantAnnotation = {
    'allele_string' ? : string

    'annotationJSON' ? : string

    'annotation_summary' ? : VariantAnnotationSummary

    'assembly_name' ? : string

    'clinvar' ? : ClinvarAnnotation

    'colocatedVariants' ? : Array < ColocatedVariant >
        | ColocatedVariant

    'end' ? : number

    'errorMessage' ? : string

    'genomicLocationExplanation' ? : string

    'hgvsg' ? : string

    'hotspots' ? : HotspotAnnotation

    'id': string

    'intergenic_consequences': Array < IntergenicConsequences >
        | IntergenicConsequences

    'most_severe_consequence' ? : string

    'mutation_assessor' ? : MutationAssessor

    'my_variant_info' ? : MyVariantInfoAnnotation

    'nucleotide_context' ? : NucleotideContextAnnotation

    'oncokb' ? : OncokbAnnotation

    'originalVariantQuery': string

    'ptms' ? : PtmAnnotation

    'seq_region_name' ? : string

    'signalAnnotation' ? : SignalAnnotation

    'start' ? : number

    'strand' ? : number

    'successfully_annotated' ? : boolean

    'transcript_consequences' ? : Array < TranscriptConsequence >
        | TranscriptConsequence

    'variant': string

};
type VariantAnnotationSummary = {
    'alphaMissense' ? : AlphaMissense

    'assemblyName' ? : string

    'canonicalTranscriptId' ? : string

    'genomicLocation' ? : GenomicLocation

    'intergenicConsequenceSummaries' ? : Array < IntergenicConsequenceSummary >
        | IntergenicConsequenceSummary

    'strandSign' ? : string

    'transcriptConsequenceSummaries': Array < TranscriptConsequenceSummary >
        | TranscriptConsequenceSummary

    'transcriptConsequenceSummary': TranscriptConsequenceSummary

    'transcriptConsequences': Array < TranscriptConsequenceSummary >
        | TranscriptConsequenceSummary

    'variant': string

    'variantType' ? : string

    'vues' ? : Vues

};
type Vcf = {
    'alt' ? : string

    'position' ? : string

    'ref' ? : string

};
type Version = {
    'static' ? : boolean

    'version' ? : string

};
type VueReference = {
    'pubmedId' ? : number

    'referenceText' ? : string

};
type Vues = {
    'comment' ? : string

    'confirmed' ? : boolean

    'context' ? : string

    'defaultEffect' ? : string

    'genomicLocation' ? : string

    'genomicLocationDescription' ? : string

    'hugoGeneSymbol' ? : string

    'mutationOrigin' ? : string

    'references' ? : Array < VueReference >
        | VueReference

    'revisedProteinEffect' ? : string

    'revisedVariantClassification' ? : string

    'revisedVariantClassificationStandard' ? : string

    'transcriptId' ? : string

    'variant' ? : string

    'vepPredictedProteinEffect' ? : string

    'vepPredictedVariantClassification' ? : string

};

type Logger = {
    log: (line: string) => any
};

/**
 * This page shows how to use HTTP requests to access the Genome Nexus API. There are more high level clients available in Python, R, JavaScript, TypeScript and various other languages as well as a command line client to annotate MAF and VCF. See https://docs.genomenexus.org/api.

Aside from programmatic clients there are web based tools to annotate variants, see https://docs.genomenexus.org/tools.

 We currently only provide long-term support for the '/annotation' endpoint. The other endpoints might change.
 * @class GenomeNexusAPI
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class GenomeNexusAPI {

    private domain: string = "";
    private errorHandlers: CallbackHandler[] = [];

    constructor(domain ? : string, private logger ? : Logger) {
        if (domain) {
            this.domain = domain;
        }
    }

    getDomain() {
        return this.domain;
    }

    addErrorHandler(handler: CallbackHandler) {
        this.errorHandlers.push(handler);
    }

    private request(method: string, url: string, body: any, headers: any, queryParameters: any, form: any, reject: CallbackHandler, resolve: CallbackHandler) {
        if (this.logger) {
            this.logger.log(`Call ${method} ${url}`);
        }

        let req = (request as SuperAgentStatic)(method, url).query(queryParameters);

        Object.keys(headers).forEach(key => {
            req.set(key, headers[key]);
        });

        if (body) {
            req.send(body);
        }

        if (typeof(body) === 'object' && !(body.constructor.name === 'Buffer')) {
            req.set('Content-Type', 'application/json');
        }

        if (Object.keys(form).length > 0) {
            req.type('form');
            req.send(form);
        }

        req.end((error, response) => {
            if (error || !response.ok) {
                reject(error);
                this.errorHandlers.forEach(handler => handler(error));
            } else {
                resolve(response);
            }
        });
    }

    fetchVariantAnnotationPOSTURL(parameters: {
        'variants': Array < string >
            | string

            ,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation';

        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['token'] !== undefined) {
            queryParameters['token'] = parameters['token'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        queryParameters = {};

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves VEP annotation for the provided list of variants
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationPOST
     * @param {} variants - List of variants. For example ["X:g.66937331T>A","17:g.41242962_41242963insGA"] (GRCh37) or ["1:g.182712A>C", "2:g.265023C>T", "3:g.319781del", "19:g.110753dup", "1:g.1385015_1387562del"] (GRCh38)
     * @param {string} isoformOverrideSource - Isoform override source. For example mskcc
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationPOST(parameters: {
        'variants': Array < string >
            | string

            ,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['variants'] !== undefined) {
                body = parameters['variants'];
            }

            if (parameters['variants'] === undefined) {
                reject(new Error('Missing required  parameter: variants'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
            }

            if (parameters['token'] !== undefined) {
                queryParameters['token'] = parameters['token'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            form = queryParameters;
            queryParameters = {};

            this.request('POST', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchVariantAnnotationByIdPOSTURL(parameters: {
        'variantIds': Array < string >
            | string

            ,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/dbsnp/';

        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['token'] !== undefined) {
            queryParameters['token'] = parameters['token'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        queryParameters = {};

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves VEP annotation for the provided list of dbSNP ids
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationByIdPOST
     * @param {} variantIds - List of variant IDs. For example ["rs116035550"]
     * @param {string} isoformOverrideSource - Isoform override source. For example mskcc
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationByIdPOST(parameters: {
        'variantIds': Array < string >
            | string

            ,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/dbsnp/';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['variantIds'] !== undefined) {
                body = parameters['variantIds'];
            }

            if (parameters['variantIds'] === undefined) {
                reject(new Error('Missing required  parameter: variantIds'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
            }

            if (parameters['token'] !== undefined) {
                queryParameters['token'] = parameters['token'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            form = queryParameters;
            queryParameters = {};

            this.request('POST', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchVariantAnnotationByIdGETURL(parameters: {
        'variantId': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/dbsnp/{variantId}';

        path = path.replace('{variantId}', `${parameters['variantId']}`);
        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['token'] !== undefined) {
            queryParameters['token'] = parameters['token'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves VEP annotation for the give dbSNP id
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationByIdGET
     * @param {string} variantId - dbSNP id. For example rs116035550.
     * @param {string} isoformOverrideSource - Isoform override source. For example mskcc
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationByIdGET(parameters: {
        'variantId': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/dbsnp/{variantId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{variantId}', `${parameters['variantId']}`);

            if (parameters['variantId'] === undefined) {
                reject(new Error('Missing required  parameter: variantId'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
            }

            if (parameters['token'] !== undefined) {
                queryParameters['token'] = parameters['token'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchVariantAnnotationByGenomicLocationPOSTURL(parameters: {
        'genomicLocations': Array < GenomicLocation >
            | GenomicLocation

            ,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/genomic';

        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['token'] !== undefined) {
            queryParameters['token'] = parameters['token'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        queryParameters = {};

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves VEP annotation for the provided list of genomic locations
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationByGenomicLocationPOST
     * @param {} genomicLocations - List of Genomic Locations
     * @param {string} isoformOverrideSource - Isoform override source. For example mskcc
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationByGenomicLocationPOST(parameters: {
        'genomicLocations': Array < GenomicLocation >
            | GenomicLocation

            ,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/genomic';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genomicLocations'] !== undefined) {
                body = parameters['genomicLocations'];
            }

            if (parameters['genomicLocations'] === undefined) {
                reject(new Error('Missing required  parameter: genomicLocations'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
            }

            if (parameters['token'] !== undefined) {
                queryParameters['token'] = parameters['token'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            form = queryParameters;
            queryParameters = {};

            this.request('POST', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchVariantAnnotationByGenomicLocationGETURL(parameters: {
        'genomicLocation': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/genomic/{genomicLocation}';

        path = path.replace('{genomicLocation}', `${parameters['genomicLocation']}`);
        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['token'] !== undefined) {
            queryParameters['token'] = parameters['token'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves VEP annotation for the provided genomic location
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationByGenomicLocationGET
     * @param {string} genomicLocation - A genomic location. For example 7,140453136,140453136,A,T
     * @param {string} isoformOverrideSource - Isoform override source. For example mskcc
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationByGenomicLocationGET(parameters: {
        'genomicLocation': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/genomic/{genomicLocation}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{genomicLocation}', `${parameters['genomicLocation']}`);

            if (parameters['genomicLocation'] === undefined) {
                reject(new Error('Missing required  parameter: genomicLocation'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
            }

            if (parameters['token'] !== undefined) {
                queryParameters['token'] = parameters['token'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchVariantAnnotationGETURL(parameters: {
        'variant': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/{variant}';

        path = path.replace('{variant}', `${parameters['variant']}`);
        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['token'] !== undefined) {
            queryParameters['token'] = parameters['token'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves VEP annotation for the provided variant
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationGET
     * @param {string} variant - Variant. For example 17:g.41242962_41242963insGA
     * @param {string} isoformOverrideSource - Isoform override source. For example mskcc
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationGET(parameters: {
        'variant': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/{variant}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{variant}', `${parameters['variant']}`);

            if (parameters['variant'] === undefined) {
                reject(new Error('Missing required  parameter: variant'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
            }

            if (parameters['token'] !== undefined) {
                queryParameters['token'] = parameters['token'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchCanonicalEnsemblGeneIdByEntrezGeneIdsPOSTURL(parameters: {
        'entrezGeneIds': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/canonical-gene/entrez';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        queryParameters = {};

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves canonical Ensembl Gene ID by Entrez Gene Ids
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblGeneIdByEntrezGeneIdsPOST
     * @param {} entrezGeneIds - List of Entrez Gene Ids. For example ["23140","26009","100131879"]
     */
    fetchCanonicalEnsemblGeneIdByEntrezGeneIdsPOST(parameters: {
        'entrezGeneIds': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/canonical-gene/entrez';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['entrezGeneIds'] !== undefined) {
                body = parameters['entrezGeneIds'];
            }

            if (parameters['entrezGeneIds'] === undefined) {
                reject(new Error('Missing required  parameter: entrezGeneIds'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            form = queryParameters;
            queryParameters = {};

            this.request('POST', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchCanonicalEnsemblGeneIdByEntrezGeneIdGETURL(parameters: {
        'entrezGeneId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/canonical-gene/entrez/{entrezGeneId}';

        path = path.replace('{entrezGeneId}', `${parameters['entrezGeneId']}`);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves Ensembl canonical gene id by Entrez Gene Id
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblGeneIdByEntrezGeneIdGET
     * @param {string} entrezGeneId - An Entrez Gene Id. For example 23140
     */
    fetchCanonicalEnsemblGeneIdByEntrezGeneIdGET(parameters: {
        'entrezGeneId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/canonical-gene/entrez/{entrezGeneId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{entrezGeneId}', `${parameters['entrezGeneId']}`);

            if (parameters['entrezGeneId'] === undefined) {
                reject(new Error('Missing required  parameter: entrezGeneId'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchCanonicalEnsemblGeneIdByHugoSymbolsPOSTURL(parameters: {
        'hugoSymbols': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/canonical-gene/hgnc';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        queryParameters = {};

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves canonical Ensembl Gene ID by Hugo Symbols
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblGeneIdByHugoSymbolsPOST
     * @param {} hugoSymbols - List of Hugo Symbols. For example ["TP53","PIK3CA","BRCA1"]
     */
    fetchCanonicalEnsemblGeneIdByHugoSymbolsPOST(parameters: {
        'hugoSymbols': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/canonical-gene/hgnc';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoSymbols'] !== undefined) {
                body = parameters['hugoSymbols'];
            }

            if (parameters['hugoSymbols'] === undefined) {
                reject(new Error('Missing required  parameter: hugoSymbols'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            form = queryParameters;
            queryParameters = {};

            this.request('POST', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchCanonicalEnsemblGeneIdByHugoSymbolGETURL(parameters: {
        'hugoSymbol': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/canonical-gene/hgnc/{hugoSymbol}';

        path = path.replace('{hugoSymbol}', `${parameters['hugoSymbol']}`);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves Ensembl canonical gene id by Hugo Symbol
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblGeneIdByHugoSymbolGET
     * @param {string} hugoSymbol - A Hugo Symbol. For example TP53
     */
    fetchCanonicalEnsemblGeneIdByHugoSymbolGET(parameters: {
        'hugoSymbol': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/canonical-gene/hgnc/{hugoSymbol}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{hugoSymbol}', `${parameters['hugoSymbol']}`);

            if (parameters['hugoSymbol'] === undefined) {
                reject(new Error('Missing required  parameter: hugoSymbol'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOSTURL(parameters: {
        'hugoSymbols': Array < string >
            | string

            ,
        'isoformOverrideSource' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/canonical-transcript/hgnc';

        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        queryParameters = {};

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves Ensembl canonical transcripts by Hugo Symbols
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOST
     * @param {} hugoSymbols - List of Hugo Symbols. For example ["TP53","PIK3CA","BRCA1"]
     * @param {string} isoformOverrideSource - Isoform override source. For example mskcc
     */
    fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOST(parameters: {
        'hugoSymbols': Array < string >
            | string

            ,
        'isoformOverrideSource' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/canonical-transcript/hgnc';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoSymbols'] !== undefined) {
                body = parameters['hugoSymbols'];
            }

            if (parameters['hugoSymbols'] === undefined) {
                reject(new Error('Missing required  parameter: hugoSymbols'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            form = queryParameters;
            queryParameters = {};

            this.request('POST', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchCanonicalEnsemblTranscriptByHugoSymbolGETURL(parameters: {
        'hugoSymbol': string,
        'isoformOverrideSource' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/canonical-transcript/hgnc/{hugoSymbol}';

        path = path.replace('{hugoSymbol}', `${parameters['hugoSymbol']}`);
        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves Ensembl canonical transcript by Hugo Symbol
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblTranscriptByHugoSymbolGET
     * @param {string} hugoSymbol - A Hugo Symbol. For example TP53
     * @param {string} isoformOverrideSource - Isoform override source. For example mskcc
     */
    fetchCanonicalEnsemblTranscriptByHugoSymbolGET(parameters: {
        'hugoSymbol': string,
        'isoformOverrideSource' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/canonical-transcript/hgnc/{hugoSymbol}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{hugoSymbol}', `${parameters['hugoSymbol']}`);

            if (parameters['hugoSymbol'] === undefined) {
                reject(new Error('Missing required  parameter: hugoSymbol'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchEnsemblTranscriptsGETURL(parameters: {
        'geneId' ? : string,
        'proteinId' ? : string,
        'hugoSymbol' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/transcript';
        if (parameters['geneId'] !== undefined) {
            queryParameters['geneId'] = parameters['geneId'];
        }

        if (parameters['proteinId'] !== undefined) {
            queryParameters['proteinId'] = parameters['proteinId'];
        }

        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves Ensembl Transcripts by protein ID, and gene ID. Retrieves all transcripts in case no query parameter provided
     * @method
     * @name GenomeNexusAPI#fetchEnsemblTranscriptsGET
     * @param {string} geneId - An Ensembl gene ID. For example ENSG00000136999
     * @param {string} proteinId - An Ensembl protein ID. For example ENSP00000439985
     * @param {string} hugoSymbol - A Hugo Symbol For example ARF5
     */
    fetchEnsemblTranscriptsGET(parameters: {
        'geneId' ? : string,
        'proteinId' ? : string,
        'hugoSymbol' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/transcript';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['geneId'] !== undefined) {
                queryParameters['geneId'] = parameters['geneId'];
            }

            if (parameters['proteinId'] !== undefined) {
                queryParameters['proteinId'] = parameters['proteinId'];
            }

            if (parameters['hugoSymbol'] !== undefined) {
                queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchEnsemblTranscriptsByEnsemblFilterPOSTURL(parameters: {
        'ensemblFilter': EnsemblFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/transcript';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        queryParameters = {};

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves Ensembl Transcripts by Ensembl transcript IDs, hugo Symbols, protein IDs, or gene IDs
     * @method
     * @name GenomeNexusAPI#fetchEnsemblTranscriptsByEnsemblFilterPOST
     * @param {} ensemblFilter - List of Ensembl transcript IDs. For example ["ENST00000361390", "ENST00000361453", "ENST00000361624"]<br>OR<br>List of Hugo Symbols. For example ["TP53", "PIK3CA", "BRCA1"]<br>OR<br>List of Ensembl protein IDs. For example ["ENSP00000439985", "ENSP00000478460", "ENSP00000346196"]<br>OR<br>List of Ensembl gene IDs. For example ["ENSG00000136999", "ENSG00000272398", "ENSG00000198695"]
     */
    fetchEnsemblTranscriptsByEnsemblFilterPOST(parameters: {
        'ensemblFilter': EnsemblFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/transcript';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['ensemblFilter'] !== undefined) {
                body = parameters['ensemblFilter'];
            }

            if (parameters['ensemblFilter'] === undefined) {
                reject(new Error('Missing required  parameter: ensemblFilter'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            form = queryParameters;
            queryParameters = {};

            this.request('POST', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchEnsemblTranscriptByTranscriptIdGETURL(parameters: {
        'transcriptId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/transcript/{transcriptId}';

        path = path.replace('{transcriptId}', `${parameters['transcriptId']}`);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves the transcript by an Ensembl transcript ID
     * @method
     * @name GenomeNexusAPI#fetchEnsemblTranscriptByTranscriptIdGET
     * @param {string} transcriptId - An Ensembl transcript ID. For example ENST00000361390
     */
    fetchEnsemblTranscriptByTranscriptIdGET(parameters: {
        'transcriptId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/transcript/{transcriptId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{transcriptId}', `${parameters['transcriptId']}`);

            if (parameters['transcriptId'] === undefined) {
                reject(new Error('Missing required  parameter: transcriptId'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchGeneXrefsGETURL(parameters: {
        'accession': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/xrefs';
        if (parameters['accession'] !== undefined) {
            queryParameters['accession'] = parameters['accession'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Perform lookups of Ensembl identifiers and retrieve their external references in other databases
     * @method
     * @name GenomeNexusAPI#fetchGeneXrefsGET
     * @param {string} accession - Ensembl gene accession. For example ENSG00000169083
     */
    fetchGeneXrefsGET(parameters: {
        'accession': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ensembl/xrefs';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['accession'] !== undefined) {
                queryParameters['accession'] = parameters['accession'];
            }

            if (parameters['accession'] === undefined) {
                reject(new Error('Missing required  parameter: accession'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchPdbHeaderPOSTURL(parameters: {
        'pdbIds': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/pdb/header';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        queryParameters = {};

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves PDB header info by a PDB id
     * @method
     * @name GenomeNexusAPI#fetchPdbHeaderPOST
     * @param {} pdbIds - List of pdb ids, for example ["1a37","1a4o"]
     */
    fetchPdbHeaderPOST(parameters: {
        'pdbIds': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/pdb/header';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['pdbIds'] !== undefined) {
                body = parameters['pdbIds'];
            }

            if (parameters['pdbIds'] === undefined) {
                reject(new Error('Missing required  parameter: pdbIds'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            form = queryParameters;
            queryParameters = {};

            this.request('POST', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchPdbHeaderGETURL(parameters: {
        'pdbId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/pdb/header/{pdbId}';

        path = path.replace('{pdbId}', `${parameters['pdbId']}`);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves PDB header info by a PDB id
     * @method
     * @name GenomeNexusAPI#fetchPdbHeaderGET
     * @param {string} pdbId - PDB id, for example 1a37
     */
    fetchPdbHeaderGET(parameters: {
        'pdbId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/pdb/header/{pdbId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{pdbId}', `${parameters['pdbId']}`);

            if (parameters['pdbId'] === undefined) {
                reject(new Error('Missing required  parameter: pdbId'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchPfamDomainsByPfamAccessionPOSTURL(parameters: {
        'pfamAccessions': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/pfam/domain';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        queryParameters = {};

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves PFAM domains by PFAM domain accession IDs
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByPfamAccessionPOST
     * @param {} pfamAccessions - List of PFAM domain accession IDs. For example ["PF02827","PF00093","PF15276"]
     */
    fetchPfamDomainsByPfamAccessionPOST(parameters: {
        'pfamAccessions': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/pfam/domain';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['pfamAccessions'] !== undefined) {
                body = parameters['pfamAccessions'];
            }

            if (parameters['pfamAccessions'] === undefined) {
                reject(new Error('Missing required  parameter: pfamAccessions'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            form = queryParameters;
            queryParameters = {};

            this.request('POST', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchPfamDomainsByAccessionGETURL(parameters: {
        'pfamAccession': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/pfam/domain/{pfamAccession}';

        path = path.replace('{pfamAccession}', `${parameters['pfamAccession']}`);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves a PFAM domain by a PFAM domain ID
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByAccessionGET
     * @param {string} pfamAccession - A PFAM domain accession ID. For example PF02827
     */
    fetchPfamDomainsByAccessionGET(parameters: {
        'pfamAccession': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/pfam/domain/{pfamAccession}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{pfamAccession}', `${parameters['pfamAccession']}`);

            if (parameters['pfamAccession'] === undefined) {
                reject(new Error('Missing required  parameter: pfamAccession'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchPostTranslationalModificationsGETURL(parameters: {
        'ensemblTranscriptId' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ptm/experimental';
        if (parameters['ensemblTranscriptId'] !== undefined) {
            queryParameters['ensemblTranscriptId'] = parameters['ensemblTranscriptId'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves PTM entries by Ensembl Transcript ID
     * @method
     * @name GenomeNexusAPI#fetchPostTranslationalModificationsGET
     * @param {string} ensemblTranscriptId - Ensembl Transcript ID. For example ENST00000646891
     */
    fetchPostTranslationalModificationsGET(parameters: {
        'ensemblTranscriptId' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ptm/experimental';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['ensemblTranscriptId'] !== undefined) {
                queryParameters['ensemblTranscriptId'] = parameters['ensemblTranscriptId'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchPostTranslationalModificationsByPtmFilterPOSTURL(parameters: {
        'ptmFilter': PtmFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ptm/experimental';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        queryParameters = {};

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves PTM entries by Ensembl Transcript IDs
     * @method
     * @name GenomeNexusAPI#fetchPostTranslationalModificationsByPtmFilterPOST
     * @param {} ptmFilter - List of Ensembl transcript IDs. For example ["ENST00000420316", "ENST00000646891", "ENST00000371953"]
     */
    fetchPostTranslationalModificationsByPtmFilterPOST(parameters: {
        'ptmFilter': PtmFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/ptm/experimental';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['ptmFilter'] !== undefined) {
                body = parameters['ptmFilter'];
            }

            if (parameters['ptmFilter'] === undefined) {
                reject(new Error('Missing required  parameter: ptmFilter'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            form = queryParameters;
            queryParameters = {};

            this.request('POST', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchVersionGETURL(parameters: {
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/version';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieve Genome Nexus Version
     * @method
     * @name GenomeNexusAPI#fetchVersionGET
     */
    fetchVersionGET(parameters: {
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/version';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

}