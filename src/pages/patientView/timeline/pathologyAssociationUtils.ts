import {
    MatchLevel,
    PatientHierarchy,
    Sample,
    Slide,
    SlideAssociation,
} from 'shared/components/wsiViewer/wsiViewerTypes';
import {
    getSlideTimepointDays,
    getSlideTimepointSource,
} from 'shared/components/wsiViewer/wsiNavUtils';

export type PathologySlideType = 'H&E' | 'IHC';

export type NormalizedSlideAssociation = SlideAssociation & {
    sample_id: string | null;
    match_level: MatchLevel;
    procedure_date_days: number | null;
    timepoint_source: string | null;
    stain_name: string | null;
    part_description: string | null;
    part_number: string | null;
    block_label: string | null;
    block_number: string | null;
};

type CachedNormalizedAssociations = {
    associationSnapshotSignature: string;
    samplesRef: PatientHierarchy['samples'];
    sampleIds: string[];
    samplePartsRefs: Array<Sample['parts']>;
    sampleSlideSignatures: string[];
    slideAssociationsRef: PatientHierarchy['slide_associations'];
    associations: NormalizedSlideAssociation[];
};

type CachedAssociationSnapshotEntry = {
    blockLabel: string;
    blockNumber: string;
    canServeTiles: boolean;
    imageId: string;
    matchLevel: string;
    partDescription: string;
    partNumber: string;
    procedureDateDays: number | string;
    sampleId: string;
    slideType: string;
    snapshot: string;
    specimenKey: string;
    stainName: string;
    timepointSource: string;
};

const normalizedAssociationsCache = new WeakMap<
    PatientHierarchy,
    CachedNormalizedAssociations
>();
const associationSnapshotCache = new WeakMap<object, CachedAssociationSnapshotEntry>();
const MATCH_LEVEL_PRIORITY: Record<MatchLevel, number> = {
    UNMATCHED: 0,
    PART: 1,
    BLOCK: 2,
};

function cloneNormalizedAssociations(
    associations: NormalizedSlideAssociation[]
): NormalizedSlideAssociation[] {
    const clonedAssociations = new Array<NormalizedSlideAssociation>(
        associations.length
    );
    for (let index = 0; index < associations.length; index += 1) {
        clonedAssociations[index] = { ...associations[index] };
    }
    return clonedAssociations;
}

function freezeNormalizedAssociations(
    associations: NormalizedSlideAssociation[]
): NormalizedSlideAssociation[] {
    for (let index = 0; index < associations.length; index += 1) {
        Object.freeze(associations[index]);
    }
    return Object.freeze(associations) as NormalizedSlideAssociation[];
}

function hierarchySampleSnapshotIsCurrent(
    hierarchy: PatientHierarchy,
    cached: CachedNormalizedAssociations | undefined
): cached is CachedNormalizedAssociations {
    if (
        !cached ||
        cached.samplesRef !== hierarchy.samples ||
        cached.sampleIds.length !== hierarchy.samples.length
    ) {
        return false;
    }

    for (let index = 0; index < hierarchy.samples.length; index += 1) {
        const sample = hierarchy.samples[index];
        if (
            cached.sampleIds[index] !== sample?.sample_id ||
            cached.samplePartsRefs[index] !== sample?.parts ||
            cached.sampleSlideSignatures[index] !==
                buildLegacySampleSlideSignature(sample)
        ) {
            return false;
        }
    }

    return true;
}

export function buildPathologyAssociationSnapshot(
    association: Pick<
        SlideAssociation,
        | 'image_id'
        | 'sample_id'
        | 'match_level'
        | 'specimen_key'
        | 'slide_type'
        | 'procedure_date_days'
        | 'timepoint_source'
        | 'stain_name'
        | 'part_description'
        | 'part_number'
        | 'block_label'
        | 'block_number'
        | 'can_serve_tiles'
    >
): string {
    const imageId = association.image_id || '';
    const sampleId = association.sample_id || '';
    const matchLevel = association.match_level || '';
    const specimenKey = association.specimen_key || '';
    const slideType = association.slide_type || '';
    const procedureDateDays = association.procedure_date_days ?? '';
    const timepointSource = association.timepoint_source || '';
    const stainName = association.stain_name || '';
    const partDescription = association.part_description || '';
    const partNumber = association.part_number || '';
    const blockLabel = association.block_label || '';
    const blockNumber = association.block_number || '';
    const canServeTiles = !!association.can_serve_tiles;
    const cached = associationSnapshotCache.get(association as object);

    if (
        cached &&
        cached.imageId === imageId &&
        cached.sampleId === sampleId &&
        cached.matchLevel === matchLevel &&
        cached.specimenKey === specimenKey &&
        cached.slideType === slideType &&
        cached.procedureDateDays === procedureDateDays &&
        cached.timepointSource === timepointSource &&
        cached.stainName === stainName &&
        cached.partDescription === partDescription &&
        cached.partNumber === partNumber &&
        cached.blockLabel === blockLabel &&
        cached.blockNumber === blockNumber &&
        cached.canServeTiles === canServeTiles
    ) {
        return cached.snapshot;
    }

    const snapshot = [
        imageId,
        sampleId,
        matchLevel,
        specimenKey,
        slideType,
        procedureDateDays,
        timepointSource,
        stainName,
        partDescription,
        partNumber,
        blockLabel,
        blockNumber,
        canServeTiles ? '1' : '0',
    ].join('::');

    associationSnapshotCache.set(association as object, {
        blockLabel,
        blockNumber,
        canServeTiles,
        imageId,
        matchLevel,
        partDescription,
        partNumber,
        procedureDateDays,
        sampleId,
        slideType,
        snapshot,
        specimenKey,
        stainName,
        timepointSource,
    });

    return snapshot;
}

