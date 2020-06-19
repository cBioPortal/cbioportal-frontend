import {
    AlterationTypeConstants,
    GenericAssayTypeConstants,
} from '../../../pages/resultsView/ResultsViewPageStore';
import client from 'shared/api/cbioportalClientInstance';
import {
    GenericAssayMetaFilter,
    GenericAssayDataFilter,
    GenericAssayMeta,
    GenericAssayDataMultipleStudyFilter,
} from 'cbioportal-ts-api-client';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { IDataQueryFilter } from '../StoreUtils';

export const NOT_APPLICABLE_VALUE = 'NA';

export async function fetchGenericAssayMetaByMolecularProfileIdsGroupByGenericAssayType(
    molecularProfiles: MolecularProfile[]
) {
    const genericAssayProfiles = molecularProfiles.filter(profile => {
        return (
            profile.molecularAlterationType ===
            AlterationTypeConstants.GENERIC_ASSAY
        );
    });

    const genericAssayProfilesGroupByGenericAssayType = _.groupBy(
        genericAssayProfiles,
        'genericAssayType'
    );
    const genericAssayTypes = _.keys(
        genericAssayProfilesGroupByGenericAssayType
    );

    const genericAssayMetaGroupByGenericAssayType: {
        [genericAssayType: string]: GenericAssayMeta[];
    } = {};

    await Promise.all(
        genericAssayTypes.map(genericAssayType =>
            fetchGenericAssayMetaByProfileIds(
                _.map(
                    genericAssayProfilesGroupByGenericAssayType[
                        genericAssayType
                    ],
                    profile => profile.molecularProfileId
                )
            ).then(genericAssayMeta => {
                genericAssayMetaGroupByGenericAssayType[
                    genericAssayType
                ] = genericAssayMeta;
            })
        )
    );
    return genericAssayMetaGroupByGenericAssayType;
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
    const params = _.map(entityIdsByProfile, (entityIds, profileId) => {
        return {
            molecularProfileId: profileId,
            genericAssayDataFilter: {
                genericAssayStableIds: entityIds,
                ...sampleFilterByProfile[profileId],
                // the Swagger-generated type expected by the client method below
                // incorrectly requires both samples and a sample list;
                // use 'as' to tell TypeScript that this object really does fit.
            } as GenericAssayDataFilter,
        };
    });
    const dataPromises = params.map(param =>
        client.fetchGenericAssayDataInMolecularProfileUsingPOST(param)
    );
    const results = await Promise.all(dataPromises);
    return results;
}

export async function fetchGenericAssayDataByStableIdsAndMolecularIds(
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
