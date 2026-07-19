import { MetaRow } from './wsiMetaSidebar';
import {
    Sample,
    Slide,
    SlideAssociation,
    TileMetadata,
} from './wsiViewerTypes';
import {
    barcodeAccession,
    cleanStain,
    fmtMB,
    normalizeBlockLabel,
    procedureSlideTimepointText,
} from './wsiNavUtils';
import { formatSpecimenLabel } from './wsiSpecimenUtils';

type CachedWsiRowsEntry = {
    rows: MetaRow[];
    signature: string;
};

type CachedPathRowsEntry = {
    rows: MetaRow[];
    signature: string;
};

type CachedSeqRowsEntry = {
    rows: MetaRow[];
    signature: string;
};

const wsiRowsCache = new WeakMap<TileMetadata, CachedWsiRowsEntry>();
const pathRowsCache = new WeakMap<Slide, CachedPathRowsEntry>();
const seqRowsCache = new WeakMap<Sample, CachedSeqRowsEntry>();

function cloneMetaRows(rows: MetaRow[]): MetaRow[] {
    const cloned = new Array<MetaRow>(rows.length);
    for (let index = 0; index < rows.length; index += 1) {
        cloned[index] = { ...rows[index] };
    }
    return cloned;
}

function freezeMetaRows(rows: MetaRow[]): MetaRow[] {
    rows.forEach(row => Object.freeze(row));
    return Object.freeze(rows) as MetaRow[];
}

function buildWsiRowsSignature(slide: Slide | null, meta: TileMetadata): string {
    return [
        slide?.file_size_bytes || '',
        meta.dimensions.width,
        meta.dimensions.height,
        meta.mpp?.x || '',
        meta.mpp?.y || '',
        meta.objective_power || '',
        meta.max_zoom,
        meta.tile_size,
    ].join('::');
}

function buildPathRowsSignature(
    slide: Slide,
    sample: Sample,
    patientId?: string,
    studyId?: string,
    association?: SlideAssociation
): string {
    return [
        patientId || '',
        studyId || '',
        slide.image_id || '',
        slide.stain_name || '',
        slide.stain_group || '',
        slide.is_hne ? '1' : '0',
        slide.is_ihc ? '1' : '0',
        slide.barcode || '',
        slide.block_label || '',
        slide.block_number || '',
        slide.path_dx_title || '',
        slide.part_description || '',
        slide.slide_timepoint_days ?? '',
        slide.slide_timepoint_source || '',
        sample.sample_id || '',
        sample.cancer_type || '',
        sample.cancer_type_detailed || '',
        sample.oncotree_code || '',
        sample.primary_site || '',
        sample.sample_type || '',
        association?.match_level || '',
        association?.specimen_key || '',
        association?.part_number || '',
        association?.part_description || '',
        association?.block_label || '',
        association?.block_number || '',
    ].join('::');
}

