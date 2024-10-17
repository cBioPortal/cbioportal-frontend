import {
    AnnotationImplication,
    NotificationImplication,
    TreatmentImplication,
    NOTIFICATION_TYPE,
} from 'oncokb-annotation-visualisation/config/constants';
export const patientId = 'P-0000435';
export const patientInfo = 'Pilocytic Astrocytoma, Male, 50 years old';
const APIResponse1 = {
    query: {
        id: null,
        referenceGenome: 'GRCh37',
        hugoSymbol: 'BRAF',
        entrezGeneId: 673,
        alteration: 'V600F',
        alterationType: 'MUTATION',
        svType: null,
        tumorType: 'melanoma',
        consequence: null,
        proteinStart: null,
        proteinEnd: null,
        hgvs: null,
    },
    geneExist: true,
    variantExist: false,
    alleleExist: true,
    oncogenic: 'Likely Oncogenic',
    mutationEffect: {
        knownEffect: 'Unknown',
        description:
            'The BRAF V600F mutation has not specifically been reviewed by the OncoKB team. However, we have mutation effect descriptions for BRAF V600A/D/E/G/K/L/M/Q/R.',
        citations: {
            pmids: [],
            abstracts: [],
        },
    },
    highestSensitiveLevel: 'LEVEL_1',
    highestResistanceLevel: null,
    highestDiagnosticImplicationLevel: null,
    highestPrognosticImplicationLevel: null,
    highestFdaLevel: 'LEVEL_Fda2',
    otherSignificantSensitiveLevels: [],
    otherSignificantResistanceLevels: [],
    hotspot: true,
    geneSummary:
        'BRAF, an intracellular kinase, is frequently mutated in melanoma, thyroid and lung cancers among others.',
    variantSummary:
        'The BRAF V600F mutation has been identified as a statistically significant hotspot and is likely to be oncogenic.',
    tumorTypeSummary:
        'The RAF-targeted inhibitors encorafenib, dabrafenib and vemurafenib, alone or in combination with the MEK1/2-targeted inhibitors binimetinib, trametinib and cobimetinib respectively, are FDA-approved for the treatment of patients with BRAF V600E/K mutant melanoma and NCCN-compendium listed for the treatment of patients with BRAF V600-mutant melanoma. Additionally, the anti-PD-L1 antibody atezolizumab in combination with cobimetinib + vemurafenib is FDA-approved for the treatment of patients with unresectable or advanced BRAF V600-mutant melanoma.',
    prognosticSummary: '',
    diagnosticSummary: '',
    diagnosticImplications: [],
    prognosticImplications: [],
    treatments: [
        {
            alterations: ['V600'],
            drugs: [
                {
                    ncitCode: 'C64768',
                    drugName: 'Vemurafenib',
                },
                {
                    ncitCode: 'C106250',
                    drugName: 'Atezolizumab',
                },
                {
                    ncitCode: 'C68923',
                    drugName: 'Cobimetinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_1',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['32534646'],
            abstracts: [],
            description:
                'The combination of vemurafenib, an inhibitor of V600-mutant BRAF, and cobimetinib, an inhibitor of MEK1/2, with atezolizumab, an immunotherapeutic PD-L1 antibody, is FDA-approved for patients with BRAF V600 mutation-positive unresectable or metastatic melanoma. FDA approval was based on the results of the Phase III double-blind, randomized, placebo-controlled IMspire150 trial of Atezolizumab + Cobimetinib + Vemurafenib versus Placebo + Cobimetinib + Vemurafenib in 514 patients with BRAF V600-mutant melanoma in which the median progression-free survival was 15.1 mos (95% CI=11.4,18.4) in the triplet arm versus 10.6 mos (95% CI=9.3,12.7) in the doublet + placebo arm (HR=0.78; 95% CI= 0.63, 0.97; p=0.0249) (PMID: 32534646).',
        },
        {
            alterations: ['V600 (excluding V600E and V600K)'],
            drugs: [
                {
                    ncitCode: 'C98283',
                    drugName: 'Encorafenib',
                },
                {
                    ncitCode: 'C84865',
                    drugName: 'Binimetinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_2',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['29573941'],
            abstracts: [],
            description:
                'The combination of encorafenib, an inhibitor of V600E- or V600K-mutant BRAF, and binimetinib, an inhibitor of MEK1/2, is FDA-approved in combination for patients with unresectable or metastatic melanoma with a BRAF V600E or V600K mutation. FDA approval was based on the results of the Phase III COLUMBUS trial of combined encorafenib plus binimetinib versus single agent vemurafenib in 577 patients with BRAF V600E- or V600K-mutant metastatic melanoma in which the median progression-free survival was 14.9 months (95% CI: 11.0-18.5) in the encorafenib plus binimetinib group versus 7.3 months (95% CI: 5.6-8.2) in the single agent vemurafenib group (HR= 0.54, 95% CI: 0.41-0.71; p\u003C0·0001) (PMID: 29573941).',
        },
        {
            alterations: ['V600 (excluding V600E and V600K)'],
            drugs: [
                {
                    ncitCode: 'C82386',
                    drugName: 'Dabrafenib',
                },
                {
                    ncitCode: 'C77908',
                    drugName: 'Trametinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_2',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: [
                '31171876',
                '28891408',
                '31171878',
                '31171879',
                '25265492',
                '25287827',
                '29361468',
                '28991513',
                '23020132',
                '25399551',
            ],
            abstracts: [],
            description:
                'Dabrafenib, an orally bioavailable RAF inhibitor, and trametinib, an orally bioavailable MEK1/2 inhibitor, are FDA-approved alone or in combination for the treatment of patients with metastatic melanoma harboring a V600E or V600K BRAF mutation. FDA approval of dabrafenib in combination with trametinib was based on results from an open-label Phase III study of combination therapy versus dabrafenib monotherapy in 247 patients with metastatic melanoma who were naive to treatment with BRAF inhibitors. Combined dabrafenib and trametinib, administered in full monotherapy doses, improved the response rate in patients with BRAF V600-mutant metastatic melanoma versus dabrafenib monotherapy (67% vs.51%; p\u003C0.002).',
        },
        {
            alterations: ['V600 (excluding V600E and V600K)'],
            drugs: [
                {
                    ncitCode: 'C64768',
                    drugName: 'Vemurafenib',
                },
                {
                    ncitCode: 'C68923',
                    drugName: 'Cobimetinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_2',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['27480103', '25265494'],
            abstracts: [],
            description:
                'The combination of vemurafenib, an orally available kinse inhibitor of V600-mutant BRAF, and cobimetinib, an orally available kinase inhibitor of MEK1/2, is FDA-approved for the treatment of patients with BRAF V600-mutant metastatic or unresectable locally advanced melanoma. FDA approval was based on results from the randomized Phase III coBRIM trial of combined vemurafenib and cobimetinib versus vemurafenib and placebo in 495 patients with metastatic BRAF V600-mutant melanoma that demonstrated superior clinical benefit measures in the combination versus the control arm. Specifically, median progression-free survival was 9.9 months in the combination arm versus 6.2 months in the control arm (HR = 0.51), with a complete response rate of 10% versus 4%, respectively, and interim nine-month overall survival of 81% versus 73%, respectively (PMID: 25265494). Follow-up analysis of the coBRIM trial showed two-year overall survival was 48.3% in the combination group versus 38.0% in the monotherapy group (PMID: 27480103).',
        },
        {
            alterations: ['V600'],
            drugs: [
                {
                    ncitCode: 'C106254',
                    drugName: 'Tovorafenib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_3B',
            fdaLevel: 'LEVEL_Fda3',
            levelAssociatedCancerType: {
                id: 259,
                code: 'LGGNOS',
                color: 'Gray',
                name: 'Low-Grade Glioma, NOS',
                mainType: {
                    id: null,
                    name: 'Glioma',
                    tumorForm: 'SOLID',
                },
                tissue: 'CNS/Brain',
                children: {},
                parent: 'ENCG',
                level: 3,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['37978284'],
            abstracts: [],
            description:
                'Tovorafenib is an orally available, pan-RAF small molecule inhibitor that is FDA-approved for the treatment of pediatric patients six months of age and older with relapsed or refractory pediatric low-grade glioma (LGG) harboring a BRAF fusion or rearrangement, or BRAF V600 mutation. FDA approval was based on the results of the Phase II FIREFLY-1 (NCT04775485) trial of tovorafenib in 76 patients (median age=8 years old [range=2-21]) with relapsed or refractory pediatric LGG harboring an activating BRAF alteration based on local laboratory testing. In the Phase II FIREFLY-1 (NCT04775485) trial, the overall RAPNO-LGG cohort demonstrated an objective response rate (ORR) of 51% (95% CI=40-63), with a 37% (n=28) partial response rate and 14% (n=11) minor response rate, a median duration of response (DOR) of 13.8 months (95% CI=11.3-NE) in 39 patients and a median progression-free survival of 13.8 months (95% CI=8.3-16.9) (PMID: 37978284). The BRAF V600E mutation subcohort (n=12) demonstrated an ORR of 50% (95% CI=21-79) and a median DOR that was not evaluable (95% CI=8.4-NE) (PMID: 37978284).',
        },
    ],
    dataVersion: 'v4.16',
    lastUpdate: '04/26/2024',
    vus: false,
};

const APIResponse2 = {
    query: {
        id: null,
        referenceGenome: 'GRCh37',
        hugoSymbol: 'BRAF',
        entrezGeneId: 673,
        alteration: 'V600E',
        alterationType: 'MUTATION',
        svType: null,
        tumorType: 'melanoma',
        consequence: null,
        proteinStart: null,
        proteinEnd: null,
        hgvs: null,
    },
    geneExist: true,
    variantExist: true,
    alleleExist: true,
    oncogenic: 'Oncogenic',
    mutationEffect: {
        knownEffect: 'Gain-of-function',
        description:
            'The class I activating exon 15 BRAF V600E mutation is located in the kinase domain of the BRAF protein and is highly recurrent in melanoma, lung and thyroid cancer, among others (PMID: 28783719, 26091043, 25079552, 23833300, 25417114, 28783719, 12068308). This mutation has been comprehensively biologically characterized and has been shown to activate the downstream MAPK pathway independent of RAS (PMID: 15035987, 12068308, 19251651, 26343582), to render BRAF constitutively activated in monomeric form (PMID: 20179705), and to retain sensitivity to RAF monomer inhibitors such as vemurafenib and dabrafenib (PMID:26343582, 28783719, 20179705, 30351999).',
        citations: {
            pmids: [
                '25417114',
                '20179705',
                '23833300',
                '26091043',
                '26343582',
                '12068308',
                '30351999',
                '25079552',
                '28783719',
                '19251651',
                '15035987',
            ],
            abstracts: [],
        },
    },
    highestSensitiveLevel: 'LEVEL_3A',
    highestResistanceLevel: null,
    highestDiagnosticImplicationLevel: null,
    highestPrognosticImplicationLevel: null,
    highestFdaLevel: 'LEVEL_Fda2',
    otherSignificantSensitiveLevels: [],
    otherSignificantResistanceLevels: [],
    hotspot: true,
    geneSummary:
        'BRAF, an intracellular kinase, is frequently mutated in melanoma, thyroid and lung cancers among others.',
    variantSummary: 'The BRAF V600E mutation is known to be oncogenic.',
    tumorTypeSummary:
        'The RAF-targeted inhibitors encorafenib, dabrafenib and vemurafenib alone or in combination with the MEK-targeted inhibitors binimetinib, trametinib and cobimetinib, respectively, are FDA-approved for the treatment of patients with BRAF V600E/K mutant melanoma.',
    prognosticSummary: '',
    diagnosticSummary: '',
    diagnosticImplications: [],
    prognosticImplications: [],
    treatments: [
        {
            alterations: ['V600E'],
            drugs: [
                {
                    ncitCode: 'C82386',
                    drugName: 'Dabrafenib',
                },
            ],
            approvedIndications: [
                'Dabrafenib is FDA-approved for BRAF V600E mutant unresectable or metastatic melanoma.',
            ],
            level: 'LEVEL_1',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['22608338', '23051966', '22735384'],
            abstracts: [],
            description:
                'Dabrafenib is an orally bioavailable RAF inhibitor that is FDA-approved for use in patients with BRAF V600E- and V600K-mutant metastatic melanoma. FDA approval is based on the randomized Phase III trial in which dabrafenib (150 mg orally twice daily) was compared with dacarbazine (1000 mg/m2 intravenously every three weeks) in 250 patients with BRAF V600E-mutated metastatic melanoma. Dabrafenib was associated with improved progression-free survival (median 5.1 months vs. 2.7 months with dacarbazine; hazard ratio = 0.30, p\u003C0.0001) (PMID: 22735384). Dabrafenib may also be effective against brain metastases, as demonstrated by a Phase II trial in which approximately 40% of previously untreated and 30% of previously treated patients experienced an overall intracranial response and a separate trial in which nine out of ten patients had a reduction in the size of their brain metastases (PMID: 23051966, 22608338).',
        },
        {
            alterations: ['V600E'],
            drugs: [
                {
                    ncitCode: 'C82386',
                    drugName: 'Dabrafenib',
                },
                {
                    ncitCode: 'C77908',
                    drugName: 'Trametinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_1',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 984,
                code: '',
                color: '',
                name: '',
                mainType: {
                    id: null,
                    name: 'All Solid Tumors',
                    tumorForm: 'SOLID',
                },
                tissue: '',
                children: {},
                parent: null,
                level: -1,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [
                {
                    id: 935,
                    code: '',
                    color: 'SaddleBrown',
                    name: '',
                    mainType: {
                        id: null,
                        name: 'Colorectal Cancer',
                        tumorForm: 'SOLID',
                    },
                    tissue: 'Bowel',
                    children: {},
                    parent: null,
                    level: 0,
                    tumorForm: 'SOLID',
                },
            ],
            pmids: [
                '32758030',
                '27283860',
                '23020132',
                '32818466',
                '25399551',
                '34838156',
            ],
            abstracts: [
                {
                    link:
                        'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7715318/',
                    abstract:
                        'Bouffet et al. Abstract# LGG-49, Neuro-Oncology 2020',
                },
                {
                    link:
                        'https://ascopubs.org/doi/abs/10.1200/JCO.2022.40.17_suppl.LBA2002',
                    abstract: 'Bouffet et al. Abstract# LBA2002, ASCO 2022',
                },
            ],
            description:
                'Dabrafenib, an orally bioavailable RAF inhibitor, and trametinib, an orally bioavailable MEK1/2 inhibitor, are FDA-approved in combination for the treatment of patients with solid tumors other than colorectal harboring BRAF V600E mutation. FDA approval was based on data from 131 adult patients with solid tumors treated with dabrafenib and trametinib in the BRF117019 and NCI-MATCH trials and 36 pediatric patients treated with dabrafenib and trametinib in the CTMT212X2101 study. Of the 131 adult patients treated with dabrafenib and trametinib, the overall response rate was 41% (54/131; 95% CI = 33-50) and of the 36 pediatric patients treated with dabrafenib and trametinib (low-grade glioma, n=34; high-grade glioma, n=2), the overall response rate was 25% (95% CI = 12-24) (PMID: 32818466, 34838156, 32758030)(Abstract: Bouffet et al. Abstract# LGG-49, Neuro-Oncology 2020. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7715318/). In the randomized, Phase II study of dabrafenib and trametinib in 110 patients with BRAF V600–mutant pediatric low-grade glioma (dabrafenib + trametinib treatment, n=37; carboplatin + vincristine treatment, n=37), the overall response rate was 47% (95% CI= 35%-59%) with dabrafenib and trametinib and 11% (95% CI= 3%-25%) with carboplatin and vincristine, and the progression-free survival was 20.1 months (95% CI= 12.8 mo-not estimable) with dabrafenib and trametinib and 7.4 months (95% CI= 3.6-11.8 mo) with carboplatin and vincristine (Abstract: Bouffet et al. Abstract# LBA2002, ASCO 2022. https://ascopubs.org/doi/abs/10.1200/JCO.2022.40.17_suppl.LBA2002). FDA approval was supported by results in COMBI-d, COMBI-v and BRF113928 studies in melanoma and lung cancer (PMID: 23020132, 25399551, 27283860).',
        },
        {
            alterations: ['V600'],
            drugs: [
                {
                    ncitCode: 'C64768',
                    drugName: 'Vemurafenib',
                },
                {
                    ncitCode: 'C106250',
                    drugName: 'Atezolizumab',
                },
                {
                    ncitCode: 'C68923',
                    drugName: 'Cobimetinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_1',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['32534646'],
            abstracts: [],
            description:
                'The combination of vemurafenib, an inhibitor of V600-mutant BRAF, and cobimetinib, an inhibitor of MEK1/2, with atezolizumab, an immunotherapeutic PD-L1 antibody, is FDA-approved for patients with BRAF V600 mutation-positive unresectable or metastatic melanoma. FDA approval was based on the results of the Phase III double-blind, randomized, placebo-controlled IMspire150 trial of Atezolizumab + Cobimetinib + Vemurafenib versus Placebo + Cobimetinib + Vemurafenib in 514 patients with BRAF V600-mutant melanoma in which the median progression-free survival was 15.1 mos (95% CI=11.4,18.4) in the triplet arm versus 10.6 mos (95% CI=9.3,12.7) in the doublet + placebo arm (HR=0.78; 95% CI= 0.63, 0.97; p=0.0249) (PMID: 32534646).',
        },
        {
            alterations: ['V600E', 'V600K'],
            drugs: [
                {
                    ncitCode: 'C77908',
                    drugName: 'Trametinib',
                },
            ],
            approvedIndications: [
                'Trametinib is FDA-approved for BRAF V600E or V600K mutant unresectable or metastatic melanoma',
            ],
            level: 'LEVEL_1',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['29361468', '25399551', '22663011', '25265492'],
            abstracts: [],
            description:
                'Trametinib is an oral small molecule inhibitor of MEK1/2 that is FDA-approved alone or with dabrafenib for the treatment of patients with metastatic melanoma harboring a V600E or V600K BRAF mutation. In an open-label, randomized Phase III trial, patients with BRAF V600E/K-mutated unresectable, metastatic melanoma received oral trametinib (2 mg once daily) or an intravenous regimen of either dacarbazine (1000 mg/m2) or paclitaxel (175 mg/m2) every three weeks. Trametinib demonstrated improved progression-free survival (HR for disease progression or death = 0.45) and six-month overall survival (81% vs. 67%; death HR = 0.54; p=0.01) (PMID: 22663011). However, like other MEK inhibitors, the benefit of trametinib is limited by adverse reactions, most notably grade three or four rash and diarrhea (PMID: 22663011). Trametinib is not typically used as monotherapy for patients with BRAF V600K melanoma given its lower response rate compared to BRAF inhibitors and combined BRAF and MEK inhibitors. Patients previously treated with a RAF inhibitor appear to be less likely than untreated patients to respond to trametinib treatment (PMID: 22663011), and FDA guidelines state that trametinib as a monotherapy is not indicated for these patients. Dabrafenib and trametinib are FDA-approved as a combination therapy, which has superior clinical outcomes compared to dabrafenib or trametinib monotherapy (PMID: 25399551, 25265492). Additionally, patients with melanoma treated with dabrafenib and trametinib in both the neoadjuvant and adjuvant settings had improved survival over patients given standard of care (PMID: 29361468).',
        },
        {
            alterations: ['V600E'],
            drugs: [
                {
                    ncitCode: 'C64768',
                    drugName: 'Vemurafenib',
                },
            ],
            approvedIndications: [
                'Vemurafenib is FDA-approved for BRAF V600E mutant unresectable or metastatic melanoma',
            ],
            level: 'LEVEL_1',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['28961848', '24508103', '25399551'],
            abstracts: [],
            description:
                'Vemurafenib is an orally available kinse inhibitor of V600-mutant BRAF that is FDA-approved for treatment of patients with unresectable or metastatic melanoma with the BRAF V600E mutation. Vemurafenib has been shown to have nearly equivalent activity against melanomas with BRAF V600E and V600K mutations (PMID: 24508103). In a randomized Phase III trial comparing vemurafenib (960 mg orally twice daily) with dacarbazine (1000 mg/m2 i.v. every 3 weeks) for treatment-naive, metastatic, BRAF V600E-mutant melanoma, vemurafenib was associated with better overall survival (median survival 13.6 months vs. 9.7 months; hazard ratio 0.70, p=.0008) and longer median progression-free survival (6.9 months vs. 1.6 months) (PMID: 24508103). Final overall survival data from the BRIM-3 study showed that the survival advantage of vemurafenib over dacarbazine persisted through the 4-year landmark, with survival rates for vemurafenib and dacarbazine at the 4-year landmark being 17.0% and 15.6%, respectively (PMID: 28961848). However, a trial evaluating clinical outcomes in patients with melanoma treated with either combination therapy of dabrafenib and trametinib compared to those treated with vemurafenib monotherapy demonstrated improved survival outcomes in the combination-therapy group compared to the vemurafenib group (PMID: 25399551).',
        },
        {
            alterations: ['V600E', 'V600K'],
            drugs: [
                {
                    ncitCode: 'C64768',
                    drugName: 'Vemurafenib',
                },
                {
                    ncitCode: 'C68923',
                    drugName: 'Cobimetinib',
                },
            ],
            approvedIndications: [
                'Cobimetinib is FDA-approved for the treatment of patients with unresectable or metastatic melanoma with a BRAF V600E or V600K mutation, in combination with vemurafenib. Cobimetinib is not indicated for treatment of patients with wild-type BRAF melanoma.',
            ],
            level: 'LEVEL_1',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['27480103', '31732523', '25265494'],
            abstracts: [],
            description:
                'The RAF inhibitor vemurafenib in combination with the MEK inhibitor cobimetinib is FDA-approved for the treatment of patients with BRAF V600-mutant metastatic or unresectable locally advanced melanoma. FDA approval was based on results from the randomized Phase III coBRIM trial of combined vemurafenib and cobimetinib versus vemurafenib and placebo in 495 patients with metastatic BRAF V600-mutant melanoma that demonstrated superior clinical benefit measures in the combination versus the control arm. Specifically, median progression-free survival was 9.9 months in the combination arm versus 6.2 months in the control arm (HR = 0.51), with a complete response rate of 10% versus 4%, respectively, and interim nine-month overall survival of 81% versus 73%, respectively (PMID: 25265494). Follow-up analysis of the coBRIM trial showed two-year overall survival was 48.3% in the combination group versus 38.0% in the monotherapy group (PMID: 27480103), and five-year followup of the BRIM7 study showed a median overall survival of 31.8 months and a five-year survival rate of 39.2% (PMID: 31732523).',
        },
        {
            alterations: ['V600E', 'V600K'],
            drugs: [
                {
                    ncitCode: 'C98283',
                    drugName: 'Encorafenib',
                },
                {
                    ncitCode: 'C84865',
                    drugName: 'Binimetinib',
                },
            ],
            approvedIndications: [
                'In combination for patients with unresectable or metastatic melanoma with a BRAF V600E or V600K mutation',
            ],
            level: 'LEVEL_1',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['29573941', '35862871'],
            abstracts: [],
            description:
                'The combination of encorafenib, an inhibitor of V600E- or V600K-mutant BRAF, and binimetinib, an inhibitor of MEK1/2, is FDA-approved in combination for patients with unresectable or metastatic melanoma with a BRAF V600E or V600K mutation. FDA approval was based on the results of the Phase III COLUMBUS trial of combined encorafenib plus binimetinib versus single-agent vemurafenib in 577 patients with BRAF V600E- or V600K-mutant metastatic melanoma in which the median progression-free survival was 14.9 months (95% CI = 11.0-18.5) in the encorafenib plus binimetinib group versus 7.3 months (95% CI = 5.6-8.2) in the single agent vemurafenib group (HR= 0.54, 95% CI = 0.41-0.71; p\u003C0·0001) (PMID: 29573941). In the five-year update of the Phase III COLUMBUS trial, the progression-free survival and overall survival were 23% and 35% respectively in the encorafenib plus binimetinib group (n=192) versus 10% and 21% respectively in the single agent vemurafenib group (n=191), and the median duration of response and disease control rate were 18.6 months and 92.2% in the encorafenib plus binimetinib group versus 12.3 months and 81.2% in the single-agent vemurafenib group (PMID: 35862871).',
        },
        {
            alterations: ['V600E'],
            drugs: [
                {
                    ncitCode: 'C98283',
                    drugName: 'Encorafenib',
                },
                {
                    ncitCode: 'C1723',
                    drugName: 'Cetuximab',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_3B',
            fdaLevel: 'LEVEL_Fda3',
            levelAssociatedCancerType: {
                id: 935,
                code: '',
                color: 'SaddleBrown',
                name: '',
                mainType: {
                    id: null,
                    name: 'Colorectal Cancer',
                    tumorForm: 'SOLID',
                },
                tissue: 'Bowel',
                children: {},
                parent: null,
                level: 0,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['31566309'],
            abstracts: [],
            description:
                'Encorafenib, a small molecule inhibitor of RAF kinase, and cetuximab, an antibody that targets EGFR, are FDA-approved in combination for the treatment of adult patients with metastatic colorectal cancer with a BRAF V600E mutation after prior therapy. FDA approval was based on results of the Phase III BEACON study of encorafenib + cetuximab versus triplet treatment (including a MEK1/2 inhibitor) versus chemotherapy in 665 patients with BRAF V600E-mutant colorectal cancer, in which the overall response rate (complete or partial response) was 20% (95% CI= 13-29) in the doublet arm (n=220) versus 2% (95% CI= \u003C1%-7%) in the chemotherapy arm (n=221), with median overall survival of 8.4 months in the doublet arm (95% CI= 7.5-11.0) and 5.4 months in the control arm (95% CI= 4.8-6.6) (PMID: 31566309).',
        },
        {
            alterations: ['V600E'],
            drugs: [
                {
                    ncitCode: 'C66939',
                    drugName: 'Selumetinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_3B',
            fdaLevel: 'LEVEL_Fda3',
            levelAssociatedCancerType: {
                id: 407,
                code: 'PAST',
                color: 'Gray',
                name: 'Pilocytic Astrocytoma',
                mainType: {
                    id: null,
                    name: 'Glioma',
                    tumorForm: 'SOLID',
                },
                tissue: 'CNS/Brain',
                children: {},
                parent: 'ENCG',
                level: 3,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['31151904'],
            abstracts: [],
            description:
                'Selumetinib is a small molecule tyrosine kinase inhibitor of MEK1/2. In stratum one of the phase II PBTC study of selumetinib in 25 patients with pilocytic astrocytoma harboring a KIAA1549–BRAF fusion or BRAF V600E mutation, seven of eighteen patients with a KIAA1549–BRAF fusion had a partial response to treatment (PMID: 31151904). Additionally, the two year progression-free survival rate for the BRAF study population (n=25) was 70% (95% CI = 47–85) (PMID: 31151904).',
        },
        {
            alterations: ['V600'],
            drugs: [
                {
                    ncitCode: 'C106254',
                    drugName: 'Tovorafenib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_3B',
            fdaLevel: 'LEVEL_Fda3',
            levelAssociatedCancerType: {
                id: 259,
                code: 'LGGNOS',
                color: 'Gray',
                name: 'Low-Grade Glioma, NOS',
                mainType: {
                    id: null,
                    name: 'Glioma',
                    tumorForm: 'SOLID',
                },
                tissue: 'CNS/Brain',
                children: {},
                parent: 'ENCG',
                level: 3,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['37978284'],
            abstracts: [],
            description:
                'Tovorafenib is an orally available, pan-RAF small molecule inhibitor that is FDA-approved for the treatment of pediatric patients six months of age and older with relapsed or refractory pediatric low-grade glioma (LGG) harboring a BRAF fusion or rearrangement, or BRAF V600 mutation. FDA approval was based on the results of the Phase II FIREFLY-1 (NCT04775485) trial of tovorafenib in 76 patients (median age=8 years old [range=2-21]) with relapsed or refractory pediatric LGG harboring an activating BRAF alteration based on local laboratory testing. In the Phase II FIREFLY-1 (NCT04775485) trial, the overall RAPNO-LGG cohort demonstrated an objective response rate (ORR) of 51% (95% CI=40-63), with a 37% (n=28) partial response rate and 14% (n=11) minor response rate, a median duration of response (DOR) of 13.8 months (95% CI=11.3-NE) in 39 patients and a median progression-free survival of 13.8 months (95% CI=8.3-16.9) (PMID: 37978284). The BRAF V600E mutation subcohort (n=12) demonstrated an ORR of 50% (95% CI=21-79) and a median DOR that was not evaluable (95% CI=8.4-NE) (PMID: 37978284).',
        },
        {
            alterations: ['V600E'],
            drugs: [
                {
                    ncitCode: 'C98283',
                    drugName: 'Encorafenib',
                },
                {
                    ncitCode: 'C1857',
                    drugName: 'Panitumumab',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_3B',
            fdaLevel: 'LEVEL_Fda3',
            levelAssociatedCancerType: {
                id: 935,
                code: '',
                color: 'SaddleBrown',
                name: '',
                mainType: {
                    id: null,
                    name: 'Colorectal Cancer',
                    tumorForm: 'SOLID',
                },
                tissue: 'Bowel',
                children: {},
                parent: null,
                level: 0,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['29431699', '31566309'],
            abstracts: [],
            description:
                'Encorafenib, a small molecule inhibitor of RAF kinase, and panitumumab, an antibody that targets EGFR, are NCCN-compendium listed in combination as level 2A therapy for patients with BRAF V600E-positive colorectal cancer. In the Phase III BEACON study of encorafenib + cetuximab, another EGFR antibody, versus triplet treatment (including a MEK1/2 inhibitor) versus chemotherapy in 665 patients with BRAF V600E-mutant colorectal cancer, the overall response rate (complete or partial response) was 20% (95% CI= 13-29) in the doublet arm (n=220) versus 2% (95% CI= \u003C1%-7%) in the chemotherapy arm (n=221), with median overall survival of 8.4 months in the doublet arm (95% CI= 7.5-11.0) and 5.4 months in the control arm (95% CI= 4.8-6.6) (PMID: 31566309). Panitumumab has also been used in doublet and triplet combination therapy, with a response rate in one study of 26% (PMID: 29431699).',
        },
    ],
    dataVersion: 'v4.16',
    lastUpdate: '04/26/2024',
    vus: false,
};

const APIResponse4 = {
    query: {
        id: null,
        referenceGenome: 'GRCh37',
        hugoSymbol: 'BRAF',
        entrezGeneId: 673,
        alteration: 'V600G',
        alterationType: 'COPY_NUMBER_ALTERATION',
        svType: null,
        tumorType: 'melanoma',
        consequence: null,
        proteinStart: null,
        proteinEnd: null,
        hgvs: null,
    },
    geneExist: true,
    variantExist: true,
    alleleExist: true,
    oncogenic: 'Likely Oncogenic',
    mutationEffect: {
        knownEffect: 'Gain-of-function',
        description:
            'The class I (PMID: 28783719) activating exon 15 BRAF V600G mutation is located in the kinase domain of the protein. This mutation has been found in cardio-facio-cutaneous syndrome (CFC), lung cancer and esophagogastric cancer (PMID: 26287849). Substitutions at position V600 of BRAF, including the common BRAF V600E mutation, are known to be activating and oncogenic (PMID: 12068308, 16273091, 15035987). Expression of this mutation in 293T cells demonstrated that this mutation is activating as measured by increased downstream ERK activation and increased transcription of downstream MAPK pathway transcriptional targets (e.g. ELK) compared to wildtype BRAF (PMID: 20735442). A patient with non-small cell lung cancer (NSCLC) harboring the BRAF V600G mutation had stable disease in response to treatment with vemutafenib, while a patient with sarcoma and a patient with esophagogastric cancer both harboring the BRAF V600G mutation had progressive disease in response to vemurafenib (PMID: 26287849).',
        citations: {
            pmids: [
                '20735442',
                '28783719',
                '26287849',
                '16273091',
                '12068308',
                '15035987',
            ],
            abstracts: [],
        },
    },
    highestSensitiveLevel: 'LEVEL_1',
    highestResistanceLevel: null,
    highestDiagnosticImplicationLevel: null,
    highestPrognosticImplicationLevel: null,
    highestFdaLevel: 'LEVEL_Fda2',
    otherSignificantSensitiveLevels: [],
    otherSignificantResistanceLevels: [],
    hotspot: true,
    geneSummary:
        'BRAF, an intracellular kinase, is frequently mutated in melanoma, thyroid and lung cancers among others.',
    variantSummary: 'The BRAF V600G mutation is likely oncogenic.',
    tumorTypeSummary:
        'The RAF-targeted inhibitors encorafenib, dabrafenib and vemurafenib, alone or in combination with the MEK1/2-targeted inhibitors binimetinib, trametinib and cobimetinib respectively, are FDA-approved for the treatment of patients with BRAF V600E/K mutant melanoma and NCCN-compendium listed for the treatment of patients with BRAF V600-mutant melanoma. Additionally, the anti-PD-L1 antibody atezolizumab in combination with cobimetinib + vemurafenib is FDA-approved for the treatment of patients with unresectable or advanced BRAF V600-mutant melanoma.',
    prognosticSummary: '',
    diagnosticSummary: '',
    diagnosticImplications: [],
    prognosticImplications: [],
    treatments: [
        {
            alterations: ['V600'],
            drugs: [
                {
                    ncitCode: 'C64768',
                    drugName: 'Vemurafenib',
                },
                {
                    ncitCode: 'C106250',
                    drugName: 'Atezolizumab',
                },
                {
                    ncitCode: 'C68923',
                    drugName: 'Cobimetinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_1',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['32534646'],
            abstracts: [],
            description:
                'The combination of vemurafenib, an inhibitor of V600-mutant BRAF, and cobimetinib, an inhibitor of MEK1/2, with atezolizumab, an immunotherapeutic PD-L1 antibody, is FDA-approved for patients with BRAF V600 mutation-positive unresectable or metastatic melanoma. FDA approval was based on the results of the Phase III double-blind, randomized, placebo-controlled IMspire150 trial of Atezolizumab + Cobimetinib + Vemurafenib versus Placebo + Cobimetinib + Vemurafenib in 514 patients with BRAF V600-mutant melanoma in which the median progression-free survival was 15.1 mos (95% CI=11.4,18.4) in the triplet arm versus 10.6 mos (95% CI=9.3,12.7) in the doublet + placebo arm (HR=0.78; 95% CI= 0.63, 0.97; p=0.0249) (PMID: 32534646).',
        },
        {
            alterations: ['V600 (excluding V600E and V600K)'],
            drugs: [
                {
                    ncitCode: 'C98283',
                    drugName: 'Encorafenib',
                },
                {
                    ncitCode: 'C84865',
                    drugName: 'Binimetinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_2',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['29573941'],
            abstracts: [],
            description:
                'The combination of encorafenib, an inhibitor of V600E- or V600K-mutant BRAF, and binimetinib, an inhibitor of MEK1/2, is FDA-approved in combination for patients with unresectable or metastatic melanoma with a BRAF V600E or V600K mutation. FDA approval was based on the results of the Phase III COLUMBUS trial of combined encorafenib plus binimetinib versus single agent vemurafenib in 577 patients with BRAF V600E- or V600K-mutant metastatic melanoma in which the median progression-free survival was 14.9 months (95% CI: 11.0-18.5) in the encorafenib plus binimetinib group versus 7.3 months (95% CI: 5.6-8.2) in the single agent vemurafenib group (HR= 0.54, 95% CI: 0.41-0.71; p\u003C0·0001) (PMID: 29573941).',
        },
        {
            alterations: ['V600 (excluding V600E and V600K)'],
            drugs: [
                {
                    ncitCode: 'C82386',
                    drugName: 'Dabrafenib',
                },
                {
                    ncitCode: 'C77908',
                    drugName: 'Trametinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_2',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: [
                '31171876',
                '28891408',
                '31171878',
                '31171879',
                '25265492',
                '25287827',
                '29361468',
                '28991513',
                '23020132',
                '25399551',
            ],
            abstracts: [],
            description:
                'Dabrafenib, an orally bioavailable RAF inhibitor, and trametinib, an orally bioavailable MEK1/2 inhibitor, are FDA-approved alone or in combination for the treatment of patients with metastatic melanoma harboring a V600E or V600K BRAF mutation. FDA approval of dabrafenib in combination with trametinib was based on results from an open-label Phase III study of combination therapy versus dabrafenib monotherapy in 247 patients with metastatic melanoma who were naive to treatment with BRAF inhibitors. Combined dabrafenib and trametinib, administered in full monotherapy doses, improved the response rate in patients with BRAF V600-mutant metastatic melanoma versus dabrafenib monotherapy (67% vs.51%; p\u003C0.002). However, median progression-free survival improved by only two weeks (9.3 months vs 8.8 months; HR = 0.75) compared with dabrafenib monotherapy (PMID: 23020132). Combination therapy is associated with less cutaneous toxicity than monotherapy, but systemic toxicity may be increased (PMID: 25287827, 25399551). Follow-up trials have demonstrated that all clinical measures inclusive of overall and median progression-free survival as well as objective response rates, median duration of response and number of patients with complete response favored patients treated with combination dabrafenib and trametinib, administered in full monotherapy doses, compared to either dabrafenib or vemurafenib monotherapy, including patients who previously progressed on BRAF inhibitor monotherapy (PMID: 25287827, 25399551, 25265492). Additionally, patients with melanoma treated with dabrafenib and trametinib in both the neoadjuvant and adjuvant settings have improved survival over patients given standard of care (PMID: 29361468, 28991513, 28891408). Promising clinical data has also suggested that addition of an immunotherapy agent to combination RAF and MEK inhibitor treatment may improve rate of overall response and duration of response in melanoma patients (PMID: 31171876, 31171879, 31171878).',
        },
        {
            alterations: ['V600 (excluding V600E and V600K)'],
            drugs: [
                {
                    ncitCode: 'C64768',
                    drugName: 'Vemurafenib',
                },
                {
                    ncitCode: 'C68923',
                    drugName: 'Cobimetinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_2',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 453,
                code: 'MEL',
                color: 'Black',
                name: 'Melanoma',
                mainType: {
                    id: null,
                    name: 'Melanoma',
                    tumorForm: 'SOLID',
                },
                tissue: 'Skin',
                children: {},
                parent: 'SKIN',
                level: 2,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['27480103', '25265494'],
            abstracts: [],
            description:
                'The combination of vemurafenib, an orally available kinse inhibitor of V600-mutant BRAF, and cobimetinib, an orally available kinase inhibitor of MEK1/2, is FDA-approved for the treatment of patients with BRAF V600-mutant metastatic or unresectable locally advanced melanoma. FDA approval was based on results from the randomized Phase III coBRIM trial of combined vemurafenib and cobimetinib versus vemurafenib and placebo in 495 patients with metastatic BRAF V600-mutant melanoma that demonstrated superior clinical benefit measures in the combination versus the control arm. Specifically, median progression-free survival was 9.9 months in the combination arm versus 6.2 months in the control arm (HR = 0.51), with a complete response rate of 10% versus 4%, respectively, and interim nine-month overall survival of 81% versus 73%, respectively (PMID: 25265494). Follow-up analysis of the coBRIM trial showed two-year overall survival was 48.3% in the combination group versus 38.0% in the monotherapy group (PMID: 27480103).',
        },
        {
            alterations: ['V600'],
            drugs: [
                {
                    ncitCode: 'C106254',
                    drugName: 'Tovorafenib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_3B',
            fdaLevel: 'LEVEL_Fda3',
            levelAssociatedCancerType: {
                id: 259,
                code: 'LGGNOS',
                color: 'Gray',
                name: 'Low-Grade Glioma, NOS',
                mainType: {
                    id: null,
                    name: 'Glioma',
                    tumorForm: 'SOLID',
                },
                tissue: 'CNS/Brain',
                children: {},
                parent: 'ENCG',
                level: 3,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['37978284'],
            abstracts: [],
            description:
                'Tovorafenib is an orally available, pan-RAF small molecule inhibitor that is FDA-approved for the treatment of pediatric patients six months of age and older with relapsed or refractory pediatric low-grade glioma (LGG) harboring a BRAF fusion or rearrangement, or BRAF V600 mutation. FDA approval was based on the results of the Phase II FIREFLY-1 (NCT04775485) trial of tovorafenib in 76 patients (median age=8 years old [range=2-21]) with relapsed or refractory pediatric LGG harboring an activating BRAF alteration based on local laboratory testing. In the Phase II FIREFLY-1 (NCT04775485) trial, the overall RAPNO-LGG cohort demonstrated an objective response rate (ORR) of 51% (95% CI=40-63), with a 37% (n=28) partial response rate and 14% (n=11) minor response rate, a median duration of response (DOR) of 13.8 months (95% CI=11.3-NE) in 39 patients and a median progression-free survival of 13.8 months (95% CI=8.3-16.9) (PMID: 37978284). The BRAF V600E mutation subcohort (n=12) demonstrated an ORR of 50% (95% CI=21-79) and a median DOR that was not evaluable (95% CI=8.4-NE) (PMID: 37978284).',
        },
    ],
    dataVersion: 'v4.16',
    lastUpdate: '04/26/2024',
    vus: false,
};

const APIResponse5 = {
    query: {
        id: null,
        referenceGenome: 'GRCh37',
        hugoSymbol: 'KIT',
        entrezGeneId: 3815,
        alteration: 'D816',
        alterationType: 'COPY_NUMBER_ALTERATION',
        svType: null,
        tumorType: 'mastocytosis',
        consequence: null,
        proteinStart: null,
        proteinEnd: null,
        hgvs: null,
    },
    geneExist: true,
    variantExist: true,
    alleleExist: true,
    oncogenic: 'Likely Oncogenic',
    mutationEffect: {
        knownEffect: 'Unknown',
        description:
            'The KIT D816 mutation has not specifically been reviewed by the OncoKB team. However, we have mutation effect descriptions for KIT D816A/E/F/G/H/I/N/V/Y.',
        citations: {
            pmids: [],
            abstracts: [],
        },
    },
    highestSensitiveLevel: 'LEVEL_1',
    highestResistanceLevel: null,
    highestDiagnosticImplicationLevel: null,
    highestPrognosticImplicationLevel: null,
    highestFdaLevel: 'LEVEL_Fda2',
    otherSignificantSensitiveLevels: [],
    otherSignificantResistanceLevels: [],
    hotspot: true,
    geneSummary:
        'KIT, a receptor tyrosine kinase, is recurrently mutated in gastrointestinal stromal tumors.',
    variantSummary:
        'KIT D816 has been identified as a statistically significant hotspot and variants at this position are considered likely oncogenic.',
    tumorTypeSummary:
        'Avapritinib, a selective KIT inhibitor, is FDA-approved for patients with advanced systemic mastocytosis, >90% of which harbor a KIT D816 mutation.',
    prognosticSummary: '',
    diagnosticSummary: '',
    diagnosticImplications: [],
    prognosticImplications: [],
    treatments: [
        {
            alterations: ['D816'],
            drugs: [
                {
                    ncitCode: 'C123827',
                    drugName: 'Avapritinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_1',
            fdaLevel: 'LEVEL_Fda2',
            levelAssociatedCancerType: {
                id: 916,
                code: '',
                color: 'LightSalmon',
                name: '',
                mainType: {
                    id: null,
                    name: 'Mastocytosis',
                    tumorForm: 'LIQUID',
                },
                tissue: 'Myeloid',
                children: {},
                parent: null,
                level: 0,
                tumorForm: 'LIQUID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['30911112'],
            abstracts: [
                {
                    link:
                        'https://ash.confex.com/ash/2020/webprogram/Paper139367.html',
                    abstract: 'Akin et al. Abstract# 1248, ASH 2020',
                },
                {
                    link:
                        'https://ashpublications.org/blood/article/136/Supplement%201/37/470030/Pure-Pathologic-Response-Is-Associated-with',
                    abstract: 'Gotlib et al. Abstract# 634, ASH 2020',
                },
                {
                    link:
                        'https://www.ashclinicalnews.org/on-location/other-meetings/pathfinder-avapritinib-induces-rapid-responses-advanced-systemic-mastocytosis/',
                    abstract: 'DeAngelo et al. Absract# CT023, AACR 2021',
                },
            ],
            description:
                'Avapritinib, a small molecule inhibitor of KIT, is FDA-approved for the treatment of adult patients with advanced systemic mastocytosis (AdvSM). Approval was based on the results of the EXPLORER and PATHFINDER single-arm, open-label studies in 53 evaluable patients with AdvSM in which the combined overall response rate was 57% (95% CI= 42,70), with 28% of patients reaching complete remission with full or partial hematologic recovery, and 28% of patients reaching partial remission (Abstract: Gotlib et al. Abstract# 634, ASH 2020. https://ashpublications.org/blood/article/136/Supplement%201/37/470030/Pure-Pathologic-Response-Is-Associated-with)(Abstract: DeAngelo et al. Absract# CT023, AACR 2021. https://www.ashclinicalnews.org/on-location/other-meetings/pathfinder-avapritinib-induces-rapid-responses-advanced-systemic-mastocytosis/). The Systemic Mastocytosis NCCN v2.2021 states that 90-95% of patients with AdvSM have a mutation at codon D816 of KIT. In the international, multicenter, randomized, double-blind, placebo-controlled Phase II PI0NEER study of avapritinib in 39 patients with indolent systemic mastocytosis (n=37 KIT D816V-positive), six out of ten patients in the 25mg avapritinib once daily cohort (n=10) cleared or had a >50% reduction in blood KIT D816V allele fraction (Abstract: Akin et al. Abstract# 1248, ASH 2020. https://ash.confex.com/ash/2020/webprogram/Paper139367.html). Updated data from the Phase II PI0NEER study of avapritinib (n=118) versus placebo (n=63) in patients with indolent systemic mastocytosis harboring KIT D816V demonstrated that 80 patients in the avapritinib arm (68%; 59 to 75%) achieved a >50% reduction in blood KIT D816V allele fraction compared to four patients in the placebo arm (6%; 2 to 16%; P<0.001) (Abstract: Gotlib et al. NEJM Evid 2023;2(6). https://evidence.nejm.org/doi/full/10.1056/EVIDoa2200339). Preclinical studies with advanced systemic mastocytosis patient-derived myeloid progenitor cells expressing KIT D816V treated with midostaurin (n=10) or avapritinib (n=11) showed a marked reduction (>50%) of KIT D816V-positive colonies in three of ten (30%) and seven of eleven (64%) samples, respectively (PMID: 30911112).',
        },
    ],
    dataVersion: 'v4.16',
    lastUpdate: '10/17/2023',
    vus: false,
};

const APIResponse6 = {
    query: {
        id: null,
        referenceGenome: 'GRCh37',
        hugoSymbol: 'EGFR',
        entrezGeneId: 1956,
        alteration: 'Amplification',
        alterationType: 'STRUCTURAL_VARIANT',
        svType: null,
        tumorType: 'glioma',
        consequence: null,
        proteinStart: null,
        proteinEnd: null,
        hgvs: null,
    },
    geneExist: true,
    variantExist: true,
    alleleExist: false,
    oncogenic: 'Oncogenic',
    mutationEffect: {
        knownEffect: 'Gain-of-function',
        description:
            'EGFR amplification results from the gain of extra copies of the EGFR gene on chromosome 7p11. Often, this leads to the overexpression of EGFR protein and hyperactivation of downstream signaling through the MAPK pathway (PMID: 24120142, 10728703). EGFR amplification is found across various cancers, including lung adenocarcinoma, esophageal carcinoma and glioma (PMID: 25079552, 28052061, 24120142). In vitro and in vivo studies demonstrate that EGFR amplification in primary glioma sphere-forming cell samples results in sensitivity to the PARP inhibitor talazoparib as measured by decreased viability and reduced tumor growth in a xenograft model upon drug treatment (PMID: 31852834). Patients with non-small cell lung cancer who harbor amplification of wildtype or tyrosine kinase inhibitor (TKI)-sensitive mutant EGFR have shown clinical benefit in response to EGFR TKIs (PMID: 30622811, 30284706). Additionally, EGFR amplification has been associated with sensitivity to HER2 inhibition with afatinib in HER2+ esophagogastric cancer (PMID: 30463996). A patient with salivary gland cancer harboring high-level EGFR amplification had a durable, near-complete response to treatment with afatinib (Abstract: Lai et al. JCO PO, 2019. https://ascopubs.org/doi/full/10.1200/PO.19.00186).',
        citations: {
            pmids: [
                '24120142',
                '30463996',
                '10728703',
                '28052061',
                '30284706',
                '30622811',
                '25079552',
                '31852834',
            ],
            abstracts: [
                {
                    link: 'https://ascopubs.org/doi/full/10.1200/PO.19.00186',
                    abstract: 'Lai et al. JCO PO, 2019',
                },
            ],
        },
    },
    highestSensitiveLevel: 'LEVEL_4',
    highestResistanceLevel: null,
    highestDiagnosticImplicationLevel: null,
    highestPrognosticImplicationLevel: null,
    highestFdaLevel: 'LEVEL_Fda3',
    otherSignificantSensitiveLevels: [],
    otherSignificantResistanceLevels: [],
    hotspot: false,
    geneSummary:
        'EGFR, a receptor tyrosine kinase, is altered by amplification and/or mutation in lung and brain cancers among others.',
    variantSummary: 'EGFR amplification is known to be oncogenic.',
    tumorTypeSummary:
        'Laboratory data suggest that cancer cells with EGFR-amplification may be sensitive to the EGFR/HER2 tyrosine kinase inhibitor lapatinib.',
    prognosticSummary: '',
    diagnosticSummary: '',
    diagnosticImplications: [],
    prognosticImplications: [],
    treatments: [
        {
            alterations: ['Amplification'],
            drugs: [
                {
                    ncitCode: 'C26653',
                    drugName: 'Lapatinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_4',
            fdaLevel: 'LEVEL_Fda3',
            levelAssociatedCancerType: {
                id: 882,
                code: '',
                color: 'Gray',
                name: '',
                mainType: {
                    id: null,
                    name: 'Glioma',
                    tumorForm: 'SOLID',
                },
                tissue: 'CNS/Brain',
                children: {},
                parent: null,
                level: 0,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['22588883', '20459769', '18334972'],
            abstracts: [],
            description:
                'Lapatinib is a small molecule tyrosine kinase inhibitor of the ERBB2 and EGFR kinases. In vitro studies of glioma cell lines expressing EGFR ectodomain mutations demonstrated that they were sensitive to treatment with lapatinib as shown by apoptosis and decreased pathway activation upon drug treatment. Lapatinib sensitivity has also been observed in lung cancer cell lines with EGFR ectodomain mutations or EGFR amplification, and in endometrial cancer cell lines with increased EGFR expression (PMID: 22588883, 20459769, 18334972).',
        },
    ],
    dataVersion: 'v4.16',
    lastUpdate: '02/23/2023',
    vus: false,
};

const APIResponse3 = {
    query: {
        id: null,
        referenceGenome: 'GRCh37',
        hugoSymbol: 'EGFR',
        entrezGeneId: 1956,
        alteration: 'Amplification',
        alterationType: 'STRUCTURAL_VARIANT',
        svType: null,
        tumorType: 'glioma',
        consequence: null,
        proteinStart: null,
        proteinEnd: null,
        hgvs: null,
    },
    geneExist: true,
    variantExist: true,
    alleleExist: false,
    oncogenic: 'Oncogenic',
    mutationEffect: {
        knownEffect: 'Gain-of-function',
        description:
            'EGFR amplification results from the gain of extra copies of the EGFR gene on chromosome 7p11. Often, this leads to the overexpression of EGFR protein and hyperactivation of downstream signaling through the MAPK pathway (PMID: 24120142, 10728703). EGFR amplification is found across various cancers, including lung adenocarcinoma, esophageal carcinoma and glioma (PMID: 25079552, 28052061, 24120142). In vitro and in vivo studies demonstrate that EGFR amplification in primary glioma sphere-forming cell samples results in sensitivity to the PARP inhibitor talazoparib as measured by decreased viability and reduced tumor growth in a xenograft model upon drug treatment (PMID: 31852834). Patients with non-small cell lung cancer who harbor amplification of wildtype or tyrosine kinase inhibitor (TKI)-sensitive mutant EGFR have shown clinical benefit in response to EGFR TKIs (PMID: 30622811, 30284706). Additionally, EGFR amplification has been associated with sensitivity to HER2 inhibition with afatinib in HER2+ esophagogastric cancer (PMID: 30463996). A patient with salivary gland cancer harboring high-level EGFR amplification had a durable, near-complete response to treatment with afatinib (Abstract: Lai et al. JCO PO, 2019. https://ascopubs.org/doi/full/10.1200/PO.19.00186).',
        citations: {
            pmids: [
                '24120142',
                '30463996',
                '10728703',
                '28052061',
                '30284706',
                '30622811',
                '25079552',
                '31852834',
            ],
            abstracts: [
                {
                    link: 'https://ascopubs.org/doi/full/10.1200/PO.19.00186',
                    abstract: 'Lai et al. JCO PO, 2019',
                },
            ],
        },
    },
    highestSensitiveLevel: 'LEVEL_4',
    highestResistanceLevel: null,
    highestDiagnosticImplicationLevel: null,
    highestPrognosticImplicationLevel: null,
    highestFdaLevel: 'LEVEL_Fda3',
    otherSignificantSensitiveLevels: [],
    otherSignificantResistanceLevels: [],
    hotspot: false,
    geneSummary:
        'EGFR, a receptor tyrosine kinase, is altered by amplification and/or mutation in lung and brain cancers among others.',
    variantSummary: 'EGFR amplification is known to be oncogenic.',
    tumorTypeSummary:
        'Laboratory data suggest that cancer cells with EGFR-amplification may be sensitive to the EGFR/HER2 tyrosine kinase inhibitor lapatinib.',
    prognosticSummary: '',
    diagnosticSummary: '',
    diagnosticImplications: [],
    prognosticImplications: [],
    treatments: [
        {
            alterations: ['Amplification'],
            drugs: [
                {
                    ncitCode: 'C26653',
                    drugName: 'Lapatinib',
                },
            ],
            approvedIndications: [],
            level: 'LEVEL_4',
            fdaLevel: 'LEVEL_Fda3',
            levelAssociatedCancerType: {
                id: 882,
                code: '',
                color: 'Gray',
                name: '',
                mainType: {
                    id: null,
                    name: 'Glioma',
                    tumorForm: 'SOLID',
                },
                tissue: 'CNS/Brain',
                children: {},
                parent: null,
                level: 0,
                tumorForm: 'SOLID',
            },
            levelExcludedCancerTypes: [],
            pmids: ['22588883', '20459769', '18334972'],
            abstracts: [],
            description:
                'Lapatinib is a small molecule tyrosine kinase inhibitor of the ERBB2 and EGFR kinases. In vitro studies of glioma cell lines expressing EGFR ectodomain mutations demonstrated that they were sensitive to treatment with lapatinib as shown by apoptosis and decreased pathway activation upon drug treatment. Lapatinib sensitivity has also been observed in lung cancer cell lines with EGFR ectodomain mutations or EGFR amplification, and in endometrial cancer cell lines with increased EGFR expression (PMID: 22588883, 20459769, 18334972).',
        },
    ],
    dataVersion: 'v4.16',
    lastUpdate: '02/23/2023',
    vus: false,
};

const responses = [
    APIResponse1,
    APIResponse2,
    APIResponse4,
    APIResponse3,
    APIResponse5,
    APIResponse6,
];

export const exampleAnnotations: AnnotationImplication[] = responses.map(
    response => ({
        level: response['highestSensitiveLevel'],
        gene: response['query']['hugoSymbol'],
        mutation: response['query']['alteration'],
        consequenceType: response['query']['consequence'] || 'NA',
        drug: response['treatments'][0]['drugs'][0]['drugName'],
        location: response['query']['proteinStart']
            ? response['query']['proteinStart'] +
              (response['query']['proteinEnd']
                  ? ',' + response['query']['proteinEnd']
                  : '')
            : 'NA',
        oncogenicity: response['oncogenic'],
        biologicalEffect: response['mutationEffect']['knownEffect'],
        alterationType: response['query']['alterationType'],
        mutationDescription: response['mutationEffect']['description'],
        entrezGeneId: String(response['query']['entrezGeneId']),
        tumorType: response['query']['tumorType'],
        // citations:   response['mutationEffect']['citations'],
        fdaLevel: response['highestFdaLevel'],
        lastUpdate: response['lastUpdate'],
    })
);
export const exampleTreatments: TreatmentImplication[] = responses.reduce(
    (acc: TreatmentImplication[], response: any) => {
        const treatments = response.treatments.reduce(
            (tAcc: TreatmentImplication[], treatment: any) => {
                const drugs = treatment.drugs.map((drug: any) => ({
                    biomarker: `${response.query.hugoSymbol} ${response.query.alteration}`,
                    drug: drug.drugName,
                    level: treatment.level,
                    annotation: `${response.geneSummary} ${response.variantSummary} ${response.tumorTypeSummary}`,
                    alterationType: response.query.alterationType,
                    treatmentFdaLevel: treatment.fdaLevel,
                    treatmentDescription: treatment.description,
                }));
                return tAcc.concat(drugs);
            },
            []
        );
        return acc.concat(treatments);
    },
    []
);

export const notifications: NotificationImplication[] = [
    {
        message: 'Could not annotate 5 variants',
        type: NOTIFICATION_TYPE.ERROR,
        alterationType: 'COPY_NUMBER_ALTERATION',
    },
    {
        message: 'Did not include treatment X because of alteration Y',
        type: NOTIFICATION_TYPE.INFO,
        alterationType: 'MUTATION',
    },
    {
        message: 'Could not annotate 5 variants',
        type: NOTIFICATION_TYPE.ERROR,
        alterationType: 'MUTATION',
    },
    {
        message: 'Nothing to annotate',
        type: NOTIFICATION_TYPE.WARNING,
        alterationType: 'STRUCTURAL_VARIANT',
    },
    {
        message: 'Annotated 4 variants successfully',
        type: NOTIFICATION_TYPE.SUCCESS,
        alterationType: 'MUTATION',
    },
];
