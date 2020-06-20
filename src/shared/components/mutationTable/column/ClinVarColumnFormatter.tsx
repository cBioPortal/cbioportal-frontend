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
} from 'react-mutation-mapper';

import generalStyles from './styles.module.scss';

export default class ClinVarColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        indexedMyVariantInfoAnnotations?: RemoteData<
            IMyVariantInfoIndex | undefined
        >
    ) {
        return (
            <div data-test="clinvar-data">
                <ClinVar
                    className={generalStyles['integer-data']}
                    mutation={data[0]}
                    indexedVariantAnnotations={indexedVariantAnnotations}
                    indexedMyVariantInfoAnnotations={
                        indexedMyVariantInfoAnnotations
                    }
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
        indexedMyVariantInfoAnnotations?: RemoteData<
            IMyVariantInfoIndex | undefined
        >
    ): string {
        const myVariantInfo = ClinVarColumnFormatter.getData(
            data,
            indexedMyVariantInfoAnnotations
        );

        return clinVarDownload(myVariantInfo);
    }

    public static getSortValue(
        data: Mutation[],
        indexedMyVariantInfoAnnotations?: RemoteData<
            IMyVariantInfoIndex | undefined
        >
    ): number | null {
        const myVariantInfo = ClinVarColumnFormatter.getData(
            data,
            indexedMyVariantInfoAnnotations
        );

        return clinVarSortValue(myVariantInfo);
    }
}
