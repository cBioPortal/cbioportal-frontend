import {AlterationTypeConstants} from '../../../pages/resultsView/ResultsViewPageStore';
import client from 'shared/api/cbioportalClientInstance';
import { GenericAssayMetaFilter, GenericAssayDataFilter, GenericAssayData, GenericAssayMeta } from 'shared/api/generated/CBioPortalAPI';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import _ from 'lodash';
import { IDataQueryFilter } from '../StoreUtils';

export const NOT_APPLICABLE_VALUE = "NA";

export async function fetchGenericAssayMetaByMolecularProfileIds(molecularProfiles: MolecularProfile[]) {
    const genericAssayProfiles = molecularProfiles.filter((profile) => {
        return profile.molecularAlterationType === AlterationTypeConstants.GENERIC_ASSAY;
    })

    const genericAssayProfilesGroupByGenericAssayType = _.groupBy(genericAssayProfiles, 'genericAssayType');
    const genericAssayTypes = _.keys(genericAssayProfilesGroupByGenericAssayType);
    
    const GenericAssayMetaGroupByGenericAssayType: { [genericAssayType: string]: GenericAssayMeta[] } = {};

    await Promise.all(genericAssayTypes.map( async (genericAssayType) => {
        const genericAssayProfiles = genericAssayProfilesGroupByGenericAssayType[genericAssayType];
        const genericAssayProfileIds = genericAssayProfiles.map(profile => profile.molecularProfileId);
        GenericAssayMetaGroupByGenericAssayType[genericAssayType] = await client.fetchGenericAssayMetaDataUsingPOST(
            {
                genericAssayMetaFilter: {
                    molecularProfileIds: genericAssayProfileIds
                    // the Swagger-generated type expected by the client method below
                    // incorrectly requires both molecularProfileIds and genericAssayStableIds;
                    // use 'as' to tell TypeScript that this object really does fit.
                } as GenericAssayMetaFilter
            }
        )     
    }));
    return GenericAssayMetaGroupByGenericAssayType;
}

export async function fetchGenericAssayMetaByEntityIds(entityIds: string[]) {
    let genericAssayMeta: GenericAssayMeta[] = [];
    if (entityIds.length > 0) {
        genericAssayMeta = await client.fetchGenericAssayMetaDataUsingPOST(
            {
                genericAssayMetaFilter: {
                    genericAssayStableIds: entityIds
                    // the Swagger-generated type expected by the client method below
                    // incorrectly requires both molecularProfileIds and genericAssayStableIds;
                    // use 'as' to tell TypeScript that this object really does fit.
                } as GenericAssayMetaFilter
            }
        )
    }
    return genericAssayMeta;
}

export async function fetchGenericAssayData(entityIdsByProfile: {[molecularProfileId: string]: string[]}, sampleFilterByProfile: {[molecularProfileId: string]: IDataQueryFilter}) {
    const params = Object.keys(entityIdsByProfile)
        .map(profileId => ({
            molecularProfileId: profileId,
            genericAssayDataFilter: {
                genericAssayStableIds: entityIdsByProfile[profileId],
                ...sampleFilterByProfile[profileId]
                // the Swagger-generated type expected by the client method below
                // incorrectly requires both samples and a sample list;
                // use 'as' to tell TypeScript that this object really does fit.
            } as GenericAssayDataFilter
        }
    ));
    const dataPromises = params.map(param => client.fetchGenericAssayDataInMolecularProfileUsingPOST(param));
    const results: GenericAssayData[][] = await Promise.all(dataPromises);
    return results;
}
