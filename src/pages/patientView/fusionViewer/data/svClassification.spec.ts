import { assert } from 'chai';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { classifySv, shouldRenderChimericProtein } from './svClassification';
import { SvIdiom } from './types';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeSV(overrides: Partial<StructuralVariant> = {}): StructuralVariant {
    return ({
        uniqueSampleKey: 'key',
        uniquePatientKey: 'pkey',
        molecularProfileId: 'profile1',
        sampleId: 'SAMPLE_001',
        patientId: 'PATIENT_001',
        studyId: 'study1',

        site1HugoSymbol: 'GENE_A',
        site1EntrezGeneId: 100,
        site1Chromosome: '1',
        site1Position: 5000,
        site1Description: 'Exon 5',
        site1EnsemblTranscriptId: 'ENST00000111',

        site2HugoSymbol: 'GENE_B',
        site2EntrezGeneId: 200,
        site2Chromosome: '2',
        site2Position: 8000,
        site2Description: 'Exon 10',
        site2EnsemblTranscriptId: 'ENST00000222',

        connectionType: '5to3',
        eventInfo: '',
        variantClass: 'FUSION',
        site2EffectOnFrame: 'In_frame',
        annotation: '',
        comments: '',

        tumorVariantCount: 10,
        tumorSplitReadCount: 0,
        tumorPairedEndReadCount: 0,
        normalVariantCount: 0,
        normalSplitReadCount: 0,
        normalPairedEndReadCount: 0,
        ncbiBuild: 'GRCh38',
        dnaSupport: 'yes',
        rnaSupport: 'yes',
        center: 'MSK',
        svStatus: 'SOMATIC',
        lengthOfSv: 0,
        normalReadCount: 0,
        tumorReadCount: 0,
        ...overrides,
    } as unknown) as StructuralVariant;
}

// ---------------------------------------------------------------------------
// classifySv — idiom
// ---------------------------------------------------------------------------

