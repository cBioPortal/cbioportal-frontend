import { MetaRow } from './wsiMetaSidebar';
import {
    Sample,
    Slide,
    TileMetadata,
    UNMATCHED_SAMPLE_ID,
    WsiStainKind,
} from './wsiViewerTypes';
import { cleanStain, fmtFileSize, normalizeBlockLabel } from './wsiNavUtils';
import {
    blockName,
    formatSpecimenLabel,
    realPartDescription,
} from './wsiSpecimenUtils';
import { WSI_STAIN_COLORS } from './wsiTheme';
import { nativeObjectivePower } from './wsiScaleUtils';
import { getWsiViewerRuntime } from './wsiViewerConfig';

function freezeMetaRows(rows: MetaRow[]): MetaRow[] {
    rows.forEach(row => Object.freeze(row));
    return Object.freeze(rows) as MetaRow[];
}

export function buildSampleUrl(
    studyId: string,
    sampleId: string,
    patientId: string
): string {
    return getWsiViewerRuntime().buildPageUrl('patient', {
        studyId,
        caseId: patientId,
        sampleId,
    });
}

const STAIN_BADGES: Record<WsiStainKind, string> = {
    hne: 'H&E',
    ihc: 'IHC',
    other: 'Other',
    unknown: 'Unknown',
};

export function getStainBadge(slide: Pick<Slide, 'stain_kind'>): string {
    return STAIN_BADGES[slide.stain_kind];
}

function stainKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * The stain group, followed by the stain name when it adds to the group
 * (`IHC — Ki-67`); a name that only repeats the group (`H&E`) is left out.
 */
export function stainValue(stainBadge: string, stainName: string): string {
    return !stainName || stainKey(stainName) === stainKey(stainBadge)
        ? stainBadge
        : `${stainBadge} — ${stainName}`;
}

// Unknown shares Other's dot.
const STAIN_DOT_COLORS: Record<WsiStainKind, string> = {
    hne: WSI_STAIN_COLORS['H&E'],
    ihc: WSI_STAIN_COLORS.IHC,
    other: WSI_STAIN_COLORS.Other,
    unknown: WSI_STAIN_COLORS.Other,
};

export function getStainDotColor(slide: Pick<Slide, 'stain_kind'>): string {
    return STAIN_DOT_COLORS[slide.stain_kind];
}

export function buildWsiRows(
    slide: Slide | null,
    meta: TileMetadata
): MetaRow[] {
    const w = meta.dimensions.width;
    const h = meta.dimensions.height;
    const mppX = meta.mpp?.x || 0;
    const mppY = meta.mpp?.y || 0;
    const mpp = mppX && mppY ? (mppX + mppY) / 2 : 0;
    const nativePower = nativeObjectivePower(meta);
    const objNum = nativePower ? Math.round(nativePower) : 0;
    const magnification =
        slide?.magnification?.trim() || (objNum ? `${objNum}×` : '');

    const dimensionTips = [
        mpp
            ? `About ${((w * mpp) / 1000).toFixed(1)} × ${(
                  (h * mpp) /
                  1000
              ).toFixed(1)} mm of glass`
            : null,
        slide?.file_size_bytes
            ? `File size ${fmtFileSize(slide.file_size_bytes)}`
            : null,
    ].filter(Boolean);
    const rows: MetaRow[] = [
        {
            label: 'Dimensions',
            labelTip: 'Width × height at full resolution',
            value: `${w.toLocaleString()} × ${h.toLocaleString()} px`,
            valueTip: dimensionTips.length
                ? dimensionTips.join('\n')
                : undefined,
        },
    ];
    if (magnification || mpp) {
        rows.push({
            label: 'Magnification',
            labelTip:
                'Scanner magnification and microns per pixel at full resolution',
            value: [magnification, mpp ? `${mpp.toFixed(4)} µm/px` : null]
                .filter(Boolean)
                .join(' · '),
            valueTip: mpp
                ? `Each pixel spans ${mpp.toFixed(
                      4
                  )} µm; 1 mm is about ${Math.round(
                      1000 / mpp
                  ).toLocaleString()} pixels`
                : 'Optical magnification of the scan: 40× is about 0.25 µm per pixel, 20× about 0.5 µm per pixel',
        });
    }
    if (meta.vendor?.trim()) {
        rows.push({
            label: 'Scanner vendor',
            labelTip: 'Scanner manufacturer recorded in the slide file',
            value: meta.vendor.trim(),
        });
    }

    return freezeMetaRows(rows);
}

