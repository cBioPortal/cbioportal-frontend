import _ from 'lodash';
import { RGBAColor } from 'oncoprintjs';
import { ClinicalTrackSpec } from './Oncoprint';
import { rgbaToHex } from 'shared/lib/Colors';

/**
 * Import/export of OncoPrint clinical track color palettes.
 *
 * The colors a user picks are already stored as a dictionary of
 * track label -> attribute value -> RGBA, so moving a palette between machines is a
 * serialization problem rather than a data model problem. This module holds the pure
 * (React-free, store-free) half of that: parsing palette files, resolving them against the
 * tracks currently on screen, and serializing the current colors back out.
 *
 * Both the Results View OncoPrint and the Oncoprinter tool use this. They persist their color
 * dictionaries under different shapes (Results View nests everything under a 'global' key),
 * so everything here operates on the inner track-label-keyed map only.
 */

/** attribute value -> '#rrggbb' */
export type PaletteValueToHex = { [attributeValue: string]: string };

/** track label -> attribute value -> '#rrggbb'. The shape we export. */
export type NestedPalette = { [trackLabel: string]: PaletteValueToHex };

/** track label -> attribute value -> RGBA. The shape the stores persist. */
export type TrackLabelToValueToColor = {
    [trackLabel: string]: { [attributeValue: string]: RGBAColor };
};

export const PALETTE_FILE_NAME = 'oncoprint_colors.json';

export class PaletteParseError extends Error {
    constructor(message: string) {
        super(message);
        // Error subclassing is unreliable when downleveled to ES5.
        Object.setPrototypeOf(this, PaletteParseError.prototype);
        this.name = 'PaletteParseError';
    }
}

/**
 * A palette file is either keyed by track, or is a flat value -> color dictionary applied to
 * every track. The flat form is how people actually keep these palettes today (a named vector
 * in R, a two column spreadsheet), so it is a first class input, not just a convenience.
 */
export type ParsedPalette =
    | { kind: 'nested'; palette: NestedPalette }
    | { kind: 'flat'; palette: PaletteValueToHex };

/**
 * Named CSS colors accepted on import. Deliberately a short list rather than the full CSS set:
 * these are the ones that show up in hand written clinical palettes (vital status is routinely
 * white/black), and every other value in such a file is a hex code.
 */
const NAMED_COLORS: { [name: string]: string } = {
    white: '#ffffff',
    black: '#000000',
    grey: '#808080',
    gray: '#808080',
};

/**
 * Accepts '#rgb', '#rrggbb', and the same without the leading '#', plus the named colors above.
 * Returns undefined for anything else.
 *
 * Colors.ts:hexToRGBA is intentionally not reused here: it assumes exactly '#rrggbb' and is
 * called from many unrelated places, so widening it to cope with user supplied files would
 * change behavior well outside the OncoPrint.
 */
export function normalizeColorToRGBA(input: string): RGBAColor | undefined {
    if (!_.isString(input)) {
        return undefined;
    }
    const trimmed = input.trim();
    const named = NAMED_COLORS[trimmed.toLowerCase()];
    if (named) {
        return normalizeColorToRGBA(named);
    }

    const hex = trimmed.replace(/^#/, '');
    if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
        return undefined;
    }

    // expand shorthand '#abc' to '#aabbcc'
    const full =
        hex.length === 3
            ? hex
                  .split('')
                  .map(c => c + c)
                  .join('')
            : hex;

    return [
        parseInt(full.slice(0, 2), 16),
        parseInt(full.slice(2, 4), 16),
        parseInt(full.slice(4, 6), 16),
        1,
    ];
}

/**
 * Normalization used when matching values and track labels from a file against what is on
 * screen. Mirrors what Colors.ts:getClinicalValueColor already does for reserved values, so a
 * palette file behaves the same way the portal's own default lookups do.
 */
export function normalizeKey(key: string): string {
    return key.replace(/\s/g, '').toLowerCase();
}

function isPlainStringMap(obj: any): boolean {
    return _.every(_.values(obj), v => _.isString(v));
}

