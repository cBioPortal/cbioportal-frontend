import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import SampleManager from 'pages/patientView/SampleManager';
import styles from 'shared/components/mutationTable/column/ascnCopyNumber/ascnCopyNumber.module.scss';

export const ExpectedAltCopiesElementTooltip: React.FunctionComponent<{
    sampleId: string;
    totalCopyNumberValue: string;
    expectedAltCopiesValue: string;
    sampleManager?: SampleManager | null;
}> = props => {
    return (
        <span data-test="eac-tooltip">
            {props.sampleManager ? (
                <span>
                    {props.sampleManager.getComponentForSample(
                        props.sampleId,
                        1,
                        ''
                    )}{' '}
                </span>
            ) : null}
            {props.expectedAltCopiesValue === 'INDETERMINATE' ? (
                <span>{'Indeterminate sample'}</span>
            ) : (
                <span>
                    {` ${props.expectedAltCopiesValue} out of ${props.totalCopyNumberValue} copies of this gene are mutated.`}
                </span>
            )}
        </span>
    );
};

// the number of mutant copies as plain text, '-' when indeterminate
const MutantIntegerCopyNumberValue: React.FunctionComponent<{
    expectedAltCopiesValue: string;
}> = props => {
    if (props.expectedAltCopiesValue === 'NA') {
        return null;
    }
    return (
        <span className={styles.value} data-test="eac-value">
            <span className={styles.number}>
                {props.expectedAltCopiesValue === 'INDETERMINATE'
                    ? '-'
                    : props.expectedAltCopiesValue}
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
    return props.expectedAltCopiesValue === 'NA' ? (
        <span>
            <MutantIntegerCopyNumberValue
                expectedAltCopiesValue={props.expectedAltCopiesValue}
            />
        </span>
    ) : (
        <DefaultTooltip
            overlay={<ExpectedAltCopiesElementTooltip {...props} />}
            placement="left"
        >
            <span>
                <MutantIntegerCopyNumberValue
                    expectedAltCopiesValue={props.expectedAltCopiesValue}
                />
            </span>
        </DefaultTooltip>
    );
};

export default ExpectedAltCopiesElement;
