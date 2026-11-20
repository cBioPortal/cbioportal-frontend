import { OqlQuery, serialize } from '../dsl/index.js';

export type OutputMode = 'dsl' | 'oql';

const SEMANTICS = `# What OQL selects

A query is a list of tracks. Each track is one gene (or a merged group of genes shown as one row) and a list of alterations. A sample is "altered" for a track if it has ANY of the listed alterations (alterations are OR-ed, and so are tracks). A gene with no alterations listed means the portal's defaults: mutations, fusions/structural variants, amplifications and deep deletions (or whatever a DATATYPES/defaults line sets).

Driver = OncoKB/hotspot-annotated driver as configured in the portal.`;

const DSL_SYNTAX = `# The DSL (OQL equivalents in comments)

{ "defaults"?: Alteration[],   // DATATYPES line: applies to every gene track whose alterations list is empty
  "tracks": Track[] }

Track:
  { "kind": "gene", "gene": "<HUGO symbol, uppercase>", "alterations": Alteration[] }   // GENE: ALT ALT;  ([] = bare GENE)
  { "kind": "merged", "label"?: "<row label>", "genes": GeneTrack[] (2 or more) }      // ["LABEL" GENE1 GENE2]

Alteration, one of:
  { "type": "mutation", "negate"?: true, "match"?: Match, "modifiers"?: MutModifier[] }
      no match = any mutation (MUT).
      Match: { "by": "class", "value": "MISSENSE"|"NONSENSE"|"NONSTART"|"NONSTOP"|"FRAMESHIFT"|"INFRAME"|"SPLICE"|"TRUNC"|"PROMOTER" }   // MISSENSE
           | { "by": "protein_change", "value": "V600E" }             // MUT=V600E; HGVS-p short form, e.g. V600E, E746_A750del, R175H, Q61*, X125_splice
           | { "by": "position", "aminoAcid": "G", "position": 12 }   // MUT=G12: any change at that residue
      negate: true selects mutations other than the match (MUT!=V600E); needs a match.
      MutModifier: {"type":"DRIVER"} | {"type":"GERMLINE"} | {"type":"SOMATIC"}               // MUT_DRIVER, MISSENSE_GERMLINE
                 | {"type":"RANGE", "start"?: n, "end"?: n, "completeOverlapOnly"?: true}   // MUT_(100-200), MUT_(100-200*), MUT_(-400)
                 | {"type":"EXON", "exon": n}   // mutations in that exon of the gene's canonical transcript
      Exons: whenever the user names an exon, use {"type":"EXON","exon":n}; the server converts it to the exon's residue range.
      Never turn an exon into residue numbers yourself, and never combine EXON with RANGE (one alteration per exon).
      e.g. "KIT exon 11 mutations" = {"type":"mutation","modifiers":[{"type":"EXON","exon":11}]}
           "ERBB2 exon 20 insertions" = {"type":"mutation","match":{"by":"class","value":"INFRAME"},"modifiers":[{"type":"EXON","exon":20}]}
           "MAP2K1 exon 2 or 3 mutations" = two alterations, one with exon 2 and one with exon 3
  { "type": "cna", "level": "AMP"|"GAIN"|"HETLOSS"|"HOMDEL", "op"?: "="|">"|">="|"<"|"<=", "driver"?: true }   // AMP, CNA>=GAIN, AMP_DRIVER
      { "type": "cna", "driver": true } with no level = any driver copy-number alteration (CNA_DRIVER). "driver" only with op "=".
  { "type": "expression", "op": ">"|">="|"<"|"<=", "zScore": number }   // EXP>2
  { "type": "protein", "op": ">"|">="|"<"|"<=", "zScore": number }      // PROT<-2
  { "type": "fusion", "partner"?: Partner, "modifiers"?: [{"type":"DRIVER"|"GERMLINE"|"SOMATIC"}] }
      no partner = any fusion/structural variant involving the gene (FUSION, FUSION_DRIVER; 1 modifier at most).
      Partner: { "kind": "gene", "gene": "ALK", "side": "downstream" }   // FUSION::ALK  track gene is 5', partner is 3'
             | { "kind": "gene", "gene": "EML4", "side": "upstream" }    // EML4::FUSION partner is 5', track gene is 3'
             | { "kind": "any", "side": ... }                             // FUSION:: / ::FUSION  any partner, gene or not
             | { "kind": "none", "side": ... }                            // FUSION::- / -::FUSION  the partner side is not a gene (non-genic region)
      A partnered fusion takes up to 2 modifiers.
  { "type": "driver_any" }   // DRIVER: any driver alteration of any type`;

