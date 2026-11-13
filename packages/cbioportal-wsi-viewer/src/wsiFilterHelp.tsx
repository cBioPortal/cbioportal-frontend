import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { WSI_THEME } from './wsiTheme';
import { MatchLevel, WsiStainKind } from './wsiViewerTypes';

/** The viewer's filter terms, explained for readers outside pathology. */
interface WsiFilterHelpEntry<K extends string> {
    key: K;
    label: string;
    text: string;
}

export const WSI_MATCH_LEVEL_HELP: ReadonlyArray<WsiFilterHelpEntry<
    MatchLevel
>> = [
    {
        key: 'BLOCK',
        label: 'Block',
        text:
            'Cut from the same tissue block that was sequenced (or the only ' +
            'scanned block of the sequenced part). This is the closest ' +
            'match to the tissue behind the genomic results.',
    },
    {
        key: 'PART',
        label: 'Part',
        text:
            'From the same part (often called the specimen) as the sequenced ' +
            'sample, but not known to come from the sequenced block. It shows ' +
            'the same tissue from the same site and procedure.',
    },
    {
        key: 'UNMATCHED',
        label: 'Unmatched',
        text:
            'From this patient, but not linked to a sequenced sample, for ' +
            'example from another biopsy or surgery.',
    },
];

export const WSI_STAIN_HELP: ReadonlyArray<WsiFilterHelpEntry<WsiStainKind>> = [
    {
        key: 'hne',
        label: 'H&E',
        text:
            'Hematoxylin and eosin, the routine stain that shows tissue ' +
            'structure: nuclei blue-purple, cytoplasm and connective tissue ' +
            'pink.',
    },
    {
        key: 'ihc',
        label: 'IHC',
        text:
            'Immunohistochemistry: an antibody stain that shows where one ' +
            'protein, such as PD-L1 or HER2, is present, usually in brown.',
    },
    {
        key: 'other',
        label: 'Other (known)',
        text:
            'A recorded stain that is neither H&E nor IHC, such as a special ' +
            'stain (PAS, trichrome), a cytology preparation or an unstained ' +
            'recut.',
    },
    {
        key: 'unknown',
        label: 'Unknown',
        text:
            "The pathology records don't name the stain, and it hasn't (yet) " +
            'been classified from the image with enough confidence.',
    },
];

const MATCH_PRIMER =
    'How a slide relates to a sequenced sample. Tissue removed in a biopsy ' +
    'or surgery is divided into parts, separate pieces of tissue, often ' +
    'called specimens. Each part is embedded in one or more paraffin ' +
    'blocks, and slides are thin sections cut from a block.';

const STAIN_PRIMER =
    'The stain used on the slide, from the pathology records or, when they ' +
    "don't say, classified from the image.";

/** The plain-language explanation of one match level. */
export function matchLevelHelpText(matchLevel: MatchLevel): string {
    return WSI_MATCH_LEVEL_HELP.find(h => h.key === matchLevel)?.text || '';
}

/** The plain-language explanation of one stain group. */
export function stainHelpText(stainKind: WsiStainKind): string {
    return WSI_STAIN_HELP.find(h => h.key === stainKind)?.text || '';
}

function WsiFilterHelpIcon<K extends string>({
    primer,
    entries,
    ariaLabel,
    testId,
    style,
}: {
    primer: string;
    entries: ReadonlyArray<WsiFilterHelpEntry<K>>;
    ariaLabel: string;
    testId: string;
    style?: React.CSSProperties;
}) {
    return (
        <DefaultTooltip
            trigger={['hover', 'focus']}
            placement="right"
            overlay={
                <div data-testid={`${testId}-help`} style={{ maxWidth: 320 }}>
                    <div style={{ marginBottom: 6 }}>{primer}</div>
                    {entries.map(({ label, text }) => (
                        <div key={label} style={{ marginTop: 4 }}>
                            <b>{label}:</b> {text}
                        </div>
                    ))}
                </div>
            }
        >
            <i
                className="fa fa-info-circle"
                role="img"
                tabIndex={0}
                aria-label={ariaLabel}
                data-testid={`${testId}-info`}
                style={{
                    color: WSI_THEME.muted,
                    cursor: 'help',
                    fontSize: 12,
                    ...style,
                }}
            />
        </DefaultTooltip>
    );
}

/** An info icon whose tooltip explains the match levels. */
export function WsiMatchLevelInfo({ style }: { style?: React.CSSProperties }) {
    return (
        <WsiFilterHelpIcon
            primer={MATCH_PRIMER}
            entries={WSI_MATCH_LEVEL_HELP}
            ariaLabel="What the match levels mean"
            testId="wsi-match-level"
            style={style}
        />
    );
}

/** An info icon whose tooltip explains the stain groups. */
export function WsiStainInfo({ style }: { style?: React.CSSProperties }) {
    return (
        <WsiFilterHelpIcon
            primer={STAIN_PRIMER}
            entries={WSI_STAIN_HELP}
            ariaLabel="What the stain groups mean"
            testId="wsi-stain"
            style={style}
        />
    );
}
