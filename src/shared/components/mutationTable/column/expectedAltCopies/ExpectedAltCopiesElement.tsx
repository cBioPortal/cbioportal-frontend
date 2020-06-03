import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import SampleManager from 'pages/patientView/SampleManager';

export const ExpectedAltCopiesElementTooltip: React.FunctionComponent<{
    sampleId: string;
    totalCopyNumberValue: string;
    expectedAltCopiesValue: string;
    sampleManager?: SampleManager | null;
}> = props => {
    return (
        <span>
            {props.sampleManager ? (
                <span>
                    {props.sampleManager.getComponentForSample(
                        props.sampleId,
                        1,
                        ''
                    )}{' '}
                </span>
            ) : null}
            <span>
                {` ${props.expectedAltCopiesValue} out of ${props.totalCopyNumberValue} copies of this gene are mutated.`}
            </span>
        </span>
    );
};

const ExpectedAltCopiesElement: React.FunctionComponent<{
    sampleId: string;
    totalCopyNumberValue: string;
    expectedAltCopiesValue: string;
    sampleManager?: SampleManager | null;
}> = props => {
    return (
        <DefaultTooltip
            overlay={<ExpectedAltCopiesElementTooltip {...props} />}
            placement="left"
        >
            <span>
                {props.expectedAltCopiesValue}/{props.totalCopyNumberValue}
            </span>
        </DefaultTooltip>
    );
};

export default ExpectedAltCopiesElement;
