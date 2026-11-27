import { assert } from 'chai';
import { CancerStudy, StructuralVariant } from 'cbioportal-ts-api-client';
import {
    geneSideChromosome,
    getChromoscopeAssembly,
    getChromoscopeXDomain,
    GenomeVisualizationSV,
    groupStructuralVariantsByAssembly,
    inferSvClass,
    normalizeChromosome,
    normalizeClass,
    parseConnectionType,
    SV_CLASS,
    toGenomeVisualizationSV,
} from './goslingStructuralVariantTransform';

function sv(fields: Partial<StructuralVariant>): StructuralVariant {
    return {
        uniqueSampleKey: 'key',
        sampleId: 'S1',
        studyId: 'study_hg19',
        site1HugoSymbol: 'GENE1',
        site2HugoSymbol: 'GENE2',
        site1Chromosome: '1',
        site1Position: 1000,
        site2Chromosome: '1',
        site2Position: 2000,
        variantClass: 'NA',
        connectionType: 'NA',
        ...fields,
    } as StructuralVariant;
}

describe('goslingStructuralVariantTransform', () => {
    describe('getChromoscopeAssembly', () => {
        it('accepts UCSC and NCBI names', () => {
            assert.equal(getChromoscopeAssembly('hg19'), 'hg19');
            assert.equal(getChromoscopeAssembly('GRCh37'), 'hg19');
            assert.equal(getChromoscopeAssembly('hg38'), 'hg38');
            assert.equal(getChromoscopeAssembly('GRCh38'), 'hg38');
        });

        it('rejects other or missing genomes', () => {
            assert.isUndefined(getChromoscopeAssembly('mm10'));
            assert.isUndefined(getChromoscopeAssembly(''));
            assert.isUndefined(getChromoscopeAssembly(undefined));
        });
    });

    describe('normalizeChromosome', () => {
        it('normalizes chromosome spellings found in public studies', () => {
            assert.equal(normalizeChromosome('7'), 'chr7');
            assert.equal(normalizeChromosome('chr7'), 'chr7');
            assert.equal(normalizeChromosome('21.0'), 'chr21');
            assert.equal(normalizeChromosome('23'), 'chrX');
            assert.equal(normalizeChromosome('24'), 'chrY');
            assert.equal(normalizeChromosome('x'), 'chrX');
        });

        it('returns undefined for missing or unplaced chromosomes', () => {
            assert.isUndefined(normalizeChromosome('NA'));
            assert.isUndefined(normalizeChromosome(''));
            assert.isUndefined(normalizeChromosome('GL000'));
            assert.isUndefined(normalizeChromosome('MT'));
            assert.isUndefined(normalizeChromosome('25'));
        });
    });

    describe('parseConnectionType', () => {
        it('maps 3 prime ends to + and 5 prime ends to -', () => {
            assert.deepEqual(parseConnectionType('3to5'), ['+', '-']);
            assert.deepEqual(parseConnectionType('5to3'), ['-', '+']);
            assert.deepEqual(parseConnectionType('3 to 3'), ['+', '+']);
            assert.deepEqual(parseConnectionType('5to5'), ['-', '-']);
        });

        it('returns undefined for missing values', () => {
            assert.isUndefined(parseConnectionType('NA'));
            assert.isUndefined(parseConnectionType('unknown'));
            assert.isUndefined(parseConnectionType('to'));
        });
    });

    describe('normalizeClass', () => {
        it('recognizes common spellings', () => {
            assert.equal(normalizeClass('DEL'), 'DEL');
            assert.equal(normalizeClass('Deletion'), 'DEL');
            assert.equal(normalizeClass('TANDEM_DUP'), 'DUP');
            assert.equal(normalizeClass('INVERSION FORWARD STRAND'), 'INV');
            assert.equal(normalizeClass('INTER_CHR'), 'TRA');
            assert.equal(normalizeClass('INTERCHROMOSOMAL_TRANSLOC'), 'TRA');
            assert.equal(normalizeClass('Inverted translocation'), 'TRA');
        });

        it('leaves other classes unrecognized', () => {
            assert.isUndefined(normalizeClass('NA'));
            assert.isUndefined(normalizeClass('FUSION'));
            assert.isUndefined(normalizeClass('BREAKENDS'));
            assert.isUndefined(normalizeClass('INSERTION'));
        });
    });

    describe('inferSvClass', () => {
        it('uses the Class column first', () => {
            assert.equal(
                inferSvClass('DEL', 'chr1', 'chr1', ['-', '+']).svclass,
                SV_CLASS.DELETION
            );
        });

        it('takes the inversion orientation from the strands', () => {
            assert.equal(
                inferSvClass('INV', 'chr1', 'chr1', ['+', '+']).svclass,
                SV_CLASS.INVERSION_HTH
            );
            assert.equal(
                inferSvClass('INV', 'chr1', 'chr1', ['-', '-']).svclass,
                SV_CLASS.INVERSION_TTT
            );
            assert.equal(
                inferSvClass('INV', 'chr1', 'chr1', undefined).svclass,
                SV_CLASS.OTHER
            );
        });

        it('treats different chromosomes as a translocation', () => {
            assert.equal(
                inferSvClass(undefined, 'chr1', 'chr2', undefined).svclass,
                SV_CLASS.TRANSLOCATION
            );
        });

        it('infers the class from strands when Class is missing', () => {
            assert.equal(
                inferSvClass(undefined, 'chr1', 'chr1', ['+', '-']).svclass,
                SV_CLASS.DELETION
            );
            assert.equal(
                inferSvClass(undefined, 'chr1', 'chr1', ['-', '+']).svclass,
                SV_CLASS.DUPLICATION
            );
        });

        it('reports which rule decided the class', () => {
            assert.equal(
                inferSvClass('INV', 'chr1', 'chr1', undefined).source,
                'class'
            );
            assert.equal(
                inferSvClass(undefined, 'chr1', 'chr2', ['+', '-']).source,
                'chromosomes'
            );
            assert.equal(
                inferSvClass(undefined, 'chr1', 'chr1', ['+', '-']).source,
                'connectionType'
            );
            assert.equal(
                inferSvClass(undefined, 'chr1', 'chr1', undefined).source,
                'none'
            );
        });

        it('falls back to Other', () => {
            assert.equal(
                inferSvClass(undefined, 'chr1', 'chr1', undefined).svclass,
                SV_CLASS.OTHER
            );
        });
    });

    describe('toGenomeVisualizationSV', () => {
        it('keeps Entrez gene ids with their breakpoints and uses the index as id', () => {
            const result = toGenomeVisualizationSV(
                sv({
                    site1EntrezGeneId: 1,
                    site1Position: 2000,
                    site2EntrezGeneId: 2,
                    site2Position: 1000,
                }),
                7
            )!;
            assert.equal(result.entrezGeneId1, 2);
            assert.equal(result.entrezGeneId2, 1);
            assert.equal(result.sv_id, '7');
        });

        it('uses 0 for a missing Entrez gene id', () => {
            const result = toGenomeVisualizationSV(sv({}), 0)!;
            assert.equal(result.entrezGeneId1, 0);
            assert.equal(result.entrezGeneId2, 0);
        });

        it('converts an MSK-IMPACT inversion', () => {
            const result = toGenomeVisualizationSV(
                sv({
                    site1HugoSymbol: '',
                    site1Chromosome: 'X',
                    site1Position: 97658964,
                    site2HugoSymbol: 'BTK',
                    site2Chromosome: 'X',
                    site2Position: 100608862,
                    variantClass: 'INVERSION',
                    connectionType: '5to5',
                }),
                0
            )!;
            assert.equal(result.chrom1, 'chrX');
            assert.equal(result.start1, 97658964);
            assert.equal(result.chrom2, 'chrX');
            assert.equal(result.start2, 100608862);
            assert.equal(result.strand1, '-');
            assert.equal(result.strand2, '-');
            assert.equal(result.svclass, SV_CLASS.INVERSION_TTT);
            assert.equal(result.gene2, 'BTK');
            assert.equal(result.originalClass, 'INVERSION');
        });

        it('orders breakpoints by position and swaps strands with them', () => {
            const result = toGenomeVisualizationSV(
                sv({
                    site1HugoSymbol: 'GENE1',
                    site1Position: 2000,
                    site2HugoSymbol: 'GENE2',
                    site2Position: 1000,
                    connectionType: '3to5',
                }),
                0
            )!;
            assert.equal(result.start1, 1000);
            assert.equal(result.gene1, 'GENE2');
            assert.equal(result.strand1, '-');
            assert.equal(result.strand2, '+');
            assert.equal(result.svclass, SV_CLASS.DUPLICATION);
        });

        it('orders breakpoints on different chromosomes by chromosome', () => {
            const result = toGenomeVisualizationSV(
                sv({
                    site1Chromosome: 'X',
                    site1Position: 5,
                    site2Chromosome: '2',
                    site2Position: 10,
                }),
                0
            )!;
            assert.equal(result.chrom1, 'chr2');
            assert.equal(result.chrom2, 'chrX');
            assert.equal(result.svclass, SV_CLASS.TRANSLOCATION);
        });

        it('keeps strands empty without Connection_Type', () => {
            const result = toGenomeVisualizationSV(sv({}), 0)!;
            assert.equal(result.strand1, '');
            assert.equal(result.strand2, '');
            assert.equal(result.svclass, SV_CLASS.OTHER);
        });

        it('returns undefined when a breakpoint lacks coordinates', () => {
            assert.isUndefined(
                toGenomeVisualizationSV(
                    sv({ site1Chromosome: 'NA', site2Chromosome: 'NA' }),
                    0
                )
            );
            assert.isUndefined(
                toGenomeVisualizationSV(sv({ site1Position: -1 }), 0)
            );
            assert.isUndefined(
                toGenomeVisualizationSV(sv({ site2Position: 0 }), 0)
            );
            assert.isUndefined(
                toGenomeVisualizationSV(
                    sv({ site2Position: (undefined as unknown) as number }),
                    0
                )
            );
        });
    });

    describe('groupStructuralVariantsByAssembly', () => {
        const studies = {
            study_hg19: { referenceGenome: 'hg19' } as CancerStudy,
            study_hg38: { referenceGenome: 'hg38' } as CancerStudy,
            study_mm10: { referenceGenome: 'mm10' } as CancerStudy,
        };

        it('keeps reference genomes separate and counts records it cannot draw', () => {
            const result = groupStructuralVariantsByAssembly(
                [
                    sv({ studyId: 'study_hg19' }),
                    sv({ studyId: 'study_hg19', site1Chromosome: 'NA' }),
                    sv({ studyId: 'study_hg38' }),
                    sv({ studyId: 'study_mm10' }),
                ],
                studies
            );
            assert.equal(result.unsupportedGenomeCount, 1);
            const hg19 = result.groups.find(g => g.assembly === 'hg19')!;
            const hg38 = result.groups.find(g => g.assembly === 'hg38')!;
            assert.deepEqual(hg19.studyIds, ['study_hg19']);
            assert.equal(hg19.plotted.length, 1);
            assert.equal(hg19.missingCoordinatesCount, 1);
            assert.equal(hg38.plotted.length, 1);
            assert.equal(hg38.missingCoordinatesCount, 0);
        });

        it('gives every record a unique id', () => {
            const result = groupStructuralVariantsByAssembly(
                [sv({}), sv({})],
                studies
            );
            const ids = result.groups[0].plotted.map(d => d.sv_id);
            assert.equal(new Set(ids).size, 2);
        });
    });

    describe('xDomain', () => {
        function record(
            fields: Partial<GenomeVisualizationSV>
        ): GenomeVisualizationSV {
            return {
                ...toGenomeVisualizationSV(sv({}), 0)!,
                ...fields,
            };
        }

        const fusion = record({
            chrom1: 'chr2',
            chrom2: 'chr7',
            entrezGeneId1: 238,
            entrezGeneId2: 1956,
        });

        it('picks the chromosome of the breakpoint in the gene', () => {
            assert.equal(geneSideChromosome(fusion, 1956), 'chr7');
            assert.equal(geneSideChromosome(fusion, 238), 'chr2');
            assert.equal(geneSideChromosome(fusion, 999), 'chr2');
        });

        it('pads an intrachromosomal focused record', () => {
            const focused = record({
                chrom1: 'chr3',
                start1: 100000,
                chrom2: 'chr3',
                end2: 200001,
            });
            assert.deepEqual(getChromoscopeXDomain([focused], focused, 1), {
                chromosome: 'chr3',
                interval: [80000, 220001],
            });
        });

        it('pads a short focused record by at least 10 kb, starting at 1', () => {
            const focused = record({
                chrom1: 'chr3',
                start1: 5000,
                chrom2: 'chr3',
                end2: 5101,
            });
            assert.deepEqual(
                getChromoscopeXDomain([focused], focused, 1).interval,
                [1, 15101]
            );
        });

        it("shows the gene's chromosome for an interchromosomal focused record", () => {
            assert.deepEqual(getChromoscopeXDomain([fusion], fusion, 1956), {
                chromosome: 'chr7',
            });
        });

        it("defaults to the chromosome with most of the gene's records", () => {
            const other = record({ chrom1: 'chr7', entrezGeneId1: 1956 });
            assert.deepEqual(
                getChromoscopeXDomain(
                    [record({ chrom1: 'chr1' }), fusion, other],
                    undefined,
                    1956
                ),
                { chromosome: 'chr7' }
            );
        });

        it('defaults to chr1 without records', () => {
            assert.deepEqual(getChromoscopeXDomain([], undefined, 1), {
                chromosome: 'chr1',
            });
        });
    });
});
