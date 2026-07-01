import { MetaRow } from './wsiMetaSidebar';
import { Sample, Slide, TileMetadata } from './wsiViewerTypes';
import {
    barcodeAccession,
    cleanStain,
    fmtMB,
    normalizeBlockLabel,
    sampleTimepointText,
} from './wsiNavUtils';

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
    is_hne?: boolean;
    is_ihc?: boolean;
}): 'hne' | 'ihc' | 'other' {
    return slide.is_hne ? 'hne' : slide.is_ihc ? 'ihc' : 'other';
}

export function getStainBadge(slide: {
    is_hne?: boolean;
    is_ihc?: boolean;
}): string {
    return slide.is_hne ? 'H&E' : slide.is_ihc ? 'IHC' : '';
}

export function getStainDotColor(
    slide: { is_hne?: boolean; is_ihc?: boolean },
    colors: { blue: string; orange: string }
): string {
    return slide.is_hne ? colors.blue : slide.is_ihc ? colors.orange : '#aaa';
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

    const techParts: string[] = [];
    if (mpp) techParts.push(`MPP: ${mpp.toFixed(4)} µm/px`);
    if (objNum) techParts.push(`Objective: ${objNum}×`);
    techParts.push(`Zoom levels: ${meta.max_zoom + 1}`);
    techParts.push(`Tile size: ${meta.tile_size} px`);
    const dimTip = techParts.join('\n');

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
    return rows;
}

export function buildPathRows(
    slide: Slide,
    sample: Sample,
    patientId?: string,
    studyId?: string
): MetaRow[] {
    const stainBadge = getStainBadge(slide);
    const oncotreeUrl = sample.oncotree_code
        ? 'https://oncotree.mskcc.org/'
        : undefined;
    const patientUrl =
        studyId && sample.sample_id
            ? buildPatientUrl(studyId, sample.sample_id, patientId)
            : undefined;
    const sampleUrl =
        studyId && sample.sample_id
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
    const sampleTipParts: string[] = [];
    if (accession) sampleTipParts.push(`Accession: ${accession}`);
    if (blockLbl) sampleTipParts.push(`Block: ${blockLbl}`);
    if (sample.sample_type) sampleTipParts.push(`Type: ${sample.sample_type}`);
    const sampleTip = sampleTipParts.length
        ? sampleTipParts.join('\n')
        : undefined;

    const pathDxTitle = slide.path_dx_title
        ? slide.path_dx_title.charAt(0).toUpperCase() +
          slide.path_dx_title.slice(1).toLowerCase()
        : null;
    const partDesc = slide.part_description || null;
    const timepoint = sampleTimepointText(sample);

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
            value: getPatientId(sample.sample_id, patientId) || '—',
            href: patientUrl,
        },
        {
            label: 'Sample',
            labelTip: sampleTip
                ? 'Click for cBioPortal sample view — hover for accession/block info'
                : 'Tumor sample identifier',
            value: sample.sample_id || '—',
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
            labelTip:
                'Proxy slide timing from the matched IMPACT sample timeline, preferring sample acquisition and falling back to sequencing',
            value: timepoint,
            valueTip: sample.sample_timepoint_source
                ? `${sample.sample_timepoint_source} relative to diagnosis`
                : undefined,
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
    return rows;
}

export function buildSeqRows(sample: Sample, sampleUrl?: string): MetaRow[] {
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
    return rows;
}
