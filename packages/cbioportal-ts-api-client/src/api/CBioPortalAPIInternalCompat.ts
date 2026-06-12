/**
 * Backward-compatible wrapper for CBioPortalAPIInternal that normalizes changed endpoint responses.
 * Certain endpoints that were regenerated now return wrapper objects (e.g., ResponseEntityListSampleDTO)
 * instead of arrays. This class intercepts those calls and unwraps the responses to maintain
 * backward compatibility with existing app code.
 */

import CBioPortalAPIInternal from '../generated/CBioPortalAPIInternal';
import {
    AlterationCountByGene,
    ClinicalDataBin,
    ClinicalDataCountItem,
    CoExpression,
    CopyNumberCountByGene,
    GenomicDataCountItem,
    SampleDTO as Sample,
} from '../generated/CBioPortalAPIInternal';

type ListBodyResponse<T> = {
    body?: T[];
};

function unwrapArrayBody<T>(response: T[] | ListBodyResponse<T>): T[] {
    if (Array.isArray(response)) {
        return response;
    }
    return Array.isArray(response?.body) ? response.body : [];
}

export default class CBioPortalAPIInternalCompat extends CBioPortalAPIInternal {
    /**
     * Fetch filtered samples. Wraps the regenerated endpoint to normalize response
     * from ResponseEntityListSampleDTO to Sample[].
     */
    // @ts-ignore - allow return type change for compatibility
    async fetchFilteredSamplesUsingPOST(
        parameters: Parameters<
            CBioPortalAPIInternal['fetchFilteredSamplesUsingPOST']
        >[0]
    ): Promise<Sample[]> {
        const response = await (super.fetchFilteredSamplesUsingPOST as any)(
            parameters
        );
        return unwrapArrayBody<Sample>(response);
    }

    // @ts-ignore - allow return type change for compatibility
    async fetchClinicalDataCountsUsingPOST(
        parameters: Parameters<
            CBioPortalAPIInternal['fetchClinicalDataCountsUsingPOST']
        >[0]
    ): Promise<ClinicalDataCountItem[]> {
        const response = await (super.fetchClinicalDataCountsUsingPOST as any)(
            parameters
        );
        return unwrapArrayBody<ClinicalDataCountItem>(response as any);
    }

    // @ts-ignore - allow return type change for compatibility
    async fetchClinicalDataBinCountsUsingPOST(
        parameters: Parameters<
            CBioPortalAPIInternal['fetchClinicalDataBinCountsUsingPOST']
        >[0]
    ): Promise<ClinicalDataBin[]> {
        const response = await (super
            .fetchClinicalDataBinCountsUsingPOST as any)(parameters);
        return unwrapArrayBody<ClinicalDataBin>(response as any);
    }

    // @ts-ignore - allow return type change for compatibility
    async fetchMutatedGenesUsingPOST(
        parameters: Parameters<
            CBioPortalAPIInternal['fetchMutatedGenesUsingPOST']
        >[0]
    ): Promise<AlterationCountByGene[]> {
        const response = await (super.fetchMutatedGenesUsingPOST as any)(
            parameters
        );
        return unwrapArrayBody<AlterationCountByGene>(response as any);
    }

    // @ts-ignore - allow return type change for compatibility
    async fetchCnaGenesUsingPOST(
        parameters: Parameters<
            CBioPortalAPIInternal['fetchCnaGenesUsingPOST']
        >[0]
    ): Promise<CopyNumberCountByGene[]> {
        const response = await (super.fetchCnaGenesUsingPOST as any)(
            parameters
        );
        return unwrapArrayBody<CopyNumberCountByGene>(response as any);
    }

    // Backward-compatible method name retained in app code.
    async fetchCNAGenesUsingPOST(
        parameters: Parameters<
            CBioPortalAPIInternal['fetchCnaGenesUsingPOST']
        >[0]
    ): Promise<CopyNumberCountByGene[]> {
        return this.fetchCnaGenesUsingPOST(parameters);
    }

    // @ts-ignore - allow return type change for compatibility
    async fetchMutationDataCountsUsingPOST(
        parameters: Parameters<
            CBioPortalAPIInternal['fetchMutationDataCountsUsingPOST']
        >[0]
    ): Promise<GenomicDataCountItem[]> {
        const response = await (super.fetchMutationDataCountsUsingPOST as any)(
            parameters
        );
        return unwrapArrayBody<GenomicDataCountItem>(response as any);
    }

    // @ts-ignore - allow return type change for compatibility
    async fetchCoExpressionsUsingPOST(
        parameters: Parameters<
            CBioPortalAPIInternal['fetchCoExpressionsUsingPOST']
        >[0]
    ): Promise<CoExpression[]> {
        const response = await (super.fetchCoExpressionsUsingPOST as any)(
            parameters
        );
        return unwrapArrayBody<CoExpression>(response as any);
    }
}
