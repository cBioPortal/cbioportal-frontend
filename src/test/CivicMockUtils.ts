import {
    ICivicGeneIndex,
    ICivicVariantIndex,
    ICivicEntry,
    ICivicVariantSummary,
} from 'cbioportal-utils';
import { DiscreteCopyNumberData, Mutation } from 'cbioportal-ts-api-client';

export function getCivicVariantData(): ICivicVariantSummary {
    return {
        id: 0,
        name: 'variantdata',
        description: 'descr',
        url: 'http://',
        evidenceCounts: {
            predisposingCount: 1,
            diagnosticCount: 0,
            predictiveCount: 0,
            prognosticCount: 0,
            oncogenicCount: 0,
            functionalCount: 0,
        },
    };
}

export function getCivicGenes(): ICivicGeneIndex {
    return {
        PIK3CA: {
            id: 37,
            name: 'PIK3CA',
            description:
                "PIK3CA is the most recurrently mutated gene in breast cancer, and has been found to important in a number of cancer types. An integral part of the PI3K pathway, PIK3CA has long been described as an oncogene, with two main hotspots for activating mutations, the 542/545 region of the helical domain, and the 1047 region of the kinase domain. PIK3CA, and its interaction with the AKT and mTOR pathways, is the subject of an immense amount of research and development, and PI3K inhibition has seen some limited success in recent clinical trials. While monotherapies seem to be limited in their potential, there is a recent interest in pursuing PI3K inhibition as part of a combination therapy regiment with inhibition partners including TKI's, MEK inhibitors, PARP inhibitors, and in breast cancer, aromatase inhibitors.",
            url: 'https://civicdb.org/genes/37/summary',
            variants: {
                H1047R: {
                    id: 107,
                    name: 'H1047R',
                    geneId: 37,
                    description:
                        'PIK3CA H1047R is one of the most recurrent single nucleotide variants in cancer, especially breast cancer. Of PIK3CA-mutant breast cancers, over half harbor this mutation. Meta-analyses have shown that patients harboring this mutation may have worse overall survival, but other studies have shown no difference between H1047R and other PIK3CA mutants from a prognostic standpoint. While very prevalent, targeted therapies for this particular mutation are still in early clinical trial phases.',
                    url: 'https://civicdb.org/variants/107/summary',
                    evidenceCounts: {
                        predictiveCount: 34,
                        functionalCount: 1,
                        prognosticCount: 2,
                        diagnosticCount: 1,
                        predisposingCount: 0,
                        oncogenicCount: 0,
                    },
                },
            },
        },
        RAF1: {
            id: 4767,
            name: 'RAF1',
            description: '',
            url: 'https://civicdb.org/genes/4767/summary',
            variants: {
                R391W: {
                    id: 1680,
                    name: 'R391W',
                    geneId: 4767,
                    description: '',
                    url: 'https://civicdb.org/variants/1680/summary',
                    evidenceCounts: {
                        predictiveCount: 1,
                        functionalCount: 1,
                        prognosticCount: 0,
                        diagnosticCount: 0,
                        predisposingCount: 0,
                        oncogenicCount: 0,
                    },
                },
            },
        },
    } as any;
}

export function getCnaCivicVariants(): ICivicVariantIndex {
    return {
        RAF1: {
            AMPLIFICATION: {
                id: 591,
                name: 'AMPLIFICATION',
                description: '',
                url: 'https://civicdb.org/variants/591/summary',
                evidenceCounts: {
                    prognosticCount: 1,
                    predictiveCount: 1,
                    diagnosticCount: 0,
                    predisposingCount: 0,
                    oncogenicCount: 0,
                    functionalCount: 0,
                },
            },
        },
    };
}

export function getCnaCivicEmptyVariants(): ICivicVariantIndex {
    return {};
}

export function getMutationCivicVariants(): ICivicVariantIndex {
    return {
        PIK3CA: {
            E545K: {
                id: 104,
                name: 'E545K',
                description:
                    'PIK3CA E545K/E542K are the second most recurrent PIK3CA mutations in breast cancer, and are highly recurrent mutations in many other cancer types. E545K, and possibly the other mutations in the E545 region, may present patients with a poorer prognosis than patients with either patients with other PIK3CA variant or wild-type PIK3CA. There is also data to suggest that E545/542 mutations may confer resistance to EGFR inhibitors like cetuximab. While very prevalent, targeted therapies for variants in PIK3CA are still in early clinical trial phases.',
                url: 'https://civicdb.org/variants/104/summary',
                evidenceCounts: {
                    prognosticCount: 1,
                    predictiveCount: 14,
                    diagnosticCount: 0,
                    predisposingCount: 0,
                    oncogenicCount: 0,
                    functionalCount: 0,
                },
            },
        },
    };
}

