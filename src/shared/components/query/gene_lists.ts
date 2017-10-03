const gene_lists = [{
	"id": "Prostate Cancer: AR Signaling",
	"genes": ["SOX9", "RAN", "TNK2", "EP300", "PXN", "NCOA2", "AR", "NRIP1", "NCOR1", "NCOR2"]
}, {
	"id": "Prostate Cancer: AR and steroid synthesis enzymes",
	"genes": ["AKR1C3", "AR", "CYB5A", "CYP11A1", "CYP11B1", "CYP11B2", "CYP17A1", "CYP19A1", "CYP21A2", "HSD17B1", "HSD17B10", "HSD17B11", "HSD17B12", "HSD17B13", "HSD17B14", "HSD17B2", "HSD17B3", "HSD17B4", "HSD17B6", "HSD17B7", "HSD17B8", "HSD3B1", "HSD3B2", "HSD3B7", "RDH5", "SHBG", "SRD5A1", "SRD5A2", "SRD5A3", "STAR"]
}, {
	"id": "Prostate Cancer: Steroid inactivating genes",
	"genes": ["AKR1C1", "AKR1C2", "AKR1C4", "CYP3A4", "CYP3A43", "CYP3A5", "CYP3A7", "UGT2B15", "UGT2B17", "UGT2B7"]
}, {
	"id": "Prostate Cancer: Down-regulated by androgen",
	"genes": ["BCHE", "CDK8", "CTBP1", "ACKR3", "DDC", "DPH1", "FN1", "HES6", "MMP16", "MYC", "PEG3", "PIK3R3", "PRKD1", "SCNN1A", "SDC4", "SERPINI1", "SLC29A1", "ST7", "TULP4"]
}, {
	"id": "Glioblastoma: TP53 Pathway",
	"genes": ["CDKN2A", "MDM2", "MDM4", "TP53"]
}, {
	"id": "Glioblastoma: RTK/Ras/PI3K/AKT Signaling",
	"genes": ["EGFR", "ERBB2", "PDGFRA", "MET", "KRAS", "NRAS", "HRAS", "NF1", "SPRY2", "FOXO1", "FOXO3", "AKT1", "AKT2", "AKT3", "PIK3R1", "PIK3CA", "PTEN"]
}, {
	"id": "Glioblastoma: RB Pathway",
	"genes": ["CDKN2A", "CDKN2B", "CDKN2C", "CDK4", "CDK6", "CCND2", "RB1"]
}, {
	"id": "Ovarian Cancer: Oncogenes associated with epithelial ovarian cancer",
	"genes": ["RAB25", "MECOM", "EIF5A2", "PRKCI", "PIK3CA", "KIT", "FGF1", "MYC", "EGFR", "NOTCH3", "KRAS", "AKT1", "ERBB2", "PIK3R1", "CCNE1", "AKT2", "AURKA"]
}, {
	"id": "Ovarian Cancer: Putative tumor-suppressor genes in epithelial ovarian cancer",
	"genes": ["DIRAS3", "RASSF1", "DLEC1", "SPARC", "DAB2", "PLAGL1", "RPS6KA2", "PTEN", "OPCML", "BRCA2", "ARL11", "WWOX", "TP53", "DPH1", "BRCA1", "PEG3"]
}, {
	"id": "General: Cell Cycle Control",
	"genes": ["RB1", "RBL1", "RBL2", "CCNA1", "CCNB1", "CDK1", "CCNE1", "CDK2", "CDC25A", "CCND1", "CDK4", "CDK6", "CCND2", "CDKN2A", "CDKN2B", "MYC", "CDKN1A", "CDKN1B", "E2F1", "E2F2", "E2F3", "E2F4", "E2F5", "E2F6", "E2F7", "E2F8", "SRC", "JAK1", "JAK2", "STAT1", "STAT2", "STAT3", "STAT5A", "STAT5B"]
}, {
	"id": "General: p53 signaling",
	"genes": ["TP53", "MDM2", "MDM4", "CDKN2A", "CDKN2B", "TP53BP1"]
}, {
	"id": "General: Notch signaling",
	"genes": ["ADAM10", "ADAM17", "APH1A", "APH1B", "ARRDC1", "CIR1", "CTBP1", "CTBP2", "CUL1", "DLL1", "DLL3", "DLL4", "DTX1", "DTX2", "DTX3", "DTX3L", "DTX4", "EP300", "FBXW7", "HDAC1", "HDAC2", "HES1", "HES5", "HEYL", "ITCH", "JAG1", "JAG2", "KDM5A", "LFNG", "MAML1", "MAML2", "MAML3", "MFNG", "NCOR2", "NCSTN", "NOTCH1", "NOTCH2", "NOTCH3", "NOTCH4", "NRARP", "NUMB", "NUMBL", "PSEN1", "PSEN2", "PSENEN", "RBPJ", "RBPJL", "RFNG", "SNW1", "SPEN", "HES2", "HES4", "HES7", "HEY1", "HEY2"]
}, {
	"id": "General: DNA Damage Response",
	"genes": ["CHEK1", "CHEK2", "RAD51", "BRCA1", "BRCA2", "MLH1", "MSH2", "ATM", "ATR", "MDC1", "PARP1", "FANCF"]
}, {
	"id": "General: Other growth / proliferation signaling",
	"genes": ["CSF1", "CSF1R", "IGF1", "IGF1R", "FGF1", "FGFR1", "AURKA", "DLEC1", "PLAGL1", "OPCML", "DPH1"]
}, {
	"id": "General: Survival / cell death regulation signaling",
	"genes": ["NFKB1", "NFKB2", "CHUK", "DIRAS3", "FAS", "HLA-G", "BAD", "BCL2", "BCL2L1", "APAF1", "CASP9", "CASP8", "CASP10", "CASP3", "CASP6", "CASP7", "GSK3B", "ARL11", "WWOX", "PEG3", "TGFB1", "TGFBR1", "TGFBR2"]
}, {
	"id": "General: Telomere maintenance",
	"genes": ["TERC", "TERT"]
}, {
	"id": "General: RTK signaling family",
	"genes": ["EGFR", "ERBB2", "ERBB3", "ERBB4", "PDGFA", "PDGFB", "PDGFRA", "PDGFRB", "KIT", "FGF1", "FGFR1", "IGF1", "IGF1R", "VEGFA", "VEGFB", "KDR"]
}, {
	"id": "General: PI3K-AKT-mTOR signaling",
	"genes": ["PIK3CA", "PIK3R1", "PIK3R2", "PTEN", "PDPK1", "AKT1", "AKT2", "FOXO1", "FOXO3", "MTOR", "RICTOR", "TSC1", "TSC2", "RHEB", "AKT1S1", "RPTOR", "MLST8"]
}, {
	"id": "General: Ras-Raf-MEK-Erk/JNK signaling",
	"genes": ["KRAS", "HRAS", "BRAF", "RAF1", "MAP3K1", "MAP3K2", "MAP3K3", "MAP3K4", "MAP3K5", "MAP2K1", "MAP2K2", "MAP2K3", "MAP2K4", "MAP2K5", "MAPK1", "MAPK3", "MAPK4", "MAPK6", "MAPK7", "MAPK8", "MAPK9", "MAPK12", "MAPK14", "DAB2", "RASSF1", "RAB25"]
}, {
	"id": "General: Regulation of ribosomal protein synthesis and cell growth",
	"genes": ["RPS6KA1", "RPS6KA2", "RPS6KB1", "RPS6KB2", "EIF5A2", "EIF4E", "EIF4EBP1", "RPS6", "HIF1A"]
}, {
	"id": "General: Angiogenesis",
	"genes": ["VEGFA", "VEGFB", "KDR", "CXCL8", "CXCR1", "CXCR2"]
}, {
	"id": "General: Folate transport",
	"genes": ["SLC19A1", "FOLR1", "FOLR2", "FOLR3", "IZUMO1R"]
}, {
	"id": "General: Invasion and metastasis",
	"genes": ["MMP1", "MMP2", "MMP3", "MMP7", "MMP9", "MMP10", "MMP11", "MMP12", "MMP13", "MMP14", "MMP15", "MMP16", "MMP17", "MMP19", "MMP21", "MMP23B", "MMP24", "MMP25", "MMP26", "MMP27", "MMP28", "ITGB3", "ITGAV", "PTK2", "CDH1", "SPARC", "WFDC2"]
},	{
	"id":"General: Interferon_Signaling_Pathway",
	"genes":['IFNGR1', 'IFNGR2', 'JAK1', 'JAK2', 'TYK2', 'STAT1', 'STAT3', 'STAT5A', 'STAT5B', 'IRF1']
}, {
    "id": "General: Polymerase_error",
    "genes": ['POLE', 'POLD1']
}, {
    "id":"General: Immuno-Proteosome",
	"genes":['ERAP1', 'ERAP2', 'PSMB8', 'PSMB9', 'PSMB10', 'PSMB11', 'NRD1', 'THOP1', 'TPP2']
}, {
    "id":"General: MHCI_antigen_processing_and_presenting_machinery",
	"genes":['HLA-I', 'B2M', 'TAP1', 'TAP2', 'CLX', 'CLT', 'TPN', 'ERP57', 'LMP7', 'ERAP1', 'HLA-A', 'LMP2', 'LMP10']
}, {
    "id":"General: Interferon_gamma_pathway",
	"genes":['IFNG', 'IFNGR1', 'IFNGR2', 'JAK1', 'JAK2', 'PPKCD', 'STAT1', 'STAT2', 'STAT3', 'STAT4', 'IFR1', 'IFR9', 'CXCL10', 'IFI30', 'PSME1', 'SOCS1', 'SOCS3', 'PIAS1', 'PIAS4', 'IL10RA', 'IL10RB', 'IL12RA']
}, {
    "id":"General: Stabilize_PD-L1_protein",
	"genes":['CMTM6', 'CMTM4']
}, {
    "id":"General: MMR",
	"genes":['MSH2', 'MSH6', 'MLH1', 'PMS2']
}, {
    "id":"General: HR",
	"genes":['BRCA1', 'BRCA2', 'PALB2']
}, {
    "id":"General: Peptide_Loading_Complex",
	"genes":['TAP1', 'TAP2', 'TAPBP', 'CALR', 'CANX', 'PDIA3']
}, {
    "id":"General: MHC_Components",
	"genes":['JAK1', 'B2M', 'HLA-A', 'HLA-B', 'HLA-C']
}, {
    "id":"General: BER",
	"genes":['MUTYH']
}, {
    "id":"General: NER",
	"genes":['ERCC2']
}, {
    "id":"General: DNA_polymerases_(catalytic_subunits)",
	"genes":['POLB', 'POLG', 'POLD1', 'POLE', 'PCNA', 'REV3L_(POLZ)', 'MAD2L2_(REV7)', 'REV1L_(REV1)', 'POLH', 'POLI_(RAD30B)', 'POLQ', 'POLK_(DINB1)', 'POLL', 'POLM', 'POLN_(POL4P)']
}, {
    "id":"General: Homologous_recombination",
	"genes":['RAD51', 'RAD51B', 'RAD51D', 'DMC1', 'XRCC2', 'XRCC3', 'RAD52', 'RAD54L', 'RAD54B', 'BRCA1', 'SHFM1_(DSS1)', 'RAD50', 'MRE11A', 'NBN_(NBS1)', 'RBBP8_(CtIP)', 'MUS81', 'EME1_(MMS4L)', 'EME2', 'GIYD1_(SLX1A)', 'GIYD2_(SLX1B)', 'GEN1']
}, {
    "id":"General: Ubiquitination_and_modification",
	"genes":['UBE2A_(RAD6A)', 'UBE2B_(RAD6B)', 'RAD18', 'SHPRH', 'HLTF_(SMARCA3)', 'RNF168', 'SPRTN_(c1orf124)', 'RNF8', 'RNF4', 'UBE2V2_(MMS2)', 'UBE2N_(UBC13)']
}, {
    "id":"General: Other_identified_genes_with_known_or_suspected_DNA_repair_function",
	"genes":['DCLRE1A_(SNM1)', 'DCLRE1B_(SNM1B)', 'RPA4', 'PRPF19_(PSO4)', 'RECQL_(RECQ1)', 'RECQL5', 'HELQ_(HEL308)', 'RDM1_(RAD52B)', 'OBFC2B_(SSB1)']
}, {
    "id":"General: Modulation_of_nucleotide_pools",
	"genes":['NUDT1_(MTH1)', 'DUT', 'RRM2B_(p53R2)']
}, {
    "id":"General: Non-homologous_end-joining",
	"genes":['XRCC6_(Ku70)', 'XRCC5_(Ku80)', 'PRKDC', 'LIG4', 'XRCC4', 'DCLRE1C_(Artemis)', 'NHEJ1_(XLF,_Cernunnos)']
}, {
    "id":"General: Fanconi_anemia",
	"genes":['FANCA', 'FANCB', 'FANCC', 'BRCA2_(FANCD1)', 'FANCD2', 'FANCE', 'FANCF', 'FANCG_(XRCC9)', 'FANCI_(KIAA1794)', 'BRIP1_(FANCJ)', 'FANCL', 'FANCM', 'PALB2_(FANCN)', 'RAD51C_(FANCO)', 'BTBD12_(SLX4)_(FANCP)', 'FAAP20_(C1orf86)', 'FAAP24_(C19orf40)']
}, {
    "id":"General: Editing_and_processing_nucleases",
	"genes":['FEN1_(DNase_IV)', 'FAN1_(MTMR15)', 'TREX1_(DNase_III)', 'TREX2', 'EXO1_(HEX1)', 'APTX_(aprataxin)', 'SPO11', 'ENDOV']
}, {
    "id":"General: Mismatch_excision_repair_(MMR)",
	"genes":['MSH2', 'MSH3', 'MSH6', 'MLH1', 'PMS2', 'MSH4', 'MSH5', 'MLH3', 'PMS1', 'PMS2L3']
}, {
    "id":"General: Poly(ADP-ribose)_polymerase_(PARP)_enzymes_that_bind_to_DNA",
	"genes":['PARP1_(ADPRT)', 'PARP2_(ADPRTL2)', 'PARP3_(ADPRTL3)']
}, {
    "id":"General: NER-related",
	"genes":['ERCC8_(CSA)', 'ERCC6_(CSB)', 'UVSSA_(KIAA1530)', 'XAB2_(HCNP)', 'MMS19']
}, {
    "id":"General: Direct_reversal_of_damage",
	"genes":['MGMT', 'ALKBH2_(ABH2)', 'ALKBH3_(DEPC1)']
}, {
    "id":"General: Genes_defective_in_diseases_associated_with_sensitivity_to_DNA_damaging_agents",
	"genes":['BLM', 'WRN', 'RECQL4', 'ATM', 'TTDN1_(C7orf11)']
}, {
    "id":"General: Repair_of_DNA-topoisomerase_crosslinks",
	"genes":['TDP1', 'TDP2_(TTRAP)']
}, {
    "id":"General: Chromatin_Structure_and_Modification",
	"genes":['H2AFX_(H2AX)', 'CHAF1A_(CAF1)', 'SETMAR_(METNASE)']
}, {
    "id":"General: Other_BER_and_strand_break_joining_factors",
	"genes":['APEX1_(APE1)', 'APEX2', 'LIG3', 'XRCC1', 'PNKP', 'APLF_(C2ORF13)']
}, {
    "id":"General: Other_conserved_DNA_damage_response_genes",
	"genes":['ATR', 'ATRIP', 'MDC1', 'RAD1', 'RAD9A', 'HUS1', 'RAD17_(RAD24)', 'CHEK1', 'CHEK2', 'TP53', 'TP53BP1_(53BP1)', 'RIF1', 'TOPBP1', 'CLK2', 'PER1']
}, {
    "id":"General: Nucleotide_excision_repair_(NER)",
	"genes":['XPC', 'RAD23B', 'CETN2', 'RAD23A', 'XPA', 'DDB1', 'DDB2_(XPE)', 'RPA1', 'RPA2', 'RPA3', 'TFIIH', 'ERCC3_(XPB)', 'ERCC2_(XPD)', 'GTF2H1', 'GTF2H2', 'GTF2H3', 'GTF2H4', 'GTF2H5_(TTDA)', 'CDK7', 'CCNH', 'MNAT1', 'ERCC5_(XPG)', 'ERCC1', 'ERCC4_(XPF)', 'LIG1']
}, {
    "id":"General: Base_excision_repair_(BER)",
	"genes":['UNG', 'SMUG1', 'MBD4', 'TDG', 'OGG1', 'MUTYH_(MYH)', 'NTHL1_(NTH1)', 'MPG', 'NEIL1', 'NEIL2', 'NEIL3']
}
];

export default gene_lists;
