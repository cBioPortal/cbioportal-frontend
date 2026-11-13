import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { WSI_THEME } from './wsiTheme';

/** What the match levels mean, for readers who don't work in pathology. */
export const WSI_MATCH_LEVEL_HELP: ReadonlyArray<{
    level: string;
    text: string;
}> = [
    {
        level: 'Block',
        text:
            'Cut from the same tissue block that was sequenced (or the only ' +
            'scanned block of the sequenced part). This is the closest ' +
            'match to the tissue behind the genomic results.',
    },
    {
        level: 'Part',
        text:
            'From the same part of the specimen as the sequenced sample, but ' +
            'not known to come from the sequenced block. It shows the same ' +
            'tissue from the same site and procedure.',
    },
    {
        level: 'Unmatched',
        text:
            'From this patient, but not linked to a sequenced sample, for ' +
            'example from another biopsy or surgery.',
    },
];

/** An info icon whose tooltip explains the match levels. */
export function WsiMatchLevelInfo({ style }: { style?: React.CSSProperties }) {
    return (
        <DefaultTooltip
            trigger={['hover', 'focus']}
            placement="right"
            overlay={
                <div
                    data-testid="wsi-match-level-help"
                    style={{ maxWidth: 320 }}
                >
                    <div style={{ marginBottom: 6 }}>
                        How a slide relates to a sequenced sample. A specimen (a
                        biopsy or surgical resection) is divided into parts,
                        separate pieces of tissue. Each part is embedded in one
                        or more paraffin blocks, and slides are thin sections
                        cut from a block.
                    </div>
                    {WSI_MATCH_LEVEL_HELP.map(({ level, text }) => (
                        <div key={level} style={{ marginTop: 4 }}>
                            <b>{level}:</b> {text}
                        </div>
                    ))}
                </div>
            }
        >
            <i
                className="fa fa-info-circle"
                role="img"
                tabIndex={0}
                aria-label="What the match levels mean"
                data-testid="wsi-match-level-info"
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