function buildPathologyAssociationSnapshotSignature(
    associations: SlideAssociation[] | undefined
): string {
    if (!associations?.length) {
        return '';
    }
    const snapshots = new Array<string>(associations.length);
    for (let index = 0; index < associations.length; index += 1) {
        snapshots[index] = buildPathologyAssociationSnapshot(associations[index]);
    }
    snapshots.sort((left, right) => left.localeCompare(right));
    return snapshots.join('|');
}

function hierarchyAssociationSnapshotsAreCurrent(
    hierarchy: PatientHierarchy,
    cached: CachedNormalizedAssociations | undefined
): boolean {
    const associations = hierarchy.slide_associations;
    if (!associations?.length) {
        return true;
    }

    return !!(
        cached &&
        cached.slideAssociationsRef === associations &&
        cached.associationSnapshotSignature ===
            buildPathologyAssociationSnapshotSignature(associations)
    );
}

function slideTypeForSlide(slide: Slide): PathologySlideType {
    return slide.is_ihc ? 'IHC' : 'H&E';
}

function buildLegacySampleSlideSignature(sample: Sample | undefined): string {
    if (!sample) {
        return '';
    }

    const entries: string[] = [];
    for (let partIndex = 0; partIndex < sample.parts.length; partIndex += 1) {
        const part = sample.parts[partIndex];
        for (let blockIndex = 0; blockIndex < part.blocks.length; blockIndex += 1) {
            const block = part.blocks[blockIndex];
            for (let slideIndex = 0; slideIndex < block.slides.length; slideIndex += 1) {
                const slide = block.slides[slideIndex];
                entries.push(
                    [
                        sample.sample_id || '',
                        slide.image_id || '',
                        slide.stain_name || '',
                        slide.is_hne ? '1' : '0',
                        slide.is_ihc ? '1' : '0',
                        slide.can_serve_tiles ? '1' : '0',
                        slide.block_number || '',
                        slide.block_label || '',
                        slide.part_description || part.part_description || '',
                        slide.path_dx_title || part.path_dx_title || '',
                        slide.slide_timepoint_days ?? '',
                        slide.slide_timepoint_source || '',
                    ].join('::')
                );
            }
        }
    }

    return entries.sort((left, right) => left.localeCompare(right)).join('|');
}

function compareNormalizedAssociations(
    left: NormalizedSlideAssociation,
    right: NormalizedSlideAssociation
): number {
    const leftDate =
        left.procedure_date_days == null ? Number.POSITIVE_INFINITY : left.procedure_date_days;
    const rightDate =
        right.procedure_date_days == null
            ? Number.POSITIVE_INFINITY
            : right.procedure_date_days;

    return (
        leftDate - rightDate ||
        (left.sample_id || '').localeCompare(right.sample_id || '') ||
        MATCH_LEVEL_PRIORITY[right.match_level] -
            MATCH_LEVEL_PRIORITY[left.match_level] ||
        (left.specimen_key || '').localeCompare(right.specimen_key || '') ||
        (left.image_id || '').localeCompare(right.image_id || '') ||
        (left.slide_type || '').localeCompare(right.slide_type || '')
    );
}

