import {
    MatchLevel,
    PatientHierarchy,
    SlideAssociation,
} from 'shared/components/wsiViewer/wsiViewerTypes';

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
const associationSnapshotCache = new WeakMap<
    object,
    CachedAssociationSnapshotEntry
>();
const MATCH_LEVEL_PRIORITY: Record<MatchLevel, number> = {
    UNMATCHED: 0,
    PART: 1,
    BLOCK: 2,
};

function freezeNormalizedAssociations(
    associations: NormalizedSlideAssociation[]
): NormalizedSlideAssociation[] {
    for (let index = 0; index < associations.length; index += 1) {
        Object.freeze(associations[index]);
    }
    return Object.freeze(associations) as NormalizedSlideAssociation[];
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
        snapshots[index] = buildPathologyAssociationSnapshot(
            associations[index]
        );
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

function compareNormalizedAssociations(
    left: NormalizedSlideAssociation,
    right: NormalizedSlideAssociation
): number {
    const leftDate =
        left.procedure_date_days == null
            ? Number.POSITIVE_INFINITY
            : left.procedure_date_days;
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

export function getPathologySlideAssociationsReadOnly(
    hierarchy: PatientHierarchy
): NormalizedSlideAssociation[] {
    const cached = normalizedAssociationsCache.get(hierarchy);
    if (cached && hierarchyAssociationSnapshotsAreCurrent(hierarchy, cached)) {
        return cached.associations;
    }

    const explicitAssociations = hierarchy.slide_associations;
    const hasExplicitAssociations = !!explicitAssociations?.length;
    const source = explicitAssociations || [];

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
        const dedupeKey = buildPathologyAssociationSnapshot(
            normalizedAssociation
        );
        if (associationSnapshots) {
            associationSnapshots[index] = dedupeKey;
        }
        if (!deduped.has(dedupeKey)) {
            deduped.set(dedupeKey, normalizedAssociation);
        }
    }
    const associationsArray = new Array<NormalizedSlideAssociation>(
        deduped.size
    );
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

    normalizedAssociationsCache.set(hierarchy, {
        associationSnapshotSignature: associationSnapshots
            ? associationSnapshots
                  .sort((left, right) => left.localeCompare(right))
                  .join('|')
            : '',
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
