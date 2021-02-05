import { AlterationTypeConstants } from '../../../pages/resultsView/ResultsViewPageStore';
import client from 'shared/api/cbioportalClientInstance';
import {
    GenericAssayMetaFilter,
    GenericAssayMeta,
    GenericAssayDataMultipleStudyFilter,
    GenericAssayFilter,
} from 'cbioportal-ts-api-client';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { IDataQueryFilter } from '../StoreUtils';

export const NOT_APPLICABLE_VALUE = 'NA';
export const COMMON_GENERIC_ASSAY_PROPERTY = {
    NAME: 'NAME',
    DESCRIPTION: 'DESCRIPTION',
    URL: 'URL',
};

export const GenericAssayTypeConstants: { [s: string]: string } = {
    TREATMENT_RESPONSE: 'TREATMENT_RESPONSE',
    MUTATIONAL_SIGNATURE: 'MUTATIONAL_SIGNATURE',
};

export enum GenericAssayDataType {
    LIMIT_VALUE = 'LIMIT-VALUE',
    CATEGORICAL = 'CATEGORICAL',
    BINARY = 'BINARY',
}

export async function fetchGenericAssayMetaByMolecularProfileIdsGroupedByGenericAssayType(
    molecularProfiles: MolecularProfile[]
) {
    const genericAssayProfiles = molecularProfiles.filter(profile => {
        return (
            profile.molecularAlterationType ===
            AlterationTypeConstants.GENERIC_ASSAY
        );
    });

    const genericAssayProfilesGroupedByGenericAssayType = _.groupBy(
        genericAssayProfiles,
        'genericAssayType'
    );
    const genericAssayTypes = _.keys(
        genericAssayProfilesGroupedByGenericAssayType
    );

    const genericAssayMetaGroupedByGenericAssayType: {
        [genericAssayType: string]: GenericAssayMeta[];
    } = {};

    await Promise.all(
        genericAssayTypes.map(genericAssayType =>
            fetchGenericAssayMetaByProfileIds(
                _.map(
                    genericAssayProfilesGroupedByGenericAssayType[
                        genericAssayType
                    ],
                    profile => profile.molecularProfileId
                )
            ).then(genericAssayMeta => {
                genericAssayMetaGroupedByGenericAssayType[
                    genericAssayType
                ] = genericAssayMeta;
            })
        )
    );
    return genericAssayMetaGroupedByGenericAssayType;
}

export async function fetchGenericAssayMetaByMolecularProfileIdsGroupByMolecularProfileId(
    molecularProfiles: MolecularProfile[]
) {
    const genericAssayProfiles = molecularProfiles.filter(profile => {
        return (
            profile.molecularAlterationType ===
            AlterationTypeConstants.GENERIC_ASSAY
        );
    });

    const genericAssayMetaGroupByMolecularProfileId: {
        [molecularProfileId: string]: GenericAssayMeta[];
    } = {};

    await Promise.all(
        genericAssayProfiles.map(profile =>
            fetchGenericAssayMetaByProfileIds([
                profile.molecularProfileId,
            ]).then(genericAssayMeta => {
                genericAssayMetaGroupByMolecularProfileId[
                    profile.molecularProfileId
                ] = genericAssayMeta;
            })
        )
    );
    return genericAssayMetaGroupByMolecularProfileId;
}

export function fetchGenericAssayMetaByProfileIds(
    genericAssayProfileIds: string[]
) {
    if (genericAssayProfileIds.length > 0) {
        return client.fetchGenericAssayMetaDataUsingPOST({
            genericAssayMetaFilter: {
                molecularProfileIds: genericAssayProfileIds,
                // the Swagger-generated type expected by the client method below
                // incorrectly requires both molecularProfileIds and genericAssayStableIds;
                // use 'as' to tell TypeScript that this object really does fit.
            } as GenericAssayMetaFilter,
        });
    }
    return Promise.resolve([]);
}