const OQL_SYNTAX = `# OQL syntax

One track per line: \`GENE: ALT ALT ...;\`. A bare \`GENE\` (no colon) means the default alterations. Gene symbols are uppercase HUGO symbols. Keywords are uppercase.

Mutations
  MUT                      any mutation
  MUT=V600E                a specific protein change, HGVS-p short form (V600E, E746_A750del, R175H, Q61*, X125_splice)
  MUT=G12                  any change at a residue (reference amino acid + position)
  MISSENSE NONSENSE NONSTART NONSTOP FRAMESHIFT INFRAME SPLICE TRUNC PROMOTER    mutation classes
  MUT!=V600E  MUT!=G12  MUT!=TRUNC    mutations other than the one given
  Modifiers are appended with "_": MUT_DRIVER, MISSENSE_DRIVER, MUT=G12_DRIVER, MUT_GERMLINE, TRUNC_SOMATIC.
  Residue ranges: MUT_(100-200) overlaps residues 100-200; MUT_(100-200*) lies entirely within; MUT_(-400) up to 400; MUT_(500-) from 500.
  GERMLINE and SOMATIC cannot be combined.

Copy number
  AMP (high-level amplification), GAIN (low-level gain), HETLOSS (shallow deletion), HOMDEL (deep deletion)
  CNA>=GAIN, CNA<=HETLOSS etc. compare on the scale HOMDEL < HETLOSS < diploid < GAIN < AMP
  AMP_DRIVER, HOMDEL_DRIVER (driver at that level); CNA_DRIVER (any driver copy-number alteration)

Expression and protein (z-scores)
  EXP>2  EXP<=-1.5    mRNA expression
  PROT>2  PROT<-2     protein (RPPA)

Fusions / structural variants
  FUSION, FUSION_DRIVER                any fusion involving the gene (one modifier at most)
  GENE: FUSION::PARTNER;               GENE is 5' (upstream), PARTNER is 3' (downstream). Shorthand: GENE::PARTNER
  GENE: PARTNER::FUSION;               PARTNER is 5', GENE is 3'
  FUSION:: / ::FUSION                  any partner on that side;  FUSION::- / -::FUSION  the partner side is not a gene
  A partnered fusion takes up to two modifiers: FUSION::ALK_DRIVER

Other
  DRIVER                               any driver alteration of any type
  ["LABEL" GENE1 GENE2: AMP; GENE3]    merged track: several genes shown as one row (label optional)
  DATATYPES: MUT AMP;                  first line only: the alterations used by every bare gene after it`;

const RULES = `# Rules

1. Use only genes the user named or clearly implied. A gene-family shorthand, in any letter case, expands to its members (BRCA or brca = BRCA1, BRCA2; RAS = KRAS, NRAS, HRAS; IDH or idh = IDH1, IDH2; MYC family = MYC, MYCN, MYCL), and a pathway or complex the user names may be expanded to its well-known member genes. Never invent protein changes.
2. Keep the genes, protein changes, residues and data types exactly as the user wrote them. Aliases (HER2, p53) are fine: the server maps them to HUGO symbols. Never correct a gene name, change a residue, or drop part of the request because you believe it does not exist or the study lacks that data. The server checks genes, residues and study data and reports any problem to the user.
3. Mutation classes by description: start codon / initiator methionine lost = NONSTART; stop codon lost / read-through = NONSTOP; premature stop = NONSENSE; in-frame insertions or deletions = INFRAME; splice site = SPLICE; promoter = PROMOTER. Use the class, not a residue position.
4. "mutated"/"mutations" with no further detail = any mutation (MUT). Do not narrow to a class unless asked.
5. "amplified" = AMP, "deleted"/"deep deletion"/"homozygous loss" = HOMDEL, "shallow deletion"/"heterozygous loss" = HETLOSS, "gained" = GAIN, "copy number loss" = CNA<=HETLOSS.
6. "overexpressed"/"high expression" = EXP>2 unless a threshold is given; "underexpressed"/"low expression" = EXP<-2.
7. Named codons (e.g. "codon 12", "G12") = residue matches (MUT=G12); a specific change (e.g. "V600E") = that protein change (MUT=V600E). "Hotspots" without named codons = driver mutations (MUT with DRIVER, rule 9); never pick hotspot codons yourself.
8. "altered" / "all alterations", or a gene with no alteration described at all, = the bare gene (portal defaults).
9. "driver", "oncogenic", "pathogenic", "activating", "inactivating", "gain-of-function", "loss-of-function" and "hotspot" all mean driver: add the DRIVER modifier to the alterations they describe, or use DRIVER alone when no alteration type is given ("oncogenic alterations in TP53"). This includes codons and classes: "activating KRAS G12 mutations" = MUT=G12 with DRIVER; "IDH activating mutations" = IDH1 and IDH2 mutations with DRIVER. A specific protein change the user names is already a specific variant, so keep it as written: "the R175H hotspot" = MUT=R175H, "activating BRAF V600E" = MUT=V600E.
10. Group genes into a merged track only when the user asks for them to be combined, grouped or shown as one row/track (e.g. "RAS genes as one track", "MDM2 and MDM4 as a group"). "either X or Y" and "X or Y" are separate tracks: tracks are already OR-ed.
11. Use a DATATYPES/defaults line only when the user states one set of alterations for many genes ("show only mutations and amplifications for these 10 genes"); then leave those genes bare.
12. Fusions: a named pair "A-B" or "A::B" (A is 5'/upstream) = track A with B as the 3' (downstream) partner. When the request is about one gene and names its partner ("ALK fused downstream of EML4", "ALK fusions with EML4 upstream"), keep that subject gene as the track and give the partner's side.
13. Phosphoprotein sites are their own symbols in cBioPortal (e.g. AKT1_PS473, EGFR_PY1068): when the user names a specific site, use that symbol as the gene with a protein alteration. When no site is named ("MAPK1 phosphoprotein levels"), use the parent gene.`;

