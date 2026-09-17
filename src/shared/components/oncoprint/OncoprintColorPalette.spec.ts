import { assert } from 'chai';
import { RGBAColor } from 'oncoprintjs';
import { ClinicalTrackSpec } from './Oncoprint';
import {
    buildEffectivePalette,
    normalizeColorToRGBA,
    normalizeKey,
    parsePaletteFile,
    PaletteParseError,
    resolvePaletteToTracks,
    serializePalette,
} from './OncoprintColorPalette';

function stringTrack(
    label: string,
    values: string[],
    categoryToColor?: { [value: string]: RGBAColor }
): ClinicalTrackSpec {
    return {
        key: label,
        attributeId: label,
        label,
        description: '',
        datatype: 'string',
        data: values.map(attr_val => ({ attr_val } as any)),
        category_to_color: categoryToColor,
    } as ClinicalTrackSpec;
}

const trackValues = (track: ClinicalTrackSpec) =>
    track.datatype === 'counts'
        ? track.countsCategoryLabels
        : (track as any).data.map((d: any) => d.attr_val);

describe('OncoprintColorPalette', () => {
    describe('normalizeColorToRGBA', () => {
        it('accepts full hex with and without a leading #', () => {
            assert.deepEqual(normalizeColorToRGBA('#1b9e77'), [
                27,
                158,
                119,
                1,
            ]);
            assert.deepEqual(normalizeColorToRGBA('1b9e77'), [27, 158, 119, 1]);
        });
        it('expands shorthand hex', () => {
            assert.deepEqual(normalizeColorToRGBA('#abc'), [170, 187, 204, 1]);
        });
        it('is case insensitive and tolerates surrounding whitespace', () => {
            assert.deepEqual(normalizeColorToRGBA('  #1B9E77 '), [
                27,
                158,
                119,
                1,
            ]);
        });
        it('accepts the named colors hand written palettes use', () => {
            // vital status is routinely white/black in lab palettes
            assert.deepEqual(normalizeColorToRGBA('white'), [255, 255, 255, 1]);
            assert.deepEqual(normalizeColorToRGBA('Black'), [0, 0, 0, 1]);
        });
        it('rejects anything it does not understand', () => {
            assert.isUndefined(normalizeColorToRGBA('#12345'));
            assert.isUndefined(normalizeColorToRGBA('#gghhii'));
            assert.isUndefined(normalizeColorToRGBA('rgb(1,2,3)'));
            assert.isUndefined(normalizeColorToRGBA('chartreuse'));
            assert.isUndefined(normalizeColorToRGBA(''));
            assert.isUndefined(normalizeColorToRGBA(undefined as any));
        });
    });

    describe('normalizeKey', () => {
        it('matches the normalization Colors.ts uses for reserved values', () => {
            assert.equal(normalizeKey('Stage I'), 'stagei');
            assert.equal(normalizeKey('STAGEI'), 'stagei');
        });
    });

    describe('parsePaletteFile', () => {
        it('reads a flat value to color dictionary', () => {
            const parsed = parsePaletteFile(
                '{"Female": "#FAD2E4", "Male": "#3A6CB0"}'
            );
            assert.equal(parsed.kind, 'flat');
            assert.deepEqual(parsed.palette, {
                Female: '#FAD2E4',
                Male: '#3A6CB0',
            });
        });

        it('reads a nested track keyed dictionary', () => {
            const parsed = parsePaletteFile(
                '{"Sex": {"Female": "#FAD2E4", "Male": "#3A6CB0"}}'
            );
            assert.equal(parsed.kind, 'nested');
            assert.deepEqual(parsed.palette, {
                Sex: { Female: '#FAD2E4', Male: '#3A6CB0' },
            });
        });

        it('reads a two column CSV as a flat palette', () => {
            const parsed = parsePaletteFile('Female,#FAD2E4\nMale,#3A6CB0\n');
            assert.equal(parsed.kind, 'flat');
            assert.deepEqual(parsed.palette, {
                Female: '#FAD2E4',
                Male: '#3A6CB0',
            });
        });

        it('reads a two column TSV and drops a header row', () => {
            const parsed = parsePaletteFile(
                'value\tcolor\nFemale\t#FAD2E4\nMale\t#3A6CB0'
            );
            assert.deepEqual(parsed.palette, {
                Female: '#FAD2E4',
                Male: '#3A6CB0',
            });
        });

        it('keeps the first row when it is data rather than a header', () => {
            const parsed = parsePaletteFile('Female,#FAD2E4\nMale,#3A6CB0');
            assert.property(parsed.palette, 'Female');
        });

        it('strips quotes around delimited cells', () => {
            const parsed = parsePaletteFile('"Stage I","#BFD4E6"');
            assert.deepEqual(parsed.palette, { 'Stage I': '#BFD4E6' });
        });

        it('rejects a mixed nested/flat file', () => {
            assert.throws(
                () =>
                    parsePaletteFile(
                        '{"Sex": {"Female": "#fff"}, "Male": "#000"}'
                    ),
                PaletteParseError
            );
        });

        it('rejects empty, malformed and non-object files', () => {
            assert.throws(() => parsePaletteFile(''), PaletteParseError);
            assert.throws(() => parsePaletteFile('{'), PaletteParseError);
            assert.throws(() => parsePaletteFile('{}'), PaletteParseError);
            assert.throws(() => parsePaletteFile('[1,2,3]'), PaletteParseError);
            assert.throws(
                () => parsePaletteFile('Female\nMale'),
                PaletteParseError
            );
        });
    });

    describe('resolvePaletteToTracks', () => {
        const sex = stringTrack('Sex', ['Female', 'Male']);
        const stage = stringTrack('Stage', ['Stage I', 'Stage IV']);

        it('applies a flat palette across every track that has a matching value', () => {
            const resolved = resolvePaletteToTracks(
                parsePaletteFile(
                    '{"Female": "#FAD2E4", "Stage I": "#BFD4E6", "Stage IV": "#7F277B"}'
                ),
                [sex, stage],
                trackValues
            );
            assert.deepEqual(resolved.colors, {
                Sex: { Female: [250, 210, 228, 1] },
                Stage: {
                    'Stage I': [191, 212, 230, 1],
                    'Stage IV': [127, 39, 123, 1],
                },
            });
            assert.equal(resolved.appliedCount, 3);
            assert.equal(resolved.trackCount, 2);
            assert.deepEqual(resolved.unmatched, []);
        });

        it('matches values ignoring case and spacing, and writes back the track spelling', () => {
            const resolved = resolvePaletteToTracks(
                parsePaletteFile('{"stagei": "#BFD4E6"}'),
                [stage],
                trackValues
            );
            assert.deepEqual(resolved.colors, {
                Stage: { 'Stage I': [191, 212, 230, 1] },
            });
        });

        it('reports flat entries that match nothing instead of failing', () => {
            const resolved = resolvePaletteToTracks(
                parsePaletteFile('{"Female": "#FAD2E4", "Klingon": "#123456"}'),
                [sex],
                trackValues
            );
            assert.equal(resolved.appliedCount, 1);
            assert.deepEqual(resolved.unmatched, ['Klingon']);
        });

        it('reports unreadable colors separately from unmatched values', () => {
            const resolved = resolvePaletteToTracks(
                parsePaletteFile('{"Female": "not-a-color"}'),
                [sex],
                trackValues
            );
            assert.equal(resolved.appliedCount, 0);
            assert.deepEqual(resolved.invalid, ['Female: not-a-color']);
            assert.deepEqual(resolved.unmatched, []);
        });

        it('applies a nested palette only to its own track', () => {
            const resolved = resolvePaletteToTracks(
                parsePaletteFile(
                    '{"Sex": {"Female": "#FAD2E4"}, "Stage": {"Stage I": "#BFD4E6"}}'
                ),
                [sex, stage],
                trackValues
            );
            assert.deepEqual(resolved.colors, {
                Sex: { Female: [250, 210, 228, 1] },
                Stage: { 'Stage I': [191, 212, 230, 1] },
            });
        });

        it('reports nested entries for tracks and values that are not on screen', () => {
            const resolved = resolvePaletteToTracks(
                parsePaletteFile(
                    '{"Sex": {"Nonbinary": "#FAD2E4"}, "Grade": {"G1": "#BFD4E6"}}'
                ),
                [sex],
                trackValues
            );
            assert.equal(resolved.appliedCount, 0);
            assert.deepEqual(resolved.unmatched, ['Sex / Nonbinary', 'Grade']);
        });

        it('recolors counts tracks by category label', () => {
            const spectrum = {
                key: 'spectrum',
                attributeId: 'MUTATION_SPECTRUM',
                label: 'Mutation Spectrum',
                description: '',
                datatype: 'counts',
                data: [],
                countsCategoryLabels: ['C>A', 'C>G'],
                countsCategoryFills: [
                    [1, 1, 1, 1],
                    [2, 2, 2, 1],
                ],
            } as ClinicalTrackSpec;
            const resolved = resolvePaletteToTracks(
                parsePaletteFile('{"C>G": "#000000"}'),
                [spectrum],
                trackValues
            );
            assert.deepEqual(resolved.colors, {
                'Mutation Spectrum': { 'C>G': [0, 0, 0, 1] },
            });
        });
    });

    describe('buildEffectivePalette / serializePalette', () => {
        const getColor = (track: ClinicalTrackSpec, value: string) =>
            ((track as any).category_to_color || {})[value];

        it('exports defaults merged with overrides, not just the overrides', () => {
            const sex = stringTrack('Sex', ['Female', 'Male'], {
                Female: [224, 105, 158, 1],
                Male: [41, 134, 226, 1],
            });
            assert.deepEqual(
                buildEffectivePalette([sex], trackValues, getColor),
                { Sex: { Female: '#e0699e', Male: '#2986e2' } }
            );
        });

        it('skips tracks with no values and values with no color', () => {
            const empty = stringTrack('Empty', []);
            const partial = stringTrack('Partial', ['A', 'B'], {
                A: [0, 0, 0, 1],
            });
            assert.deepEqual(
                buildEffectivePalette([empty, partial], trackValues, getColor),
                { Partial: { A: '#000000' } }
            );
        });

        it('serializes with sorted keys so exports diff cleanly', () => {
            const json = serializePalette({
                Sex: { Male: '#2986e2', Female: '#e0699e' },
                Age: { '18-39': '#8bc86a' },
            });
            assert.deepEqual(JSON.parse(json), {
                Age: { '18-39': '#8bc86a' },
                Sex: { Female: '#e0699e', Male: '#2986e2' },
            });
            assert.isBelow(json.indexOf('"Age"'), json.indexOf('"Sex"'));
            assert.isBelow(json.indexOf('"Female"'), json.indexOf('"Male"'));
        });

        it('round trips an exported palette back onto the same tracks', () => {
            const sex = stringTrack('Sex', ['Female', 'Male'], {
                Female: [224, 105, 158, 1],
                Male: [41, 134, 226, 1],
            });
            const json = serializePalette(
                buildEffectivePalette([sex], trackValues, getColor)
            );
            const resolved = resolvePaletteToTracks(
                parsePaletteFile(json),
                [sex],
                trackValues
            );
            assert.deepEqual(resolved.colors, {
                Sex: { Female: [224, 105, 158, 1], Male: [41, 134, 226, 1] },
            });
            assert.deepEqual(resolved.unmatched, []);
        });
    });
});
