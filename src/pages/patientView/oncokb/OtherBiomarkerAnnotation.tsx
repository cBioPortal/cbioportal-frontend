import * as React from 'react';
import {
    OncoKB,
    OTHER_BIOMARKER_HUGO_SYMBOL,
    OtherBiomarkersQueryType,
    OTHER_BIOMARKER_NAME,
    IndicatorQueryResp,
    calculateOncoKbAvailableDataType,
} from 'oncokb-frontend-commons';
import 'oncokb-frontend-commons/dist/styles.css';

export const OtherBiomarkerAnnotation: React.FunctionComponent<{
    type: OtherBiomarkersQueryType;
    isPublicOncoKbInstance: boolean;
    annotation: IndicatorQueryResp;
}> = props => {
    return (
        <span className="clinical-spans" style={{ display: 'inline-flex' }}>
            {OTHER_BIOMARKER_NAME[props.type]}
            <span
                style={{
                    marginLeft: 2,
                }}
            >
                <OncoKB
                    usingPublicOncoKbInstance={props.isPublicOncoKbInstance}
                    isCancerGene={true}
                    geneNotExist={false}
                    hugoGeneSymbol={OTHER_BIOMARKER_HUGO_SYMBOL}
                    status={'complete'}
                    availableDataTypes={calculateOncoKbAvailableDataType([
                        props.annotation,
                    ])}
                    indicator={props.annotation}
                />
            </span>
        </span>
    );
};