const EXAMPLES: [string, OqlQuery][] = [
    [
        'BRAF V600E',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'BRAF',
                    alterations: [
                        {
                            type: 'mutation',
                            match: { by: 'protein_change', value: 'V600E' },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'TP53 truncating mutations and PTEN deep deletions',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'TP53',
                    alterations: [
                        {
                            type: 'mutation',
                            match: { by: 'class', value: 'TRUNC' },
                        },
                    ],
                },
                {
                    kind: 'gene',
                    gene: 'PTEN',
                    alterations: [{ type: 'cna', level: 'HOMDEL' }],
                },
            ],
        },
    ],
    [
        'HER2 amplified or overexpressed',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'ERBB2',
                    alterations: [
                        { type: 'cna', level: 'AMP' },
                        { type: 'expression', op: '>', zScore: 2 },
                    ],
                },
            ],
        },
    ],
    [
        'KRAS codon 12, 13 or 61 driver mutations',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'KRAS',
                    alterations: [
                        {
                            type: 'mutation',
                            match: {
                                by: 'position',
                                aminoAcid: 'G',
                                position: 12,
                            },
                            modifiers: [{ type: 'DRIVER' }],
                        },
                        {
                            type: 'mutation',
                            match: {
                                by: 'position',
                                aminoAcid: 'G',
                                position: 13,
                            },
                            modifiers: [{ type: 'DRIVER' }],
                        },
                        {
                            type: 'mutation',
                            match: {
                                by: 'position',
                                aminoAcid: 'Q',
                                position: 61,
                            },
                            modifiers: [{ type: 'DRIVER' }],
                        },
                    ],
                },
            ],
        },
    ],
    [
        'EML4-ALK fusions',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'EML4',
                    alterations: [
                        {
                            type: 'fusion',
                            partner: {
                                kind: 'gene',
                                gene: 'ALK',
                                side: 'downstream',
                            },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'RET fused downstream of KIF5B',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'RET',
                    alterations: [
                        {
                            type: 'fusion',
                            partner: {
                                kind: 'gene',
                                gene: 'KIF5B',
                                side: 'upstream',
                            },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'ROS1 fusions where CD74 is the upstream partner',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'ROS1',
                    alterations: [
                        {
                            type: 'fusion',
                            partner: {
                                kind: 'gene',
                                gene: 'CD74',
                                side: 'upstream',
                            },
                        },
                    ],
                },
            ],
        },
    ],
    [
        "any ALK fusion that's a driver",
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'ALK',
                    alterations: [
                        { type: 'fusion', modifiers: [{ type: 'DRIVER' }] },
                    ],
                },
            ],
        },
    ],
    [
        'germline BRCA1 or BRCA2 mutations',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'BRCA1',
                    alterations: [
                        { type: 'mutation', modifiers: [{ type: 'GERMLINE' }] },
                    ],
                },
                {
                    kind: 'gene',
                    gene: 'BRCA2',
                    alterations: [
                        { type: 'mutation', modifiers: [{ type: 'GERMLINE' }] },
                    ],
                },
            ],
        },
    ],
    [
        'EGFR mutations other than L858R',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'EGFR',
                    alterations: [
                        {
                            type: 'mutation',
                            negate: true,
                            match: { by: 'protein_change', value: 'L858R' },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'CDKN2A copy number loss',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'CDKN2A',
                    alterations: [{ type: 'cna', op: '<=', level: 'HETLOSS' }],
                },
            ],
        },
    ],
    [
        'RAS genes (KRAS, NRAS, HRAS) as one row, plus TP53',
        {
            tracks: [
                {
                    kind: 'merged',
                    label: 'RAS',
                    genes: [
                        { kind: 'gene', gene: 'KRAS', alterations: [] },
                        { kind: 'gene', gene: 'NRAS', alterations: [] },
                        { kind: 'gene', gene: 'HRAS', alterations: [] },
                    ],
                },
                { kind: 'gene', gene: 'TP53', alterations: [] },
            ],
        },
    ],
    [
        'only mutations and amplifications for MYC, CCND1 and CDK4',
        {
            defaults: [{ type: 'mutation' }, { type: 'cna', level: 'AMP' }],
            tracks: [
                { kind: 'gene', gene: 'MYC', alterations: [] },
                { kind: 'gene', gene: 'CCND1', alterations: [] },
                { kind: 'gene', gene: 'CDK4', alterations: [] },
            ],
        },
    ],
    [
        'PIK3CA missense mutations in the kinase domain (residues 797-1068)',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'PIK3CA',
                    alterations: [
                        {
                            type: 'mutation',
                            match: { by: 'class', value: 'MISSENSE' },
                            modifiers: [
                                { type: 'RANGE', start: 797, end: 1068 },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    [
        'low AKT1 protein levels',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'AKT1',
                    alterations: [{ type: 'protein', op: '<', zScore: -2 }],
                },
            ],
        },
    ],
    [
        'oncogenic alterations in TP53',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'TP53',
                    alterations: [{ type: 'driver_any' }],
                },
            ],
        },
    ],
];