export function getCnaData(): Array<DiscreteCopyNumberData> {
    return [
        {
            alteration: 2,
            entrezGeneId: 5894,
            gene: {
                geneticEntityId: 4721,
                entrezGeneId: 5894,
                hugoGeneSymbol: 'RAF1',
                type: 'protein-coding',
            },
            molecularProfileId: 'ccle_gistic',
            sampleId: 'NCIH508_LARGE_INTESTINE',
            patientId: 'PATIENT1',
            studyId: 'STUDY1',
            uniquePatientKey: '',
            uniqueSampleKey: '',
            driverFilter: '',
            driverFilterAnnotation: '',
            driverTiersFilter: '',
            driverTiersFilterAnnotation: '',
            namespaceColumns: {},
        },
    ];
}

export function getMutationData(): Mutation {
    return {
        center: 'broad.mit.edu',
        endPosition: 178936091,
        entrezGeneId: 5290,
        gene: {
            geneticEntityId: 4233,
            entrezGeneId: 5290,
            hugoGeneSymbol: 'PIK3CA',
            type: 'protein-coding',
        },
        alleleSpecificCopyNumber: {
            ascnIntegerCopyNumber: -1,
            ascnMethod: '',
            ccfExpectedCopies: -1,
            ccfExpectedCopiesUpper: -1,
            clonal: '',
            minorCopyNumber: -1,
            expectedAltCopies: -1,
            totalCopyNumber: -1,
        },
        molecularProfileId: 'ccle_mutations',
        keyword: 'PIK3CA E545 missense',
        mutationStatus: 'NA',
        mutationType: 'Missense_Mutation',
        ncbiBuild: 'GRCh37',
        normalAltCount: -1,
        normalRefCount: -1,
        proteinChange: 'E545K',
        proteinPosEnd: 545,
        proteinPosStart: 545,
        referenceAllele: 'G',
        refseqMrnaId: 'NM_006218.2',
        sampleId: 'NCIH508_LARGE_INTESTINE',
        patientId: 'PATIENT1',
        studyId: 'STUDY1',
        uniquePatientKey: '',
        uniqueSampleKey: '',
        startPosition: 178936091,
        tumorAltCount: -1,
        tumorRefCount: -1,
        validationStatus: 'NA',
        variantAllele: 'A',
        variantType: 'SNP',
        aminoAcidChange: '',
        driverFilter: '',
        driverFilterAnnotation: '',
        driverTiersFilter: '',
        driverTiersFilterAnnotation: '',
        chr: '3',
        namespaceColumns: {},
    };
}

export function getExpectedCivicEntry(): ICivicEntry {
    return {
        name: 'PIK3CA',
        description:
            "PIK3CA is the most recurrently mutated gene in breast cancer, and has been found to important in a number of cancer types. An integral part of the PI3K pathway, PIK3CA has long been described as an oncogene, with two main hotspots for activating mutations, the 542/545 region of the helical domain, and the 1047 region of the kinase domain. PIK3CA, and its interaction with the AKT and mTOR pathways, is the subject of an immense amount of research and development, and PI3K inhibition has seen some limited success in recent clinical trials. While monotherapies seem to be limited in their potential, there is a recent interest in pursuing PI3K inhibition as part of a combination therapy regiment with inhibition partners including TKI's, MEK inhibitors, PARP inhibitors, and in breast cancer, aromatase inhibitors.",
        url: 'https://civicdb.org/genes/37/summary',
        variants: {
            E545K: {
                id: 104,
                name: 'E545K',
                description:
                    'PIK3CA E545K/E542K are the second most recurrent PIK3CA mutations in breast cancer, and are highly recurrent mutations in many other cancer types. E545K, and possibly the other mutations in the E545 region, may present patients with a poorer prognosis than patients with either patients with other PIK3CA variant or wild-type PIK3CA. There is also data to suggest that E545/542 mutations may confer resistance to EGFR inhibitors like cetuximab. While very prevalent, targeted therapies for variants in PIK3CA are still in early clinical trial phases.',
                url: 'https://civicdb.org/variants/104/summary',
                evidenceCounts: {
                    prognosticCount: 1,
                    predictiveCount: 14,
                    diagnosticCount: 0,
                    predisposingCount: 0,
                    oncogenicCount: 0,
                    functionalCount: 0,
                },
            },
        },
    };
}

export function getExpectedCnaCivicEntry(): ICivicEntry {
    return {
        name: 'RAF1',
        description: '',
        url: 'https://civicdb.org/genes/4767/summary',
        variants: {
            RAF1: {
                id: 591,
                name: 'AMPLIFICATION',
                description: '',
                url: 'https://civicdb.org/variants/591/summary',
                evidenceCounts: {
                    predictiveCount: 1,
                    prognosticCount: 1,
                    diagnosticCount: 0,
                    predisposingCount: 0,
                    oncogenicCount: 0,
                    functionalCount: 0,
                },
            },
        },
    };
}
