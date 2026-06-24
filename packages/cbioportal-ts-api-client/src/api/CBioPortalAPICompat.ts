/**
 * Backward-compatible wrapper for CBioPortalAPI that normalizes changed endpoint responses.
 * Certain endpoints that were regenerated now return wrapper objects (e.g., { body: [...] })
 * instead of arrays. This class intercepts those calls and unwraps the responses to maintain
 * backward compatibility with existing app code.
 */

import CBioPortalAPI from '../generated/CBioPortalAPI';
import {
    CancerStudy,
    CancerStudyMetadata,
    Sample as LegacySample,
} from '../generated/CBioPortalAPI';
import { SampleDTO } from '../generated/CBioPortalAPIInternal';

type ListBodyResponse<T> = {
    body?: T[];
};

type BodyResponse<T> = {
    body?: T;
};

function unwrapArrayBody<T>(response: T[] | ListBodyResponse<T>): T[] {
    if (Array.isArray(response)) {
        return response;
    }
    return Array.isArray(response?.body) ? response.body : [];
}

function unwrapBody<T>(response: T | BodyResponse<T>): T {
    const withBody = response as BodyResponse<T>;
    if (withBody?.body === null) {
        throw new Error('Expected non-null response body from API wrapper.');
    }
    return withBody?.body !== undefined ? withBody.body : (response as T);
}

function normalizeStudy(study: CancerStudy | CancerStudyMetadata): CancerStudy {
    const normalized = { ...(study as any) };
    normalized.studyId = normalized.studyId || normalized.cancerStudyIdentifier;
    normalized.cancerType = normalized.cancerType || normalized.typeOfCancer;
    normalized.cancerTypeId =
        normalized.cancerTypeId || normalized.typeOfCancerId;
    if (normalized.readPermission === undefined) {
        normalized.readPermission = true;
    }
    return normalized as CancerStudy;
}

function toSampleDTO(sample: LegacySample | SampleDTO): SampleDTO {
    const s = sample as any;
    if (s.sampleId && s.studyId) {
        return s as SampleDTO;
    }
    return {
        copyNumberSegmentPresent: Boolean(s.copyNumberSegmentPresent),
        patientId:
            s.patientId !== undefined && s.patientId !== null
                ? String(s.patientId)
                : String(s.patientStableId || ''),
        sampleId: String(s.sampleId || s.stableId || ''),
        sampleType: s.sampleType,
        sequenced: Boolean(s.sequenced),
        studyId: String(s.studyId || s.cancerStudyIdentifier || ''),
        uniquePatientKey: String(s.uniquePatientKey || ''),
        uniqueSampleKey: String(s.uniqueSampleKey || ''),
    };
}

export default class CBioPortalAPICompat extends CBioPortalAPI {
    /**
     * Fetch all studies. Wraps the regenerated endpoint to normalize response shape
     * from ResponseEntityListCancerStudy to CancerStudy[].
     */
    // @ts-expect-error - allow return type change for compatibility
    async getAllStudiesUsingGET(
        parameters: Parameters<CBioPortalAPI['getAllStudiesUsingGET']>[0]
    ): Promise<CancerStudy[]> {
        const response = await (super.getAllStudiesUsingGET as any)(parameters);
        return unwrapArrayBody<CancerStudy | CancerStudyMetadata>(response).map(
            normalizeStudy
        );
    }

    async fetchStudiesUsingPOST(
        parameters: Parameters<CBioPortalAPI['fetchStudiesUsingPOST']>[0]
    ): Promise<CancerStudy[]> {
        const response = await (super.fetchStudiesUsingPOST as any)(parameters);
        return unwrapArrayBody<CancerStudy | CancerStudyMetadata>(response).map(
            normalizeStudy
        );
    }

    // @ts-expect-error - allow return type change for compatibility
    async getStudyUsingGET(
        parameters: Parameters<CBioPortalAPI['getStudyUsingGET']>[0]
    ): Promise<CancerStudy> {
        const response = await (super.getStudyUsingGET as any)(parameters);
        return normalizeStudy(
            unwrapBody<CancerStudy | CancerStudyMetadata>(response)
        );
    }

    /**
     * Fetch samples by filter. Wraps the regenerated endpoint to normalize response
     * from { body: SampleDTO[] } to SampleDTO[] and uses SampleDTO which has the
     * properties (sampleId, studyId) that the application code expects.
     */
    // @ts-expect-error - allow return type change for compatibility, also note this returns SampleDTO not Sample
    async fetchSamplesUsingPOST(
        parameters: Parameters<CBioPortalAPI['fetchSamplesUsingPOST']>[0]
    ): Promise<SampleDTO[]> {
        const response = await (super.fetchSamplesUsingPOST as any)(parameters);
        return unwrapArrayBody<LegacySample | SampleDTO>(response as any).map(
            toSampleDTO
        );
    }

    // @ts-expect-error - allow return type change for compatibility
    async getAllSamplesInStudyUsingGET(
        parameters: Parameters<CBioPortalAPI['getAllSamplesInStudyUsingGET']>[0]
    ): Promise<SampleDTO[]> {
        const response = await (super.getAllSamplesInStudyUsingGET as any)(
            parameters
        );
        return unwrapArrayBody<LegacySample | SampleDTO>(response as any).map(
            toSampleDTO
        );
    }

    // @ts-expect-error - allow return type change for compatibility
    async getAllSamplesOfPatientInStudyUsingGET(
        parameters: Parameters<
            CBioPortalAPI['getAllSamplesOfPatientInStudyUsingGET']
        >[0]
    ): Promise<SampleDTO[]> {
        const response = await (super
            .getAllSamplesOfPatientInStudyUsingGET as any)(parameters);
        return unwrapArrayBody<LegacySample | SampleDTO>(response as any).map(
            toSampleDTO
        );
    }

    // @ts-expect-error - allow return type change for compatibility
    async getSampleInStudyUsingGET(
        parameters: Parameters<CBioPortalAPI['getSampleInStudyUsingGET']>[0]
    ): Promise<SampleDTO> {
        const response = await (super.getSampleInStudyUsingGET as any)(
            parameters
        );
        return toSampleDTO(
            unwrapBody<LegacySample | SampleDTO>(response as any)
        );
    }
}
