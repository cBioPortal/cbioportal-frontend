import * as React from 'react';
import SampleManager from 'pages/patientView/SampleManager';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import styles from './ascnCopyNumber.module.scss';

export enum ASCNCopyNumberValueEnum {
    WGD = 'WGD',
    NA = 'NA',
    INDETERMINATE = 'INDETERMINATE',
    AMPBALANCED = 'Amp (Balanced)',
    AMPLOH = 'Amp (LOH)',
    AMP = 'Amp',
    CNLOHGAIN = 'CNLOH & Gain',
    CNLOHAFTER = 'CNLOH After',
    CNLOHBEFOREGAIN = 'CNLOH Before & Gain',
    CNLOHBEFORELOSS = 'CNLOH Before & Loss',
    CNLOHBEFORE = 'CNLOH Before',
    CNLOH = 'CNLOH',
    DIPLOID = 'Diploid',
    DOUBLELOSSAFTER = 'Double Loss After',
    GAIN = 'Gain',
    HETLOSS = 'Hetloss',
    HOMDEL = 'Homdel',
    LOSSGAIN = 'Loss & Gain',
    LOSSAFTER = 'Loss After',
    LOSSBEFOREAFTER = 'Loss Before & After',
    LOSSBEFORE = 'Loss Before',
    TETRAPLOID = 'Tetraploid',
}

const ASCNCallTable: { [key: string]: string } = {
    'no WGD,0,0': ASCNCopyNumberValueEnum.HOMDEL,
    'no WGD,1,0': ASCNCopyNumberValueEnum.HETLOSS,
    'no WGD,2,0': ASCNCopyNumberValueEnum.CNLOH,
    'no WGD,3,0': ASCNCopyNumberValueEnum.CNLOHGAIN,
    'no WGD,4,0': ASCNCopyNumberValueEnum.CNLOHGAIN,
    'no WGD,5,0': ASCNCopyNumberValueEnum.AMPLOH,
    'no WGD,6,0': ASCNCopyNumberValueEnum.AMPLOH,
    'no WGD,1,1': ASCNCopyNumberValueEnum.DIPLOID,
    'no WGD,2,1': ASCNCopyNumberValueEnum.GAIN,
    'no WGD,3,1': ASCNCopyNumberValueEnum.GAIN,
    'no WGD,4,1': ASCNCopyNumberValueEnum.AMP,
    'no WGD,5,1': ASCNCopyNumberValueEnum.AMP,
    'no WGD,6,1': ASCNCopyNumberValueEnum.AMP,
    'no WGD,2,2': ASCNCopyNumberValueEnum.TETRAPLOID,
    'no WGD,3,2': ASCNCopyNumberValueEnum.AMP,
    'no WGD,4,2': ASCNCopyNumberValueEnum.AMP,
    'no WGD,5,2': ASCNCopyNumberValueEnum.AMP,
    'no WGD,6,2': ASCNCopyNumberValueEnum.AMP,
    'no WGD,3,3': ASCNCopyNumberValueEnum.AMPBALANCED,
    'no WGD,4,3': ASCNCopyNumberValueEnum.AMP,
    'no WGD,5,3': ASCNCopyNumberValueEnum.AMP,
    'no WGD,6,3': ASCNCopyNumberValueEnum.AMP,
    'WGD,0,0': ASCNCopyNumberValueEnum.HOMDEL,
    'WGD,1,0': ASCNCopyNumberValueEnum.LOSSBEFOREAFTER,
    'WGD,2,0': ASCNCopyNumberValueEnum.LOSSBEFORE,
    'WGD,3,0': ASCNCopyNumberValueEnum.CNLOHBEFORELOSS,
    'WGD,4,0': ASCNCopyNumberValueEnum.CNLOHBEFORE,
    'WGD,5,0': ASCNCopyNumberValueEnum.CNLOHBEFOREGAIN,
    'WGD,6,0': ASCNCopyNumberValueEnum.AMPLOH,
    'WGD,1,1': ASCNCopyNumberValueEnum.DOUBLELOSSAFTER,
    'WGD,2,1': ASCNCopyNumberValueEnum.LOSSAFTER,
    'WGD,3,1': ASCNCopyNumberValueEnum.CNLOHAFTER,
    'WGD,4,1': ASCNCopyNumberValueEnum.LOSSGAIN,
    'WGD,5,1': ASCNCopyNumberValueEnum.AMP,
    'WGD,6,1': ASCNCopyNumberValueEnum.AMP,
    'WGD,2,2': ASCNCopyNumberValueEnum.TETRAPLOID,
    'WGD,3,2': ASCNCopyNumberValueEnum.GAIN,
    'WGD,4,2': ASCNCopyNumberValueEnum.AMP,
    'WGD,5,2': ASCNCopyNumberValueEnum.AMP,
    'WGD,6,2': ASCNCopyNumberValueEnum.AMP,
    'WGD,3,3': ASCNCopyNumberValueEnum.AMPBALANCED,
    'WGD,4,3': ASCNCopyNumberValueEnum.AMP,
    'WGD,5,3': ASCNCopyNumberValueEnum.AMP,
    'WGD,6,3': ASCNCopyNumberValueEnum.AMP,
};

