import { GenericAssayData, GenericAssayMeta } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { COMMON_GENERIC_ASSAY_PROPERTY } from './GenericAssayCommonUtils';
import {
    GenericAssayDerivedEntity,
    getGenericAssayCategories,
    getGenericAssayDerivedEntities,
} from './GenericAssayConfig';

// The category with the highest value; ties go to the earlier category.
// Undefined when no category has a value.
export function getDominantCategory(
    values: { [category: string]: number | undefined },
    categories: string[]
): string | undefined {
    let dominant: string | undefined = undefined;
    for (const category of categories) {
        const value = values[category];
        if (
            value !== undefined &&
            !isNaN(value) &&
            (dominant === undefined || value > values[dominant]!)
        ) {
            dominant = category;
        }
    }
    return dominant;
}

// Entity metadata for the derived entities of a generic assay type, so they
// can be listed and labelled like the profile's own entities.
export function makeDerivedGenericAssayMetas(
    genericAssayType: string | undefined
): GenericAssayMeta[] {
    return getGenericAssayDerivedEntities(genericAssayType).map(entity => ({
        entityType: 'GENERIC_ASSAY',
        stableId: entity.stableId,
        genericEntityMetaProperties: {
            [COMMON_GENERIC_ASSAY_PROPERTY.NAME]: entity.name,
            [COMMON_GENERIC_ASSAY_PROPERTY.DESCRIPTION]:
                entity.description || entity.name,
        },
    }));
}

export function getDerivedGenericAssayEntity(
    genericAssayType: string | undefined,
    stableId: string
): GenericAssayDerivedEntity | undefined {
    return getGenericAssayDerivedEntities(genericAssayType).find(
        e => e.stableId === stableId
    );
}

// Entities whose data a derived entity is computed from.
export function getDerivedGenericAssayEntitySources(
    genericAssayType: string | undefined
): string[] {
    return (getGenericAssayCategories(genericAssayType) || []).map(
        c => c.stableId
    );
}

// One value per sample, computed from the data of the source entities.
// Samples without source values are left out.
export function makeDerivedGenericAssayData(
    entity: GenericAssayDerivedEntity,
    genericAssayType: string | undefined,
    sourceData: Pick<
        GenericAssayData,
        'uniqueSampleKey' | 'stableId' | 'value'
    >[]
): { uniqueSampleKey: string; value: string }[] {
    switch (entity.derivation) {
        case 'dominantCategory':
            return makeDominantCategoryData(genericAssayType, sourceData);
    }
}

function makeDominantCategoryData(
    genericAssayType: string | undefined,
    sourceData: Pick<
        GenericAssayData,
        'uniqueSampleKey' | 'stableId' | 'value'
    >[]
): { uniqueSampleKey: string; value: string }[] {
    const categories = getGenericAssayCategories(genericAssayType) || [];
    const categoryIds = categories.map(c => c.stableId);
    const labelById = _.mapValues(_.keyBy(categories, 'stableId'), 'label');
    const ret: { uniqueSampleKey: string; value: string }[] = [];
    _.forEach(
        _.groupBy(sourceData, d => d.uniqueSampleKey),
        (sampleData, uniqueSampleKey) => {
            const values = _.mapValues(_.keyBy(sampleData, 'stableId'), d =>
                parseFloat(d.value)
            );
            const dominant = getDominantCategory(values, categoryIds);
            if (dominant) {
                ret.push({ uniqueSampleKey, value: labelById[dominant] });
            }
        }
    );
    return ret;
}
