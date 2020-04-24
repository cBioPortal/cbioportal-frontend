import autobind from 'autobind-decorator';
import { getMyVariantInfoAnnotation, Mutation } from 'cbioportal-utils';
import { MyVariantInfo, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';

import { RemoteData } from '../../model/RemoteData';
import { defaultSortMethod } from '../../util/ReactTableUtils';
import GnomadFrequency, {
    calculateAlleleFrequency,
} from '../gnomad/GnomadFrequency';
import {
    MyVariantInfoProps,
    renderMyVariantInfoContent,
} from './MyVariantInfoHelper';

export function getMyVariantInfoData(
    mutation?: Mutation,
    indexedMyVariantInfoAnnotations?: RemoteData<
        { [genomicLocation: string]: MyVariantInfo } | undefined
    >
) {
    return getMyVariantInfoAnnotation(
        mutation,
        indexedMyVariantInfoAnnotations
            ? indexedMyVariantInfoAnnotations.result
            : undefined
    );
}

export function sortValue(myVariantInfo?: MyVariantInfo): number | null {
    // If has both gnomadExome and gnomadGenome, sort by the total frequency
    if (
        myVariantInfo &&
        myVariantInfo.gnomadExome &&
        myVariantInfo.gnomadGenome
    ) {
        return calculateAlleleFrequency(
            myVariantInfo.gnomadExome.alleleCount.ac +
                myVariantInfo.gnomadGenome.alleleCount.ac,
            myVariantInfo.gnomadExome.alleleNumber.an +
                myVariantInfo.gnomadGenome.alleleFrequency.af,
            null
        );
    }

    // If only has gnomadExome, sort by gnomadExome frequency
    if (myVariantInfo && myVariantInfo.gnomadExome) {
        return calculateAlleleFrequency(
            myVariantInfo.gnomadExome.alleleCount.ac,
            myVariantInfo.gnomadExome.alleleNumber.an,
            myVariantInfo.gnomadExome.alleleFrequency.af
        );
    }

    // If only has gnomadGenome, sort by gnomadGenome frequency
    if (myVariantInfo && myVariantInfo.gnomadGenome) {
        return calculateAlleleFrequency(
            myVariantInfo.gnomadGenome.alleleCount.ac,
            myVariantInfo.gnomadGenome.alleleNumber.an,
            myVariantInfo.gnomadGenome.alleleFrequency.af
        );
    }

    // If myVariantInfo is null, return null
    return null;
}

export function gnomadSortMethod(a: MyVariantInfo, b: MyVariantInfo) {
    return defaultSortMethod(sortValue(a), sortValue(b));
}

@observer
export default class Gnomad extends React.Component<MyVariantInfoProps, {}> {
    public static defaultProps: Partial<MyVariantInfoProps> = {
        className: 'pull-right mr-1',
    };

    public render() {
        return renderMyVariantInfoContent(this.props, this.getContent);
    }

    @autobind
    public getContent(
        myVariantInfo: MyVariantInfo,
        variantAnnotation?: VariantAnnotation
    ) {
        return (
            <GnomadFrequency
                myVariantInfo={myVariantInfo}
                annotation={variantAnnotation}
            />
        );
    }
}
