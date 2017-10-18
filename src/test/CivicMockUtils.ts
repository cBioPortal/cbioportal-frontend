import { ICivicGene, ICivicVariant, ICivicEntry, ICivicVariantData } from "shared/model/Civic";
import {DiscreteCopyNumberData, Mutation} from "shared/api/generated/CBioPortalAPI";
import * as _ from 'lodash';

export function getCivicVariantData(): ICivicVariantData
{
    return {
        id: 0,
        name: 'variantdata',
        geneId: 124,
        description: 'descr',
        url: 'http://',
        evidence: {'type1' : 1}
    };
}

export function getCivicGenes(): ICivicGene
{
    return {
        "PIK3CA": {
                id: 37,
                name: "PIK3CA",
                description: "PIK3CA is the most recurrently mutated gene in breast cancer, and has been found to important in a number of cancer types. An integral part of the PI3K pathway, PIK3CA has long been described as an oncogene, with two main hotspots for activating mutations, the 542/545 region of the helical domain, and the 1047 region of the kinase domain. PIK3CA, and its interaction with the AKT and mTOR pathways, is the subject of an immense amount of research and development, and PI3K inhibition has seen some limited success in recent clinical trials. While monotherapies seem to be limited in their potential, there is a recent interest in pursuing PI3K inhibition as part of a combination therapy regiment with inhibition partners including TKI's, MEK inhibitors, PARP inhibitors, and in breast cancer, aromatase inhibitors.",
                url: "https://civic.genome.wustl.edu/#/events/genes/37/summary",
                variants: {"AMPLIFICATION": 212, "C420R": 931, "E542K": 103, "E542Q": 933, "E545A": 882, "E545D": 934, "E545G": 883, "E545K": 104, "E545Q": 881,
                          "E545V": 884, "EXON 10 MUTATION": 106, "EXON 21 MUTATION": 105, "G1049R": 940, "G1049S": 939, "H1047L": 1151, "H1047R": 107, "H1047Y": 938,
                          "I391M": 1235, "K111N": 1234, "M1043I": 937, "MUTATION": 311, "P471L": 294, "Q546E": 886, "Q546K": 885, "Y1021C": 935}
                },
        "RAF1": {
                id: 4767,
                name: "RAF1",
                description: "",
                url: "https://civic.genome.wustl.edu/#/events/genes/4767/summary",
                variants: {"AMPLIFICATION": 591}
                }
    };
}

export function getCnaCivicVariants(): ICivicVariant
{
    return {
        "RAF1": { "AMPLIFICATION": {
                                   id: 591,
                                   name: "AMPLIFICATION",
                                   geneId: 4767,
                                   description: "",
                                   url: "https://civic.genome.wustl.edu/#/events/genes/4767/summary/variants/591/summary#variant",
                                   evidence: {"Predictive": 1}
                                   }
                }
    };
}

export function getCnaCivicEmptyVariants(): ICivicVariant
{
    return {};
}

export function getMutationCivicVariants(): ICivicVariant
{
    return {
        "PIK3CA": { "E545K": {
                             id: 104,
                             name: "E545K",
                             geneId: 37,
                             description: "PIK3CA E545K/E542K are the second most recurrent PIK3CA mutations in breast cancer, and are highly recurrent mutations in many other cancer types. E545K, and possibly the other mutations in the E545 region, may present patients with a poorer prognosis than patients with either patients with other PIK3CA variant or wild-type PIK3CA. There is also data to suggest that E545/542 mutations may confer resistance to EGFR inhibitors like cetuximab. While very prevalent, targeted therapies for variants in PIK3CA are still in early clinical trial phases.",
                             url: "https://civic.genome.wustl.edu/#/events/genes/37/summary/variants/104/summary#variant",
                             evidence: {"Prognostic": 1, "Predictive": 14}
                             }
                },
    };
}

