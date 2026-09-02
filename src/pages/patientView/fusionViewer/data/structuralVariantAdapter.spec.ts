import { assert } from 'chai';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import {
    convertStructuralVariantToFusionEvent,
    convertStructuralVariantsToFusionEvents,
} from './structuralVariantAdapter';

/**
 * Build a minimal StructuralVariant with sensible defaults.
 * Only override the fields relevant to each test.
 */
function makeSV(overrides: Partial<StructuralVariant>): StructuralVariant {
    return ({
        // Required identifiers
        uniqueSampleKey: 'key',
        uniquePatientKey: 'pkey',
        molecularProfileId: 'profile1',
        sampleId: 'SAMPLE_001',
        patientId: 'PATIENT_001',
        studyId: 'study1',

        // Site 1
        site1HugoSymbol: 'GENE_A',
        site1EntrezGeneId: 100,
        site1Chromosome: '1',
        site1Position: 5000,
        site1Description: 'Exon 5',
        site1EnsemblTranscriptId: 'ENST00000111.3',

        // Site 2
        site2HugoSymbol: 'GENE_B',
        site2EntrezGeneId: 200,
        site2Chromosome: '2',
        site2Position: 8000,
        site2Description: 'Exon 10',
        site2EnsemblTranscriptId: 'ENST00000222.5',

        // Connection and read support
        connectionType: '5to3',
        eventInfo: '',
        variantClass: 'FUSION',
        site2EffectOnFrame: 'In_frame',
        annotation: 'annotated',
        comments: 'test fusion',

        tumorVariantCount: 15,
        tumorSplitReadCount: 0,
        tumorPairedEndReadCount: 0,
        normalVariantCount: 0,
        normalSplitReadCount: 0,
        normalPairedEndReadCount: 0,

        // Fields we don't use but exist on the type
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

describe('structuralVariantAdapter', () => {
    // -------------------------------------------------------------------
    // convertStructuralVariantToFusionEvent
    // -------------------------------------------------------------------
    describe('convertStructuralVariantToFusionEvent', () => {
        it('maps basic SV fields to FusionEvent', () => {
            const sv = makeSV({});
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.tumorId, 'SAMPLE_001');
            assert.equal(fe.gene1.symbol, 'GENE_A');
            assert.equal(fe.gene1.chromosome, '1');
            assert.equal(fe.gene1.position, 5000);
            assert.equal(fe.gene1.siteDescription, 'Exon 5');
            assert.isNotNull(fe.gene2);
            assert.equal(fe.gene2!.symbol, 'GENE_B');
            assert.equal(fe.gene2!.chromosome, '2');
            assert.equal(fe.gene2!.position, 8000);
        });

        it('strips version suffix from transcript IDs', () => {
            const sv = makeSV({
                site1EnsemblTranscriptId: 'ENST00000111.3',
                site2EnsemblTranscriptId: 'ENST00000222.5',
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.gene1.selectedTranscriptId, 'ENST00000111');
            assert.equal(fe.gene2!.selectedTranscriptId, 'ENST00000222');
        });

        it('passes through transcript IDs without version unchanged', () => {
            const sv = makeSV({
                site1EnsemblTranscriptId: 'ENST00000111',
                site2EnsemblTranscriptId: 'ENST00000222',
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.gene1.selectedTranscriptId, 'ENST00000111');
            assert.equal(fe.gene2!.selectedTranscriptId, 'ENST00000222');
        });

        // --- Read support ---

        it('uses tumorVariantCount when positive', () => {
            const sv = makeSV({
                tumorVariantCount: 25,
                tumorSplitReadCount: 10,
                tumorPairedEndReadCount: 5,
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.totalReadSupport, 25);
        });

        it('falls back to split + paired read sum when tumorVariantCount is 0', () => {
            const sv = makeSV({
                tumorVariantCount: 0,
                tumorSplitReadCount: 8,
                tumorPairedEndReadCount: 3,
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.totalReadSupport, 11);
        });

        it('falls back to split + paired read sum when tumorVariantCount is -1', () => {
            const sv = makeSV({
                tumorVariantCount: -1,
                tumorSplitReadCount: 4,
                tumorPairedEndReadCount: 6,
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.totalReadSupport, 10);
        });

        it('returns 0 read support when all counts are null', () => {
            const sv = makeSV({
                tumorVariantCount: null as any,
                tumorSplitReadCount: null as any,
                tumorPairedEndReadCount: null as any,
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.totalReadSupport, 0);
        });

        // --- Fusion name ---

        it('derives the label from site symbols even when eventInfo is present', () => {
            // Upstream changed eventInfo from a name ("EML4-ALK Fusion") to a
            // classification ("Antisense Fusion {EML4-ALK}"). It is not a name,
            // so it must never be used as the displayed fusion label.
            const sv = makeSV({
                eventInfo: 'Antisense Fusion {GENE_B-GENE_A}',
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.fusion, 'GENE_A::GENE_B');
        });

        it('preserves the raw eventInfo string on eventLabel', () => {
            const sv = makeSV({
                eventInfo: 'Antisense Fusion {GENE_B-GENE_A}',
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.eventLabel, 'Antisense Fusion {GENE_B-GENE_A}');
        });

        it('leaves eventLabel empty when upstream sends no eventInfo', () => {
            const sv = makeSV({ eventInfo: '' });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.eventLabel, '');
        });

        it('constructs gene1::gene2 when eventInfo is empty', () => {
            const sv = makeSV({ eventInfo: '' });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.fusion, 'GENE_A::GENE_B');
        });

        // --- Position string ---

        it('builds position string from both site descriptions', () => {
            const sv = makeSV({
                site1Description: 'Exon 5',
                site2Description: 'Exon 10',
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.position, 'Exon 5 | Exon 10');
        });

        it('uses only site1 description if site2 is NA', () => {
            const sv = makeSV({
                site1Description: 'Intron 3',
                site2Description: 'NA',
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.position, 'Intron 3');
        });

        // --- Safe handling of null/NA values ---

        it('treats "NA" gene symbols as empty', () => {
            const sv = makeSV({
                site2HugoSymbol: 'NA',
                site2Position: 0,
                site2Chromosome: '',
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.isNull(fe.gene2);
        });

        it('treats "N/A" gene symbols as empty', () => {
            const sv = makeSV({
                site2HugoSymbol: 'N/A',
                site2Position: 0,
                site2Chromosome: '',
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.isNull(fe.gene2);
        });

        // --- Intragenic rearrangement detection ---

        it('returns gene2 for intragenic rearrangements at different positions', () => {
            const sv = makeSV({
                site1HugoSymbol: 'MYC',
                site2HugoSymbol: 'MYC',
                site1Chromosome: '8',
                site2Chromosome: '8',
                site1Position: 1000,
                site2Position: 5000,
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.isNotNull(fe.gene2);
            assert.equal(fe.gene2!.symbol, 'MYC');
        });

        it('returns null gene2 when same gene, same position, same chromosome', () => {
            const sv = makeSV({
                site1HugoSymbol: 'MYC',
                site2HugoSymbol: 'MYC',
                site1Chromosome: '8',
                site2Chromosome: '8',
                site1Position: 1000,
                site2Position: 1000,
            });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.isNull(fe.gene2);
        });

        // --- ID generation ---

        it('generates a deterministic ID from sample, genes, positions', () => {
            const sv = makeSV({});
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.id, 'SAMPLE_001_GENE_A_GENE_B_5000_8000');
        });

        // --- Other fields ---

        it('maps variantClass to callMethod', () => {
            const sv = makeSV({ variantClass: 'TRANSLOCATION' });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.callMethod, 'TRANSLOCATION');
        });

        it('defaults callMethod to SV when variantClass is empty', () => {
            const sv = makeSV({ variantClass: '' });
            const fe = convertStructuralVariantToFusionEvent(sv);

            assert.equal(fe.callMethod, 'SV');
        });

        // --- connectionType ---

        it('passes connectionType through to FusionEvent', () => {
            const sv = makeSV({ connectionType: '3to5' });
            const fe = convertStructuralVariantToFusionEvent(sv);
            assert.equal(fe.connectionType, '3to5');
        });

        it('preserves all four connectionType values', () => {
            for (const conn of ['3to5', '5to3', '3to3', '5to5']) {
                const sv = makeSV({ connectionType: conn });
                const fe = convertStructuralVariantToFusionEvent(sv);
                assert.equal(fe.connectionType, conn);
            }
        });

        it('defaults connectionType to empty string when missing', () => {
            const sv = makeSV({ connectionType: undefined as any });
            const fe = convertStructuralVariantToFusionEvent(sv);
            assert.equal(fe.connectionType, '');
        });
    });

    // -------------------------------------------------------------------
    // convertStructuralVariantsToFusionEvents
    // -------------------------------------------------------------------
    describe('convertStructuralVariantsToFusionEvents', () => {
        it('converts multiple SVs to FusionEvents', () => {
            const svs = [
                makeSV({ site1HugoSymbol: 'ALK' }),
                makeSV({ site1HugoSymbol: 'ROS1' }),
            ];
            const fusions = convertStructuralVariantsToFusionEvents(svs);

            assert.equal(fusions.length, 2);
            assert.equal(fusions[0].gene1.symbol, 'ALK');
            assert.equal(fusions[1].gene1.symbol, 'ROS1');
        });

        it('filters out entries with empty site1 gene symbol', () => {
            const svs = [
                makeSV({ site1HugoSymbol: 'BRAF' }),
                makeSV({ site1HugoSymbol: '' }),
                makeSV({ site1HugoSymbol: 'NA' }),
                makeSV({ site1HugoSymbol: 'RET' }),
            ];
            const fusions = convertStructuralVariantsToFusionEvents(svs);

            assert.equal(fusions.length, 2);
            assert.equal(fusions[0].gene1.symbol, 'BRAF');
            assert.equal(fusions[1].gene1.symbol, 'RET');
        });

        it('filters out entries with null site1 gene symbol', () => {
            const svs = [
                makeSV({ site1HugoSymbol: null as any }),
                makeSV({ site1HugoSymbol: 'ETV6' }),
            ];
            const fusions = convertStructuralVariantsToFusionEvents(svs);

            assert.equal(fusions.length, 1);
            assert.equal(fusions[0].gene1.symbol, 'ETV6');
        });

        it('returns empty array for empty input', () => {
            const fusions = convertStructuralVariantsToFusionEvents([]);
            assert.deepEqual(fusions, []);
        });
    });

    // -----------------------------------------------------------------------
    // isRnaDerived classification (RNA fusion vs DNA SV)
    // -----------------------------------------------------------------------
    describe('isRnaDerived classification', () => {
        it('rnaSupport present => RNA-derived', () => {
            const sv = makeSV({
                variantClass: 'INVERSION',
                rnaSupport: 'yes',
                dnaSupport: '',
            });
            assert.isTrue(
                convertStructuralVariantToFusionEvent(sv).isRnaDerived
            );
        });

        it('dnaSupport only (no rnaSupport) => DNA SV', () => {
            const sv = makeSV({ rnaSupport: '', dnaSupport: 'yes' });
            assert.isFalse(
                convertStructuralVariantToFusionEvent(sv).isRnaDerived
            );
        });

        it('rnaSupport wins when both are present', () => {
            const sv = makeSV({
                variantClass: 'INVERSION',
                rnaSupport: 'yes',
                dnaSupport: 'yes',
            });
            assert.isTrue(
                convertStructuralVariantToFusionEvent(sv).isRnaDerived
            );
        });

        it('support empty => falls back to molecular profile (fusion => RNA)', () => {
            const sv = makeSV({
                variantClass: 'INVERSION',
                rnaSupport: '',
                dnaSupport: '',
                molecularProfileId: 'study_fusion',
            });
            assert.isTrue(
                convertStructuralVariantToFusionEvent(sv).isRnaDerived
            );
        });

        it('support empty => falls back to molecular profile (structural_variants => DNA)', () => {
            const sv = makeSV({
                variantClass: 'INVERSION',
                rnaSupport: '',
                dnaSupport: '',
                molecularProfileId: 'study_structural_variants',
            });
            assert.isFalse(
                convertStructuralVariantToFusionEvent(sv).isRnaDerived
            );
        });

        it('nothing conclusive => defaults to DNA SV', () => {
            const sv = makeSV({
                variantClass: '',
                rnaSupport: '',
                dnaSupport: '',
                molecularProfileId: 'mystery_profile',
            });
            assert.isFalse(
                convertStructuralVariantToFusionEvent(sv).isRnaDerived
            );
        });
    });
});

describe('per-row genome build', () => {
    it('carries the row build through, normalised', () => {
        assert.equal(
            convertStructuralVariantToFusionEvent(
                makeSV({ ncbiBuild: 'GRCh38' })
            ).ncbiBuild,
            'GRCh38'
        );
        assert.equal(
            convertStructuralVariantToFusionEvent(makeSV({ ncbiBuild: 'hg19' }))
                .ncbiBuild,
            'GRCh37'
        );
    });

    it('is empty when the export omits or nulls the build', () => {
        assert.equal(
            convertStructuralVariantToFusionEvent(makeSV({ ncbiBuild: 'NA' }))
                .ncbiBuild,
            ''
        );
        assert.equal(
            convertStructuralVariantToFusionEvent(
                makeSV({ ncbiBuild: undefined as any })
            ).ncbiBuild,
            ''
        );
        assert.equal(
            convertStructuralVariantToFusionEvent(
                makeSV({ ncbiBuild: null as any })
            ).ncbiBuild,
            ''
        );
    });
});

describe('cohort parity with the patient view', () => {
    it('classifies a Fusion variant class as RNA-derived', () => {
        // msktarget: both support columns are NA and RNA fusions live in a
        // "<study>_structural_variants" profile, so without this every RNA
        // fusion in the cohort view classifies as a DNA SV and every strip
        // draws the canonical isoform instead of the caller's.
        const sv = makeSV({
            variantClass: 'Fusion',
            rnaSupport: 'NA',
            dnaSupport: 'NA',
            molecularProfileId: 'msktarget_structural_variants',
        });
        assert.isTrue(convertStructuralVariantToFusionEvent(sv).isRnaDerived);
    });

    it('an explicit dnaSupport outranks a generic Fusion variant class', () => {
        const sv = makeSV({
            variantClass: 'Fusion',
            rnaSupport: '',
            dnaSupport: 'yes',
        });
        assert.isFalse(convertStructuralVariantToFusionEvent(sv).isRnaDerived);
    });

    it('derives the label from site symbols, never from Event Info', () => {
        // Otherwise the same fusion is named "EML4::ALK" in the patient view
        // and "Antisense Fusion {EML4-ALK}" in the cohort view.
        const sv = makeSV({ eventInfo: 'Antisense Fusion {GENE_B-GENE_A}' });
        const fe = convertStructuralVariantToFusionEvent(sv);

        assert.equal(fe.fusion, 'GENE_A::GENE_B');
        assert.equal(fe.eventLabel, 'Antisense Fusion {GENE_B-GENE_A}');
    });
});