function specimenTooltip(
    slide: Pick<
        Slide,
        'part_number' | 'part_description' | 'block_label' | 'block_number'
    >
): string | undefined {
    const description = realPartDescription(slide.part_description);
    const part = slide.part_number
        ? `part ${slide.part_number}${description ? ` (${description})` : ''}`
        : description;
    const block = slide.block_label || slide.block_number;
    if (!part && !block) {
        return undefined;
    }
    return `Cut from ${[block ? `block ${blockName(block)}` : null, part]
        .filter(Boolean)
        .join(' of ')}`;
}

/**
 * Pathology rows for the selected slide. Patient and study context is left
 * to the host page and the Clinical section; these rows describe the slide
 * and the specimen it was cut from.
 */
export function buildPathRows(
    slide: Slide,
    sample: Sample,
    patientId: string,
    studyId: string
): MetaRow[] {
    const isUnmatchedSample = sample.sample_id === UNMATCHED_SAMPLE_ID;
    const stainBadge = getStainBadge(slide);
    const stainName = cleanStain(slide.stain_name);
    const sampleUrl =
        sample.sample_id && !isUnmatchedSample
            ? buildSampleUrl(studyId, sample.sample_id, patientId)
            : undefined;
    const blockLbl = normalizeBlockLabel(slide.block_label, slide.block_number);
    const sampleTip = blockLbl ? `Block: ${blockLbl}` : undefined;

    // A generated "Part <n>" description names no anatomical site and repeats the Part row.
    const partDesc = realPartDescription(slide.part_description);
    const matchLevel = slide.match_level;
    const hasSpecimenDetails = !!(
        slide.part_number ||
        slide.part_description ||
        slide.block_label ||
        slide.block_number
    );

    const rows: MetaRow[] = [
        {
            label: 'Stain',
            labelTip: 'Staining protocol used for this slide',
            value: stainValue(stainBadge, stainName),
            valueTip: `Stain group: ${stainBadge}. Stain: ${stainName || '—'}`,
        },
        {
            label: 'Sample',
            labelTip: sampleTip
                ? 'Click for cBioPortal sample view — hover for block info'
                : 'Tumor sample identifier',
            value: isUnmatchedSample
                ? 'Unmatched pathology slides'
                : sample.sample_id || '—',
            href: sampleUrl,
            valueTip: sampleTip,
        },
    ];
    if (matchLevel && hasSpecimenDetails) {
        rows.push({
            label: 'Part',
            labelTip: 'Pathology part containing this slide',
            value: formatSpecimenLabel({ ...slide, match_level: matchLevel }),
            valueTip: specimenTooltip(slide),
        });
    }
    if (matchLevel === 'BLOCK' || matchLevel === 'PART') {
        rows.push({
            label: 'Match',
            labelTip:
                'How this pathology slide was matched to the sequenced sample',
            value: matchLevel === 'BLOCK' ? 'Block-matched' : 'Part-matched',
            valueTip:
                matchLevel === 'BLOCK'
                    ? 'The slide was cut from the same tissue block that was sequenced for this sample'
                    : 'The slide comes from the same part as the sequenced sample; the sequenced block is not confirmed',
        });
    }
    if (partDesc) {
        rows.push({
            label: 'Anatomical site',
            labelTip:
                'Pathology part description — which anatomical site this slide was cut from',
            value: partDesc,
        });
    }
    if (slide.slide_key) {
        rows.push({
            label: 'Slide ID',
            labelTip:
                'De-identified slide ID, the same one shown in the study slide table and used in slide links',
            value: slide.slide_key,
        });
    }

    return freezeMetaRows(rows);
}
