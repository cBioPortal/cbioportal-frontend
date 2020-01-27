import { assert } from 'chai';
import {
    COLOR_GENEPANEL_ICON,
    genePanelIdToIconData,
    WHOLEGENOME_LABEL,
    sampleIdToIconData,
    COLOR_WHOLEGENOME_ICON,
    IKeyedIconData,
} from './GenomicOverviewUtils';
import { GenePanelIdSpecialValue } from 'shared/lib/StoreUtils';

describe('GenomicOverviewUtils', () => {
    describe('genePanelIdToIconData()', () => {
        const expectedData = {
            A: { label: 'P1', color: COLOR_GENEPANEL_ICON, genePanelId: 'A' },
            B: { label: 'P2', color: COLOR_GENEPANEL_ICON, genePanelId: 'B' },
            C: { label: 'P3', color: COLOR_GENEPANEL_ICON, genePanelId: 'C' },
        };

        it('generates icon data', () => {
            const genePanelIds = ['A', 'B', 'C'];
            assert.deepEqual(genePanelIdToIconData(genePanelIds), expectedData);
        });

        it('generates icon data independent of input order', () => {
            const genePanelIds = ['C', 'B', 'A'];
            assert.deepEqual(genePanelIdToIconData(genePanelIds), expectedData);
        });

        it('removes undefined entries', () => {
            const genePanelIds = ['A', 'B', 'C', undefined];
            assert.deepEqual(genePanelIdToIconData(genePanelIds), expectedData);
        });

        it('adds whole-genome icon data', () => {
            const genePanelIds = [
                GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
                GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
            ];

            const expectedData: any = {};
            expectedData[GenePanelIdSpecialValue.WHOLE_EXOME_SEQ] = {
                label: WHOLEGENOME_LABEL,
                color: COLOR_WHOLEGENOME_ICON,
                genePanelId: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
            };
            expectedData[GenePanelIdSpecialValue.WHOLE_GENOME_SEQ] = {
                label: WHOLEGENOME_LABEL,
                color: COLOR_WHOLEGENOME_ICON,
                genePanelId: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
            };

            assert.deepEqual(genePanelIdToIconData(genePanelIds), expectedData);
        });
    });

    describe('sampleIdToIconData()', () => {
        const iconLookUp = {
            panel1: {
                label: 'P1',
                color: COLOR_GENEPANEL_ICON,
                genePanelId: 'panel1',
            },
            panel2: {
                label: 'P2',
                color: COLOR_GENEPANEL_ICON,
                genePanelId: 'panel2',
            },
        };

        it('links icon data', () => {
            const sampleToGenePanelId = {
                sampleA: 'panel1',
                sampleB: 'panel2',
            } as { [sampleId: string]: string };

            const expectedData = {
                sampleA: {
                    label: 'P1',
                    color: COLOR_GENEPANEL_ICON,
                    genePanelId: 'panel1',
                },
                sampleB: {
                    label: 'P2',
                    color: COLOR_GENEPANEL_ICON,
                    genePanelId: 'panel2',
                },
            };

            assert.deepEqual(
                sampleIdToIconData(sampleToGenePanelId, iconLookUp),
                expectedData
            );
        });

        it('returns empty object when sampleToGenePanel data is undefined', () => {
            assert.deepEqual(sampleIdToIconData(undefined, iconLookUp), {});
        });

        it('links undefined genePanelId to whole-genome analysis icon', () => {
            const sampleToGenePanelId = {
                sampleA: undefined,
                sampleB: 'panel1',
            } as { [sampleId: string]: string | undefined };

            const expectedData = {
                sampleA: {
                    label: WHOLEGENOME_LABEL,
                    color: COLOR_WHOLEGENOME_ICON,
                    genePanelId: undefined,
                },
                sampleB: {
                    label: 'P1',
                    color: COLOR_GENEPANEL_ICON,
                    genePanelId: 'panel1',
                },
            };

            assert.deepEqual(
                sampleIdToIconData(sampleToGenePanelId, iconLookUp),
                expectedData
            );
        });

        it('links whole-genome genePanelIds to whole-genome analysis icon', () => {
            const myIconLookup: IKeyedIconData = {
                panel1: {
                    label: 'P1',
                    color: COLOR_GENEPANEL_ICON,
                    genePanelId: 'panel1',
                },
            };
            myIconLookup[GenePanelIdSpecialValue.WHOLE_EXOME_SEQ] = {
                label: WHOLEGENOME_LABEL,
                color: COLOR_WHOLEGENOME_ICON,
                genePanelId: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
            };
            myIconLookup[GenePanelIdSpecialValue.WHOLE_GENOME_SEQ] = {
                label: WHOLEGENOME_LABEL,
                color: COLOR_WHOLEGENOME_ICON,
                genePanelId: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
            };

            const sampleToGenePanelId = {
                sampleA: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
                sampleB: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
                sampleC: 'panel1',
            } as { [sampleId: string]: string | undefined };

            const expectedData = {
                sampleA: {
                    label: WHOLEGENOME_LABEL,
                    color: COLOR_WHOLEGENOME_ICON,
                    genePanelId: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
                },
                sampleB: {
                    label: WHOLEGENOME_LABEL,
                    color: COLOR_WHOLEGENOME_ICON,
                    genePanelId: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
                },
                sampleC: {
                    label: 'P1',
                    color: COLOR_GENEPANEL_ICON,
                    genePanelId: 'panel1',
                },
            };

            assert.deepEqual(
                sampleIdToIconData(sampleToGenePanelId, myIconLookup),
                expectedData
            );
        });

        it('returns empty object when all samples are whole genome', () => {
            const myIconLookup: IKeyedIconData = {};
            myIconLookup[GenePanelIdSpecialValue.WHOLE_EXOME_SEQ] = {
                label: WHOLEGENOME_LABEL,
                color: COLOR_WHOLEGENOME_ICON,
                genePanelId: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
            };
            myIconLookup[GenePanelIdSpecialValue.WHOLE_GENOME_SEQ] = {
                label: WHOLEGENOME_LABEL,
                color: COLOR_WHOLEGENOME_ICON,
                genePanelId: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
            };

            const sampleToGenePanelId = {
                sampleA: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
                sampleB: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
                sampleC: GenePanelIdSpecialValue.UNKNOWN,
            } as { [sampleId: string]: string | undefined };

            const expectedData = {};

            assert.deepEqual(
                sampleIdToIconData(sampleToGenePanelId, myIconLookup),
                expectedData
            );
        });
    });
});