export function getCnaData(): Array<DiscreteCopyNumberData>
{
    return [{alteration: -2, entrezGeneId: 5894, gene: {chromosome: "3", cytoband:"3p25", entrezGeneId: 5894, hugoGeneSymbol: "RAF1", length: 7847, 
           type: "protein-coding"}, molecularProfileId: "ccle_gistic", sampleId: "NCIH508_LARGE_INTESTINE", patientId:"PATIENT1", studyId: "STUDY1",
           uniquePatientKey: "", uniqueSampleKey: ""}];
}

export function getMutationData(): Mutation
{
    return {
       center: "broad.mit.edu", endPosition: 178936091, entrezGeneId: 5290, fisValue: 1.4013e-45, functionalImpactScore:"", 
       gene: {chromosome: "3", cytoband: "3q26.3", entrezGeneId: 5290, hugoGeneSymbol: "PIK3CA", length: 9411, type: "protein-coding"},
       molecularProfileId: "ccle_mutations", keyword: "PIK3CA E545 missense", linkMsa:"", linkPdb: "", linkXvar: "", mutationStatus: "NA",
       mutationType: "Missense_Mutation", ncbiBuild: "GRCh37", normalAltCount: -1, normalRefCount: -1, proteinChange: "E545K", proteinPosEnd: 545, 
       proteinPosStart: 545, referenceAllele: "G", refseqMrnaId: "NM_006218.2", sampleId: "NCIH508_LARGE_INTESTINE", patientId: "PATIENT1",
       studyId: "STUDY1", uniquePatientKey: "", uniqueSampleKey: "", startPosition: 178936091, tumorAltCount: -1, tumorRefCount: -1,
       validationStatus: "NA", variantAllele: "A", variantType: "SNP", aminoAcidChange: "", driverFilter: "", driverFilterAnnotation: "", driverTiersFilter: "",
       driverTiersFilterAnnotation: ""
   };
}

export function getExpectedCivicEntry(): ICivicEntry
{
    return {
            name: "PIK3CA",
            description: "PIK3CA is the most recurrently mutated gene in breast cancer, and has been found to important in a number of cancer types. An integral part of the PI3K pathway, PIK3CA has long been described as an oncogene, with two main hotspots for activating mutations, the 542/545 region of the helical domain, and the 1047 region of the kinase domain. PIK3CA, and its interaction with the AKT and mTOR pathways, is the subject of an immense amount of research and development, and PI3K inhibition has seen some limited success in recent clinical trials. While monotherapies seem to be limited in their potential, there is a recent interest in pursuing PI3K inhibition as part of a combination therapy regiment with inhibition partners including TKI's, MEK inhibitors, PARP inhibitors, and in breast cancer, aromatase inhibitors.",
            url: "https://civic.genome.wustl.edu/#/events/genes/37/summary",
            variants: { "E545K": {
                                 id: 104,
                                 name: "E545K",
                                 geneId: 37,
                                 description: "PIK3CA E545K/E542K are the second most recurrent PIK3CA mutations in breast cancer, and are highly recurrent mutations in many other cancer types. E545K, and possibly the other mutations in the E545 region, may present patients with a poorer prognosis than patients with either patients with other PIK3CA variant or wild-type PIK3CA. There is also data to suggest that E545/542 mutations may confer resistance to EGFR inhibitors like cetuximab. While very prevalent, targeted therapies for variants in PIK3CA are still in early clinical trial phases.",
                                 url: "https://civic.genome.wustl.edu/#/events/genes/37/summary/variants/104/summary#variant",
                                 evidence: {"Prognostic": 1, "Predictive": 14}
                                 }
                      }
            };
}

export function getExpectedCnaCivicEntry(): ICivicEntry
{
    return {
           name: "RAF1",
           description: "",
           url: "https://civic.genome.wustl.edu/#/events/genes/4767/summary",
           variants: {"AMPLIFICATION": {
                                       id: 591,
                                       name: "AMPLIFICATION",
                                       geneId: 4767,
                                       description: "",
                                       url: "https://civic.genome.wustl.edu/#/events/genes/4767/summary/variants/591/summary#variant",
                                       evidence: {"Predictive": 1}
                                       }
                     }
           };
}
