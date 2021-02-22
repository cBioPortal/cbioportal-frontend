import { MyVariantInfo } from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';

import { defaultSortMethod } from 'cbioportal-utils';
import ClinVarSummary, {
    formatClinicalSignificanceText,
    getRcvCountMap,
    getRcvData,
} from '../clinvar/ClinVarSummary';
import {
    MyVariantInfoProps,
    renderMyVariantInfoContent,
} from './MyVariantInfoHelper';

export function download(myVariantInfo?: MyVariantInfo): string {
    const value = sortValue(myVariantInfo);

    return value ? value.toString() : '';
}

export function sortValue(myVariantInfo?: MyVariantInfo): string | null {
    const rcvData =
        myVariantInfo && myVariantInfo.clinVar
            ? getRcvData(getRcvCountMap(myVariantInfo.clinVar))
            : undefined;

    return rcvData ? formatClinicalSignificanceText(rcvData) : null;
}

export function clinVarSortMethod(a: MyVariantInfo, b: MyVariantInfo) {
    return defaultSortMethod(sortValue(a), sortValue(b));
}

const ClinVar: React.FunctionComponent<MyVariantInfoProps> = observer(props => {
    return renderMyVariantInfoContent(props, (myVariantInfo: MyVariantInfo) => (
        <ClinVarSummary myVariantInfo={myVariantInfo} />
    ));
});

export default ClinVar;