describe('classifySv — svIdiom', () => {
    // Standard inter-gene fusion
    it('classifies inter-gene, cross-chromosome FUSION as INTERGENIC_FUSION', () => {
        const sv = makeSV({
            site1Chromosome: '1',
            site2Chromosome: '2',
            variantClass: 'FUSION',
        });
        assert.equal(classifySv(sv).svIdiom, 'INTERGENIC_FUSION');
    });

    it('classifies TRA between different genes as INTERGENIC_FUSION', () => {
        const sv = makeSV({
            site1Chromosome: '1',
            site2Chromosome: '1',
            variantClass: 'TRA',
        });
        assert.equal(classifySv(sv).svIdiom, 'INTERGENIC_FUSION');
    });

    it('classifies BND between different genes as INTERGENIC_FUSION', () => {
        const sv = makeSV({
            site1Chromosome: '9',
            site2Chromosome: '22',
            variantClass: 'BND',
        });
        assert.equal(classifySv(sv).svIdiom, 'INTERGENIC_FUSION');
    });

    it('classifies TRANSLOCATION (mixed case) as INTERGENIC_FUSION', () => {
        const sv = makeSV({
            site1Chromosome: '1',
            site2Chromosome: '2',
            variantClass: 'Translocation',
        });
        assert.equal(classifySv(sv).svIdiom, 'INTERGENIC_FUSION');
    });

    it('does NOT classify a same-gene, same-chromosome TRANSLOCATION as INTERGENIC_FUSION', () => {
        // A same-gene intragenic event tagged TRA must not be forced inter-genic
        // by the class hint — the same-gene rule wins (no spurious two-gene product).
        const sv = makeSV({
            site1HugoSymbol: 'EGFR',
            site2HugoSymbol: 'EGFR',
            site1Chromosome: '7',
            site2Chromosome: '7',
            site1Position: 55_000_000,
            site2Position: 55_050_000,
            variantClass: 'TRANSLOCATION',
        });
        assert.notEqual(classifySv(sv).svIdiom, 'INTERGENIC_FUSION');
        assert.equal(classifySv(sv).svIdiom, 'UNKNOWN_SV');
    });

    // Intra-chromosomal inter-gene fusion
    it('classifies DEL between different genes (same chrom) as INTRACHROM_FUSION', () => {
        const sv = makeSV({
            site1HugoSymbol: 'TMPRSS2',
            site2HugoSymbol: 'ERG',
            site1Chromosome: '21',
            site2Chromosome: '21',
            variantClass: 'DEL',
        });
        assert.equal(classifySv(sv).svIdiom, 'INTRACHROM_FUSION');
    });

    it('classifies generic SV between same-chrom different genes as INTRACHROM_FUSION', () => {
        const sv = makeSV({
            site1Chromosome: '1',
            site2Chromosome: '1',
            variantClass: 'SV',
        });
        assert.equal(classifySv(sv).svIdiom, 'INTRACHROM_FUSION');
    });

    // Intragenic
    it('classifies same-gene DEL as INTRAGENIC_DELETION', () => {
        const sv = makeSV({
            site1HugoSymbol: 'EGFR',
            site2HugoSymbol: 'EGFR',
            site1Chromosome: '7',
            site2Chromosome: '7',
            site1Position: 1000,
            site2Position: 5000,
            variantClass: 'DEL',
        });
        assert.equal(classifySv(sv).svIdiom, 'INTRAGENIC_DELETION');
    });

    it('classifies same-gene DELETION (long form) as INTRAGENIC_DELETION', () => {
        const sv = makeSV({
            site1HugoSymbol: 'MYC',
            site2HugoSymbol: 'MYC',
            site1Chromosome: '8',
            site2Chromosome: '8',
            site1Position: 1000,
            site2Position: 5000,
            variantClass: 'Deletion',
        });
        assert.equal(classifySv(sv).svIdiom, 'INTRAGENIC_DELETION');
    });

    it('classifies same-gene DUP as INTRAGENIC_DUPLICATION', () => {
        const sv = makeSV({
            site1HugoSymbol: 'FLT3',
            site2HugoSymbol: 'FLT3',
            site1Chromosome: '13',
            site2Chromosome: '13',
            site1Position: 1000,
            site2Position: 2000,
            variantClass: 'DUP',
        });
        assert.equal(classifySv(sv).svIdiom, 'INTRAGENIC_DUPLICATION');
    });

    it('classifies same-gene ITD as INTRAGENIC_DUPLICATION', () => {
        const sv = makeSV({
            site1HugoSymbol: 'FLT3',
            site2HugoSymbol: 'FLT3',
            site1Chromosome: '13',
            site2Chromosome: '13',
            site1Position: 1000,
            site2Position: 2000,
            variantClass: 'ITD',
        });
        assert.equal(classifySv(sv).svIdiom, 'INTRAGENIC_DUPLICATION');
    });

    it('classifies same-gene INV as INTRAGENIC_INVERSION', () => {
        const sv = makeSV({
            site1HugoSymbol: 'RUNX1',
            site2HugoSymbol: 'RUNX1',
            site1Chromosome: '21',
            site2Chromosome: '21',
            site1Position: 100,
            site2Position: 500,
            variantClass: 'INV',
        });
        assert.equal(classifySv(sv).svIdiom, 'INTRAGENIC_INVERSION');
    });

    // INSERTION
    it('classifies INS class as INSERTION', () => {
        const sv = makeSV({ variantClass: 'INS' });
        assert.equal(classifySv(sv).svIdiom, 'INSERTION');
    });

    it('classifies INSERTION (long form) as INSERTION', () => {
        const sv = makeSV({ variantClass: 'Insertion' });
        assert.equal(classifySv(sv).svIdiom, 'INSERTION');
    });

    // INTERGENIC_REGION (no valid gene2)
    it('classifies missing gene2 as INTERGENIC_REGION', () => {
        const sv = makeSV({ site2HugoSymbol: '' });
        assert.equal(classifySv(sv).svIdiom, 'INTERGENIC_REGION');
    });

    it('classifies NA gene2 as INTERGENIC_REGION', () => {
        const sv = makeSV({ site2HugoSymbol: 'NA' });
        assert.equal(classifySv(sv).svIdiom, 'INTERGENIC_REGION');
    });

    // UNKNOWN_SV
    it('classifies same gene with unknown variantClass as UNKNOWN_SV', () => {
        const sv = makeSV({
            site1HugoSymbol: 'TP53',
            site2HugoSymbol: 'TP53',
            site1Chromosome: '17',
            site2Chromosome: '17',
            site1Position: 1000,
            site2Position: 5000,
            variantClass: 'SV',
        });
        assert.equal(classifySv(sv).svIdiom, 'UNKNOWN_SV');
    });

    it('classifies same gene with empty variantClass as UNKNOWN_SV', () => {
        const sv = makeSV({
            site1HugoSymbol: 'TP53',
            site2HugoSymbol: 'TP53',
            site1Chromosome: '17',
            site2Chromosome: '17',
            site1Position: 1000,
            site2Position: 5000,
            variantClass: '',
        });
        assert.equal(classifySv(sv).svIdiom, 'UNKNOWN_SV');
    });

    // Edge case: same gene same pos same chrom → treated as no valid site2
    it('classifies same gene, same pos, same chrom as INTERGENIC_REGION (not intragenic)', () => {
        const sv = makeSV({
            site1HugoSymbol: 'MYC',
            site2HugoSymbol: 'MYC',
            site1Chromosome: '8',
            site2Chromosome: '8',
            site1Position: 1000,
            site2Position: 1000,
            variantClass: 'DEL',
        });
        // same pos/chrom → hasPartner=false → INTERGENIC_REGION
        assert.equal(classifySv(sv).svIdiom, 'INTERGENIC_REGION');
    });

    // Edge case: cross-chromosome same gene symbol → trust chromosomes
    it('classifies cross-chromosome same gene symbol as INTERGENIC_FUSION (chromosomes win)', () => {
        const sv = makeSV({
            site1HugoSymbol: 'MYCN',
            site2HugoSymbol: 'MYCN',
            site1Chromosome: '2',
            site2Chromosome: 'X',
            site1Position: 1000,
            site2Position: 2000,
            variantClass: 'TRA',
        });
        // same gene symbol but different chromosomes → isCrossChromosome=true
        // Per spec: "Cross-chromosome but same gene symbol (paralog / annotation
        // noise): trust chromosomes over symbols → INTERGENIC_FUSION." The
        // cross-chromosome check runs before the same-gene branch.
        assert.equal(classifySv(sv).svIdiom, 'INTERGENIC_FUSION');
    });
});