export function fetchGenericAssayMetaByEntityIds(entityIds: string[]) {
    if (entityIds.length > 0) {
        return client.fetchGenericAssayMetaDataUsingPOST({
            genericAssayMetaFilter: {
                genericAssayStableIds: entityIds,
                // the Swagger-generated type expected by the client method below
                // incorrectly requires both molecularProfileIds and genericAssayStableIds;
                // use 'as' to tell TypeScript that this object really does fit.
            } as GenericAssayMetaFilter,
        });
    }
    return Promise.resolve([]);
}

export async function fetchGenericAssayData(
    entityIdsByProfile: { [molecularProfileId: string]: string[] },
    sampleFilterByProfile: { [molecularProfileId: string]: IDataQueryFilter }
) {
    const params: {
        molecularProfileId: string;
        genericAssayDataFilter: GenericAssayFilter;
    }[] = _.map(entityIdsByProfile, (entityIds, profileId) => {
        return {
            molecularProfileId: profileId,
            genericAssayDataFilter: {
                genericAssayStableIds: entityIds,
                ...sampleFilterByProfile[profileId],
                // the Swagger-generated type expected by the client method below
                // incorrectly requires both samples and a sample list;
                // use 'as' to tell TypeScript that this object really does fit.
            } as GenericAssayFilter,
        };
    });
    const dataPromises = params.map(param => {
        // do not request data by using empty sample list
        if (
            _.isEmpty(param.genericAssayDataFilter.sampleIds) &&
            !param.genericAssayDataFilter.sampleListId
        ) {
            return Promise.resolve([]);
        } else {
            return client.fetchGenericAssayDataInMolecularProfileUsingPOST(
                param
            );
        }
    });
    const results = await Promise.all(dataPromises);
    return results;
}

export function fetchGenericAssayDataByStableIdsAndMolecularIds(
    stableIds: string[],
    molecularProfileIds: string[]
) {
    return client.fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST({
        genericAssayDataMultipleStudyFilter: {
            genericAssayStableIds: stableIds,
            molecularProfileIds: molecularProfileIds,
        } as GenericAssayDataMultipleStudyFilter,
    });
}

export function makeGenericAssayOption(
    meta: GenericAssayMeta,
    isPlotsTabOption?: boolean
) {
    // Note: name and desc are optional fields for generic assay entities
    // When not provided in the data file, these fields are assigned the
    // value of the entity_stable_id. The code below hides fields when
    // indentical to the entity_stable_id.
    const name = getGenericAssayMetaPropertyOrDefault(
        meta,
        COMMON_GENERIC_ASSAY_PROPERTY.NAME
    );
    const description = getGenericAssayMetaPropertyOrDefault(
        meta,
        COMMON_GENERIC_ASSAY_PROPERTY.DESCRIPTION
    );
    const uniqueName = name !== meta.stableId;
    const uniqueDesc = description !== meta.stableId && description !== name;
    // set stableId as default label
    let label = meta.stableId;
    if (!uniqueName && !uniqueDesc) {
        label = meta.stableId;
    } else if (!uniqueName) {
        label = `${meta.stableId}: ${description}`;
    } else if (!uniqueDesc) {
        label = `${name} (${meta.stableId})`;
    } else {
        label = `${name} (${meta.stableId}): ${description}`;
    }

    if (isPlotsTabOption) {
        return {
            value: meta.stableId,
            label: label,
            plotAxisLabel: getGenericAssayMetaPropertyOrDefault(
                meta,
                COMMON_GENERIC_ASSAY_PROPERTY.NAME,
                meta.stableId
            ),
        };
    }
    return {
        value: meta.stableId,
        label: label,
    };
}

export function getGenericAssayMetaPropertyOrDefault(
    meta: GenericAssayMeta,
    property: string,
    defaultValue: string = NOT_APPLICABLE_VALUE
): string {
    if (property in meta.genericEntityMetaProperties) {
        return (meta.genericEntityMetaProperties as {
            [property: string]: string;
        })[property];
    } else {
        return defaultValue;
    }
}
