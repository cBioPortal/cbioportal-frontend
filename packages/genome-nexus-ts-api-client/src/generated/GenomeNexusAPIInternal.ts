import * as request from "superagent";
import {
    SuperAgentStatic
} from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
type AggregatedHotspots = {
    'genomicLocation': GenomicLocation

    'hotspots': Array < Hotspot >
        | Hotspot

    'proteinLocation' ? : ProteinLocation

    'transcriptId' ? : string

    'transcriptIdVersion' ? : string

    'variant': string

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
type CuriousCases = {
    'comment' ? : string

    'genomicLocation' ? : string

    'hugoGeneSymbol' ? : string

    'pubmedIds' ? : Array < number >
        | number

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
type HrdScore = {
    'fractionLoh' ? : number

    'lst' ? : number

    'ntelomericAi' ? : number

};
type Index = {
    'cdna' ? : Array < string >
        | string

    'hgvsc' ? : Array < string >
        | string

    'hgvsp' ? : Array < string >
        | string

    'hgvspShort' ? : Array < string >
        | string

    'hugoSymbol' ? : Array < string >
        | string

    'rsid' ? : Array < string >
        | string

    'variant' ? : string

};
type IndexSearch = {
    'queryType' ? : "GENE_HGVSPSHORT" | "GENE_CDNA" | "GENE_HGVSP" | "HGVSG" | "HGVSC"

    'results' ? : Array < Index >
        | Index

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
type MutationAssessor = {
    'functionalImpactPrediction' ? : string

    'functionalImpactScore' ? : number

    'hgvspShort' ? : string

    'mav' ? : number

    'msa' ? : string

    'sv' ? : number

    'uniprotId' ? : string

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
type ProteinLocation = {
    'transcriptId': string

    'start': number

    'end': number

    'mutationType': string

};
type Rcv = {
    'accession' ? : string

    'clinicalSignificance' ? : string

    'origin' ? : string

    'preferredName' ? : string

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
type SignalMutationFilter = {
    'hugoSymbols' ? : Array < string >
        | string

};
type SignalPopulationStats = {
    'afr' ? : number

    'asj' ? : number

    'asn' ? : number

    'eur' ? : number

    'impact' ? : number

    'oth' ? : number

};
type SignalQuery = {
    'alteration' ? : string

    'description' ? : string

    'hugoSymbol' ? : string

    'matchType' ? : "EXACT" | "STARTS_WITH" | "PARTIAL" | "NO_MATCH"

    'queryType' ? : "GENE" | "ALTERATION" | "VARIANT" | "REGION"

    'region' ? : string

    'variant' ? : string

};
type Snpeff = {
    'license' ? : string

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
 * @class GenomeNexusAPIInternal
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class GenomeNexusAPIInternal {

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

    fetchVariantAnnotationSummaryPOSTURL(parameters: {
        'variants': Array < string >
            | string

            ,
        'isoformOverrideSource' ? : string,
        'projection' ? : "ALL" | "CANONICAL",
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/summary';

        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
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
     * Retrieves VEP annotation summary for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchVariantAnnotationSummaryPOST
     * @param {} variants - List of variants. For example ["X:g.66937331T>A","17:g.41242962_41242963insGA"] (GRCh37) or ["1:g.182712A>C", "2:g.265023C>T", "3:g.319781del", "19:g.110753dup", "1:g.1385015_1387562del"] (GRCh38)
     * @param {string} isoformOverrideSource - Isoform override source. For example mskcc
     * @param {string} projection - Indicates whether to return summary for all transcripts or only for canonical transcript
     */
    fetchVariantAnnotationSummaryPOST(parameters: {
        'variants': Array < string >
            | string

            ,
        'isoformOverrideSource' ? : string,
        'projection' ? : "ALL" | "CANONICAL",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/summary';
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

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
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

    fetchVariantAnnotationSummaryGETURL(parameters: {
        'variant': string,
        'isoformOverrideSource' ? : string,
        'projection' ? : "ALL" | "CANONICAL",
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/summary/{variant}';

        path = path.replace('{variant}', `${parameters['variant']}`);
        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
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
     * Retrieves VEP annotation summary for the provided variant
     * @method
     * @name GenomeNexusAPIInternal#fetchVariantAnnotationSummaryGET
     * @param {string} variant - Variant. For example 17:g.41242962_41242963insGA
     * @param {string} isoformOverrideSource - Isoform override source. For example mskcc
     * @param {string} projection - Indicates whether to return summary for all transcripts or only for canonical transcript
     */
    fetchVariantAnnotationSummaryGET(parameters: {
        'variant': string,
        'isoformOverrideSource' ? : string,
        'projection' ? : "ALL" | "CANONICAL",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/annotation/summary/{variant}';
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

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchHotspotAnnotationByGenomicLocationPOSTURL(parameters: {
        'genomicLocations': Array < GenomicLocation >
            | GenomicLocation

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/genomic';

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
     * Retrieves hotspot annotations for the provided list of genomic locations
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByGenomicLocationPOST
     * @param {} genomicLocations - List of genomic locations.
     */
    fetchHotspotAnnotationByGenomicLocationPOST(parameters: {
        'genomicLocations': Array < GenomicLocation >
            | GenomicLocation

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/genomic';
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

    fetchHotspotAnnotationByGenomicLocationGETURL(parameters: {
        'genomicLocation': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/genomic/{genomicLocation}';

        path = path.replace('{genomicLocation}', `${parameters['genomicLocation']}`);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves hotspot annotations for a specific genomic location
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByGenomicLocationGET
     * @param {string} genomicLocation - A genomic location. For example 7,140453136,140453136,A,T
     */
    fetchHotspotAnnotationByGenomicLocationGET(parameters: {
        'genomicLocation': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/genomic/{genomicLocation}';
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

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchHotspotAnnotationByHgvsPOSTURL(parameters: {
        'variants': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/hgvs';

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
     * Retrieves hotspot annotations for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByHgvsPOST
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    fetchHotspotAnnotationByHgvsPOST(parameters: {
        'variants': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/hgvs';
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

    fetchHotspotAnnotationByHgvsGETURL(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/hgvs/{variant}';

        path = path.replace('{variant}', `${parameters['variant']}`);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves hotspot annotations for a specific variant
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByHgvsGET
     * @param {string} variant - A variant. For example 7:g.140453136A>T
     */
    fetchHotspotAnnotationByHgvsGET(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/hgvs/{variant}';
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

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchHotspotAnnotationByProteinLocationsPOSTURL(parameters: {
        'proteinLocations': Array < ProteinLocation >
            | ProteinLocation

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/proteinLocations';

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
     * Retrieves hotspot annotations for the provided list of transcript id, protein location and mutation type
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByProteinLocationsPOST
     * @param {} proteinLocations - List of transcript id, protein start location, protein end location, mutation type. The mutation types are limited to 'Missense_Mutation', 'In_Frame_Ins', 'In_Frame_Del', 'Splice_Site', and 'Splice_Region'
     */
    fetchHotspotAnnotationByProteinLocationsPOST(parameters: {
        'proteinLocations': Array < ProteinLocation >
            | ProteinLocation

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/proteinLocations';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['proteinLocations'] !== undefined) {
                body = parameters['proteinLocations'];
            }

            if (parameters['proteinLocations'] === undefined) {
                reject(new Error('Missing required  parameter: proteinLocations'));
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

    fetchHotspotAnnotationByTranscriptIdPOSTURL(parameters: {
        'transcriptIds': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/transcript';

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
     * Retrieves hotspot annotations for the provided list of transcript ID
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByTranscriptIdPOST
     * @param {} transcriptIds - List of transcript Id. For example ["ENST00000288602","ENST00000256078"]
     */
    fetchHotspotAnnotationByTranscriptIdPOST(parameters: {
        'transcriptIds': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/transcript';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['transcriptIds'] !== undefined) {
                body = parameters['transcriptIds'];
            }

            if (parameters['transcriptIds'] === undefined) {
                reject(new Error('Missing required  parameter: transcriptIds'));
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

    fetchHotspotAnnotationByTranscriptIdGETURL(parameters: {
        'transcriptId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/transcript/{transcriptId}';

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
     * Retrieves hotspot annotations for the provided transcript ID
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByTranscriptIdGET
     * @param {string} transcriptId - A Transcript Id. For example ENST00000288602
     */
    fetchHotspotAnnotationByTranscriptIdGET(parameters: {
        'transcriptId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/cancer_hotspots/transcript/{transcriptId}';
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

    fetchCuriousCasesGETURL(parameters: {
        'genomicLocation': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/curious_cases/{genomicLocation}';

        path = path.replace('{genomicLocation}', `${parameters['genomicLocation']}`);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves Curious Cases info by a genomic location
     * @method
     * @name GenomeNexusAPIInternal#fetchCuriousCasesGET
     * @param {string} genomicLocation - Genomic location, for example: 7,116411883,116411905,TTCTTTCTCTCTGTTTTAAGATC,-
     */
    fetchCuriousCasesGET(parameters: {
        'genomicLocation': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/curious_cases/{genomicLocation}';
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

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    postMutationAssessorURL(parameters: {
        'variants': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/mutation_assessor';

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
     * Retrieves mutation assessor information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#postMutationAssessor
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    postMutationAssessor(parameters: {
        'variants': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/mutation_assessor';
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

    fetchMutationAssessorGETURL(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/mutation_assessor/{variant}';

        path = path.replace('{variant}', `${parameters['variant']}`);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves mutation assessor information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchMutationAssessorGET
     * @param {string} variant - A variant. For example 7:g.140453136A>T
     */
    fetchMutationAssessorGET(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/mutation_assessor/{variant}';
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

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    postMyVariantInfoAnnotationURL(parameters: {
        'variants': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/my_variant_info/variant';

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
     * Retrieves myvariant information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#postMyVariantInfoAnnotation
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    postMyVariantInfoAnnotation(parameters: {
        'variants': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/my_variant_info/variant';
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

    fetchMyVariantInfoAnnotationGETURL(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/my_variant_info/variant/{variant}';

        path = path.replace('{variant}', `${parameters['variant']}`);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves myvariant information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchMyVariantInfoAnnotationGET
     * @param {string} variant - . For example 7:g.140453136A>T
     */
    fetchMyVariantInfoAnnotationGET(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/my_variant_info/variant/{variant}';
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

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    postNucleotideContextAnnotationURL(parameters: {
        'variants': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/nucleotide_context';

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
     * Retrieves nucleotide context information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#postNucleotideContextAnnotation
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    postNucleotideContextAnnotation(parameters: {
        'variants': Array < string >
            | string

            ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/nucleotide_context';
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

    fetchNucleotideContextAnnotationGETURL(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/nucleotide_context/{variant}';

        path = path.replace('{variant}', `${parameters['variant']}`);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves nucleotide context information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchNucleotideContextAnnotationGET
     * @param {string} variant - A variant. For example 7:g.140453136A>T
     */
    fetchNucleotideContextAnnotationGET(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/nucleotide_context/{variant}';
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

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    searchAnnotationByKeywordGETUsingGETURL(parameters: {
        'keyword': string,
        'limit' ? : number,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/search';
        if (parameters['keyword'] !== undefined) {
            queryParameters['keyword'] = parameters['keyword'];
        }

        if (parameters['limit'] !== undefined) {
            queryParameters['limit'] = parameters['limit'];
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
     * Performs index search.
     * @method
     * @name GenomeNexusAPIInternal#searchAnnotationByKeywordGETUsingGET
     * @param {string} keyword - keyword. For example 13:g.32890665G>A, TP53 p.R273C, BRAF c.1799T>A
     * @param {integer} limit - Max number of matching results to return
     */
    searchAnnotationByKeywordGETUsingGET(parameters: {
        'keyword': string,
        'limit' ? : number,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/search';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['keyword'] !== undefined) {
                queryParameters['keyword'] = parameters['keyword'];
            }

            if (parameters['keyword'] === undefined) {
                reject(new Error('Missing required  parameter: keyword'));
                return;
            }

            if (parameters['limit'] !== undefined) {
                queryParameters['limit'] = parameters['limit'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchSignalMutationsByHugoSymbolGETUsingGETURL(parameters: {
        'hugoGeneSymbol' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/signal/mutation';
        if (parameters['hugoGeneSymbol'] !== undefined) {
            queryParameters['hugoGeneSymbol'] = parameters['hugoGeneSymbol'];
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
     * Retrieves SignalDB mutations by Hugo Gene Symbol
     * @method
     * @name GenomeNexusAPIInternal#fetchSignalMutationsByHugoSymbolGETUsingGET
     * @param {string} hugoGeneSymbol - Hugo Symbol. For example BRCA1
     */
    fetchSignalMutationsByHugoSymbolGETUsingGET(parameters: {
        'hugoGeneSymbol' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/signal/mutation';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoGeneSymbol'] !== undefined) {
                queryParameters['hugoGeneSymbol'] = parameters['hugoGeneSymbol'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchSignalMutationsByMutationFilterPOSTUsingPOSTURL(parameters: {
        'mutationFilter': SignalMutationFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/signal/mutation';

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
     * Retrieves SignalDB mutations by Mutation Filter
     * @method
     * @name GenomeNexusAPIInternal#fetchSignalMutationsByMutationFilterPOSTUsingPOST
     * @param {} mutationFilter - List of Hugo Gene Symbols. For example ["TP53", "PIK3CA", "BRCA1"]
     */
    fetchSignalMutationsByMutationFilterPOSTUsingPOST(parameters: {
        'mutationFilter': SignalMutationFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/signal/mutation';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['mutationFilter'] !== undefined) {
                body = parameters['mutationFilter'];
            }

            if (parameters['mutationFilter'] === undefined) {
                reject(new Error('Missing required  parameter: mutationFilter'));
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

    fetchSignalMutationsByHgvsgGETUsingGETURL(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/signal/mutation/hgvs/{variant}';

        path = path.replace('{variant}', `${parameters['variant']}`);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                queryParameters[parameterName] = parameters.$queryParameters[parameterName];
            });
        }

        let keys = Object.keys(queryParameters);
        return domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    }

    /**
     * Retrieves SignalDB mutations by hgvgs variant
     * @method
     * @name GenomeNexusAPIInternal#fetchSignalMutationsByHgvsgGETUsingGET
     * @param {string} variant - A variant. For example 13:g.32890665G>A
     */
    fetchSignalMutationsByHgvsgGETUsingGET(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/signal/mutation/hgvs/{variant}';
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

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    searchSignalByKeywordGETUsingGETURL(parameters: {
        'keyword': string,
        'limit' ? : number,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/signal/search';
        if (parameters['keyword'] !== undefined) {
            queryParameters['keyword'] = parameters['keyword'];
        }

        if (parameters['limit'] !== undefined) {
            queryParameters['limit'] = parameters['limit'];
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
     * Performs search by gene, protein change, variant or region.
     * @method
     * @name GenomeNexusAPIInternal#searchSignalByKeywordGETUsingGET
     * @param {string} keyword - keyword. For example BRCA; BRAF V600; 13:32906640-32906640; 13:g.32890665G>A
     * @param {integer} limit - Max number of matching results to return
     */
    searchSignalByKeywordGETUsingGET(parameters: {
        'keyword': string,
        'limit' ? : number,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/signal/search';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['keyword'] !== undefined) {
                queryParameters['keyword'] = parameters['keyword'];
            }

            if (parameters['keyword'] === undefined) {
                reject(new Error('Missing required  parameter: keyword'));
                return;
            }

            if (parameters['limit'] !== undefined) {
                queryParameters['limit'] = parameters['limit'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    queryParameters[parameterName] = parameters.$queryParameters[parameterName];
                });
            }

            this.request('GET', domain + path, body, headers, queryParameters, form, reject, resolve);
        });
    }

    fetchGeneXrefsGET_1URL(parameters: {
        'accession': string,
        $queryParameters ? : any,
        $domain ? : string
    }): string {
        let queryParameters: any = {};
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/xrefs/{accession}';

        path = path.replace('{accession}', `${parameters['accession']}`);

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
     * @name GenomeNexusAPIInternal#fetchGeneXrefsGET_1
     * @param {string} accession - Ensembl gene accession. For example ENSG00000169083
     */
    fetchGeneXrefsGET_1(parameters: {
        'accession': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        let path = '/xrefs/{accession}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise((resolve, reject) => {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{accession}', `${parameters['accession']}`);

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

}