// ---------------------------------------------------------------------------
// classifySv — frame plausibility
// ---------------------------------------------------------------------------

describe('classifySv — frame', () => {
    it('maps In_frame to IN_FRAME', () => {
        assert.equal(
            classifySv(makeSV({ site2EffectOnFrame: 'In_frame' })).frame,
            'IN_FRAME'
        );
    });

    it('maps out_of_frame to OUT_OF_FRAME', () => {
        assert.equal(
            classifySv(makeSV({ site2EffectOnFrame: 'out_of_frame' })).frame,
            'OUT_OF_FRAME'
        );
    });

    it('maps Frameshift to OUT_OF_FRAME', () => {
        assert.equal(
            classifySv(makeSV({ site2EffectOnFrame: 'Frameshift' })).frame,
            'OUT_OF_FRAME'
        );
    });

    it("maps 5'UTR to UTR", () => {
        assert.equal(
            classifySv(makeSV({ site2EffectOnFrame: "5'UTR" })).frame,
            'UTR'
        );
    });

    it('maps Intron to NONCODING', () => {
        assert.equal(
            classifySv(makeSV({ site2EffectOnFrame: 'Intron' })).frame,
            'NONCODING'
        );
    });

    it('maps Promoter to NONCODING', () => {
        assert.equal(
            classifySv(makeSV({ site2EffectOnFrame: 'Promoter' })).frame,
            'NONCODING'
        );
    });

    it('maps empty site2EffectOnFrame to UNKNOWN', () => {
        assert.equal(
            classifySv(makeSV({ site2EffectOnFrame: '' })).frame,
            'UNKNOWN'
        );
    });

    it('maps NA site2EffectOnFrame to UNKNOWN', () => {
        assert.equal(
            classifySv(makeSV({ site2EffectOnFrame: 'NA' })).frame,
            'UNKNOWN'
        );
    });

    it('maps unrecognized value to UNKNOWN', () => {
        assert.equal(
            classifySv(makeSV({ site2EffectOnFrame: 'SomeWeirdValue' })).frame,
            'UNKNOWN'
        );
    });
});

// ---------------------------------------------------------------------------
// shouldRenderChimericProtein — truth table
// ---------------------------------------------------------------------------

describe('shouldRenderChimericProtein', () => {
    // Idioms that render a protein product: two-gene fusions + intragenic
    // deletion (single-gene internal-deletion product, e.g. EGFRvIII / BRAF-del).
    const productIdioms: SvIdiom[] = [
        'INTERGENIC_FUSION',
        'INTRACHROM_FUSION',
        'INTRAGENIC_DELETION',
        'INTRAGENIC_DUPLICATION',
    ];
    const nonFusionIdioms: SvIdiom[] = [
        'INTRAGENIC_INVERSION',
        'INSERTION',
        'INTERGENIC_REGION',
        'UNKNOWN_SV',
    ];

    // Gating is by SV idiom only — frame is intentionally NOT a parameter, so a
    // fusion-shaped idiom always renders regardless of the (unconfirmable) frame
    // annotation, and a non-fusion idiom never does.
    for (const idiom of productIdioms) {
        it(`${idiom} → renders protein`, () => {
            assert.isTrue(shouldRenderChimericProtein(idiom));
        });
    }

    for (const idiom of nonFusionIdioms) {
        it(`${idiom} → never renders protein`, () => {
            assert.isFalse(shouldRenderChimericProtein(idiom));
        });
    }
});
