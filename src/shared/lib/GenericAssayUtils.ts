import client from 'shared/api/cbioportalClientInstance';
import { GenericAssayTypeConstants } from 'pages/resultsView/ResultsViewPageStore';
import { GenericAssayMeta, GenericAssayMetaFilter, GenericAssayDataFilter, GenericAssayData } from 'shared/api/generated/CBioPortalAPI';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import _ from 'lodash';
import { IDataQueryFilter } from './StoreUtils';

// Define Treatment and TreatmentMolecularData type
export type Treatment = {
    'description': string;
    'name': string;
    'refLink': string;
    'treatmentId': string;
}

export type TreatmentMolecularData = {
    'geneticProfileId': string;
    'patientId': string;
    'sampleId': string;
    'stableId': string;
    'studyId': string;
    'treatmentId': string;
    'uniquePatientKey': string;
    'uniqueSampleKey': string;
    'value': string;
}

export async function fetchTreatmentByMolecularProfileIds(molecularProfiles: MolecularProfile[]) {
    const treatmentResponseProfiles = molecularProfiles.filter((profile) => {
        return profile.genericAssayType === GenericAssayTypeConstants.TREATMENT_RESPONSE;
    })
    const treatmentResponseProfileIds = treatmentResponseProfiles.map(profile => profile.molecularProfileId);
    const treatmentsMeta = await client.fetchGenericAssayMetaDataUsingPOST(
        {
            genericAssayMetaFilter: {
                molecularProfileIds: treatmentResponseProfileIds
                // the Swagger-generated type expected by the client method below
                // incorrectly requires both molecularProfileIds and genericAssayStableIds;
                // use 'as' to tell TypeScript that this object really does fit.
            } as GenericAssayMetaFilter
        }
    )
    const treatments: Treatment[] = _.map(treatmentsMeta, (meta) => {
        return {
            treatmentId: meta.stableId,
            name: "NAME" in meta.genericEntityMetaProperties ? meta.genericEntityMetaProperties["NAME"] : "NA",
            description: "DESCRIPTION" in meta.genericEntityMetaProperties ? meta.genericEntityMetaProperties["DESCRIPTION"] : "NA",
            refLink: "URL" in meta.genericEntityMetaProperties ? meta.genericEntityMetaProperties["URL"] : "NA",
        }
    })
    return treatments;
}

export async function fetchTreatmentByTreatmentIds(treatmentIds: string[]) {
    const treatmentsMeta = await client.fetchGenericAssayMetaDataUsingPOST(
        {
            genericAssayMetaFilter: {
                genericAssayStableIds: treatmentIds
                // the Swagger-generated type expected by the client method below
                // incorrectly requires both molecularProfileIds and genericAssayStableIds;
                // use 'as' to tell TypeScript that this object really does fit.
            } as GenericAssayMetaFilter
        }
    )
    const treatments: Treatment[] = _.map(treatmentsMeta, (meta) => {
        return {
            treatmentId: meta.stableId,
            name: "NAME" in meta.genericEntityMetaProperties ? meta.genericEntityMetaProperties["NAME"] : "NA",
            description: "DESCRIPTION" in meta.genericEntityMetaProperties ? meta.genericEntityMetaProperties["DESCRIPTION"] : "NA",
            refLink: "URL" in meta.genericEntityMetaProperties ? meta.genericEntityMetaProperties["URL"] : "NA",
        }
    })
    return treatments;
}

export async function fetchTreatmentData(treatmentIdsByProfile: {[molecularProfileId: string]: string[]}, sampleFilterByProfile: {[molecularProfileId: string]: IDataQueryFilter}) {
    const params = Object.keys(treatmentIdsByProfile)
        .map(profileId => ({
            molecularProfileId: profileId,
            genericAssayDataFilter: {
                genericAssayStableIds: treatmentIdsByProfile[profileId],
                ...sampleFilterByProfile[profileId]
                // the Swagger-generated type expected by the client method below
                // incorrectly requires both samples and a sample list;
                // use 'as' to tell TypeScript that this object really does fit.
            } as GenericAssayDataFilter
        }
    ));
    const dataPromises = params.map(param => client.fetchGenericAssayDataInMolecularProfileUsingPOST(param));
    const results = await Promise.all(dataPromises);
    const treatmentDataResult: TreatmentMolecularData[][] = _.map(results, (result: GenericAssayData[]) => {
        return _.map(result, (item: GenericAssayData) => {
            return {
                geneticProfileId: item.molecularProfileId,
                patientId: item.patientId,
                sampleId: item.sampleId,
                stableId: item.stableId,
                studyId: item.studyId,
                treatmentId: item.genericAssayStableId,
                uniquePatientKey: item.uniquePatientKey,
                uniqueSampleKey: item.uniqueSampleKey,
                value: item.value
            }
        })
    })
    return treatmentDataResult;
}