function isPlainObjectMap(obj: any): boolean {
    return _.every(
        _.values(obj),
        v => _.isPlainObject(v) && isPlainStringMap(v)
    );
}

function parseJsonPalette(text: string): ParsedPalette {
    let parsed: any;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        throw new PaletteParseError(
            'Could not parse this file as JSON. Expected either {"track": {"value": "#rrggbb"}} or {"value": "#rrggbb"}.'
        );
    }

    if (!_.isPlainObject(parsed)) {
        throw new PaletteParseError(
            'Expected the file to contain a JSON object mapping names to colors.'
        );
    }

    const values = _.values(parsed);
    if (values.length === 0) {
        throw new PaletteParseError('This palette file is empty.');
    }

    if (isPlainStringMap(parsed)) {
        return { kind: 'flat', palette: parsed as PaletteValueToHex };
    }
    if (isPlainObjectMap(parsed)) {
        return { kind: 'nested', palette: parsed as NestedPalette };
    }
    throw new PaletteParseError(
        'Mixed palette format. Use either {"track": {"value": "#rrggbb"}} for per-track colors or {"value": "#rrggbb"} to apply colors across all tracks, not both.'
    );
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
    return line
        .split(delimiter)
        .map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
}

/**
 * Two column `name<delimiter>color` files, treated as a flat palette. A leading header row is
 * skipped when its second cell is not itself a color.
 */
function parseDelimitedPalette(text: string): ParsedPalette {
    const lines = text
        .split(/\r\n|\r|\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('#'));

    if (lines.length === 0) {
        throw new PaletteParseError('This palette file is empty.');
    }

    const delimiter = lines[0].indexOf('\t') >= 0 ? '\t' : ',';
    const rows = lines.map(l => splitDelimitedLine(l, delimiter));

    if (_.some(rows, row => row.length < 2)) {
        throw new PaletteParseError(
            'Expected two columns per row: a value and a color.'
        );
    }

    // drop a header row, recognized by its color cell not being a color
    if (rows.length > 1 && !normalizeColorToRGBA(rows[0][1])) {
        rows.shift();
    }

    const palette: PaletteValueToHex = {};
    rows.forEach(row => {
        palette[row[0]] = row[1];
    });

    if (_.isEmpty(palette)) {
        throw new PaletteParseError('This palette file is empty.');
    }
    // a delimited file in which nothing at all parses as a color is not a palette; say so
    // rather than reporting every row as an unreadable color
    if (!_.some(_.values(palette), hex => normalizeColorToRGBA(hex))) {
        throw new PaletteParseError(
            'No colors found. Expected two columns per row: a value and a color such as #rrggbb.'
        );
    }
    return { kind: 'flat', palette };
}

/**
 * Parse a user supplied palette file. Throws PaletteParseError with a message suitable for
 * showing directly to the user.
 */
