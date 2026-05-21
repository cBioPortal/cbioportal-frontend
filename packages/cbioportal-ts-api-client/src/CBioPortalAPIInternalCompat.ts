/**
 * Non-generated compatibility wrapper for CBioPortalAPIInternal.
 *
 * The staging API swagger docs produce incorrect return type annotations
 * (ResponseEntity wrappers instead of direct arrays) and rename some
 * operations (fetchCNAGenesUsingPOST → fetchCnaGenesUsingPOST).
 * At runtime the server still returns the correct types.
 *
 * For each affected method, a @ts-ignore suppresses the TS2416 covariance
 * error that TypeScript raises when narrowing the return type from the
 * incorrect base class annotation, and the implementation uses `any` so
 * it satisfies the TypeScript assignability check.
 */
import CBioPortalAPIInternalGenerated from './generated/CBioPortalAPIInternal';
import type {
    AlterationCountByGene,
    ClinicalDataBin,
    ClinicalDataCountItem,
    CoExpression,
    CoExpressionFilter,
    CopyNumberCountByGene,
    GenomicDataCountFilter,
    GenomicDataCountItem,
    SampleDTO,
    StudyViewFilter,
} from './generated/CBioPortalAPIInternal';

export default class CBioPortalAPIInternal extends CBioPortalAPIInternalGenerated {
    /** Alias for the renamed fetchCnaGenesUsingPOST method */
    fetchCNAGenesUsingPOST(
        parameters: Parameters<CBioPortalAPIInternalGenerated['fetchCnaGenesUsingPOST']>[0]
    ): Promise<Array<CopyNumberCountByGene>> {
        return this.fetchCnaGenesUsingPOST(parameters) as any;
    }

    /** @ts-ignore */
    fetchClinicalDataBinCountsUsingPOST(parameters: Parameters<CBioPortalAPIInternalGenerated['fetchClinicalDataBinCountsUsingPOST']>[0]): Promise<Array<ClinicalDataBin>> {
        return super.fetchClinicalDataBinCountsUsingPOST(parameters) as any;
    }

    /** @ts-ignore */
    fetchClinicalDataCountsUsingPOST(parameters: Parameters<CBioPortalAPIInternalGenerated['fetchClinicalDataCountsUsingPOST']>[0]): Promise<Array<ClinicalDataCountItem>> {
        return super.fetchClinicalDataCountsUsingPOST(parameters) as any;
    }

    /** @ts-ignore */
    fetchFilteredSamplesUsingPOST(parameters: Parameters<CBioPortalAPIInternalGenerated['fetchFilteredSamplesUsingPOST']>[0]): Promise<Array<SampleDTO>> {
        return super.fetchFilteredSamplesUsingPOST(parameters) as any;
    }

    /** @ts-ignore */
    fetchCoExpressionsUsingPOST(parameters: { molecularProfileIdA: string; molecularProfileIdB: string; threshold?: number; coExpressionFilter: CoExpressionFilter; $queryParameters?: any; $domain?: string; }): Promise<Array<CoExpression>> {
        return super.fetchCoExpressionsUsingPOST(parameters as any) as any;
    }

    /** @ts-ignore */
    fetchMutatedGenesUsingPOST(parameters: { studyViewFilter?: StudyViewFilter; $queryParameters?: any; $domain?: string; }): Promise<Array<AlterationCountByGene>> {
        return super.fetchMutatedGenesUsingPOST(parameters as any) as any;
    }

    /** @ts-ignore */
    fetchMutationDataCountsUsingPOST(parameters: { projection?: 'ID' | 'SUMMARY' | 'DETAILED' | 'META'; includeSampleIds?: boolean; genomicDataCountFilter?: GenomicDataCountFilter; $queryParameters?: any; $domain?: string; }): Promise<Array<GenomicDataCountItem>> {
        return super.fetchMutationDataCountsUsingPOST(parameters as any) as any;
    }
}