function buildSeqRowsSignature(sample: Sample, sampleUrl?: string): string {
    return [
        sampleUrl || '',
        sample.tumor_purity || '',
        sample.tmb_score || '',
        sample.msi_type || '',
        sample.metastatic_site || '',
    ].join('::');
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

export function getStainKind(slide: {
    stain_group?: string;
    is_hne?: boolean;
    is_ihc?: boolean;
}): 'hne' | 'ihc' {
    const stainGroup = (slide.stain_group || '').toLowerCase();
    return stainGroup === 'ihc' || slide.is_ihc ? 'ihc' : 'hne';
}

export function getStainBadge(slide: {
    stain_group?: string;
    is_hne?: boolean;
    is_ihc?: boolean;
}): string {
    return getStainKind(slide) === 'ihc' ? 'IHC' : 'H&E';
}

export function getStainDotColor(
    slide: { stain_group?: string; is_hne?: boolean; is_ihc?: boolean },
    colors: { blue: string; orange: string }
): string {
    return getStainKind(slide) === 'ihc' ? colors.orange : colors.blue;
}

export function buildWsiRows(
    slide: Slide | null,
    meta: TileMetadata
): MetaRow[] {
    return cloneMetaRows(buildWsiRowsReadOnly(slide, meta));
}

export function buildWsiRowsReadOnly(
    slide: Slide | null,
    meta: TileMetadata
): MetaRow[] {
    const signature = buildWsiRowsSignature(slide, meta);
    const cached = wsiRowsCache.get(meta);
    if (cached && cached.signature === signature) {
        return cached.rows;
    }

    const w = meta.dimensions.width;
    const h = meta.dimensions.height;
    const mppX = meta.mpp?.x || 0;
    const mppY = meta.mpp?.y || 0;
    const mpp = mppX && mppY ? (mppX + mppY) / 2 : 0;
    const objNum = meta.objective_power || (mpp ? Math.round(10 / mpp) : 0);

    let dimTip = '';
    if (mpp) {
        dimTip = `MPP: ${mpp.toFixed(4)} µm/px`;
    }
    if (objNum) {
        dimTip += `${dimTip ? '\n' : ''}Objective: ${objNum}×`;
    }
    dimTip += `${dimTip ? '\n' : ''}Zoom levels: ${meta.max_zoom + 1}`;
    dimTip += `\nTile size: ${meta.tile_size} px`;

    const rows: MetaRow[] = [
        {
            label: 'Dimensions',
            labelTip:
                'Width × height at full resolution — hover for scanner details',
            value: `${w.toLocaleString()} × ${h.toLocaleString()} px`,
            valueTip: dimTip,
        },
    ];
    if (slide?.file_size_bytes) {
        rows.push({ label: 'File size', value: fmtMB(slide.file_size_bytes) });
    }

    const frozenRows = freezeMetaRows(rows);
    wsiRowsCache.set(meta, { rows: frozenRows, signature });
    return frozenRows;
}

export function buildPathRows(
    slide: Slide,
    sample: Sample,
    patientId?: string,
    studyId?: string,
    association?: SlideAssociation
): MetaRow[] {
    return cloneMetaRows(
        buildPathRowsReadOnly(slide, sample, patientId, studyId, association)
    );
}

export function buildPathRowsReadOnly(
    slide: Slide,
    sample: Sample,
    patientId?: string,
    studyId?: string,
    association?: SlideAssociation
): MetaRow[] {
    const signature = buildPathRowsSignature(
        slide,
        sample,
        patientId,
        studyId,
        association
    );
    const cached = pathRowsCache.get(slide);
    if (cached && cached.signature === signature) {
        return cached.rows;
    }

    const isUnmatchedSample = sample.sample_id === 'UNMATCHED';
    const stainBadge = getStainBadge(slide);
    const oncotreeUrl = sample.oncotree_code
        ? 'https://oncotree.mskcc.org/'
        : undefined;
    const patientUrl =
        studyId && sample.sample_id && !isUnmatchedSample
            ? buildPatientUrl(studyId, sample.sample_id, patientId)
            : undefined;
    const sampleUrl =
        studyId && sample.sample_id && !isUnmatchedSample
            ? buildSampleUrl(studyId, sample.sample_id, patientId)
            : undefined;
    const studyUrl = studyId
        ? `/study/summary?id=${encodeURIComponent(studyId)}`
        : undefined;
    const cancerTypeUrl =
        studyId && (sample.cancer_type_detailed || sample.cancer_type)
            ? `/results?cancer_study_list=${encodeURIComponent(
                  studyId
              )}&cancer_type=${encodeURIComponent(
                  (sample.cancer_type_detailed || sample.cancer_type || '')
                      .toLowerCase()
                      .replace(/\s+/g, '_')
              )}`
            : undefined;
    const accession = barcodeAccession(slide.barcode);
    const blockLbl = normalizeBlockLabel(slide.block_label, slide.block_number);
    let sampleTip: string | undefined;
    if (accession) {
        sampleTip = `Accession: ${accession}`;
    }
    if (blockLbl) {
        sampleTip = `${sampleTip ? `${sampleTip}\n` : ''}Block: ${blockLbl}`;
    }
    if (sample.sample_type) {
        sampleTip = `${sampleTip ? `${sampleTip}\n` : ''}Type: ${sample.sample_type}`;
    }

    const pathDxTitle = slide.path_dx_title
        ? slide.path_dx_title.charAt(0).toUpperCase() +
          slide.path_dx_title.slice(1).toLowerCase()
        : null;
    const partDesc = slide.part_description || null;
    const timepoint = procedureSlideTimepointText(slide);
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
        },
        {
            label: 'Patient',
            labelTip: 'Click to open cBioPortal patient page',
            value:
                patientId || getPatientId(sample.sample_id, patientId) || '—',
            href: patientUrl,
        },
        {
            label: 'Sample',
            labelTip: sampleTip
                ? 'Click for cBioPortal sample view — hover for accession/block info'
                : 'Tumor sample identifier',
            value: isUnmatchedSample
                ? 'Unmatched pathology slides'
                : sample.sample_id || '—',
            href: sampleUrl,
            valueTip: sampleTip,
        },
    ];
    if (studyId) {
        rows.push({
            label: 'Study',
            labelTip: 'Click to open cBioPortal study summary',
            value: studyId,
            href: studyUrl,
        });
    }
    if (sample.cancer_type_detailed || sample.cancer_type) {
        rows.push({
            label: 'Cancer type',
            value: sample.cancer_type_detailed || sample.cancer_type || '',
            href: cancerTypeUrl,
        });
    }
    if (sample.oncotree_code) {
        rows.push({
            label: 'OncoTree',
            labelTip:
                'OncoTree cancer classification code — click to view on oncotree.mskcc.org',
            value: sample.oncotree_code,
            href: oncotreeUrl,
        });
    }
    if (sample.primary_site) {
        rows.push({ label: 'Primary site', value: sample.primary_site });
    }
    if (timepoint) {
        rows.push({
            label: 'Timepoint',
            labelTip: 'Slide timing anchored to tumor sequencing',
            value: timepoint,
            valueTip: slide.slide_timepoint_source
                ? `${slide.slide_timepoint_source} relative to tumor sequencing`
                : undefined,
        });
    }
    if (association && hasSpecimenDetails) {
        rows.push({
            label: 'Specimen',
            labelTip: 'Pathology specimen containing this slide',
            value: formatSpecimenLabel(association),
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
    if (
        pathDxTitle &&
        pathDxTitle.toLowerCase() !== (partDesc || '').toLowerCase()
    ) {
        rows.push({
            label: 'Path Dx',
            labelTip: 'Pathological diagnosis title for this anatomical part',
            value: pathDxTitle,
        });
    }

    const frozenRows = freezeMetaRows(rows);
    pathRowsCache.set(slide, { rows: frozenRows, signature });
    return frozenRows;
}

export function buildSeqRows(sample: Sample, sampleUrl?: string): MetaRow[] {
    return cloneMetaRows(buildSeqRowsReadOnly(sample, sampleUrl));
}

export function buildSeqRowsReadOnly(
    sample: Sample,
    sampleUrl?: string
): MetaRow[] {
    const signature = buildSeqRowsSignature(sample, sampleUrl);
    const cached = seqRowsCache.get(sample);
    if (cached && cached.signature === signature) {
        return cached.rows;
    }

    const rows: MetaRow[] = [];
    if (sample.tumor_purity) {
        rows.push({
            label: 'Tumor purity',
            labelTip: 'Estimated fraction of tumor cells in this sample',
            value: `${sample.tumor_purity}%`,
        });
    }
    if (sample.tmb_score) {
        rows.push({
            label: 'TMB',
            labelTip:
                'Tumor mutational burden — click to view mutations in cBioPortal',
            value: `${sample.tmb_score} mut/Mb`,
            href: sampleUrl,
        });
    }
    if (sample.msi_type) {
        rows.push({
            label: 'MSI',
            labelTip: 'Microsatellite instability status',
            value: sample.msi_type,
        });
    }
    if (
        sample.metastatic_site &&
        sample.metastatic_site.toLowerCase() !== 'not applicable'
    ) {
        rows.push({ label: 'Metastatic site', value: sample.metastatic_site });
    }

    const frozenRows = freezeMetaRows(rows);
    seqRowsCache.set(sample, { rows: frozenRows, signature });
    return frozenRows;
}
