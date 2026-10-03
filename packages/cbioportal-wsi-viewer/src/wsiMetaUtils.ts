import { MetaRow } from './wsiMetaSidebar';
import {
    Sample,
    Slide,
    SlideAssociation,
    TileMetadata,
} from './wsiViewerTypes';
import {
    cleanStain,
    fmtMB,
    formatDaysSinceDiagnosis,
    getSlideTimepointDays,
    normalizeBlockLabel,
    procedureSlideTimepointText,
} from './wsiNavUtils';
import { blockName, formatSpecimenLabel } from './wsiSpecimenUtils';
import { wsiStainKind } from './wsiSlideUtils';
import {
    DAY_ZERO_TOOLTIP,
    sequencedRelativeToProcedureText,
    WsiSampleTimeline,
} from './wsiSampleTimeline';

function freezeMetaRows(rows: MetaRow[]): MetaRow[] {
    rows.forEach(row => Object.freeze(row));
    return Object.freeze(rows) as MetaRow[];
}

function normalizeSidebarTextValue(value: string | null | undefined): string {
    return (value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

export function getPatientId(sampleId: string, patientId?: string): string {
    if (patientId) {
        return patientId;
    }
    return sampleId.replace(/-T\d+.*$/i, '');
}

export function buildPatientUrl(
    studyId: string,
    sampleId: string,
    patientId?: string
): string {
    return `/patient?studyId=${encodeURIComponent(
        studyId
    )}&caseId=${encodeURIComponent(getPatientId(sampleId, patientId))}`;
}

export function buildSampleUrl(
    studyId: string,
    sampleId: string,
    patientId?: string
): string {
    return `${buildPatientUrl(
        studyId,
        sampleId,
        patientId
    )}&sampleId=${encodeURIComponent(sampleId)}`;
}

export function getStainBadge(
    slide: Pick<Slide, 'is_hne' | 'is_ihc' | 'slide_type'>
): string {
    const kind = wsiStainKind(slide);
    return kind === 'ihc'
        ? 'IHC'
        : kind === 'hne'
        ? 'H&E'
        : kind === 'other'
        ? 'Other'
        : 'Unknown';
}

export function getStainDotColor(
    slide: Pick<Slide, 'is_hne' | 'is_ihc' | 'slide_type'>,
    colors: { blue: string; orange: string }
): string {
    const kind = wsiStainKind(slide);
    return kind === 'ihc'
        ? colors.orange
        : kind === 'hne'
        ? colors.blue
        : '#777';
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
    const objNum = meta.objective_power || (mpp ? Math.round(10 / mpp) : 0);
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
            ? `File size ${fmtMB(slide.file_size_bytes)}`
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

function specimenTooltip(association: {
    part_number?: string | null;
    part_description?: string | null;
    block_label?: string | null;
    block_number?: string | null;
}): string | undefined {
    const part = association.part_number
        ? `part ${association.part_number}${
              association.part_description
                  ? ` (${association.part_description})`
                  : ''
          }`
        : association.part_description;
    const block = association.block_label || association.block_number;
    if (!part && !block) {
        return undefined;
    }
    return `Cut from ${[
        block ? `block ${blockName(block)}` : null,
        part ? `specimen ${part}` : null,
    ]
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
    patientId?: string,
    studyId?: string,
    association?: SlideAssociation,
    sampleTimeline?: WsiSampleTimeline
): MetaRow[] {
    const isUnmatchedSample = sample.sample_id === 'UNMATCHED';
    const stainBadge = getStainBadge(slide);
    const sampleUrl =
        studyId && sample.sample_id && !isUnmatchedSample
            ? buildSampleUrl(studyId, sample.sample_id, patientId)
            : undefined;
    const blockLbl = normalizeBlockLabel(slide.block_label, slide.block_number);
    let sampleTip: string | undefined;
    if (blockLbl) {
        sampleTip = `Block: ${blockLbl}`;
    }
    if (sample.sample_type) {
        sampleTip = `${sampleTip ? `${sampleTip}\n` : ''}Type: ${
            sample.sample_type
        }`;
    }

    const pathDxTitle = slide.path_dx_title
        ? slide.path_dx_title.charAt(0).toUpperCase() +
          slide.path_dx_title.slice(1).toLowerCase()
        : null;
    const partDesc = slide.part_description || null;
    const hasDistinctPathDx =
        normalizeSidebarTextValue(pathDxTitle) !==
        normalizeSidebarTextValue(partDesc);
    const hasSpecimenDetails = !!(
        association?.part_number ||
        association?.part_description ||
        association?.block_label ||
        association?.block_number
    );

    const rows: MetaRow[] = [
        {
            label: 'Stain',
            labelTip: 'Staining protocol used for this slide',
            value: stainBadge
                ? `${stainBadge} — ${cleanStain(slide.stain_name)}`
                : cleanStain(slide.stain_name),
            valueTip: stainBadge
                ? `Stain group: ${stainBadge}. Stain: ${cleanStain(
                      slide.stain_name
                  )}`
                : undefined,
        },
        {
            label: 'Sample',
            labelTip: sampleTip
                ? 'Click for cBioPortal sample view — hover for block/type info'
                : 'Tumor sample identifier',
            value: isUnmatchedSample
                ? 'Unmatched pathology slides'
                : sample.sample_id || '—',
            href: sampleUrl,
            valueTip: sampleTip,
        },
    ];
    const timeline = buildTimelineRow(
        slide,
        sample,
        isUnmatchedSample ? undefined : sampleTimeline
    );
    if (timeline) {
        rows.push(timeline);
    }
    if (association && hasSpecimenDetails) {
        rows.push({
            label: 'Specimen',
            labelTip: 'Pathology specimen containing this slide',
            value: formatSpecimenLabel(association),
            valueTip: specimenTooltip(association),
        });
    }
    if (
        association?.match_level === 'BLOCK' ||
        association?.match_level === 'PART'
    ) {
        rows.push({
            label: 'Match',
            labelTip:
                'How this pathology slide was matched to the IMPACT sample',
            value:
                association.match_level === 'BLOCK'
                    ? 'Block-matched'
                    : 'Part-matched',
            valueTip:
                association.match_level === 'BLOCK'
                    ? 'The slide was cut from the same tissue block that was sequenced for this sample'
                    : 'The slide comes from the same specimen part as the sequenced sample; the sequenced block is not confirmed',
        });
    }
    if (partDesc) {
        rows.push({
            label: 'Anatomical site',
            labelTip:
                'Pathology part description — which anatomical specimen this slide was cut from',
            value: partDesc,
        });
    }
    if (pathDxTitle && hasDistinctPathDx) {
        rows.push({
            label: 'Path Dx',
            labelTip: 'Pathological diagnosis title for this anatomical part',
            value: pathDxTitle,
        });
    }

    return freezeMetaRows(rows);
}

/**
 * One row for the slide's timing: the procedure day (or other recorded
 * timepoint), then the sample's acquisition and sequencing days when the
 * patient timeline has them. Days count from the patient's first tumor
 * sequencing.
 */
function buildTimelineRow(
    slide: Slide,
    sample: Sample,
    sampleTimeline: WsiSampleTimeline | undefined
): MetaRow | undefined {
    const timepoint = procedureSlideTimepointText(slide);
    const procedureDays = timepoint ? getSlideTimepointDays(slide) : undefined;
    const parts: string[] = [];
    if (procedureDays != null) {
        parts.push(`Procedure ${formatDaysSinceDiagnosis(procedureDays)}`);
    } else if (timepoint) {
        parts.push(timepoint);
    }
    if (sampleTimeline?.acquisitionDays != null) {
        parts.push(
            `acquired ${formatDaysSinceDiagnosis(
                sampleTimeline.acquisitionDays
            )}`
        );
    }
    if (sampleTimeline?.sequencingDays != null) {
        parts.push(
            `sequenced ${sequencedRelativeToProcedureText(
                sampleTimeline.sequencingDays,
                procedureDays
            )}`
        );
    } else if (sample.sequencing_date) {
        parts.push(`sequenced ${sample.sequencing_date}`);
    }
    if (parts.length === 0) {
        return undefined;
    }
    return {
        label: 'Timeline',
        labelTip:
            'Procedure, sample acquisition and sequencing days for this slide',
        value: parts.join(' · '),
        valueTip: slide.slide_timepoint_source
            ? `${slide.slide_timepoint_source}. ${DAY_ZERO_TOOLTIP}`
            : DAY_ZERO_TOOLTIP,
    };
}
