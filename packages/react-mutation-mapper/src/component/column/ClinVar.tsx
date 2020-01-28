import autobind from 'autobind-decorator';
import { MyVariantInfo } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import * as React from 'react';

import { defaultSortMethod } from '../../util/ReactTableUtils';
import ClinVarId, { getClinVarId } from '../clinvar/ClinVarId';
import {
    MyVariantInfoProps,
    renderMyVariantInfoContent,
} from './MyVariantInfoHelper';

export function sortValue(myVariantInfo?: MyVariantInfo): number | null {
    const id = getClinVarId(myVariantInfo);

    return id ? parseInt(id, 10) : null;
}

export function clinVarSortMethod(a: MyVariantInfo, b: MyVariantInfo) {
    return defaultSortMethod(sortValue(a), sortValue(b));
}

@observer
export default class ClinVar extends React.Component<MyVariantInfoProps, {}> {
    public static defaultProps: Partial<MyVariantInfoProps> = {
        className: 'pull-right mr-1',
    };

    public render() {
        return renderMyVariantInfoContent(this.props, this.getContent);
    }

    @autobind
    public getContent(myVariantInfo: MyVariantInfo) {
        return <ClinVarId myVariantInfo={myVariantInfo} />;
    }
}