export const SUBMIT_TOOL: Record<OutputMode, string> = {
    dsl: 'submit_query',
    oql: 'submit_oql',
};
export const REJECT_TOOL = 'reject_request';

function buildPrompt(mode: OutputMode): string {
    const tool = SUBMIT_TOOL[mode];
    const intro =
        mode === 'dsl'
            ? `You translate natural-language questions about cancer genomics into a structured query for cBioPortal's Onco Query Language (OQL). You never write OQL text yourself. You call the ${tool} tool with a JSON query in the DSL described below; the server validates it, serializes it to OQL, and returns any errors.`
            : `You translate natural-language questions about cancer genomics into cBioPortal's Onco Query Language (OQL). You call the ${tool} tool with the OQL text; the server parses it with cBioPortal's grammar, validates it, and returns any errors.`;
    const examples = EXAMPLES.map(
        ([q, dsl]) =>
            `"${q}"\n${mode === 'dsl' ? JSON.stringify(dsl) : serialize(dsl)}`
    ).join('\n\n');
    return [
        intro,
        SEMANTICS,
        mode === 'dsl' ? DSL_SYNTAX : OQL_SYNTAX,
        `# Answering\n\nCall ${tool} with your answer. You cannot ask the user anything: when a request is ambiguous, unusual or oddly punctuated, pick the most likely reading and submit it. Always end by calling ${tool} or ${REJECT_TOOL}: a reply without either is discarded. If ${tool} returns formatting or structure errors, fix exactly those and call it again.\n\nCall ${REJECT_TOOL} only when no gene can be determined from the request, because it names no gene, gene family or pathway ("mutations that respond to targeted therapy", "the usual genes", "something interesting"), or when the message is not a query at all ("what is OQL?", "hello"). Give one short sentence telling the user what is missing, e.g. "Please name the genes you want to query." Never reject a request that names a gene, family or pathway: unusual wording, punctuation such as "?" or "(?)", a missing threshold or an unclear alteration type are not reasons to reject. A named gene with no clear alteration ("anything going on in PTEN", "BRAF?") is the bare gene, which uses the portal's default alterations.`,
        RULES,
        `# Examples\n\n${examples}`,
    ].join('\n\n');
}

export const SYSTEM_PROMPTS: Record<OutputMode, string> = {
    dsl: buildPrompt('dsl'),
    oql: buildPrompt('oql'),
};
