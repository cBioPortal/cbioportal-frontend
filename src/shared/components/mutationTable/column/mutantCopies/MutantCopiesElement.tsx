import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import SampleManager from 'pages/patientView/SampleManager';

const MutantCopiesElementTooltip: React.FunctionComponent<{
    sampleId: string;
    totalCopyNumberValue: string;
    mutantCopiesValue: string;
    sampleManager?: SampleManager;
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
                {' '}
                {props.mutantCopiesValue} out of {props.totalCopyNumberValue}{' '}
                copies of this gene are mutated.
            </span>
        </span>
    );
};

const MutantCopiesElement: React.FunctionComponent<{
    sampleId: string;
    totalCopyNumberValue: string;
    mutantCopiesValue: string;
    sampleManager?: SampleManager;
}> = props => {
    return (
        <DefaultTooltip
            overlay={<MutantCopiesElementTooltip {...props} />}
            placement="left"
        >
            <span>
                {props.mutantCopiesValue}/{props.totalCopyNumberValue}
            </span>
        </DefaultTooltip>
    );
};

export default MutantCopiesElement;