export function parsePaletteFile(text: string): ParsedPalette {
    if (text.trim().length === 0) {
        throw new PaletteParseError('This palette file is empty.');
    }
    // route anything JSON-shaped to the JSON parser, including arrays, so that a JSON file in
    // the wrong shape reports as bad JSON rather than being misread as a delimited file
    return /^[{[]/.test(text.trim())
        ? parseJsonPalette(text)
        : parseDelimitedPalette(text);
}

export type ResolvedPalette = {
    /** ready to hand to the stores' bulk color setter */
    colors: TrackLabelToValueToColor;
    /** number of (track, value) pairs that will be recolored */
    appliedCount: number;
    /** number of tracks touched */
    trackCount: number;
    /** entries in the file that matched no track value, for reporting back to the user */
    unmatched: string[];
    /** entries in the file whose color could not be understood */
    invalid: string[];
};

/**
 * Work out which on-screen track values a parsed palette actually recolors.
 *
 * Entries that match nothing are reported rather than treated as errors: palettes are shared
 * between projects and routinely carry values for studies that are not currently loaded.
 */
export function resolvePaletteToTracks(
    parsed: ParsedPalette,
    tracks: ClinicalTrackSpec[],
    getTrackValues: (track: ClinicalTrackSpec) => any[]
): ResolvedPalette {
    const colors: TrackLabelToValueToColor = {};
    const unmatched: string[] = [];
    const invalid: string[] = [];
    let appliedCount = 0;

    const assign = (trackLabel: string, value: string, rgba: RGBAColor) => {
        if (!colors[trackLabel]) {
            colors[trackLabel] = {};
        }
        if (!(value in colors[trackLabel])) {
            appliedCount++;
        }
        colors[trackLabel][value] = rgba;
    };

    if (parsed.kind === 'flat') {
        // one value -> color dictionary applied to every track that has a matching value
        const byNormalizedValue: { [key: string]: string } = {};
        _.forEach(parsed.palette, (hex, value) => {
            byNormalizedValue[normalizeKey(value)] = hex;
        });
        const used: { [key: string]: boolean } = {};

        tracks.forEach(track => {
            getTrackValues(track).forEach(value => {
                const hex = byNormalizedValue[normalizeKey(String(value))];
                if (hex === undefined) {
                    return;
                }
                const rgba = normalizeColorToRGBA(hex);
                if (!rgba) {
                    return;
                }
                used[normalizeKey(String(value))] = true;
                assign(track.label, String(value), rgba);
            });
        });

        _.forEach(parsed.palette, (hex, value) => {
            if (!normalizeColorToRGBA(hex)) {
                invalid.push(`${value}: ${hex}`);
            } else if (!used[normalizeKey(value)]) {
                unmatched.push(value);
            }
        });
    } else {
        const tracksByNormalizedLabel = _.keyBy(tracks, t =>
            normalizeKey(t.label)
        );

        _.forEach(parsed.palette, (valueToHex, trackLabel) => {
            const track = tracksByNormalizedLabel[normalizeKey(trackLabel)];
            if (!track) {
                unmatched.push(trackLabel);
                return;
            }
            const valuesByNormalized = _.keyBy(
                getTrackValues(track).map(String),
                normalizeKey
            );
            _.forEach(valueToHex, (hex, value) => {
                const rgba = normalizeColorToRGBA(hex);
                if (!rgba) {
                    invalid.push(`${trackLabel} / ${value}: ${hex}`);
                    return;
                }
                const trackValue = valuesByNormalized[normalizeKey(value)];
                if (trackValue === undefined) {
                    unmatched.push(`${trackLabel} / ${value}`);
                    return;
                }
                assign(track.label, trackValue, rgba);
            });
        });
    }

    return {
        colors,
        appliedCount,
        trackCount: _.keys(colors).length,
        unmatched,
        invalid,
    };
}

/**
 * The palette currently in effect, for every track on screen: portal defaults with the user's
 * overrides already applied. Exporting the effective palette rather than just the user's
 * overrides is what makes the file reproducible on its own - a mostly-default OncoPrint would
 * otherwise export an almost empty file.
 */
export function buildEffectivePalette(
    tracks: ClinicalTrackSpec[],
    getTrackValues: (track: ClinicalTrackSpec) => any[],
    getTrackColor: (track: ClinicalTrackSpec, value: string) => RGBAColor
): NestedPalette {
    const palette: NestedPalette = {};
    tracks.forEach(track => {
        const values = getTrackValues(track);
        if (_.isEmpty(values)) {
            return;
        }
        const valueToHex: PaletteValueToHex = {};
        values.forEach(value => {
            const color = getTrackColor(track, String(value));
            if (color) {
                valueToHex[String(value)] = rgbaToHex(color);
            }
        });
        if (!_.isEmpty(valueToHex)) {
            palette[track.label] = valueToHex;
        }
    });
    return palette;
}

/** Stable, human editable JSON. Keys are sorted so exports diff cleanly between sessions. */
export function serializePalette(palette: NestedPalette): string {
    const sorted: NestedPalette = {};
    _.keys(palette)
        .sort()
        .forEach(trackLabel => {
            const valueToHex: PaletteValueToHex = {};
            _.keys(palette[trackLabel])
                .sort()
                .forEach(value => {
                    valueToHex[value] = palette[trackLabel][value];
                });
            sorted[trackLabel] = valueToHex;
        });
    return JSON.stringify(sorted, null, 4);
}