function legacyAssociationsFromHierarchy(
    hierarchy: PatientHierarchy
): NormalizedSlideAssociation[] {
    const associations: NormalizedSlideAssociation[] = [];

    for (let sampleIndex = 0; sampleIndex < hierarchy.samples.length; sampleIndex += 1) {
        const sample = hierarchy.samples[sampleIndex];
        for (let partIndex = 0; partIndex < sample.parts.length; partIndex += 1) {
            const part = sample.parts[partIndex];
            for (let blockIndex = 0; blockIndex < part.blocks.length; blockIndex += 1) {
                const block = part.blocks[blockIndex];
                for (let slideIndex = 0; slideIndex < block.slides.length; slideIndex += 1) {
                    const slide = block.slides[slideIndex];
                    if (!slide.image_id) {
                        continue;
                    }
                    associations.push({
                        image_id: slide.image_id,
                        sample_id: sample.sample_id,
                        match_level: 'BLOCK',
                        specimen_key: `legacy::${
                            sample.sample_id
                        }::${part.part_number ?? '?'}::${block.block_number ||
                            '?'}`,
                        part_number:
                            part.part_number != null
                                ? String(part.part_number)
                                : null,
                        part_description:
                            slide.part_description ||
                            part.part_description ||
                            null,
                        block_number:
                            slide.block_number || block.block_number || null,
                        block_label:
                            slide.block_label || block.block_label || null,
                        slide_type: slideTypeForSlide(slide),
                        stain_name: slide.stain_name || null,
                        procedure_date_days:
                            getSlideTimepointDays(slide, sample) ?? null,
                        timepoint_source:
                            getSlideTimepointSource(slide, sample) ?? null,
                        can_serve_tiles: !!slide.can_serve_tiles,
                    });
                }
            }
        }
    }

    return associations;
}

export function getPathologySlideAssociationsReadOnly(
    hierarchy: PatientHierarchy
): NormalizedSlideAssociation[] {
    const cached = normalizedAssociationsCache.get(hierarchy);
    if (
        cached &&
        hierarchySampleSnapshotIsCurrent(hierarchy, cached) &&
        hierarchyAssociationSnapshotsAreCurrent(hierarchy, cached)
    ) {
        return cached.associations;
    }

    const explicitAssociations = hierarchy.slide_associations;
    const hasExplicitAssociations = !!explicitAssociations?.length;
    const source = hasExplicitAssociations
        ? explicitAssociations
        : legacyAssociationsFromHierarchy(hierarchy);

    const deduped = new Map<string, NormalizedSlideAssociation>();
    const associationSnapshots = hasExplicitAssociations
        ? new Array<string>(source.length)
        : undefined;
    for (let index = 0; index < source.length; index += 1) {
        const association = source[index];
        const normalizedAssociation: NormalizedSlideAssociation = {
            ...association,
            sample_id: association.sample_id || null,
            match_level: association.match_level || 'UNMATCHED',
            specimen_key: association.specimen_key,
            procedure_date_days:
                association.procedure_date_days != null &&
                Number.isFinite(Number(association.procedure_date_days))
                    ? Number(association.procedure_date_days)
                    : null,
            timepoint_source: association.timepoint_source || null,
            stain_name: association.stain_name || null,
            part_description: association.part_description || null,
            part_number: association.part_number || null,
            block_label: association.block_label || null,
            block_number: association.block_number || null,
            slide_type: association.slide_type || 'H&E',
            can_serve_tiles: !!association.can_serve_tiles,
        };
        const dedupeKey = buildPathologyAssociationSnapshot(normalizedAssociation);
        if (associationSnapshots) {
            associationSnapshots[index] = dedupeKey;
        }
        if (!deduped.has(dedupeKey)) {
            deduped.set(dedupeKey, normalizedAssociation);
        }
    }
    const associationsArray = new Array<NormalizedSlideAssociation>(deduped.size);
    const dedupedValues = deduped.values();
    let currentValue = dedupedValues.next();
    let dedupedIndex = 0;
    while (!currentValue.done) {
        associationsArray[dedupedIndex] = currentValue.value;
        dedupedIndex += 1;
        currentValue = dedupedValues.next();
    }
    associationsArray.sort(compareNormalizedAssociations);
    const associations = freezeNormalizedAssociations(associationsArray);

    const sampleIds = new Array<string>(hierarchy.samples.length);
    const samplePartsRefs = new Array<Array<Sample['parts'][number]>>(
        hierarchy.samples.length
    );
    const sampleSlideSignatures = new Array<string>(hierarchy.samples.length);
    for (let index = 0; index < hierarchy.samples.length; index += 1) {
        const sample = hierarchy.samples[index];
        sampleIds[index] = sample.sample_id || '';
        samplePartsRefs[index] = sample.parts;
        sampleSlideSignatures[index] = buildLegacySampleSlideSignature(sample);
    }

    normalizedAssociationsCache.set(hierarchy, {
        associationSnapshotSignature: associationSnapshots
            ? associationSnapshots.sort((left, right) =>
                  left.localeCompare(right)
              ).join('|')
            : '',
        samplesRef: hierarchy.samples,
        sampleIds,
        samplePartsRefs,
        sampleSlideSignatures,
        slideAssociationsRef: hierarchy.slide_associations,
        associations,
    });

    return associations;
}

export function formatMatchLevel(matchLevel: MatchLevel): string {
    if (matchLevel === 'UNMATCHED') {
        return 'Unmatched';
    }
    return matchLevel;
}

export function matchesPathologySlideType(
    association: Pick<NormalizedSlideAssociation, 'slide_type'>,
    slideType: PathologySlideType
): boolean {
    return association.slide_type === slideType;
}