function getASCNCopyNumberCall(
    wgdValue: string,
    totalCopyNumberValue: string,
    minorCopyNumberValue: string
) {
    const majorCopyNumberValue: string = (
        Number(totalCopyNumberValue) - Number(minorCopyNumberValue)
    ).toString();
    const key: string = [
        wgdValue,
        majorCopyNumberValue,
        minorCopyNumberValue,
    ].join(',');
    return key in ASCNCallTable
        ? ASCNCallTable[key].toLowerCase()
        : ASCNCopyNumberValueEnum.NA;
}

export const ASCNCopyNumberElementTooltip: React.FunctionComponent<{
    sampleId: string;
    wgdValue: string;
    totalCopyNumberValue: string;
    minorCopyNumberValue: string;
    ascnCopyNumberValue: string;
    sampleManager?: SampleManager | null;
}> = props => {
    const ascnCopyNumberCall: string = getASCNCopyNumberCall(
        props.wgdValue,
        props.totalCopyNumberValue,
        props.minorCopyNumberValue
    );
    return (
        <span data-test="ascn-copy-number-tooltip">
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
                {ascnCopyNumberCall !== ASCNCopyNumberValueEnum.NA ? (
                    <span>
                        <b>{ascnCopyNumberCall}</b>
                        {` (${props.wgdValue} with total copy number of ${props.totalCopyNumberValue} and a minor copy number of ${props.minorCopyNumberValue})`}
                    </span>
                ) : (
                    <span>{'Indeterminate sample'}</span>
                )}
            </span>
        </span>
    );
};

// the total copy number as plain text, followed by a WGD tag for samples with
// whole genome doubling
const ASCNCopyNumberValue: React.FunctionComponent<{
    wgdValue: string;
    totalCopyNumberValue: string;
}> = props => (
    <span className={styles.value} data-test="ascn-copy-number-value">
        <span className={styles.number}>
            {props.totalCopyNumberValue === 'INDETERMINATE'
                ? '-'
                : props.totalCopyNumberValue}
        </span>
        {props.wgdValue === ASCNCopyNumberValueEnum.WGD && (
            <span className={styles.wgd}>WGD</span>
        )}
    </span>
);

// shows the total copy number as long as it and the WGD status are not "NA"
// this does not enforce any limits on possible numerical values (e.g bad data such as tcn=99 would show up as 99 in the portal)
const ASCNCopyNumberElement: React.FunctionComponent<{
    sampleId: string;
    wgdValue: string;
    totalCopyNumberValue: string;
    minorCopyNumberValue: string;
    ascnCopyNumberValue: string;
    sampleManager?: SampleManager | null;
}> = props => {
    const hasAllRequiredValues: boolean =
        props.totalCopyNumberValue !== ASCNCopyNumberValueEnum.NA &&
        props.wgdValue !== ASCNCopyNumberValueEnum.NA;

    if (hasAllRequiredValues) {
        return (
            <DefaultTooltip
                overlay={<ASCNCopyNumberElementTooltip {...props} />}
                placement="left"
            >
                <span>
                    <ASCNCopyNumberValue
                        wgdValue={props.wgdValue}
                        totalCopyNumberValue={props.totalCopyNumberValue}
                    />
                </span>
            </DefaultTooltip>
        );
    } else {
        return null;
    }
};

export default ASCNCopyNumberElement;
