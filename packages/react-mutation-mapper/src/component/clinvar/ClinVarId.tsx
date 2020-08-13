import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { getClinVarId } from 'cbioportal-utils';
import { MyVariantInfo } from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';

export type ClinVarIdProps = {
    myVariantInfo?: MyVariantInfo;
};

@observer
export default class ClinVarId extends React.Component<ClinVarIdProps, {}> {
    public render() {
        const clinVarId = getClinVarId(this.props.myVariantInfo);

        if (clinVarId == null) {
            return (
                <DefaultTooltip
                    placement="topRight"
                    overlay={<span>Variant has no ClinVar data.</span>}
                >
                    <span
                        style={{
                            height: '100%',
                            width: '100%',
                            display: 'block',
                            overflow: 'hidden',
                        }}
                    >
                        &nbsp;
                    </span>
                </DefaultTooltip>
            );
        } else {
            const clinVarLink = `https://www.ncbi.nlm.nih.gov/clinvar/variation/${clinVarId}/`;

            return (
                <DefaultTooltip
                    placement="top"
                    overlay={
                        <span>Click to see variant on ClinVar website.</span>
                    }
                >
                    <a href={clinVarLink} target="_blank">
                        {clinVarId}
                    </a>
                </DefaultTooltip>
            );
        }
    }
}
