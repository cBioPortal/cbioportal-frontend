/**
 * Non-generated compatibility wrapper for CBioPortalAPI.
 *
 * The staging API swagger docs produce incorrect return type annotations
 * (ResponseEntity wrappers instead of direct types, CancerStudyMetadata
 * instead of CancerStudy, MutationDTO instead of Mutation) and change the
 * clinicalDataType enum to lowercase and the Sample type to a richer entity
 * type incompatible with the lightweight type the frontend expects.
 * At runtime the server still returns the correct types.
 *
 * For each affected method, a @ts-ignore suppresses the TS2416 covariance
 * error that TypeScript raises when narrowing the return type from the
 * incorrect base class annotation, and the implementation uses `any` so
 * it satisfies the TypeScript assignability check.
 */
import CBioPortalAPIGenerated from './generated/CBioPortalAPI';
import type {
    CancerStudy,
    ClinicalData,
    ClinicalDataMultiStudyFilter,
    Mutation,
} from './generated/CBioPortalAPI';
import type { SampleDTO as Sample } from './generated/CBioPortalAPIInternal';

export default class CBioPortalAPI extends CBioPortalAPIGenerated {
    // --- Studies (wrong response type: CancerStudyMetadata instead of CancerStudy) ---

    /** @ts-ignore */
    getAllStudiesUsingGET(parameters: Parameters<CBioPortalAPIGenerated['getAllStudiesUsingGET']>[0]): Promise<Array<CancerStudy>> {
        return super.getAllStudiesUsingGET(parameters) as any;
    }

    /** @ts-ignore */
    getStudyUsingGET(parameters: Parameters<CBioPortalAPIGenerated['getStudyUsingGET']>[0]): Promise<CancerStudy> {
        return super.getStudyUsingGET(parameters) as any;
    }

    // --- Mutations (wrong response type: MutationDTO instead of Mutation) ---

    /** @ts-ignore */
    fetchMutationsInMultipleMolecularProfilesUsingPOST(parameters: Parameters<CBioPortalAPIGenerated['fetchMutationsInMultipleMolecularProfilesUsingPOST']>[0]): Promise<Array<Mutation>> {
        return super.fetchMutationsInMultipleMolecularProfilesUsingPOST(parameters) as any;
    }

    // --- Samples (wrong Sample type: rich entity instead of lightweight DTO) ---

    /** @ts-ignore */
    getAllSamplesInStudyUsingGET(parameters: Parameters<CBioPortalAPIGenerated['getAllSamplesInStudyUsingGET']>[0]): Promise<Array<Sample>> {
        return super.getAllSamplesInStudyUsingGET(parameters) as any;
    }

    /** @ts-ignore */
    getAllSamplesOfPatientInStudyUsingGET(parameters: Parameters<CBioPortalAPIGenerated['getAllSamplesOfPatientInStudyUsingGET']>[0]): Promise<Array<Sample>> {
        return super.getAllSamplesOfPatientInStudyUsingGET(parameters) as any;
    }

    /** @ts-ignore */
    getSampleInStudyUsingGET(parameters: Parameters<CBioPortalAPIGenerated['getSampleInStudyUsingGET']>[0]): Promise<Sample> {
        return super.getSampleInStudyUsingGET(parameters) as any;
    }

    /** @ts-ignore */
    fetchSamplesUsingPOST(parameters: Parameters<CBioPortalAPIGenerated['fetchSamplesUsingPOST']>[0]): Promise<Array<Sample>> {
        return super.fetchSamplesUsingPOST(parameters) as any;
    }

    /** @ts-ignore */
    getSamplesByKeywordUsingGET(parameters: Parameters<CBioPortalAPIGenerated['getSamplesByKeywordUsingGET']>[0]): Promise<Array<Sample>> {
        return super.getSamplesByKeywordUsingGET(parameters) as any;
    }

    // --- Clinical data (wrong clinicalDataType enum: lowercase instead of uppercase) ---

    /** @ts-ignore */
    fetchClinicalDataUsingPOSTWithHttpInfo(parameters: { clinicalDataType?: 'SAMPLE' | 'PATIENT' | 'sample' | 'patient'; projection?: 'ID' | 'SUMMARY' | 'DETAILED' | 'META'; clinicalDataMultiStudyFilter?: ClinicalDataMultiStudyFilter; $queryParameters?: any; $domain?: string; }): Promise<request.Response> {
        return super.fetchClinicalDataUsingPOSTWithHttpInfo(parameters as any) as any;
    }

    /** @ts-ignore */
    fetchClinicalDataUsingPOST(parameters: { clinicalDataType?: 'SAMPLE' | 'PATIENT' | 'sample' | 'patient'; projection?: 'ID' | 'SUMMARY' | 'DETAILED' | 'META'; clinicalDataMultiStudyFilter?: ClinicalDataMultiStudyFilter; $queryParameters?: any; $domain?: string; }): Promise<Array<ClinicalData>> {
        return super.fetchClinicalDataUsingPOST(parameters as any) as any;
    }
}
