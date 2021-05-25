import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';

import { Mutation } from 'cbioportal-ts-api-client';
import { MyVariantInfo, VariantAnnotation } from 'genome-nexus-ts-api-client';
import {
    getMyVariantInfoAnnotation,
    IMyVariantInfoIndex,
    RemoteData,
} from 'cbioportal-utils';
import {
    ClinVar,
    clinVarSortValue,
    clinVarDownload,
    getClinVarData,
} from 'react-mutation-mapper';

export default class ClinVarColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >
    ) {
        return (
            <div data-test="clinvar-data">
                <ClinVar
                    mutation={data[0]}
                    indexedVariantAnnotations={indexedVariantAnnotations}
                />
            </div>
        );
    }

    public static getData(
        data: Mutation[],
        indexedMyVariantInfoAnnotations?: RemoteData<
            IMyVariantInfoIndex | undefined
        >
    ): MyVariantInfo | undefined {
        return getMyVariantInfoAnnotation(
            data[0],
            indexedMyVariantInfoAnnotations
                ? indexedMyVariantInfoAnnotations.result
                : undefined
        );
    }

    public static download(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >
    ): string {
        return clinVarDownload(
            getClinVarData(data[0], indexedVariantAnnotations)
        );
    }

    public static getSortValue(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >
    ): string | null {
        return clinVarSortValue(
            getClinVarData(data[0], indexedVariantAnnotations)
        );
    }
}
